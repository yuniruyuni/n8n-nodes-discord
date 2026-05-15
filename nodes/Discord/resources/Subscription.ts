import type { INodeProperties } from 'n8n-workflow';

// Discord subscription status values: 0 ACTIVE, 1 ENDING, 2 INACTIVE.

export const subscriptionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['subscription'],
			},
		},
		options: [
			{
				name: 'List for SKU',
				value: 'listForSku',
				action: 'List subscriptions for an SKU',
				routing: {
					request: {
						method: 'GET',
						url: '=/skus/{{$parameter.skuId}}/subscriptions',
					},
				},
			},
			{
				name: 'Get for SKU',
				value: 'getForSku',
				action: 'Get a subscription for an SKU',
				routing: {
					request: {
						method: 'GET',
						url: '=/skus/{{$parameter.skuId}}/subscriptions/{{$parameter.subscriptionId}}',
					},
				},
			},
		],
		default: 'listForSku',
	},
];

export const subscriptionFields: INodeProperties[] = [
	{
		displayName: 'SKU',
		name: 'skuId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['subscription'],
			},
		},
		description: 'SKU ID. Discord snowflake ID of the SKU.',
	},
	{
		displayName: 'Subscription',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['subscription'],
				operation: ['getForSku'],
			},
		},
		description: 'Subscription ID. Discord snowflake ID of the subscription.',
	},
	{
		displayName: 'Before',
		name: 'before',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['subscription'],
				operation: ['listForSku'],
			},
		},
		description: 'Return subscriptions before this snowflake ID',
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
				resource: ['subscription'],
				operation: ['listForSku'],
			},
		},
		description: 'Return subscriptions after this snowflake ID',
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
				resource: ['subscription'],
				operation: ['listForSku'],
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
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		default: '',
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['subscription'],
				operation: ['listForSku'],
			},
		},
		description: 'User snowflake ID. Required when using a non-bot OAuth2 token; ignored for bot tokens.',
		routing: {
			request: {
				qs: {
					user_id: '={{$parameter.userId || undefined}}',
				},
			},
		},
	},
];
