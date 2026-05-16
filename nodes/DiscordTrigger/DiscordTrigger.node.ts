import {
	NodeConnectionTypes,
	type IDataObject,
	type INodeType,
	type INodeTypeDescription,
	type ITriggerFunctions,
	type ITriggerResponse,
} from 'n8n-workflow';

import { DiscordGatewayConnection } from './DiscordGatewayConnection';
import { triggerProperties } from './events';
import { registerGatewaySender, unregisterGatewaySender } from './gatewaySendBus';

export class DiscordTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Discord Trigger',
		name: 'discordTrigger',
		icon: { light: 'file:discord.svg', dark: 'file:discord.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Listen to Discord Gateway events over a persistent WebSocket connection. Set "Connection Name" to allow the Discord Gateway Send node to push commands through this connection.',
		defaults: {
			name: 'Discord Trigger',
		},
		usableAsTool: true,
		codex: {
			categories: ['Communication'],
			subcategories: {
				Communication: ['Messaging'],
			},
			alias: [
				'bot',
				'gateway',
				'websocket',
				'event',
				'message create',
				'interaction',
				'guild member add',
				'voice state',
				'listen',
				'webhook',
			],
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'discordBotApi',
				required: true,
			},
		],
		properties: triggerProperties,
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const event = this.getNodeParameter('event') as string;
		const connectionName = (this.getNodeParameter('connectionName', 'default') as string) || 'default';

		const onEvent = (eventData: IDataObject) => {
			this.emit([this.helpers.returnJsonArray([eventData])]);
		};

		const connection = new DiscordGatewayConnection(this, event, onEvent);
		await connection.connect();

		registerGatewaySender(connectionName, (payload) => connection.sendCommand(payload));

		return {
			closeFunction: async () => {
				unregisterGatewaySender(connectionName);
				connection.close();
			},
		};
	}
}
