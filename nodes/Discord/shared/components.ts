import type { IDataObject, INodeProperties } from 'n8n-workflow';

import { createRawJsonField } from './messagePayload';

export const DISCORD_COMPONENT_TYPE = {
	ACTION_ROW: 1,
	BUTTON: 2,
	STRING_SELECT: 3,
	TEXT_INPUT: 4,
	USER_SELECT: 5,
	ROLE_SELECT: 6,
	MENTIONABLE_SELECT: 7,
	CHANNEL_SELECT: 8,
	SECTION: 9,
	TEXT_DISPLAY: 10,
	THUMBNAIL: 11,
	MEDIA_GALLERY: 12,
	FILE: 13,
	SEPARATOR: 14,
	CONTAINER: 17,
} as const;

export const DISCORD_BUTTON_STYLE = {
	PRIMARY: 1,
	SECONDARY: 2,
	SUCCESS: 3,
	DANGER: 4,
	LINK: 5,
} as const;

export const DISCORD_TEXT_INPUT_STYLE = {
	SHORT: 1,
	PARAGRAPH: 2,
} as const;

export type DiscordButtonStyle =
	(typeof DISCORD_BUTTON_STYLE)[keyof typeof DISCORD_BUTTON_STYLE];

export type DiscordTextInputStyle =
	(typeof DISCORD_TEXT_INPUT_STYLE)[keyof typeof DISCORD_TEXT_INPUT_STYLE];

export interface DiscordPartialEmoji {
	id?: string;
	name?: string;
	animated?: boolean;
}

export interface DiscordButtonComponent {
	type: typeof DISCORD_COMPONENT_TYPE.BUTTON;
	style: DiscordButtonStyle;
	label?: string;
	emoji?: DiscordPartialEmoji;
	custom_id?: string;
	url?: string;
	disabled?: boolean;
}

export interface DiscordSelectOption {
	label: string;
	value: string;
	description?: string;
	emoji?: DiscordPartialEmoji;
	default?: boolean;
}

export interface DiscordStringSelectComponent {
	type: typeof DISCORD_COMPONENT_TYPE.STRING_SELECT;
	custom_id: string;
	options: DiscordSelectOption[];
	placeholder?: string;
	min_values?: number;
	max_values?: number;
	disabled?: boolean;
}

export interface DiscordTextInputComponent {
	type: typeof DISCORD_COMPONENT_TYPE.TEXT_INPUT;
	custom_id: string;
	style: DiscordTextInputStyle;
	label: string;
	min_length?: number;
	max_length?: number;
	required?: boolean;
	value?: string;
	placeholder?: string;
}

export interface DiscordUserSelectComponent {
	type: typeof DISCORD_COMPONENT_TYPE.USER_SELECT;
	custom_id: string;
	placeholder?: string;
	min_values?: number;
	max_values?: number;
	disabled?: boolean;
	default_values?: Array<{ id: string; type: 'user' }>;
}

export interface DiscordRoleSelectComponent {
	type: typeof DISCORD_COMPONENT_TYPE.ROLE_SELECT;
	custom_id: string;
	placeholder?: string;
	min_values?: number;
	max_values?: number;
	disabled?: boolean;
	default_values?: Array<{ id: string; type: 'role' }>;
}

export interface DiscordMentionableSelectComponent {
	type: typeof DISCORD_COMPONENT_TYPE.MENTIONABLE_SELECT;
	custom_id: string;
	placeholder?: string;
	min_values?: number;
	max_values?: number;
	disabled?: boolean;
	default_values?: Array<{ id: string; type: 'user' | 'role' }>;
}

export interface DiscordChannelSelectComponent {
	type: typeof DISCORD_COMPONENT_TYPE.CHANNEL_SELECT;
	custom_id: string;
	channel_types?: number[];
	placeholder?: string;
	min_values?: number;
	max_values?: number;
	disabled?: boolean;
	default_values?: Array<{ id: string; type: 'channel' }>;
}

export type DiscordSelectComponent =
	| DiscordStringSelectComponent
	| DiscordUserSelectComponent
	| DiscordRoleSelectComponent
	| DiscordMentionableSelectComponent
	| DiscordChannelSelectComponent;

export interface DiscordActionRowComponent {
	type: typeof DISCORD_COMPONENT_TYPE.ACTION_ROW;
	components: Array<
		| DiscordButtonComponent
		| DiscordSelectComponent
		| DiscordTextInputComponent
	>;
}

export interface DiscordSectionComponent {
	type: typeof DISCORD_COMPONENT_TYPE.SECTION;
	components: DiscordComponent[];
	accessory?: DiscordComponent;
}

export interface DiscordTextDisplayComponent {
	type: typeof DISCORD_COMPONENT_TYPE.TEXT_DISPLAY;
	content: string;
}

export interface DiscordUnfurledMediaItem {
	url: string;
}

export interface DiscordThumbnailComponent {
	type: typeof DISCORD_COMPONENT_TYPE.THUMBNAIL;
	media: DiscordUnfurledMediaItem;
	description?: string;
	spoiler?: boolean;
}

