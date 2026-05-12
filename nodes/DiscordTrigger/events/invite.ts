import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const inviteEvents: DiscordEventMeta[] = [
	{
		name: 'INVITE_CREATE',
		displayName: 'Invite Create',
		description: 'An invite to a channel was created',
		requiredIntent: GATEWAY_INTENTS.GUILD_INVITES,
	},
	{
		name: 'INVITE_DELETE',
		displayName: 'Invite Delete',
		description: 'An invite to a channel was deleted',
		requiredIntent: GATEWAY_INTENTS.GUILD_INVITES,
	},
];
