// Lobbies are part of Discord's Social SDK / Activity ecosystem.
// This resource exposes the REST endpoints only; the Social SDK runtime,
// Activity instance lifecycle, and voice/media transport are out of scope
// for n8n. Use these operations to script lobby lifecycle from workflows,
// e.g. create a lobby ahead of a scheduled event, add or remove members,
// or link a guild text channel for chat bridging.
import type { INodeProperties } from 'n8n-workflow';

import { createRawJsonField } from '../shared/messagePayload';

const lobbyBody =
	'={{ { ...(JSON.parse($parameter.metadata || "null") !== null ? { metadata: JSON.parse($parameter.metadata) } : {}), ...(JSON.parse($parameter.members || "null") !== null ? { members: JSON.parse($parameter.members) } : {}), ...($parameter.idleTimeoutSeconds !== "" ? { idle_timeout_seconds: Number($parameter.idleTimeoutSeconds) } : {}) } }}';

const memberBody =
	'={{ { ...(JSON.parse($parameter.memberMetadata || "null") !== null ? { metadata: JSON.parse($parameter.memberMetadata) } : {}), ...($parameter.flags !== "" ? { flags: Number($parameter.flags) } : {}) } }}';

const linkChannelBody = '={{ { channel_id: $parameter.linkChannelId } }}';

const unlinkChannelBody = '={{ {} }}';

export const lobbyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['lobby'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create',
				routing: {
					request: {
						method: 'POST',
						url: '/lobbies',
						body: lobbyBody,
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
						url: '=/lobbies/{{$parameter.lobbyId}}',
					},
				},
			},
			{
				name: 'Modify',
				value: 'modify',
				action: 'Modify',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/lobbies/{{$parameter.lobbyId}}',
						body: lobbyBody,
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
						url: '=/lobbies/{{$parameter.lobbyId}}',
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
				name: 'Add Member',
				value: 'addMember',
				action: 'Add member',
				routing: {
					request: {
						method: 'PUT',
						url: '=/lobbies/{{$parameter.lobbyId}}/members/{{$parameter.userId}}',
						body: memberBody,
					},
				},
			},
			{
				name: 'Remove Member',
				value: 'removeMember',
				action: 'Remove member',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/lobbies/{{$parameter.lobbyId}}/members/{{$parameter.userId}}',
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
				name: 'Leave Lobby',
				value: 'leaveLobby',
				action: 'Leave lobby',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/lobbies/{{$parameter.lobbyId}}/members/@me',
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
				name: 'Link Channel',
				value: 'linkChannel',
				action: 'Link channel',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/lobbies/{{$parameter.lobbyId}}/channel-linking',
						body: linkChannelBody,
					},
				},
			},
			{
				name: 'Unlink Channel',
				value: 'unlinkChannel',
				action: 'Unlink channel',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/lobbies/{{$parameter.lobbyId}}/channel-linking',
						body: unlinkChannelBody,
					},
				},
			},
		],
		default: 'get',
	},
];

export const lobbyFields: INodeProperties[] = [
	{
		displayName: 'Lobby',
		name: 'lobbyId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['lobby'],
				operation: [
					'get',
					'modify',
					'delete',
					'addMember',
					'removeMember',
					'leaveLobby',
					'linkChannel',
					'unlinkChannel',
				],
			},
		},
		description: 'Lobby ID. Discord snowflake ID of the lobby.',
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
				resource: ['lobby'],
				operation: ['addMember', 'removeMember'],
			},
		},
		description: 'User ID. Discord snowflake ID of the lobby member.',
	},
	{
		displayName: 'Idle Timeout Seconds',
		name: 'idleTimeoutSeconds',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['lobby'],
				operation: ['create', 'modify'],
			},
		},
		description:
			'Seconds before the lobby is considered idle and is automatically deleted. Allowed range 5 to 604800.',
	},
	createRawJsonField(
		'Metadata',
		'metadata',
		'Raw Discord lobby metadata JSON object. String key/value pairs attached to the lobby.',
		'{}',
		{
			displayOptions: {
				show: {
					resource: ['lobby'],
					operation: ['create', 'modify'],
				},
			},
		},
	),
	createRawJsonField(
		'Members',
		'members',
		'Raw Discord lobby members JSON array. Each entry is a LobbyMember object with at least a user id.',
		'[]',
		{
			displayOptions: {
				show: {
					resource: ['lobby'],
					operation: ['create', 'modify'],
				},
			},
		},
	),
	createRawJsonField(
		'Member Metadata',
		'memberMetadata',
		'Raw Discord lobby member metadata JSON object. String key/value pairs attached to the lobby member.',
		'{}',
		{
			displayOptions: {
				show: {
					resource: ['lobby'],
					operation: ['addMember'],
				},
			},
		},
	),
	{
		displayName: 'Flags',
		name: 'flags',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['lobby'],
				operation: ['addMember'],
			},
		},
		description: 'Lobby member flags bitfield. See Discord documentation for available flag values.',
	},
	{
		displayName: 'Channel ID',
		name: 'linkChannelId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['lobby'],
				operation: ['linkChannel'],
			},
		},
		description: 'Channel ID. Discord snowflake ID of the text channel to link to the lobby.',
	},
];
