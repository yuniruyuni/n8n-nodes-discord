import type { INodeProperties } from 'n8n-workflow';

export const messageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['message'],
			},
		},
		options: [
			{
				name: 'Send',
				value: 'send',
				action: 'Send a message',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/messages',
						body: {
							content: '={{$parameter.content}}',
						},
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a message',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}',
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a message',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}',
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
		default: 'send',
	},
];

const channelField: INodeProperties = {
	displayName: 'Channel',
	name: 'channelId',
	type: 'string',
	default: '',
	required: true,
	displayOptions: {
		show: {
			resource: ['message'],
		},
	},
	description: 'Channel ID. Discord snowflake ID of the channel.',
};

export const messageFields: INodeProperties[] = [
	channelField,
	{
		displayName: 'Message',
		name: 'messageId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['get', 'delete'],
			},
		},
		description: 'Message ID. Discord snowflake ID of the message.',
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
				resource: ['message'],
				operation: ['send'],
			},
		},
		description: 'Message content to send. Embed, component, attachment, and poll builders are tracked in the full coverage TODO.',
	},
];
