import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const integrationEvents: DiscordEventMeta[] = [
	{
		name: 'INTEGRATION_CREATE',
		displayName: 'Integration Create',
		description: 'A guild integration was created',
		requiredIntent: GATEWAY_INTENTS.GUILD_INTEGRATIONS,
	},
	{
		name: 'INTEGRATION_UPDATE',
		displayName: 'Integration Update',
		description: 'A guild integration was updated',
		requiredIntent: GATEWAY_INTENTS.GUILD_INTEGRATIONS,
	},
	{
		name: 'INTEGRATION_DELETE',
		displayName: 'Integration Delete',
		description: 'A guild integration was deleted',
		requiredIntent: GATEWAY_INTENTS.GUILD_INTEGRATIONS,
	},
];
