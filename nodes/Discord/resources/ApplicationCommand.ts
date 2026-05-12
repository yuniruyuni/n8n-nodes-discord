import type { INodeProperties } from 'n8n-workflow';

import { createRawJsonField } from '../shared/messagePayload';

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

// Individual fields below merge over the raw `payload` keys: when both are
// provided, the typed fields take precedence (n8n applies send.property after
// the body expression is evaluated).
const rawJsonBody = '={{ JSON.parse($parameter.payload) }}';

const createEditOperations = ['createGlobal', 'createGuild', 'updateGlobal', 'updateGuild'];
const globalCreateEditOperations = ['createGlobal', 'updateGlobal'];

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
		description:
			'Raw Discord JSON request body. Use an array for bulk overwrite operations. When the typed fields below are also set, they override matching keys in this payload.',
	},
	{
		displayName: 'Command Type',
		name: 'command_type',
		type: 'options',
		default: 1,
		options: [
			{ name: 'Chat Input (Slash)', value: 1 },
			{ name: 'User', value: 2 },
			{ name: 'Message', value: 3 },
		],
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: createEditOperations,
			},
		},
		description: 'Type of application command. Defaults to CHAT_INPUT (slash command).',
		routing: {
			send: {
				type: 'body',
				property: 'type',
			},
		},
	},
	{
		...createRawJsonField(
			'Name Localizations',
			'name_localizations',
			'Localization dictionary for the command name. JSON object mapping Discord locale codes to localized names.',
			'{"en-US":"hello","de":"hallo"}',
		),
		default: '{}',
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: createEditOperations,
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'name_localizations',
				value: '={{ (() => { const v = JSON.parse($value || "{}"); return Object.keys(v).length ? v : undefined; })() }}',
			},
		},
	},
	{
		...createRawJsonField(
			'Description Localizations',
			'description_localizations',
			'Localization dictionary for the command description. JSON object mapping Discord locale codes to localized descriptions.',
			'{"en-US":"Say hi","de":"Sag hallo"}',
		),
		default: '{}',
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: createEditOperations,
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'description_localizations',
				value: '={{ (() => { const v = JSON.parse($value || "{}"); return Object.keys(v).length ? v : undefined; })() }}',
			},
		},
	},
	{
		displayName: 'Contexts',
		name: 'contexts',
		type: 'multiOptions',
		default: [],
		options: [
			{ name: 'GUILD', value: 0 },
			{ name: 'BOT_DM', value: 1 },
			{ name: 'PRIVATE_CHANNEL', value: 2 },
		],
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: globalCreateEditOperations,
			},
		},
		description: 'Interaction contexts where the command can be used. Applies to global commands.',
		routing: {
			send: {
				type: 'body',
				property: 'contexts',
				value: '={{ Array.isArray($value) && $value.length ? $value : undefined }}',
			},
		},
	},
	{
		displayName: 'Integration Types',
		name: 'integration_types',
		type: 'multiOptions',
		default: [],
		options: [
			{ name: 'GUILD_INSTALL', value: 0 },
			{ name: 'USER_INSTALL', value: 1 },
		],
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: globalCreateEditOperations,
			},
		},
		description: 'Installation contexts where the command is available. Applies to global commands.',
		routing: {
			send: {
				type: 'body',
				property: 'integration_types',
				value: '={{ Array.isArray($value) && $value.length ? $value : undefined }}',
			},
		},
	},
	{
		displayName: 'Default Member Permissions',
		name: 'default_member_permissions',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: createEditOperations,
			},
		},
		// A guided selector backed by shared/permissions.ts is a future polish.
		description:
			'Default member permissions required to use the command, as a stringified bitfield (e.g. "8" for ADMINISTRATOR). Set to "0" to disable for everyone by default.',
		routing: {
			send: {
				type: 'body',
				property: 'default_member_permissions',
				value: '={{ $value === "" ? undefined : $value }}',
			},
		},
	},
	{
		displayName: 'DM Permission',
		name: 'dm_permission',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: globalCreateEditOperations,
			},
		},
		description: 'Whether the command is available in DMs with the bot. Legacy field, superseded by the Contexts field.',
		routing: {
			send: {
				type: 'body',
				property: 'dm_permission',
			},
		},
	},
	{
		displayName: 'NSFW',
		name: 'nsfw',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: createEditOperations,
			},
		},
		description: 'Whether the command is age-restricted (NSFW)',
		routing: {
			send: {
				type: 'body',
				property: 'nsfw',
			},
		},
	},
];
