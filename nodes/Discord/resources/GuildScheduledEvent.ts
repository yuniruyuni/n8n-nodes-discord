import type { INodeProperties } from 'n8n-workflow';

import { createAuditLogReasonField } from '../shared/auditLog';
import { createRawJsonField } from '../shared/messagePayload';

const createBody =
	'={{ { ...($parameter.channelId !== "" ? { channel_id: $parameter.channelId } : {}), ...($parameter.entityMetadata ? { entity_metadata: JSON.parse($parameter.entityMetadata) } : {}), name: $parameter.name, privacy_level: $parameter.privacyLevel, scheduled_start_time: $parameter.scheduledStartTime, ...($parameter.scheduledEndTime !== "" ? { scheduled_end_time: $parameter.scheduledEndTime } : {}), ...($parameter.description !== "" ? { description: $parameter.description } : {}), entity_type: $parameter.entityType, ...($parameter.image !== "" ? { image: $parameter.image } : {}), ...($parameter.recurrenceRule ? { recurrence_rule: JSON.parse($parameter.recurrenceRule) } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

const modifyBody =
	'={{ { ...($parameter.channelId !== "" ? { channel_id: $parameter.channelId } : {}), ...($parameter.entityMetadata ? { entity_metadata: JSON.parse($parameter.entityMetadata) } : {}), ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.privacyLevel !== "" ? { privacy_level: Number($parameter.privacyLevel) } : {}), ...($parameter.scheduledStartTime !== "" ? { scheduled_start_time: $parameter.scheduledStartTime } : {}), ...($parameter.scheduledEndTime !== "" ? { scheduled_end_time: $parameter.scheduledEndTime } : {}), ...($parameter.description !== "" ? { description: $parameter.description } : {}), ...($parameter.entityType !== "" ? { entity_type: Number($parameter.entityType) } : {}), ...($parameter.image !== "" ? { image: $parameter.image } : {}), ...($parameter.recurrenceRule ? { recurrence_rule: JSON.parse($parameter.recurrenceRule) } : {}), ...($parameter.status !== "" ? { status: Number($parameter.status) } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

export const guildScheduledEventOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
			},
		},
		options: [
			{
				name: 'List',
				value: 'list',
				action: 'List guild scheduled events',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/scheduled-events',
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a guild scheduled event',
				routing: {
					request: {
						method: 'POST',
						url: '=/guilds/{{$parameter.guildId}}/scheduled-events',
						body: createBody,
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a guild scheduled event',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/scheduled-events/{{$parameter.eventId}}',
					},
				},
			},
			{
				name: 'Modify',
				value: 'modify',
				action: 'Modify a guild scheduled event',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/scheduled-events/{{$parameter.eventId}}',
						body: modifyBody,
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a guild scheduled event',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/guilds/{{$parameter.guildId}}/scheduled-events/{{$parameter.eventId}}',
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
				name: 'List Users',
				value: 'listUsers',
				action: 'List guild scheduled event users',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/scheduled-events/{{$parameter.eventId}}/users',
					},
				},
			},
		],
		default: 'list',
	},
];

const entityTypeOptions = [
	{
		name: 'Stage Instance',
		value: 1,
		description: 'Event in a stage channel',
	},
	{
		name: 'Voice',
		value: 2,
		description: 'Event in a voice channel',
	},
	{
		name: 'External',
		value: 3,
		description: 'Event hosted outside Discord',
	},
];

const privacyLevelOptions = [
	{
		name: 'Guild Only',
		value: 2,
		description: 'Event accessible only to guild members',
	},
];

const statusOptions = [
	{
		name: 'Scheduled',
		value: 1,
	},
	{
		name: 'Active',
		value: 2,
	},
	{
		name: 'Completed',
		value: 3,
	},
	{
		name: 'Canceled',
		value: 4,
	},
];

