import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const channelThreadEvents: DiscordEventMeta[] = [
	{
		name: 'CHANNEL_CREATE',
		displayName: 'Channel Create',
		description: 'A new guild channel was created',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'CHANNEL_UPDATE',
		displayName: 'Channel Update',
		description: 'A channel was updated',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'CHANNEL_DELETE',
		displayName: 'Channel Delete',
		description: 'A channel was deleted',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'CHANNEL_PINS_UPDATE',
		displayName: 'Channel Pins Update',
		description: 'A message pinned or unpinned in a channel',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'THREAD_CREATE',
		displayName: 'Thread Create',
		description: 'A thread was created or the current user was added to one',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'THREAD_UPDATE',
		displayName: 'Thread Update',
		description: 'A thread was updated',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'THREAD_DELETE',
		displayName: 'Thread Delete',
		description: 'A thread was deleted',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'THREAD_LIST_SYNC',
		displayName: 'Thread List Sync',
		description: 'Sent when the current user gains access to a channel containing threads',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'THREAD_MEMBER_UPDATE',
		displayName: 'Thread Member Update',
		description: 'The thread member object for the current user was updated',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'THREAD_MEMBERS_UPDATE',
		displayName: 'Thread Members Update',
		description: 'Some users were added to or removed from a thread',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
		privileged: true,
	},
	{
		name: 'WEBHOOKS_UPDATE',
		displayName: 'Webhooks Update',
		description: 'A guild channel webhook was created, updated, or deleted',
		requiredIntent: GATEWAY_INTENTS.GUILD_WEBHOOKS,
	},
];
