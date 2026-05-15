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
		displayName: 'Discord Gateway Send',
		name: 'discordGatewayCommand',
		icon: { light: 'file:discord.svg', dark: 'file:discord.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Send Discord Gateway commands (presence, voice state, member request, soundboard) through a running Discord Trigger connection',
		defaults: {
			name: 'Discord Gateway Send',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [],
		properties: [
			{
				displayName:
					'This node sends commands through a running Discord Trigger\'s WebSocket connection. The Trigger must be active in the same n8n process. Set "Connection Name" to match the Trigger\'s value (default: "default").',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Connection Name',
				name: 'connectionName',
				type: 'string',
				default: 'default',
				description:
					'Name of the Discord Trigger connection to send through. Match this with the Connection Name on a running Discord Trigger. Default "default" works if you only have one Trigger.',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Request Guild Members',
						value: 'requestGuildMembers',
						description:
							'Request the full member list of a guild. The result arrives as a GUILD_MEMBERS_CHUNK event on the matching Discord Trigger.',
						action: 'Request guild members',
					},
					{
						name: 'Request Soundboard Sounds',
						value: 'requestSoundboardSounds',
						description:
							'Request the available soundboard sounds in one or more guilds. The result arrives as SOUNDBOARD_SOUNDS events on the matching Discord Trigger.',
						action: 'Request soundboard sounds',
					},
					{
						name: 'Update Presence',
						value: 'updatePresence',
						description:
							'Change what the bot is shown as doing across all servers (e.g., "Playing Minecraft", "Listening to Lo-Fi"). Updates appear in member lists and the bot\'s profile.',
						action: 'Update presence',
					},
					{
						name: 'Update Voice State',
						value: 'updateVoiceState',
						description:
							'Move the bot into, out of, or between voice channels. Also toggles self mute and self deafen. Does not transmit audio.',
						action: 'Update voice state',
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
					{ name: 'Do Not Disturb', value: 'dnd' },
					{ name: 'Idle', value: 'idle' },
					{ name: 'Invisible', value: 'invisible' },
					{ name: 'Online', value: 'online' },
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
					{
						name: 'Competing In',
						value: 5,
						description: 'Shows as "Competing in &lt;name&gt;"',
					},
					{
						name: 'Custom Status',
						value: 4,
						description:
							'Shows just the text without a prefix; use "Activity State" for the visible text',
					},
					{
						name: 'Listening To',
						value: 2,
						description: 'Shows as "Listening to &lt;name&gt;"',
					},
					{
						name: 'None (Clear Activity)',
						value: -1,
						description: "Clear the bot's current activity",
					},
					{
						name: 'Playing',
						value: 0,
						description: 'Shows as "Playing &lt;name&gt;" under the bot',
					},
					{
						name: 'Streaming',
						value: 1,
						description:
							'Shows as "Streaming &lt;name&gt;" with a link (requires a Twitch or YouTube URL)',
					},
					{
						name: 'Watching',
						value: 3,
						description: 'Shows as "Watching &lt;name&gt;"',
					},
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
				placeholder: 'e.g. 123456789012345678',
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
				placeholder: 'e.g. 123456789012345678',
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
				placeholder: 'e.g. 123456789012345678, 234567890123456789',
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
				placeholder: 'e.g. 123456789012345678, 234567890123456789',
				displayOptions: { show: { operation: ['requestSoundboardSounds'] } },
				description: 'Comma-separated snowflake IDs of guilds to request soundboard sounds for',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
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
			} catch (error) {
				if (this.continueOnFail()) {
					const message = error instanceof Error ? error.message : String(error);
					returnData.push({
						json: { error: message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