export interface DiscordMediaGalleryItem {
	media: DiscordUnfurledMediaItem;
	description?: string;
	spoiler?: boolean;
}

export interface DiscordMediaGalleryComponent {
	type: typeof DISCORD_COMPONENT_TYPE.MEDIA_GALLERY;
	items: DiscordMediaGalleryItem[];
}

export interface DiscordFileComponent {
	type: typeof DISCORD_COMPONENT_TYPE.FILE;
	file: DiscordUnfurledMediaItem;
	spoiler?: boolean;
}

export interface DiscordSeparatorComponent {
	type: typeof DISCORD_COMPONENT_TYPE.SEPARATOR;
	divider?: boolean;
	spacing?: number;
}

export interface DiscordContainerComponent {
	type: typeof DISCORD_COMPONENT_TYPE.CONTAINER;
	components: DiscordComponent[];
	accent_color?: number;
	spoiler?: boolean;
}

export type DiscordComponent =
	| DiscordActionRowComponent
	| DiscordButtonComponent
	| DiscordStringSelectComponent
	| DiscordTextInputComponent
	| DiscordUserSelectComponent
	| DiscordRoleSelectComponent
	| DiscordMentionableSelectComponent
	| DiscordChannelSelectComponent
	| DiscordSectionComponent
	| DiscordTextDisplayComponent
	| DiscordThumbnailComponent
	| DiscordMediaGalleryComponent
	| DiscordFileComponent
	| DiscordSeparatorComponent
	| DiscordContainerComponent;

const MAX_ACTION_ROWS = 5;
const MAX_BUTTONS_PER_ROW = 5;
const MAX_SELECT_OPTIONS = 25;
const MAX_BUTTON_LABEL_LENGTH = 80;
const MAX_CUSTOM_ID_LENGTH = 100;
const MAX_SELECT_PLACEHOLDER_LENGTH = 150;
const MAX_TEXT_INPUT_LABEL_LENGTH = 45;
const MAX_TEXT_INPUT_VALUE_LENGTH = 4000;
const MAX_MEDIA_GALLERY_ITEMS = 10;
const MAX_TOP_LEVEL_COMPONENTS = 40;

// Discord message flag bit. Required when the payload contains v2 layout
// components; mixing v1 (content/embeds/classic components) with v2 is rejected.
export const DISCORD_MESSAGE_FLAG_IS_COMPONENTS_V2 = 32768;

// Section (type 9) and Container (type 17) have nested component arrays whose
// shapes are too clunky to expose as n8n fixedCollections; users compose those
// through the raw `components` JSON field instead. Only Text Display, Separator,
// Media Gallery, and File have guided builders below.

const buttonStyleOptions = [
	{ name: 'Primary', value: DISCORD_BUTTON_STYLE.PRIMARY },
	{ name: 'Secondary', value: DISCORD_BUTTON_STYLE.SECONDARY },
	{ name: 'Success', value: DISCORD_BUTTON_STYLE.SUCCESS },
	{ name: 'Danger', value: DISCORD_BUTTON_STYLE.DANGER },
	{ name: 'Link', value: DISCORD_BUTTON_STYLE.LINK },
];

const mentionableSelectTypeOptions = [
	{ name: 'User Select', value: DISCORD_COMPONENT_TYPE.USER_SELECT },
	{ name: 'Role Select', value: DISCORD_COMPONENT_TYPE.ROLE_SELECT },
	{ name: 'Mentionable Select', value: DISCORD_COMPONENT_TYPE.MENTIONABLE_SELECT },
	{ name: 'Channel Select', value: DISCORD_COMPONENT_TYPE.CHANNEL_SELECT },
];

const textInputStyleOptions = [
	{ name: 'Short', value: DISCORD_TEXT_INPUT_STYLE.SHORT },
	{ name: 'Paragraph', value: DISCORD_TEXT_INPUT_STYLE.PARAGRAPH },
];

export function createButtonComponentsField(
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName: 'Buttons',
		name: 'buttons',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		description: 'Buttons rendered inside a single action row. Discord allows up to 5 buttons per row and 5 rows per message.',
		options: [
			{
				name: 'button',
				displayName: 'Button',
				values: [
					{
						displayName: 'Custom ID',
						name: 'customId',
						type: 'string',
						default: '',
						description: 'Identifier delivered with the interaction. Required unless style is Link. Max 100 characters.',
					},
					{
						displayName: 'Disabled',
						name: 'disabled',
						type: 'boolean',
						default: false,
						description: 'Whether the button is rendered as non-interactive',
					},
					{
						displayName: 'Emoji ID',
						name: 'emojiId',
						type: 'string',
						default: '',
						description: 'Snowflake ID for a custom emoji. Leave blank for unicode emoji.',
					},
					{
						displayName: 'Emoji Name',
						name: 'emojiName',
						type: 'string',
						default: '',
						description: 'Unicode emoji character or custom emoji name',
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: '',
						description: 'Text shown on the button. Max 80 characters.',
					},
					{
						displayName: 'Style',
						name: 'style',
						type: 'options',
						default: 1,
						description: 'Visual style of the button. Link buttons require a URL and cannot have a custom ID.',
						options: buttonStyleOptions,
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						description: 'Destination URL for Link-style buttons',
					},
				],
			},
		],
		...overrides,
	};
}

