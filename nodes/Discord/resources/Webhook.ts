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
import { createAuditLogReasonField } from '../shared/auditLog';
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
import { parseCommaSeparated } from '../shared/validators';

// Read an attachments collection parameter into the normalized DiscordAttachmentInput list.
function readAttachmentInputs(this: IExecuteSingleFunctions): DiscordAttachmentInput[] {
	const raw = this.getNodeParameter('attachments', {}) as IDataObject;
	const collection = raw?.attachment;
	if (!Array.isArray(collection)) {
		return [];
	}

	return collection
		.map((entry) => {
			if (!entry || typeof entry !== 'object') {
				return undefined;
			}
			const record = entry as IDataObject;
			const binaryPropertyName =
				typeof record.binaryPropertyName === 'string' ? record.binaryPropertyName : '';
			if (binaryPropertyName === '') {
				return undefined;
			}
			const input: DiscordAttachmentInput = { binaryPropertyName };
			if (typeof record.filename === 'string' && record.filename !== '') {
				input.filename = record.filename;
			}
			if (typeof record.description === 'string' && record.description !== '') {
				input.description = record.description;
			}
			if (typeof record.contentType === 'string' && record.contentType !== '') {
				input.contentType = record.contentType;
			}
			return input;
		})
		.filter((entry): entry is DiscordAttachmentInput => entry !== undefined);
}

async function loadAttachmentFiles(
	context: IExecuteSingleFunctions,
	inputs: DiscordAttachmentInput[],
): Promise<DiscordMultipartFile[]> {
	const files: DiscordMultipartFile[] = [];
	for (const input of inputs) {
		const binaryData = context.helpers.assertBinaryData(input.binaryPropertyName);
		const buffer = await context.helpers.getBinaryDataBuffer(input.binaryPropertyName);
		files.push({
			name: input.filename ?? binaryData.fileName ?? input.binaryPropertyName,
			data: buffer,
			contentType: input.contentType ?? binaryData.mimeType,
		});
	}
	return files;
}

