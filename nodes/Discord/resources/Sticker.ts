import type {
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

import { createAuditLogReasonField } from '../shared/auditLog';

// Sticker uploads use multipart/form-data (not the data URI helper in shared/dataUri).

// Discord requires multipart/form-data for sticker uploads (the file part cannot
// be expressed in JSON). Declarative routing cannot reach the item's binary
// buffer on its own, so a preSend hook reads the configured binary property,
// assembles a FormData body with the text fields plus the file, and rewrites
// requestOptions before the HTTP helper sends it.
export async function presendCreateGuildSticker(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const name = this.getNodeParameter('name', '') as string;
	const description = this.getNodeParameter('description', '') as string;
	const tags = this.getNodeParameter('tags', '') as string;
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 'data') as string;

	const binaryData = this.helpers.assertBinaryData(binaryPropertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(binaryPropertyName);

	const bytes = new Uint8Array(buffer.byteLength);
	bytes.set(buffer);
	const blob = new Blob([bytes], binaryData.mimeType ? { type: binaryData.mimeType } : {});

	const form = new FormData();
	form.append('name', name);
	form.append('description', description);
	form.append('tags', tags);
	form.append('file', blob, binaryData.fileName ?? binaryPropertyName);

	return {
		...requestOptions,
		body: form,
		headers: {
			...(requestOptions.headers ?? {}),
			'Content-Type': 'multipart/form-data',
		},
	};
}

const modifyGuildStickerBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.description !== "" ? { description: $parameter.description } : {}), ...($parameter.tags !== "" ? { tags: $parameter.tags } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

export const stickerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['sticker'],
			},
		},
		options: [
			{
				name: 'Get Sticker',
				value: 'getSticker',
				action: 'Get a sticker',
				routing: {
					request: {
						method: 'GET',
						url: '=/stickers/{{$parameter.stickerId}}',
					},
				},
			},
			{
				name: 'List Sticker Packs',
				value: 'listStickerPacks',
				action: 'List nitro sticker packs',
				routing: {
					request: {
						method: 'GET',
						url: '/sticker-packs',
					},
				},
			},
			{
				name: 'List Guild Stickers',
				value: 'listGuildStickers',
				action: 'List guild stickers',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/stickers',
					},
				},
			},
			{
				name: 'Get Guild Sticker',
				value: 'getGuildSticker',
				action: 'Get a guild sticker',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/stickers/{{$parameter.stickerId}}',
					},
				},
			},
			{
				name: 'Create Guild Sticker',
				value: 'createGuildSticker',
				action: 'Create a guild sticker',
				routing: {
					send: {
						preSend: [presendCreateGuildSticker],
					},
					request: {
						method: 'POST',
						url: '=/guilds/{{$parameter.guildId}}/stickers',
					},
				},
			},
			{
				name: 'Modify Guild Sticker',
				value: 'modifyGuildSticker',
				action: 'Modify a guild sticker',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/stickers/{{$parameter.stickerId}}',
						body: modifyGuildStickerBody,
					},
				},
			},
			{
				name: 'Delete Guild Sticker',
				value: 'deleteGuildSticker',
				action: 'Delete a guild sticker',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/guilds/{{$parameter.guildId}}/stickers/{{$parameter.stickerId}}',
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
		],
		default: 'getSticker',
	},
];

export const stickerFields: INodeProperties[] = [
	{
		displayName: 'Guild',
		name: 'guildId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['sticker'],
				operation: [
					'listGuildStickers',
					'getGuildSticker',
					'createGuildSticker',
					'modifyGuildSticker',
					'deleteGuildSticker',
				],
			},
		},
		description: 'Guild ID. Discord snowflake ID of the guild.',
	},
	{
		displayName: 'Sticker',
		name: 'stickerId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['sticker'],
				operation: [
					'getSticker',
					'getGuildSticker',
					'modifyGuildSticker',
					'deleteGuildSticker',
				],
			},
		},
		description: 'Sticker ID. Discord snowflake ID of the sticker.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['sticker'],
				operation: ['createGuildSticker'],
			},
		},
		description: 'Sticker name (2-30 characters)',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['sticker'],
				operation: ['createGuildSticker'],
			},
		},
		description: 'Sticker description (2-100 characters, or empty string)',
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['sticker'],
				operation: ['createGuildSticker'],
			},
		},
		description:
			'Autocomplete/suggestion tags for the sticker (max 200 characters). Typically a related Discord unicode emoji.',
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		placeholder: 'data',
		displayOptions: {
			show: {
				resource: ['sticker'],
				operation: ['createGuildSticker'],
			},
		},
		description:
			'Name of the input item binary property holding the sticker file (PNG, APNG, GIF, or Lottie JSON, max 512 KiB)',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['sticker'],
				operation: ['modifyGuildSticker'],
			},
		},
		description: 'New sticker name (2-30 characters)',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['sticker'],
				operation: ['modifyGuildSticker'],
			},
		},
		description: 'New sticker description (2-100 characters, or empty string)',
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['sticker'],
				operation: ['modifyGuildSticker'],
			},
		},
		description: 'New autocomplete/suggestion tags for the sticker (max 200 characters)',
	},
	{
		displayName: 'Raw JSON',
		name: 'rawJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['sticker'],
				operation: ['modifyGuildSticker'],
			},
		},
		description:
			'Additional Discord sticker JSON body fields. Values here override simple fields when keys overlap.',
	},
	createAuditLogReasonField({
		displayOptions: {
			show: {
				resource: ['sticker'],
				operation: ['createGuildSticker', 'modifyGuildSticker', 'deleteGuildSticker'],
			},
		},
	}),
];
