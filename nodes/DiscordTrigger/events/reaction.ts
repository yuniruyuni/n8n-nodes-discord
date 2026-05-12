import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const reactionEvents: DiscordEventMeta[] = [
	{
		name: 'MESSAGE_REACTION_ADD',
		displayName: 'Message Reaction Add',
		description: 'A user reacted to a message',
		requiredIntent: GATEWAY_INTENTS.GUILD_MESSAGE_REACTIONS,
	},
	{
		name: 'MESSAGE_REACTION_REMOVE',
		displayName: 'Message Reaction Remove',
		description: 'A user removed their reaction from a message',
		requiredIntent: GATEWAY_INTENTS.GUILD_MESSAGE_REACTIONS,
	},
	{
		name: 'MESSAGE_REACTION_REMOVE_ALL',
		displayName: 'Message Reaction Remove All',
		description: 'All reactions were explicitly removed from a message',
		requiredIntent: GATEWAY_INTENTS.GUILD_MESSAGE_REACTIONS,
	},
	{
		name: 'MESSAGE_REACTION_REMOVE_EMOJI',
		displayName: 'Message Reaction Remove Emoji',
		description: 'All reactions for a given emoji were removed from a message',
		requiredIntent: GATEWAY_INTENTS.GUILD_MESSAGE_REACTIONS,
	},
];