export const guildScheduledEventFields: INodeProperties[] = [
	{
		displayName: 'Guild',
		name: 'guildId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
			},
		},
		description: 'Guild ID. Discord snowflake ID of the guild.',
	},
	{
		displayName: 'Event',
		name: 'eventId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['get', 'modify', 'delete', 'listUsers'],
			},
		},
		description: 'Scheduled event ID. Discord snowflake ID of the event.',
	},
	{
		displayName: 'With User Count',
		name: 'withUserCount',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['list', 'get'],
			},
		},
		description: 'Whether to include the number of subscribed users for each event',
		routing: {
			request: {
				qs: {
					with_user_count: '={{$parameter.withUserCount}}',
				},
			},
		},
	},
	{
		displayName: 'Channel',
		name: 'channelId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['create', 'modify'],
			},
		},
		description: 'Channel ID where the event is hosted. Optional for external events.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['create'],
			},
		},
		description: 'Name of the scheduled event',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['modify'],
			},
		},
		description: 'New name of the scheduled event',
	},
	{
		displayName: 'Privacy Level',
		name: 'privacyLevel',
		type: 'options',
		default: 2,
		options: privacyLevelOptions,
		required: true,
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['create'],
			},
		},
		description: 'Privacy level of the scheduled event',
	},
	{
		displayName: 'Privacy Level',
		name: 'privacyLevel',
		type: 'options',
		default: '',
		options: [{ name: 'Unchanged', value: '' }, ...privacyLevelOptions],
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['modify'],
			},
		},
		description: 'Privacy level of the scheduled event',
	},
	{
		displayName: 'Scheduled Start Time',
		name: 'scheduledStartTime',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['create'],
			},
		},
		description: 'ISO 8601 timestamp when the event is scheduled to start',
	},
	{
		displayName: 'Scheduled Start Time',
		name: 'scheduledStartTime',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['modify'],
			},
		},
		description: 'ISO 8601 timestamp when the event is scheduled to start',
	},
	{
		displayName: 'Scheduled End Time',
		name: 'scheduledEndTime',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['create', 'modify'],
			},
		},
		description: 'ISO 8601 timestamp when the event is scheduled to end. Required for external events.',
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
				resource: ['guildScheduledEvent'],
				operation: ['create', 'modify'],
			},
		},
		description: 'Description of the scheduled event',
	},
	{
		displayName: 'Entity Type',
		name: 'entityType',
		type: 'options',
		default: 2,
		options: entityTypeOptions,
		required: true,
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['create'],
			},
		},
		description: 'Type of the scheduled event',
	},
	{
		displayName: 'Entity Type',
		name: 'entityType',
		type: 'options',
		default: '',
		options: [{ name: 'Unchanged', value: '' }, ...entityTypeOptions],
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['modify'],
			},
		},
		description: 'Type of the scheduled event',
	},
	createRawJsonField(
		'Entity Metadata',
		'entityMetadata',
		'Raw Discord entity_metadata JSON object. For external events, provide { "location": "..." }.',
		'{"location":""}',
		{
			displayOptions: {
				show: {
					resource: ['guildScheduledEvent'],
					operation: ['create', 'modify'],
				},
			},
		},
	),
	{
		displayName: 'Image',
		name: 'image',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['create', 'modify'],
			},
		},
		description:
			'Cover image as a base64 data URI string (e.g., data:image/png;base64,...)',
	},
	createRawJsonField(
		'Recurrence Rule',
		'recurrenceRule',
		'Raw Discord recurrence_rule JSON object. Includes fields such as start, frequency, interval, by_weekday, by_n_weekday, by_month, by_month_day, and count.',
		'{}',
		{
			displayOptions: {
				show: {
					resource: ['guildScheduledEvent'],
					operation: ['create', 'modify'],
				},
			},
		},
	),
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		default: '',
		options: [{ name: 'Unchanged', value: '' }, ...statusOptions],
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['modify'],
			},
		},
		description: 'New status for the scheduled event',
	},
	{
		displayName: 'Raw JSON',
		name: 'rawJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['create', 'modify'],
			},
		},
		description:
			'Additional Discord scheduled event JSON body fields. Values here override simple fields when keys overlap.',
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
				resource: ['guildScheduledEvent'],
				operation: ['listUsers'],
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
		displayName: 'With Member',
		name: 'withMember',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['guildScheduledEvent'],
				operation: ['listUsers'],
			},
		},
		description: 'Whether to include the guild member object for each user',
		routing: {
			request: {
				qs: {
					with_member: '={{$parameter.withMember}}',
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
				resource: ['guildScheduledEvent'],
				operation: ['listUsers'],
			},
		},
		description: 'Return users before this snowflake ID',
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
				resource: ['guildScheduledEvent'],
				operation: ['listUsers'],
			},
		},
		description: 'Return users after this snowflake ID',
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
				resource: ['guildScheduledEvent'],
				operation: ['create', 'modify', 'delete'],
			},
		},
	}),
];
