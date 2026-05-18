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

// Module-level registry of active connections keyed by workflow + node id.
// Defensive cleanup for cases where n8n's lifecycle does not invoke
// closeFunction before re-running trigger() (workflow re-activation, hot
// reload during dev, etc.). Without this, the previous WebSocket stays open
// and Discord continues delivering events to it in parallel with the new one,
// causing duplicate emits that accumulate per re-activation.
const activeConnections = new Map<string, DiscordGatewayConnection>();

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

		const workflowId = this.getWorkflow().id ?? '';
		const nodeName = this.getNode().name;
		const registryKey = `${workflowId}:${nodeName}`;

		// If a previous activation of this same node left a connection behind
		// (n8n did not call closeFunction before reactivating), tear it down
		// before creating a new one.
		const stale = activeConnections.get(registryKey);
		if (stale) {
			activeConnections.delete(registryKey);
			await stale.close();
		}

		const onEvent = (eventData: IDataObject) => {
			this.emit([this.helpers.returnJsonArray([eventData])]);
		};

		const connection = new DiscordGatewayConnection(this, event, onEvent);
		await connection.connect();

		activeConnections.set(registryKey, connection);
		registerGatewaySender(connectionName, (payload) => connection.sendCommand(payload));

		return {
			closeFunction: async () => {
				unregisterGatewaySender(connectionName);
				if (activeConnections.get(registryKey) === connection) {
					activeConnections.delete(registryKey);
				}
				await connection.close();
			},
		};
	}
}
