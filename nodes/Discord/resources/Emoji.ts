import type { INodeProperties } from 'n8n-workflow';

import { createAuditLogReasonField } from '../shared/auditLog';

const guildEmojiCreateBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.image !== "" ? { image: $parameter.image } : {}), ...($parameter.roles !== "" ? { roles: $parameter.roles.split(",").map(role => role.trim()).filter(Boolean) } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

const guildEmojiModifyBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.roles !== "" ? { roles: $parameter.roles.split(",").map(role => role.trim()).filter(Boolean) } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

const applicationEmojiCreateBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.image !== "" ? { image: $parameter.image } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

const applicationEmojiModifyBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

export const emojiOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['emoji'],
			},
		},
		options: [
			{
				name: 'List Guild Emojis',
				value: 'listGuildEmojis',
				action: 'List guild emojis',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/emojis',
					},
				},
			},
			{
				name: 'Get Guild Emoji',
				value: 'getGuildEmoji',
				action: 'Get a guild emoji',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/emojis/{{$parameter.emojiId}}',
					},
				},
			},
			{
				name: 'Create Guild Emoji',
				value: 'createGuildEmoji',
				action: 'Create a guild emoji',
				routing: {
					request: {
						method: 'POST',
						url: '=/guilds/{{$parameter.guildId}}/emojis',
						body: guildEmojiCreateBody,
					},
				},
			},
			{
				name: 'Modify Guild Emoji',
				value: 'modifyGuildEmoji',
				action: 'Modify a guild emoji',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/emojis/{{$parameter.emojiId}}',
						body: guildEmojiModifyBody,
					},
				},
			},
			{
				name: 'Delete Guild Emoji',
				value: 'deleteGuildEmoji',
				action: 'Delete a guild emoji',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/guilds/{{$parameter.guildId}}/emojis/{{$parameter.emojiId}}',
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
				name: 'List Application Emojis',
				value: 'listApplicationEmojis',
				action: 'List application emojis',
				routing: {
					request: {
						method: 'GET',
						url: '=/applications/{{$parameter.applicationId}}/emojis',
					},
				},
			},
			{
				name: 'Get Application Emoji',
				value: 'getApplicationEmoji',
				action: 'Get an application emoji',
				routing: {
					request: {
						method: 'GET',
						url: '=/applications/{{$parameter.applicationId}}/emojis/{{$parameter.emojiId}}',
					},
				},
			},
			{
				name: 'Create Application Emoji',
				value: 'createApplicationEmoji',
				action: 'Create an application emoji',
				routing: {
					request: {
						method: 'POST',
						url: '=/applications/{{$parameter.applicationId}}/emojis',
						body: applicationEmojiCreateBody,
					},
				},
			},
			{
				name: 'Modify Application Emoji',
				value: 'modifyApplicationEmoji',
				action: 'Modify an application emoji',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/applications/{{$parameter.applicationId}}/emojis/{{$parameter.emojiId}}',
						body: applicationEmojiModifyBody,
					},
				},
			},
			{
				name: 'Delete Application Emoji',
				value: 'deleteApplicationEmoji',
				action: 'Delete an application emoji',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/applications/{{$parameter.applicationId}}/emojis/{{$parameter.emojiId}}',
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
		default: 'listGuildEmojis',
	},
];

export const emojiFields: INodeProperties[] = [
	{
		displayName: 'Guild',
		name: 'guildId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['emoji'],
				operation: [
					'listGuildEmojis',
					'getGuildEmoji',
					'createGuildEmoji',
					'modifyGuildEmoji',
					'deleteGuildEmoji',
				],
			},
		},
		description: 'Guild ID. Discord snowflake ID of the guild.',
	},
	{
		displayName: 'Application',
		name: 'applicationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['emoji'],
				operation: [
					'listApplicationEmojis',
					'getApplicationEmoji',
					'createApplicationEmoji',
					'modifyApplicationEmoji',
					'deleteApplicationEmoji',
				],
			},
		},
		description: 'Application ID. Discord snowflake ID of the application.',
	},
	{
		displayName: 'Emoji',
		name: 'emojiId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['emoji'],
				operation: [
					'getGuildEmoji',
					'modifyGuildEmoji',
					'deleteGuildEmoji',
					'getApplicationEmoji',
					'modifyApplicationEmoji',
					'deleteApplicationEmoji',
				],
			},
		},
		description: 'Emoji ID. Discord snowflake ID of the emoji.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['emoji'],
				operation: [
					'createGuildEmoji',
					'modifyGuildEmoji',
					'createApplicationEmoji',
					'modifyApplicationEmoji',
				],
			},
		},
		description: 'Emoji name',
	},
	{
		displayName: 'Image',
		name: 'image',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['emoji'],
				operation: ['createGuildEmoji', 'createApplicationEmoji'],
			},
		},
		description:
			'Image as a base64 data URI string (e.g., data:image/png;base64,...). Discord supports PNG, JPEG, and GIF up to 256 KiB.',
	},
	{
		displayName: 'Role IDs',
		name: 'roles',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['emoji'],
				operation: ['createGuildEmoji', 'modifyGuildEmoji'],
			},
		},
		description: 'Comma-separated role IDs allowed to use this emoji',
	},
	{
		displayName: 'Raw JSON',
		name: 'rawJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['emoji'],
				operation: [
					'createGuildEmoji',
					'modifyGuildEmoji',
					'createApplicationEmoji',
					'modifyApplicationEmoji',
				],
			},
		},
		description:
			'Additional Discord emoji JSON body fields. Values here override simple fields when keys overlap.',
	},
	createAuditLogReasonField({
		displayOptions: {
			show: {
				resource: ['emoji'],
				operation: ['createGuildEmoji', 'modifyGuildEmoji', 'deleteGuildEmoji'],
			},
		},
	}),
];
