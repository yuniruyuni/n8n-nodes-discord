import type { IDataObject, INodeProperties, INodePropertyCollection } from 'n8n-workflow';

export const DISCORD_EMBED_LIMITS = {
	EMBEDS_PER_MESSAGE: 10,
	TITLE: 256,
	DESCRIPTION: 4096,
	FIELDS: 25,
	FIELD_NAME: 256,
	FIELD_VALUE: 1024,
	FOOTER_TEXT: 2048,
	AUTHOR_NAME: 256,
	TOTAL_CHARACTERS: 6000,
} as const;

export interface DiscordEmbedFooter {
	text: string;
	icon_url?: string;
	proxy_icon_url?: string;
}

export interface DiscordEmbedImage {
	url: string;
	proxy_url?: string;
	height?: number;
	width?: number;
}

export interface DiscordEmbedThumbnail {
	url: string;
	proxy_url?: string;
	height?: number;
	width?: number;
}

export interface DiscordEmbedVideo {
	url?: string;
	proxy_url?: string;
	height?: number;
	width?: number;
}

export interface DiscordEmbedProvider {
	name?: string;
	url?: string;
}

export interface DiscordEmbedAuthor {
	name: string;
	url?: string;
	icon_url?: string;
	proxy_icon_url?: string;
}

export interface DiscordEmbedField {
	name: string;
	value: string;
	inline?: boolean;
}

export interface DiscordEmbed {
	title?: string;
	type?: 'rich' | 'image' | 'video' | 'gifv' | 'article' | 'link' | 'poll_result';
	description?: string;
	url?: string;
	timestamp?: string;
	color?: number;
	footer?: DiscordEmbedFooter;
	image?: DiscordEmbedImage;
	thumbnail?: DiscordEmbedThumbnail;
	video?: DiscordEmbedVideo;
	provider?: DiscordEmbedProvider;
	author?: DiscordEmbedAuthor;
	fields?: DiscordEmbedField[];
}

interface EmbedCollectionEntry extends IDataObject {
	title?: string;
	description?: string;
	url?: string;
	timestamp?: string;
	color?: number | string;
	footer?: { text?: string; iconUrl?: string } | Array<{ text?: string; iconUrl?: string }>;
	image?: { url?: string } | Array<{ url?: string }>;
	thumbnail?: { url?: string } | Array<{ url?: string }>;
	author?: { name?: string; url?: string; iconUrl?: string } | Array<{ name?: string; url?: string; iconUrl?: string }>;
	fields?: { field?: Array<{ name?: string; value?: string; inline?: boolean }> };
}

