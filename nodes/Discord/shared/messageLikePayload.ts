import type { IDataObject, IExecuteSingleFunctions, IHttpRequestOptions } from 'n8n-workflow';

import { buildAllowedMentionsFromCollection } from './allowedMentions';
import {
	buildAttachmentMetadata,
	buildDiscordMultipartBody,
	type DiscordAttachmentInput,
	type DiscordMultipartFile,
} from './attachments';
import {
	DISCORD_MESSAGE_FLAG_IS_COMPONENTS_V2,
	buildButtonsActionRow,
	buildMediaGalleryComponent,
	buildMentionableSelectActionRow,
	buildSeparatorComponents,
	buildStringSelectActionRow,
	buildTextDisplayComponents,
	buildV2FileComponents,
	hasV2LayoutComponents,
	validateComponents,
	validateV2Components,
	type DiscordComponent,
} from './components';
import { buildEmbedsFromCollection } from './embeds';
import { parseOptionalJsonField } from './messagePayload';
import { parseCommaSeparated } from './validators';

export interface MessageLikePayloadOptions {
	include?: {
		allowedMentions?: boolean;
		appliedTags?: boolean;
		attachments?: boolean;
		avatarUrl?: boolean;
		components?: boolean;
		content?: boolean;
		embeds?: boolean;
		flags?: boolean;
		messageReference?: boolean;
		nonce?: boolean;
		poll?: boolean;
		threadName?: boolean;
		tts?: boolean;
		username?: boolean;
	};
	flags?: 'combine' | 'number';
}

export interface MessageLikePayload {
	payload: IDataObject;
	attachments: DiscordAttachmentInput[];
}

const defaultIncludes: Required<NonNullable<MessageLikePayloadOptions['include']>> = {
	allowedMentions: true,
	appliedTags: false,
	attachments: true,
	avatarUrl: false,
	components: true,
	content: true,
	embeds: true,
	flags: true,
	messageReference: false,
	nonce: false,
	poll: false,
	threadName: false,
	tts: false,
	username: false,
};

function getIncludes(options: MessageLikePayloadOptions) {
	return {
		...defaultIncludes,
		...(options.include ?? {}),
	};
}

function readOptionalString(
	context: IExecuteSingleFunctions,
	name: string,
	options: { trim?: boolean } = {},
): string | undefined {
	const value = context.getNodeParameter(name, '') as unknown;
	if (typeof value !== 'string') {
		return undefined;
	}
	const trimmed = options.trim === false ? value : value.trim();
	return trimmed === '' ? undefined : trimmed;
}

function readOptionalNumber(
	context: IExecuteSingleFunctions,
	name: string,
): number | undefined {
	const value = context.getNodeParameter(name, '') as unknown;
	if (value === '' || value === undefined || value === null) {
		return undefined;
	}
	const numeric = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(numeric) ? numeric : undefined;
}

function readOptionalBoolean(
	context: IExecuteSingleFunctions,
	name: string,
): boolean | undefined {
	const value = context.getNodeParameter(name, false) as unknown;
	return typeof value === 'boolean' ? value : undefined;
}

function readSnowflakeArray(
	context: IExecuteSingleFunctions,
	name: string,
): string[] | undefined {
	const value = context.getNodeParameter(name, '') as unknown;
	if (typeof value !== 'string' || value.trim() === '') {
		return undefined;
	}
	const entries = parseCommaSeparated(value);
	return entries.length > 0 ? entries : undefined;
}

