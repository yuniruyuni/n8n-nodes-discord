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

const createTestBody =
	'={{ { sku_id: $parameter.skuId, owner_id: $parameter.ownerId, owner_type: Number($parameter.ownerType) } }}';

export const entitlementOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['entitlement'],
			},
		},
		options: [
			{
				name: 'List',
				value: 'list',
				action: 'List entitlements',
				routing: {
					request: {
						method: 'GET',
						url: '=/applications/{{$parameter.applicationId}}/entitlements',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an entitlement',
				routing: {
					request: {
						method: 'GET',
						url: '=/applications/{{$parameter.applicationId}}/entitlements/{{$parameter.entitlementId}}',
					},
				},
			},
			{
				name: 'Consume',
				value: 'consume',
				action: 'Consume an entitlement',
				routing: {
					request: {
						method: 'POST',
						url: '=/applications/{{$parameter.applicationId}}/entitlements/{{$parameter.entitlementId}}/consume',
					},
					output: successResponse,
				},
			},
			{
				name: 'Create Test',
				value: 'createTest',
				action: 'Create a test entitlement',
				routing: {
					request: {
						method: 'POST',
						url: '=/applications/{{$parameter.applicationId}}/entitlements',
						body: createTestBody,
					},
				},
			},
			{
				name: 'Delete Test',
				value: 'deleteTest',
				action: 'Delete a test entitlement',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/applications/{{$parameter.applicationId}}/entitlements/{{$parameter.entitlementId}}',
					},
					output: successResponse,
				},
			},
		],
		default: 'list',
	},
];

export const entitlementFields: INodeProperties[] = [
	{
		displayName: 'Application',
		name: 'applicationId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['entitlement'],
			},
		},
		description:
			'Application ID. Discord snowflake ID of the application. Entitlement entries include a numeric type: 1 PURCHASE, 2 PREMIUM_SUBSCRIPTION, 3 DEVELOPER_GIFT, 4 TEST_MODE_PURCHASE, 5 FREE_PURCHASE, 6 USER_GIFT, 7 PREMIUM_PURCHASE, 8 APPLICATION_SUBSCRIPTION.',
	},
	{
		displayName: 'Entitlement',
		name: 'entitlementId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['entitlement'],
				operation: ['get', 'consume', 'deleteTest'],
			},
		},
		description: 'Entitlement ID. Discord snowflake ID of the entitlement.',
	},
	{
		displayName: 'SKU',
		name: 'skuId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['entitlement'],
				operation: ['createTest'],
			},
		},
		description: 'SKU ID to grant the user or guild access to',
	},
	{
		displayName: 'Owner',
		name: 'ownerId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['entitlement'],
				operation: ['createTest'],
			},
		},
		description: 'Snowflake ID of the guild or user to grant the entitlement to',
	},
	{
		displayName: 'Owner Type',
		name: 'ownerType',
		type: 'options',
		default: 2,
		required: true,
		displayOptions: {
			show: {
				resource: ['entitlement'],
				operation: ['createTest'],
			},
		},
		options: [
			{
				name: 'Guild',
				value: 1,
			},
			{
				name: 'User',
				value: 2,
			},
		],
		description: 'Whether the entitlement owner is a guild (1) or a user (2)',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['entitlement'],
				operation: ['list'],
			},
		},
		options: [
			{
				displayName: 'After',
				name: 'after',
				type: 'string',
				default: '',
				description: 'Retrieve entitlements after this snowflake ID',
				routing: {
					send: {
						type: 'query',
						property: 'after',
					},
				},
			},
			{
				displayName: 'Before',
				name: 'before',
				type: 'string',
				default: '',
				description: 'Retrieve entitlements before this snowflake ID',
				routing: {
					send: {
						type: 'query',
						property: 'before',
					},
				},
			},
			{
				displayName: 'Exclude Deleted',
				name: 'exclude_deleted',
				type: 'boolean',
				default: true,
				description: 'Whether to omit deleted entitlements from the response',
				routing: {
					send: {
						type: 'query',
						property: 'exclude_deleted',
					},
				},
			},
			{
				displayName: 'Exclude Ended',
				name: 'exclude_ended',
				type: 'boolean',
				default: false,
				description: 'Whether to omit ended entitlements from the response',
				routing: {
					send: {
						type: 'query',
						property: 'exclude_ended',
					},
				},
			},
			{
				displayName: 'Guild ID',
				name: 'guild_id',
				type: 'string',
				default: '',
				description: 'Snowflake ID to limit entitlements to a specific guild',
				routing: {
					send: {
						type: 'query',
						property: 'guild_id',
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
				description: 'Max number of results to return',
				routing: {
					send: {
						type: 'query',
						property: 'limit',
					},
				},
			},
			{
				displayName: 'SKU IDs',
				name: 'sku_ids',
				type: 'string',
				default: '',
				placeholder: '123,456',
				description: 'Comma-separated snowflake list to limit entitlements to specific SKUs',
				routing: {
					send: {
						type: 'query',
						property: 'sku_ids',
					},
				},
			},
			{
				displayName: 'User ID',
				name: 'user_id',
				type: 'string',
				default: '',
				description: 'Snowflake ID to limit entitlements to a specific user',
				routing: {
					send: {
						type: 'query',
						property: 'user_id',
					},
				},
			},
		],
	},
];