const embedValues: INodePropertyCollection['values'] = [
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		description: `Embed title. Discord limit: ${DISCORD_EMBED_LIMITS.TITLE} characters.`,
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		description: `Embed description. Discord limit: ${DISCORD_EMBED_LIMITS.DESCRIPTION} characters.`,
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		description: 'URL the embed title links to',
	},
	{
		displayName: 'Timestamp',
		name: 'timestamp',
		type: 'string',
		default: '',
		placeholder: '2024-01-01T00:00:00.000Z',
		description: 'ISO 8601 timestamp shown next to the footer',
	},
	{
		displayName: 'Color',
		name: 'color',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 0xffffff },
		description: 'Sidebar color as an integer (e.g. 0x5865F2 = 5793266)',
	},
	{
		displayName: 'Footer',
		name: 'footer',
		type: 'fixedCollection',
		default: {},
		options: [
			{
				displayName: 'Footer',
				name: 'value',
				values: [
					{
						displayName: 'Text',
						name: 'text',
						type: 'string',
						default: '',
						description: `Footer text. Discord limit: ${DISCORD_EMBED_LIMITS.FOOTER_TEXT} characters.`,
					},
					{
						displayName: 'Icon URL',
						name: 'iconUrl',
						type: 'string',
						default: '',
						description: 'URL of the footer icon (https only)',
					},
				],
			},
		],
	},
	{
		displayName: 'Image',
		name: 'image',
		type: 'fixedCollection',
		default: {},
		options: [
			{
				displayName: 'Image',
				name: 'value',
				values: [
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						description: 'Source URL of the image',
					},
				],
			},
		],
	},
	{
		displayName: 'Thumbnail',
		name: 'thumbnail',
		type: 'fixedCollection',
		default: {},
		options: [
			{
				displayName: 'Thumbnail',
				name: 'value',
				values: [
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						description: 'Source URL of the thumbnail',
					},
				],
			},
		],
	},
	{
		displayName: 'Author',
		name: 'author',
		type: 'fixedCollection',
		default: {},
		options: [
			{
				displayName: 'Author',
				name: 'value',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: `Author name. Discord limit: ${DISCORD_EMBED_LIMITS.AUTHOR_NAME} characters.`,
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						description: 'URL the author name links to',
					},
					{
						displayName: 'Icon URL',
						name: 'iconUrl',
						type: 'string',
						default: '',
						description: 'URL of the author icon (https only)',
					},
				],
			},
		],
	},
	{
		displayName: 'Fields',
		name: 'fields',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Field' },
		default: {},
		options: [
			{
				displayName: 'Field',
				name: 'field',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: `Field name. Discord limit: ${DISCORD_EMBED_LIMITS.FIELD_NAME} characters.`,
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						typeOptions: { rows: 2 },
						default: '',
						description: `Field value. Discord limit: ${DISCORD_EMBED_LIMITS.FIELD_VALUE} characters.`,
					},
					{
						displayName: 'Inline',
						name: 'inline',
						type: 'boolean',
						default: false,
						description: 'Whether this field should display inline with adjacent inline fields',
					},
				],
			},
		],
	},
];

export function createEmbedsCollectionField(overrides: Partial<INodeProperties> = {}): INodeProperties {
	return {
		displayName: 'Embeds',
		name: 'embeds',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Embed' },
		default: {},
		description: `Guided builder for Discord embeds. Maximum ${DISCORD_EMBED_LIMITS.EMBEDS_PER_MESSAGE} embeds per message.`,
		options: [
			{
				displayName: 'Embed',
				name: 'embed',
				values: embedValues,
			},
		],
		...overrides,
	};
}

export function buildEmbedsFromCollection(value: unknown): DiscordEmbed[] {
	if (value === undefined || value === null || value === '') {
		return [];
	}

	const entries = extractEntries(value);
	if (entries.length === 0) {
		return [];
	}

	if (entries.length > DISCORD_EMBED_LIMITS.EMBEDS_PER_MESSAGE) {
		throw new Error(
			`Too many embeds: ${entries.length}. Discord allows at most ${DISCORD_EMBED_LIMITS.EMBEDS_PER_MESSAGE} embeds per message.`,
		);
	}

	return entries.map(buildSingleEmbed).filter((embed): embed is DiscordEmbed => embed !== undefined);
}