export function createStringSelectComponentField(
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName: 'String Select',
		name: 'stringSelect',
		type: 'fixedCollection',
		default: {},
		description: 'String select menu wrapped in its own action row. Discord allows up to 25 options.',
		options: [
			{
				name: 'select',
				displayName: 'Select',
				values: [
					{
						displayName: 'Custom ID',
						name: 'customId',
						type: 'string',
						default: '',
						description: 'Identifier delivered with the interaction. Max 100 characters.',
					},
					{
						displayName: 'Disabled',
						name: 'disabled',
						type: 'boolean',
						default: false,
						description: 'Whether the select is rendered as non-interactive',
					},
					{
						displayName: 'Max Values',
						name: 'maxValues',
						type: 'number',
						default: 1,
						description: 'Maximum number of items the user may select',
					},
					{
						displayName: 'Min Values',
						name: 'minValues',
						type: 'number',
						default: 1,
						description: 'Minimum number of items the user must select',
					},
					{
						displayName: 'Options',
						name: 'options',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						description: 'Selectable options. Discord allows up to 25 entries.',
						options: [
							{
								name: 'option',
								displayName: 'Option',
								values: [
									{
										displayName: 'Default',
										name: 'default',
										type: 'boolean',
										default: false,
										description: 'Whether the option starts selected',
									},
									{
										displayName: 'Description',
										name: 'description',
										type: 'string',
										default: '',
										description: 'Secondary text shown for the option',
									},
									{
										displayName: 'Emoji ID',
										name: 'emojiId',
										type: 'string',
										default: '',
										description: 'Snowflake ID for a custom emoji',
									},
									{
										displayName: 'Emoji Name',
										name: 'emojiName',
										type: 'string',
										default: '',
										description: 'Unicode emoji character or custom emoji name',
									},
									{
										displayName: 'Label',
										name: 'label',
										type: 'string',
										default: '',
										description: 'Label displayed for the option',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Value delivered with the interaction',
									},
								],
							},
						],
					},
					{
						displayName: 'Placeholder',
						name: 'placeholder',
						type: 'string',
						default: '',
						description: 'Text shown when nothing is selected. Max 150 characters.',
					},
				],
			},
		],
		...overrides,
	};
}

export function createMentionableSelectComponentField(
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName: 'Entity Select',
		name: 'entitySelect',
		type: 'fixedCollection',
		default: {},
		description: 'User, role, mentionable, or channel select menu wrapped in an action row',
		options: [
			{
				name: 'select',
				displayName: 'Select',
				values: [
					{
						displayName: 'Channel Types',
						name: 'channelTypes',
						type: 'string',
						default: '',
						description: 'Comma-separated Discord channel type numbers. Only applies to Channel Select.',
					},
					{
						displayName: 'Component Type',
						name: 'componentType',
						type: 'options',
						default: 5,
						description: 'Which entity select variant to render',
						options: mentionableSelectTypeOptions,
					},
					{
						displayName: 'Custom ID',
						name: 'customId',
						type: 'string',
						default: '',
						description: 'Identifier delivered with the interaction. Max 100 characters.',
					},
					{
						displayName: 'Disabled',
						name: 'disabled',
						type: 'boolean',
						default: false,
						description: 'Whether the select is rendered as non-interactive',
					},
					{
						displayName: 'Max Values',
						name: 'maxValues',
						type: 'number',
						default: 1,
						description: 'Maximum number of items the user may select',
					},
					{
						displayName: 'Min Values',
						name: 'minValues',
						type: 'number',
						default: 1,
						description: 'Minimum number of items the user must select',
					},
					{
						displayName: 'Placeholder',
						name: 'placeholder',
						type: 'string',
						default: '',
						description: 'Text shown when nothing is selected. Max 150 characters.',
					},
				],
			},
		],
		...overrides,
	};
}

export function createTextInputComponentField(
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName: 'Text Inputs',
		name: 'textInputs',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		description: 'Modal text inputs. Each input is placed in its own action row, with up to 5 rows per modal.',
		options: [
			{
				name: 'textInput',
				displayName: 'Text Input',
				values: [
					{
						displayName: 'Custom ID',
						name: 'customId',
						type: 'string',
						default: '',
						description: 'Identifier delivered with the interaction. Max 100 characters.',
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: '',
						description: 'Label displayed above the input. Max 45 characters.',
					},
					{
						displayName: 'Max Length',
						name: 'maxLength',
						type: 'number',
						default: 0,
						description: 'Maximum number of characters allowed. Zero leaves it unset.',
					},
					{
						displayName: 'Min Length',
						name: 'minLength',
						type: 'number',
						default: 0,
						description: 'Minimum number of characters required',
					},
					{
						displayName: 'Placeholder',
						name: 'placeholder',
						type: 'string',
						default: '',
						description: 'Placeholder text shown when the field is empty',
					},
					{
						displayName: 'Required',
						name: 'required',
						type: 'boolean',
						default: true,
						description: 'Whether the input must be filled before submitting',
					},
					{
						displayName: 'Style',
						name: 'style',
						type: 'options',
						default: 1,
						description: 'Short for one line, Paragraph for multi-line input',
						options: textInputStyleOptions,
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Pre-filled value shown to the user',
					},
				],
			},
		],
		...overrides,
	};
}

