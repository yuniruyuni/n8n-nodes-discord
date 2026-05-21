import { NodeOperationError, type IDataObject, type IExecuteFunctions } from 'n8n-workflow';

import { parseCommaSeparated } from '../Discord/shared/validators';

const OPCODE_UPDATE_PRESENCE = 3;
const OPCODE_UPDATE_VOICE_STATE = 4;
const OPCODE_REQUEST_GUILD_MEMBERS = 8;
const OPCODE_REQUEST_SOUNDBOARD_SOUNDS = 31;

export interface GatewayCommandPayload {
	operation: string;
	sentPayload: {
		op: number;
		d: IDataObject;
	};
}

function readRequiredString(
	context: IExecuteFunctions,
	itemIndex: number,
	name: string,
	displayName: string,
): string {
	const value = (context.getNodeParameter(name, itemIndex, '') as string).trim();
	if (value === '') {
		throw new NodeOperationError(context.getNode(), `${displayName} is required`, {
			itemIndex,
		});
	}
	return value;
}

function readOptionalString(
	context: IExecuteFunctions,
	itemIndex: number,
	name: string,
): string {
	return (context.getNodeParameter(name, itemIndex, '') as string).trim();
}

function buildUpdatePresencePayload(
	context: IExecuteFunctions,
	itemIndex: number,
): GatewayCommandPayload {
	const status = context.getNodeParameter('status', itemIndex, 'online') as string;
	const afk = context.getNodeParameter('afk', itemIndex, false) as boolean;
	const since = context.getNodeParameter('since', itemIndex, 0) as number;
	const activityType = context.getNodeParameter('activityType', itemIndex, -1) as number;

	const activities: IDataObject[] = [];
	if (activityType >= 0) {
		const activityName = readOptionalString(context, itemIndex, 'activityName');
		if (activityName === '') {
			throw new NodeOperationError(
				context.getNode(),
				'Activity Name is required when Activity Type is set',
				{ itemIndex },
			);
		}
		const activity: IDataObject = {
			type: activityType,
			name: activityName,
		};
		if (activityType === 1) {
			const activityUrl = readOptionalString(context, itemIndex, 'activityUrl');
			if (activityUrl !== '') {
				activity.url = activityUrl;
			}
		}
		const activityState = readOptionalString(context, itemIndex, 'activityState');
		if (activityState !== '') {
			activity.state = activityState;
		}
		activities.push(activity);
	}

	return {
		operation: 'updatePresence',
		sentPayload: {
			op: OPCODE_UPDATE_PRESENCE,
			d: {
				since: since > 0 ? since : null,
				activities,
				status,
				afk,
			},
		},
	};
}

function buildUpdateVoiceStatePayload(
	context: IExecuteFunctions,
	itemIndex: number,
): GatewayCommandPayload {
	const guildId = readRequiredString(context, itemIndex, 'guildId', 'Guild ID');
	const channelId = readOptionalString(context, itemIndex, 'channelId');
	const selfMute = context.getNodeParameter('selfMute', itemIndex, false) as boolean;
	const selfDeaf = context.getNodeParameter('selfDeaf', itemIndex, false) as boolean;

	return {
		operation: 'updateVoiceState',
		sentPayload: {
			op: OPCODE_UPDATE_VOICE_STATE,
			d: {
				guild_id: guildId,
				channel_id: channelId === '' ? null : channelId,
				self_mute: selfMute,
				self_deaf: selfDeaf,
			},
		},
	};
}

function buildRequestGuildMembersPayload(
	context: IExecuteFunctions,
	itemIndex: number,
): GatewayCommandPayload {
	const guildId = readRequiredString(context, itemIndex, 'guildId', 'Guild ID');
	const query = context.getNodeParameter('query', itemIndex, '') as string;
	const maxMembers = context.getNodeParameter('maxMembers', itemIndex, 0) as number;
	const presences = context.getNodeParameter('presences', itemIndex, false) as boolean;
	const userIdsRaw = readOptionalString(context, itemIndex, 'userIds');
	const nonce = readOptionalString(context, itemIndex, 'nonce');
	const userIds = userIdsRaw === '' ? [] : parseCommaSeparated(userIdsRaw);

	if (query !== '' && userIds.length > 0) {
		throw new NodeOperationError(
			context.getNode(),
			'Query and User IDs are mutually exclusive; provide only one',
			{ itemIndex },
		);
	}

	const payload: IDataObject = {
		guild_id: guildId,
		limit: maxMembers,
		presences,
	};
	if (userIds.length > 0) {
		payload.user_ids = userIds;
	} else {
		payload.query = query;
	}
	if (nonce !== '') {
		payload.nonce = nonce;
	}

	return {
		operation: 'requestGuildMembers',
		sentPayload: {
			op: OPCODE_REQUEST_GUILD_MEMBERS,
			d: payload,
		},
	};
}

function buildRequestSoundboardSoundsPayload(
	context: IExecuteFunctions,
	itemIndex: number,
): GatewayCommandPayload {
	const guildIds = parseCommaSeparated(readOptionalString(context, itemIndex, 'guildIds'));
	if (guildIds.length === 0) {
		throw new NodeOperationError(context.getNode(), 'At least one Guild ID is required', {
			itemIndex,
		});
	}

	return {
		operation: 'requestSoundboardSounds',
		sentPayload: {
			op: OPCODE_REQUEST_SOUNDBOARD_SOUNDS,
			d: { guild_ids: guildIds },
		},
	};
}

const gatewayCommandPayloadBuilders: Record<
	string,
	(context: IExecuteFunctions, itemIndex: number) => GatewayCommandPayload
> = {
	requestGuildMembers: buildRequestGuildMembersPayload,
	requestSoundboardSounds: buildRequestSoundboardSoundsPayload,
	updatePresence: buildUpdatePresencePayload,
	updateVoiceState: buildUpdateVoiceStatePayload,
};

export function buildGatewayCommandPayload(
	context: IExecuteFunctions,
	itemIndex: number,
): GatewayCommandPayload {
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const builder = gatewayCommandPayloadBuilders[operation];
	if (!builder) {
		throw new NodeOperationError(context.getNode(), `Unsupported operation: ${operation}`, {
			itemIndex,
		});
	}
	return builder(context, itemIndex);
}
