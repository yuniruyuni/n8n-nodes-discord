import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

import { resolveDataUriFromBinary } from '../shared/dataUri';
import { createRawJsonField } from '../shared/messagePayload';

export async function presendUserModifyCurrent(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const avatarBinaryParam = this.getNodeParameter('avatarBinaryPropertyName', '') as unknown;
	const avatarBinary =
		typeof avatarBinaryParam === 'string' ? avatarBinaryParam.trim() : '';
	const bannerBinaryParam = this.getNodeParameter('bannerBinaryPropertyName', '') as unknown;
	const bannerBinary =
		typeof bannerBinaryParam === 'string' ? bannerBinaryParam.trim() : '';

	if (avatarBinary === '' && bannerBinary === '') {
		return requestOptions;
	}

	const body =
		requestOptions.body && typeof requestOptions.body === 'object'
			? { ...(requestOptions.body as IDataObject) }
			: {};

	if (avatarBinary !== '') {
		body.avatar = await resolveDataUriFromBinary(this, this.getItemIndex(), avatarBinary);
	}
	if (bannerBinary !== '') {
		body.banner = await resolveDataUriFromBinary(this, this.getItemIndex(), bannerBinary);
	}

	return {
		...requestOptions,
		body,
	};
}

const modifyCurrentBody =
	'={{ { ...($parameter.username !== "" ? { username: $parameter.username } : {}), ...($parameter.avatar !== "" ? { avatar: $parameter.avatar === "null" ? null : $parameter.avatar } : {}), ...($parameter.banner !== "" ? { banner: $parameter.banner === "null" ? null : $parameter.banner } : {}) } }}';

const createDmBody = '={{ { recipient_id: $parameter.recipientId } }}';

const createGroupDmBody =
	'={{ { access_tokens: JSON.parse($parameter.accessTokens || "[]"), ...(JSON.parse($parameter.nicks || "null") !== null ? { nicks: JSON.parse($parameter.nicks) } : {}) } }}';

const updateRoleConnectionBody =
	'={{ { ...($parameter.platformName !== "" ? { platform_name: $parameter.platformName } : {}), ...($parameter.platformUsername !== "" ? { platform_username: $parameter.platformUsername } : {}), ...(JSON.parse($parameter.metadata || "null") !== null ? { metadata: JSON.parse($parameter.metadata) } : {}) } }}';

export const userOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['user'],
			},
		},
		options: [
			{
				name: 'Get Current',
				value: 'getCurrent',
				action: 'Get current bot user',
				routing: {
					request: {
						method: 'GET',
						url: '/users/@me',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a user',
				routing: {
					request: {
						method: 'GET',
						url: '=/users/{{$parameter.userId}}',
					},
				},
			},
			{
				name: 'Modify Current',
				value: 'modifyCurrent',
				action: 'Modify the current user',
				routing: {
					send: {
						preSend: [presendUserModifyCurrent],
					},
					request: {
						method: 'PATCH',
						url: '/users/@me',
						body: modifyCurrentBody,
					},
				},
			},
			{
				name: 'Get Current Guilds',
				value: 'getCurrentGuilds',
				action: 'Get the current user guilds',
				routing: {
					request: {
						method: 'GET',
						url: '/users/@me/guilds',
					},
				},
			},
			{
				name: 'Get Current Guild Member',
				value: 'getCurrentGuildMember',
				action: 'Get the current user guild member',
				routing: {
					request: {
						method: 'GET',
						url: '=/users/@me/guilds/{{$parameter.guildId}}/member',
					},
				},
			},
			{
				name: 'Leave Guild',
				value: 'leaveGuild',
				action: 'Leave a guild as the current user',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/users/@me/guilds/{{$parameter.guildId}}',
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
				name: 'Create DM',
				value: 'createDm',
				action: 'Create a DM channel with a user',
				routing: {
					request: {
						method: 'POST',
						url: '/users/@me/channels',
						body: createDmBody,
					},
				},
			},
			{
				name: 'Create Group DM',
				value: 'createGroupDm',
				action: 'Create a group DM channel',
				description: 'Requires OAuth2 user token; not supported with bot tokens',
				routing: {
					request: {
						method: 'POST',
						url: '/users/@me/channels',
						body: createGroupDmBody,
					},
				},
			},
			{
				name: 'Get Current Connections',
				value: 'getCurrentConnections',
				action: 'Get the current user connections',
				description: 'Requires OAuth2 user token; not supported with bot tokens',
				routing: {
					request: {
						method: 'GET',
						url: '/users/@me/connections',
					},
				},
			},
			{
				name: 'Get Current Application Role Connection',
				value: 'getCurrentApplicationRoleConnection',
				action: 'Get the current user application role connection',
				description: 'Requires OAuth2 user token; not supported with bot tokens',
				routing: {
					request: {
						method: 'GET',
						url: '=/users/@me/applications/{{$parameter.applicationId}}/role-connection',
					},
				},
			},
			{
				name: 'Update Current Application Role Connection',
				value: 'updateCurrentApplicationRoleConnection',
				action: 'Update the current user application role connection',
				description: 'Requires OAuth2 user token; not supported with bot tokens',
				routing: {
					request: {
						method: 'PUT',
						url: '=/users/@me/applications/{{$parameter.applicationId}}/role-connection',
						body: updateRoleConnectionBody,
					},
				},
			},
		],
		default: 'getCurrent',
	},
];

