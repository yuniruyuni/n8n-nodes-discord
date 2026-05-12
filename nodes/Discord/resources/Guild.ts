import type { INodeProperties } from 'n8n-workflow';

const guildBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.description !== "" ? { description: $parameter.description } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

export const guildOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['guild'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a guild',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}',
					},
				},
			},
			{
				name: 'Modify',
				value: 'modify',
				action: 'Modify a guild',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}',
						body: guildBody,
					},
				},
			},
			{
				name: 'Get Channels',
				value: 'getChannels',
				action: 'Get guild channels',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/channels',
					},
				},
			},
		],
		default: 'get',
	},
];

export const guildFields: INodeProperties[] = [
	{
		displayName: 'Guild',
		name: 'guildId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['guild'],
			},
		},
		description: 'Guild ID. Discord snowflake ID of the guild.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['modify'],
			},
		},
		description: 'New guild name',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['modify'],
			},
		},
		description: 'New guild description',
	},
	{
		displayName: 'Raw JSON',
		name: 'rawJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['modify'],
			},
		},
		description: 'Additional Discord guild JSON body fields. Values here override simple fields when keys overlap.',
	},
];
