import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

import { createRawJsonField, parseOptionalJsonField } from '../shared/messagePayload';
import {
	aggregateDiscordPermissions,
	discordPermissionOptions,
	type DiscordPermissionName,
} from '../shared/permissions';

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

// Approach: create/edit operations use a preSend hook to assemble the body so we
// can compose the guided `commandOptions` builder, the guided localization
// collections, and the guided permission flags alongside the raw `payload`
// escape hatch. Bulk overwrite still uses the raw payload only. Precedence for
// merges is documented near each merge site.
const rawJsonBody = '={{ JSON.parse($parameter.payload) }}';

const createEditOperations = ['createGlobal', 'createGuild', 'updateGlobal', 'updateGuild'];
const globalCreateEditOperations = ['createGlobal', 'updateGlobal'];

const slashCommandOptions = createEditOperations;

// Discord-supported locale codes (30 locales). Names use Title Case (no
// parenthesized locale codes, to comply with n8n display-name lint rules).
const DISCORD_LOCALE_OPTIONS = [
	{ name: 'Bulgarian', value: 'bg' },
	{ name: 'Chinese China', value: 'zh-CN' },
	{ name: 'Chinese Taiwan', value: 'zh-TW' },
	{ name: 'Croatian', value: 'hr' },
	{ name: 'Czech', value: 'cs' },
	{ name: 'Danish', value: 'da' },
	{ name: 'Dutch', value: 'nl' },
	{ name: 'English Uk', value: 'en-GB' },
	{ name: 'English Us', value: 'en-US' },
	{ name: 'Finnish', value: 'fi' },
	{ name: 'French', value: 'fr' },
	{ name: 'German', value: 'de' },
	{ name: 'Greek', value: 'el' },
	{ name: 'Hindi', value: 'hi' },
	{ name: 'Hungarian', value: 'hu' },
	{ name: 'Indonesian', value: 'id' },
	{ name: 'Italian', value: 'it' },
	{ name: 'Japanese', value: 'ja' },
	{ name: 'Korean', value: 'ko' },
	{ name: 'Lithuanian', value: 'lt' },
	{ name: 'Norwegian', value: 'no' },
	{ name: 'Polish', value: 'pl' },
	{ name: 'Portuguese Brazilian', value: 'pt-BR' },
	{ name: 'Romanian', value: 'ro' },
	{ name: 'Russian', value: 'ru' },
	{ name: 'Spanish', value: 'es-ES' },
	{ name: 'Spanish Latam', value: 'es-419' },
	{ name: 'Swedish', value: 'sv-SE' },
	{ name: 'Thai', value: 'th' },
	{ name: 'Turkish', value: 'tr' },
	{ name: 'Ukrainian', value: 'uk' },
	{ name: 'Vietnamese', value: 'vi' },
];

const APPLICATION_COMMAND_OPTION_TYPE_OPTIONS = [
	{ name: 'Sub Command (1)', value: 1 },
	{ name: 'Sub Command Group (2)', value: 2 },
	{ name: 'String (3)', value: 3 },
	{ name: 'Integer (4)', value: 4 },
	{ name: 'Boolean (5)', value: 5 },
	{ name: 'User (6)', value: 6 },
	{ name: 'Channel (7)', value: 7 },
	{ name: 'Role (8)', value: 8 },
	{ name: 'Mentionable (9)', value: 9 },
	{ name: 'Number (10)', value: 10 },
	{ name: 'Attachment (11)', value: 11 },
];

const CHANNEL_TYPE_OPTIONS = [
	{ name: 'Guild Text (0)', value: 0 },
	{ name: 'DM (1)', value: 1 },
	{ name: 'Guild Voice (2)', value: 2 },
	{ name: 'Group DM (3)', value: 3 },
	{ name: 'Guild Category (4)', value: 4 },
	{ name: 'Guild Announcement (5)', value: 5 },
	{ name: 'Announcement Thread (10)', value: 10 },
	{ name: 'Public Thread (11)', value: 11 },
	{ name: 'Private Thread (12)', value: 12 },
	{ name: 'Guild Stage Voice (13)', value: 13 },
	{ name: 'Guild Directory (14)', value: 14 },
	{ name: 'Guild Forum (15)', value: 15 },
	{ name: 'Guild Media (16)', value: 16 },
];

