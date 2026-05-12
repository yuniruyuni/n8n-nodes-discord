export interface DiscordGatewayCloseCodeMeta {
	name: string;
	reconnect: boolean;
	description: string;
}

export const DISCORD_GATEWAY_CLOSE_CODES: Record<number, DiscordGatewayCloseCodeMeta> = {
	4000: {
		name: 'UNKNOWN_ERROR',
		reconnect: true,
		description: 'An unknown error occurred. Try reconnecting.',
	},
	4001: {
		name: 'UNKNOWN_OPCODE',
		reconnect: true,
		description: 'An invalid Gateway opcode or an invalid payload for an opcode was sent.',
	},
	4002: {
		name: 'DECODE_ERROR',
		reconnect: true,
		description: 'An invalid payload was sent to Discord.',
	},
	4003: {
		name: 'NOT_AUTHENTICATED',
		reconnect: true,
		description: 'A payload was sent prior to identifying, or the session was invalidated.',
	},
	4004: {
		name: 'AUTHENTICATION_FAILED',
		reconnect: false,
		description: 'The account token sent with the Identify payload was incorrect.',
	},
	4005: {
		name: 'ALREADY_AUTHENTICATED',
		reconnect: true,
		description: 'More than one Identify payload was sent. Only send one.',
	},
	4007: {
		name: 'INVALID_SEQ',
		reconnect: true,
		description: 'The sequence sent when resuming the session was invalid. Reconnect and start a new session.',
	},
	4008: {
		name: 'RATE_LIMITED',
		reconnect: true,
		description: 'Too many payloads were sent in too short a period of time. You will be disconnected on exceeding the limit.',
	},
	4009: {
		name: 'SESSION_TIMED_OUT',
		reconnect: true,
		description: 'The session timed out. Reconnect and start a new one.',
	},
	4010: {
		name: 'INVALID_SHARD',
		reconnect: false,
		description: 'An invalid shard was sent when identifying.',
	},
	4011: {
		name: 'SHARDING_REQUIRED',
		reconnect: false,
		description: 'The session would have handled too many guilds. Sharding is required to connect.',
	},
	4012: {
		name: 'INVALID_API_VERSION',
		reconnect: false,
		description: 'An invalid version for the Gateway was sent.',
	},
	4013: {
		name: 'INVALID_INTENTS',
		reconnect: false,
		description: 'An invalid intent value was sent when identifying. The intent bitfield contained an invalid value.',
	},
	4014: {
		name: 'DISALLOWED_INTENTS',
		reconnect: false,
		description: 'A disallowed intent was sent. The intent may be privileged and not enabled or allowlisted for the application.',
	},
};

export function getCloseCodeMeta(code: number): DiscordGatewayCloseCodeMeta | undefined {
	return DISCORD_GATEWAY_CLOSE_CODES[code];
}
