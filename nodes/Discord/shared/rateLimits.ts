/**
 * Discord rate limit parsers and types only.
 * Throttling and retry are currently delegated to n8n's HTTP retry behavior.
 * When a custom retry strategy is needed, build it on top of
 * `parseRateLimitHeaders` and `getRetryAfterMs`.
 * Reference: https://docs.discord.com/developers/topics/rate-limits
 */

import type { IDataObject } from 'n8n-workflow';

export const DISCORD_RATE_LIMIT_LIMIT_HEADER = 'X-RateLimit-Limit';
export const DISCORD_RATE_LIMIT_REMAINING_HEADER = 'X-RateLimit-Remaining';
export const DISCORD_RATE_LIMIT_RESET_HEADER = 'X-RateLimit-Reset';
export const DISCORD_RATE_LIMIT_RESET_AFTER_HEADER = 'X-RateLimit-Reset-After';
export const DISCORD_RATE_LIMIT_BUCKET_HEADER = 'X-RateLimit-Bucket';
export const DISCORD_RATE_LIMIT_GLOBAL_HEADER = 'X-RateLimit-Global';
export const DISCORD_RATE_LIMIT_SCOPE_HEADER = 'X-RateLimit-Scope';
export const DISCORD_RETRY_AFTER_HEADER = 'Retry-After';

export const DISCORD_RATE_LIMIT_STATUS_CODE = 429;

export const DISCORD_RATE_LIMIT_SCOPES = ['user', 'global', 'shared'] as const;

export type DiscordRateLimitScope = (typeof DISCORD_RATE_LIMIT_SCOPES)[number];

export interface DiscordRateLimitHeaders {
	limit?: number;
	remaining?: number;
	reset?: number;
	resetAfter?: number;
	bucket?: string;
	global?: boolean;
	scope?: DiscordRateLimitScope;
	retryAfter?: number;
}

export interface DiscordRateLimitErrorBody {
	message: string;
	retry_after: number;
	global: boolean;
	code?: number;
}

// Accept both fetch `Headers` and plain record shapes since n8n request helpers
// expose headers either way depending on the HTTP backend in use.
export type DiscordRateLimitHeaderInput =
	| Headers
	| Record<string, string | string[] | number | boolean | undefined>;

export function isRateLimited(statusCode: number | undefined): boolean {
	return statusCode === DISCORD_RATE_LIMIT_STATUS_CODE;
}

export function parseRateLimitHeaders(headers: DiscordRateLimitHeaderInput): DiscordRateLimitHeaders {
	const get = createHeaderGetter(headers);
	const result: DiscordRateLimitHeaders = {};

	const limit = parseFiniteNumber(get(DISCORD_RATE_LIMIT_LIMIT_HEADER));
	if (limit !== undefined) {
		result.limit = limit;
	}

	const remaining = parseFiniteNumber(get(DISCORD_RATE_LIMIT_REMAINING_HEADER));
	if (remaining !== undefined) {
		result.remaining = remaining;
	}

	const reset = parseFiniteNumber(get(DISCORD_RATE_LIMIT_RESET_HEADER));
	if (reset !== undefined) {
		result.reset = reset;
	}

	const resetAfter = parseFiniteNumber(get(DISCORD_RATE_LIMIT_RESET_AFTER_HEADER));
	if (resetAfter !== undefined) {
		result.resetAfter = resetAfter;
	}

	const bucket = get(DISCORD_RATE_LIMIT_BUCKET_HEADER);
	if (typeof bucket === 'string' && bucket.length > 0) {
		result.bucket = bucket;
	}

	const global = parseBooleanHeader(get(DISCORD_RATE_LIMIT_GLOBAL_HEADER));
	if (global !== undefined) {
		result.global = global;
	}

	const scope = get(DISCORD_RATE_LIMIT_SCOPE_HEADER);
	if (typeof scope === 'string' && isRateLimitScope(scope)) {
		result.scope = scope;
	}

	const retryAfter = parseFiniteNumber(get(DISCORD_RETRY_AFTER_HEADER));
	if (retryAfter !== undefined) {
		result.retryAfter = retryAfter;
	}

	return result;
}

export function parseRateLimitErrorBody(body: unknown): DiscordRateLimitErrorBody | undefined {
	if (!body || typeof body !== 'object') {
		return undefined;
	}

	const candidate = body as IDataObject;
	const message = candidate.message;
	const retryAfter = candidate.retry_after;
	const global = candidate.global;

	if (typeof message !== 'string' || typeof retryAfter !== 'number' || typeof global !== 'boolean') {
		return undefined;
	}

	const parsed: DiscordRateLimitErrorBody = {
		message,
		retry_after: retryAfter,
		global,
	};

	if (typeof candidate.code === 'number') {
		parsed.code = candidate.code;
	}

	return parsed;
}

export function getRetryAfterMs(
	headers: DiscordRateLimitHeaderInput | undefined,
	body: unknown,
): number | undefined {
	if (headers) {
		const get = createHeaderGetter(headers);
		const headerValue = parseFiniteNumber(get(DISCORD_RETRY_AFTER_HEADER));
		if (headerValue !== undefined && headerValue >= 0) {
			return Math.round(headerValue * 1000);
		}
	}

	const parsedBody = parseRateLimitErrorBody(body);
	if (parsedBody && parsedBody.retry_after >= 0) {
		return Math.round(parsedBody.retry_after * 1000);
	}

	return undefined;
}

export function isGlobalRateLimit(
	headers: DiscordRateLimitHeaderInput | undefined,
	body: unknown,
): boolean {
	if (headers) {
		const get = createHeaderGetter(headers);
		const headerGlobal = parseBooleanHeader(get(DISCORD_RATE_LIMIT_GLOBAL_HEADER));
		if (headerGlobal === true) {
			return true;
		}

		const scope = get(DISCORD_RATE_LIMIT_SCOPE_HEADER);
		if (typeof scope === 'string' && scope === 'global') {
			return true;
		}
	}

	const parsedBody = parseRateLimitErrorBody(body);
	return parsedBody?.global === true;
}

// Header lookups are case-insensitive per RFC 7230; normalize both web `Headers`
// and plain records through the same accessor to keep parsing consistent.
function createHeaderGetter(headers: DiscordRateLimitHeaderInput): (name: string) => string | undefined {
	if (typeof Headers !== 'undefined' && headers instanceof Headers) {
		return (name) => headers.get(name) ?? undefined;
	}

	const lowerCased = new Map<string, string>();
	for (const [key, value] of Object.entries(headers)) {
		if (value === undefined) {
			continue;
		}
		const normalized = Array.isArray(value) ? value[0] : value;
		if (normalized === undefined) {
			continue;
		}
		lowerCased.set(key.toLowerCase(), String(normalized));
	}

	return (name) => lowerCased.get(name.toLowerCase());
}

function parseFiniteNumber(value: string | undefined): number | undefined {
	if (value === undefined || value === '') {
		return undefined;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBooleanHeader(value: string | undefined): boolean | undefined {
	if (value === undefined) {
		return undefined;
	}
	const normalized = value.toLowerCase();
	if (normalized === 'true') {
		return true;
	}
	if (normalized === 'false') {
		return false;
	}
	return undefined;
}

function isRateLimitScope(value: string): value is DiscordRateLimitScope {
	return (DISCORD_RATE_LIMIT_SCOPES as readonly string[]).includes(value);
}