function readOptionalString(context: IExecuteSingleFunctions, name: string): string | undefined {
	const value = context.getNodeParameter(name, '') as unknown;
	if (typeof value !== 'string') {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed === '' ? undefined : trimmed;
}

function readOptionalNumber(context: IExecuteSingleFunctions, name: string): number | undefined {
	const value = context.getNodeParameter(name, '') as unknown;
	if (value === '' || value === undefined || value === null) {
		return undefined;
	}
	const numeric = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(numeric) ? numeric : undefined;
}

function readOptionalBoolean(context: IExecuteSingleFunctions, name: string): boolean | undefined {
	const value = context.getNodeParameter(name, false) as unknown;
	return typeof value === 'boolean' ? value : undefined;
}

function readSnowflakeArray(context: IExecuteSingleFunctions, name: string): string[] | undefined {
	const value = context.getNodeParameter(name, '') as unknown;
	if (typeof value !== 'string' || value.trim() === '') {
		return undefined;
	}
	const entries = parseCommaSeparated(value);
	return entries.length > 0 ? entries : undefined;
}

function buildExecutePayload(context: IExecuteSingleFunctions): {
	payload: IDataObject;
	attachments: DiscordAttachmentInput[];
} {
	const payload: IDataObject = {};

	const content = readOptionalString(context, 'content');
	if (content !== undefined) {
		payload.content = content;
	}

	const username = readOptionalString(context, 'username');
	if (username !== undefined) {
		payload.username = username;
	}

	const avatarUrl = readOptionalString(context, 'avatarUrl');
	if (avatarUrl !== undefined) {
		payload.avatar_url = avatarUrl;
	}

	const tts = readOptionalBoolean(context, 'tts');
	if (tts) {
		payload.tts = true;
	}

	const userFlags = readOptionalNumber(context, 'flags');

	const threadName = readOptionalString(context, 'threadName');
	if (threadName !== undefined) {
		payload.thread_name = threadName;
	}

	const appliedTags = readSnowflakeArray(context, 'appliedTags');
	if (appliedTags !== undefined) {
		payload.applied_tags = appliedTags;
	}

	const embedsValue = context.getNodeParameter('embeds', {}) as unknown;
	const embeds = buildEmbedsFromCollection(embedsValue);
	if (embeds.length > 0) {
		payload.embeds = embeds;
	}

	// Guided builders compose action rows first; raw JSON `components` is then
	// appended as an escape hatch (e.g. v2 layout) rather than overriding them.
	const rows: DiscordComponent[] = [];

	const buttonRowRaw = context.getNodeParameter('buttonRow', {}) as unknown;
	rows.push(...buildButtonsActionRow(buttonRowRaw));

	const stringSelectRaw = context.getNodeParameter('stringSelect', {}) as unknown;
	rows.push(...buildStringSelectActionRow(stringSelectRaw));

	const mentionableSelectRaw = context.getNodeParameter('mentionableSelect', {}) as unknown;
	rows.push(...buildMentionableSelectActionRow(mentionableSelectRaw));

	const componentsRaw = context.getNodeParameter('components', '') as unknown;
	const components = parseOptionalJsonField<unknown>(componentsRaw, 'Components');
	if (Array.isArray(components) && components.length > 0) {
		rows.push(...(components as DiscordComponent[]));
	}

	const textDisplaysRaw = context.getNodeParameter('textDisplays', {}) as unknown;
	rows.push(...buildTextDisplayComponents(textDisplaysRaw));

	const separatorsRaw = context.getNodeParameter('separators', {}) as unknown;
	rows.push(...buildSeparatorComponents(separatorsRaw));

	const mediaGalleryRaw = context.getNodeParameter('mediaGallery', {}) as unknown;
	const mediaGallery = buildMediaGalleryComponent(mediaGalleryRaw);
	if (mediaGallery !== undefined) {
		rows.push(mediaGallery);
	}

	const v2FilesRaw = context.getNodeParameter('v2Files', {}) as unknown;
	rows.push(...buildV2FileComponents(v2FilesRaw));

	if (rows.length > 0) {
		validateComponents(rows);
		validateV2Components(rows);
		payload.components = rows as unknown as IDataObject[];
	}

	// Auto-OR the IS_COMPONENTS_V2 flag when any v2 layout component is present;
	// preserves any flag the user explicitly set in the Flags field.
	let resolvedFlags = userFlags;
	if (rows.length > 0 && hasV2LayoutComponents(rows)) {
		resolvedFlags = (resolvedFlags ?? 0) | DISCORD_MESSAGE_FLAG_IS_COMPONENTS_V2;
	}
	if (resolvedFlags !== undefined) {
		payload.flags = resolvedFlags;
	}

	const allowedMentionsValue = context.getNodeParameter('allowedMentions', {}) as unknown;
	const allowedMentions = buildAllowedMentionsFromCollection(allowedMentionsValue);
	if (allowedMentions !== undefined) {
		payload.allowed_mentions = allowedMentions;
	}

	const pollRaw = context.getNodeParameter('poll', '') as unknown;
	const poll = parseOptionalJsonField<IDataObject>(pollRaw, 'Poll');
	if (poll !== undefined) {
		payload.poll = poll;
	}

	const attachments = readAttachmentInputs.call(context);
	if (attachments.length > 0) {
		payload.attachments = buildAttachmentMetadata(attachments);
	}

	return { payload, attachments };
}

function buildEditMessagePayload(context: IExecuteSingleFunctions): {
	payload: IDataObject;
	attachments: DiscordAttachmentInput[];
} {
	const payload: IDataObject = {};

	const content = readOptionalString(context, 'content');
	if (content !== undefined) {
		payload.content = content;
	}

	const embedsValue = context.getNodeParameter('embeds', {}) as unknown;
	const embeds = buildEmbedsFromCollection(embedsValue);
	if (embeds.length > 0) {
		payload.embeds = embeds;
	}

	// Guided builders compose action rows first; raw JSON `components` is then
	// appended as an escape hatch (e.g. v2 layout) rather than overriding them.
	const rows: DiscordComponent[] = [];

	const buttonRowRaw = context.getNodeParameter('buttonRow', {}) as unknown;
	rows.push(...buildButtonsActionRow(buttonRowRaw));

	const stringSelectRaw = context.getNodeParameter('stringSelect', {}) as unknown;
	rows.push(...buildStringSelectActionRow(stringSelectRaw));

	const mentionableSelectRaw = context.getNodeParameter('mentionableSelect', {}) as unknown;
	rows.push(...buildMentionableSelectActionRow(mentionableSelectRaw));

	const componentsRaw = context.getNodeParameter('components', '') as unknown;
	const components = parseOptionalJsonField<unknown>(componentsRaw, 'Components');
	if (Array.isArray(components) && components.length > 0) {
		rows.push(...(components as DiscordComponent[]));
	}

	const textDisplaysRaw = context.getNodeParameter('textDisplays', {}) as unknown;
	rows.push(...buildTextDisplayComponents(textDisplaysRaw));

	const separatorsRaw = context.getNodeParameter('separators', {}) as unknown;
	rows.push(...buildSeparatorComponents(separatorsRaw));

	const mediaGalleryRaw = context.getNodeParameter('mediaGallery', {}) as unknown;
	const mediaGallery = buildMediaGalleryComponent(mediaGalleryRaw);
	if (mediaGallery !== undefined) {
		rows.push(mediaGallery);
	}

	const v2FilesRaw = context.getNodeParameter('v2Files', {}) as unknown;
	rows.push(...buildV2FileComponents(v2FilesRaw));

	if (rows.length > 0) {
		validateComponents(rows);
		validateV2Components(rows);
		payload.components = rows as unknown as IDataObject[];
	}

	// Auto-OR the IS_COMPONENTS_V2 flag when v2 layout components are present.
	if (rows.length > 0 && hasV2LayoutComponents(rows)) {
		const existing = typeof payload.flags === 'number' ? payload.flags : 0;
		payload.flags = existing | DISCORD_MESSAGE_FLAG_IS_COMPONENTS_V2;
	}

	const allowedMentionsValue = context.getNodeParameter('allowedMentions', {}) as unknown;
	const allowedMentions = buildAllowedMentionsFromCollection(allowedMentionsValue);
	if (allowedMentions !== undefined) {
		payload.allowed_mentions = allowedMentions;
	}

	const attachments = readAttachmentInputs.call(context);
	if (attachments.length > 0) {
		payload.attachments = buildAttachmentMetadata(attachments);
	}

	return { payload, attachments };
}

// preSend for execute: assembles the full webhook payload and switches to multipart when files are attached.
export async function presendWebhookExecute(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const { payload, attachments } = buildExecutePayload(this);

	if (attachments.length > 0) {
		const files = await loadAttachmentFiles(this, attachments);
		const multipart = buildDiscordMultipartBody({ payloadJson: payload, files });
		return {
			...requestOptions,
			body: multipart.body,
			headers: {
				...(requestOptions.headers ?? {}),
				...multipart.headers,
			},
		};
	}

	return {
		...requestOptions,
		body: payload,
	};
}

// preSend for editMessage: same multipart switch logic but uses the edit payload shape.
export async function presendWebhookEditMessage(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const { payload, attachments } = buildEditMessagePayload(this);

	if (attachments.length > 0) {
		const files = await loadAttachmentFiles(this, attachments);
		const multipart = buildDiscordMultipartBody({ payloadJson: payload, files });
		return {
			...requestOptions,
			body: multipart.body,
			headers: {
				...(requestOptions.headers ?? {}),
				...multipart.headers,
			},
		};
	}

	return {
		...requestOptions,
		body: payload,
	};
}

const successResponse = {
	postReceive: [
		{
			type: 'set' as const,
			properties: {
				value: '={{ { "success": true } }}',
			},
		},
	],
};

const createBody =
	'={{ { name: $parameter.name, ...($parameter.avatar !== "" ? { avatar: $parameter.avatar } : {}) } }}';

const modifyBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.avatar !== "" ? { avatar: $parameter.avatar } : {}), ...($parameter.channelId !== "" ? { channel_id: $parameter.channelId } : {}) } }}';

const modifyWithTokenBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.avatar !== "" ? { avatar: $parameter.avatar } : {}) } }}';

const slackGithubBody = '={{ JSON.parse($parameter.payload || "{}") }}';

export const webhookOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a webhook in a channel',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/webhooks',
						body: createBody,
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a webhook',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/webhooks/{{$parameter.webhookId}}',
					},
					output: successResponse,
				},
			},
			{
				name: 'Delete Message',
				value: 'deleteMessage',
				action: 'Delete a webhook message',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}/messages/{{$parameter.messageId}}',
						qs: {
							thread_id: '={{$parameter.threadId || undefined}}',
						},
					},
					output: successResponse,
				},
			},
			{
				name: 'Delete With Token',
				value: 'deleteWithToken',
				action: 'Delete a webhook using its token',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}',
					},
					output: successResponse,
				},
			},
			{
				name: 'Edit Message',
				value: 'editMessage',
				action: 'Edit a webhook message',
				routing: {
					send: {
						preSend: [presendWebhookEditMessage],
					},
					request: {
						method: 'PATCH',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}/messages/{{$parameter.messageId}}',
						qs: {
							thread_id: '={{$parameter.threadId || undefined}}',
						},
					},
				},
			},
			{
				name: 'Execute',
				value: 'execute',
				action: 'Execute a webhook',
				routing: {
					send: {
						preSend: [presendWebhookExecute],
					},
					request: {
						method: 'POST',
						url: '={{$parameter.webhookUrl}}',
						qs: {
							thread_id: '={{$parameter.threadId || undefined}}',
							wait: '={{$parameter.wait}}',
						},
					},
				},
			},
			{
				name: 'Execute GitHub',
				value: 'executeGithub',
				action: 'Execute a webhook with a github payload',
				routing: {
					request: {
						method: 'POST',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}/github',
						body: slackGithubBody,
						qs: {
							thread_id: '={{$parameter.threadId || undefined}}',
							wait: '={{$parameter.wait}}',
						},
					},
				},
			},
			{
				name: 'Execute Slack',
				value: 'executeSlack',
				action: 'Execute a webhook with a slack payload',
				routing: {
					request: {
						method: 'POST',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}/slack',
						body: slackGithubBody,
						qs: {
							thread_id: '={{$parameter.threadId || undefined}}',
							wait: '={{$parameter.wait}}',
						},
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a webhook',
				routing: {
					request: {
						method: 'GET',
						url: '=/webhooks/{{$parameter.webhookId}}',
					},
				},
			},
			{
				name: 'Get Channel Webhooks',
				value: 'getChannelWebhooks',
				action: 'Get all webhooks for a channel',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/webhooks',
					},
				},
			},
			{
				name: 'Get Guild Webhooks',
				value: 'getGuildWebhooks',
				action: 'Get all webhooks for a guild',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/webhooks',
					},
				},
			},
			{
				name: 'Get Message',
				value: 'getMessage',
				action: 'Get a previously sent webhook message',
				routing: {
					request: {
						method: 'GET',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}/messages/{{$parameter.messageId}}',
						qs: {
							thread_id: '={{$parameter.threadId || undefined}}',
						},
					},
				},
			},
			{
				name: 'Get With Token',
				value: 'getWithToken',
				action: 'Get a webhook using its token',
				routing: {
					request: {
						method: 'GET',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}',
					},
				},
			},
			{
				name: 'Modify',
				value: 'modify',
				action: 'Modify a webhook',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/webhooks/{{$parameter.webhookId}}',
						body: modifyBody,
					},
				},
			},
			{
				name: 'Modify With Token',
				value: 'modifyWithToken',
				action: 'Modify a webhook using its token',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}',
						body: modifyWithTokenBody,
					},
				},
			},
		],
		default: 'execute',
	},
];

