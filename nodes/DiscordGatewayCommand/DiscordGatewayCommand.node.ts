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
import { buildGatewayCommandPayload } from './payloads';

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
		codex: {
			categories: ['Communication'],
			subcategories: {
				Communication: ['Messaging'],
			},
			alias: [
				'bot',
				'presence',
				'status',
				'activity',
				'playing',
				'streaming',
				'voice state',
				'request guild members',
				'soundboard',
				'gateway',
				'websocket',
			],
		},
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
				const connectionName =
					(this.getNodeParameter('connectionName', i, 'default') as string) || 'default';

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

				const { operation, sentPayload } = buildGatewayCommandPayload(this, i);
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
