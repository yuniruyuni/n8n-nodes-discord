import type { INodeProperties } from 'n8n-workflow';

export const userOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['user'],
			},
		},
		options: [
			{
				name: 'Get Current',
				value: 'getCurrent',
				action: 'Get current bot user',
				routing: {
					request: {
						method: 'GET',
						url: '/users/@me',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a user',
				routing: {
					request: {
						method: 'GET',
						url: '=/users/{{$parameter.userId}}',
					},
				},
			},
		],
		default: 'getCurrent',
	},
];

export const userFields: INodeProperties[] = [
	{
		displayName: 'User',
		name: 'userId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['get'],
			},
		},
		description: 'User ID. Discord snowflake ID of the user.',
	},
];
