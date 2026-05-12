import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const guildScheduledEventEvents: DiscordEventMeta[] = [
	{
		name: 'GUILD_SCHEDULED_EVENT_CREATE',
		displayName: 'Guild Scheduled Event Create',
		description: 'A guild scheduled event was created',
		requiredIntent: GATEWAY_INTENTS.GUILD_SCHEDULED_EVENTS,
	},
	{
		name: 'GUILD_SCHEDULED_EVENT_UPDATE',
		displayName: 'Guild Scheduled Event Update',
		description: 'A guild scheduled event was updated',
		requiredIntent: GATEWAY_INTENTS.GUILD_SCHEDULED_EVENTS,
	},
	{
		name: 'GUILD_SCHEDULED_EVENT_DELETE',
		displayName: 'Guild Scheduled Event Delete',
		description: 'A guild scheduled event was deleted',
		requiredIntent: GATEWAY_INTENTS.GUILD_SCHEDULED_EVENTS,
	},
	{
		name: 'GUILD_SCHEDULED_EVENT_USER_ADD',
		displayName: 'Guild Scheduled Event User Add',
		description: 'A user subscribed to a guild scheduled event',
		requiredIntent: GATEWAY_INTENTS.GUILD_SCHEDULED_EVENTS,
	},
	{
		name: 'GUILD_SCHEDULED_EVENT_USER_REMOVE',
		displayName: 'Guild Scheduled Event User Remove',
		description: 'A user unsubscribed from a guild scheduled event',
		requiredIntent: GATEWAY_INTENTS.GUILD_SCHEDULED_EVENTS,
	},
];
