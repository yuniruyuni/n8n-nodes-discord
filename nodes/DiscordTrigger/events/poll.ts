import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const pollEvents: DiscordEventMeta[] = [
	{
		name: 'MESSAGE_POLL_VOTE_ADD',
		displayName: 'Message Poll Vote Add',
		description: 'A user voted on a poll',
		requiredIntent: GATEWAY_INTENTS.GUILD_MESSAGE_POLLS,
	},
	{
		name: 'MESSAGE_POLL_VOTE_REMOVE',
		displayName: 'Message Poll Vote Remove',
		description: 'A user removed a vote on a poll',
		requiredIntent: GATEWAY_INTENTS.GUILD_MESSAGE_POLLS,
	},
];
