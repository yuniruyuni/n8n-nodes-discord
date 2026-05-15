import type { INodeProperties } from 'n8n-workflow';

import { createAuditLogReasonField } from '../shared/auditLog';

const createBody =
	'={{ { ...($parameter.channelId !== "" ? { channel_id: $parameter.channelId } : {}), ...($parameter.topic !== "" ? { topic: $parameter.topic } : {}), ...($parameter.privacyLevel !== "" ? { privacy_level: $parameter.privacyLevel } : {}), ...($parameter.sendStartNotification !== "" ? { send_start_notification: $parameter.sendStartNotification } : {}), ...($parameter.guildScheduledEventId !== "" ? { guild_scheduled_event_id: $parameter.guildScheduledEventId } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

const modifyBody =
	'={{ { ...($parameter.topic !== "" ? { topic: $parameter.topic } : {}), ...($parameter.privacyLevel !== "" ? { privacy_level: $parameter.privacyLevel } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

export const stageInstanceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['stageInstance'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a stage instance',
				routing: {
					request: {
						method: 'POST',
						url: '/stage-instances',
						body: createBody,
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a stage instance',
				routing: {
					request: {
						method: 'GET',
						url: '=/stage-instances/{{$parameter.channelId}}',
					},
				},
			},
			{
				name: 'Modify',
				value: 'modify',
				action: 'Modify a stage instance',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/stage-instances/{{$parameter.channelId}}',
						body: modifyBody,
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a stage instance',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/stage-instances/{{$parameter.channelId}}',
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
		default: 'get',
	},
];

export const stageInstanceFields: INodeProperties[] = [
	{
		displayName: 'Channel',
		name: 'channelId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['stageInstance'],
			},
		},
		description: 'Channel ID. Discord snowflake ID of the stage channel.',
	},
	{
		displayName: 'Topic',
		name: 'topic',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['stageInstance'],
				operation: ['create', 'modify'],
			},
		},
		description: 'Topic of the stage instance (1-120 characters)',
	},
	{
		displayName: 'Privacy Level',
		name: 'privacyLevel',
		type: 'options',
		default: 2,
		displayOptions: {
			show: {
				resource: ['stageInstance'],
				operation: ['create', 'modify'],
			},
		},
		options: [
			{
				name: 'Guild Only',
				value: 2,
				description: 'The stage instance is visible to only guild members',
			},
		],
		description: 'Privacy level of the stage instance. Defaults to GUILD_ONLY.',
	},
	{
		displayName: 'Send Start Notification',
		name: 'sendStartNotification',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['stageInstance'],
				operation: ['create'],
			},
		},
		description: 'Whether to notify @everyone that a stage instance has started',
	},
	{
		displayName: 'Guild Scheduled Event ID',
		name: 'guildScheduledEventId',
		type: 'string',
		default: '',
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['stageInstance'],
				operation: ['create'],
			},
		},
		description: 'Guild scheduled event ID associated with this stage instance',
	},
	{
		displayName: 'Raw JSON',
		name: 'rawJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['stageInstance'],
				operation: ['create', 'modify'],
			},
		},
		description:
			'Additional Discord stage instance JSON body fields. Values here override simple fields when keys overlap.',
	},
	createAuditLogReasonField({
		displayOptions: {
			show: {
				resource: ['stageInstance'],
				operation: ['create', 'modify', 'delete'],
			},
		},
	}),
];