export function createComponentsJsonField(
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return createRawJsonField(
		'Components',
		'components',
		'Raw Discord message components JSON array. Use this to send v2 layout components or shapes not covered by the guided builders.',
		'[]',
		overrides,
	);
}

interface RawButtonEntry {
	style?: number;
	label?: string;
	customId?: string;
	url?: string;
	disabled?: boolean;
	emojiId?: string;
	emojiName?: string;
}

interface RawStringSelectEntry {
	customId?: string;
	placeholder?: string;
	minValues?: number;
	maxValues?: number;
	disabled?: boolean;
	options?: { option?: RawStringSelectOptionEntry[] };
}

interface RawStringSelectOptionEntry {
	label?: string;
	value?: string;
	description?: string;
	default?: boolean;
	emojiId?: string;
	emojiName?: string;
}

interface RawMentionableSelectEntry {
	componentType?: number;
	customId?: string;
	placeholder?: string;
	minValues?: number;
	maxValues?: number;
	disabled?: boolean;
	channelTypes?: string;
}

interface RawTextInputEntry {
	customId?: string;
	style?: number;
	label?: string;
	minLength?: number;
	maxLength?: number;
	required?: boolean;
	value?: string;
	placeholder?: string;
}

function readCollectionArray<T>(value: unknown, key: string): T[] {
	if (!value || typeof value !== 'object') {
		return [];
	}

	const entry = (value as IDataObject)[key];
	if (Array.isArray(entry)) {
		return entry as T[];
	}

	if (entry && typeof entry === 'object') {
		return [entry as T];
	}

	return [];
}

function readCollectionSingle<T>(value: unknown, key: string): T | undefined {
	if (!value || typeof value !== 'object') {
		return undefined;
	}

	const entry = (value as IDataObject)[key];
	if (Array.isArray(entry)) {
		return entry[0] as T | undefined;
	}

	if (entry && typeof entry === 'object') {
		return entry as T;
	}

	return undefined;
}

function buildEmoji(id: string | undefined, name: string | undefined): DiscordPartialEmoji | undefined {
	const trimmedId = id?.trim();
	const trimmedName = name?.trim();
	if (!trimmedId && !trimmedName) {
		return undefined;
	}

	const emoji: DiscordPartialEmoji = {};
	if (trimmedId) emoji.id = trimmedId;
	if (trimmedName) emoji.name = trimmedName;
	return emoji;
}

function buildButton(entry: RawButtonEntry): DiscordButtonComponent {
	const style = (entry.style ?? DISCORD_BUTTON_STYLE.PRIMARY) as DiscordButtonStyle;
	const component: DiscordButtonComponent = {
		type: DISCORD_COMPONENT_TYPE.BUTTON,
		style,
	};

	const label = entry.label?.trim();
	if (label) component.label = label;

	if (style === DISCORD_BUTTON_STYLE.LINK) {
		const url = entry.url?.trim();
		if (!url) {
			throw new Error('Link-style buttons require a URL');
		}
		component.url = url;
	} else {
		const customId = entry.customId?.trim();
		if (!customId) {
			throw new Error('Non-link buttons require a custom ID');
		}
		component.custom_id = customId;
	}

	if (entry.disabled) component.disabled = true;

	const emoji = buildEmoji(entry.emojiId, entry.emojiName);
	if (emoji) component.emoji = emoji;

	return component;
}

export function buildButtonsActionRow(value: unknown): DiscordActionRowComponent[] {
	const entries = readCollectionArray<RawButtonEntry>(value, 'button');
	if (entries.length === 0) {
		return [];
	}

	if (entries.length > MAX_BUTTONS_PER_ROW) {
		throw new Error(`Discord allows at most ${MAX_BUTTONS_PER_ROW} buttons per action row`);
	}

	const buttons = entries.map(buildButton);
	return [
		{
			type: DISCORD_COMPONENT_TYPE.ACTION_ROW,
			components: buttons,
		},
	];
}

function buildStringSelectOption(entry: RawStringSelectOptionEntry): DiscordSelectOption {
	const label = entry.label?.trim();
	const optionValue = entry.value?.trim();
	if (!label) {
		throw new Error('String select options require a label');
	}
	if (!optionValue) {
		throw new Error('String select options require a value');
	}

	const option: DiscordSelectOption = { label, value: optionValue };
	const description = entry.description?.trim();
	if (description) option.description = description;
	if (entry.default) option.default = true;

	const emoji = buildEmoji(entry.emojiId, entry.emojiName);
	if (emoji) option.emoji = emoji;

	return option;
}

