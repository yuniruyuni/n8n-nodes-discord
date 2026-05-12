import type { INodeProperties } from 'n8n-workflow';

import { createRawJsonField } from '../shared/messagePayload';

const recordsBody = '={{ JSON.parse($parameter.records) }}';

export const applicationRoleConnectionMetadataOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['applicationRoleConnectionMetadata'],
			},
		},
		options: [
			{
				name: 'Get Records',
				value: 'getRecords',
				action: 'Get application role connection metadata records',
				routing: {
					request: {
						method: 'GET',
						url: '=/applications/{{$parameter.applicationId}}/role-connections/metadata',
					},
				},
			},
			{
				name: 'Update Records',
				value: 'updateRecords',
				action: 'Update application role connection metadata records',
				routing: {
					request: {
						method: 'PUT',
						url: '=/applications/{{$parameter.applicationId}}/role-connections/metadata',
						body: recordsBody,
					},
				},
			},
		],
		default: 'getRecords',
	},
];

export const applicationRoleConnectionMetadataFields: INodeProperties[] = [
	{
		displayName: 'Application',
		name: 'applicationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['applicationRoleConnectionMetadata'],
			},
		},
		description: 'Application ID. Discord snowflake ID of the application.',
	},
	createRawJsonField(
		'Records',
		'records',
		'Raw Discord application role connection metadata JSON array. Each record requires type, key, name, and description, and may include name_localizations and description_localizations. Metadata type enum: 1 INTEGER_LESS_THAN_OR_EQUAL, 2 INTEGER_GREATER_THAN_OR_EQUAL, 3 INTEGER_EQUAL, 4 INTEGER_NOT_EQUAL, 5 DATETIME_LESS_THAN_OR_EQUAL, 6 DATETIME_GREATER_THAN_OR_EQUAL, 7 BOOLEAN_EQUAL, 8 BOOLEAN_NOT_EQUAL.',
		'[]',
		{
			required: true,
			default: '[]',
			displayOptions: {
				show: {
					resource: ['applicationRoleConnectionMetadata'],
					operation: ['updateRecords'],
				},
			},
		},
	),
];
