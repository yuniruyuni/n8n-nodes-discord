import { ApplicationError } from 'n8n-workflow';

import { DISCORD_SNOWFLAKE_PATTERN } from './snowflake';

const SNOWFLAKE_REGEX = new RegExp(DISCORD_SNOWFLAKE_PATTERN);

export function parseCommaSeparated(value: unknown): string[] {
	if (!value) return [];
	if (Array.isArray(value)) {
		return value
			.map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry)))
			.filter((entry) => entry.length > 0);
	}
	return String(value)
		.split(/[\s,]+/)
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

export function validateRequired<T>(value: T | undefined | null, fieldName: string): T {
	if (value === undefined || value === null || value === '') {
		throw new ApplicationError(`"${fieldName}" is required.`);
	}
	return value;
}

export function validateRange(
	value: number,
	fieldName: string,
	{ min, max }: { min?: number; max?: number },
): number {
	if (min !== undefined && value < min) {
		throw new ApplicationError(`"${fieldName}" must be at least ${min} (got ${value}).`);
	}
	if (max !== undefined && value > max) {
		throw new ApplicationError(`"${fieldName}" must be at most ${max} (got ${value}).`);
	}
	return value;
}

export function validateSnowflakeArray(
	values: string[],
	fieldName: string,
	options: { max?: number } = {},
): string[] {
	const { max } = options;
	if (max !== undefined && values.length > max) {
		throw new ApplicationError(
			`"${fieldName}" accepts at most ${max} entries (got ${values.length}).`,
		);
	}
	for (const value of values) {
		if (!SNOWFLAKE_REGEX.test(value)) {
			throw new ApplicationError(`"${fieldName}" contains an invalid snowflake: "${value}".`);
		}
	}
	return values;
}

export function validateSnowflake(value: string, fieldName: string): string {
	if (!SNOWFLAKE_REGEX.test(value)) {
		throw new ApplicationError(
			`"${fieldName}" must be a valid Discord snowflake (got "${value}").`,
		);
	}
	return value;
}
