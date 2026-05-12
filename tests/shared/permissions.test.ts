import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	DISCORD_PERMISSIONS,
	aggregateDiscordPermissions,
	discordPermissionOptions,
	hasDiscordPermission,
} from '../../nodes/Discord/shared/permissions';

describe('aggregateDiscordPermissions', () => {
	it('returns "0" for empty input', () => {
		assert.equal(aggregateDiscordPermissions([]), '0');
	});

	it('OR-combines named flags into a decimal bitfield string', () => {
		const expected = (DISCORD_PERMISSIONS.ADMINISTRATOR | DISCORD_PERMISSIONS.MANAGE_CHANNELS).toString();
		assert.equal(aggregateDiscordPermissions(['ADMINISTRATOR', 'MANAGE_CHANNELS']), expected);
	});

	it('ignores unknown permission names', () => {
		assert.equal(aggregateDiscordPermissions(['NOT_A_REAL_FLAG']), '0');
		assert.equal(
			aggregateDiscordPermissions(['ADMINISTRATOR', 'NOT_A_REAL_FLAG']),
			DISCORD_PERMISSIONS.ADMINISTRATOR.toString(),
		);
	});
});

describe('hasDiscordPermission', () => {
	it('returns true when permission bit is set', () => {
		const bitfield = aggregateDiscordPermissions(['ADMINISTRATOR']);
		assert.equal(hasDiscordPermission(bitfield, 'ADMINISTRATOR'), true);
	});

	it('returns false when permission bit is unset', () => {
		const bitfield = aggregateDiscordPermissions(['MANAGE_CHANNELS']);
		assert.equal(hasDiscordPermission(bitfield, 'ADMINISTRATOR'), false);
	});

	it('accepts bigint and number inputs', () => {
		assert.equal(hasDiscordPermission(DISCORD_PERMISSIONS.ADMINISTRATOR, 'ADMINISTRATOR'), true);
		assert.equal(hasDiscordPermission(Number(DISCORD_PERMISSIONS.ADMINISTRATOR), 'ADMINISTRATOR'), true);
	});
});

describe('discordPermissionOptions', () => {
	it('is a non-empty array', () => {
		assert.ok(Array.isArray(discordPermissionOptions));
		assert.ok(discordPermissionOptions.length > 0);
	});

	it('each option has name/value/description', () => {
		for (const option of discordPermissionOptions) {
			assert.equal(typeof option.name, 'string');
			assert.ok((option.name as string).length > 0);
			assert.equal(typeof option.value, 'string');
			assert.ok((option.value as string).length > 0);
			assert.equal(typeof option.description, 'string');
		}
	});

	it('contains ADMINISTRATOR with title-cased display name', () => {
		const admin = discordPermissionOptions.find((option) => option.value === 'ADMINISTRATOR');
		assert.ok(admin);
		assert.equal(admin.name, 'Administrator');
	});
});
