import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

import { createAuditLogReasonField } from '../shared/auditLog';
import { createRawJsonField } from '../shared/messagePayload';
import {
	aggregateDiscordPermissions,
	createPermissionMultiOptionsField,
} from '../shared/permissions';
import { successOutput } from '../shared/routing';
import { DISCORD_SNOWFLAKE_PATTERN } from '../shared/snowflake';

// preSend for editChannelPermissions: assembles the body from either the raw
// bitfield strings (advanced escape hatch) or the guided multiOptions flags.
// The raw string fields take precedence over the guided flag selections.
export async function presendEditChannelPermissions(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const allowString = (this.getNodeParameter('permissionAllow', '') as string).trim();
	const denyString = (this.getNodeParameter('permissionDeny', '') as string).trim();
	const allowFlags = this.getNodeParameter('allowFlags', []) as string[];
	const denyFlags = this.getNodeParameter('denyFlags', []) as string[];
	const permissionType = this.getNodeParameter('permissionType', 0) as number | string;

	const body: IDataObject = {
		type: Number(permissionType),
	};

	if (allowString !== '') {
		body.allow = allowString;
	} else if (Array.isArray(allowFlags) && allowFlags.length > 0) {
		body.allow = aggregateDiscordPermissions(allowFlags);
	}

	if (denyString !== '') {
		body.deny = denyString;
	} else if (Array.isArray(denyFlags) && denyFlags.length > 0) {
		body.deny = aggregateDiscordPermissions(denyFlags);
	}

	const headers = { ...(requestOptions.headers ?? {}) };
	(headers as Record<string, string>)['Content-Type'] = 'application/json';

	return {
		...requestOptions,
		body,
		json: true,
		headers,
	};
}

const channelBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.topic !== "" ? { topic: $parameter.topic } : {}), ...($parameter.position !== "" ? { position: Number($parameter.position) } : {}), ...($parameter.parentId !== "" ? { parent_id: $parameter.parentId } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

const bulkDeleteBody =
	'={{ { messages: JSON.parse($parameter.bulkDeleteMessageIds || "[]") } }}';

const createInviteBody =
	'={{ { ...($parameter.inviteMaxAge !== "" ? { max_age: Number($parameter.inviteMaxAge) } : {}), ...($parameter.inviteMaxUses !== "" ? { max_uses: Number($parameter.inviteMaxUses) } : {}), ...($parameter.inviteTemporary !== "" ? { temporary: $parameter.inviteTemporary } : {}), ...($parameter.inviteUnique !== "" ? { unique: $parameter.inviteUnique } : {}), ...($parameter.inviteTargetType !== "" ? { target_type: Number($parameter.inviteTargetType) } : {}), ...($parameter.inviteTargetUserId !== "" ? { target_user_id: $parameter.inviteTargetUserId } : {}), ...($parameter.inviteTargetApplicationId !== "" ? { target_application_id: $parameter.inviteTargetApplicationId } : {}) } }}';

const followAnnouncementBody =
	'={{ { webhook_channel_id: $parameter.webhookChannelId } }}';

const groupDmAddRecipientBody =
	'={{ { access_token: $parameter.recipientAccessToken, ...($parameter.recipientNick !== "" ? { nick: $parameter.recipientNick } : {}) } }}';

const startThreadFromMessageBody =
	'={{ { name: $parameter.threadName, ...($parameter.autoArchiveDuration !== "" ? { auto_archive_duration: Number($parameter.autoArchiveDuration) } : {}), ...($parameter.rateLimitPerUser !== "" ? { rate_limit_per_user: Number($parameter.rateLimitPerUser) } : {}) } }}';

const startThreadWithoutMessageBody =
	'={{ { name: $parameter.threadName, ...($parameter.autoArchiveDuration !== "" ? { auto_archive_duration: Number($parameter.autoArchiveDuration) } : {}), ...($parameter.threadType !== "" ? { type: Number($parameter.threadType) } : {}), ...($parameter.threadInvitable !== "" ? { invitable: $parameter.threadInvitable } : {}), ...($parameter.rateLimitPerUser !== "" ? { rate_limit_per_user: Number($parameter.rateLimitPerUser) } : {}) } }}';

const startThreadInForumBody =
	'={{ { name: $parameter.threadName, ...($parameter.autoArchiveDuration !== "" ? { auto_archive_duration: Number($parameter.autoArchiveDuration) } : {}), ...($parameter.rateLimitPerUser !== "" ? { rate_limit_per_user: Number($parameter.rateLimitPerUser) } : {}), message: JSON.parse($parameter.forumMessage || "{}"), ...(JSON.parse($parameter.appliedTags || "null") !== null ? { applied_tags: JSON.parse($parameter.appliedTags) } : {}) } }}';

export const channelOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['channel'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}',
					},
				},
			},
			{
				name: 'Modify',
				value: 'modify',
				action: 'Modify',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/channels/{{$parameter.channelId}}',
						body: channelBody,
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/channels/{{$parameter.channelId}}',
					},
				},
			},
			{
				name: 'Trigger Typing',
				value: 'triggerTyping',
				action: 'Trigger typing',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/typing',
					},
					output: successOutput,
				},
			},
			{
				name: 'Get Pinned Messages',
				value: 'getPinnedMessages',
				action: 'Get pinned messages',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/messages/pins',
					},
				},
			},
			{
				name: 'Pin Message',
				value: 'pinMessage',
				action: 'Pin message',
				routing: {
					request: {
						method: 'PUT',
						url: '=/channels/{{$parameter.channelId}}/messages/pins/{{$parameter.messageId}}',
					},
					output: successOutput,
				},
			},
			{
				name: 'Unpin Message',
				value: 'unpinMessage',
				action: 'Unpin message',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/channels/{{$parameter.channelId}}/messages/pins/{{$parameter.messageId}}',
					},
					output: successOutput,
				},
			},
			{
				name: 'Create Reaction',
				value: 'createReaction',
				action: 'Create reaction',
				routing: {
					request: {
						method: 'PUT',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}/reactions/{{encodeURIComponent($parameter.emoji)}}/@me',
					},
					output: successOutput,
				},
			},
			{
				name: 'Delete Own Reaction',
				value: 'deleteOwnReaction',
				action: 'Delete own reaction',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}/reactions/{{encodeURIComponent($parameter.emoji)}}/@me',
					},
					output: successOutput,
				},
			},
			{
				name: 'Delete User Reaction',
				value: 'deleteUserReaction',
				action: 'Delete user reaction',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}/reactions/{{encodeURIComponent($parameter.emoji)}}/{{$parameter.userId}}',
					},
					output: successOutput,
				},
			},
			{
				name: 'Get Reactions',
				value: 'getReactions',
				action: 'Get reactions',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}/reactions/{{encodeURIComponent($parameter.emoji)}}',
					},
				},
			},
			{
				name: 'Delete All Reactions',
				value: 'deleteAllReactions',
				action: 'Delete all reactions',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}/reactions',
					},
					output: successOutput,
				},
			},
			{
				name: 'Delete All Reactions For Emoji',
				value: 'deleteAllReactionsForEmoji',
				action: 'Delete all reactions for emoji',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}/reactions/{{encodeURIComponent($parameter.emoji)}}',
					},
					output: successOutput,
				},
			},
			{
				name: 'Bulk Delete Messages',
				value: 'bulkDeleteMessages',
				action: 'Bulk delete messages',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/messages/bulk-delete',
						body: bulkDeleteBody,
					},
					output: successOutput,
				},
			},
			{
				name: 'Crosspost Message',
				value: 'crosspostMessage',
				action: 'Crosspost message',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}/crosspost',
					},
				},
			},
			{
				name: 'Edit Channel Permissions',
				value: 'editChannelPermissions',
				action: 'Edit channel permissions',
				routing: {
					send: {
						preSend: [presendEditChannelPermissions],
					},
					request: {
						method: 'PUT',
						url: '=/channels/{{$parameter.channelId}}/permissions/{{$parameter.overwriteId}}',
					},
					output: successOutput,
				},
			},
			{
				name: 'Delete Channel Permission',
				value: 'deleteChannelPermission',
				action: 'Delete channel permission',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/channels/{{$parameter.channelId}}/permissions/{{$parameter.overwriteId}}',
					},
					output: successOutput,
				},
			},
			{
				name: 'Get Channel Invites',
				value: 'getChannelInvites',
				action: 'Get channel invites',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/invites',
					},
				},
			},
			{
				name: 'Create Channel Invite',
				value: 'createChannelInvite',
				action: 'Create channel invite',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/invites',
						body: createInviteBody,
					},
				},
			},
			{
				name: 'Follow Announcement Channel',
				value: 'followAnnouncementChannel',
				action: 'Follow announcement channel',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/followers',
						body: followAnnouncementBody,
					},
				},
			},
			{
				name: 'Group DM Add Recipient',
				value: 'groupDmAddRecipient',
				action: 'Group dm add recipient',
				routing: {
					request: {
						method: 'PUT',
						url: '=/channels/{{$parameter.channelId}}/recipients/{{$parameter.userId}}',
						body: groupDmAddRecipientBody,
					},
				},
			},
			{
				name: 'Group DM Remove Recipient',
				value: 'groupDmRemoveRecipient',
				action: 'Group dm remove recipient',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/channels/{{$parameter.channelId}}/recipients/{{$parameter.userId}}',
					},
					output: successOutput,
				},
			},
			{
				name: 'Start Thread From Message',
				value: 'startThreadFromMessage',
				action: 'Start thread from message',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/messages/{{$parameter.messageId}}/threads',
						body: startThreadFromMessageBody,
					},
				},
			},
			{
				name: 'Start Thread Without Message',
				value: 'startThreadWithoutMessage',
				action: 'Start thread without message',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/threads',
						body: startThreadWithoutMessageBody,
					},
				},
			},
			{
				name: 'Start Thread In Forum Channel',
				value: 'startThreadInForumChannel',
				action: 'Start thread in forum channel',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/threads',
						body: startThreadInForumBody,
					},
				},
			},
			{
				name: 'Join Thread',
				value: 'joinThread',
				action: 'Join thread',
				routing: {
					request: {
						method: 'PUT',
						url: '=/channels/{{$parameter.channelId}}/thread-members/@me',
					},
					output: successOutput,
				},
			},
			{
				name: 'Add Thread Member',
				value: 'addThreadMember',
				action: 'Add thread member',
				routing: {
					request: {
						method: 'PUT',
						url: '=/channels/{{$parameter.channelId}}/thread-members/{{$parameter.userId}}',
					},
					output: successOutput,
				},
			},
			{
				name: 'Leave Thread',
				value: 'leaveThread',
				action: 'Leave thread',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/channels/{{$parameter.channelId}}/thread-members/@me',
					},
					output: successOutput,
				},
			},
			{
				name: 'Remove Thread Member',
				value: 'removeThreadMember',
				action: 'Remove thread member',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/channels/{{$parameter.channelId}}/thread-members/{{$parameter.userId}}',
					},
					output: successOutput,
				},
			},
			{
				name: 'Get Thread Member',
				value: 'getThreadMember',
				action: 'Get thread member',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/thread-members/{{$parameter.userId}}',
					},
				},
			},
			{
				name: 'List Thread Members',
				value: 'listThreadMembers',
				action: 'List thread members',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/thread-members',
					},
				},
			},
			{
				name: 'List Public Archived Threads',
				value: 'listPublicArchivedThreads',
				action: 'List public archived threads',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/threads/archived/public',
					},
				},
			},
			{
				name: 'List Private Archived Threads',
				value: 'listPrivateArchivedThreads',
				action: 'List private archived threads',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/threads/archived/private',
					},
				},
			},
			{
				name: 'List Joined Private Archived Threads',
				value: 'listJoinedPrivateArchivedThreads',
				action: 'List joined private archived threads',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/users/@me/threads/archived/private',
					},
				},
			},
		],
		default: 'get',
	},
];

