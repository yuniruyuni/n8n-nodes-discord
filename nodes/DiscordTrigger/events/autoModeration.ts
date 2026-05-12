import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const autoModerationEvents: DiscordEventMeta[] = [
	{
		name: 'AUTO_MODERATION_RULE_CREATE',
		displayName: 'Auto Moderation Rule Create',
		description: 'An auto moderation rule was created',
		requiredIntent: GATEWAY_INTENTS.AUTO_MODERATION_CONFIGURATION,
	},
	{
		name: 'AUTO_MODERATION_RULE_UPDATE',
		displayName: 'Auto Moderation Rule Update',
		description: 'An auto moderation rule was updated',
		requiredIntent: GATEWAY_INTENTS.AUTO_MODERATION_CONFIGURATION,
	},
	{
		name: 'AUTO_MODERATION_RULE_DELETE',
		displayName: 'Auto Moderation Rule Delete',
		description: 'An auto moderation rule was deleted',
		requiredIntent: GATEWAY_INTENTS.AUTO_MODERATION_CONFIGURATION,
	},
	{
		name: 'AUTO_MODERATION_ACTION_EXECUTION',
		displayName: 'Auto Moderation Action Execution',
		description: 'An auto moderation rule was triggered and an action was executed',
		requiredIntent: GATEWAY_INTENTS.AUTO_MODERATION_EXECUTION,
	},
];
