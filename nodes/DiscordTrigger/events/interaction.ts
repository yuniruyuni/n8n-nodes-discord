import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const interactionEvents: DiscordEventMeta[] = [
	{
		name: 'INTERACTION_CREATE',
		displayName: 'Interaction Create',
		description: 'A user used an interaction, such as an application command',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
];
