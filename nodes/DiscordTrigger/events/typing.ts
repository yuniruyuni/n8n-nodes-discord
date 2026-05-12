import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const typingEvents: DiscordEventMeta[] = [
	{
		name: 'TYPING_START',
		displayName: 'Typing Start',
		description: 'A user started typing in a channel',
		requiredIntent: GATEWAY_INTENTS.GUILD_MESSAGE_TYPING,
	},
];
