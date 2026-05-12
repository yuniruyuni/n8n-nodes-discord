import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	DISCORD_BUTTON_STYLE,
	DISCORD_COMPONENT_TYPE,
	buildButtonsActionRow,
	buildStringSelectActionRow,
	validateComponents,
} from '../../nodes/Discord/shared/components';
import type {
	DiscordActionRowComponent,
	DiscordButtonComponent,
} from '../../nodes/Discord/shared/components';

describe('DISCORD_BUTTON_STYLE constants', () => {
	it('matches Discord docs', () => {
		assert.equal(DISCORD_BUTTON_STYLE.PRIMARY, 1);
		assert.equal(DISCORD_BUTTON_STYLE.SECONDARY, 2);
		assert.equal(DISCORD_BUTTON_STYLE.SUCCESS, 3);
		assert.equal(DISCORD_BUTTON_STYLE.DANGER, 4);
		assert.equal(DISCORD_BUTTON_STYLE.LINK, 5);
	});
});

describe('validateComponents', () => {
	it('throws when there are more than 5 action rows', () => {
		const rows: DiscordActionRowComponent[] = Array.from({ length: 6 }, () => ({
			type: DISCORD_COMPONENT_TYPE.ACTION_ROW,
			components: [
				{
					type: DISCORD_COMPONENT_TYPE.BUTTON,
					style: DISCORD_BUTTON_STYLE.PRIMARY,
					custom_id: 'btn',
				},
			],
		}));
		assert.throws(() => validateComponents(rows), /at most 5 action rows/);
	});

	it('throws when a non-link button is missing customId', () => {
		const row: DiscordActionRowComponent = {
			type: DISCORD_COMPONENT_TYPE.ACTION_ROW,
			components: [
				{
					type: DISCORD_COMPONENT_TYPE.BUTTON,
					style: DISCORD_BUTTON_STYLE.PRIMARY,
				} as DiscordButtonComponent,
			],
		};
		assert.throws(() => validateComponents([row]), /Non-link buttons require a custom ID/);
	});

	it('throws when a link button is missing url', () => {
		const row: DiscordActionRowComponent = {
			type: DISCORD_COMPONENT_TYPE.ACTION_ROW,
			components: [
				{
					type: DISCORD_COMPONENT_TYPE.BUTTON,
					style: DISCORD_BUTTON_STYLE.LINK,
				} as DiscordButtonComponent,
			],
		};
		assert.throws(() => validateComponents([row]), /Link-style buttons require a URL/);
	});

	it('accepts a valid single action row with one button', () => {
		const row: DiscordActionRowComponent = {
			type: DISCORD_COMPONENT_TYPE.ACTION_ROW,
			components: [
				{
					type: DISCORD_COMPONENT_TYPE.BUTTON,
					style: DISCORD_BUTTON_STYLE.PRIMARY,
					custom_id: 'btn',
				},
			],
		};
		assert.doesNotThrow(() => validateComponents([row]));
	});
});

describe('buildButtonsActionRow', () => {
	it('returns [] when no buttons supplied', () => {
		assert.deepEqual(buildButtonsActionRow(undefined), []);
		assert.deepEqual(buildButtonsActionRow({}), []);
	});

	it('wraps buttons inside a type-1 action row', () => {
		const result = buildButtonsActionRow({
			button: [
				{ style: DISCORD_BUTTON_STYLE.PRIMARY, customId: 'a', label: 'Press' },
			],
		});
		assert.equal(result.length, 1);
		assert.equal(result[0].type, DISCORD_COMPONENT_TYPE.ACTION_ROW);
		assert.equal(result[0].components.length, 1);
		const first = result[0].components[0] as DiscordButtonComponent;
		assert.equal(first.type, DISCORD_COMPONENT_TYPE.BUTTON);
		assert.equal(first.style, DISCORD_BUTTON_STYLE.PRIMARY);
		assert.equal(first.custom_id, 'a');
		assert.equal(first.label, 'Press');
	});

	it('throws when a non-link button lacks customId', () => {
		assert.throws(
			() =>
				buildButtonsActionRow({
					button: [{ style: DISCORD_BUTTON_STYLE.PRIMARY }],
				}),
			/Non-link buttons require a custom ID/,
		);
	});

	it('throws when more than 5 buttons supplied to a single row', () => {
		const buttons = Array.from({ length: 6 }, (_unused, index) => ({
			style: DISCORD_BUTTON_STYLE.PRIMARY,
			customId: `b${index}`,
		}));
		assert.throws(() => buildButtonsActionRow({ button: buttons }), /at most 5 buttons/);
	});
});

describe('buildStringSelectActionRow', () => {
	it('returns [] when no select supplied', () => {
		assert.deepEqual(buildStringSelectActionRow(undefined), []);
		assert.deepEqual(buildStringSelectActionRow({}), []);
	});

	it('builds a valid select wrapped in a type-1 action row', () => {
		const result = buildStringSelectActionRow({
			select: {
				customId: 'pick',
				options: {
					option: [
						{ label: 'A', value: 'a' },
						{ label: 'B', value: 'b' },
					],
				},
			},
		});
		assert.equal(result.length, 1);
		assert.equal(result[0].type, DISCORD_COMPONENT_TYPE.ACTION_ROW);
		assert.equal(result[0].components.length, 1);
	});

	it('throws when more than 25 options supplied', () => {
		const option = Array.from({ length: 26 }, (_unused, index) => ({
			label: `L${index}`,
			value: `v${index}`,
		}));
		assert.throws(
			() =>
				buildStringSelectActionRow({
					select: { customId: 'pick', options: { option } },
				}),
			/at most 25 options/,
		);
	});

	it('throws when customId is missing', () => {
		assert.throws(
			() =>
				buildStringSelectActionRow({
					select: { options: { option: [{ label: 'A', value: 'a' }] } },
				}),
			/require a custom ID/,
		);
	});
});
