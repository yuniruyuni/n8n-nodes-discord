import type { INodeProperties } from 'n8n-workflow';

const roleBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.color !== "" ? { color: parseInt(String($parameter.color).replace("#", ""), 16) } : {}), ...($parameter.permissions !== "" ? { permissions: $parameter.permissions } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

export const roleOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['role'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a guild role',
				routing: {
					request: {
						method: 'POST',
						url: '=/guilds/{{$parameter.guildId}}/roles',
						body: roleBody,
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many guild roles',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/roles',
					},
				},
			},
			{
				name: 'Modify',
				value: 'modify',
				action: 'Modify a guild role',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/roles/{{$parameter.roleId}}',
						body: roleBody,
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a guild role',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/guilds/{{$parameter.guildId}}/roles/{{$parameter.roleId}}',
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
		default: 'getAll',
	},
];

export const roleFields: INodeProperties[] = [
	{
		displayName: 'Guild',
		name: 'guildId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['role'],
			},
		},
		description: 'Guild ID. Discord snowflake ID of the guild.',
	},
	{
		displayName: 'Role',
		name: 'roleId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['role'],
				operation: ['modify', 'delete'],
			},
		},
		description: 'Role ID. Discord snowflake ID of the role.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['role'],
				operation: ['create', 'modify'],
			},
		},
		description: 'Role name',
	},
	{
			displayName: 'Color',
			name: 'color',
			type: 'color',
		default: '',
		displayOptions: {
			show: {
				resource: ['role'],
				operation: ['create', 'modify'],
			},
		},
		description: 'Role color as a decimal integer',
	},
	{
		displayName: 'Permissions',
		name: 'permissions',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['role'],
				operation: ['create', 'modify'],
			},
		},
		description: 'Permission bit set as a string',
	},
	{
		displayName: 'Raw JSON',
		name: 'rawJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['role'],
				operation: ['create', 'modify'],
			},
		},
		description: 'Additional Discord role JSON body fields. Values here override simple fields when keys overlap.',
	},
];
