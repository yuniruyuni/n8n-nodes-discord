import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const voiceEvents: DiscordEventMeta[] = [
	{
		name: 'VOICE_CHANNEL_EFFECT_SEND',
		displayName: 'Voice Channel Effect Send',
		description: 'A user sent an effect in a voice channel the bot is connected to',
		requiredIntent: GATEWAY_INTENTS.GUILD_VOICE_STATES,
	},
	{
		name: 'VOICE_STATE_UPDATE',
		displayName: 'Voice State Update',
		description: 'A user joined, left, or moved a voice channel',
		requiredIntent: GATEWAY_INTENTS.GUILD_VOICE_STATES,
	},
	{
		name: 'VOICE_SERVER_UPDATE',
		displayName: 'Voice Server Update',
		description: 'A guild voice server was updated',
		requiredIntent: GATEWAY_INTENTS.GUILD_VOICE_STATES,
	},
];
