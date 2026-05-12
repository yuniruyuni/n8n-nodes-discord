import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createDiscordPaginationFields } from '../../nodes/Discord/shared/pagination';

describe('createDiscordPaginationFields', () => {
	it('returns three properties: limit, cursorType, cursorId', () => {
		const fields = createDiscordPaginationFields();
		assert.equal(fields.length, 3);
		assert.equal(fields[0].name, 'limit');
		assert.equal(fields[1].name, 'cursorType');
		assert.equal(fields[2].name, 'cursorId');
	});

	it('defaults limit max to 100 and uses default 50', () => {
		const [limit] = createDiscordPaginationFields();
		assert.equal(limit.type, 'number');
		assert.equal(limit.default, 50);
		assert.deepEqual(limit.typeOptions, { minValue: 1, maxValue: 100 });
	});

	it('respects maxLimit override', () => {
		const [limit] = createDiscordPaginationFields({ maxLimit: 25 });
		assert.deepEqual(limit.typeOptions, { minValue: 1, maxValue: 25 });
	});

	it('excludes "around" cursor option by default', () => {
		const [, cursor] = createDiscordPaginationFields();
		const values = (cursor.options ?? []).map((option) => (option as { value: string }).value);
		assert.deepEqual(values.sort(), ['after', 'before']);
	});

	it('includes "around" cursor option when requested', () => {
		const [, cursor] = createDiscordPaginationFields({ includeAround: true });
		const values = (cursor.options ?? []).map((option) => (option as { value: string }).value);
		assert.deepEqual(values.sort(), ['after', 'around', 'before'].sort());
	});

	it('cursorId field is a snowflake-like field (string type, ID mode)', () => {
		const [, , cursorId] = createDiscordPaginationFields();
		assert.equal(cursorId.name, 'cursorId');
		assert.equal(cursorId.type, 'string');
		assert.equal(cursorId.required, false);
	});

	it('propagates displayOptions onto every property', () => {
		const displayOptions = { show: { resource: ['channel'] } } as const;
		const fields = createDiscordPaginationFields({ displayOptions });
		for (const field of fields) {
			assert.deepEqual(field.displayOptions, displayOptions);
		}
	});
});
