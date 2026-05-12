import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	buildAttachmentMetadata,
	buildDiscordMultipartBody,
	getAttachmentBinaryPropertyNames,
} from '../../nodes/Discord/shared/attachments';

describe('buildAttachmentMetadata', () => {
	it('assigns sequential numeric ids starting at 0', () => {
		const result = buildAttachmentMetadata([
			{ binaryPropertyName: 'a' },
			{ binaryPropertyName: 'b' },
			{ binaryPropertyName: 'c' },
		]);
		assert.equal(result.length, 3);
		assert.equal(result[0].id, 0);
		assert.equal(result[1].id, 1);
		assert.equal(result[2].id, 2);
	});

	it('copies through filename/description/contentType when set', () => {
		const [meta] = buildAttachmentMetadata([
			{
				binaryPropertyName: 'data',
				filename: 'cat.png',
				description: 'a cat',
				contentType: 'image/png',
			},
		]);
		assert.equal(meta.filename, 'cat.png');
		assert.equal(meta.description, 'a cat');
		assert.equal(meta.content_type, 'image/png');
	});

	it('omits optional fields when empty', () => {
		const [meta] = buildAttachmentMetadata([{ binaryPropertyName: 'data' }]);
		assert.deepEqual(meta, { id: 0 });
	});
});

describe('getAttachmentBinaryPropertyNames', () => {
	it('parses a fixedCollection-shaped value', () => {
		const names = getAttachmentBinaryPropertyNames({
			attachment: [
				{ binaryPropertyName: 'data1' },
				{ binaryPropertyName: 'data2' },
			],
		});
		assert.deepEqual(names, ['data1', 'data2']);
	});

	it('drops entries missing binaryPropertyName', () => {
		const names = getAttachmentBinaryPropertyNames({
			attachment: [
				{ binaryPropertyName: 'data1' },
				{ filename: 'no-prop.png' },
				{ binaryPropertyName: '' },
				{ binaryPropertyName: 'data2' },
			],
		});
		assert.deepEqual(names, ['data1', 'data2']);
	});

	it('returns [] when attachment key is missing or wrong shape', () => {
		assert.deepEqual(getAttachmentBinaryPropertyNames({}), []);
		assert.deepEqual(getAttachmentBinaryPropertyNames({ attachment: 'oops' }), []);
	});
});

describe('buildDiscordMultipartBody', () => {
	it('returns a FormData with payload_json and files[N] keys', () => {
		const payload = { content: 'hello', attachments: [{ id: 0, filename: 'x.txt' }] };
		const file = { name: 'x.txt', data: Buffer.from('contents') };
		const result = buildDiscordMultipartBody({ payloadJson: payload, files: [file] });

		assert.ok(result.body instanceof FormData);
		assert.equal(result.headers['Content-Type'], 'multipart/form-data');

		const payloadEntry = result.body.get('payload_json');
		assert.equal(typeof payloadEntry, 'string');
		assert.deepEqual(JSON.parse(payloadEntry as string), payload);

		const fileEntry = result.body.get('files[0]');
		assert.ok(fileEntry instanceof Blob);
	});

	it('appends a files[N] entry per file in order', () => {
		const files = [
			{ name: 'a.txt', data: Buffer.from('a') },
			{ name: 'b.txt', data: Buffer.from('bb'), contentType: 'text/plain' },
		];
		const result = buildDiscordMultipartBody({ payloadJson: {}, files });
		assert.ok(result.body.get('files[0]') instanceof Blob);
		assert.ok(result.body.get('files[1]') instanceof Blob);
		assert.equal(result.body.get('files[2]'), null);
	});
});
