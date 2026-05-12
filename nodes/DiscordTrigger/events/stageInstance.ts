import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const stageInstanceEvents: DiscordEventMeta[] = [
	{
		name: 'STAGE_INSTANCE_CREATE',
		displayName: 'Stage Instance Create',
		description: 'A stage instance was created (i.e., the stage is now live)',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'STAGE_INSTANCE_UPDATE',
		displayName: 'Stage Instance Update',
		description: 'A stage instance was updated',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
	{
		name: 'STAGE_INSTANCE_DELETE',
		displayName: 'Stage Instance Delete',
		description: 'A stage instance was deleted (i.e., the stage has ended)',
		requiredIntent: GATEWAY_INTENTS.GUILDS,
	},
];