export const channelFields: INodeProperties[] = [
	{
		displayName: 'Channel',
		name: 'channelId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['channel'],
			},
		},
		description: 'Channel ID. Discord snowflake ID of the channel.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['modify'],
			},
		},
		description: 'New channel name',
	},
	{
		displayName: 'Topic',
		name: 'topic',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['modify'],
			},
		},
		description: 'New text channel topic',
	},
	{
		displayName: 'Position',
		name: 'position',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['modify'],
			},
		},
		description: 'Sorting position of the channel',
	},
	{
		displayName: 'Parent Channel',
		name: 'parentId',
		type: 'string',
		default: '',
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['modify'],
			},
		},
		description: 'Parent category channel ID',
	},
	{
		displayName: 'Raw JSON',
		name: 'rawJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['modify'],
			},
		},
		description: 'Additional Discord channel JSON body fields. Values here override simple fields when keys overlap.',
	},
	{
		displayName: 'Message',
		name: 'messageId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: [
					'pinMessage',
					'unpinMessage',
					'createReaction',
					'deleteOwnReaction',
					'deleteUserReaction',
					'getReactions',
					'deleteAllReactions',
					'deleteAllReactionsForEmoji',
					'crosspostMessage',
					'startThreadFromMessage',
				],
			},
		},
		typeOptions: {
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
		description: 'Message ID. Discord snowflake ID of the message.',
	},
	{
		displayName: 'Emoji',
		name: 'emoji',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: [
					'createReaction',
					'deleteOwnReaction',
					'deleteUserReaction',
					'getReactions',
					'deleteAllReactionsForEmoji',
				],
			},
		},
		description:
			'Standard Unicode emoji (e.g. fire) or custom emoji in the form name:ID. The value is URL-encoded before sending.',
	},
	{
		displayName: 'User',
		name: 'userId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: [
					'deleteUserReaction',
					'groupDmAddRecipient',
					'groupDmRemoveRecipient',
					'addThreadMember',
					'removeThreadMember',
					'getThreadMember',
				],
			},
		},
		typeOptions: {
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
		description: 'User ID. Discord snowflake ID of the user.',
	},
	{
		displayName: 'Reaction Type',
		name: 'reactionType',
		type: 'options',
		default: '',
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Normal', value: 0 },
			{ name: 'Burst', value: 1 },
		],
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['getReactions'],
			},
		},
		description: 'Type of reaction to fetch. 0 is normal, 1 is burst (super reaction).',
		routing: {
			request: {
				qs: {
					type: '={{$parameter.reactionType === "" ? undefined : $parameter.reactionType}}',
				},
			},
		},
	},
	{
		displayName: 'After',
		name: 'reactionsAfter',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['getReactions'],
			},
		},
		description: 'Return reactions after this user snowflake ID',
		routing: {
			request: {
				qs: {
					after: '={{$parameter.reactionsAfter || undefined}}',
				},
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'reactionsLimit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 25,
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['getReactions'],
			},
		},
		description: 'Max number of reactions to return (1-100, default 25)',
		routing: {
			request: {
				qs: {
					limit: '={{$parameter.reactionsLimit}}',
				},
			},
		},
	},
	{
		displayName: 'Message IDs',
		name: 'bulkDeleteMessageIds',
		type: 'json',
		default: '[]',
		required: true,
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['bulkDeleteMessages'],
			},
		},
		description:
			'JSON array of 2 to 100 message snowflake IDs to delete. Messages older than 2 weeks are rejected by Discord.',
	},
	{
		displayName: 'Overwrite ID',
		name: 'overwriteId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['editChannelPermissions', 'deleteChannelPermission'],
			},
		},
		typeOptions: {
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
		description: 'Snowflake ID of the role or member to update permissions for',
	},
	createPermissionMultiOptionsField('Allow Permissions', 'allowFlags', {
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['editChannelPermissions'],
			},
		},
		description:
			'Permission flags to grant. Ignored if the Allow bitfield string below is set.',
	}),
	createPermissionMultiOptionsField('Deny Permissions', 'denyFlags', {
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['editChannelPermissions'],
			},
		},
		description:
			'Permission flags to deny. Ignored if the Deny bitfield string below is set.',
	}),
	{
		displayName: 'Allow',
		name: 'permissionAllow',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['editChannelPermissions'],
			},
		},
		description:
			'Bitwise value of all allowed permissions, as a string (Discord permission bitfield). When set, overrides the Allow Permissions flags above.',
	},
	{
		displayName: 'Deny',
		name: 'permissionDeny',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['editChannelPermissions'],
			},
		},
		description:
			'Bitwise value of all denied permissions, as a string (Discord permission bitfield). When set, overrides the Deny Permissions flags above.',
	},
	{
		displayName: 'Type',
		name: 'permissionType',
		type: 'options',
		default: 0,
		options: [
			{ name: 'Role', value: 0 },
			{ name: 'Member', value: 1 },
		],
		required: true,
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['editChannelPermissions'],
			},
		},
		description: 'Type of the overwrite target. 0 for role, 1 for member.',
	},
	{
		displayName: 'Max Age',
		name: 'inviteMaxAge',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['createChannelInvite'],
			},
		},
		description: 'Duration of invite in seconds before expiry. 0 for never. Default is 86400.',
	},
	{
		displayName: 'Max Uses',
		name: 'inviteMaxUses',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['createChannelInvite'],
			},
		},
		description: 'Maximum number of uses. 0 for unlimited.',
	},
	{
		displayName: 'Temporary',
		name: 'inviteTemporary',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['createChannelInvite'],
			},
		},
		description: 'Whether this invite only grants temporary membership',
	},
	{
		displayName: 'Unique',
		name: 'inviteUnique',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['createChannelInvite'],
			},
		},
		description:
			'Whether to create a unique invite that cannot be reused. Useful for one-time-use links.',
	},
	{
		displayName: 'Target Type',
		name: 'inviteTargetType',
		type: 'options',
		default: '',
		options: [
			{ name: 'Unset', value: '' },
			{ name: 'Stream', value: 1 },
			{ name: 'Embedded Application', value: 2 },
		],
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['createChannelInvite'],
			},
		},
		description: 'Type of target for this voice channel invite',
	},
	{
		displayName: 'Target User ID',
		name: 'inviteTargetUserId',
		type: 'string',
		default: '',
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['createChannelInvite'],
			},
		},
		description: 'User ID whose stream to display for this voice channel stream invite',
	},
	{
		displayName: 'Target Application ID',
		name: 'inviteTargetApplicationId',
		type: 'string',
		default: '',
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['createChannelInvite'],
			},
		},
		description: 'Embedded application ID for this voice channel embedded application invite',
	},
	{
		displayName: 'Webhook Channel ID',
		name: 'webhookChannelId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['followAnnouncementChannel'],
			},
		},
		typeOptions: {
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
		description: 'ID of the target channel that will receive crossposted messages',
	},
	{
		displayName: 'Access Token',
		name: 'recipientAccessToken',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['groupDmAddRecipient'],
			},
		},
		description: 'OAuth2 access token of the user with the gdm.join scope',
	},
	{
		displayName: 'Nickname',
		name: 'recipientNick',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['groupDmAddRecipient'],
			},
		},
		description: 'Nickname of the user being added to the group DM',
	},
	{
		displayName: 'Thread Name',
		name: 'threadName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: [
					'startThreadFromMessage',
					'startThreadWithoutMessage',
					'startThreadInForumChannel',
				],
			},
		},
		description: 'Name of the thread (1-100 characters)',
	},
	{
		displayName: 'Auto Archive Duration',
		name: 'autoArchiveDuration',
		type: 'options',
		default: '',
		options: [
			{ name: '1 Hour', value: 60 },
			{ name: '1 Week', value: 10080 },
			{ name: '24 Hours', value: 1440 },
			{ name: '3 Days', value: 4320 },
			{ name: 'Default', value: '' },
		],
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: [
					'startThreadFromMessage',
					'startThreadWithoutMessage',
					'startThreadInForumChannel',
				],
			},
		},
		description: 'Minutes before the thread auto-archives after inactivity',
	},
	{
		displayName: 'Rate Limit Per User',
		name: 'rateLimitPerUser',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: [
					'startThreadFromMessage',
					'startThreadWithoutMessage',
					'startThreadInForumChannel',
				],
			},
		},
		description: 'Slowmode rate limit per user in seconds (0-21600)',
	},
	{
		displayName: 'Thread Type',
		name: 'threadType',
		type: 'options',
		default: '',
		options: [
			{ name: 'Default', value: '' },
			{ name: 'Announcement Thread', value: 10 },
			{ name: 'Public Thread', value: 11 },
			{ name: 'Private Thread', value: 12 },
		],
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['startThreadWithoutMessage'],
			},
		},
		description: 'Type of thread to create. Defaults to private thread.',
	},
	{
		displayName: 'Invitable',
		name: 'threadInvitable',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['startThreadWithoutMessage'],
			},
		},
		description: 'Whether non-moderators can add other non-moderators to the private thread',
	},
	createRawJsonField(
		'Forum Thread Message',
		'forumMessage',
		'Raw Discord forum thread starter message JSON object. Supports content, embeds, allowed_mentions, components, attachments, flags, and sticker_ids.',
		'{"content":""}',
		{
			required: true,
			displayOptions: {
				show: {
					resource: ['channel'],
					operation: ['startThreadInForumChannel'],
				},
			},
		},
	),
	createRawJsonField(
		'Applied Tags',
		'appliedTags',
		'Raw JSON array of forum tag snowflake IDs to apply to the thread.',
		'[]',
		{
			displayOptions: {
				show: {
					resource: ['channel'],
					operation: ['startThreadInForumChannel'],
				},
			},
		},
	),
	{
		displayName: 'With Member',
		name: 'threadWithMember',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['getThreadMember', 'listThreadMembers'],
			},
		},
		description: 'Whether to include the guild member object for each thread member',
		routing: {
			request: {
				qs: {
					with_member: '={{$parameter.threadWithMember}}',
				},
			},
		},
	},
	{
		displayName: 'After',
		name: 'threadMembersAfter',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['listThreadMembers'],
			},
		},
		description: 'Return thread members after this user snowflake ID',
		routing: {
			request: {
				qs: {
					after: '={{$parameter.threadMembersAfter || undefined}}',
				},
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'threadMembersLimit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 100,
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['listThreadMembers'],
			},
		},
		description: 'Max number of thread members to return (1-100, default 100)',
		routing: {
			request: {
				qs: {
					limit: '={{$parameter.threadMembersLimit}}',
				},
			},
		},
	},
	{
		displayName: 'Before',
		name: 'archivedThreadsBefore',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: [
					'listPublicArchivedThreads',
					'listPrivateArchivedThreads',
					'listJoinedPrivateArchivedThreads',
				],
			},
		},
		description:
			'Return threads archived before this ISO8601 timestamp (or snowflake for joined private archived threads)',
		routing: {
			request: {
				qs: {
					before: '={{$parameter.archivedThreadsBefore || undefined}}',
				},
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'archivedThreadsLimit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: [
					'listPublicArchivedThreads',
					'listPrivateArchivedThreads',
					'listJoinedPrivateArchivedThreads',
				],
			},
		},
		description: 'Maximum number of threads to return',
		routing: {
			request: {
				qs: {
					limit: '={{$parameter.archivedThreadsLimit}}',
				},
			},
		},
	},
	createAuditLogReasonField({
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: [
					'modify',
					'delete',
					'pinMessage',
					'unpinMessage',
					'bulkDeleteMessages',
					'editChannelPermissions',
					'deleteChannelPermission',
					'createChannelInvite',
					'startThreadFromMessage',
					'startThreadWithoutMessage',
					'startThreadInForumChannel',
					'addThreadMember',
					'removeThreadMember',
				],
			},
		},
	}),
];
