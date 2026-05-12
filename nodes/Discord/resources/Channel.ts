import type { INodeProperties } from 'n8n-workflow';

const channelBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.topic !== "" ? { topic: $parameter.topic } : {}), ...($parameter.position !== "" ? { position: Number($parameter.position) } : {}), ...($parameter.parentId !== "" ? { parent_id: $parameter.parentId } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

export const channelOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['channel'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a channel',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}',
					},
				},
			},
			{
				name: 'Modify',
				value: 'modify',
				action: 'Modify a channel',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/channels/{{$parameter.channelId}}',
						body: channelBody,
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a channel',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/channels/{{$parameter.channelId}}',
					},
				},
			},
		],
		default: 'get',
	},
];

export const channelFields: INodeProperties[] = [
	{
		displayName: 'Channel',
		name: 'channelId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['channel'],
			},
		},
		description: 'Channel ID. Discord snowflake ID of the channel.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['modify'],
			},
		},
		description: 'New channel name',
	},
	{
		displayName: 'Topic',
		name: 'topic',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['modify'],
			},
		},
		description: 'New text channel topic',
	},
	{
		displayName: 'Position',
		name: 'position',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['modify'],
			},
		},
		description: 'Sorting position of the channel',
	},
	{
		displayName: 'Parent Channel',
		name: 'parentId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['modify'],
			},
		},
		description: 'Parent category channel ID',
	},
	{
		displayName: 'Raw JSON',
		name: 'rawJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['modify'],
			},
		},
		description: 'Additional Discord channel JSON body fields. Values here override simple fields when keys overlap.',
	},
];
