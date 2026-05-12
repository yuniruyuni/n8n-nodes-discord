import {
	NodeOperationError,
	type IDataObject,
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

import { createAuditLogReasonField } from '../shared/auditLog';
import { createRawJsonField, parseOptionalJsonField } from '../shared/messagePayload';

// Limits per Discord docs (auto-moderation-rule-object-trigger-metadata).
const MAX_KEYWORD_FILTER_ENTRIES = 1000;
const MAX_KEYWORD_FILTER_ENTRY_LEN = 60;
const MAX_REGEX_PATTERNS = 10;
const MAX_REGEX_PATTERN_LEN = 260;
const MAX_ALLOW_LIST_ENTRIES = 100;
const MAX_ALLOW_LIST_ENTRY_LEN = 60;
const MAX_MENTION_TOTAL_LIMIT = 50;
const MAX_TIMEOUT_DURATION_SECONDS = 2419200; // 28 days
const MAX_BLOCK_MESSAGE_CUSTOM_MESSAGE_LEN = 200;

function splitCsv(value: unknown): string[] {
	if (typeof value !== 'string' || value === '') {
		return [];
	}
	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

function ensureMaxEntries(
	ctx: IExecuteSingleFunctions,
	entries: string[],
	max: number,
	fieldLabel: string,
): void {
	if (entries.length > max) {
		throw new NodeOperationError(
			ctx.getNode(),
			`${fieldLabel}: Discord allows at most ${max} entries (received ${entries.length}).`,
		);
	}
}

function ensureMaxLength(
	ctx: IExecuteSingleFunctions,
	entries: string[],
	maxLen: number,
	fieldLabel: string,
): void {
	for (const entry of entries) {
		if (entry.length > maxLen) {
			throw new NodeOperationError(
				ctx.getNode(),
				`${fieldLabel}: entry "${entry}" exceeds ${maxLen} characters.`,
			);
		}
	}
}

function buildGuidedTriggerMetadata(
	ctx: IExecuteSingleFunctions,
	triggerType: number,
): IDataObject {
	const guided: IDataObject = {};

	if (triggerType === 1 || triggerType === 6) {
		const keywordFilter = splitCsv(ctx.getNodeParameter('keywordFilter', ''));
		ensureMaxEntries(ctx, keywordFilter, MAX_KEYWORD_FILTER_ENTRIES, 'Keyword Filter');
		ensureMaxLength(ctx, keywordFilter, MAX_KEYWORD_FILTER_ENTRY_LEN, 'Keyword Filter');
		if (keywordFilter.length > 0) {
			guided.keyword_filter = keywordFilter;
		}

		const regexPatterns = splitCsv(ctx.getNodeParameter('regexPatterns', ''));
		ensureMaxEntries(ctx, regexPatterns, MAX_REGEX_PATTERNS, 'Regex Patterns');
		ensureMaxLength(ctx, regexPatterns, MAX_REGEX_PATTERN_LEN, 'Regex Patterns');
		if (regexPatterns.length > 0) {
			guided.regex_patterns = regexPatterns;
		}

		const allowList = splitCsv(ctx.getNodeParameter('allowList', ''));
		ensureMaxEntries(ctx, allowList, MAX_ALLOW_LIST_ENTRIES, 'Allow List');
		ensureMaxLength(ctx, allowList, MAX_ALLOW_LIST_ENTRY_LEN, 'Allow List');
		if (allowList.length > 0) {
			guided.allow_list = allowList;
		}
	} else if (triggerType === 4) {
		const presetsRaw = ctx.getNodeParameter('presets', []) as unknown;
		const presets = Array.isArray(presetsRaw)
			? presetsRaw
					.map((entry) => (typeof entry === 'number' ? entry : Number(entry)))
					.filter((entry) => Number.isFinite(entry))
			: [];
		if (presets.length > 0) {
			guided.presets = presets;
		}

		const allowList = splitCsv(ctx.getNodeParameter('allowList', ''));
		ensureMaxEntries(ctx, allowList, MAX_ALLOW_LIST_ENTRIES, 'Allow List');
		ensureMaxLength(ctx, allowList, MAX_ALLOW_LIST_ENTRY_LEN, 'Allow List');
		if (allowList.length > 0) {
			guided.allow_list = allowList;
		}
	} else if (triggerType === 5) {
		const mentionTotalLimit = ctx.getNodeParameter('mentionTotalLimit', 0) as number;
		if (typeof mentionTotalLimit === 'number' && mentionTotalLimit > 0) {
			if (mentionTotalLimit > MAX_MENTION_TOTAL_LIMIT) {
				throw new NodeOperationError(
					ctx.getNode(),
					`Mention Total Limit must be between 1 and ${MAX_MENTION_TOTAL_LIMIT} (received ${mentionTotalLimit}).`,
				);
			}
			guided.mention_total_limit = mentionTotalLimit;
		}

		const mentionRaidProtectionEnabled = ctx.getNodeParameter(
			'mentionRaidProtectionEnabled',
			false,
		) as boolean;
		if (mentionRaidProtectionEnabled === true) {
			guided.mention_raid_protection_enabled = true;
		}
	}

	return guided;
}

function buildGuidedActions(ctx: IExecuteSingleFunctions): IDataObject[] {
	const raw = ctx.getNodeParameter('actionsCollection', {}) as unknown;
	if (!raw || typeof raw !== 'object') {
		return [];
	}

	const entries = (raw as IDataObject).action;
	if (!Array.isArray(entries)) {
		return [];
	}

	const built: IDataObject[] = [];
	for (const entry of entries) {
		if (!entry || typeof entry !== 'object') {
			continue;
		}
		const record = entry as IDataObject;
		const typeRaw = record.type;
		const type = typeof typeRaw === 'number' ? typeRaw : Number(typeRaw);
		if (!Number.isFinite(type) || type <= 0) {
			throw new NodeOperationError(ctx.getNode(), 'Action: type is required.');
		}

		const action: IDataObject = { type };
		const metadata: IDataObject = {};

		if (type === 1) {
			const customMessage =
				typeof record.customMessage === 'string' ? record.customMessage : '';
			if (customMessage !== '') {
				if (customMessage.length > MAX_BLOCK_MESSAGE_CUSTOM_MESSAGE_LEN) {
					throw new NodeOperationError(
						ctx.getNode(),
						`Action Block Message: custom_message exceeds ${MAX_BLOCK_MESSAGE_CUSTOM_MESSAGE_LEN} characters (${customMessage.length}).`,
					);
				}
				metadata.custom_message = customMessage;
			}
		} else if (type === 2) {
			const channelId =
				typeof record.channelId === 'string' ? record.channelId.trim() : '';
			if (channelId === '') {
				throw new NodeOperationError(
					ctx.getNode(),
					'Action Send Alert Message: Channel ID is required.',
				);
			}
			metadata.channel_id = channelId;
		} else if (type === 3) {
			const durationRaw = record.durationSeconds;
			const duration =
				typeof durationRaw === 'number' ? durationRaw : Number(durationRaw);
			if (!Number.isFinite(duration) || duration <= 0) {
				throw new NodeOperationError(
					ctx.getNode(),
					'Action Timeout: Duration Seconds must be a positive number.',
				);
			}
			if (duration > MAX_TIMEOUT_DURATION_SECONDS) {
				throw new NodeOperationError(
					ctx.getNode(),
					`Action Timeout: Duration Seconds must not exceed ${MAX_TIMEOUT_DURATION_SECONDS} (28 days).`,
				);
			}
			metadata.duration_seconds = duration;
		}

		if (Object.keys(metadata).length > 0) {
			action.metadata = metadata;
		}
		built.push(action);
	}

	return built;
}

function splitSnowflakeCsv(value: unknown): string[] {
	if (typeof value !== 'string' || value === '') {
		return [];
	}
	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

// Build the full body for create/modify. Guided fields take precedence over raw
// JSON escape hatches when both define the same key.
function buildRuleBody(
	ctx: IExecuteSingleFunctions,
	mode: 'create' | 'modify',
): IDataObject {
	const body: IDataObject = {};

	const name = ctx.getNodeParameter('name', '') as string;
	if (mode === 'create') {
		body.name = name;
	} else if (typeof name === 'string' && name !== '') {
		body.name = name;
	}

	const eventType = ctx.getNodeParameter('eventType', 0) as number;
	if (mode === 'create') {
		body.event_type = eventType;
	} else if (typeof eventType === 'number' && eventType !== 0) {
		body.event_type = eventType;
	}

	let triggerType: number | undefined;
	if (mode === 'create') {
		triggerType = ctx.getNodeParameter('triggerType', 1) as number;
		body.trigger_type = triggerType;
	} else {
		// Modify mode: trigger_type field is not present in the existing UI, so
		// guided trigger_metadata builders are gated on createRule only. We still
		// honor the raw triggerMetadata escape hatch.
		triggerType = undefined;
	}

	// Raw trigger_metadata first; guided fields will override on key collision.
	const triggerMetadataRaw = ctx.getNodeParameter('triggerMetadata', '') as unknown;
	const rawTriggerMetadata =
		parseOptionalJsonField<IDataObject>(triggerMetadataRaw, 'Trigger Metadata') ?? {};

	let mergedTriggerMetadata: IDataObject = { ...rawTriggerMetadata };
	if (mode === 'create' && typeof triggerType === 'number') {
		const guided = buildGuidedTriggerMetadata(ctx, triggerType);
		mergedTriggerMetadata = { ...mergedTriggerMetadata, ...guided };
	}

	if (mode === 'create') {
		body.trigger_metadata = mergedTriggerMetadata;
	} else if (Object.keys(mergedTriggerMetadata).length > 0) {
		body.trigger_metadata = mergedTriggerMetadata;
	}

	// Actions: raw first, then guided appended; guided entries take precedence by
	// being concatenated. (Discord interprets the array as a list, not a map, so
	// "precedence" here means guided entries are surfaced alongside raw ones.)
	const actionsRaw = ctx.getNodeParameter('actions', '') as unknown;
	const rawActions = parseOptionalJsonField<IDataObject[]>(actionsRaw, 'Actions');
	const guidedActions = buildGuidedActions(ctx);

	const combinedActions: IDataObject[] = [];
	if (Array.isArray(rawActions)) {
		combinedActions.push(...rawActions);
	}
	combinedActions.push(...guidedActions);

	if (mode === 'create') {
		if (combinedActions.length === 0) {
			throw new NodeOperationError(
				ctx.getNode(),
				'At least one action is required when creating an auto moderation rule.',
			);
		}
		body.actions = combinedActions;
	} else if (combinedActions.length > 0) {
		body.actions = combinedActions;
	}

	const enabled = ctx.getNodeParameter('enabled', undefined) as boolean | undefined;
	if (enabled !== undefined) {
		body.enabled = enabled;
	}

	const exemptRoles = splitSnowflakeCsv(ctx.getNodeParameter('exemptRoles', ''));
	if (exemptRoles.length > 0) {
		body.exempt_roles = exemptRoles;
	}

	const exemptChannels = splitSnowflakeCsv(ctx.getNodeParameter('exemptChannels', ''));
	if (exemptChannels.length > 0) {
		body.exempt_channels = exemptChannels;
	}

	return body;
}

export async function presendAutoModerationCreateRule(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = buildRuleBody(this, 'create');
	const headers = { ...(requestOptions.headers ?? {}) };
	(headers as Record<string, string>)['Content-Type'] = 'application/json';
	return {
		...requestOptions,
		body,
		json: true,
		headers,
	};
}

export async function presendAutoModerationModifyRule(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = buildRuleBody(this, 'modify');
	const headers = { ...(requestOptions.headers ?? {}) };
	(headers as Record<string, string>)['Content-Type'] = 'application/json';
	return {
		...requestOptions,
		body,
		json: true,
		headers,
	};
}

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
					send: {
						preSend: [presendAutoModerationCreateRule],
					},
					request: {
						method: 'POST',
						url: '=/guilds/{{$parameter.guildId}}/auto-moderation/rules',
					},
				},
			},
			{
				name: 'Modify Rule',
				value: 'modifyRule',
				action: 'Modify an auto moderation rule',
				routing: {
					send: {
						preSend: [presendAutoModerationModifyRule],
					},
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/auto-moderation/rules/{{$parameter.ruleId}}',
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
	// Guided trigger_metadata fields for KEYWORD (1) and MEMBER_PROFILE (6).
	{
		displayName: 'Keyword Filter',
		name: 'keywordFilter',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule'],
				triggerType: [1, 6],
			},
		},
		description:
			'Comma-separated substrings to match. Discord allows wildcards via "*example*" syntax. Max 1000 entries, each up to 60 characters.',
	},
	{
		displayName: 'Regex Patterns',
		name: 'regexPatterns',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule'],
				triggerType: [1, 6],
			},
		},
		description:
			'Comma-separated regular expressions to match. Uses the Rust regex flavor. Max 10 patterns, each up to 260 characters.',
	},
	{
		displayName: 'Allow List',
		name: 'allowList',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule'],
				triggerType: [1, 6],
			},
		},
		description:
			'Comma-separated substrings that should be exempt from the rule. Max 100 entries, each up to 60 characters.',
	},
	// Guided trigger_metadata fields for KEYWORD_PRESET (4).
	{
		displayName: 'Presets',
		name: 'presets',
		type: 'multiOptions',
		default: [],
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule'],
				triggerType: [4],
			},
		},
		options: [
			{ name: 'Profanity', value: 1 },
			{ name: 'Sexual Content', value: 2 },
			{ name: 'Slurs', value: 3 },
		],
		description: 'Discord keyword preset categories to enable',
	},
	{
		displayName: 'Allow List',
		name: 'allowList',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule'],
				triggerType: [4],
			},
		},
		description:
			'Comma-separated substrings that should be exempt from the rule. Max 100 entries, each up to 60 characters.',
	},
	// Guided trigger_metadata fields for MENTION_SPAM (5).
	{
		displayName: 'Mention Total Limit',
		name: 'mentionTotalLimit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 50,
		},
		default: 5,
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule'],
				triggerType: [5],
			},
		},
		description: 'Total number of unique role and user mentions allowed per message (1-50)',
	},
	{
		displayName: 'Mention Raid Protection Enabled',
		name: 'mentionRaidProtectionEnabled',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule'],
				triggerType: [5],
			},
		},
		description: 'Whether to enable automatic detection of mention raids',
	},
	createRawJsonField(
		'Trigger Metadata',
		'triggerMetadata',
		'Raw Discord trigger_metadata JSON object (escape hatch). Guided fields above take precedence on key collision. Shape depends on trigger_type (e.g., keyword_filter, regex_patterns, presets, allow_list, mention_total_limit).',
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
		'Raw Discord trigger_metadata JSON object (escape hatch). Leave empty to omit. Shape depends on trigger_type.',
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
	// Guided actions builder.
	{
		displayName: 'Actions Collection',
		name: 'actionsCollection',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		placeholder: 'Add Action',
		displayOptions: {
			show: {
				resource: ['autoModeration'],
				operation: ['createRule', 'modifyRule'],
			},
		},
		description:
			'Guided action builder. Entries are appended to the raw Actions JSON (raw entries first, guided entries after).',
		options: [
			{
				name: 'action',
				displayName: 'Action',
				values: [
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						default: 1,
						required: true,
						options: [
							{ name: 'Block Message', value: 1 },
							{ name: 'Send Alert Message', value: 2 },
							{ name: 'Timeout', value: 3 },
							{ name: 'Block Member Interaction', value: 4 },
						],
						description: 'Action type to apply when the rule triggers',
					},
					{
						displayName: 'Custom Message',
						name: 'customMessage',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: [1],
							},
						},
						description:
							'Additional explanation shown to members when their message is blocked (max 200 characters)',
					},
					{
						displayName: 'Channel ID',
						name: 'channelId',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								type: [2],
							},
						},
						description: 'Channel snowflake ID to which alert messages should be sent',
					},
					{
						displayName: 'Duration Seconds',
						name: 'durationSeconds',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 2419200,
						},
						default: 60,
						displayOptions: {
							show: {
								type: [3],
							},
						},
						description: 'Timeout duration in seconds (max 2419200 = 28 days)',
					},
				],
			},
		],
	},
	createRawJsonField(
		'Actions',
		'actions',
		'Raw Discord actions JSON array (escape hatch). Each action is {type, metadata?}. Action types: 1 BLOCK_MESSAGE, 2 SEND_ALERT_MESSAGE, 3 TIMEOUT, 4 BLOCK_MEMBER_INTERACTION. Raw entries are sent alongside any entries from the Actions Collection builder.',
		'[]',
		{
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
		'Raw Discord actions JSON array (escape hatch). Leave empty to omit. Each action is {type, metadata?}.',
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
