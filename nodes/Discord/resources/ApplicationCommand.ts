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

export const applicationCommandOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
			},
		},
		options: [
			{
				name: 'Bulk Overwrite Global',
				value: 'bulkOverwriteGlobal',
				action: 'Bulk overwrite global application commands',
				routing: {
					request: {
						method: 'PUT',
						url: '=/applications/{{$parameter.applicationId}}/commands',
						body: rawJsonBody,
					},
				},
			},
			{
				name: 'Bulk Overwrite Guild',
				value: 'bulkOverwriteGuild',
				action: 'Bulk overwrite guild application commands',
				routing: {
					request: {
						method: 'PUT',
						url: '=/applications/{{$parameter.applicationId}}/guilds/{{$parameter.guildId}}/commands',
						body: rawJsonBody,
					},
				},
			},
			{
				name: 'Create Global',
				value: 'createGlobal',
				action: 'Create a global application command',
				routing: {
					request: {
						method: 'POST',
						url: '=/applications/{{$parameter.applicationId}}/commands',
						body: rawJsonBody,
					},
				},
			},
			{
				name: 'Create Guild',
				value: 'createGuild',
				action: 'Create a guild application command',
				routing: {
					request: {
						method: 'POST',
						url: '=/applications/{{$parameter.applicationId}}/guilds/{{$parameter.guildId}}/commands',
						body: rawJsonBody,
					},
				},
			},
			{
				name: 'Delete Global',
				value: 'deleteGlobal',
				action: 'Delete a global application command',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/applications/{{$parameter.applicationId}}/commands/{{$parameter.commandId}}',
					},
					output: successResponse,
				},
			},
			{
				name: 'Delete Guild',
				value: 'deleteGuild',
				action: 'Delete a guild application command',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/applications/{{$parameter.applicationId}}/guilds/{{$parameter.guildId}}/commands/{{$parameter.commandId}}',
					},
					output: successResponse,
				},
			},
			{
				name: 'Get Global',
				value: 'getGlobal',
				action: 'Get a global application command',
				routing: {
					request: {
						method: 'GET',
						url: '=/applications/{{$parameter.applicationId}}/commands/{{$parameter.commandId}}',
					},
				},
			},
			{
				name: 'Get Guild',
				value: 'getGuild',
				action: 'Get a guild application command',
				routing: {
					request: {
						method: 'GET',
						url: '=/applications/{{$parameter.applicationId}}/guilds/{{$parameter.guildId}}/commands/{{$parameter.commandId}}',
					},
				},
			},
			{
				name: 'Get Guild Command Permissions',
				value: 'getGuildCommandPermissions',
				action: 'Get guild application command permissions',
				routing: {
					request: {
						method: 'GET',
						url: '=/applications/{{$parameter.applicationId}}/guilds/{{$parameter.guildId}}/commands/{{$parameter.commandId}}/permissions',
					},
				},
			},
			{
				name: 'List Global',
				value: 'listGlobal',
				action: 'List global application commands',
				routing: {
					request: {
						method: 'GET',
						url: '=/applications/{{$parameter.applicationId}}/commands',
					},
				},
			},
			{
				name: 'List Guild',
				value: 'listGuild',
				action: 'List guild application commands',
				routing: {
					request: {
						method: 'GET',
						url: '=/applications/{{$parameter.applicationId}}/guilds/{{$parameter.guildId}}/commands',
					},
				},
			},
			{
				name: 'Update Global',
				value: 'updateGlobal',
				action: 'Update a global application command',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/applications/{{$parameter.applicationId}}/commands/{{$parameter.commandId}}',
						body: rawJsonBody,
					},
				},
			},
			{
				name: 'Update Guild',
				value: 'updateGuild',
				action: 'Update a guild application command',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/applications/{{$parameter.applicationId}}/guilds/{{$parameter.guildId}}/commands/{{$parameter.commandId}}',
						body: rawJsonBody,
					},
				},
			},
			{
				name: 'Update Guild Command Permissions',
				value: 'updateGuildCommandPermissions',
				action: 'Update guild application command permissions',
				routing: {
					request: {
						method: 'PUT',
						url: '=/applications/{{$parameter.applicationId}}/guilds/{{$parameter.guildId}}/commands/{{$parameter.commandId}}/permissions',
						body: rawJsonBody,
					},
				},
			},
		],
		default: 'listGlobal',
	},
];

export const applicationCommandFields: INodeProperties[] = [
	{
		displayName: 'Application',
		name: 'applicationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
			},
		},
		description: 'Application ID. Discord snowflake ID of the application.',
	},
	{
		displayName: 'Guild',
		name: 'guildId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: [
					'bulkOverwriteGuild',
					'createGuild',
					'deleteGuild',
					'getGuild',
					'getGuildCommandPermissions',
					'listGuild',
					'updateGuild',
					'updateGuildCommandPermissions',
				],
			},
		},
		description: 'Guild ID. Discord snowflake ID of the guild.',
	},
	{
		displayName: 'Command',
		name: 'commandId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: [
					'deleteGlobal',
					'deleteGuild',
					'getGlobal',
					'getGuild',
					'getGuildCommandPermissions',
					'updateGlobal',
					'updateGuild',
					'updateGuildCommandPermissions',
				],
			},
		},
		description: 'Application command ID. Discord snowflake ID of the command.',
	},
	{
		displayName: 'Payload',
		name: 'payload',
		type: 'json',
		default: '{}',
		required: true,
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: [
					'bulkOverwriteGlobal',
					'bulkOverwriteGuild',
					'createGlobal',
					'createGuild',
					'updateGlobal',
					'updateGuild',
					'updateGuildCommandPermissions',
				],
			},
		},
		description: 'Raw Discord JSON request body. Use an array for bulk overwrite operations.',
	},
];