export function buildStringSelectActionRow(value: unknown): DiscordActionRowComponent[] {
	const entry = readCollectionSingle<RawStringSelectEntry>(value, 'select');
	if (!entry) {
		return [];
	}

	const customId = entry.customId?.trim();
	if (!customId) {
		throw new Error('String select components require a custom ID');
	}

	const rawOptions = readCollectionArray<RawStringSelectOptionEntry>(entry.options, 'option');
	if (rawOptions.length === 0) {
		throw new Error('String select components require at least one option');
	}
	if (rawOptions.length > MAX_SELECT_OPTIONS) {
		throw new Error(`Discord allows at most ${MAX_SELECT_OPTIONS} options per string select`);
	}

	const select: DiscordStringSelectComponent = {
		type: DISCORD_COMPONENT_TYPE.STRING_SELECT,
		custom_id: customId,
		options: rawOptions.map(buildStringSelectOption),
	};

	const placeholder = entry.placeholder?.trim();
	if (placeholder) select.placeholder = placeholder;
	if (typeof entry.minValues === 'number') select.min_values = entry.minValues;
	if (typeof entry.maxValues === 'number') select.max_values = entry.maxValues;
	if (entry.disabled) select.disabled = true;

	return [
		{
			type: DISCORD_COMPONENT_TYPE.ACTION_ROW,
			components: [select],
		},
	];
}

function parseChannelTypes(value: string | undefined): number[] | undefined {
	if (!value) return undefined;
	const parts = value
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part.length > 0)
		.map((part) => Number.parseInt(part, 10));
	const valid = parts.filter((part) => Number.isFinite(part));
	return valid.length > 0 ? valid : undefined;
}

export function buildMentionableSelectActionRow(value: unknown): DiscordActionRowComponent[] {
	const entry = readCollectionSingle<RawMentionableSelectEntry>(value, 'select');
	if (!entry) {
		return [];
	}

	const customId = entry.customId?.trim();
	if (!customId) {
		throw new Error('Entity select components require a custom ID');
	}

	const componentType = entry.componentType ?? DISCORD_COMPONENT_TYPE.USER_SELECT;
	const placeholder = entry.placeholder?.trim();

	let select: DiscordSelectComponent;
	switch (componentType) {
		case DISCORD_COMPONENT_TYPE.ROLE_SELECT:
			select = { type: DISCORD_COMPONENT_TYPE.ROLE_SELECT, custom_id: customId };
			break;
		case DISCORD_COMPONENT_TYPE.MENTIONABLE_SELECT:
			select = { type: DISCORD_COMPONENT_TYPE.MENTIONABLE_SELECT, custom_id: customId };
			break;
		case DISCORD_COMPONENT_TYPE.CHANNEL_SELECT: {
			const channelTypes = parseChannelTypes(entry.channelTypes);
			const channelSelect: DiscordChannelSelectComponent = {
				type: DISCORD_COMPONENT_TYPE.CHANNEL_SELECT,
				custom_id: customId,
			};
			if (channelTypes) channelSelect.channel_types = channelTypes;
			select = channelSelect;
			break;
		}
		case DISCORD_COMPONENT_TYPE.USER_SELECT:
		default:
			select = { type: DISCORD_COMPONENT_TYPE.USER_SELECT, custom_id: customId };
			break;
	}

	if (placeholder) select.placeholder = placeholder;
	if (typeof entry.minValues === 'number') select.min_values = entry.minValues;
	if (typeof entry.maxValues === 'number') select.max_values = entry.maxValues;
	if (entry.disabled) select.disabled = true;

	return [
		{
			type: DISCORD_COMPONENT_TYPE.ACTION_ROW,
			components: [select],
		},
	];
}

function buildTextInput(entry: RawTextInputEntry): DiscordTextInputComponent {
	const customId = entry.customId?.trim();
	const label = entry.label?.trim();
	if (!customId) {
		throw new Error('Text input components require a custom ID');
	}
	if (!label) {
		throw new Error('Text input components require a label');
	}

	const style = (entry.style ?? DISCORD_TEXT_INPUT_STYLE.SHORT) as DiscordTextInputStyle;
	const component: DiscordTextInputComponent = {
		type: DISCORD_COMPONENT_TYPE.TEXT_INPUT,
		custom_id: customId,
		style,
		label,
	};

	if (typeof entry.minLength === 'number' && entry.minLength > 0) {
		component.min_length = entry.minLength;
	}
	if (typeof entry.maxLength === 'number' && entry.maxLength > 0) {
		component.max_length = entry.maxLength;
	}
	if (entry.required === false) component.required = false;

	const valueText = entry.value?.trim();
	if (valueText) component.value = valueText;

	const placeholder = entry.placeholder?.trim();
	if (placeholder) component.placeholder = placeholder;

	return component;
}

