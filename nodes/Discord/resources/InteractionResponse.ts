import type { INodeProperties } from 'n8n-workflow';

const successResponse = {
	postReceive: [
		{
			type: 'set' as const,
			properties: {
				value: '={{ { "success": true } }}',
			},
		},
	],
};

const rawJsonBody = '={{ JSON.parse($parameter.payload) }}';

export const interactionResponseOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['interactionResponse'],
			},
		},
		options: [
			{
				name: 'Create Followup Message',
				value: 'createFollowupMessage',
				action: 'Create a followup interaction response message',
				routing: {
					request: {
						method: 'POST',
						url: '=/webhooks/{{$parameter.applicationId}}/{{$parameter.interactionToken}}',
						body: rawJsonBody,
					},
				},
			},
			{
				name: 'Create Initial Callback',
				value: 'createInitialCallback',
				action: 'Create an initial interaction callback response',
				routing: {
					request: {
						method: 'POST',
						url: '=/interactions/{{$parameter.interactionId}}/{{$parameter.interactionToken}}/callback',
						body: rawJsonBody,
					},
				},
			},
			{
				name: 'Delete Original Response',
				value: 'deleteOriginalResponse',
				action: 'Delete the original interaction response',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/webhooks/{{$parameter.applicationId}}/{{$parameter.interactionToken}}/messages/@original',
					},
					output: successResponse,
				},
			},
			{
				name: 'Edit Original Response',
				value: 'editOriginalResponse',
				action: 'Edit the original interaction response',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/webhooks/{{$parameter.applicationId}}/{{$parameter.interactionToken}}/messages/@original',
						body: rawJsonBody,
					},
				},
			},
			{
				name: 'Get Original Response',
				value: 'getOriginalResponse',
				action: 'Get the original interaction response',
				routing: {
					request: {
						method: 'GET',
						url: '=/webhooks/{{$parameter.applicationId}}/{{$parameter.interactionToken}}/messages/@original',
					},
				},
			},
		],
		default: 'createInitialCallback',
	},
];

export const interactionResponseFields: INodeProperties[] = [
	{
		displayName: 'Application',
		name: 'applicationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['interactionResponse'],
				operation: [
					'createFollowupMessage',
					'deleteOriginalResponse',
					'editOriginalResponse',
					'getOriginalResponse',
				],
			},
		},
		description: 'Application ID. Discord snowflake ID of the application.',
	},
	{
		displayName: 'Interaction',
		name: 'interactionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['interactionResponse'],
				operation: ['createInitialCallback'],
			},
		},
		description: 'Interaction ID. Discord snowflake ID of the interaction.',
	},
	{
		displayName: 'Interaction Token',
		name: 'interactionToken',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['interactionResponse'],
			},
		},
		description: 'Interaction token from the Discord interaction payload',
	},
	{
		displayName: 'Payload',
		name: 'payload',
		type: 'json',
		default: '{}',
		required: true,
		displayOptions: {
			show: {
				resource: ['interactionResponse'],
				operation: ['createFollowupMessage', 'createInitialCallback', 'editOriginalResponse'],
			},
		},
			description: 'Raw Discord JSON request body for the interaction response operation',
	},
];
