import type {
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

import { createAllowedMentionsCollectionField } from '../shared/allowedMentions';
import { createAttachmentsCollectionField } from '../shared/attachments';
import {
	createButtonComponentsField,
	createComponentsJsonField,
	createMediaGalleryField,
	createMentionableSelectComponentField,
	createSeparatorComponentField,
	createStringSelectComponentField,
	createTextDisplayField,
	createV2FileComponentField,
} from '../shared/components';
import { createEmbedsCollectionField } from '../shared/embeds';
import { applyMessageLikeBody, buildMessageLikePayload } from '../shared/messageLikePayload';
import { successOutput } from '../shared/routing';

// Guided builders (buttonRow / stringSelect / mentionableSelect) compose the
// action rows first; entries from the raw JSON `components` field are then
// appended afterwards as an escape hatch for v2 layout / shapes the builders
// don't cover.

// preSend fork: build the JSON body for content/embeds/components/allowed_mentions/flags/etc.
// If any attachments are configured we switch to multipart (payload_json + files[N]); otherwise
// the request is sent as plain JSON.
export async function presendMessageWithOptionalAttachments(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	return applyMessageLikeBody(
		this,
		requestOptions,
		buildMessageLikePayload(this, {
			flags: 'combine',
			include: {
				messageReference: true,
				nonce: true,
				tts: true,
			},
		}),
		{
			json: true,
		},
	);
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
						output: successOutput,
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
						output: successOutput,
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
