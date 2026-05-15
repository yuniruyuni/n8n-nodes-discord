import type { INodeProperties } from 'n8n-workflow';

const memberBody =
	'={{ { ...($parameter.nickname !== "" ? { nick: $parameter.nickname } : {}), ...($parameter.roleIds !== "" ? { roles: $parameter.roleIds.split(",").map(role => role.trim()).filter(Boolean) } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

export const memberOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['member'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a guild member',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/members/{{$parameter.userId}}',
					},
				},
			},
			{
				name: 'Modify',
				value: 'modify',
				action: 'Modify a guild member',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/members/{{$parameter.userId}}',
						body: memberBody,
					},
				},
			},
			{
				name: 'Remove',
				value: 'remove',
				action: 'Remove a guild member',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/guilds/{{$parameter.guildId}}/members/{{$parameter.userId}}',
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
		default: 'get',
	},
];

export const memberFields: INodeProperties[] = [
	{
		displayName: 'Guild',
		name: 'guildId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['member'],
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
				resource: ['member'],
			},
		},
		description: 'User ID. Discord snowflake ID of the member.',
	},
	{
		displayName: 'Nickname',
		name: 'nickname',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['member'],
				operation: ['modify'],
			},
		},
		description: 'New guild nickname for the member',
	},
	{
		displayName: 'Role IDs',
		name: 'roleIds',
		type: 'string',
		default: '',
		placeholder: 'e.g. 123456789012345678, 234567890123456789',
		displayOptions: {
			show: {
				resource: ['member'],
				operation: ['modify'],
			},
		},
		description: 'Comma-separated role IDs to set on the member',
	},
	{
		displayName: 'Raw JSON',
		name: 'rawJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['member'],
				operation: ['modify'],
			},
		},
		description: 'Additional Discord member JSON body fields. Values here override simple fields when keys overlap.',
	},
];