export function combineMessageFlags(value: unknown): number | undefined {
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

export function readAttachmentInputs(value: unknown): DiscordAttachmentInput[] {
	if (!value || typeof value !== 'object') {
		return [];
	}
	const collection = (value as IDataObject).attachment;
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

export async function loadAttachmentFiles(
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

function buildComponentRows(context: IExecuteSingleFunctions): DiscordComponent[] {
	const rows: DiscordComponent[] = [];

	rows.push(...buildButtonsActionRow(context.getNodeParameter('buttonRow', {}) as unknown));
	rows.push(...buildStringSelectActionRow(context.getNodeParameter('stringSelect', {}) as unknown));
	rows.push(
		...buildMentionableSelectActionRow(
			context.getNodeParameter('mentionableSelect', {}) as unknown,
		),
	);

	const components = parseOptionalJsonField<unknown>(
		context.getNodeParameter('components', '') as unknown,
		'Components',
	);
	if (Array.isArray(components) && components.length > 0) {
		rows.push(...(components as DiscordComponent[]));
	}

	rows.push(...buildTextDisplayComponents(context.getNodeParameter('textDisplays', {}) as unknown));
	rows.push(...buildSeparatorComponents(context.getNodeParameter('separators', {}) as unknown));

	const mediaGallery = buildMediaGalleryComponent(
		context.getNodeParameter('mediaGallery', {}) as unknown,
	);
	if (mediaGallery !== undefined) {
		rows.push(mediaGallery);
	}

	rows.push(...buildV2FileComponents(context.getNodeParameter('v2Files', {}) as unknown));

	if (rows.length > 0) {
		validateComponents(rows);
		validateV2Components(rows);
	}

	return rows;
}

export function buildMessageLikePayload(
	context: IExecuteSingleFunctions,
	options: MessageLikePayloadOptions = {},
): MessageLikePayload {
	const include = getIncludes(options);
	const payload: IDataObject = {};

	if (include.content) {
		const content = readOptionalString(context, 'content', { trim: false });
		if (content !== undefined) {
			payload.content = content;
		}
	}

	if (include.username) {
		const username = readOptionalString(context, 'username');
		if (username !== undefined) {
			payload.username = username;
		}
	}

	if (include.avatarUrl) {
		const avatarUrl = readOptionalString(context, 'avatarUrl');
		if (avatarUrl !== undefined) {
			payload.avatar_url = avatarUrl;
		}
	}

	if (include.tts && readOptionalBoolean(context, 'tts')) {
		payload.tts = true;
	}

	if (include.threadName) {
		const threadName = readOptionalString(context, 'threadName');
		if (threadName !== undefined) {
			payload.thread_name = threadName;
		}
	}

	if (include.appliedTags) {
		const appliedTags = readSnowflakeArray(context, 'appliedTags');
		if (appliedTags !== undefined) {
			payload.applied_tags = appliedTags;
		}
	}

	if (include.embeds) {
		const embeds = buildEmbedsFromCollection(context.getNodeParameter('embeds', {}) as unknown);
		if (embeds.length > 0) {
			payload.embeds = embeds as unknown as IDataObject[];
		}
	}

	const rows = include.components ? buildComponentRows(context) : [];
	if (rows.length > 0) {
		payload.components = rows as unknown as IDataObject[];
	}

	let resolvedFlags: number | undefined;
	if (include.flags) {
		resolvedFlags =
			options.flags === 'number'
				? readOptionalNumber(context, 'flags')
				: combineMessageFlags(context.getNodeParameter('flags', []) as unknown);
	}
	if (rows.length > 0 && hasV2LayoutComponents(rows)) {
		resolvedFlags = (resolvedFlags ?? 0) | DISCORD_MESSAGE_FLAG_IS_COMPONENTS_V2;
	}
	if (resolvedFlags !== undefined) {
		payload.flags = resolvedFlags;
	}

	if (include.allowedMentions) {
		const allowedMentions = buildAllowedMentionsFromCollection(
			context.getNodeParameter('allowedMentions', {}) as unknown,
		);
		if (allowedMentions !== undefined) {
			payload.allowed_mentions = allowedMentions as unknown as IDataObject;
		}
	}

	if (include.poll) {
		const poll = parseOptionalJsonField<IDataObject>(
			context.getNodeParameter('poll', '') as unknown,
			'Poll',
		);
		if (poll !== undefined) {
			payload.poll = poll;
		}
	}

	if (include.messageReference) {
		const messageReference = parseOptionalJsonField<IDataObject>(
			context.getNodeParameter('messageReference', '') as unknown,
			'Message Reference',
		);
		if (messageReference !== undefined) {
			payload.message_reference = messageReference;
		}
	}

	if (include.nonce) {
		const nonce = readOptionalString(context, 'nonce', { trim: false });
		if (nonce !== undefined) {
			payload.nonce = nonce;
		}
	}

	const attachments = include.attachments
		? readAttachmentInputs(context.getNodeParameter('attachments', {}) as unknown)
		: [];
	if (attachments.length > 0) {
		payload.attachments = buildAttachmentMetadata(attachments) as unknown as IDataObject[];
	}

	return { payload, attachments };
}

export async function applyMessageLikeBody(
	context: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
	message: MessageLikePayload,
	options: { json?: boolean } = {},
): Promise<IHttpRequestOptions> {
	if (message.attachments.length === 0) {
		const headers = { ...(requestOptions.headers ?? {}) };
		if (options.json === true) {
			(headers as Record<string, string>)['Content-Type'] = 'application/json';
		}
		const nextOptions: IHttpRequestOptions = {
			...requestOptions,
			body: message.payload,
		};
		if (options.json === true) {
			nextOptions.json = true;
			nextOptions.headers = headers;
		}
		return nextOptions;
	}

	const files = await loadAttachmentFiles(context, message.attachments);
	const multipart = buildDiscordMultipartBody({
		payloadJson: message.payload,
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
