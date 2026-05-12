import type { INodeProperties } from 'n8n-workflow';

export const applicationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['application'],
			},
		},
		options: [
			{
				name: 'Get Current',
				value: 'getCurrent',
				action: 'Get the current application',
				routing: {
					request: {
						method: 'GET',
						url: '/applications/@me',
					},
				},
			},
			{
				name: 'Edit Current',
				value: 'editCurrent',
				action: 'Edit the current application',
				routing: {
					request: {
						method: 'PATCH',
						url: '/applications/@me',
					},
				},
			},
			{
				name: 'Get Activity Instance',
				value: 'getActivityInstance',
				action: 'Get an application activity instance',
				routing: {
					request: {
						method: 'GET',
						url: '=/applications/{{$parameter.applicationId}}/activity-instances/{{$parameter.instanceId}}',
					},
				},
			},
		],
		default: 'getCurrent',
	},
];

export const applicationFields: INodeProperties[] = [
	{
		displayName: 'Application',
		name: 'applicationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['getActivityInstance'],
			},
		},
		description: 'Application ID. Discord snowflake ID of the application.',
	},
	{
		displayName: 'Instance',
		name: 'instanceId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['getActivityInstance'],
			},
		},
		description: 'Activity instance ID',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['editCurrent'],
			},
		},
		options: [
			{
				displayName: 'Cover Image',
				name: 'cover_image',
				type: 'string',
				default: '',
				placeholder: 'data:image/png;base64,...',
				description: 'Default rich presence invite cover image as a Discord image data URI',
				routing: {
					send: {
						type: 'body',
						property: 'cover_image',
					},
				},
			},
			{
				displayName: 'Custom Install URL',
				name: 'custom_install_url',
				type: 'string',
				default: '',
				description: 'Default custom authorization URL for the application',
				routing: {
					send: {
						type: 'body',
						property: 'custom_install_url',
					},
				},
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Description of the application',
				routing: {
					send: {
						type: 'body',
						property: 'description',
					},
				},
			},
			{
				displayName: 'Event Webhooks Status',
				name: 'event_webhooks_status',
				type: 'number',
				default: 1,
				description: 'Status indicating whether event webhooks are enabled (1 = disabled, 2 = enabled)',
				routing: {
					send: {
						type: 'body',
						property: 'event_webhooks_status',
					},
				},
			},
			{
				displayName: 'Event Webhooks Types (JSON Array)',
				name: 'event_webhooks_types',
				type: 'json',
				default: '',
				placeholder: '["APPLICATION_AUTHORIZED"]',
				description: 'List of webhook event types the application subscribes to, as a JSON array of strings',
				routing: {
					send: {
						type: 'body',
						property: 'event_webhooks_types',
						value: '={{ JSON.parse($value) }}',
					},
				},
			},
			{
				displayName: 'Event Webhooks URL',
				name: 'event_webhooks_url',
				type: 'string',
				default: '',
				description: 'Event webhooks URL for the application to receive webhook events',
				routing: {
					send: {
						type: 'body',
						property: 'event_webhooks_url',
					},
				},
			},
			{
				displayName: 'Flags',
				name: 'flags',
				type: 'number',
				default: 0,
				description: 'Application flags bitfield. Only limited intent flags can be updated via the API.',
				routing: {
					send: {
						type: 'body',
						property: 'flags',
					},
				},
			},
			{
				displayName: 'Icon',
				name: 'icon',
				type: 'string',
				default: '',
				placeholder: 'data:image/png;base64,...',
				description: 'Application icon as a Discord image data URI',
				routing: {
					send: {
						type: 'body',
						property: 'icon',
					},
				},
			},
			{
				displayName: 'Install Params (JSON)',
				name: 'install_params',
				type: 'json',
				default: '',
				placeholder: '{"scopes":["applications.commands","bot"],"permissions":"0"}',
				description: 'Settings for the application in-app authorization link, as a raw Discord install_params JSON object',
				routing: {
					send: {
						type: 'body',
						property: 'install_params',
						value: '={{ JSON.parse($value) }}',
					},
				},
			},
			{
				displayName: 'Integration Types Config (JSON)',
				name: 'integration_types_config',
				type: 'json',
				default: '',
				placeholder: '{"0":{"oauth2_install_params":{"scopes":["bot"],"permissions":"0"}}}',
				description: 'Default scopes and permissions for each supported installation context, as a raw Discord integration_types_config JSON object',
				routing: {
					send: {
						type: 'body',
						property: 'integration_types_config',
						value: '={{ JSON.parse($value) }}',
					},
				},
			},
			{
				displayName: 'Interactions Endpoint URL',
				name: 'interactions_endpoint_url',
				type: 'string',
				default: '',
				description: 'Interactions endpoint URL for the application',
				routing: {
					send: {
						type: 'body',
						property: 'interactions_endpoint_url',
					},
				},
			},
			{
				displayName: 'Role Connections Verification URL',
				name: 'role_connections_verification_url',
				type: 'string',
				default: '',
				description: 'Role connection verification URL for the application',
				routing: {
					send: {
						type: 'body',
						property: 'role_connections_verification_url',
					},
				},
			},
			{
				displayName: 'Tags (JSON Array)',
				name: 'tags',
				type: 'json',
				default: '',
				placeholder: '["tag1","tag2"]',
				description: 'List of tags describing the content and functionality of the application, as a JSON array of strings (max 5, each max 20 chars)',
				routing: {
					send: {
						type: 'body',
						property: 'tags',
						value: '={{ JSON.parse($value) }}',
					},
				},
			},
		],
	},
];
