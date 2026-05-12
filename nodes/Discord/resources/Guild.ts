import type { INodeProperties } from 'n8n-workflow';

import { createAuditLogReasonField } from '../shared/auditLog';
import { createRawJsonField } from '../shared/messagePayload';

const guildBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.description !== "" ? { description: $parameter.description } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

const createGuildBody =
	'={{ { name: $parameter.name, ...($parameter.icon !== "" ? { icon: $parameter.icon } : {}), ...($parameter.verificationLevel !== "" ? { verification_level: Number($parameter.verificationLevel) } : {}), ...($parameter.defaultMessageNotifications !== "" ? { default_message_notifications: Number($parameter.defaultMessageNotifications) } : {}), ...($parameter.explicitContentFilter !== "" ? { explicit_content_filter: Number($parameter.explicitContentFilter) } : {}), ...($parameter.roles !== "" ? { roles: JSON.parse($parameter.roles) } : {}), ...($parameter.channels !== "" ? { channels: JSON.parse($parameter.channels) } : {}), ...($parameter.afkChannelId !== "" ? { afk_channel_id: $parameter.afkChannelId } : {}), ...($parameter.afkTimeout !== "" ? { afk_timeout: Number($parameter.afkTimeout) } : {}), ...($parameter.systemChannelId !== "" ? { system_channel_id: $parameter.systemChannelId } : {}), ...($parameter.systemChannelFlags !== "" ? { system_channel_flags: Number($parameter.systemChannelFlags) } : {}) } }}';

const modifyChannelPositionsBody = '={{ JSON.parse($parameter.positions || "[]") }}';

const createBanBody =
	'={{ { ...($parameter.deleteMessageSeconds !== "" ? { delete_message_seconds: Number($parameter.deleteMessageSeconds) } : {}) } }}';

const beginPruneBody =
	'={{ { ...($parameter.days !== "" ? { days: Number($parameter.days) } : {}), ...($parameter.computePruneCount !== undefined ? { compute_prune_count: $parameter.computePruneCount } : {}), ...($parameter.includeRoles !== "" ? { include_roles: $parameter.includeRoles.split(",").map(id => id.trim()).filter(Boolean) } : {}), ...($parameter.reason !== "" ? { reason: $parameter.reason } : {}) } }}';

const modifyWidgetBody =
	'={{ { ...($parameter.enabled !== undefined ? { enabled: $parameter.enabled } : {}), ...($parameter.channelId !== "" ? { channel_id: $parameter.channelId } : {}) } }}';

const modifyWelcomeScreenBody =
	'={{ { ...($parameter.enabled !== undefined ? { enabled: $parameter.enabled } : {}), ...($parameter.welcomeChannels !== "" ? { welcome_channels: JSON.parse($parameter.welcomeChannels) } : {}), ...($parameter.description !== "" ? { description: $parameter.description } : {}) } }}';

const modifyOnboardingBody =
	'={{ { prompts: JSON.parse($parameter.prompts || "[]"), default_channel_ids: $parameter.defaultChannelIds === "" ? [] : $parameter.defaultChannelIds.split(",").map(id => id.trim()).filter(Boolean), enabled: $parameter.enabled, mode: Number($parameter.mode) } }}';

const modifyCurrentUserVoiceStateBody =
	'={{ { ...($parameter.channelId !== "" ? { channel_id: $parameter.channelId } : {}), ...($parameter.suppress !== undefined ? { suppress: $parameter.suppress } : {}), ...($parameter.requestToSpeakTimestamp !== "" ? { request_to_speak_timestamp: $parameter.requestToSpeakTimestamp } : {}) } }}';

const modifyUserVoiceStateBody =
	'={{ { channel_id: $parameter.channelId, ...($parameter.suppress !== undefined ? { suppress: $parameter.suppress } : {}) } }}';

