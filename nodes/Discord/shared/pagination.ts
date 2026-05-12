import type { IDisplayOptions, INodeProperties } from 'n8n-workflow';

import { createSnowflakeField } from './snowflake';

export type DiscordPaginationCursor = 'after' | 'around' | 'before';

export interface DiscordPaginationOptions {
	displayOptions?: IDisplayOptions;
	includeAround?: boolean;
	defaultLimit?: number;
	maxLimit?: number;
}

const paginationCursorOptions = [
	{
		name: 'After',
		value: 'after',
		description: 'Return items after the cursor ID',
	},
	{
		name: 'Before',
		value: 'before',
		description: 'Return items before the cursor ID',
	},
	{
		name: 'Around',
		value: 'around',
		description: 'Return items around the cursor ID',
	},
];

export function createDiscordPaginationFields(options: DiscordPaginationOptions = {}): INodeProperties[] {
	const maxLimit = options.maxLimit ?? 100;
	const displayOptions = options.displayOptions;
	const cursorValues = options.includeAround ? ['after', 'before', 'around'] : ['after', 'before'];

	return [
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			typeOptions: {
				minValue: 1,
				maxValue: maxLimit,
			},
				default: 50,
				description: 'Max number of results to return',
			displayOptions,
			routing: {
				request: {
					qs: {
						limit: '={{$parameter.limit}}',
					},
				},
			},
		},
		{
			displayName: 'Cursor Type',
			name: 'cursorType',
			type: 'options',
			default: 'before',
			options: paginationCursorOptions.filter((cursorOption) =>
				cursorValues.includes(cursorOption.value),
			),
			description: 'Discord cursor query parameter to use for pagination',
			displayOptions,
		},
		createSnowflakeField('Cursor ID', 'cursorId', 'Discord snowflake ID to use as the pagination cursor', {
			required: false,
			displayOptions,
			routing: {
				request: {
					qs: {
						'={{$parameter.cursorType}}': '={{$parameter.cursorId}}',
					},
				},
			},
		}),
	];
}
