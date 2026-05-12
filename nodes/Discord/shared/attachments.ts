// Discord requires multipart/form-data only when uploading files. For pure
// text, embeds, or components without files, send JSON. The helpers in this
// module assemble the file-upload case: a payload_json string part plus one
// or more files[N] parts whose indexes match attachment.id values inside
// payload_json.attachments[].

import type { IDataObject, INodeProperties } from 'n8n-workflow';

export interface DiscordAttachmentMetadata {
	id: number | string;
	filename?: string;
	description?: string;
	content_type?: string;
	duration_secs?: number;
	waveform?: string;
	ephemeral?: boolean;
}

export interface DiscordAttachmentInput {
	binaryPropertyName: string;
	filename?: string;
	description?: string;
	contentType?: string;
}

export interface DiscordMultipartFile {
	name: string;
	data: Buffer | Uint8Array;
	contentType?: string;
}

export interface DiscordMultipartBody {
	body: FormData;
	headers: { 'Content-Type': string };
}

export function createAttachmentsCollectionField(
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName: 'Attachments',
		name: 'attachments',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		placeholder: 'Add Attachment',
		description:
			'Files to upload alongside the message. Each entry maps to a Discord attachment with a sequential ID starting at 0.',
		options: [
			{
				name: 'attachment',
				displayName: 'Attachment',
				values: [
					{
						displayName: 'Binary Property',
						name: 'binaryPropertyName',
						type: 'string',
						default: 'data',
						required: true,
						description: 'Name of the binary property on the input item that holds the file data',
					},
					{
						displayName: 'Filename',
						name: 'filename',
						type: 'string',
						default: '',
						description: 'Override the filename Discord stores for this attachment. Leave empty to use the binary data filename.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Alt text shown to users with screen readers. Max 1024 characters per Discord.',
					},
					{
						displayName: 'Content Type',
						name: 'contentType',
						type: 'string',
						default: '',
						description: 'MIME type override sent to Discord. Leave empty to use the binary data MIME type.',
					},
				],
			},
		],
		...overrides,
	};
}

export function buildAttachmentMetadata(
	inputs: DiscordAttachmentInput[],
): DiscordAttachmentMetadata[] {
	return inputs.map((input, index) => {
		const metadata: DiscordAttachmentMetadata = { id: index };

		if (input.filename) {
			metadata.filename = input.filename;
		}
		if (input.description) {
			metadata.description = input.description;
		}
		if (input.contentType) {
			metadata.content_type = input.contentType;
		}

		return metadata;
	});
}

export function getAttachmentBinaryPropertyNames(value: IDataObject): string[] {
	const collection = value.attachment;

	if (!Array.isArray(collection)) {
		return [];
	}

	return collection
		.map((entry) => {
			if (!entry || typeof entry !== 'object') {
				return '';
			}
			const name = (entry as IDataObject).binaryPropertyName;
			return typeof name === 'string' ? name : '';
		})
		.filter((name): name is string => name.length > 0);
}

export function buildDiscordMultipartBody(params: {
	payloadJson: IDataObject;
	files: DiscordMultipartFile[];
}): DiscordMultipartBody {
	// Returning a FormData lets n8n's HTTP helper set the multipart boundary; we still expose the header key so callers can document the contract.
	const form = new FormData();
	form.append('payload_json', JSON.stringify(params.payloadJson));

	params.files.forEach((file, index) => {
		const source = file.data;
		const bytes = new Uint8Array(source.byteLength);
		bytes.set(source);
		const blob = new Blob([bytes], file.contentType ? { type: file.contentType } : {});
		form.append(`files[${index}]`, blob, file.name);
	});

	return {
		body: form,
		headers: { 'Content-Type': 'multipart/form-data' },
	};
}
