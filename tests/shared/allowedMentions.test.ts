import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	DISCORD_ALLOWED_MENTIONS_MAX_ROLES,
	DISCORD_ALLOWED_MENTIONS_MAX_USERS,
	buildAllowedMentionsFromCollection,
	validateAllowedMentions,
} from '../../nodes/Discord/shared/allowedMentions';

describe('validateAllowedMentions', () => {
	it('throws when parse contains "users" and users[] is non-empty', () => {
		assert.throws(
			() => validateAllowedMentions({ parse: ['users'], users: ['123456789012345678'] }),
			/parse contains "users"/,
		);
	});

	it('throws when parse contains "roles" and roles[] is non-empty', () => {
		assert.throws(
			() => validateAllowedMentions({ parse: ['roles'], roles: ['123456789012345678'] }),
			/parse contains "roles"/,
		);
	});

	it('throws when users[] exceeds 100', () => {
		const users = Array.from({ length: DISCORD_ALLOWED_MENTIONS_MAX_USERS + 1 }, () => '123456789012345678');
		assert.throws(() => validateAllowedMentions({ users }), /users\[\] has 101 entries/);
	});

	it('throws when roles[] exceeds 100', () => {
		const roles = Array.from({ length: DISCORD_ALLOWED_MENTIONS_MAX_ROLES + 1 }, () => '123456789012345678');
		assert.throws(() => validateAllowedMentions({ roles }), /roles\[\] has 101 entries/);
	});

	it('accepts users/roles up to limit and disjoint parse', () => {
		assert.doesNotThrow(() => validateAllowedMentions({ parse: ['everyone'], users: ['123456789012345678'] }));
		assert.doesNotThrow(() => validateAllowedMentions({}));
	});
});

describe('buildAllowedMentionsFromCollection', () => {
	it('returns undefined for empty inputs', () => {
		assert.equal(buildAllowedMentionsFromCollection(undefined), undefined);
		assert.equal(buildAllowedMentionsFromCollection({}), undefined);
		assert.equal(buildAllowedMentionsFromCollection({ values: {} }), undefined);
	});

	it('parses comma-separated user IDs', () => {
		const result = buildAllowedMentionsFromCollection({
			values: { users: '123456789012345678, 234567890123456789' },
		});
		assert.deepEqual(result, { users: ['123456789012345678', '234567890123456789'] });
	});

	it('parses comma-separated role IDs', () => {
		const result = buildAllowedMentionsFromCollection({
			values: { roles: '111111111111111111,222222222222222222' },
		});
		assert.deepEqual(result, { roles: ['111111111111111111', '222222222222222222'] });
	});

	it('rejects non-snowflake values inside users/roles', () => {
		assert.throws(
			() => buildAllowedMentionsFromCollection({ values: { users: 'abc, 123' } }),
			/not a valid Discord snowflake/,
		);
	});

	it('preserves replied_user only when true', () => {
		const truthy = buildAllowedMentionsFromCollection({ values: { repliedUser: true } });
		assert.deepEqual(truthy, { replied_user: true });
		const falsy = buildAllowedMentionsFromCollection({ values: { repliedUser: false } });
		assert.equal(falsy, undefined);
	});

	it('normalizes parse and ignores unknown entries', () => {
		const result = buildAllowedMentionsFromCollection({
			values: { parse: ['everyone', 'bogus', 'roles'] },
		});
		assert.deepEqual(result, { parse: ['everyone', 'roles'] });
	});

	it('propagates mutual exclusion error from validation', () => {
		assert.throws(
			() =>
				buildAllowedMentionsFromCollection({
					values: { parse: ['users'], users: '123456789012345678' },
				}),
			/parse contains "users"/,
		);
	});
});
