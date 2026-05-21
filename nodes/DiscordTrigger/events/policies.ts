import type { IDataObject } from 'n8n-workflow';

export interface DiscordGatewayEventPolicyContext {
	includeBotMessages: boolean;
}

export interface DiscordGatewayEventPolicy {
	shouldEmit(data: IDataObject, context: DiscordGatewayEventPolicyContext): boolean;
}

function shouldEmitMessageEvent(
	data: IDataObject,
	context: DiscordGatewayEventPolicyContext,
): boolean {
	if (context.includeBotMessages) {
		return true;
	}

	const author = data.author as IDataObject | undefined;
	return author?.bot !== true && !data.webhook_id && author?.system !== true;
}

const eventPolicies: Record<string, DiscordGatewayEventPolicy> = {
	MESSAGE_CREATE: { shouldEmit: shouldEmitMessageEvent },
	MESSAGE_UPDATE: { shouldEmit: shouldEmitMessageEvent },
};

export function shouldEmitGatewayEvent(
	eventName: string,
	data: IDataObject,
	context: DiscordGatewayEventPolicyContext,
): boolean {
	return eventPolicies[eventName]?.shouldEmit(data, context) ?? true;
}
