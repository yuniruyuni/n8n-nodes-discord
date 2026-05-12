import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

const ZERO = BigInt(0);
const ONE = BigInt(1);

export const DISCORD_PERMISSIONS = {
	CREATE_INSTANT_INVITE: ONE << BigInt(0),
	KICK_MEMBERS: ONE << BigInt(1),
	BAN_MEMBERS: ONE << BigInt(2),
	ADMINISTRATOR: ONE << BigInt(3),
	MANAGE_CHANNELS: ONE << BigInt(4),
	MANAGE_GUILD: ONE << BigInt(5),
	ADD_REACTIONS: ONE << BigInt(6),
	VIEW_AUDIT_LOG: ONE << BigInt(7),
	PRIORITY_SPEAKER: ONE << BigInt(8),
	STREAM: ONE << BigInt(9),
	VIEW_CHANNEL: ONE << BigInt(10),
	SEND_MESSAGES: ONE << BigInt(11),
	SEND_TTS_MESSAGES: ONE << BigInt(12),
	MANAGE_MESSAGES: ONE << BigInt(13),
	EMBED_LINKS: ONE << BigInt(14),
	ATTACH_FILES: ONE << BigInt(15),
	READ_MESSAGE_HISTORY: ONE << BigInt(16),
	MENTION_EVERYONE: ONE << BigInt(17),
	USE_EXTERNAL_EMOJIS: ONE << BigInt(18),
	VIEW_GUILD_INSIGHTS: ONE << BigInt(19),
	CONNECT: ONE << BigInt(20),
	SPEAK: ONE << BigInt(21),
	MUTE_MEMBERS: ONE << BigInt(22),
	DEAFEN_MEMBERS: ONE << BigInt(23),
	MOVE_MEMBERS: ONE << BigInt(24),
	USE_VAD: ONE << BigInt(25),
	CHANGE_NICKNAME: ONE << BigInt(26),
	MANAGE_NICKNAMES: ONE << BigInt(27),
	MANAGE_ROLES: ONE << BigInt(28),
	MANAGE_WEBHOOKS: ONE << BigInt(29),
	MANAGE_GUILD_EXPRESSIONS: ONE << BigInt(30),
	USE_APPLICATION_COMMANDS: ONE << BigInt(31),
	REQUEST_TO_SPEAK: ONE << BigInt(32),
	MANAGE_EVENTS: ONE << BigInt(33),
	MANAGE_THREADS: ONE << BigInt(34),
	CREATE_PUBLIC_THREADS: ONE << BigInt(35),
	CREATE_PRIVATE_THREADS: ONE << BigInt(36),
	USE_EXTERNAL_STICKERS: ONE << BigInt(37),
	SEND_MESSAGES_IN_THREADS: ONE << BigInt(38),
	USE_EMBEDDED_ACTIVITIES: ONE << BigInt(39),
	MODERATE_MEMBERS: ONE << BigInt(40),
	VIEW_CREATOR_MONETIZATION_ANALYTICS: ONE << BigInt(41),
	USE_SOUNDBOARD: ONE << BigInt(42),
	CREATE_GUILD_EXPRESSIONS: ONE << BigInt(43),
	CREATE_EVENTS: ONE << BigInt(44),
	USE_EXTERNAL_SOUNDS: ONE << BigInt(45),
	SEND_VOICE_MESSAGES: ONE << BigInt(46),
	SEND_POLLS: ONE << BigInt(49),
	USE_EXTERNAL_APPS: ONE << BigInt(50),
} as const;

export type DiscordPermissionName = keyof typeof DISCORD_PERMISSIONS;

export const discordPermissionOptions: INodePropertyOptions[] = Object.entries(DISCORD_PERMISSIONS).map(
	([name, value]) => ({
		name: titleCasePermissionName(name),
		value: name,
		description: `${name} (${value.toString()})`,
	}),
);

export function aggregateDiscordPermissions(permissions: Array<DiscordPermissionName | string>): string {
	const bitfield = permissions.reduce((total, permission) => {
		const value = DISCORD_PERMISSIONS[permission as DiscordPermissionName];
		return value === undefined ? total : total | value;
	}, ZERO);

	return bitfield.toString();
}

export function hasDiscordPermission(bitfield: string | number | bigint, permission: DiscordPermissionName): boolean {
	const permissions = BigInt(bitfield);
	return (permissions & DISCORD_PERMISSIONS[permission]) === DISCORD_PERMISSIONS[permission];
}

export function createPermissionMultiOptionsField(
	displayName = 'Permissions',
	name = 'permissions',
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName,
		name,
		type: 'multiOptions',
		default: [],
		options: discordPermissionOptions,
		description: 'Discord permission flags to combine into a permission bitfield',
		...overrides,
	};
}

function titleCasePermissionName(name: string): string {
	return name
		.toLowerCase()
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}