export function buildTextInputsActionRow(value: unknown): DiscordActionRowComponent[] {
	const entries = readCollectionArray<RawTextInputEntry>(value, 'textInput');
	if (entries.length === 0) {
		return [];
	}
	if (entries.length > MAX_ACTION_ROWS) {
		throw new Error(`Discord allows at most ${MAX_ACTION_ROWS} action rows per modal`);
	}

	return entries.map((entry) => ({
		type: DISCORD_COMPONENT_TYPE.ACTION_ROW,
		components: [buildTextInput(entry)],
	}));
}

function validateButton(component: DiscordButtonComponent): void {
	if (component.label !== undefined && component.label.length > MAX_BUTTON_LABEL_LENGTH) {
		throw new Error(`Button label exceeds ${MAX_BUTTON_LABEL_LENGTH} characters`);
	}

	if (component.style === DISCORD_BUTTON_STYLE.LINK) {
		if (!component.url) {
			throw new Error('Link-style buttons require a URL');
		}
		if (component.custom_id) {
			throw new Error('Link-style buttons cannot have a custom ID');
		}
	} else {
		if (!component.custom_id) {
			throw new Error('Non-link buttons require a custom ID');
		}
		if (component.url) {
			throw new Error('Non-link buttons cannot have a URL');
		}
	}

	if (component.custom_id && component.custom_id.length > MAX_CUSTOM_ID_LENGTH) {
		throw new Error(`Button custom ID exceeds ${MAX_CUSTOM_ID_LENGTH} characters`);
	}
}

function validateSelect(component: DiscordSelectComponent): void {
	if (!component.custom_id) {
		throw new Error('Select components require a custom ID');
	}
	if (component.custom_id.length > MAX_CUSTOM_ID_LENGTH) {
		throw new Error(`Select custom ID exceeds ${MAX_CUSTOM_ID_LENGTH} characters`);
	}
	if (component.placeholder !== undefined && component.placeholder.length > MAX_SELECT_PLACEHOLDER_LENGTH) {
		throw new Error(`Select placeholder exceeds ${MAX_SELECT_PLACEHOLDER_LENGTH} characters`);
	}
	if (component.type === DISCORD_COMPONENT_TYPE.STRING_SELECT) {
		if (!component.options || component.options.length === 0) {
			throw new Error('String selects require at least one option');
		}
		if (component.options.length > MAX_SELECT_OPTIONS) {
			throw new Error(`String selects allow at most ${MAX_SELECT_OPTIONS} options`);
		}
	}
}

function validateTextInput(component: DiscordTextInputComponent): void {
	if (!component.custom_id) {
		throw new Error('Text input components require a custom ID');
	}
	if (component.custom_id.length > MAX_CUSTOM_ID_LENGTH) {
		throw new Error(`Text input custom ID exceeds ${MAX_CUSTOM_ID_LENGTH} characters`);
	}
	if (!component.label) {
		throw new Error('Text input components require a label');
	}
	if (component.label.length > MAX_TEXT_INPUT_LABEL_LENGTH) {
		throw new Error(`Text input label exceeds ${MAX_TEXT_INPUT_LABEL_LENGTH} characters`);
	}
	if (component.value !== undefined && component.value.length > MAX_TEXT_INPUT_VALUE_LENGTH) {
		throw new Error(`Text input value exceeds ${MAX_TEXT_INPUT_VALUE_LENGTH} characters`);
	}
}

function validateActionRow(component: DiscordActionRowComponent): void {
	if (!Array.isArray(component.components) || component.components.length === 0) {
		throw new Error('Action rows require at least one child component');
	}

	const buttons = component.components.filter((child) => child.type === DISCORD_COMPONENT_TYPE.BUTTON);
	if (buttons.length > MAX_BUTTONS_PER_ROW) {
		throw new Error(`Action rows allow at most ${MAX_BUTTONS_PER_ROW} buttons`);
	}

	const selectsAndInputs = component.components.filter(
		(child) =>
			child.type !== DISCORD_COMPONENT_TYPE.BUTTON,
	);
	if (selectsAndInputs.length > 0 && component.components.length > 1) {
		throw new Error('Action rows containing a select or text input cannot include other components');
	}

	for (const child of component.components) {
		if (child.type === DISCORD_COMPONENT_TYPE.BUTTON) {
			validateButton(child);
		} else if (child.type === DISCORD_COMPONENT_TYPE.TEXT_INPUT) {
			validateTextInput(child);
		} else {
			validateSelect(child);
		}
	}
}

export function validateComponents(components: DiscordComponent[]): void {
	if (!Array.isArray(components)) {
		throw new Error('Components must be an array');
	}

	const actionRows = components.filter(
		(component) => component.type === DISCORD_COMPONENT_TYPE.ACTION_ROW,
	) as DiscordActionRowComponent[];
	if (actionRows.length > MAX_ACTION_ROWS) {
		throw new Error(`Discord allows at most ${MAX_ACTION_ROWS} action rows per message`);
	}

	for (const component of components) {
		if (component.type === DISCORD_COMPONENT_TYPE.ACTION_ROW) {
			validateActionRow(component);
		}
	}
}

interface RawTextDisplayEntry {
	content?: string;
}

