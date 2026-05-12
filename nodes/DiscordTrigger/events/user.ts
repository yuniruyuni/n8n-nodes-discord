import type { DiscordEventMeta } from './types';

export const userEvents: DiscordEventMeta[] = [
	{
		name: 'USER_UPDATE',
		displayName: 'User Update',
		description: 'Properties about the current bot user changed',
	},
];
