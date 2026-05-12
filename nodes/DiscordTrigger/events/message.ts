import { GATEWAY_INTENTS } from '../../Discord/shared/intents';
import type { DiscordEventMeta } from './types';

export const messageEvents: DiscordEventMeta[] = [
	{
		name: 'MESSAGE_CREATE',
		displayName: 'Message Create',
		description: 'A message was created. The content field requires the privileged MESSAGE_CONTENT intent',
		requiredIntent: GATEWAY_INTENTS.GUILD_MESSAGES,
		privileged: true,
	},
	{
		name: 'MESSAGE_UPDATE',
		displayName: 'Message Update',
		description: 'A message was edited. The content field requires the privileged MESSAGE_CONTENT intent',
		requiredIntent: GATEWAY_INTENTS.GUILD_MESSAGES,
		privileged: true,
	},
	{
		name: 'MESSAGE_DELETE',
		displayName: 'Message Delete',
		description: 'A message was deleted',
		requiredIntent: GATEWAY_INTENTS.GUILD_MESSAGES,
	},
	{
		name: 'MESSAGE_DELETE_BULK',
		displayName: 'Message Delete Bulk',
		description: 'Multiple messages were deleted at once',
		requiredIntent: GATEWAY_INTENTS.GUILD_MESSAGES,
	},
];
