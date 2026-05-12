import type { DiscordEventMeta } from './types';

export const coreEvents: DiscordEventMeta[] = [
	{
		name: 'HELLO',
		displayName: 'Hello',
		description: 'Defines the heartbeat interval after connecting to the Gateway',
	},
	{
		name: 'READY',
		displayName: 'Ready',
		description: 'Contains the initial state information after a successful Identify',
	},
	{
		name: 'RESUMED',
		displayName: 'Resumed',
		description: 'Sent in response to a successful Resume',
	},
	{
		name: 'RECONNECT',
		displayName: 'Reconnect',
		description: 'Server requests the client to reconnect and resume the session',
	},
	{
		name: 'INVALID_SESSION',
		displayName: 'Invalid Session',
		description: 'Indicates the current session is invalid and how to recover',
	},
	{
		name: 'RATE_LIMITED',
		displayName: 'Rate Limited',
		description: 'Synthetic event raised when the connection encounters a rate limit',
	},
];
