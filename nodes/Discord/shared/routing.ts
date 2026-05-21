import type { INodePropertyRouting } from 'n8n-workflow';

export const successOutput: NonNullable<INodePropertyRouting['output']> = {
	postReceive: [
		{
			type: 'set',
			properties: {
				value: '={{ { "success": true } }}',
			},
		},
	],
};
