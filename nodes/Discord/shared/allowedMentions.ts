import type { IDataObject, INodeProperties } from 'n8n-workflow';

import { DISCORD_SNOWFLAKE_PATTERN } from './snowflake';

export type DiscordAllowedMentionType = 'roles' | 'users' | 'everyone';

export interface DiscordAllowedMentions {
	parse?: DiscordAllowedMentionType[];
	roles?: string[];
	users?: string[];
	replied_user?: boolean;
}

export const DISCORD_ALLOWED_MENTIONS_MAX_ROLES = 100;
export const DISCORD_ALLOWED_MENTIONS_MAX_USERS = 100;

const ALLOWED_MENTION_TYPE_OPTIONS: Array<{ name: string; value: DiscordAllowedMentionType }> = [
	{ name: 'Roles', value: 'roles' },
	{ name: 'Users', value: 'users' },
	{ name: 'Everyone', value: 'everyone' },
];

export function createAllowedMentionsCollectionField(
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName: 'Allowed Mentions',
		name: 'allowedMentions',
		type: 'fixedCollection',
		default: {},
		description:
			'Controls which mentions inside the message actually ping recipients. See the Discord allowed_mentions object.',
		typeOptions: {
			multipleValues: false,
		},
		options: [
			{
				displayName: 'Values',
				name: 'values',
				values: [
					{
						displayName: 'Parse',
						name: 'parse',
						type: 'multiOptions',
						default: [],
						options: ALLOWED_MENTION_TYPE_OPTIONS,
						description:
							'Mention types Discord should auto-parse from the message content. Note: enabling "Roles" here forbids supplying explicit Role IDs (and same for Users).',
					},
					{
						displayName: 'Role IDs',
						name: 'roles',
						type: 'string',
						default: '',
						placeholder: '123456789012345678, 234567890123456789',
						description: `Comma-separated Discord role snowflakes whose mentions are permitted. Max ${DISCORD_ALLOWED_MENTIONS_MAX_ROLES}. Mutually exclusive with selecting "Roles" in Parse.`,
					},
					{
						displayName: 'User IDs',
						name: 'users',
						type: 'string',
						default: '',
						placeholder: '123456789012345678, 234567890123456789',
						description: `Comma-separated Discord user snowflakes whose mentions are permitted. Max ${DISCORD_ALLOWED_MENTIONS_MAX_USERS}. Mutually exclusive with selecting "Users" in Parse.`,
					},
					{
						displayName: 'Mention Replied User',
						name: 'repliedUser',
						type: 'boolean',
						default: false,
						description: 'Whether to ping the author of the message being replied to',
					},
				],
			},
		],
		...overrides,
	};
}

export function buildAllowedMentionsFromCollection(value: unknown): DiscordAllowedMentions | undefined {
	const collection = extractValues(value);
	if (collection === undefined) {
		return undefined;
	}

	const mentions: DiscordAllowedMentions = {};

	const parse = normalizeParse(collection.parse);
	if (parse !== undefined) {
		mentions.parse = parse;
	}

	const roles = splitSnowflakeList(collection.roles);
	if (roles.length > 0) {
		mentions.roles = roles;
	}

	const users = splitSnowflakeList(collection.users);
	if (users.length > 0) {
		mentions.users = users;
	}

	if (typeof collection.repliedUser === 'boolean' && collection.repliedUser) {
		mentions.replied_user = true;
	}

	if (
		mentions.parse === undefined &&
		mentions.roles === undefined &&
		mentions.users === undefined &&
		mentions.replied_user === undefined
	) {
		return undefined;
	}

	validateAllowedMentions(mentions);
	return mentions;
}

export function validateAllowedMentions(mentions: DiscordAllowedMentions): void {
	if (mentions.roles && mentions.roles.length > DISCORD_ALLOWED_MENTIONS_MAX_ROLES) {
		throw new Error(
			`Allowed Mentions: roles[] has ${mentions.roles.length} entries; Discord allows at most ${DISCORD_ALLOWED_MENTIONS_MAX_ROLES}.`,
		);
	}

	if (mentions.users && mentions.users.length > DISCORD_ALLOWED_MENTIONS_MAX_USERS) {
		throw new Error(
			`Allowed Mentions: users[] has ${mentions.users.length} entries; Discord allows at most ${DISCORD_ALLOWED_MENTIONS_MAX_USERS}.`,
		);
	}

	const parse = mentions.parse ?? [];
	if (parse.includes('roles') && mentions.roles && mentions.roles.length > 0) {
		throw new Error(
			'Allowed Mentions: parse contains "roles", so roles[] must be empty. Either remove "roles" from Parse or clear Role IDs.',
		);
	}
	if (parse.includes('users') && mentions.users && mentions.users.length > 0) {
		throw new Error(
			'Allowed Mentions: parse contains "users", so users[] must be empty. Either remove "users" from Parse or clear User IDs.',
		);
	}
}

function extractValues(value: unknown): IDataObject | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}

	if (typeof value !== 'object') {
		return undefined;
	}

	const container = value as IDataObject;
	const inner = container.values;
	if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
		return inner as IDataObject;
	}

	return container;
}

function normalizeParse(raw: unknown): DiscordAllowedMentionType[] | undefined {
	if (!Array.isArray(raw)) {
		return undefined;
	}

	const allowed = new Set<DiscordAllowedMentionType>(['roles', 'users', 'everyone']);
	const result: DiscordAllowedMentionType[] = [];
	for (const entry of raw) {
		if (typeof entry === 'string' && allowed.has(entry as DiscordAllowedMentionType)) {
			result.push(entry as DiscordAllowedMentionType);
		}
	}

	return result.length > 0 ? result : undefined;
}

function splitSnowflakeList(raw: unknown): string[] {
	if (raw === undefined || raw === null || raw === '') {
		return [];
	}

	const snowflakePattern = new RegExp(DISCORD_SNOWFLAKE_PATTERN);
	const source = Array.isArray(raw) ? raw.join(',') : String(raw);

	const entries = source
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part.length > 0);

	for (const entry of entries) {
		if (!snowflakePattern.test(entry)) {
			throw new Error(`Allowed Mentions: "${entry}" is not a valid Discord snowflake ID.`);
		}
	}

	return entries;
}
