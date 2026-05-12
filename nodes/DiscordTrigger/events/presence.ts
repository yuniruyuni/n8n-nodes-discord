import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const presenceEvents: DiscordEventMeta[] = [
	{
		name: 'PRESENCE_UPDATE',
		displayName: 'Presence Update',
		description: 'A user presence was updated. Requires the privileged GUILD_PRESENCES intent',
		requiredIntent: GATEWAY_INTENTS.GUILD_PRESENCES,
		privileged: true,
	},
];
