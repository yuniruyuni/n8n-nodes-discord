import type { INodeProperties } from 'n8n-workflow';

import { applicationCommandFields, applicationCommandOperations } from './ApplicationCommand';
import { channelFields, channelOperations } from './Channel';
import { guildFields, guildOperations } from './Guild';
import { inviteFields, inviteOperations } from './Invite';
import { interactionResponseFields, interactionResponseOperations } from './InteractionResponse';
import { memberFields, memberOperations } from './Member';
import { messageFields, messageOperations } from './Message';
import { roleFields, roleOperations } from './Role';
import { userFields, userOperations } from './User';
import { webhookFields, webhookOperations } from './Webhook';

export const allOperations: INodeProperties[] = [
	...channelOperations,
	...guildOperations,
	...roleOperations,
	...memberOperations,
	...inviteOperations,
	...userOperations,
	...messageOperations,
	...webhookOperations,
	...applicationCommandOperations,
	...interactionResponseOperations,
];

export const allFields: INodeProperties[] = [
	...channelFields,
	...guildFields,
	...roleFields,
	...memberFields,
	...inviteFields,
	...userFields,
	...messageFields,
	...webhookFields,
	...applicationCommandFields,
	...interactionResponseFields,
];