interface RawSeparatorEntry {
	spacing?: number;
	divider?: boolean;
}

interface RawMediaGalleryItemEntry {
	url?: string;
	description?: string;
	spoiler?: boolean;
}

interface RawV2FileEntry {
	url?: string;
	spoiler?: boolean;
}

const separatorSpacingOptions = [
	{ name: 'Small', value: 1 },
	{ name: 'Large', value: 2 },
];

export function createTextDisplayField(
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName: 'Text Displays',
		name: 'textDisplays',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		description: 'V2 Text Display components. Each entry renders as a separate text block; markdown is supported.',
		options: [
			{
				name: 'textDisplay',
				displayName: 'Text Display',
				values: [
					{
						displayName: 'Content',
						name: 'content',
						type: 'string',
						typeOptions: {
							rows: 3,
						},
						default: '',
						description: 'Text content of the display. Markdown is supported.',
					},
				],
			},
		],
		...overrides,
	};
}

export function createSeparatorComponentField(
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName: 'Separators',
		name: 'separators',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		description: 'V2 Separator components used to space or divide other layout components',
		options: [
			{
				name: 'separator',
				displayName: 'Separator',
				values: [
					{
						displayName: 'Divider',
						name: 'divider',
						type: 'boolean',
						default: true,
						description: 'Whether to render a visible divider line',
					},
					{
						displayName: 'Spacing',
						name: 'spacing',
						type: 'options',
						default: 1,
						description: 'Vertical spacing size around the separator',
						options: separatorSpacingOptions,
					},
				],
			},
		],
		...overrides,
	};
}

export function createMediaGalleryField(
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName: 'Media Gallery',
		name: 'mediaGallery',
		type: 'fixedCollection',
		default: {},
		description: `V2 Media Gallery component. Up to ${MAX_MEDIA_GALLERY_ITEMS} media items per gallery.`,
		options: [
			{
				name: 'gallery',
				displayName: 'Gallery',
				values: [
					{
						displayName: 'Items',
						name: 'items',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						description: `Media items to render. Discord allows up to ${MAX_MEDIA_GALLERY_ITEMS} entries.`,
						options: [
							{
								name: 'item',
								displayName: 'Item',
								values: [
									{
										displayName: 'Description',
										name: 'description',
										type: 'string',
										default: '',
										description: 'Optional alt text describing the media',
									},
									{
										displayName: 'Spoiler',
										name: 'spoiler',
										type: 'boolean',
										default: false,
										description: 'Whether the media is hidden behind a spoiler overlay',
									},
									{
										displayName: 'URL',
										name: 'url',
										type: 'string',
										default: '',
										description: 'Media URL or attachment://&lt;filename&gt; reference',
									},
								],
							},
						],
					},
				],
			},
		],
		...overrides,
	};
}

export function createV2FileComponentField(
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName: 'V2 Files',
		name: 'v2Files',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		description: 'V2 File components. Each entry references an uploaded attachment via attachment://&lt;filename&gt;.',
		options: [
			{
				name: 'file',
				displayName: 'File',
				values: [
					{
						displayName: 'Spoiler',
						name: 'spoiler',
						type: 'boolean',
						default: false,
						description: 'Whether the file is hidden behind a spoiler overlay',
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						placeholder: 'attachment://example.png',
						description: 'Attachment URL reference (attachment://&lt;filename&gt;) pointing at an uploaded attachment',
					},
				],
			},
		],
		...overrides,
	};
}

export function buildTextDisplayComponents(value: IDataObject | unknown): DiscordTextDisplayComponent[] {
	const entries = readCollectionArray<RawTextDisplayEntry>(value, 'textDisplay');
	const result: DiscordTextDisplayComponent[] = [];
	for (const entry of entries) {
		const content = entry.content?.trim();
		if (!content) continue;
		result.push({
			type: DISCORD_COMPONENT_TYPE.TEXT_DISPLAY,
			content,
		});
	}
	return result;
}

export function buildSeparatorComponents(value: IDataObject | unknown): DiscordSeparatorComponent[] {
	const entries = readCollectionArray<RawSeparatorEntry>(value, 'separator');
	return entries.map((entry) => {
		const spacing = entry.spacing === 2 ? 2 : 1;
		const divider = entry.divider !== false;
		return {
			type: DISCORD_COMPONENT_TYPE.SEPARATOR,
			spacing,
			divider,
		};
	});
}

export function buildMediaGalleryComponent(
	value: IDataObject | unknown,
): DiscordMediaGalleryComponent | undefined {
	const gallery = readCollectionSingle<{ items?: unknown }>(value, 'gallery');
	if (!gallery) return undefined;

	const rawItems = readCollectionArray<RawMediaGalleryItemEntry>(gallery.items, 'item');
	const items: DiscordMediaGalleryItem[] = [];
	for (const entry of rawItems) {
		const url = entry.url?.trim();
		if (!url) continue;
		const item: DiscordMediaGalleryItem = { media: { url } };
		const description = entry.description?.trim();
		if (description) item.description = description;
		if (entry.spoiler) item.spoiler = true;
		items.push(item);
	}

	if (items.length === 0) return undefined;
	if (items.length > MAX_MEDIA_GALLERY_ITEMS) {
		throw new Error(`Media galleries allow at most ${MAX_MEDIA_GALLERY_ITEMS} items`);
	}

	return {
		type: DISCORD_COMPONENT_TYPE.MEDIA_GALLERY,
		items,
	};
}

