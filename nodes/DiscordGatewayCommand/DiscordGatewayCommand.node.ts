import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

import { getGatewaySender, listGatewaySenders } from '../DiscordTrigger/gatewaySendBus';

const OPCODE_UPDATE_PRESENCE = 3;
const OPCODE_UPDATE_VOICE_STATE = 4;
const OPCODE_REQUEST_GUILD_MEMBERS = 8;
const OPCODE_REQUEST_SOUNDBOARD_SOUNDS = 31;

function splitSnowflakes(value: string): string[] {
	return value
		.split(',')
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}

export class DiscordGatewayCommand implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Discord Gateway Command',
		name: 'discordGatewayCommand',
		icon: { light: 'file:discord.svg', dark: 'file:discord.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Send a Discord Gateway command (Update Presence, Update Voice State, Request Guild Members, Request Soundboard Sounds) through an active Discord Trigger connection',
		defaults: {
			name: 'Discord Gateway Command',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [],
		properties: [
			{
				displayName: 'Connection Name',
				name: 'connectionName',
				type: 'string',
				default: 'default',
				description:
					"Name of the Discord Trigger's connection to send through. Must match the Connection Name on a running Discord Trigger.",
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Update Presence',
						value: 'updatePresence',
						description: "Set the bot's status and current activity (opcode 3)",
						action: 'Update presence',
					},
					{
						name: 'Update Voice State',
						value: 'updateVoiceState',
						description: 'Join, leave, or move the bot in a voice channel (opcode 4)',
						action: 'Update voice state',
					},
					{
						name: 'Request Guild Members',
						value: 'requestGuildMembers',
						description:
							'Bulk-request members of a guild; response arrives as GUILD_MEMBERS_CHUNK events (opcode 8)',
						action: 'Request guild members',
					},
					{
						name: 'Request Soundboard Sounds',
						value: 'requestSoundboardSounds',
						description:
							'Request available soundboard sounds in guilds; response arrives as SOUNDBOARD_SOUNDS events (opcode 31)',
						action: 'Request soundboard sounds',
					},
				],
				default: 'updatePresence',
			},

			// Update Presence fields
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Online', value: 'online' },
					{ name: 'Do Not Disturb', value: 'dnd' },
					{ name: 'Idle', value: 'idle' },
					{ name: 'Invisible', value: 'invisible' },
				],
				default: 'online',
				displayOptions: { show: { operation: ['updatePresence'] } },
				description: "The bot's new status",
			},
			{
				displayName: 'AFK',
				name: 'afk',
				type: 'boolean',
				default: false,
				displayOptions: { show: { operation: ['updatePresence'] } },
				description: 'Whether the bot is AFK',
			},
			{
				displayName: 'Since (Unix Ms)',
				name: 'since',
				type: 'number',
				default: 0,
				displayOptions: { show: { operation: ['updatePresence'] } },
				description:
					'Unix milliseconds since the bot went idle. Used when status is idle. Leave 0 for null.',
			},
			{
				displayName: 'Activity Type',
				name: 'activityType',
				type: 'options',
				options: [
					{ name: 'Competing', value: 5 },
					{ name: 'Custom', value: 4 },
					{ name: 'Game (Playing)', value: 0 },
					{ name: 'Listening', value: 2 },
					{ name: 'None', value: -1 },
					{ name: 'Streaming', value: 1 },
					{ name: 'Watching', value: 3 },
				],
				default: -1,
				displayOptions: { show: { operation: ['updatePresence'] } },
				description: 'Type of activity to display. Select None to clear activities.',
			},
			{
				displayName: 'Activity Name',
				name: 'activityName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['updatePresence'],
						activityType: [0, 1, 2, 3, 4, 5],
					},
				},
				description: 'Name of the activity (required when activity type is set)',
			},
			{
				displayName: 'Activity URL',
				name: 'activityUrl',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['updatePresence'],
						activityType: [1],
					},
				},
				description: 'Stream URL (Twitch or YouTube). Only used for Streaming activity.',
			},
			{
				displayName: 'Activity State',
				name: 'activityState',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['updatePresence'],
						activityType: [0, 1, 2, 3, 4, 5],
					},
				},
				description:
					"User-defined state. For Custom activity (type 4), this becomes the visible text.",
			},

			// Update Voice State fields
			{
				displayName: 'Guild ID',
				name: 'guildId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: { operation: ['updateVoiceState', 'requestGuildMembers'] },
				},
				description: 'Snowflake ID of the guild',
			},
			{
				displayName: 'Channel ID',
				name: 'channelId',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['updateVoiceState'] } },
				description: 'Snowflake ID of the voice channel. Leave empty to disconnect.',
			},
			{
				displayName: 'Self Mute',
				name: 'selfMute',
				type: 'boolean',
				default: false,
				displayOptions: { show: { operation: ['updateVoiceState'] } },
				description: 'Whether the bot is self-muted',
			},
			{
				displayName: 'Self Deaf',
				name: 'selfDeaf',
				type: 'boolean',
				default: false,
				displayOptions: { show: { operation: ['updateVoiceState'] } },
				description: 'Whether the bot is self-deafened',
			},

			// Request Guild Members fields
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['requestGuildMembers'] } },
				description:
					'Username prefix to match. Use empty string with limit 0 for all members. Mutually exclusive with User IDs.',
			},
			{
				displayName: 'Max Members',
				name: 'maxMembers',
				type: 'number',
				default: 0,
				displayOptions: { show: { operation: ['requestGuildMembers'] } },
				description:
					'Maximum number of members to return. 0 means no limit. Max 100 unless User IDs are provided.',
			},
			{
				displayName: 'Presences',
				name: 'presences',
				type: 'boolean',
				default: false,
				displayOptions: { show: { operation: ['requestGuildMembers'] } },
				description:
					'Whether to include member presences in the response. Requires the GUILD_PRESENCES privileged intent.',
			},
			{
				displayName: 'User IDs',
				name: 'userIds',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['requestGuildMembers'] } },
				description:
					'Comma-separated snowflake IDs to fetch (max 100). Mutually exclusive with Query.',
			},
			{
				displayName: 'Nonce',
				name: 'nonce',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['requestGuildMembers'] } },
				description:
					'Optional nonce (max 32 characters) used to correlate the GUILD_MEMBERS_CHUNK response',
			},

			// Request Soundboard Sounds fields
			{
				displayName: 'Guild IDs',
				name: 'guildIds',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['requestSoundboardSounds'] } },
				description: 'Comma-separated snowflake IDs of guilds to request soundboard sounds for',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const connectionName = (this.getNodeParameter('connectionName', i, 'default') as string) || 'default';
			const operation = this.getNodeParameter('operation', i) as string;

			const sender = getGatewaySender(connectionName);
			if (!sender) {
				const known = listGatewaySenders();
				const hint = known.length > 0 ? ` Known connections: ${known.join(', ')}.` : '';
				throw new NodeOperationError(
					this.getNode(),
					`No active Discord Gateway connection named '${connectionName}'. Make sure a Discord Trigger with this Connection Name is running.${hint}`,
					{ itemIndex: i },
				);
			}

			let op: number;
			let d: IDataObject;

			if (operation === 'updatePresence') {
				const status = this.getNodeParameter('status', i, 'online') as string;
				const afk = this.getNodeParameter('afk', i, false) as boolean;
				const since = this.getNodeParameter('since', i, 0) as number;
				const activityType = this.getNodeParameter('activityType', i, -1) as number;

				const activities: IDataObject[] = [];
				if (activityType >= 0) {
					const activityName = (this.getNodeParameter('activityName', i, '') as string).trim();
					if (activityName === '') {
						throw new NodeOperationError(
							this.getNode(),
							'Activity Name is required when Activity Type is set',
							{ itemIndex: i },
						);
					}
					const activity: IDataObject = {
						type: activityType,
						name: activityName,
					};
					if (activityType === 1) {
						const activityUrl = (this.getNodeParameter('activityUrl', i, '') as string).trim();
						if (activityUrl !== '') {
							activity.url = activityUrl;
						}
					}
					const activityState = (this.getNodeParameter('activityState', i, '') as string).trim();
					if (activityState !== '') {
						activity.state = activityState;
					}
					activities.push(activity);
				}

				op = OPCODE_UPDATE_PRESENCE;
				d = {
					since: since > 0 ? since : null,
					activities,
					status,
					afk,
				};
			} else if (operation === 'updateVoiceState') {
				const guildId = (this.getNodeParameter('guildId', i, '') as string).trim();
				const channelId = (this.getNodeParameter('channelId', i, '') as string).trim();
				const selfMute = this.getNodeParameter('selfMute', i, false) as boolean;
				const selfDeaf = this.getNodeParameter('selfDeaf', i, false) as boolean;

				if (guildId === '') {
					throw new NodeOperationError(this.getNode(), 'Guild ID is required', {
						itemIndex: i,
					});
				}

				op = OPCODE_UPDATE_VOICE_STATE;
				d = {
					guild_id: guildId,
					channel_id: channelId === '' ? null : channelId,
					self_mute: selfMute,
					self_deaf: selfDeaf,
				};
			} else if (operation === 'requestGuildMembers') {
				const guildId = (this.getNodeParameter('guildId', i, '') as string).trim();
				const query = this.getNodeParameter('query', i, '') as string;
				const maxMembers = this.getNodeParameter('maxMembers', i, 0) as number;
				const presences = this.getNodeParameter('presences', i, false) as boolean;
				const userIdsRaw = (this.getNodeParameter('userIds', i, '') as string).trim();
				const nonce = (this.getNodeParameter('nonce', i, '') as string).trim();

				if (guildId === '') {
					throw new NodeOperationError(this.getNode(), 'Guild ID is required', {
						itemIndex: i,
					});
				}

				const userIds = userIdsRaw === '' ? [] : splitSnowflakes(userIdsRaw);

				if (query !== '' && userIds.length > 0) {
					throw new NodeOperationError(
						this.getNode(),
						'Query and User IDs are mutually exclusive; provide only one',
						{ itemIndex: i },
					);
				}

				const payload: IDataObject = {
					guild_id: guildId,
					limit: maxMembers,
					presences,
				};
				if (userIds.length > 0) {
					payload.user_ids = userIds;
				} else {
					payload.query = query;
				}
				if (nonce !== '') {
					payload.nonce = nonce;
				}

				op = OPCODE_REQUEST_GUILD_MEMBERS;
				d = payload;
			} else if (operation === 'requestSoundboardSounds') {
				const guildIdsRaw = (this.getNodeParameter('guildIds', i, '') as string).trim();
				const guildIds = splitSnowflakes(guildIdsRaw);
				if (guildIds.length === 0) {
					throw new NodeOperationError(
						this.getNode(),
						'At least one Guild ID is required',
						{ itemIndex: i },
					);
				}

				op = OPCODE_REQUEST_SOUNDBOARD_SOUNDS;
				d = { guild_ids: guildIds };
			} else {
				throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, {
					itemIndex: i,
				});
			}

			const sentPayload = { op, d };
			try {
				sender(sentPayload);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				throw new NodeOperationError(
					this.getNode(),
					`Failed to send Discord Gateway command: ${message}`,
					{ itemIndex: i },
				);
			}

			returnData.push({
				json: {
					success: true,
					operation,
					connectionName,
					sentPayload: sentPayload as unknown as IDataObject,
				},
				pairedItem: { item: i },
			});
		}

		return [returnData];
	}
}
