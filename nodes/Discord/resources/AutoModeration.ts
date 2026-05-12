import type { INodeProperties } from 'n8n-workflow';

import { createAuditLogReasonField } from '../shared/auditLog';
import { createRawJsonField } from '../shared/messagePayload';

const createRuleBody =
	'={{ { name: $parameter.name, event_type: $parameter.eventType, trigger_type: $parameter.triggerType, trigger_metadata: JSON.parse($parameter.triggerMetadata || "{}"), actions: JSON.parse($parameter.actions), ...($parameter.enabled !== undefined ? { enabled: $parameter.enabled } : {}), ...($parameter.exemptRoles !== "" ? { exempt_roles: $parameter.exemptRoles.split(",").map(id => id.trim()).filter(Boolean) } : {}), ...($parameter.exemptChannels !== "" ? { exempt_channels: $parameter.exemptChannels.split(",").map(id => id.trim()).filter(Boolean) } : {}) } }}';

const modifyRuleBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.eventType !== 0 ? { event_type: $parameter.eventType } : {}), ...($parameter.triggerMetadata !== "" ? { trigger_metadata: JSON.parse($parameter.triggerMetadata) } : {}), ...($parameter.actions !== "" ? { actions: JSON.parse($parameter.actions) } : {}), ...($parameter.enabled !== undefined ? { enabled: $parameter.enabled } : {}), ...($parameter.exemptRoles !== "" ? { exempt_roles: $parameter.exemptRoles.split(",").map(id => id.trim()).filter(Boolean) } : {}), ...($parameter.exemptChannels !== "" ? { exempt_channels: $parameter.exemptChannels.split(",").map(id => id.trim()).filter(Boolean) } : {}) } }}';

export const autoModerationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['autoModeration'],
			},
		},
		options: [
			{
				name: 'List Rules',
				value: 'listRules',
				action: 'List auto moderation rules',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/auto-moderation/rules',
					},
				},
			},
			{
				name: 'Get Rule',
				value: 'getRule',
				action: 'Get an auto moderation rule',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/auto-moderation/rules/{{$parameter.ruleId}}',
					},
				},
			},
			{
				name: 'Create Rule',
				value: 'createRule',
				action: 'Create an auto moderation rule',
				routing: {
					request: {
						method: 'POST',
						url: '=/guilds/{{$parameter.guildId}}/auto-moderation/rules',
						body: createRuleBody,
					},
				},
			},
			{
				name: 'Modify Rule',
				value: 'modifyRule',
				action: 'Modify an auto moderation rule',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/auto-moderation/rules/{{$parameter.ruleId}}',
						body: modifyRuleBody,
					},
				},
			},
			{
				name: 'Delete Rule',
				value: 'deleteRule',
				action: 'Delete an auto moderation rule',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/guilds/{{$parameter.guildId}}/auto-moderation/rules/{{$parameter.ruleId}}',
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
		default: 'listRules',
	},
];

export const autoModerationFields: INodeProperties[] = [
	{
		displayName: 'Guild',
		name: 'guildId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['autoModeration'],
			},
		},
		description: 'Guild ID. Discord snowflake ID of the guild.',
	},
	{
		displayName: 'Rule',
		name: 'ruleId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['getRule', 'modifyRule', 'deleteRule'],
			},
		},
		description: 'Auto moderation rule ID. Discord snowflake ID of the rule.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule'],
			},
		},
		description: 'Rule name',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['modifyRule'],
			},
		},
		description: 'Rule name',
	},
	{
		displayName: 'Event Type',
		name: 'eventType',
		type: 'options',
		default: 1,
		required: true,
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule'],
			},
		},
		options: [
			{ name: 'Message Send', value: 1 },
			{ name: 'Member Update', value: 2 },
		],
		description: 'Event type that triggers the rule',
	},
	{
		displayName: 'Event Type',
		name: 'eventType',
		type: 'options',
		default: 0,
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['modifyRule'],
			},
		},
		options: [
			{ name: 'Unchanged', value: 0 },
			{ name: 'Message Send', value: 1 },
			{ name: 'Member Update', value: 2 },
		],
		description: 'Event type that triggers the rule. Select Unchanged to omit from the request.',
	},
	{
		displayName: 'Trigger Type',
		name: 'triggerType',
		type: 'options',
		default: 1,
		required: true,
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule'],
			},
		},
		options: [
			{ name: 'Keyword', value: 1 },
			{ name: 'Spam', value: 3 },
			{ name: 'Keyword Preset', value: 4 },
			{ name: 'Mention Spam', value: 5 },
			{ name: 'Member Profile', value: 6 },
		],
		description: 'Trigger type that activates the rule',
	},
	createRawJsonField(
		'Trigger Metadata',
		'triggerMetadata',
		'Raw Discord trigger_metadata JSON object. Shape depends on trigger_type (e.g., keyword_filter, regex_patterns, presets, allow_list, mention_total_limit).',
		'{}',
		{
			default: '{}',
			displayOptions: {
				show: {
					resource: ['autoModeration'],
					operation: ['createRule'],
				},
			},
		},
	),
	createRawJsonField(
		'Trigger Metadata',
		'triggerMetadata',
		'Raw Discord trigger_metadata JSON object. Leave empty to omit. Shape depends on trigger_type.',
		'{}',
		{
			displayOptions: {
				show: {
					resource: ['autoModeration'],
					operation: ['modifyRule'],
				},
			},
		},
	),
	createRawJsonField(
		'Actions',
		'actions',
		'Raw Discord actions JSON array. Each action is {type, metadata?}. Action types: 1 BLOCK_MESSAGE, 2 SEND_ALERT_MESSAGE, 3 TIMEOUT, 4 BLOCK_MEMBER_INTERACTION.',
		'[]',
		{
			required: true,
			default: '[]',
			displayOptions: {
				show: {
					resource: ['autoModeration'],
					operation: ['createRule'],
				},
			},
		},
	),
	createRawJsonField(
		'Actions',
		'actions',
		'Raw Discord actions JSON array. Leave empty to omit. Each action is {type, metadata?}.',
		'[]',
		{
			displayOptions: {
				show: {
					resource: ['autoModeration'],
					operation: ['modifyRule'],
				},
			},
		},
	),
	{
		displayName: 'Enabled',
		name: 'enabled',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule', 'modifyRule'],
			},
		},
		description: 'Whether the rule is enabled',
	},
	{
		displayName: 'Exempt Role IDs',
		name: 'exemptRoles',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule', 'modifyRule'],
			},
		},
		description: 'Comma-separated role IDs that should not be affected by the rule',
	},
	{
		displayName: 'Exempt Channel IDs',
		name: 'exemptChannels',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule', 'modifyRule'],
			},
		},
		description: 'Comma-separated channel IDs that should not be affected by the rule',
	},
	createAuditLogReasonField({
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule', 'modifyRule', 'deleteRule'],
			},
		},
	}),
];
