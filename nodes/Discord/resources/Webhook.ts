import type {
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

import { createAllowedMentionsCollectionField } from '../shared/allowedMentions';
import { createAttachmentsCollectionField } from '../shared/attachments';
import { createAuditLogReasonField } from '../shared/auditLog';
import {
	createButtonComponentsField,
	createComponentsJsonField,
	createMediaGalleryField,
	createMentionableSelectComponentField,
	createSeparatorComponentField,
	createStringSelectComponentField,
	createTextDisplayField,
	createV2FileComponentField,
} from '../shared/components';
import { createEmbedsCollectionField } from '../shared/embeds';
import { applyMessageLikeBody, buildMessageLikePayload } from '../shared/messageLikePayload';
import { successOutput } from '../shared/routing';

// preSend for execute: assembles the full webhook payload and switches to multipart when files are attached.
export async function presendWebhookExecute(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	return applyMessageLikeBody(
		this,
		requestOptions,
		buildMessageLikePayload(this, {
			flags: 'number',
			include: {
				appliedTags: true,
				avatarUrl: true,
				poll: true,
				threadName: true,
				tts: true,
				username: true,
			},
		}),
	);
}

// preSend for editMessage: same multipart switch logic but uses the edit payload shape.
export async function presendWebhookEditMessage(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	return applyMessageLikeBody(
		this,
		requestOptions,
		buildMessageLikePayload(this, {
			include: {
				flags: false,
			},
		}),
	);
}

const createBody =
	'={{ { name: $parameter.name, ...($parameter.avatar !== "" ? { avatar: $parameter.avatar } : {}) } }}';

const modifyBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.avatar !== "" ? { avatar: $parameter.avatar } : {}), ...($parameter.channelId !== "" ? { channel_id: $parameter.channelId } : {}) } }}';

const modifyWithTokenBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.avatar !== "" ? { avatar: $parameter.avatar } : {}) } }}';

const slackGithubBody = '={{ JSON.parse($parameter.payload || "{}") }}';

export const webhookOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/webhooks',
						body: createBody,
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
						url: '=/webhooks/{{$parameter.webhookId}}',
					},
					output: successOutput,
				},
			},
			{
				name: 'Delete Message',
				value: 'deleteMessage',
				action: 'Delete message',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}/messages/{{$parameter.messageId}}',
						qs: {
							thread_id: '={{$parameter.threadId || undefined}}',
						},
					},
					output: successOutput,
				},
			},
			{
				name: 'Delete With Token',
				value: 'deleteWithToken',
				action: 'Delete with token',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}',
					},
					output: successOutput,
				},
			},
			{
				name: 'Edit Message',
				value: 'editMessage',
				action: 'Edit message',
				routing: {
					send: {
						preSend: [presendWebhookEditMessage],
					},
					request: {
						method: 'PATCH',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}/messages/{{$parameter.messageId}}',
						qs: {
							thread_id: '={{$parameter.threadId || undefined}}',
						},
					},
				},
			},
			{
				name: 'Execute',
				value: 'execute',
				action: 'Execute',
				routing: {
					send: {
						preSend: [presendWebhookExecute],
					},
					request: {
						method: 'POST',
						url: '={{$parameter.webhookUrl}}',
						qs: {
							thread_id: '={{$parameter.threadId || undefined}}',
							wait: '={{$parameter.wait}}',
						},
					},
				},
			},
			{
				name: 'Execute GitHub',
				value: 'executeGithub',
				action: 'Execute git hub',
				routing: {
					request: {
						method: 'POST',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}/github',
						body: slackGithubBody,
						qs: {
							thread_id: '={{$parameter.threadId || undefined}}',
							wait: '={{$parameter.wait}}',
						},
					},
				},
			},
			{
				name: 'Execute Slack',
				value: 'executeSlack',
				action: 'Execute slack',
				routing: {
					request: {
						method: 'POST',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}/slack',
						body: slackGithubBody,
						qs: {
							thread_id: '={{$parameter.threadId || undefined}}',
							wait: '={{$parameter.wait}}',
						},
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get',
				routing: {
					request: {
						method: 'GET',
						url: '=/webhooks/{{$parameter.webhookId}}',
					},
				},
			},
			{
				name: 'Get Channel Webhooks',
				value: 'getChannelWebhooks',
				action: 'Get channel webhooks',
				routing: {
					request: {
						method: 'GET',
						url: '=/channels/{{$parameter.channelId}}/webhooks',
					},
				},
			},
			{
				name: 'Get Guild Webhooks',
				value: 'getGuildWebhooks',
				action: 'Get guild webhooks',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/webhooks',
					},
				},
			},
			{
				name: 'Get Message',
				value: 'getMessage',
				action: 'Get message',
				routing: {
					request: {
						method: 'GET',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}/messages/{{$parameter.messageId}}',
						qs: {
							thread_id: '={{$parameter.threadId || undefined}}',
						},
					},
				},
			},
			{
				name: 'Get With Token',
				value: 'getWithToken',
				action: 'Get with token',
				routing: {
					request: {
						method: 'GET',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}',
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
						url: '=/webhooks/{{$parameter.webhookId}}',
						body: modifyBody,
					},
				},
			},
			{
				name: 'Modify With Token',
				value: 'modifyWithToken',
				action: 'Modify with token',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/webhooks/{{$parameter.webhookId}}/{{$parameter.webhookToken}}',
						body: modifyWithTokenBody,
					},
				},
			},
		],
		default: 'execute',
	},
];