export const userFields: INodeProperties[] = [
	{
		displayName: 'User',
		name: 'userId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['get'],
			},
		},
		description: 'User ID. Discord snowflake ID of the user.',
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
				resource: ['user'],
				operation: ['getCurrentGuildMember', 'leaveGuild'],
			},
		},
		description: 'Guild ID. Discord snowflake ID of the guild.',
	},
	{
		displayName: 'Application',
		name: 'applicationId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: [
					'getCurrentApplicationRoleConnection',
					'updateCurrentApplicationRoleConnection',
				],
			},
		},
		description: 'Application ID. Discord snowflake ID of the application.',
	},
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['modifyCurrent'],
			},
		},
		description: 'New username for the current user',
	},
	{
		displayName: 'Avatar',
		name: 'avatar',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['modifyCurrent'],
			},
		},
		description:
			'Avatar image as a data URI (e.g. data:image/png;base64,...) or the literal string "null" to remove the existing avatar. Ignored when Avatar Binary Property is set.',
	},
	{
		displayName: 'Avatar Binary Property',
		name: 'avatarBinaryPropertyName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['modifyCurrent'],
			},
		},
		description:
			'Name of the input item binary property holding the avatar image. When set, it is converted to a data URI and overrides the Avatar field.',
	},
	{
		displayName: 'Banner',
		name: 'banner',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['modifyCurrent'],
			},
		},
		description:
			'Banner image as a data URI (e.g. data:image/png;base64,...) or the literal string "null" to remove the existing banner. Ignored when Banner Binary Property is set.',
	},
	{
		displayName: 'Banner Binary Property',
		name: 'bannerBinaryPropertyName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['modifyCurrent'],
			},
		},
		description:
			'Name of the input item binary property holding the banner image. When set, it is converted to a data URI and overrides the Banner field.',
	},
	{
		displayName: 'Before',
		name: 'before',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['getCurrentGuilds'],
			},
		},
		description: 'Return guilds before this guild ID (older entries)',
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
				resource: ['user'],
				operation: ['getCurrentGuilds'],
			},
		},
		description: 'Return guilds after this guild ID (newer entries)',
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
			maxValue: 200,
		},
		default: 50,
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['getCurrentGuilds'],
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
	{
		displayName: 'With Counts',
		name: 'withCounts',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['getCurrentGuilds'],
			},
		},
		description: 'Whether to include approximate member and presence counts in each guild',
		routing: {
			send: {
				type: 'query',
				property: 'with_counts',
			},
		},
	},
	{
		displayName: 'Recipient ID',
		name: 'recipientId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['createDm'],
			},
		},
		description: 'Recipient ID. Discord snowflake ID of the user to open a DM with.',
	},
	createRawJsonField(
		'Access Tokens',
		'accessTokens',
		'Raw JSON array of OAuth2 access tokens of users that have granted the application the gdm.join scope.',
		'[]',
		{
			required: true,
			default: '[]',
			displayOptions: {
				show: {
					resource: ['user'],
					operation: ['createGroupDm'],
				},
			},
		},
	),
	createRawJsonField(
		'Nicks',
		'nicks',
		'Raw JSON object mapping user IDs to their respective nicknames in the group DM.',
		'{}',
		{
			displayOptions: {
				show: {
					resource: ['user'],
					operation: ['createGroupDm'],
				},
			},
		},
	),
	{
		displayName: 'Platform Name',
		name: 'platformName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['updateCurrentApplicationRoleConnection'],
			},
		},
		description: 'Vanity name of the platform a bot has connected (max 50 characters)',
	},
	{
		displayName: 'Platform Username',
		name: 'platformUsername',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['updateCurrentApplicationRoleConnection'],
			},
		},
		description: 'Username on the platform a bot has connected (max 100 characters)',
	},
	createRawJsonField(
		'Metadata',
		'metadata',
		'Raw JSON object mapping application role connection metadata keys to their string values (max 100 characters each).',
		'{}',
		{
			displayOptions: {
				show: {
					resource: ['user'],
					operation: ['updateCurrentApplicationRoleConnection'],
				},
			},
		},
	),
];
