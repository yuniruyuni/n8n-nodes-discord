import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { DISCORD_SNOWFLAKE_PATTERN } from '../shared/snowflake';

// Discord audit log action_type enum.
// Source: https://docs.discord.com/developers/resources/audit-log
// Covers the documented set as of 2025; Discord may add new values over time.
const auditLogActionTypeOptions: INodePropertyOptions[] = [
	{ name: 'Guild Update', value: 1 },
	{ name: 'Channel Create', value: 10 },
	{ name: 'Channel Update', value: 11 },
	{ name: 'Channel Delete', value: 12 },
	{ name: 'Channel Overwrite Create', value: 13 },
	{ name: 'Channel Overwrite Update', value: 14 },
	{ name: 'Channel Overwrite Delete', value: 15 },
	{ name: 'Member Kick', value: 20 },
	{ name: 'Member Prune', value: 21 },
	{ name: 'Member Ban Add', value: 22 },
	{ name: 'Member Ban Remove', value: 23 },
	{ name: 'Member Update', value: 24 },
	{ name: 'Member Role Update', value: 25 },
	{ name: 'Member Move', value: 26 },
	{ name: 'Member Disconnect', value: 27 },
	{ name: 'Bot Add', value: 28 },
	{ name: 'Role Create', value: 30 },
	{ name: 'Role Update', value: 31 },
	{ name: 'Role Delete', value: 32 },
	{ name: 'Invite Create', value: 40 },
	{ name: 'Invite Update', value: 41 },
	{ name: 'Invite Delete', value: 42 },
	{ name: 'Webhook Create', value: 50 },
	{ name: 'Webhook Update', value: 51 },
	{ name: 'Webhook Delete', value: 52 },
	{ name: 'Emoji Create', value: 60 },
	{ name: 'Emoji Update', value: 61 },
	{ name: 'Emoji Delete', value: 62 },
	{ name: 'Message Delete', value: 72 },
	{ name: 'Message Bulk Delete', value: 73 },
	{ name: 'Message Pin', value: 74 },
	{ name: 'Message Unpin', value: 75 },
	{ name: 'Integration Create', value: 80 },
	{ name: 'Integration Update', value: 81 },
	{ name: 'Integration Delete', value: 82 },
	{ name: 'Stage Instance Create', value: 83 },
	{ name: 'Stage Instance Update', value: 84 },
	{ name: 'Stage Instance Delete', value: 85 },
	{ name: 'Sticker Create', value: 90 },
	{ name: 'Sticker Update', value: 91 },
	{ name: 'Sticker Delete', value: 92 },
	{ name: 'Guild Scheduled Event Create', value: 100 },
	{ name: 'Guild Scheduled Event Update', value: 101 },
	{ name: 'Guild Scheduled Event Delete', value: 102 },
	{ name: 'Thread Create', value: 110 },
	{ name: 'Thread Update', value: 111 },
	{ name: 'Thread Delete', value: 112 },
	{ name: 'Application Command Permission Update', value: 121 },
	{ name: 'Soundboard Sound Create', value: 130 },
	{ name: 'Soundboard Sound Update', value: 131 },
	{ name: 'Soundboard Sound Delete', value: 132 },
	{ name: 'Auto Moderation Rule Create', value: 140 },
	{ name: 'Auto Moderation Rule Update', value: 141 },
	{ name: 'Auto Moderation Rule Delete', value: 142 },
	{ name: 'Auto Moderation Block Message', value: 143 },
	{ name: 'Auto Moderation Flag To Channel', value: 144 },
	{ name: 'Auto Moderation User Communication Disabled', value: 145 },
	{ name: 'Auto Moderation Quarantine User', value: 146 },
	{ name: 'Creator Monetization Request Created', value: 150 },
	{ name: 'Creator Monetization Terms Accepted', value: 151 },
	{ name: 'Onboarding Prompt Create', value: 163 },
	{ name: 'Onboarding Prompt Update', value: 164 },
	{ name: 'Onboarding Prompt Delete', value: 165 },
	{ name: 'Onboarding Create', value: 166 },
	{ name: 'Onboarding Update', value: 167 },
	{ name: 'Home Settings Create', value: 190 },
	{ name: 'Home Settings Update', value: 191 },
	{ name: 'Voice Channel Status Update', value: 192 },
	{ name: 'Voice Channel Status Delete', value: 193 },
];

export const auditLogOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['auditLog'],
			},
		},
		options: [
			{
				name: 'Get Guild Audit Log',
				value: 'getGuildAuditLog',
				action: 'Get guild audit log',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/audit-logs',
					},
				},
			},
		],
		default: 'getGuildAuditLog',
	},
];

export const auditLogFields: INodeProperties[] = [
	{
		displayName: 'Guild',
		name: 'guildId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['auditLog'],
			},
		},
		description: 'Guild ID. Discord snowflake ID of the guild.',
	},
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		default: '',
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['auditLog'],
				operation: ['getGuildAuditLog'],
			},
		},
		description: 'Filter entries by the user that performed the action. Discord snowflake ID.',
		modes: [
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: DISCORD_SNOWFLAKE_PATTERN,
							errorMessage: 'Enter a valid Discord snowflake ID.',
						},
					},
				],
			},
		],
		routing: {
			send: {
				type: 'query',
				property: 'user_id',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Action Type',
		name: 'actionType',
		type: 'options',
		default: '',
		options: [
			{ name: 'Any', value: '' },
			...auditLogActionTypeOptions,
		],
		displayOptions: {
			show: {
				resource: ['auditLog'],
				operation: ['getGuildAuditLog'],
			},
		},
		description: 'Filter entries by audit log event type',
		routing: {
			send: {
				type: 'query',
				property: 'action_type',
				value: '={{ $value === "" ? undefined : $value }}',
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
				resource: ['auditLog'],
				operation: ['getGuildAuditLog'],
			},
		},
		description: 'Return entries with ID less than this snowflake (older entries)',
		modes: [
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: DISCORD_SNOWFLAKE_PATTERN,
							errorMessage: 'Enter a valid Discord snowflake ID.',
						},
					},
				],
			},
		],
		routing: {
			send: {
				type: 'query',
				property: 'before',
				value: '={{ $value || undefined }}',
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
				resource: ['auditLog'],
				operation: ['getGuildAuditLog'],
			},
		},
		description: 'Return entries with ID greater than this snowflake (newer entries)',
		modes: [
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: DISCORD_SNOWFLAKE_PATTERN,
							errorMessage: 'Enter a valid Discord snowflake ID.',
						},
					},
				],
			},
		],
		routing: {
			send: {
				type: 'query',
				property: 'after',
				value: '={{ $value || undefined }}',
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
				resource: ['auditLog'],
				operation: ['getGuildAuditLog'],
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