const channelIdField: INodeProperties = {
	displayName: 'Channel',
	name: 'channelId',
	type: 'string',
	default: '',
	required: true,
	placeholder: 'e.g. 123456789012345678',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['create', 'getChannelWebhooks'],
		},
	},
	description: 'Channel ID. Discord snowflake ID of the channel.',
};

const guildIdField: INodeProperties = {
	displayName: 'Guild',
	name: 'guildId',
	type: 'string',
	default: '',
	required: true,
	placeholder: 'e.g. 123456789012345678',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['getGuildWebhooks'],
		},
	},
	description: 'Guild ID. Discord snowflake ID of the guild.',
};

const webhookIdField: INodeProperties = {
	displayName: 'Webhook',
	name: 'webhookId',
	type: 'string',
	default: '',
	required: true,
	placeholder: 'e.g. 123456789012345678',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: [
				'get',
				'getWithToken',
				'modify',
				'modifyWithToken',
				'delete',
				'deleteWithToken',
				'executeSlack',
				'executeGithub',
				'getMessage',
				'editMessage',
				'deleteMessage',
			],
		},
	},
	description: 'Webhook ID. Discord snowflake ID of the webhook.',
};

const webhookTokenField: INodeProperties = {
	displayName: 'Webhook Token',
	name: 'webhookToken',
	type: 'string',
	typeOptions: {
		password: true,
	},
	default: '',
	required: true,
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: [
				'getWithToken',
				'modifyWithToken',
				'deleteWithToken',
				'executeSlack',
				'executeGithub',
				'getMessage',
				'editMessage',
				'deleteMessage',
			],
		},
	},
	description: 'Webhook token. Returned with the webhook object and required for token-scoped endpoints.',
};

const messageIdField: INodeProperties = {
	displayName: 'Message',
	name: 'messageId',
	type: 'string',
	default: '',
	required: true,
	placeholder: 'e.g. 123456789012345678',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['getMessage', 'editMessage', 'deleteMessage'],
		},
	},
	description: 'Message ID. Discord snowflake ID of the webhook message.',
};

const webhookUrlField: INodeProperties = {
	displayName: 'Webhook URL',
	name: 'webhookUrl',
	type: 'string',
	typeOptions: {
		password: true,
	},
	default: '',
	required: true,
	placeholder: 'https://discord.com/api/webhooks/...',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description: 'Discord webhook URL, including webhook ID and token',
};

const createNameField: INodeProperties = {
	displayName: 'Name',
	name: 'name',
	type: 'string',
	default: '',
	required: true,
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['create'],
		},
	},
	description: 'Name of the webhook (1-80 characters)',
};

const modifyNameField: INodeProperties = {
	displayName: 'Name',
	name: 'name',
	type: 'string',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['modify', 'modifyWithToken'],
		},
	},
	description: 'New webhook name (1-80 characters)',
};

const createAvatarField: INodeProperties = {
	displayName: 'Avatar',
	name: 'avatar',
	type: 'string',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['create', 'modify', 'modifyWithToken'],
		},
	},
	description: 'Image data URI (data:image/png;base64,...) for the webhook avatar. Empty leaves the avatar unchanged.',
};

const modifyChannelField: INodeProperties = {
	displayName: 'Channel',
	name: 'channelId',
	type: 'string',
	default: '',
	placeholder: 'e.g. 123456789012345678',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['modify'],
		},
	},
	description: 'Channel ID to move the webhook to. Leave empty to keep the current channel.',
};

