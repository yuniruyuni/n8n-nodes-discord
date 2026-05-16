import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

import {
	buildAllowedMentionsFromCollection,
	createAllowedMentionsCollectionField,
} from '../shared/allowedMentions';
import {
	buildAttachmentMetadata,
	buildDiscordMultipartBody,
	createAttachmentsCollectionField,
	type DiscordAttachmentInput,
	type DiscordMultipartFile,
} from '../shared/attachments';
import {
	DISCORD_MESSAGE_FLAG_IS_COMPONENTS_V2,
	buildButtonsActionRow,
	buildMediaGalleryComponent,
	buildMentionableSelectActionRow,
	buildSeparatorComponents,
	buildStringSelectActionRow,
	buildTextDisplayComponents,
	buildV2FileComponents,
	createButtonComponentsField,
	createComponentsJsonField,
	createMediaGalleryField,
	createMentionableSelectComponentField,
	createSeparatorComponentField,
	createStringSelectComponentField,
	createTextDisplayField,
	createV2FileComponentField,
	hasV2LayoutComponents,
	validateComponents,
	validateV2Components,
	type DiscordComponent,
} from '../shared/components';
import { buildEmbedsFromCollection, createEmbedsCollectionField } from '../shared/embeds';
import { parseOptionalJsonField } from '../shared/messagePayload';

// Guided builders (buttonRow / stringSelect / mentionableSelect) compose the
// action rows first; entries from the raw JSON `components` field are then
// appended afterwards as an escape hatch for v2 layout / shapes the builders
// don't cover.

type MessagePayload = IDataObject;

function readAttachmentInputs(raw: unknown): DiscordAttachmentInput[] {
	if (!raw || typeof raw !== 'object') {
		return [];
	}
	const collection = (raw as IDataObject).attachment;
	if (!Array.isArray(collection)) {
		return [];
	}
	return collection
		.map((entry): DiscordAttachmentInput | undefined => {
			if (!entry || typeof entry !== 'object') {
				return undefined;
			}
			const record = entry as IDataObject;
			const binaryPropertyName =
				typeof record.binaryPropertyName === 'string' ? record.binaryPropertyName.trim() : '';
			if (binaryPropertyName === '') {
				return undefined;
			}
			const input: DiscordAttachmentInput = { binaryPropertyName };
			if (typeof record.filename === 'string' && record.filename.trim() !== '') {
				input.filename = record.filename.trim();
			}
			if (typeof record.description === 'string' && record.description.trim() !== '') {
				input.description = record.description.trim();
			}
			if (typeof record.contentType === 'string' && record.contentType.trim() !== '') {
				input.contentType = record.contentType.trim();
			}
			return input;
		})
		.filter((entry): entry is DiscordAttachmentInput => entry !== undefined);
}