function buildLocalizationsMap(raw: unknown): Record<string, string> {
	if (!raw || typeof raw !== 'object') return {};
	const entries = (raw as IDataObject).entry;
	if (!Array.isArray(entries)) return {};
	const map: Record<string, string> = {};
	for (const entry of entries) {
		if (!entry || typeof entry !== 'object') continue;
		const record = entry as IDataObject;
		const locale = typeof record.locale === 'string' ? record.locale.trim() : '';
		const value = typeof record.value === 'string' ? record.value : '';
		if (locale === '' || value === '') continue;
		map[locale] = value;
	}
	return map;
}

function buildCommandOptions(raw: unknown): IDataObject[] {
	if (!raw || typeof raw !== 'object') return [];
	const entries = (raw as IDataObject).option;
	if (!Array.isArray(entries)) return [];

	const result: IDataObject[] = [];
	for (const entry of entries) {
		if (!entry || typeof entry !== 'object') continue;
		const record = entry as IDataObject;
		const type = typeof record.type === 'number' ? record.type : Number(record.type);
		if (!Number.isFinite(type)) continue;
		const name = typeof record.name === 'string' ? record.name.trim() : '';
		const description = typeof record.description === 'string' ? record.description.trim() : '';
		if (name === '' || description === '') continue;

		const option: IDataObject = { type, name, description };

		// `required` does not apply to sub_command (1) / sub_command_group (2).
		if (type !== 1 && type !== 2 && record.required === true) {
			option.required = true;
		}

		// Choices apply to STRING (3), INTEGER (4), NUMBER (10).
		if (type === 3 || type === 4 || type === 10) {
			const choices = parseOptionalJsonField<IDataObject[]>(record.choices, 'Option Choices');
			if (Array.isArray(choices) && choices.length > 0) {
				option.choices = choices as unknown as IDataObject[];
			}
			if (record.autocomplete === true) {
				option.autocomplete = true;
			}
		}

		// min/max value for INTEGER (4) / NUMBER (10).
		if (type === 4 || type === 10) {
			if (typeof record.min_value === 'number') option.min_value = record.min_value;
			if (typeof record.max_value === 'number') option.max_value = record.max_value;
		}

		// min/max length for STRING (3).
		if (type === 3) {
			if (typeof record.min_length === 'number') option.min_length = record.min_length;
			if (typeof record.max_length === 'number') option.max_length = record.max_length;
		}

		// channel_types for CHANNEL (7).
		if (type === 7 && Array.isArray(record.channel_types) && record.channel_types.length > 0) {
			option.channel_types = record.channel_types as IDataObject[];
		}

		const nameLocs = parseOptionalJsonField<IDataObject>(record.name_localizations, 'Option Name Localizations');
		if (nameLocs && typeof nameLocs === 'object' && Object.keys(nameLocs).length > 0) {
			option.name_localizations = nameLocs;
		}
		const descLocs = parseOptionalJsonField<IDataObject>(
			record.description_localizations,
			'Option Description Localizations',
		);
		if (descLocs && typeof descLocs === 'object' && Object.keys(descLocs).length > 0) {
			option.description_localizations = descLocs;
		}

		// SUB_COMMAND (1) / SUB_COMMAND_GROUP (2) can nest their own options.
		// Nested guided UI in n8n fixedCollection is too clunky; keep raw JSON for the nested level.
		if (type === 1 || type === 2) {
			const nested = parseOptionalJsonField<IDataObject[]>(record.nested_options, 'Nested Options');
			if (Array.isArray(nested) && nested.length > 0) {
				option.options = nested as unknown as IDataObject[];
			}
		}

		result.push(option);
	}
	return result;
}

function readStringParam(ctx: IExecuteSingleFunctions, name: string): string {
	try {
		const v = ctx.getNodeParameter(name, '') as unknown;
		return typeof v === 'string' ? v : '';
	} catch {
		return '';
	}
}

function readBooleanParam(ctx: IExecuteSingleFunctions, name: string, fallback: boolean): boolean {
	try {
		const v = ctx.getNodeParameter(name, fallback) as unknown;
		return typeof v === 'boolean' ? v : fallback;
	} catch {
		return fallback;
	}
}

