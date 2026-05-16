import type { INodeProperties } from 'n8n-workflow';

// Poll creation is embedded inside the Message create payload; see Message resource for poll authoring.

export const pollOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['poll'],
			},
		},
		options: [
			{
				name: 'Get Answer Voters',
				value: 'getAnswerVoters',
				action: 'Get answer voters',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/polls/{{$parameter.messageId}}/answers/{{$parameter.answerId}}',
					},
				},
			},
			{
				name: 'End Poll',
				value: 'endPoll',
				action: 'End poll',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/polls/{{$parameter.messageId}}/expire',
					},
				},
			},
		],
		default: 'getAnswerVoters',
	},
];

export const pollFields: INodeProperties[] = [
	{
		displayName: 'Channel',
		name: 'channelId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['poll'],
			},
		},
		description: 'Channel ID. Discord snowflake ID of the channel containing the poll.',
	},
	{
		displayName: 'Message',
		name: 'messageId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['poll'],
			},
		},
		description: 'Message ID. Discord snowflake ID of the message hosting the poll.',
	},
	{
		displayName: 'Answer',
		name: 'answerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['poll'],
				operation: ['getAnswerVoters'],
			},
		},
		description: 'Poll answer ID to fetch voters for',
	},
	{
		displayName: 'After',
		name: 'after',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['poll'],
				operation: ['getAnswerVoters'],
			},
		},
		description: 'Get users after this user ID. Discord snowflake used as pagination cursor.',
		routing: {
			send: {
				type: 'query',
				property: 'after',
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
				resource: ['poll'],
				operation: ['getAnswerVoters'],
			},
		},
		description: 'Max number of results to return',
		routing: {
			send: {
				type: 'query',
				property: 'limit',
			},
		},
	},
];
