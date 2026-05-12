import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const applicationCommandEvents: DiscordEventMeta[] = [
	{
		name: 'APPLICATION_COMMAND_PERMISSIONS_UPDATE',
		displayName: 'Application Command Permissions Update',
		description: 'Application command permissions for a guild command were updated',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
];
