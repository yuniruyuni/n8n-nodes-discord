import type { INodeProperties } from 'n8n-workflow';

// Discord SKUs are managed in the developer portal; only list is exposed by the API.

export const skuOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['sku'],
			},
		},
		options: [
			{
				name: 'List',
				value: 'list',
				action: 'List',
				routing: {
					request: {
						method: 'GET',
						url: '=/applications/{{$parameter.applicationId}}/skus',
					},
				},
			},
		],
		default: 'list',
	},
];

export const skuFields: INodeProperties[] = [
	{
		displayName: 'Application',
		name: 'applicationId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['sku'],
			},
		},
		description:
			'Application ID. Discord snowflake ID of the application. Returned SKU entries include a numeric type: 5 DURABLE (one-time purchase), 6 CONSUMABLE, 7 SUBSCRIPTION, 8 SUBSCRIPTION_GROUP.',
	},
];
