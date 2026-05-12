import type { INodeProperties } from 'n8n-workflow';

import { applicationFields, applicationOperations } from './Application';
import { applicationCommandFields, applicationCommandOperations } from './ApplicationCommand';
import {
	applicationRoleConnectionMetadataFields,
	applicationRoleConnectionMetadataOperations,
} from './ApplicationRoleConnectionMetadata';
import { auditLogFields, auditLogOperations } from './AuditLog';
import { autoModerationFields, autoModerationOperations } from './AutoModeration';
import { channelFields, channelOperations } from './Channel';
import { emojiFields, emojiOperations } from './Emoji';
import { entitlementFields, entitlementOperations } from './Entitlement';
import { guildFields, guildOperations } from './Guild';
import { guildScheduledEventFields, guildScheduledEventOperations } from './GuildScheduledEvent';
import { guildTemplateFields, guildTemplateOperations } from './GuildTemplate';
import { interactionResponseFields, interactionResponseOperations } from './InteractionResponse';
import { inviteFields, inviteOperations } from './Invite';
import { lobbyFields, lobbyOperations } from './Lobby';
import { memberFields, memberOperations } from './Member';
import { messageFields, messageOperations } from './Message';
import { pollFields, pollOperations } from './Poll';
import { roleFields, roleOperations } from './Role';
import { skuFields, skuOperations } from './Sku';
import { soundboardFields, soundboardOperations } from './Soundboard';
import { stageInstanceFields, stageInstanceOperations } from './StageInstance';
import { stickerFields, stickerOperations } from './Sticker';
import { subscriptionFields, subscriptionOperations } from './Subscription';
import { userFields, userOperations } from './User';
import { voiceFields, voiceOperations } from './Voice';
import { webhookFields, webhookOperations } from './Webhook';

export const allOperations: INodeProperties[] = [
	...applicationOperations,
	...applicationCommandOperations,
	...applicationRoleConnectionMetadataOperations,
	...auditLogOperations,
	...autoModerationOperations,
	...channelOperations,
	...emojiOperations,
	...entitlementOperations,
	...guildOperations,
	...guildScheduledEventOperations,
	...guildTemplateOperations,
	...interactionResponseOperations,
	...inviteOperations,
	...lobbyOperations,
	...memberOperations,
	...messageOperations,
	...pollOperations,
	...roleOperations,
	...skuOperations,
	...soundboardOperations,
	...stageInstanceOperations,
	...stickerOperations,
	...subscriptionOperations,
	...userOperations,
	...voiceOperations,
	...webhookOperations,
];

export const allFields: INodeProperties[] = [
	...applicationFields,
	...applicationCommandFields,
	...applicationRoleConnectionMetadataFields,
	...auditLogFields,
	...autoModerationFields,
	...channelFields,
	...emojiFields,
	...entitlementFields,
	...guildFields,
	...guildScheduledEventFields,
	...guildTemplateFields,
	...interactionResponseFields,
	...inviteFields,
	...lobbyFields,
	...memberFields,
	...messageFields,
	...pollFields,
	...roleFields,
	...skuFields,
	...soundboardFields,
	...stageInstanceFields,
	...stickerFields,
	...subscriptionFields,
	...userFields,
	...voiceFields,
	...webhookFields,
];