const channelIdField: INodeProperties = {
	displayName: 'Channel',
	name: 'channelId',
	type: 'string',
	default: '',
	required: true,
	placeholder: 'e.g. 123456789012345678',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['create', 'getChannelWebhooks'],
		},
	},
	description: 'Channel ID. Discord snowflake ID of the channel.',
};

const guildIdField: INodeProperties = {
	displayName: 'Guild',
	name: 'guildId',
	type: 'string',
	default: '',
	required: true,
	placeholder: 'e.g. 123456789012345678',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['getGuildWebhooks'],
		},
	},
	description: 'Guild ID. Discord snowflake ID of the guild.',
};

const webhookIdField: INodeProperties = {
	displayName: 'Webhook',
	name: 'webhookId',
	type: 'string',
	default: '',
	required: true,
	placeholder: 'e.g. 123456789012345678',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: [
				'get',
				'getWithToken',
				'modify',
				'modifyWithToken',
				'delete',
				'deleteWithToken',
				'executeSlack',
				'executeGithub',
				'getMessage',
				'editMessage',
				'deleteMessage',
			],
		},
	},
	description: 'Webhook ID. Discord snowflake ID of the webhook.',
};

const webhookTokenField: INodeProperties = {
	displayName: 'Webhook Token',
	name: 'webhookToken',
	type: 'string',
	typeOptions: {
		password: true,
	},
	default: '',
	required: true,
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: [
				'getWithToken',
				'modifyWithToken',
				'deleteWithToken',
				'executeSlack',
				'executeGithub',
				'getMessage',
				'editMessage',
				'deleteMessage',
			],
		},
	},
	description: 'Webhook token. Returned with the webhook object and required for token-scoped endpoints.',
};

