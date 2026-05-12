import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	DISCORD_SNOWFLAKE_PATTERN,
	isDiscordSnowflake,
	parseDiscordSnowflake,
} from '../../nodes/Discord/shared/snowflake';

const DISCORD_EPOCH_MS = 1420070400000;

describe('isDiscordSnowflake', () => {
	it('accepts known good snowflake values', () => {
		assert.equal(isDiscordSnowflake('175928847299117063'), true);
		assert.equal(isDiscordSnowflake('1'), true);
		assert.equal(isDiscordSnowflake('18446744073709551615'), true);
	});

	it('rejects non-string values', () => {
		assert.equal(isDiscordSnowflake(undefined), false);
		assert.equal(isDiscordSnowflake(null), false);
		assert.equal(isDiscordSnowflake(123 as unknown), false);
		assert.equal(isDiscordSnowflake({} as unknown), false);
	});

	it('rejects non-numeric strings', () => {
		assert.equal(isDiscordSnowflake('abc'), false);
		assert.equal(isDiscordSnowflake('123abc'), false);
		assert.equal(isDiscordSnowflake('-123'), false);
		assert.equal(isDiscordSnowflake(''), false);
	});

	it('rejects strings too long (>20 digits)', () => {
		assert.equal(isDiscordSnowflake('123456789012345678901'), false);
	});

	it('rejects zero (snowflake must be > 0)', () => {
		assert.equal(isDiscordSnowflake('0'), false);
	});

	it('rejects values larger than uint64 max', () => {
		assert.equal(isDiscordSnowflake('18446744073709551616'), false);
	});

	it('exports a regex pattern string that matches digits 1-20 long', () => {
		const re = new RegExp(DISCORD_SNOWFLAKE_PATTERN);
		assert.equal(re.test('1'), true);
		assert.equal(re.test('12345678901234567890'), true);
		assert.equal(re.test('123456789012345678901'), false);
		assert.equal(re.test(''), false);
	});
});

describe('parseDiscordSnowflake', () => {
	it('throws on invalid snowflake', () => {
		assert.throws(() => parseDiscordSnowflake('not-a-snowflake'), /Invalid Discord snowflake/);
	});

	it('returns parts with id preserved and timestamp derived from Discord epoch', () => {
		const parts = parseDiscordSnowflake('175928847299117063');
		assert.equal(parts.id, '175928847299117063');
		assert.ok(parts.timestamp instanceof Date);
		assert.equal(parts.timestampMilliseconds, Number((BigInt('175928847299117063') >> BigInt(22)) + BigInt(DISCORD_EPOCH_MS)));
	});

	it('round-trips: timestamp >= epoch and matches computed value', () => {
		const snowflake = '175928847299117063';
		const parts = parseDiscordSnowflake(snowflake);
		assert.ok(parts.timestampMilliseconds >= DISCORD_EPOCH_MS);
		assert.equal(parts.timestamp.getTime(), parts.timestampMilliseconds);
	});

	it('decodes worker/process/increment bit ranges', () => {
		const parts = parseDiscordSnowflake('175928847299117063');
		assert.ok(parts.workerId >= 0 && parts.workerId < 32);
		assert.ok(parts.processId >= 0 && parts.processId < 32);
		assert.ok(parts.increment >= 0 && parts.increment < 4096);
	});

	it('decodes a synthetic snowflake constructed from known fields', () => {
		const tsMs = DISCORD_EPOCH_MS + 1000;
		const worker = 5;
		const process = 7;
		const increment = 42;
		const snowflake =
			((BigInt(tsMs) - BigInt(DISCORD_EPOCH_MS)) << BigInt(22)) |
			(BigInt(worker) << BigInt(17)) |
			(BigInt(process) << BigInt(12)) |
			BigInt(increment);
		const parts = parseDiscordSnowflake(snowflake.toString());
		assert.equal(parts.timestampMilliseconds, tsMs);
		assert.equal(parts.workerId, worker);
		assert.equal(parts.processId, process);
		assert.equal(parts.increment, increment);
	});
});