export const guildOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['guild'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a guild',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}',
					},
				},
			},
			{
				name: 'Modify',
				value: 'modify',
				action: 'Modify a guild',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}',
						body: guildBody,
					},
				},
			},
			{
				name: 'Get Channels',
				value: 'getChannels',
				action: 'Get guild channels',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/channels',
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a guild',
				routing: {
					request: {
						method: 'POST',
						url: '/guilds',
						body: createGuildBody,
					},
				},
			},
			{
				name: 'Get Preview',
				value: 'getPreview',
				action: 'Get a guild preview',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/preview',
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a guild',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/guilds/{{$parameter.guildId}}',
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
			{
				name: 'Modify Channel Positions',
				value: 'modifyChannelPositions',
				action: 'Modify guild channel positions',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/channels',
						body: modifyChannelPositionsBody,
					},
				},
			},
			{
				name: 'List Active Threads',
				value: 'listActiveThreads',
				action: 'List active guild threads',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/threads/active',
					},
				},
			},
			{
				name: 'Get Bans',
				value: 'getBans',
				action: 'Get guild bans',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/bans',
					},
				},
			},
			{
				name: 'Get Ban',
				value: 'getBan',
				action: 'Get a guild ban',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/bans/{{$parameter.userId}}',
					},
				},
			},
			{
				name: 'Create Ban',
				value: 'createBan',
				action: 'Create a guild ban',
				routing: {
					request: {
						method: 'PUT',
						url: '=/guilds/{{$parameter.guildId}}/bans/{{$parameter.userId}}',
						body: createBanBody,
					},
				},
			},
			{
				name: 'Remove Ban',
				value: 'removeBan',
				action: 'Remove a guild ban',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/guilds/{{$parameter.guildId}}/bans/{{$parameter.userId}}',
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
			{
				name: 'Get Prune Count',
				value: 'getPruneCount',
				action: 'Get guild prune count',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/prune',
					},
				},
			},
			{
				name: 'Begin Prune',
				value: 'beginPrune',
				action: 'Begin a guild prune',
				routing: {
					request: {
						method: 'POST',
						url: '=/guilds/{{$parameter.guildId}}/prune',
						body: beginPruneBody,
					},
				},
			},
			{
				name: 'Get Voice Regions',
				value: 'getVoiceRegions',
				action: 'Get guild voice regions',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/regions',
					},
				},
			},
			{
				name: 'Get Invites',
				value: 'getInvites',
				action: 'Get guild invites',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/invites',
					},
				},
			},
			{
				name: 'Get Integrations',
				value: 'getIntegrations',
				action: 'Get guild integrations',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/integrations',
					},
				},
			},
			{
				name: 'Delete Integration',
				value: 'deleteIntegration',
				action: 'Delete a guild integration',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/guilds/{{$parameter.guildId}}/integrations/{{$parameter.integrationId}}',
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
			{
				name: 'Get Widget Settings',
				value: 'getWidgetSettings',
				action: 'Get guild widget settings',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/widget',
					},
				},
			},
			{
				name: 'Modify Widget',
				value: 'modifyWidget',
				action: 'Modify the guild widget',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/widget',
						body: modifyWidgetBody,
					},
				},
			},
			{
				name: 'Get Widget',
				value: 'getWidget',
				action: 'Get the guild widget',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/widget.json',
					},
				},
			},
			{
				name: 'Get Vanity URL',
				value: 'getVanityUrl',
				action: 'Get the guild vanity URL',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/vanity-url',
					},
				},
			},
			{
				name: 'Get Widget Image',
				value: 'getWidgetImage',
				action: 'Get the guild widget image',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/widget.png',
					},
				},
			},
			{
				name: 'Get Welcome Screen',
				value: 'getWelcomeScreen',
				action: 'Get the guild welcome screen',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/welcome-screen',
					},
				},
			},
			{
				name: 'Modify Welcome Screen',
				value: 'modifyWelcomeScreen',
				action: 'Modify the guild welcome screen',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/welcome-screen',
						body: modifyWelcomeScreenBody,
					},
				},
			},
			{
				name: 'Get Onboarding',
				value: 'getOnboarding',
				action: 'Get the guild onboarding',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/onboarding',
					},
				},
			},
			{
				name: 'Modify Onboarding',
				value: 'modifyOnboarding',
				action: 'Modify the guild onboarding',
				routing: {
					request: {
						method: 'PUT',
						url: '=/guilds/{{$parameter.guildId}}/onboarding',
						body: modifyOnboardingBody,
					},
				},
			},
			{
				name: 'Modify Current User Voice State',
				value: 'modifyCurrentUserVoiceState',
				action: 'Modify the current user voice state',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/voice-states/@me',
						body: modifyCurrentUserVoiceStateBody,
					},
				},
			},
			{
				name: 'Modify User Voice State',
				value: 'modifyUserVoiceState',
				action: 'Modify a user voice state',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/voice-states/{{$parameter.userId}}',
						body: modifyUserVoiceStateBody,
					},
				},
			},
			{
				name: 'Search Members',
				value: 'searchMembers',
				action: 'Search guild members',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/members/search',
					},
				},
			},
			{
				name: 'List Members',
				value: 'listMembers',
				action: 'List guild members',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/members',
					},
				},
			},
		],
		default: 'get',
	},
];

