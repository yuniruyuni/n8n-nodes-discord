// Voice Gateway, UDP transport, and audio media are out of scope for this n8n node.
// This resource only exposes Discord REST voice operations.
// Voice region listing and voice-state modification are useful for stage instances
// and stage moderation flows (e.g. inviting speakers, suppressing audience members,
// or selecting an optimal voice region when creating voice channels).
import type { INodeProperties } from 'n8n-workflow';

export const voiceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['voice'],
			},
		},
		options: [
			{
				name: 'Get Current User Voice State',
				value: 'getCurrentUserVoiceState',
				action: 'Get current user voice state',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/voice-states/@me',
					},
				},
			},
			{
				name: 'Get User Voice State',
				value: 'getUserVoiceState',
				action: 'Get user voice state',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/voice-states/{{$parameter.userId}}',
					},
				},
			},
			{
				name: 'List Regions',
				value: 'listRegions',
				action: 'List regions',
				routing: {
					request: {
						method: 'GET',
						url: '/voice/regions',
					},
				},
			},
			{
				name: 'Modify Current User Voice State',
				value: 'modifyCurrentUserVoiceState',
				action: 'Modify current user voice state',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/voice-states/@me',
					},
				},
			},
			{
				name: 'Modify User Voice State',
				value: 'modifyUserVoiceState',
				action: 'Modify user voice state',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/voice-states/{{$parameter.userId}}',
					},
				},
			},
		],
		default: 'listRegions',
	},
];

export const voiceFields: INodeProperties[] = [
	{
		displayName: 'Guild',
		name: 'guildId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['voice'],
				operation: [
					'getCurrentUserVoiceState',
					'getUserVoiceState',
					'modifyCurrentUserVoiceState',
					'modifyUserVoiceState',
				],
			},
		},
		description: 'Guild ID. Discord snowflake ID of the guild.',
	},
	{
		displayName: 'User',
		name: 'userId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['voice'],
				operation: ['getUserVoiceState', 'modifyUserVoiceState'],
			},
		},
		description: 'User ID. Discord snowflake ID of the user.',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['voice'],
				operation: ['modifyCurrentUserVoiceState'],
			},
		},
		options: [
			{
				displayName: 'Channel ID',
				name: 'channel_id',
				type: 'string',
				default: '',
				description: 'ID of the stage channel the user is currently in',
				routing: {
					send: {
						type: 'body',
						property: 'channel_id',
					},
				},
			},
			{
				displayName: 'Suppress',
				name: 'suppress',
				type: 'boolean',
				default: false,
				description: 'Whether to toggle the user suppress state (move between audience and speakers)',
				routing: {
					send: {
						type: 'body',
						property: 'suppress',
					},
				},
			},
			{
				displayName: 'Request to Speak Timestamp',
				name: 'request_to_speak_timestamp',
				type: 'string',
				default: '',
				placeholder: '2024-01-01T00:00:00.000Z',
				description: 'ISO8601 timestamp to set or clear the user request to speak. Send an empty string to clear.',
				routing: {
					send: {
						type: 'body',
						property: 'request_to_speak_timestamp',
					},
				},
			},
		],
	},
	{
		displayName: 'Channel ID',
		name: 'modifyUserChannelId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['voice'],
				operation: ['modifyUserVoiceState'],
			},
		},
		description: 'ID of the stage channel the user is currently in',
		routing: {
			send: {
				type: 'body',
				property: 'channel_id',
			},
		},
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['voice'],
				operation: ['modifyUserVoiceState'],
			},
		},
		options: [
			{
				displayName: 'Suppress',
				name: 'suppress',
				type: 'boolean',
				default: false,
				description: 'Whether to toggle the user suppress state (move between audience and speakers)',
				routing: {
					send: {
						type: 'body',
						property: 'suppress',
					},
				},
			},
		],
	},
];
