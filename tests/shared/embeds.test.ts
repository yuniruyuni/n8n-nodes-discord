import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	buildEmbedsFromCollection,
	validateEmbed,
	validateEmbeds,
} from '../../nodes/Discord/shared/embeds';
import type { DiscordEmbed, DiscordEmbedField } from '../../nodes/Discord/shared/embeds';

describe('validateEmbed', () => {
	it('accepts a minimal valid embed', () => {
		assert.doesNotThrow(() => validateEmbed({ title: 'hi' }));
		assert.doesNotThrow(() => validateEmbed({ description: 'body' }));
		assert.doesNotThrow(() => validateEmbed({}));
	});

	it('throws when title exceeds 256 characters', () => {
		assert.throws(() => validateEmbed({ title: 'x'.repeat(257) }), /title exceeds 256/);
	});

	it('throws when description exceeds 4096 characters', () => {
		assert.throws(() => validateEmbed({ description: 'x'.repeat(4097) }), /description exceeds 4096/);
	});

	it('throws when field count exceeds 25', () => {
		const fields: DiscordEmbedField[] = Array.from({ length: 26 }, (_unused, index) => ({
			name: `n${index}`,
			value: `v${index}`,
		}));
		assert.throws(() => validateEmbed({ fields }), /fields has 26 entries/);
	});

	it('throws when total characters exceed 6000', () => {
		const fields: DiscordEmbedField[] = Array.from({ length: 25 }, () => ({
			name: 'n'.repeat(256),
			value: 'v',
		}));
		assert.throws(() => validateEmbed({ fields }), /total characters/);
	});
});

describe('validateEmbeds', () => {
	it('throws when there are more than 10 embeds', () => {
		const embeds: DiscordEmbed[] = Array.from({ length: 11 }, () => ({ title: 'ok' }));
		assert.throws(() => validateEmbeds(embeds), /Too many embeds: 11/);
	});

	it('accepts 10 valid embeds', () => {
		const embeds: DiscordEmbed[] = Array.from({ length: 10 }, () => ({ title: 'ok' }));
		assert.doesNotThrow(() => validateEmbeds(embeds));
	});
});

describe('buildEmbedsFromCollection', () => {
	it('returns [] for empty inputs', () => {
		assert.deepEqual(buildEmbedsFromCollection(undefined), []);
		assert.deepEqual(buildEmbedsFromCollection(null), []);
		assert.deepEqual(buildEmbedsFromCollection(''), []);
		assert.deepEqual(buildEmbedsFromCollection({}), []);
	});

	it('drops empty optional fields and trims string values', () => {
		const result = buildEmbedsFromCollection({
			embed: [
				{
					title: '  hello  ',
					description: '',
					url: '',
					footer: { value: { text: '', iconUrl: '' } },
					image: { value: { url: '' } },
				},
			],
		});
		assert.equal(result.length, 1);
		assert.deepEqual(result[0], { title: 'hello' });
	});

	it('drops fully empty embed entries', () => {
		const result = buildEmbedsFromCollection({
			embed: [{ title: '', description: '' }],
		});
		assert.deepEqual(result, []);
	});

	it('throws when collection has more than 10 embeds', () => {
		const embed = Array.from({ length: 11 }, () => ({ title: 'ok' }));
		assert.throws(() => buildEmbedsFromCollection({ embed }), /Too many embeds: 11/);
	});

	it('extracts fields from a nested fixedCollection shape', () => {
		const result = buildEmbedsFromCollection({
			embed: [
				{
					title: 'T',
					fields: {
						field: [
							{ name: 'a', value: '1' },
							{ name: '', value: '2' },
							{ name: 'c', value: '3', inline: true },
						],
					},
				},
			],
		});
		assert.equal(result.length, 1);
		assert.deepEqual(result[0].fields, [
			{ name: 'a', value: '1' },
			{ name: 'c', value: '3', inline: true },
		]);
	});
});
