import { createPublicKey, verify } from 'node:crypto';

import {
	ApplicationError,
	NodeConnectionTypes,
	type IDataObject,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';

const DISCORD_INTERACTION_TYPE_PING = 1;

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

const HEX_REGEX = /^[0-9a-f]+$/i;

function isHex(value: string): boolean {
	return HEX_REGEX.test(value) && value.length % 2 === 0;
}

function buildEd25519PublicKey(publicKeyHex: string): ReturnType<typeof createPublicKey> {
	const trimmed = publicKeyHex.trim();
	if (!isHex(trimmed) || trimmed.length !== 64) {
		throw new ApplicationError(
			'Discord public key must be a 64-character hexadecimal string (32 bytes).',
		);
	}
	const rawKey = Buffer.from(trimmed, 'hex');
	const der = Buffer.concat([ED25519_SPKI_PREFIX, rawKey]);
	return createPublicKey({ key: der, format: 'der', type: 'spki' });
}

function verifyDiscordSignature(
	rawBody: string,
	signatureHex: string,
	timestamp: string,
	publicKeyHex: string,
): boolean {
	if (!signatureHex || !timestamp || !isHex(signatureHex)) {
		return false;
	}
	try {
		const key = buildEd25519PublicKey(publicKeyHex);
		const signature = Buffer.from(signatureHex, 'hex');
		const message = Buffer.from(timestamp + rawBody);
		return verify(null, message, key, signature);
	} catch {
		return false;
	}
}

function readRawBody(request: { rawBody?: unknown; body?: unknown }): string {
	const raw = request.rawBody;
	if (Buffer.isBuffer(raw)) {
		return raw.toString('utf8');
	}
	if (typeof raw === 'string') {
		return raw;
	}
	const body = request.body;
	if (Buffer.isBuffer(body)) {
		return body.toString('utf8');
	}
	if (typeof body === 'string') {
		return body;
	}
	if (body && typeof body === 'object') {
		return JSON.stringify(body);
	}
	return '';
}

function getHeaderValue(headers: Record<string, unknown>, name: string): string {
	const value = headers[name.toLowerCase()];
	if (Array.isArray(value)) {
		return typeof value[0] === 'string' ? value[0] : '';
	}
	return typeof value === 'string' ? value : '';
}

// Discord's Interaction Endpoint URL is configured manually in the Discord
// Developer Portal — there is no API to register/check/delete it, so the
// webhook lifecycle methods don't apply here.
// eslint-disable-next-line @n8n/community-nodes/webhook-lifecycle-complete
export class DiscordHttpInteractionTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Discord HTTP Interaction Trigger',
		name: 'discordHttpInteractionTrigger',
		icon: { light: 'file:discord.svg', dark: 'file:discord.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["path"]}}',
		description:
			'Receive Discord application interactions via HTTPS webhook (Ed25519 signature-verified). Use a downstream Discord node with the "Interaction Response" resource to reply to the user.',
		defaults: {
			name: 'Discord HTTP Interaction Trigger',
		},
		usableAsTool: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'discordInteractionApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: '={{$parameter["path"]}}',
				isFullPath: false,
			},
		],
		properties: [
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: 'discord-interactions',
				required: true,
				placeholder: 'discord-interactions',
				description:
					'URL slug appended to the n8n webhook base URL. Configure this full URL as the "Interactions Endpoint URL" in the Discord application portal.',
			},
			{
				displayName:
					'Discord validates this endpoint by sending a PING interaction (type 1) which is answered automatically. For non-PING interactions this node responds with 202 Accepted and emits the parsed payload. To reply to the user, follow this trigger with a Discord node using the "Interaction Response" resource within the 3-second Discord deadline.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const credentials = await this.getCredentials<{ applicationId: string; publicKey: string }>(
			'discordInteractionApi',
		);
		const publicKey = (credentials.publicKey ?? '').toString();

		const headers = this.getHeaderData() as Record<string, unknown>;
		const signature = getHeaderValue(headers, 'x-signature-ed25519');
		const timestamp = getHeaderValue(headers, 'x-signature-timestamp');

		const request = this.getRequestObject() as unknown as {
			rawBody?: unknown;
			body?: unknown;
		};
		const rawBody = readRawBody(request);

		const response = this.getResponseObject();

		if (!verifyDiscordSignature(rawBody, signature, timestamp, publicKey)) {
			response.status(401).send('invalid request signature');
			return { noWebhookResponse: true };
		}

		let payload: IDataObject;
		try {
			payload = (rawBody.length > 0 ? JSON.parse(rawBody) : {}) as IDataObject;
		} catch {
			response.status(400).send('invalid request body');
			return { noWebhookResponse: true };
		}

		if (payload.type === DISCORD_INTERACTION_TYPE_PING) {
			response.status(200).json({ type: 1 });
			return { noWebhookResponse: true };
		}

		response.status(202).send('');

		return {
			noWebhookResponse: true,
			workflowData: [this.helpers.returnJsonArray([payload])],
		};
	}
}
