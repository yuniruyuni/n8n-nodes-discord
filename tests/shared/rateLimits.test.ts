import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	getRetryAfterMs,
	isRateLimited,
	parseRateLimitErrorBody,
	parseRateLimitHeaders,
} from '../../nodes/Discord/shared/rateLimits';

describe('isRateLimited', () => {
	it('returns true for 429', () => {
		assert.equal(isRateLimited(429), true);
	});

	it('returns false for other status codes', () => {
		assert.equal(isRateLimited(200), false);
		assert.equal(isRateLimited(500), false);
		assert.equal(isRateLimited(undefined), false);
	});
});

describe('parseRateLimitHeaders', () => {
	it('reads numeric/boolean/string fields from a plain record', () => {
		const parsed = parseRateLimitHeaders({
			'X-RateLimit-Limit': '5',
			'X-RateLimit-Remaining': '0',
			'X-RateLimit-Reset': '1700000000',
			'X-RateLimit-Reset-After': '1.25',
			'X-RateLimit-Bucket': 'abc',
			'X-RateLimit-Global': 'true',
			'X-RateLimit-Scope': 'user',
			'Retry-After': '2',
		});
		assert.deepEqual(parsed, {
			limit: 5,
			remaining: 0,
			reset: 1700000000,
			resetAfter: 1.25,
			bucket: 'abc',
			global: true,
			scope: 'user',
			retryAfter: 2,
		});
	});

	it('case-insensitive header lookup on records', () => {
		const parsed = parseRateLimitHeaders({ 'x-ratelimit-bucket': 'b' });
		assert.equal(parsed.bucket, 'b');
	});

	it('returns empty object when no recognized fields present', () => {
		assert.deepEqual(parseRateLimitHeaders({}), {});
	});

	it('ignores unknown scope values', () => {
		const parsed = parseRateLimitHeaders({ 'X-RateLimit-Scope': 'bogus' });
		assert.equal(parsed.scope, undefined);
	});

	it('also accepts a fetch Headers instance', () => {
		const headers = new Headers();
		headers.set('Retry-After', '3');
		const parsed = parseRateLimitHeaders(headers);
		assert.equal(parsed.retryAfter, 3);
	});
});

describe('getRetryAfterMs', () => {
	it('prefers the Retry-After header over body retry_after', () => {
		const ms = getRetryAfterMs(
			{ 'Retry-After': '2' },
			{ message: 'limited', retry_after: 10, global: false },
		);
		assert.equal(ms, 2000);
	});

	it('falls back to body retry_after when header missing', () => {
		const ms = getRetryAfterMs({}, { message: 'limited', retry_after: 1.5, global: false });
		assert.equal(ms, 1500);
	});

	it('returns undefined when neither header nor body provided', () => {
		assert.equal(getRetryAfterMs(undefined, undefined), undefined);
		assert.equal(getRetryAfterMs({}, {}), undefined);
	});
});

describe('parseRateLimitErrorBody', () => {
	it('returns a parsed body when shape matches', () => {
		const result = parseRateLimitErrorBody({
			message: 'You are being rate limited.',
			retry_after: 1.234,
			global: true,
			code: 0,
		});
		assert.deepEqual(result, {
			message: 'You are being rate limited.',
			retry_after: 1.234,
			global: true,
			code: 0,
		});
	});

	it('returns undefined for malformed input', () => {
		assert.equal(parseRateLimitErrorBody(undefined), undefined);
		assert.equal(parseRateLimitErrorBody(null), undefined);
		assert.equal(parseRateLimitErrorBody('not an object'), undefined);
		assert.equal(parseRateLimitErrorBody({ message: 'm' }), undefined);
		assert.equal(parseRateLimitErrorBody({ message: 'm', retry_after: '1', global: true }), undefined);
	});
});
