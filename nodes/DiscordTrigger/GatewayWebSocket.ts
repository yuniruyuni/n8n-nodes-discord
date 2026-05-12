import { ApplicationError, LoggerProxy, sleep, type IDataObject } from 'n8n-workflow';

const OPCODE_DISPATCH = 0;
const OPCODE_HEARTBEAT = 1;
const OPCODE_IDENTIFY = 2;
const OPCODE_RESUME = 6;
const OPCODE_RECONNECT = 7;
const OPCODE_INVALID_SESSION = 9;
const OPCODE_HELLO = 10;
const OPCODE_HEARTBEAT_ACK = 11;

type EventHandler = (eventName: string, data: IDataObject, raw: IDataObject) => void;
type DisconnectHandler = (canResume: boolean) => void;

interface GatewayIdentifyOptions {
	token: string;
	intents: number;
	resumeState?: {
		sessionId?: string;
		sequence?: number;
	};
}

export class GatewayWebSocket {
	private ws: WebSocket | null = null;
	private heartbeatEpoch = 0;
	private heartbeatAcked = true;
	private sequence: number | null = null;
	private sessionId: string | null = null;
	private resumeGatewayUrl: string | null = null;
	private closing = false;

	constructor(
		private readonly gatewayUrl: string,
		private readonly workflowId: string,
		private readonly onEvent: EventHandler,
		private readonly onDisconnect: DisconnectHandler,
	) {}

	async connect(options: GatewayIdentifyOptions): Promise<void> {
		const url = `${this.gatewayUrl}?v=10&encoding=json`;

		return new Promise((resolve, reject) => {
			try {
				this.ws = new WebSocket(url);

				this.ws.onmessage = (event: MessageEvent) => {
					try {
						const payload = JSON.parse(event.data as string) as IDataObject;
						this.handlePayload(payload, options, resolve);
					} catch (error) {
						LoggerProxy.error('Failed to handle Discord Gateway payload', {
							error: error instanceof Error ? error.message : String(error),
							workflowId: this.workflowId,
							nodeType: 'n8n-nodes-discord.discordTrigger',
						});
						reject(error);
					}
				};

				this.ws.onerror = () => {
					reject(new ApplicationError('Discord Gateway WebSocket error occurred'));
				};

				this.ws.onclose = () => {
					this.stopHeartbeat();
					if (!this.closing) {
						this.onDisconnect(this.sessionId !== null);
					}
				};
			} catch (error) {
				reject(error);
			}
		});
	}

	close(): void {
		this.closing = true;
		this.stopHeartbeat();
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	getSessionState(): IDataObject {
		return {
			sessionId: this.sessionId,
			sequence: this.sequence,
			resumeGatewayUrl: this.resumeGatewayUrl,
		};
	}

	sendCommand(payload: { op: number; d: unknown }): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			throw new ApplicationError(
				'Discord Gateway WebSocket is not open; cannot send command',
			);
		}
		this.ws.send(JSON.stringify(payload));
	}

	private handlePayload(
		payload: IDataObject,
		options: GatewayIdentifyOptions,
		resolve: () => void,
	): void {
		const op = payload.op as number;

		if (typeof payload.s === 'number') {
			this.sequence = payload.s;
		}

		if (op === OPCODE_HELLO) {
			const data = payload.d as IDataObject;
			this.startHeartbeat(data.heartbeat_interval as number);
			this.identifyOrResume(options);
			return;
		}

		if (op === OPCODE_HEARTBEAT) {
			this.sendHeartbeat();
			return;
		}

		if (op === OPCODE_HEARTBEAT_ACK) {
			this.heartbeatAcked = true;
			return;
		}

		if (op === OPCODE_RECONNECT) {
			this.close();
			this.onDisconnect(this.sessionId !== null);
			return;
		}

		if (op === OPCODE_INVALID_SESSION) {
			const canResume = payload.d === true;
			this.onDisconnect(canResume);
			return;
		}

		if (op === OPCODE_DISPATCH) {
			const eventName = payload.t as string;
			const data = payload.d as IDataObject;

			if (eventName === 'READY') {
				this.sessionId = data.session_id as string;
				this.resumeGatewayUrl = data.resume_gateway_url as string;
				resolve();
			} else if (eventName === 'RESUMED') {
				resolve();
			}

			this.onEvent(eventName, data, payload);
		}
	}

	private identifyOrResume(options: GatewayIdentifyOptions): void {
		if (options.resumeState?.sessionId && typeof options.resumeState.sequence === 'number') {
			this.send({
				op: OPCODE_RESUME,
				d: {
					token: options.token,
					session_id: options.resumeState.sessionId,
					seq: options.resumeState.sequence,
				},
			});
			return;
		}

		this.send({
			op: OPCODE_IDENTIFY,
			d: {
				token: options.token,
				intents: options.intents,
				properties: {
					os: 'linux',
					browser: 'n8n-nodes-discord',
					device: 'n8n-nodes-discord',
				},
			},
		});
	}

	private startHeartbeat(interval: number): void {
		this.stopHeartbeat();
		this.heartbeatAcked = true;
		const epoch = ++this.heartbeatEpoch;
		const runHeartbeatLoop = async () => {
			await sleep(interval);
			if (this.closing || epoch !== this.heartbeatEpoch) {
				return;
			}
			if (!this.heartbeatAcked) {
				LoggerProxy.warn('Discord Gateway heartbeat ACK not received, reconnecting', {
					workflowId: this.workflowId,
					nodeType: 'n8n-nodes-discord.discordTrigger',
				});
				this.close();
				this.onDisconnect(this.sessionId !== null);
				return;
			}
			this.sendHeartbeat();
			void runHeartbeatLoop();
		};
		this.sendHeartbeat();
		void runHeartbeatLoop();
	}

	private stopHeartbeat(): void {
		this.heartbeatEpoch++;
	}

	private sendHeartbeat(): void {
		this.heartbeatAcked = false;
		this.send({
			op: OPCODE_HEARTBEAT,
			d: this.sequence,
		});
	}

	private send(payload: IDataObject): void {
		if (!this.ws) {
			return;
		}
		this.ws.send(JSON.stringify(payload));
	}
}
