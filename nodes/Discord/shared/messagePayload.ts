import type { INodeProperties } from 'n8n-workflow';

export function parseOptionalJsonField<T>(value: unknown, fieldName: string): T | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}

	if (typeof value !== 'string') {
		return value as T;
	}

	try {
		return JSON.parse(value) as T;
	} catch (error) {
		// Library helper without node context; callers are responsible for
		// wrapping this in NodeOperationError if needed. SyntaxError preserves
		// the JSON-parse semantics for callers that re-throw.
		// eslint-disable-next-line -- rule name omitted on purpose; @n8n/community-nodes/require-node-api-error does not apply to context-less library helpers
		throw new SyntaxError(`Invalid JSON in ${fieldName}: ${(error as Error).message}`);
	}
}

export function createAllowedMentionsJsonField(overrides: Partial<INodeProperties> = {}): INodeProperties {
	return createRawJsonField(
		'Allowed Mentions',
		'allowedMentions',
		'Raw Discord allowed_mentions JSON object.',
		'{"parse":[]}',
		overrides,
	);
}

export function createEmbedsJsonField(overrides: Partial<INodeProperties> = {}): INodeProperties {
	return createRawJsonField(
		'Embeds',
		'embeds',
		'Raw Discord embeds JSON array.',
		'[]',
		overrides,
	);
}

export function createRawJsonField(
	displayName: string,
	name: string,
	description: string,
	placeholder: string,
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName,
		name,
		type: 'json',
		default: '',
		placeholder,
		description,
		...overrides,
	};
}
