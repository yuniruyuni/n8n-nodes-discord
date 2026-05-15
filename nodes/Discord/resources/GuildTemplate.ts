import type { INodeProperties } from 'n8n-workflow';

import { createAuditLogReasonField } from '../shared/auditLog';

const createGuildFromTemplateBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.icon !== "" ? { icon: $parameter.icon } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

const createGuildTemplateBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.description !== "" ? { description: $parameter.description } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

const modifyGuildTemplateBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.description !== "" ? { description: $parameter.description } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

export const guildTemplateOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['guildTemplate'],
			},
		},
		options: [
			{
				name: 'Get Template',
				value: 'getTemplate',
				action: 'Get a guild template',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/templates/{{$parameter.templateCode}}',
					},
				},
			},
			{
				name: 'Create Guild From Template',
				value: 'createGuildFromTemplate',
				action: 'Create a guild from template',
				routing: {
					request: {
						method: 'POST',
						url: '=/guilds/templates/{{$parameter.templateCode}}',
						body: createGuildFromTemplateBody,
					},
				},
			},
			{
				name: 'List Guild Templates',
				value: 'listGuildTemplates',
				action: 'List guild templates',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/templates',
					},
				},
			},
			{
				name: 'Create Guild Template',
				value: 'createGuildTemplate',
				action: 'Create a guild template',
				routing: {
					request: {
						method: 'POST',
						url: '=/guilds/{{$parameter.guildId}}/templates',
						body: createGuildTemplateBody,
					},
				},
			},
			{
				name: 'Sync Guild Template',
				value: 'syncGuildTemplate',
				action: 'Sync a guild template',
				routing: {
					request: {
						method: 'PUT',
						url: '=/guilds/{{$parameter.guildId}}/templates/{{$parameter.templateCode}}',
					},
				},
			},
			{
				name: 'Modify Guild Template',
				value: 'modifyGuildTemplate',
				action: 'Modify a guild template',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/templates/{{$parameter.templateCode}}',
						body: modifyGuildTemplateBody,
					},
				},
			},
			{
				name: 'Delete Guild Template',
				value: 'deleteGuildTemplate',
				action: 'Delete a guild template',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/guilds/{{$parameter.guildId}}/templates/{{$parameter.templateCode}}',
					},
				},
			},
		],
		default: 'getTemplate',
	},
];

export const guildTemplateFields: INodeProperties[] = [
	{
		displayName: 'Guild',
		name: 'guildId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['guildTemplate'],
				operation: [
					'listGuildTemplates',
					'createGuildTemplate',
					'syncGuildTemplate',
					'modifyGuildTemplate',
					'deleteGuildTemplate',
				],
			},
		},
		description: 'Guild ID. Discord snowflake ID of the guild.',
	},
	{
		displayName: 'Template Code',
		name: 'templateCode',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 6L7Z67mu',
		displayOptions: {
			show: {
				resource: ['guildTemplate'],
				operation: [
					'getTemplate',
					'createGuildFromTemplate',
					'syncGuildTemplate',
					'modifyGuildTemplate',
					'deleteGuildTemplate',
				],
			},
		},
		description: 'Template code from the Discord template URL',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['guildTemplate'],
				operation: ['createGuildFromTemplate', 'createGuildTemplate'],
			},
		},
		description: 'Name of the guild or template (1-100 characters)',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guildTemplate'],
				operation: ['modifyGuildTemplate'],
			},
		},
		description: 'New name of the template (1-100 characters)',
	},
	{
		displayName: 'Icon',
		name: 'icon',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guildTemplate'],
				operation: ['createGuildFromTemplate'],
			},
		},
		description:
			'Icon as a base64 data URI string (e.g., data:image/png;base64,...) for the new guild',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guildTemplate'],
				operation: ['createGuildTemplate', 'modifyGuildTemplate'],
			},
		},
		description: 'Description of the template (0-120 characters)',
	},
	{
		displayName: 'Raw JSON',
		name: 'rawJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['guildTemplate'],
				operation: ['createGuildFromTemplate', 'createGuildTemplate', 'modifyGuildTemplate'],
			},
		},
		description:
			'Additional Discord guild template JSON body fields. Values here override simple fields when keys overlap.',
	},
	createAuditLogReasonField({
		displayOptions: {
			show: {
				resource: ['guildTemplate'],
				operation: [
					'createGuildTemplate',
					'syncGuildTemplate',
					'modifyGuildTemplate',
					'deleteGuildTemplate',
				],
			},
		},
	}),
];