const messageIdField: INodeProperties = {
	displayName: 'Message',
	name: 'messageId',
	type: 'string',
	default: '',
	required: true,
	placeholder: 'e.g. 123456789012345678',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['getMessage', 'editMessage', 'deleteMessage'],
		},
	},
	description: 'Message ID. Discord snowflake ID of the webhook message.',
};

const webhookUrlField: INodeProperties = {
	displayName: 'Webhook URL',
	name: 'webhookUrl',
	type: 'string',
	typeOptions: {
		password: true,
	},
	default: '',
	required: true,
	placeholder: 'https://discord.com/api/webhooks/...',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description: 'Discord webhook URL, including webhook ID and token',
};

const createNameField: INodeProperties = {
	displayName: 'Name',
	name: 'name',
	type: 'string',
	default: '',
	required: true,
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['create'],
		},
	},
	description: 'Name of the webhook (1-80 characters)',
};

const modifyNameField: INodeProperties = {
	displayName: 'Name',
	name: 'name',
	type: 'string',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['modify', 'modifyWithToken'],
		},
	},
	description: 'New webhook name (1-80 characters)',
};

const createAvatarField: INodeProperties = {
	displayName: 'Avatar',
	name: 'avatar',
	type: 'string',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['create', 'modify', 'modifyWithToken'],
		},
	},
	description: 'Image data URI (data:image/png;base64,...) for the webhook avatar. Empty leaves the avatar unchanged.',
};

const modifyChannelField: INodeProperties = {
	displayName: 'Channel',
	name: 'channelId',
	type: 'string',
	default: '',
	placeholder: 'e.g. 123456789012345678',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['modify'],
		},
	},
	description: 'Channel ID to move the webhook to. Leave empty to keep the current channel.',
};

const payloadField: INodeProperties = {
	displayName: 'Payload',
	name: 'payload',
	type: 'json',
	default: '{}',
	required: true,
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['executeSlack', 'executeGithub'],
		},
	},
	description: 'Raw provider-formatted JSON body (Slack or GitHub webhook payload)',
};

const contentExecuteField: INodeProperties = {
	displayName: 'Content',
	name: 'content',
	type: 'string',
	typeOptions: {
		rows: 4,
	},
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
	description: 'Message content. Up to 2000 characters.',
};

