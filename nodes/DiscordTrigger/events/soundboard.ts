import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const soundboardEvents: DiscordEventMeta[] = [
	{
		name: 'SOUNDBOARD_SOUNDS_UPDATE',
		displayName: 'Soundboard Sounds Update',
		description: 'Guild soundboard sounds were updated',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
];
