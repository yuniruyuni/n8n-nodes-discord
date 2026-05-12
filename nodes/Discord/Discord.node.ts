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
					{ name: 'Application', value: 'application' },
					{ name: 'Application Command', value: 'applicationCommand' },
					{ name: 'Application Role Connection Metadata', value: 'applicationRoleConnectionMetadata' },
					{ name: 'Audit Log', value: 'auditLog' },
					{ name: 'Channel', value: 'channel' },
					{ name: 'Entitlement', value: 'entitlement' },
					{ name: 'Guild', value: 'guild' },
					{ name: 'Interaction Response', value: 'interactionResponse' },
					{ name: 'Invite', value: 'invite' },
					{ name: 'Member', value: 'member' },
					{ name: 'Message', value: 'message' },
					{ name: 'Poll', value: 'poll' },
					{ name: 'Role', value: 'role' },
					{ name: 'SKU', value: 'sku' },
					{ name: 'Subscription', value: 'subscription' },
					{ name: 'User', value: 'user' },
					{ name: 'Voice', value: 'voice' },
					{ name: 'Webhook', value: 'webhook' },
				],
				default: 'user',
			},
			...allOperations,
			...allFields,
		],
	};
}