const usernameField: INodeProperties = {
	displayName: 'Username',
	name: 'username',
	type: 'string',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description: 'Override the default username of the webhook for this message',
};

const avatarUrlField: INodeProperties = {
	displayName: 'Avatar URL',
	name: 'avatarUrl',
	type: 'string',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description: 'Override the default avatar URL of the webhook for this message',
};

const ttsField: INodeProperties = {
	displayName: 'TTS',
	name: 'tts',
	type: 'boolean',
	default: false,
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description: 'Whether the message should be sent as text-to-speech',
};

const flagsField: INodeProperties = {
	displayName: 'Flags',
	name: 'flags',
	type: 'number',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description:
		'Bitfield of Discord message flags. Common values: 4 (suppress embeds), 4096 (suppress notifications), 32768 (is components v2).',
};

const threadNameField: INodeProperties = {
	displayName: 'Thread Name',
	name: 'threadName',
	type: 'string',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description: 'Name of the thread to create. Only applies to forum or media channel webhooks.',
};

const appliedTagsField: INodeProperties = {
	displayName: 'Applied Tags',
	name: 'appliedTags',
	type: 'string',
	default: '',
	placeholder: '123456789012345678, 234567890123456789',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description:
		'Comma-separated Discord forum tag snowflakes to apply to the new thread. Only used with forum channel webhooks.',
};

const pollField: INodeProperties = {
	displayName: 'Poll',
	name: 'poll',
	type: 'json',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	placeholder: '{"question":{"text":"Pick"},"answers":[{"poll_media":{"text":"A"}}],"duration":24}',
	description: 'Raw Discord poll create payload to attach to the message',
};

const threadIdField: INodeProperties = {
	displayName: 'Thread ID',
	name: 'threadId',
	type: 'string',
	default: '',
	placeholder: 'e.g. 123456789012345678',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: [
				'execute',
				'executeSlack',
				'executeGithub',
				'getMessage',
				'editMessage',
				'deleteMessage',
			],
		},
	},
	description: 'If set, the message is sent to the specified thread within the webhook channel',
};

const waitField: INodeProperties = {
	displayName: 'Wait',
	name: 'wait',
	type: 'boolean',
	default: false,
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'executeSlack', 'executeGithub'],
		},
	},
	description:
		'Whether Discord should wait for confirmation and return the created message. Required to receive the message object back.',
};

const embedsField = createEmbedsCollectionField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const buttonRowField = createButtonComponentsField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
	name: 'buttonRow',
});

const stringSelectField = createStringSelectComponentField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
	name: 'stringSelect',
});

const mentionableSelectField = createMentionableSelectComponentField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
	name: 'mentionableSelect',
});

const componentsField = createComponentsJsonField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const textDisplaysField = createTextDisplayField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const separatorsField = createSeparatorComponentField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const mediaGalleryField = createMediaGalleryField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const v2FilesField = createV2FileComponentField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const attachmentsField = createAttachmentsCollectionField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const allowedMentionsField = createAllowedMentionsCollectionField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const auditLogReasonField = createAuditLogReasonField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['create', 'modify', 'delete'],
		},
	},
});

export const webhookFields: INodeProperties[] = [
	channelIdField,
	guildIdField,
	webhookIdField,
	webhookTokenField,
	messageIdField,
	webhookUrlField,
	createNameField,
	modifyNameField,
	createAvatarField,
	modifyChannelField,
	payloadField,
	contentExecuteField,
	usernameField,
	avatarUrlField,
	ttsField,
	flagsField,
	threadNameField,
	appliedTagsField,
	pollField,
	threadIdField,
	waitField,
	embedsField,
	buttonRowField,
	stringSelectField,
	mentionableSelectField,
	componentsField,
	textDisplaysField,
	separatorsField,
	mediaGalleryField,
	v2FilesField,
	attachmentsField,
	allowedMentionsField,
	auditLogReasonField,
];
