import type { INodeProperties } from 'n8n-workflow';

const DISCORD_EPOCH = BigInt(1420070400000);
const MAX_UINT64 = BigInt('18446744073709551615');
const ZERO = BigInt(0);

export interface DiscordSnowflakeParts {
	id: string;
	timestamp: Date;
	timestampMilliseconds: number;
	workerId: number;
	processId: number;
	increment: number;
}

export const DISCORD_SNOWFLAKE_PATTERN = '^[0-9]{1,20}$';

export function isDiscordSnowflake(value: unknown): value is string {
	if (typeof value !== 'string' || !new RegExp(DISCORD_SNOWFLAKE_PATTERN).test(value)) {
		return false;
	}

	const snowflake = BigInt(value);
	return snowflake > ZERO && snowflake <= MAX_UINT64;
}

export function parseDiscordSnowflake(value: string): DiscordSnowflakeParts {
	if (!isDiscordSnowflake(value)) {
		throw new Error(`Invalid Discord snowflake: ${value}`);
	}

	const snowflake = BigInt(value);
	const timestampMilliseconds = Number((snowflake >> BigInt(22)) + DISCORD_EPOCH);

	return {
		id: value,
		timestamp: new Date(timestampMilliseconds),
		timestampMilliseconds,
		workerId: Number((snowflake & BigInt(0x3e0000)) >> BigInt(17)),
		processId: Number((snowflake & BigInt(0x1f000)) >> BigInt(12)),
		increment: Number(snowflake & BigInt(0xfff)),
	};
}

export function createSnowflakeField(
	displayName: string,
	name: string,
	description: string,
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		default: '',
		required: true,
		description,
		modes: [
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: DISCORD_SNOWFLAKE_PATTERN,
							errorMessage: 'Enter a valid Discord snowflake ID.',
						},
					},
				],
			},
		],
		...overrides,
	};
}
