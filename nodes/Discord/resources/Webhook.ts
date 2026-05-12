import type { INodeProperties } from 'n8n-workflow';

export const webhookOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
			},
		},
		options: [
			{
				name: 'Execute',
				value: 'execute',
				action: 'Execute a webhook',
				routing: {
					request: {
						method: 'POST',
						url: '={{$parameter.webhookUrl}}',
						body: {
							content: '={{$parameter.content}}',
						},
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a webhook',
				routing: {
					request: {
						method: 'GET',
						url: '=/webhooks/{{$parameter.webhookId}}',
					},
				},
			},
		],
		default: 'execute',
	},
];

export const webhookFields: INodeProperties[] = [
	{
		displayName: 'Webhook URL',
		name: 'webhookUrl',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['execute'],
			},
		},
		description: 'Discord webhook URL, including webhook ID and token',
	},
	{
		displayName: 'Webhook',
		name: 'webhookId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['get'],
			},
		},
		description: 'Webhook ID. Discord snowflake ID of the webhook.',
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['execute'],
			},
		},
		description: 'Message content to send through the webhook',
	},
];
