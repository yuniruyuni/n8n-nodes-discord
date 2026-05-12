import type { IExecuteSingleFunctions } from 'n8n-workflow';

const DATA_URI_PATTERN = /^data:[a-z0-9.+/-]+;base64,/i;
const HTTP_URL_PATTERN = /^https?:\/\//i;

const EXTENSION_TO_MIME: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp',
	apng: 'image/apng',
	svg: 'image/svg+xml',
	mp3: 'audio/mpeg',
	ogg: 'audio/ogg',
	wav: 'audio/wav',
	json: 'application/json',
};

export function bufferToDataUri(buffer: Buffer, mimeType: string): string {
	return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

export function isDataUri(value: string): boolean {
	return DATA_URI_PATTERN.test(value);
}

function isHttpUrl(value: string): boolean {
	return HTTP_URL_PATTERN.test(value);
}

export async function resolveDataUriFromBinary(
	context: IExecuteSingleFunctions,
	_itemIndex: number,
	binaryPropertyName: string,
): Promise<string> {
	const binaryData = context.helpers.assertBinaryData(binaryPropertyName);
	const buffer = await context.helpers.getBinaryDataBuffer(binaryPropertyName);

	let mimeType = binaryData.mimeType;
	if (!mimeType && binaryData.fileExtension) {
		const ext = binaryData.fileExtension.toLowerCase();
		mimeType = EXTENSION_TO_MIME[ext] ?? '';
	}
	if (!mimeType) {
		mimeType = 'application/octet-stream';
	}

	return bufferToDataUri(buffer, mimeType);
}

export async function resolveImageOrDataUriField(
	context: IExecuteSingleFunctions,
	itemIndex: number,
	options: { dataUriParamName: string; binaryParamName: string },
): Promise<string | undefined> {
	const dataUriValue = context.getNodeParameter(options.dataUriParamName, '') as unknown;
	const dataUri = typeof dataUriValue === 'string' ? dataUriValue.trim() : '';
	if (dataUri !== '' && (isDataUri(dataUri) || isHttpUrl(dataUri))) {
		return dataUri;
	}

	const binaryValue = context.getNodeParameter(options.binaryParamName, '') as unknown;
	const binaryPropertyName = typeof binaryValue === 'string' ? binaryValue.trim() : '';
	if (binaryPropertyName !== '') {
		return resolveDataUriFromBinary(context, itemIndex, binaryPropertyName);
	}

	return undefined;
}