const payloadField: INodeProperties = {
	displayName: 'Payload',
	name: 'payload',
	type: 'json',
	default: '{}',
	required: true,
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['executeSlack', 'executeGithub'],
		},
	},
	description: 'Raw provider-formatted JSON body (Slack or GitHub webhook payload)',
};

const contentExecuteField: INodeProperties = {
	displayName: 'Content',
	name: 'content',
	type: 'string',
	typeOptions: {
		rows: 4,
	},
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
	description: 'Message content. Up to 2000 characters.',
};

const usernameField: INodeProperties = {
	displayName: 'Username',
	name: 'username',
	type: 'string',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description: 'Override the default username of the webhook for this message',
};

const avatarUrlField: INodeProperties = {
	displayName: 'Avatar URL',
	name: 'avatarUrl',
	type: 'string',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description: 'Override the default avatar URL of the webhook for this message',
};

const ttsField: INodeProperties = {
	displayName: 'TTS',
	name: 'tts',
	type: 'boolean',
	default: false,
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description: 'Whether the message should be sent as text-to-speech',
};

const flagsField: INodeProperties = {
	displayName: 'Flags',
	name: 'flags',
	type: 'number',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description:
		'Bitfield of Discord message flags. Common values: 4 (suppress embeds), 4096 (suppress notifications), 32768 (is components v2).',
};

const threadNameField: INodeProperties = {
	displayName: 'Thread Name',
	name: 'threadName',
	type: 'string',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description: 'Name of the thread to create. Only applies to forum or media channel webhooks.',
};

const appliedTagsField: INodeProperties = {
	displayName: 'Applied Tags',
	name: 'appliedTags',
	type: 'string',
	default: '',
	placeholder: '123456789012345678, 234567890123456789',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	description:
		'Comma-separated Discord forum tag snowflakes to apply to the new thread. Only used with forum channel webhooks.',
};

const pollField: INodeProperties = {
	displayName: 'Poll',
	name: 'poll',
	type: 'json',
	default: '',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute'],
		},
	},
	placeholder: '{"question":{"text":"Pick"},"answers":[{"poll_media":{"text":"A"}}],"duration":24}',
	description: 'Raw Discord poll create payload to attach to the message',
};

const threadIdField: INodeProperties = {
	displayName: 'Thread ID',
	name: 'threadId',
	type: 'string',
	default: '',
	placeholder: 'e.g. 123456789012345678',
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: [
				'execute',
				'executeSlack',
				'executeGithub',
				'getMessage',
				'editMessage',
				'deleteMessage',
			],
		},
	},
	description: 'If set, the message is sent to the specified thread within the webhook channel',
};

const waitField: INodeProperties = {
	displayName: 'Wait',
	name: 'wait',
	type: 'boolean',
	default: false,
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'executeSlack', 'executeGithub'],
		},
	},
	description:
		'Whether Discord should wait for confirmation and return the created message. Required to receive the message object back.',
};

const embedsField = createEmbedsCollectionField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const buttonRowField = createButtonComponentsField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
	name: 'buttonRow',
});

const stringSelectField = createStringSelectComponentField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
	name: 'stringSelect',
});

const mentionableSelectField = createMentionableSelectComponentField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
	name: 'mentionableSelect',
});

const componentsField = createComponentsJsonField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const textDisplaysField = createTextDisplayField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const separatorsField = createSeparatorComponentField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const mediaGalleryField = createMediaGalleryField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const v2FilesField = createV2FileComponentField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const attachmentsField = createAttachmentsCollectionField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const allowedMentionsField = createAllowedMentionsCollectionField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['execute', 'editMessage'],
		},
	},
});

const auditLogReasonField = createAuditLogReasonField({
	displayOptions: {
		show: {
			resource: ['webhook'],
			operation: ['create', 'modify', 'delete'],
		},
	},
});

export const webhookFields: INodeProperties[] = [
	channelIdField,
	guildIdField,
	webhookIdField,
	webhookTokenField,
	messageIdField,
	webhookUrlField,
	createNameField,
	modifyNameField,
	createAvatarField,
	modifyChannelField,
	payloadField,
	contentExecuteField,
	usernameField,
	avatarUrlField,
	ttsField,
	flagsField,
	threadNameField,
	appliedTagsField,
	pollField,
	threadIdField,
	waitField,
	embedsField,
	buttonRowField,
	stringSelectField,
	mentionableSelectField,
	componentsField,
	textDisplaysField,
	separatorsField,
	mediaGalleryField,
	v2FilesField,
	attachmentsField,
	allowedMentionsField,
	auditLogReasonField,
];
