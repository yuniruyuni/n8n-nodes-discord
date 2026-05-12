import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

import { allFields, allOperations } from './resources';
import { DISCORD_API_BASE_URL } from './shared/constants';

export class Discord implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Discord',
		name: 'discord',
		icon: { light: 'file:discord.svg', dark: 'file:discord.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Interact with Discord API - users, messages, webhooks, guilds, interactions, and more',
		defaults: {
			name: 'Discord',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'discordBotApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: DISCORD_API_BASE_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Application Command', value: 'applicationCommand' },
					{ name: 'Channel', value: 'channel' },
					{ name: 'Guild', value: 'guild' },
					{ name: 'Interaction Response', value: 'interactionResponse' },
					{ name: 'Invite', value: 'invite' },
					{ name: 'Member', value: 'member' },
					{ name: 'Message', value: 'message' },
					{ name: 'Role', value: 'role' },
					{ name: 'User', value: 'user' },
					{ name: 'Webhook', value: 'webhook' },
				],
				default: 'user',
			},
			...allOperations,
			...allFields,
		],
	};
}
