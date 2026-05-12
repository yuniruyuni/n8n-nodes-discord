import type { DiscordEventMeta } from './types';

export const entitlementEvents: DiscordEventMeta[] = [
	{
		name: 'ENTITLEMENT_CREATE',
		displayName: 'Entitlement Create',
		description: 'An entitlement was created for a user or guild',
	},
	{
		name: 'ENTITLEMENT_UPDATE',
		displayName: 'Entitlement Update',
		description: 'An entitlement was updated',
	},
	{
		name: 'ENTITLEMENT_DELETE',
		displayName: 'Entitlement Delete',
		description: 'An entitlement was deleted',
	},
];