function buildPayloadFromParameters(ctx: IExecuteSingleFunctions): {
	payload: MessagePayload;
	attachmentInputs: DiscordAttachmentInput[];
} {
	const payload: MessagePayload = {};

	const content = ctx.getNodeParameter('content', '') as string;
	if (typeof content === 'string' && content !== '') {
		payload.content = content;
	}

	const embedsRaw = ctx.getNodeParameter('embeds', {}) as unknown;
	const embeds = buildEmbedsFromCollection(embedsRaw);
	if (embeds.length > 0) {
		payload.embeds = embeds as unknown as IDataObject[];
	}

	const rows: DiscordComponent[] = [];

	const buttonRowRaw = ctx.getNodeParameter('buttonRow', {}) as unknown;
	rows.push(...buildButtonsActionRow(buttonRowRaw));

	const stringSelectRaw = ctx.getNodeParameter('stringSelect', {}) as unknown;
	rows.push(...buildStringSelectActionRow(stringSelectRaw));

	const mentionableSelectRaw = ctx.getNodeParameter('mentionableSelect', {}) as unknown;
	rows.push(...buildMentionableSelectActionRow(mentionableSelectRaw));

	// Raw JSON entries are appended after the guided rows so they act as an
	// escape hatch / extension (e.g. v2 layout) rather than overriding the GUI.
	const componentsRaw = ctx.getNodeParameter('components', '') as unknown;
	const components = parseOptionalJsonField<IDataObject[]>(componentsRaw, 'Components');
	if (Array.isArray(components) && components.length > 0) {
		rows.push(...(components as unknown as DiscordComponent[]));
	}

	const textDisplaysRaw = ctx.getNodeParameter('textDisplays', {}) as unknown;
	rows.push(...buildTextDisplayComponents(textDisplaysRaw));

	const separatorsRaw = ctx.getNodeParameter('separators', {}) as unknown;
	rows.push(...buildSeparatorComponents(separatorsRaw));

	const mediaGalleryRaw = ctx.getNodeParameter('mediaGallery', {}) as unknown;
	const mediaGallery = buildMediaGalleryComponent(mediaGalleryRaw);
	if (mediaGallery !== undefined) {
		rows.push(mediaGallery);
	}

	const v2FilesRaw = ctx.getNodeParameter('v2Files', {}) as unknown;
	rows.push(...buildV2FileComponents(v2FilesRaw));

	if (rows.length > 0) {
		validateComponents(rows);
		validateV2Components(rows);
		payload.components = rows as unknown as IDataObject[];
	}

	const allowedMentionsRaw = ctx.getNodeParameter('allowedMentions', {}) as unknown;
	const allowedMentions = buildAllowedMentionsFromCollection(allowedMentionsRaw);
	if (allowedMentions !== undefined) {
		payload.allowed_mentions = allowedMentions as unknown as IDataObject;
	}

	const flagsRaw = ctx.getNodeParameter('flags', []) as unknown;
	let flags = combineFlags(flagsRaw);
	// Auto-OR the IS_COMPONENTS_V2 flag when any v2 layout component is present;
	// preserves any flags the user explicitly selected.
	if (rows.length > 0 && hasV2LayoutComponents(rows)) {
		flags = (flags ?? 0) | DISCORD_MESSAGE_FLAG_IS_COMPONENTS_V2;
	}
	if (flags !== undefined) {
		payload.flags = flags;
	}

	const messageReferenceRaw = ctx.getNodeParameter('messageReference', '') as unknown;
	const messageReference = parseOptionalJsonField<IDataObject>(messageReferenceRaw, 'Message Reference');
	if (messageReference !== undefined) {
		payload.message_reference = messageReference;
	}

	const nonce = ctx.getNodeParameter('nonce', '') as string;
	if (typeof nonce === 'string' && nonce !== '') {
		payload.nonce = nonce;
	}

	const tts = ctx.getNodeParameter('tts', false) as boolean;
	if (tts === true) {
		payload.tts = true;
	}

	const attachmentsRaw = ctx.getNodeParameter('attachments', {}) as unknown;
	const attachmentInputs = readAttachmentInputs(attachmentsRaw);
	if (attachmentInputs.length > 0) {
		payload.attachments = buildAttachmentMetadata(attachmentInputs) as unknown as IDataObject[];
	}

	return { payload, attachmentInputs };
}

function combineFlags(value: unknown): number | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	if (Array.isArray(value)) {
		let combined = 0;
		for (const entry of value) {
			const numeric = typeof entry === 'number' ? entry : Number(entry);
			if (Number.isFinite(numeric)) {
				combined |= numeric;
			}
		}
		return combined === 0 ? undefined : combined;
	}
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : undefined;
}

// preSend fork: build the JSON body for content/embeds/components/allowed_mentions/flags/etc.
// If any attachments are configured we switch to multipart (payload_json + files[N]); otherwise
// the request is sent as plain JSON.
export async function presendMessageWithOptionalAttachments(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const { payload, attachmentInputs } = buildPayloadFromParameters(this);

	if (attachmentInputs.length === 0) {
		const headers = { ...(requestOptions.headers ?? {}) };
		(headers as Record<string, string>)['Content-Type'] = 'application/json';
		return {
			...requestOptions,
			body: payload,
			json: true,
			headers,
		};
	}

	const files: DiscordMultipartFile[] = [];
	for (const input of attachmentInputs) {
		const binaryData = this.helpers.assertBinaryData(input.binaryPropertyName);
		const buffer = await this.helpers.getBinaryDataBuffer(input.binaryPropertyName);
		files.push({
			name: input.filename ?? binaryData.fileName ?? input.binaryPropertyName,
			data: buffer,
			contentType: input.contentType ?? binaryData.mimeType,
		});
	}

	const multipart = buildDiscordMultipartBody({
		payloadJson: payload as IDataObject,
		files,
	});

	return {
		...requestOptions,
		body: multipart.body,
		headers: {
			...(requestOptions.headers ?? {}),
			...multipart.headers,
		},
	};
}

