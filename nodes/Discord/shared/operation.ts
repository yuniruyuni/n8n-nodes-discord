import type { INodeProperties, INodePropertyRouting } from 'n8n-workflow';

import { successOutput } from './routing';

export interface DiscordRestOperationDefinition {
	name: string;
	value: string;
	action: string;
	description?: string;
	method: NonNullable<INodePropertyRouting['request']>['method'];
	url: string;
	body?: NonNullable<INodePropertyRouting['request']>['body'];
	qs?: NonNullable<INodePropertyRouting['request']>['qs'];
	preSend?: NonNullable<INodePropertyRouting['send']>['preSend'];
	successOutput?: boolean;
}

export function createOperationSelector(
	resource: string,
	options: INodeProperties['options'],
	defaultOperation: string,
): INodeProperties {
	return {
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: [resource],
			},
		},
		options,
		default: defaultOperation,
	};
}

export function defineDiscordRestOperation(
	definition: DiscordRestOperationDefinition,
): NonNullable<INodeProperties['options']>[number] {
	const routing: INodePropertyRouting = {
		request: {
			method: definition.method,
			url: definition.url,
		},
	};

	if (definition.body !== undefined) {
		routing.request = {
			...routing.request,
			body: definition.body,
		};
	}

	if (definition.qs !== undefined) {
		routing.request = {
			...routing.request,
			qs: definition.qs,
		};
	}

	if (definition.preSend !== undefined) {
		routing.send = {
			preSend: definition.preSend,
		};
	}

	if (definition.successOutput === true) {
		routing.output = successOutput;
	}

	return {
		name: definition.name,
		value: definition.value,
		action: definition.action,
		description: definition.description,
		routing,
	};
}
