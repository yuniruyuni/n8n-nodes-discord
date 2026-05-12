import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const guildEvents: DiscordEventMeta[] = [
	{
		name: 'GUILD_CREATE',
		displayName: 'Guild Create',
		description: 'Lazy-load for unavailable guild or guild that the bot joined',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'GUILD_UPDATE',
		displayName: 'Guild Update',
		description: 'Guild was updated',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'GUILD_DELETE',
		displayName: 'Guild Delete',
		description: 'Guild became unavailable or the bot left or was removed',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'GUILD_AUDIT_LOG_ENTRY_CREATE',
		displayName: 'Guild Audit Log Entry Create',
		description: 'A guild audit log entry was created',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'GUILD_BAN_ADD',
		displayName: 'Guild Ban Add',
		description: 'A user was banned from a guild',
		requiredIntent: GATEWAY_INTENTS.GUILD_MODERATION,
	},
	{
		name: 'GUILD_BAN_REMOVE',
		displayName: 'Guild Ban Remove',
		description: 'A user was unbanned from a guild',
		requiredIntent: GATEWAY_INTENTS.GUILD_MODERATION,
	},
	{
		name: 'GUILD_EMOJIS_UPDATE',
		displayName: 'Guild Emojis Update',
		description: 'Guild emojis were updated',
		requiredIntent: GATEWAY_INTENTS.GUILD_EMOJIS_AND_STICKERS,
	},
	{
		name: 'GUILD_STICKERS_UPDATE',
		displayName: 'Guild Stickers Update',
		description: 'Guild stickers were updated',
		requiredIntent: GATEWAY_INTENTS.GUILD_EMOJIS_AND_STICKERS,
	},
	{
		name: 'GUILD_INTEGRATIONS_UPDATE',
		displayName: 'Guild Integrations Update',
		description: 'Guild integration was updated',
		requiredIntent: GATEWAY_INTENTS.GUILD_INTEGRATIONS,
	},
	{
		name: 'GUILD_MEMBER_ADD',
		displayName: 'Guild Member Add',
		description: 'A new user joined a guild',
		requiredIntent: GATEWAY_INTENTS.GUILD_MEMBERS,
		privileged: true,
	},
	{
		name: 'GUILD_MEMBER_UPDATE',
		displayName: 'Guild Member Update',
		description: 'A guild member was updated',
		requiredIntent: GATEWAY_INTENTS.GUILD_MEMBERS,
		privileged: true,
	},
	{
		name: 'GUILD_MEMBER_REMOVE',
		displayName: 'Guild Member Remove',
		description: 'A user was removed from a guild',
		requiredIntent: GATEWAY_INTENTS.GUILD_MEMBERS,
		privileged: true,
	},
	{
		name: 'GUILD_MEMBERS_CHUNK',
		displayName: 'Guild Members Chunk',
		description: 'Response to a Request Guild Members operation',
		requiredIntent: GATEWAY_INTENTS.GUILD_MEMBERS,
		privileged: true,
	},
	{
		name: 'GUILD_ROLE_CREATE',
		displayName: 'Guild Role Create',
		description: 'A guild role was created',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'GUILD_ROLE_UPDATE',
		displayName: 'Guild Role Update',
		description: 'A guild role was updated',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'GUILD_ROLE_DELETE',
		displayName: 'Guild Role Delete',
		description: 'A guild role was deleted',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
];
