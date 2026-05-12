import type { INodeProperties } from 'n8n-workflow';

import { gatewayIntentOptions } from '../../Discord/shared/intents';
import { applicationCommandEvents } from './applicationCommand';
import { autoModerationEvents } from './autoModeration';
import { channelThreadEvents } from './channelThread';
import { coreEvents } from './core';
import { entitlementEvents } from './entitlement';
import { guildEvents } from './guild';
import { guildScheduledEventEvents } from './guildScheduledEvent';
import { integrationEvents } from './integration';
import { interactionEvents } from './interaction';
import { inviteEvents } from './invite';
import { messageEvents } from './message';
import { pollEvents } from './poll';
import { presenceEvents } from './presence';
import { reactionEvents } from './reaction';
import { soundboardEvents } from './soundboard';
import { stageInstanceEvents } from './stageInstance';
import { subscriptionEvents } from './subscription';
import { typingEvents } from './typing';
import type { DiscordEventMeta } from './types';
import { userEvents } from './user';
import { voiceEvents } from './voice';

export type { DiscordEventMeta } from './types';
export { coreEvents } from './core';
export { applicationCommandEvents } from './applicationCommand';
export { autoModerationEvents } from './autoModeration';
export { channelThreadEvents } from './channelThread';
export { entitlementEvents } from './entitlement';
export { guildEvents } from './guild';
export { guildScheduledEventEvents } from './guildScheduledEvent';
export { integrationEvents } from './integration';
export { interactionEvents } from './interaction';
export { inviteEvents } from './invite';
export { messageEvents } from './message';
export { pollEvents } from './poll';
export { presenceEvents } from './presence';
export { reactionEvents } from './reaction';
export { soundboardEvents } from './soundboard';
export { stageInstanceEvents } from './stageInstance';
export { subscriptionEvents } from './subscription';
export { typingEvents } from './typing';
export { userEvents } from './user';
export { voiceEvents } from './voice';

export const allDiscordGatewayEvents: DiscordEventMeta[] = [
	...coreEvents,
	...applicationCommandEvents,
	...autoModerationEvents,
	...channelThreadEvents,
	...entitlementEvents,
	...guildEvents,
	...guildScheduledEventEvents,
	...integrationEvents,
	...interactionEvents,
	...inviteEvents,
	...messageEvents,
	...reactionEvents,
	...pollEvents,
	...presenceEvents,
	...soundboardEvents,
	...stageInstanceEvents,
	...subscriptionEvents,
	...typingEvents,
	...userEvents,
	...voiceEvents,
];

export const privilegedDiscordGatewayEvents: DiscordEventMeta[] = allDiscordGatewayEvents.filter(
	(event) => event.privileged === true,
);

const eventMetaByName: Record<string, DiscordEventMeta> = allDiscordGatewayEvents.reduce(
	(acc, event) => {
		acc[event.name] = event;
		return acc;
	},
	{} as Record<string, DiscordEventMeta>,
);

export function getEventMeta(name: string): DiscordEventMeta | undefined {
	return eventMetaByName[name];
}

const eventOptionsFromMeta = allDiscordGatewayEvents
	.map((event) => ({ name: event.displayName, value: event.name }))
	.sort((a, b) => a.name.localeCompare(b.name));

export const gatewayEventOptions = [
	{ name: 'Any Event', value: '*' },
	...eventOptionsFromMeta,
];

export const discordTriggerEvents = allDiscordGatewayEvents;

export const triggerProperties: INodeProperties[] = [
	{
		displayName: 'Event',
		name: 'event',
		type: 'options',
		noDataExpression: true,
		options: gatewayEventOptions,
		default: 'MESSAGE_CREATE',
		description: 'Discord Gateway event to listen for. Full Gateway event coverage is tracked in the TODO.',
	},
	{
		displayName: 'Auto Calculate Intents',
		name: 'autoCalculateIntents',
		type: 'boolean',
		default: true,
		description: 'Whether to derive Gateway intents from the selected event',
	},
	{
		displayName: 'Intents',
		name: 'intents',
		type: 'multiOptions',
		options: gatewayIntentOptions,
		default: ['GUILDS'],
		displayOptions: {
			show: {
				autoCalculateIntents: [false],
			},
		},
		description: 'Gateway intents to send with Identify. Privileged intents must be enabled in the Discord Developer Portal.',
	},
	{
		displayName: 'Emit Raw Gateway Payload',
		name: 'emitRawPayload',
		type: 'boolean',
		default: false,
		description: 'Whether to emit the full Gateway payload instead of only the event data with metadata',
	},
];