export function validateEmbed(embed: DiscordEmbed, index = 0): void {
	const prefix = `Embed[${index}]`;

	if (embed.title !== undefined && embed.title.length > DISCORD_EMBED_LIMITS.TITLE) {
		throw new Error(`${prefix}.title exceeds ${DISCORD_EMBED_LIMITS.TITLE} characters (${embed.title.length}).`);
	}
	if (embed.description !== undefined && embed.description.length > DISCORD_EMBED_LIMITS.DESCRIPTION) {
		throw new Error(
			`${prefix}.description exceeds ${DISCORD_EMBED_LIMITS.DESCRIPTION} characters (${embed.description.length}).`,
		);
	}
	if (embed.footer?.text !== undefined && embed.footer.text.length > DISCORD_EMBED_LIMITS.FOOTER_TEXT) {
		throw new Error(
			`${prefix}.footer.text exceeds ${DISCORD_EMBED_LIMITS.FOOTER_TEXT} characters (${embed.footer.text.length}).`,
		);
	}
	if (embed.author?.name !== undefined && embed.author.name.length > DISCORD_EMBED_LIMITS.AUTHOR_NAME) {
		throw new Error(
			`${prefix}.author.name exceeds ${DISCORD_EMBED_LIMITS.AUTHOR_NAME} characters (${embed.author.name.length}).`,
		);
	}
	if (embed.fields !== undefined) {
		if (embed.fields.length > DISCORD_EMBED_LIMITS.FIELDS) {
			throw new Error(
				`${prefix}.fields has ${embed.fields.length} entries. Discord allows at most ${DISCORD_EMBED_LIMITS.FIELDS}.`,
			);
		}
		embed.fields.forEach((field, fieldIndex) => {
			if (field.name.length > DISCORD_EMBED_LIMITS.FIELD_NAME) {
				throw new Error(
					`${prefix}.fields[${fieldIndex}].name exceeds ${DISCORD_EMBED_LIMITS.FIELD_NAME} characters (${field.name.length}).`,
				);
			}
			if (field.value.length > DISCORD_EMBED_LIMITS.FIELD_VALUE) {
				throw new Error(
					`${prefix}.fields[${fieldIndex}].value exceeds ${DISCORD_EMBED_LIMITS.FIELD_VALUE} characters (${field.value.length}).`,
				);
			}
		});
	}

	const total = totalEmbedCharacters(embed);
	if (total > DISCORD_EMBED_LIMITS.TOTAL_CHARACTERS) {
		throw new Error(
			`${prefix} total characters ${total} exceed Discord limit of ${DISCORD_EMBED_LIMITS.TOTAL_CHARACTERS}.`,
		);
	}
}

export function validateEmbeds(embeds: DiscordEmbed[]): void {
	if (embeds.length > DISCORD_EMBED_LIMITS.EMBEDS_PER_MESSAGE) {
		throw new Error(
			`Too many embeds: ${embeds.length}. Discord allows at most ${DISCORD_EMBED_LIMITS.EMBEDS_PER_MESSAGE} embeds per message.`,
		);
	}
	embeds.forEach((embed, index) => validateEmbed(embed, index));
}

function extractEntries(value: unknown): EmbedCollectionEntry[] {
	if (Array.isArray(value)) {
		return value as EmbedCollectionEntry[];
	}

	if (typeof value === 'object' && value !== null) {
		const container = value as IDataObject;
		const nested = container.embed;
		if (Array.isArray(nested)) {
			return nested as EmbedCollectionEntry[];
		}
		if (nested && typeof nested === 'object') {
			return [nested as EmbedCollectionEntry];
		}
	}

	return [];
}

function buildSingleEmbed(entry: EmbedCollectionEntry): DiscordEmbed | undefined {
	const embed: DiscordEmbed = {};

	assignString(embed, 'title', entry.title);
	assignString(embed, 'description', entry.description);
	assignString(embed, 'url', entry.url);
	assignString(embed, 'timestamp', entry.timestamp);

	const color = normalizeColor(entry.color);
	if (color !== undefined) {
		embed.color = color;
	}

	const footer = normalizeFooter(entry.footer);
	if (footer !== undefined) {
		embed.footer = footer;
	}

	const image = normalizeMediaUrl(entry.image);
	if (image !== undefined) {
		embed.image = image;
	}

	const thumbnail = normalizeMediaUrl(entry.thumbnail);
	if (thumbnail !== undefined) {
		embed.thumbnail = thumbnail;
	}

	const author = normalizeAuthor(entry.author);
	if (author !== undefined) {
		embed.author = author;
	}

	const fields = normalizeFields(entry.fields);
	if (fields.length > 0) {
		embed.fields = fields;
	}

	return Object.keys(embed).length > 0 ? embed : undefined;
}

