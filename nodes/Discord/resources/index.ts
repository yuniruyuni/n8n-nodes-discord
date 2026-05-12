import type { INodeProperties } from 'n8n-workflow';

import { applicationFields, applicationOperations } from './Application';
import { applicationCommandFields, applicationCommandOperations } from './ApplicationCommand';
import {
	applicationRoleConnectionMetadataFields,
	applicationRoleConnectionMetadataOperations,
} from './ApplicationRoleConnectionMetadata';
import { auditLogFields, auditLogOperations } from './AuditLog';
import { channelFields, channelOperations } from './Channel';
import { entitlementFields, entitlementOperations } from './Entitlement';
import { guildFields, guildOperations } from './Guild';
import { interactionResponseFields, interactionResponseOperations } from './InteractionResponse';
import { inviteFields, inviteOperations } from './Invite';
import { memberFields, memberOperations } from './Member';
import { messageFields, messageOperations } from './Message';
import { pollFields, pollOperations } from './Poll';
import { roleFields, roleOperations } from './Role';
import { skuFields, skuOperations } from './Sku';
import { subscriptionFields, subscriptionOperations } from './Subscription';
import { userFields, userOperations } from './User';
import { voiceFields, voiceOperations } from './Voice';
import { webhookFields, webhookOperations } from './Webhook';

export const allOperations: INodeProperties[] = [
	...applicationOperations,
	...applicationCommandOperations,
	...applicationRoleConnectionMetadataOperations,
	...auditLogOperations,
	...channelOperations,
	...entitlementOperations,
	...guildOperations,
	...interactionResponseOperations,
	...inviteOperations,
	...memberOperations,
	...messageOperations,
	...pollOperations,
	...roleOperations,
	...skuOperations,
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
	...channelFields,
	...entitlementFields,
	...guildFields,
	...interactionResponseFields,
	...inviteFields,
	...memberFields,
	...messageFields,
	...pollFields,
	...roleFields,
	...skuFields,
	...subscriptionFields,
	...userFields,
	...voiceFields,
	...webhookFields,
];