export function buildV2FileComponents(value: IDataObject | unknown): DiscordFileComponent[] {
	const entries = readCollectionArray<RawV2FileEntry>(value, 'file');
	const result: DiscordFileComponent[] = [];
	for (const entry of entries) {
		const url = entry.url?.trim();
		if (!url) continue;
		const file: DiscordFileComponent = {
			type: DISCORD_COMPONENT_TYPE.FILE,
			file: { url },
		};
		if (entry.spoiler) file.spoiler = true;
		result.push(file);
	}
	return result;
}

const V2_ONLY_TYPES: ReadonlySet<number> = new Set([
	DISCORD_COMPONENT_TYPE.SECTION,
	DISCORD_COMPONENT_TYPE.TEXT_DISPLAY,
	DISCORD_COMPONENT_TYPE.THUMBNAIL,
	DISCORD_COMPONENT_TYPE.MEDIA_GALLERY,
	DISCORD_COMPONENT_TYPE.FILE,
	DISCORD_COMPONENT_TYPE.SEPARATOR,
	DISCORD_COMPONENT_TYPE.CONTAINER,
]);

export function hasV2LayoutComponents(components: DiscordComponent[]): boolean {
	if (!Array.isArray(components)) return false;
	for (const component of components) {
		if (!component || typeof component !== 'object') continue;
		if (V2_ONLY_TYPES.has(component.type)) return true;
		if (component.type === DISCORD_COMPONENT_TYPE.CONTAINER) {
			if (hasV2LayoutComponents((component as DiscordContainerComponent).components)) {
				return true;
			}
		}
		if (component.type === DISCORD_COMPONENT_TYPE.SECTION) {
			const section = component as DiscordSectionComponent;
			if (hasV2LayoutComponents(section.components)) return true;
			if (section.accessory && V2_ONLY_TYPES.has(section.accessory.type)) return true;
		}
	}
	return false;
}

function validateV2Component(component: DiscordComponent): void {
	switch (component.type) {
		case DISCORD_COMPONENT_TYPE.TEXT_DISPLAY: {
			const text = component as DiscordTextDisplayComponent;
			if (typeof text.content !== 'string' || text.content.trim() === '') {
				throw new Error('Text Display components require non-empty content');
			}
			break;
		}
		case DISCORD_COMPONENT_TYPE.SEPARATOR: {
			const separator = component as DiscordSeparatorComponent;
			if (separator.spacing !== undefined && separator.spacing !== 1 && separator.spacing !== 2) {
				throw new Error('Separator spacing must be 1 (Small) or 2 (Large)');
			}
			break;
		}
		case DISCORD_COMPONENT_TYPE.MEDIA_GALLERY: {
			const gallery = component as DiscordMediaGalleryComponent;
			if (!Array.isArray(gallery.items)) {
				throw new Error('Media Gallery components require an items array');
			}
			if (gallery.items.length > MAX_MEDIA_GALLERY_ITEMS) {
				throw new Error(`Media galleries allow at most ${MAX_MEDIA_GALLERY_ITEMS} items`);
			}
			break;
		}
		case DISCORD_COMPONENT_TYPE.CONTAINER: {
			const container = component as DiscordContainerComponent;
			if (!Array.isArray(container.components)) {
				throw new Error('Container components must contain a components array');
			}
			for (const child of container.components) {
				validateV2Component(child);
			}
			break;
		}
		case DISCORD_COMPONENT_TYPE.SECTION: {
			const section = component as DiscordSectionComponent;
			if (!Array.isArray(section.components)) {
				throw new Error('Section components must contain a components array');
			}
			for (const child of section.components) {
				validateV2Component(child);
			}
			break;
		}
		case DISCORD_COMPONENT_TYPE.ACTION_ROW: {
			validateActionRow(component as DiscordActionRowComponent);
			break;
		}
		default:
			break;
	}
}

export function validateV2Components(components: DiscordComponent[]): void {
	if (!Array.isArray(components)) {
		throw new Error('Components must be an array');
	}
	if (components.length > MAX_TOP_LEVEL_COMPONENTS) {
		throw new Error(
			`Discord allows at most ${MAX_TOP_LEVEL_COMPONENTS} top-level components per message`,
		);
	}

	const actionRows = components.filter(
		(component) => component.type === DISCORD_COMPONENT_TYPE.ACTION_ROW,
	) as DiscordActionRowComponent[];
	if (actionRows.length > MAX_ACTION_ROWS) {
		throw new Error(`Discord allows at most ${MAX_ACTION_ROWS} action rows per message`);
	}

	for (const component of components) {
		validateV2Component(component);
	}
}
