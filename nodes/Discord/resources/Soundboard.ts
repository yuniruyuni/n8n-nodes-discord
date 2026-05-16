import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

import { createAuditLogReasonField } from '../shared/auditLog';
import { resolveDataUriFromBinary } from '../shared/dataUri';

export async function presendSoundboardSound(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const binaryParam = this.getNodeParameter('binaryPropertyName', '') as unknown;
	const binaryPropertyName = typeof binaryParam === 'string' ? binaryParam.trim() : '';
	if (binaryPropertyName === '') {
		return requestOptions;
	}

	const dataUri = await resolveDataUriFromBinary(this, this.getItemIndex(), binaryPropertyName);
	const body =
		requestOptions.body && typeof requestOptions.body === 'object'
			? (requestOptions.body as IDataObject)
			: {};
	return {
		...requestOptions,
		body: { ...body, sound: dataUri },
	};
}

const sendSoundBody =
	'={{ { ...($parameter.soundId !== "" ? { sound_id: $parameter.soundId } : {}), ...($parameter.sourceGuildId !== "" ? { source_guild_id: $parameter.sourceGuildId } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

const createGuildSoundBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), ...($parameter.sound !== "" ? { sound: $parameter.sound } : {}), volume: $parameter.volume, ...($parameter.emojiId !== "" ? { emoji_id: $parameter.emojiId } : {}), ...($parameter.emojiName !== "" ? { emoji_name: $parameter.emojiName } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

const modifyGuildSoundBody =
	'={{ { ...($parameter.name !== "" ? { name: $parameter.name } : {}), volume: $parameter.volume, ...($parameter.emojiId !== "" ? { emoji_id: $parameter.emojiId } : {}), ...($parameter.emojiName !== "" ? { emoji_name: $parameter.emojiName } : {}), ...JSON.parse($parameter.rawJson || "{}") } }}';

export const soundboardOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['soundboard'],
			},
		},
		options: [
			{
				name: 'Send Sound',
				value: 'sendSound',
				action: 'Send sound',
				routing: {
					request: {
						method: 'POST',
						url: '=/channels/{{$parameter.channelId}}/send-soundboard-sound',
						body: sendSoundBody,
					},
				},
			},
			{
				name: 'List Default Sounds',
				value: 'listDefaultSounds',
				action: 'List default sounds',
				routing: {
					request: {
						method: 'GET',
						url: '=/soundboard-default-sounds',
					},
				},
			},
			{
				name: 'List Guild Sounds',
				value: 'listGuildSounds',
				action: 'List guild sounds',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/soundboard-sounds',
					},
				},
			},
			{
				name: 'Get Guild Sound',
				value: 'getGuildSound',
				action: 'Get guild sound',
				routing: {
					request: {
						method: 'GET',
						url: '=/guilds/{{$parameter.guildId}}/soundboard-sounds/{{$parameter.soundId}}',
					},
				},
			},
			{
				name: 'Create Guild Sound',
				value: 'createGuildSound',
				action: 'Create guild sound',
				routing: {
					send: {
						preSend: [presendSoundboardSound],
					},
					request: {
						method: 'POST',
						url: '=/guilds/{{$parameter.guildId}}/soundboard-sounds',
						body: createGuildSoundBody,
					},
				},
			},
			{
				name: 'Modify Guild Sound',
				value: 'modifyGuildSound',
				action: 'Modify guild sound',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/guilds/{{$parameter.guildId}}/soundboard-sounds/{{$parameter.soundId}}',
						body: modifyGuildSoundBody,
					},
				},
			},
			{
				name: 'Delete Guild Sound',
				value: 'deleteGuildSound',
				action: 'Delete guild sound',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/guilds/{{$parameter.guildId}}/soundboard-sounds/{{$parameter.soundId}}',
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
		default: 'listDefaultSounds',
	},
];

export const soundboardFields: INodeProperties[] = [
	{
		displayName: 'Channel',
		name: 'channelId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['soundboard'],
				operation: ['sendSound'],
			},
		},
		description: 'Channel ID. Discord snowflake ID of the voice channel to play the sound in.',
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
				resource: ['soundboard'],
				operation: [
					'listGuildSounds',
					'getGuildSound',
					'createGuildSound',
					'modifyGuildSound',
					'deleteGuildSound',
				],
			},
		},
		description: 'Guild ID. Discord snowflake ID of the guild.',
	},
	{
		displayName: 'Sound',
		name: 'soundId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['soundboard'],
				operation: ['sendSound', 'getGuildSound', 'modifyGuildSound', 'deleteGuildSound'],
			},
		},
		description: 'Sound ID. Discord snowflake ID of the soundboard sound.',
	},
	{
		displayName: 'Source Guild ID',
		name: 'sourceGuildId',
		type: 'string',
		default: '',
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['soundboard'],
				operation: ['sendSound'],
			},
		},
		description:
			'Discord snowflake ID of the guild the sound belongs to. Required when sending a sound from a different guild.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['soundboard'],
				operation: ['createGuildSound', 'modifyGuildSound'],
			},
		},
		description: 'Soundboard sound name (2-32 characters)',
	},
	{
		displayName: 'Sound',
		name: 'sound',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['soundboard'],
				operation: ['createGuildSound'],
			},
		},
		description:
			'Audio file as a base64 data URI string (e.g., data:audio/mpeg;base64,... or data:audio/ogg;base64,...). Discord supports MP3 and OGG up to 512 KiB and 5.2 seconds. Ignored when Binary Property is set.',
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: '',
		placeholder: 'data',
		displayOptions: {
			show: {
				resource: ['soundboard'],
				operation: ['createGuildSound'],
			},
		},
		description:
			'Name of the input item binary property holding the audio file. When set, it is converted to a data URI and overrides the Sound field.',
	},
	{
		displayName: 'Volume',
		name: 'volume',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 1,
			numberPrecision: 2,
		},
		default: 1,
		displayOptions: {
			show: {
				resource: ['soundboard'],
				operation: ['createGuildSound', 'modifyGuildSound'],
			},
		},
		description: 'Sound playback volume between 0 and 1 inclusive',
	},
	{
		displayName: 'Emoji ID',
		name: 'emojiId',
		type: 'string',
		default: '',
		placeholder: 'e.g. 123456789012345678',
		displayOptions: {
			show: {
				resource: ['soundboard'],
				operation: ['createGuildSound', 'modifyGuildSound'],
			},
		},
		description: 'Discord snowflake ID of a custom emoji to associate with the sound',
	},
	{
		displayName: 'Emoji Name',
		name: 'emojiName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['soundboard'],
				operation: ['createGuildSound', 'modifyGuildSound'],
			},
		},
		description: 'Unicode emoji character to associate with the sound',
	},
	{
		displayName: 'Raw JSON',
		name: 'rawJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['soundboard'],
				operation: ['sendSound', 'createGuildSound', 'modifyGuildSound'],
			},
		},
		description:
			'Additional Discord soundboard JSON body fields. Values here override simple fields when keys overlap.',
	},
	createAuditLogReasonField({
		displayOptions: {
			show: {
				resource: ['soundboard'],
				operation: ['createGuildSound', 'modifyGuildSound', 'deleteGuildSound'],
			},
		},
	}),
];
