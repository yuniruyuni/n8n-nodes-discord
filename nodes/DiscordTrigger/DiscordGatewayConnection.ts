import { LoggerProxy, sleep, type IDataObject, type ITriggerFunctions } from 'n8n-workflow';

import { DISCORD_API_BASE_URL } from '../Discord/shared/constants';
import { calculateIntents } from '../Discord/shared/intents';
import { GatewayWebSocket } from './GatewayWebSocket';

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1000;

export class DiscordGatewayConnection {
	private ws: GatewayWebSocket | null = null;
	private closing = false;
	private reconnectAttempts = 0;

	constructor(
		private readonly trigger: ITriggerFunctions,
		private readonly event: string,
		private readonly onEvent: (data: IDataObject) => void,
	) {}

	async connect(): Promise<void> {
		const credentials = await this.trigger.getCredentials('discordBotApi');
		const token = credentials.botToken as string;
		const autoCalculateIntents = this.trigger.getNodeParameter('autoCalculateIntents') as boolean;
		const selectedIntents = autoCalculateIntents
			? []
			: (this.trigger.getNodeParameter('intents') as string[]);
		const intents = calculateIntents(this.event, selectedIntents);
		const gatewayUrl = await this.getGatewayUrl();

		this.ws = this.createWebSocket(gatewayUrl);
		await this.ws.connect({
			token,
			intents,
			resumeState: this.trigger.getWorkflowStaticData('node') as {
				sessionId?: string;
				sequence?: number;
			},
		});
		this.reconnectAttempts = 0;
		this.persistSessionState();
	}

	close(): void {
		this.closing = true;
		if (this.ws) {
			this.ws.close();
			this.persistSessionState();
		}
	}

	sendCommand(payload: { op: number; d: unknown }): void {
		if (!this.ws) {
			throw new Error('Discord Gateway connection is not established');
		}
		this.ws.sendCommand(payload);
	}

	private async getGatewayUrl(): Promise<string> {
		const response = await this.trigger.helpers.httpRequestWithAuthentication.call(
			this.trigger,
			'discordBotApi',
			{
				method: 'GET',
				url: `${DISCORD_API_BASE_URL}/gateway/bot`,
				json: true,
			},
		);

		const data = response as IDataObject;
		return data.url as string;
	}

	private createWebSocket(gatewayUrl: string): GatewayWebSocket {
		return new GatewayWebSocket(
			gatewayUrl,
			this.trigger.getWorkflow().id || '',
			(eventName, data, raw) => this.handleEvent(eventName, data, raw),
			(canResume) => this.handleDisconnect(canResume),
		);
	}

	private handleEvent(eventName: string, data: IDataObject, raw: IDataObject): void {
		this.persistSessionState();
		if (this.event !== '*' && eventName !== this.event) {
			return;
		}

		if (eventName === 'MESSAGE_CREATE' || eventName === 'MESSAGE_UPDATE') {
			const includeBotMessages = this.trigger.getNodeParameter(
				'includeBotMessages',
				false,
			) as boolean;
			if (!includeBotMessages) {
				const author = data.author as IDataObject | undefined;
				if (author?.bot === true || data.webhook_id || author?.system === true) {
					return;
				}
			}
		}

		const emitRawPayload = this.trigger.getNodeParameter('emitRawPayload') as boolean;
		this.onEvent(
			emitRawPayload
				? raw
				: {
						event: eventName,
						data,
					},
		);
	}

	private handleDisconnect(canResume: boolean): void {
		if (this.closing) {
			return;
		}

		if (!canResume) {
			const staticData = this.trigger.getWorkflowStaticData('node');
			delete staticData.sessionId;
			delete staticData.sequence;
			delete staticData.resumeGatewayUrl;
		}

		if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
			LoggerProxy.error('Discord Gateway: max reconnect attempts reached, giving up', {
				workflowId: this.trigger.getWorkflow().id,
				nodeType: 'n8n-nodes-discord.discordTrigger',
				attempts: this.reconnectAttempts,
			});
			return;
		}

		this.reconnectAttempts++;
		const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1);

		void sleep(delay).then(() => {
			if (!this.closing) {
				void this.connect();
			}
		});
	}

	private persistSessionState(): void {
		if (!this.ws) {
			return;
		}
		const staticData = this.trigger.getWorkflowStaticData('node');
		const sessionState = this.ws.getSessionState();
		for (const [key, value] of Object.entries(sessionState)) {
			if (value === null || value === undefined) {
				delete staticData[key];
			} else {
				staticData[key] = value;
			}
		}
	}
}