export const messageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['message'],
			},
		},
		options: [
			{
				name: 'Send',
				value: 'send',
				action: 'Send',
				routing: {
					send: {
						preSend: [presendMessageWithOptionalAttachments],
					},
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/messages',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}',
					},
				},
			},
			{
				name: 'List',
				value: 'list',
				action: 'List',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/messages',
					},
				},
			},
			{
				name: 'Edit',
				value: 'edit',
				action: 'Edit',
				routing: {
					send: {
						preSend: [presendMessageWithOptionalAttachments],
					},
					request: {
						method: 'PATCH',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}',
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}',
					},
					output: {
						postReceive: [
							{
								type: 'set',
								properties: {
									value: '={{ { "success": true } }}',
								},
							},
						],
					},
				},
			},
			{
				name: 'Bulk Delete',
				value: 'bulkDelete',
				action: 'Bulk delete',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/messages/bulk-delete',
						body: {
							messages:
								'={{ ($parameter.messageIds || "").split(",").map(id => id.trim()).filter(id => id.length > 0) }}',
						},
					},
					output: {
						postReceive: [
							{
								type: 'set',
								properties: {
									value: '={{ { "success": true } }}',
								},
							},
						],
					},
				},
			},
			{
				name: 'Crosspost',
				value: 'crosspost',
				action: 'Crosspost',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}/crosspost',
					},
				},
			},
		],
		default: 'send',
	},
];

const channelField: INodeProperties = {
	displayName: 'Channel',
	name: 'channelId',
	type: 'string',
	default: '',
	required: true,
	placeholder: 'e.g. 123456789012345678',
	displayOptions: {
		show: {
			resource: ['message'],
		},
	},
	description: 'Channel ID. Discord snowflake ID of the channel.',
};

const writeOperations = ['send', 'edit'];

const flagOptions = [
	{ name: 'Suppress Embeds', value: 1 << 2, description: 'Do not include any embeds when serializing this message' },
	{
		name: 'Suppress Notifications',
		value: 1 << 12,
		description: 'This message will not trigger push and desktop notifications',
	},
	{ name: 'Is Components V2', value: 1 << 15, description: 'Message uses the v2 components layout' },
];

export const messageFields: INodeProperties[] = [
	channelField,
	{
		displayName: 'Message',
		name: 'messageId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['get', 'delete', 'edit', 'crosspost'],
			},
		},
		description: 'Message ID. Discord snowflake ID of the message.',
	},
	{
		displayName: 'Message IDs',
		name: 'messageIds',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['bulkDelete'],
			},
		},
		placeholder: '123456789012345678, 234567890123456789',
		description:
			'Comma-separated Discord message snowflake IDs to delete. Discord requires between 2 and 100 IDs, no older than 14 days.',
	},
	{
		displayName: 'Around',
		name: 'around',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['list'],
			},
		},
		description: 'Return messages around this snowflake ID',
		routing: {
			request: {
				qs: {
					around: '={{$parameter.around || undefined}}',
				},
			},
		},
	},
	{
		displayName: 'Before',
		name: 'before',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['list'],
			},
		},
		description: 'Return messages before this snowflake ID',
		routing: {
			request: {
				qs: {
					before: '={{$parameter.before || undefined}}',
				},
			},
		},
	},
	{
		displayName: 'After',
		name: 'after',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['list'],
			},
		},
		description: 'Return messages after this snowflake ID',
		routing: {
			request: {
				qs: {
					after: '={{$parameter.after || undefined}}',
				},
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['list'],
			},
		},
		description: 'Max number of results to return',
		routing: {
			request: {
				qs: {
					limit: '={{$parameter.limit}}',
				},
			},
		},
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
		description:
			'Message content to send. Required unless embeds, components, or attachments are provided.',
	},
	createEmbedsCollectionField({
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
	}),
	createButtonComponentsField({
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
		name: 'buttonRow',
	}),
	createStringSelectComponentField({
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
		name: 'stringSelect',
	}),
	createMentionableSelectComponentField({
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
		name: 'mentionableSelect',
	}),
	createComponentsJsonField({
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
	}),
	createTextDisplayField({
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
	}),
	createSeparatorComponentField({
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
	}),
	createMediaGalleryField({
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
	}),
	createV2FileComponentField({
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
	}),
	createAttachmentsCollectionField({
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
	}),
	createAllowedMentionsCollectionField({
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
	}),
	{
		displayName: 'Flags',
		name: 'flags',
		type: 'multiOptions',
		default: [],
		options: flagOptions,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
		description:
			'Bitwise message flags. Selected entries are OR-combined. Supports Suppress Embeds (1<<2), Suppress Notifications (1<<12), and Is Components V2 (1<<15).',
	},
	{
		displayName: 'Message Reference',
		name: 'messageReference',
		type: 'json',
		default: '',
		placeholder: '{"message_id":"...","channel_id":"...","type":0}',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
		description:
			'Raw Discord message_reference JSON object. Used for replies (type 0) and forwards (type 1).',
	},
	{
		displayName: 'Nonce',
		name: 'nonce',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
		description: 'Optional nonce used by Discord to dedupe messages (max 25 characters)',
	},
	{
		displayName: 'TTS',
		name: 'tts',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: writeOperations,
			},
		},
		description: 'Whether the message should be sent as a text-to-speech message',
	},
];

