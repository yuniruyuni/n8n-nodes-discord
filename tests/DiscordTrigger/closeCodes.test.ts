import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	DISCORD_GATEWAY_CLOSE_CODES,
	getCloseCodeMeta,
} from '../../nodes/DiscordTrigger/closeCodes';

describe('getCloseCodeMeta', () => {
	it('returns the entry for 4004 (authentication failed)', () => {
		const meta = getCloseCodeMeta(4004);
		assert.ok(meta);
		assert.equal(meta.name, 'AUTHENTICATION_FAILED');
		assert.equal(meta.reconnect, false);
		assert.equal(typeof meta.description, 'string');
	});

	it('returns undefined for unknown codes', () => {
		assert.equal(getCloseCodeMeta(9999), undefined);
		assert.equal(getCloseCodeMeta(0), undefined);
	});
});

describe('DISCORD_GATEWAY_CLOSE_CODES', () => {
	it('every documented code has name/reconnect/description', () => {
		for (const [code, meta] of Object.entries(DISCORD_GATEWAY_CLOSE_CODES)) {
			assert.equal(typeof meta.name, 'string', `code ${code} missing name`);
			assert.ok(meta.name.length > 0);
			assert.equal(typeof meta.reconnect, 'boolean', `code ${code} missing reconnect`);
			assert.equal(typeof meta.description, 'string', `code ${code} missing description`);
			assert.ok(meta.description.length > 0);
		}
	});

	it('includes critical authentication / intent codes', () => {
		assert.equal(DISCORD_GATEWAY_CLOSE_CODES[4004].name, 'AUTHENTICATION_FAILED');
		assert.equal(DISCORD_GATEWAY_CLOSE_CODES[4013].name, 'INVALID_INTENTS');
		assert.equal(DISCORD_GATEWAY_CLOSE_CODES[4014].name, 'DISALLOWED_INTENTS');
		assert.equal(DISCORD_GATEWAY_CLOSE_CODES[4014].reconnect, false);
	});
});