function assignString<K extends keyof DiscordEmbed>(target: DiscordEmbed, key: K, value: unknown): void {
	if (typeof value !== 'string') {
		return;
	}
	const trimmed = value.trim();
	if (trimmed === '') {
		return;
	}
	(target[key] as string) = trimmed;
}

function normalizeColor(value: unknown): number | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	const numeric = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(numeric) || numeric < 0) {
		return undefined;
	}
	return Math.trunc(numeric);
}

function unwrapSingle<T>(value: unknown): T | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}
	if (Array.isArray(value)) {
		const first = value[0];
		return first && typeof first === 'object' ? (first as T) : undefined;
	}
	if (typeof value === 'object') {
		const container = value as IDataObject;
		const nested = container.value;
		if (nested !== undefined) {
			if (Array.isArray(nested)) {
				const first = nested[0];
				return first && typeof first === 'object' ? (first as T) : undefined;
			}
			if (typeof nested === 'object' && nested !== null) {
				return nested as T;
			}
			return undefined;
		}
		return value as T;
	}
	return undefined;
}

function normalizeFooter(value: unknown): DiscordEmbedFooter | undefined {
	const inner = unwrapSingle<{ text?: unknown; iconUrl?: unknown }>(value);
	if (!inner) {
		return undefined;
	}
	const text = typeof inner.text === 'string' ? inner.text.trim() : '';
	if (text === '') {
		return undefined;
	}
	const footer: DiscordEmbedFooter = { text };
	if (typeof inner.iconUrl === 'string' && inner.iconUrl.trim() !== '') {
		footer.icon_url = inner.iconUrl.trim();
	}
	return footer;
}

function normalizeMediaUrl(value: unknown): { url: string } | undefined {
	const inner = unwrapSingle<{ url?: unknown }>(value);
	if (!inner) {
		return undefined;
	}
	if (typeof inner.url !== 'string') {
		return undefined;
	}
	const url = inner.url.trim();
	return url === '' ? undefined : { url };
}

function normalizeAuthor(value: unknown): DiscordEmbedAuthor | undefined {
	const inner = unwrapSingle<{ name?: unknown; url?: unknown; iconUrl?: unknown }>(value);
	if (!inner) {
		return undefined;
	}
	const name = typeof inner.name === 'string' ? inner.name.trim() : '';
	if (name === '') {
		return undefined;
	}
	const author: DiscordEmbedAuthor = { name };
	if (typeof inner.url === 'string' && inner.url.trim() !== '') {
		author.url = inner.url.trim();
	}
	if (typeof inner.iconUrl === 'string' && inner.iconUrl.trim() !== '') {
		author.icon_url = inner.iconUrl.trim();
	}
	return author;
}

function normalizeFields(value: unknown): DiscordEmbedField[] {
	if (!value || typeof value !== 'object') {
		return [];
	}
	const container = value as IDataObject;
	const raw = container.field;
	if (!Array.isArray(raw)) {
		return [];
	}

	const result: DiscordEmbedField[] = [];
	for (const entry of raw) {
		if (!entry || typeof entry !== 'object') {
			continue;
		}
		const record = entry as { name?: unknown; value?: unknown; inline?: unknown };
		const name = typeof record.name === 'string' ? record.name.trim() : '';
		const fieldValue = typeof record.value === 'string' ? record.value.trim() : '';
		if (name === '' || fieldValue === '') {
			continue;
		}
		const field: DiscordEmbedField = { name, value: fieldValue };
		if (record.inline === true) {
			field.inline = true;
		}
		result.push(field);
	}
	return result;
}

function totalEmbedCharacters(embed: DiscordEmbed): number {
	let total = 0;
	if (embed.title) total += embed.title.length;
	if (embed.description) total += embed.description.length;
	if (embed.footer?.text) total += embed.footer.text.length;
	if (embed.author?.name) total += embed.author.name.length;
	if (embed.fields) {
		for (const field of embed.fields) {
			total += field.name.length + field.value.length;
		}
	}
	return total;
}
