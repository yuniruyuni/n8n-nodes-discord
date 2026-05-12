import type { DiscordEventMeta } from './types';

export const subscriptionEvents: DiscordEventMeta[] = [
	{
		name: 'SUBSCRIPTION_CREATE',
		displayName: 'Subscription Create',
		description: 'A premium app subscription was created',
	},
	{
		name: 'SUBSCRIPTION_UPDATE',
		displayName: 'Subscription Update',
		description: 'A premium app subscription was updated',
	},
	{
		name: 'SUBSCRIPTION_DELETE',
		displayName: 'Subscription Delete',
		description: 'A premium app subscription was deleted',
	},
];