function readNumberParam(ctx: IExecuteSingleFunctions, name: string, fallback: number): number {
	try {
		const v = ctx.getNodeParameter(name, fallback) as unknown;
		if (typeof v === 'number' && Number.isFinite(v)) return v;
		const n = Number(v);
		return Number.isFinite(n) ? n : fallback;
	} catch {
		return fallback;
	}
}

function readArrayParam(ctx: IExecuteSingleFunctions, name: string): unknown[] {
	try {
		const v = ctx.getNodeParameter(name, []) as unknown;
		return Array.isArray(v) ? v : [];
	} catch {
		return [];
	}
}

function readObjectParam(ctx: IExecuteSingleFunctions, name: string): unknown {
	try {
		return ctx.getNodeParameter(name, {});
	} catch {
		return {};
	}
}

export async function presendApplicationCommand(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const operation = this.getNodeParameter('operation', '') as string;

	// Start from the raw payload as the base. Typed fields below override raw
	// keys (preserves the prior "typed fields take precedence" behavior).
	const payloadRaw = readStringParam(this, 'payload');
	let body: IDataObject = {};
	if (payloadRaw && payloadRaw.trim() !== '' && payloadRaw.trim() !== '{}') {
		const parsed = parseOptionalJsonField<IDataObject>(payloadRaw, 'Payload');
		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
			body = { ...(parsed as IDataObject) };
		} else if (Array.isArray(parsed)) {
			// Bulk-style array in non-bulk op: pass through unchanged.
			return { ...requestOptions, body: parsed };
		}
	}

	const commandType = readNumberParam(this, 'command_type', 1);
	if (Number.isFinite(commandType)) body.type = commandType;

	const contexts = readArrayParam(this, 'contexts');
	if (
		(operation === 'createGlobal' || operation === 'updateGlobal') &&
		Array.isArray(contexts) &&
		contexts.length > 0
	) {
		body.contexts = contexts as IDataObject[];
	}

	const integrationTypes = readArrayParam(this, 'integration_types');
	if (
		(operation === 'createGlobal' || operation === 'updateGlobal') &&
		Array.isArray(integrationTypes) &&
		integrationTypes.length > 0
	) {
		body.integration_types = integrationTypes as IDataObject[];
	}

	// default_member_permissions precedence: the guided flags field overrides
	// the raw string field when it has selections. (Documented choice.)
	const permFlags = readArrayParam(this, 'defaultMemberPermissionsFlags');
	if (Array.isArray(permFlags) && permFlags.length > 0) {
		body.default_member_permissions = aggregateDiscordPermissions(
			permFlags as Array<DiscordPermissionName | string>,
		);
	} else {
		const permString = readStringParam(this, 'default_member_permissions');
		if (permString !== '') body.default_member_permissions = permString;
	}

	if (operation === 'createGlobal' || operation === 'updateGlobal') {
		const dmPermission = readBooleanParam(this, 'dm_permission', true);
		body.dm_permission = dmPermission;
	}

	const nsfw = readBooleanParam(this, 'nsfw', false);
	if (nsfw === true) body.nsfw = true;

	// Localizations: assemble guided maps first, then merge raw JSON. Raw JSON
	// wins on key conflicts to keep prior precedence (typed fields had send.property,
	// which is applied last; here we mirror that by letting raw JSON override).
	const nameLocFromBuilder = buildLocalizationsMap(readObjectParam(this, 'nameLocalizationsCollection'));
	const nameLocRaw = parseOptionalJsonField<Record<string, string>>(
		readStringParam(this, 'name_localizations'),
		'Name Localizations',
	);
	const nameLocMerged: Record<string, string> = { ...nameLocFromBuilder, ...(nameLocRaw ?? {}) };
	if (Object.keys(nameLocMerged).length > 0) body.name_localizations = nameLocMerged;

	const descLocFromBuilder = buildLocalizationsMap(
		readObjectParam(this, 'descriptionLocalizationsCollection'),
	);
	const descLocRaw = parseOptionalJsonField<Record<string, string>>(
		readStringParam(this, 'description_localizations'),
		'Description Localizations',
	);
	const descLocMerged: Record<string, string> = { ...descLocFromBuilder, ...(descLocRaw ?? {}) };
	if (Object.keys(descLocMerged).length > 0) body.description_localizations = descLocMerged;

	// commandOptions builder applies only to slash commands (command_type === 1).
	if (commandType === 1) {
		const options = buildCommandOptions(readObjectParam(this, 'commandOptions'));
		if (options.length > 0) body.options = options as unknown as IDataObject[];
	}

	return {
		...requestOptions,
		body,
		json: true,
	};
}

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
					send: {
						preSend: [presendApplicationCommand],
					},
					request: {
						method: 'POST',
						url: '=/applications/{{$parameter.applicationId}}/commands',
					},
				},
			},
			{
				name: 'Create Guild',
				value: 'createGuild',
				action: 'Create a guild application command',
				routing: {
					send: {
						preSend: [presendApplicationCommand],
					},
					request: {
						method: 'POST',
						url: '=/applications/{{$parameter.applicationId}}/guilds/{{$parameter.guildId}}/commands',
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
					send: {
						preSend: [presendApplicationCommand],
					},
					request: {
						method: 'PATCH',
						url: '=/applications/{{$parameter.applicationId}}/commands/{{$parameter.commandId}}',
					},
				},
			},
			{
				name: 'Update Guild',
				value: 'updateGuild',
				action: 'Update a guild application command',
				routing: {
					send: {
						preSend: [presendApplicationCommand],
					},
					request: {
						method: 'PATCH',
						url: '=/applications/{{$parameter.applicationId}}/guilds/{{$parameter.guildId}}/commands/{{$parameter.commandId}}',
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
		placeholder: 'e.g. 123456789012345678',
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
		placeholder: 'e.g. 123456789012345678',
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
		placeholder: 'e.g. 123456789012345678',
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
	},
	{
		displayName: 'Command Options',
		name: 'commandOptions',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Option' },
		default: {},
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: slashCommandOptions,
				command_type: [1],
			},
		},
		description: 'Guided builder for slash command options. Only applies to CHAT_INPUT (slash) commands.',
		// Inner fields are alphabetized by displayName to satisfy n8n lint rules.
		// Nested guided UI for sub_command / sub_command_group is too clunky; the nested_options raw JSON below is the escape hatch for the nested level.
		options: [
			{
				displayName: 'Option',
				name: 'option',
				values: [
					{
						displayName: 'Autocomplete',
						name: 'autocomplete',
						type: 'boolean',
						default: false,
						displayOptions: {
							show: {
								type: [3, 4, 10],
							},
						},
						description: 'Whether autocomplete interactions are enabled. Only applies to STRING / INTEGER / NUMBER.',
					},
					{
						displayName: 'Channel Types',
						name: 'channel_types',
						type: 'multiOptions',
						default: [],
						options: CHANNEL_TYPE_OPTIONS,
						displayOptions: {
							show: {
								type: [7],
							},
						},
						description: 'Allowed channel types. Only applies to CHANNEL.',
					},
					{
						displayName: 'Choices',
						name: 'choices',
						type: 'json',
						default: '',
						placeholder: '[{"name":"Red","value":"red"},{"name":"Blue","value":"blue"}]',
						displayOptions: {
							show: {
								type: [3, 4, 10],
							},
						},
						description: 'Raw JSON array of {name, value} choice objects. Only applies to STRING / INTEGER / NUMBER.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						required: true,
						description: 'Option description (1-100 characters)',
					},
					{
						displayName: 'Description Localizations',
						name: 'description_localizations',
						type: 'json',
						default: '',
						placeholder: '{"en-US":"A color","de":"Eine Farbe"}',
						description: 'Raw JSON locale-to-string map for the option description',
					},
					{
						displayName: 'Max Length',
						name: 'max_length',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 1, maxValue: 6000 },
						displayOptions: {
							show: {
								type: [3],
							},
						},
						description: 'Maximum allowed length. Only applies to STRING.',
					},
					{
						displayName: 'Max Value',
						name: 'max_value',
						type: 'number',
						default: 0,
						displayOptions: {
							show: {
								type: [4, 10],
							},
						},
						description: 'Maximum permitted value. Only applies to INTEGER / NUMBER.',
					},
					{
						displayName: 'Min Length',
						name: 'min_length',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 0, maxValue: 6000 },
						displayOptions: {
							show: {
								type: [3],
							},
						},
						description: 'Minimum allowed length. Only applies to STRING.',
					},
					{
						displayName: 'Min Value',
						name: 'min_value',
						type: 'number',
						default: 0,
						displayOptions: {
							show: {
								type: [4, 10],
							},
						},
						description: 'Minimum permitted value. Only applies to INTEGER / NUMBER.',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						required: true,
						description: 'Option name (1-32 characters)',
					},
					{
						displayName: 'Name Localizations',
						name: 'name_localizations',
						type: 'json',
						default: '',
						placeholder: '{"en-US":"color","de":"farbe"}',
						description: 'Raw JSON locale-to-string map for the option name',
					},
					{
						displayName: 'Nested Options',
						name: 'nested_options',
						type: 'json',
						default: '',
						placeholder: '[{"type":3,"name":"text","description":"text","required":true}]',
						displayOptions: {
							show: {
								type: [1, 2],
							},
						},
						description: 'Raw JSON array of nested options for sub_command / sub_command_group',
					},
					{
						displayName: 'Required',
						name: 'required',
						type: 'boolean',
						default: false,
						displayOptions: {
							hide: {
								type: [1, 2],
							},
						},
						description: 'Whether the option is required. Not applicable to sub_command / sub_command_group.',
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						default: 3,
						required: true,
						options: APPLICATION_COMMAND_OPTION_TYPE_OPTIONS,
						description: 'Application command option type',
					},
				],
			},
		],
	},
	{
		displayName: 'Name Localizations (Guided)',
		name: 'nameLocalizationsCollection',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Locale' },
		default: {},
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: createEditOperations,
			},
		},
		description:
			'Guided builder for the command name_localizations map. Merged with the raw JSON field below; raw JSON wins on key conflicts.',
		options: [
			{
				displayName: 'Entry',
				name: 'entry',
				values: [
					{
						displayName: 'Locale',
						name: 'locale',
						type: 'options',
						default: 'en-US',
						options: DISCORD_LOCALE_OPTIONS,
						description: 'Discord locale code',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Localized command name',
					},
				],
			},
		],
	},
	{
		...createRawJsonField(
			'Name Localizations',
			'name_localizations',
			'Localization dictionary for the command name. JSON object mapping Discord locale codes to localized names. Merged with the guided builder above; this raw JSON wins on key conflicts.',
			'{"en-US":"hello","de":"hallo"}',
		),
		default: '{}',
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: createEditOperations,
			},
		},
	},
	{
		displayName: 'Description Localizations (Guided)',
		name: 'descriptionLocalizationsCollection',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Locale' },
		default: {},
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: createEditOperations,
			},
		},
		description:
			'Guided builder for the command description_localizations map. Merged with the raw JSON field below; raw JSON wins on key conflicts.',
		options: [
			{
				displayName: 'Entry',
				name: 'entry',
				values: [
					{
						displayName: 'Locale',
						name: 'locale',
						type: 'options',
						default: 'en-US',
						options: DISCORD_LOCALE_OPTIONS,
						description: 'Discord locale code',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Localized command description',
					},
				],
			},
		],
	},
	{
		...createRawJsonField(
			'Description Localizations',
			'description_localizations',
			'Localization dictionary for the command description. JSON object mapping Discord locale codes to localized descriptions. Merged with the guided builder above; this raw JSON wins on key conflicts.',
			'{"en-US":"Say hi","de":"Sag hallo"}',
		),
		default: '{}',
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: createEditOperations,
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
	},
	{
		displayName: 'Default Member Permissions (Flags)',
		name: 'defaultMemberPermissionsFlags',
		type: 'multiOptions',
		default: [],
		options: discordPermissionOptions,
		displayOptions: {
			show: {
				resource: ['applicationCommand'],
				operation: createEditOperations,
			},
		},
		// Precedence: when this guided field has any selections, the aggregated bitfield
		// overrides the raw string field below.
		description:
			'Guided permission flags. When selections are present they override the raw bitfield string below; otherwise the string is used as-is.',
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
		description:
			'Default member permissions required to use the command, as a stringified bitfield (e.g. "8" for ADMINISTRATOR). Set to "0" to disable for everyone by default. Overridden by the guided flags field above when that field has selections.',
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
	},
];