export const guildFields: INodeProperties[] = [
	{
		displayName: 'Guild',
		name: 'guildId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['guild'],
			},
			hide: {
				operation: ['create'],
			},
		},
		description: 'Guild ID. Discord snowflake ID of the guild.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['modify'],
			},
		},
		description: 'New guild name',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['modify', 'modifyWelcomeScreen'],
			},
		},
		description: 'New guild description',
	},
	{
		displayName: 'Raw JSON',
		name: 'rawJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['modify'],
			},
		},
		description: 'Additional Discord guild JSON body fields. Values here override simple fields when keys overlap.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['create'],
			},
		},
		description: 'Name of the new guild (2-100 characters)',
	},
	{
		displayName: 'Icon',
		name: 'icon',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['create'],
			},
		},
		description: 'Base64 128x128 image data URI for the guild icon',
	},
	{
		displayName: 'Verification Level',
		name: 'verificationLevel',
		type: 'options',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'High', value: '3' },
			{ name: 'Low', value: '1' },
			{ name: 'Medium', value: '2' },
			{ name: 'None', value: '0' },
			{ name: 'Unset', value: '' },
			{ name: 'Very High', value: '4' },
		],
		description: 'Verification level for the new guild',
	},
	{
		displayName: 'Default Message Notifications',
		name: 'defaultMessageNotifications',
		type: 'options',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'Unset', value: '' },
			{ name: 'All Messages', value: '0' },
			{ name: 'Only Mentions', value: '1' },
		],
		description: 'Default message notifications level',
	},
	{
		displayName: 'Explicit Content Filter',
		name: 'explicitContentFilter',
		type: 'options',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'Unset', value: '' },
			{ name: 'Disabled', value: '0' },
			{ name: 'Members Without Roles', value: '1' },
			{ name: 'All Members', value: '2' },
		],
		description: 'Explicit content filter level',
	},
	createRawJsonField(
		'Roles',
		'roles',
		'Raw Discord roles JSON array. First element overrides @everyone.',
		'[]',
		{
			displayOptions: {
				show: {
					resource: ['guild'],
					operation: ['create'],
				},
			},
		},
	),
	createRawJsonField(
		'Channels',
		'channels',
		'Raw Discord channels JSON array used to seed the new guild.',
		'[]',
		{
			displayOptions: {
				show: {
					resource: ['guild'],
					operation: ['create'],
				},
			},
		},
	),
	{
		displayName: 'AFK Channel ID',
		name: 'afkChannelId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['create'],
			},
		},
		description: 'ID for the AFK channel in the channels array',
	},
	{
		displayName: 'AFK Timeout',
		name: 'afkTimeout',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['create'],
			},
		},
		description: 'AFK timeout in seconds (60, 300, 900, 1800, 3600)',
	},
	{
		displayName: 'System Channel ID',
		name: 'systemChannelId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['create'],
			},
		},
		description: 'ID for the system channel where Discord notices are sent',
	},
	{
		displayName: 'System Channel Flags',
		name: 'systemChannelFlags',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['create'],
			},
		},
		description: 'System channel flags bitfield',
	},
	createRawJsonField(
		'Positions',
		'positions',
		'Raw Discord channel positions JSON array. Each entry is {id, position?, lock_permissions?, parent_id?}.',
		'[]',
		{
			required: true,
			default: '[]',
			displayOptions: {
				show: {
					resource: ['guild'],
					operation: ['modifyChannelPositions'],
				},
			},
		},
	),
	{
		displayName: 'User',
		name: 'userId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['getBan', 'createBan', 'removeBan', 'modifyUserVoiceState'],
			},
		},
		description: 'User ID. Discord snowflake ID of the user.',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 1000,
		},
		default: 50,
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['getBans'],
			},
		},
		description: 'Max number of results to return',
		routing: {
			request: {
				qs: {
					limit: '={{$parameter.limit}}',
				},
			},
		},
	},
	{
		displayName: 'Before',
		name: 'before',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['getBans'],
			},
		},
		description: 'Return bans before this user snowflake ID',
		routing: {
			request: {
				qs: {
					before: '={{$parameter.before || undefined}}',
				},
			},
		},
	},
	{
		displayName: 'After',
		name: 'after',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['getBans'],
			},
		},
		description: 'Return bans after this user snowflake ID',
		routing: {
			request: {
				qs: {
					after: '={{$parameter.after || undefined}}',
				},
			},
		},
	},
	{
		displayName: 'Delete Message Seconds',
		name: 'deleteMessageSeconds',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['createBan'],
			},
		},
		description: 'Number of seconds (0-604800) of message history to purge for the banned user',
	},
	{
		displayName: 'Days',
		name: 'days',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 30,
		},
		default: 7,
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['getPruneCount'],
			},
		},
		description: 'Number of days to count prune for (1-30)',
		routing: {
			request: {
				qs: {
					days: '={{$parameter.days}}',
				},
			},
		},
	},
	{
		displayName: 'Include Roles',
		name: 'includeRoles',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['getPruneCount'],
			},
		},
		description: 'Comma-separated role IDs to include in the prune count',
		routing: {
			request: {
				qs: {
					include_roles: '={{$parameter.includeRoles || undefined}}',
				},
			},
		},
	},
	{
		displayName: 'Days',
		name: 'days',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['beginPrune'],
			},
		},
		description: 'Number of days to prune (1-30). Leave empty to use the Discord default.',
	},
	{
		displayName: 'Compute Prune Count',
		name: 'computePruneCount',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['beginPrune'],
			},
		},
		description: 'Whether pruned member count is returned. Discouraged for large guilds.',
	},
	{
		displayName: 'Include Roles',
		name: 'includeRoles',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['beginPrune'],
			},
		},
		description: 'Comma-separated role snowflake IDs to include in the prune',
	},
	{
		displayName: 'Reason',
		name: 'reason',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['beginPrune'],
			},
		},
		description: 'Reason recorded for the prune (sent in the request body)',
	},
	{
		displayName: 'Integration',
		name: 'integrationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['deleteIntegration'],
			},
		},
		description: 'Integration ID. Discord snowflake ID of the integration.',
	},
	{
		displayName: 'Enabled',
		name: 'enabled',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['modifyWidget', 'modifyWelcomeScreen'],
			},
		},
		description: 'Whether the resource is enabled',
	},
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['modifyWidget', 'modifyCurrentUserVoiceState', 'modifyUserVoiceState'],
			},
		},
		description: 'Channel snowflake ID. For widget: invite channel ID (empty to clear). For voice state: target stage channel ID.',
	},
	{
		displayName: 'Style',
		name: 'style',
		type: 'options',
		default: 'shield',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['getWidgetImage'],
			},
		},
		options: [
			{ name: 'Banner 1', value: 'banner1' },
			{ name: 'Banner 2', value: 'banner2' },
			{ name: 'Banner 3', value: 'banner3' },
			{ name: 'Banner 4', value: 'banner4' },
			{ name: 'Shield', value: 'shield' },
		],
		description: 'Widget image style',
		routing: {
			request: {
				qs: {
					style: '={{$parameter.style}}',
				},
			},
		},
	},
	createRawJsonField(
		'Welcome Channels',
		'welcomeChannels',
		'Raw Discord welcome_channels JSON array. Each entry is {channel_id, description, emoji_id?, emoji_name?}.',
		'[]',
		{
			displayOptions: {
				show: {
					resource: ['guild'],
					operation: ['modifyWelcomeScreen'],
				},
			},
		},
	),
	createRawJsonField(
		'Prompts',
		'prompts',
		'Raw Discord onboarding prompts JSON array.',
		'[]',
		{
			required: true,
			default: '[]',
			displayOptions: {
				show: {
					resource: ['guild'],
					operation: ['modifyOnboarding'],
				},
			},
		},
	),
	{
		displayName: 'Default Channel IDs',
		name: 'defaultChannelIds',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['modifyOnboarding'],
			},
		},
		description: 'Comma-separated channel snowflake IDs members get opted into automatically',
	},
	{
		displayName: 'Onboarding Enabled',
		name: 'enabled',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['modifyOnboarding'],
			},
		},
		description: 'Whether onboarding is enabled in the guild',
	},
	{
		displayName: 'Onboarding Mode',
		name: 'mode',
		type: 'options',
		default: 0,
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['modifyOnboarding'],
			},
		},
		options: [
			{ name: 'Default', value: 0 },
			{ name: 'Advanced', value: 1 },
		],
		description: 'Current criteria mode for onboarding',
	},
	{
		displayName: 'Suppress',
		name: 'suppress',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['modifyCurrentUserVoiceState', 'modifyUserVoiceState'],
			},
		},
		description: 'Whether to toggle the user suppress state (move between audience and speakers)',
	},
	{
		displayName: 'Request To Speak Timestamp',
		name: 'requestToSpeakTimestamp',
		type: 'string',
		default: '',
		placeholder: '2024-01-01T00:00:00.000Z',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['modifyCurrentUserVoiceState'],
			},
		},
		description: 'ISO8601 timestamp to set or clear the request to speak. Send empty to omit.',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['searchMembers'],
			},
		},
		description: 'Query string to match username(s) and nickname(s) against (prefix match)',
		routing: {
			request: {
				qs: {
					query: '={{$parameter.query}}',
				},
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 1000,
		},
		default: 50,
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['searchMembers', 'listMembers'],
			},
		},
		description: 'Max number of results to return',
		routing: {
			request: {
				qs: {
					limit: '={{$parameter.limit}}',
				},
			},
		},
	},
	{
		displayName: 'After',
		name: 'after',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: ['listMembers'],
			},
		},
		description: 'Highest user ID in the previous page',
		routing: {
			request: {
				qs: {
					after: '={{$parameter.after || undefined}}',
				},
			},
		},
	},
	createAuditLogReasonField({
		displayOptions: {
			show: {
				resource: ['guild'],
				operation: [
					'modifyChannelPositions',
					'createBan',
					'removeBan',
					'beginPrune',
					'deleteIntegration',
					'modifyWidget',
					'modifyWelcomeScreen',
					'modifyOnboarding',
				],
			},
		},
	}),
];
