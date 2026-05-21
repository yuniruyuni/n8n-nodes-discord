import type { INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../../shared/updateDisplayOptions';

export function showForResource(
	resource: string,
	properties: INodeProperties[],
): INodeProperties[] {
	return updateDisplayOptions({ show: { resource: [resource] } }, properties);
}

export function showForOperation(
	resource: string,
	operations: string[],
	properties: INodeProperties[],
): INodeProperties[] {
	return updateDisplayOptions(
		{ show: { resource: [resource], operation: operations } },
		properties,
	);
}
