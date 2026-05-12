import type { IDataObject, INodeProperties } from 'n8n-workflow';

export const DISCORD_AUDIT_LOG_REASON_HEADER = 'X-Audit-Log-Reason';

export function encodeAuditLogReason(reason: string): string {
	return encodeURIComponent(reason);
}

export function addAuditLogReasonHeader<T extends { headers?: IDataObject }>(
	requestOptions: T,
	reason: string | undefined,
): T {
	if (!reason) {
		return requestOptions;
	}

	return {
		...requestOptions,
		headers: {
			...(requestOptions.headers ?? {}),
			[DISCORD_AUDIT_LOG_REASON_HEADER]: encodeAuditLogReason(reason),
		},
	};
}

export function createAuditLogReasonField(overrides: Partial<INodeProperties> = {}): INodeProperties {
	return {
		displayName: 'Audit Log Reason',
		name: 'auditLogReason',
		type: 'string',
		default: '',
		description: 'Reason to show in the Discord guild audit log. Discord limits this header to 512 characters.',
		routing: {
			request: {
				headers: {
					[DISCORD_AUDIT_LOG_REASON_HEADER]:
						'={{$parameter.auditLogReason ? encodeURIComponent($parameter.auditLogReason) : undefined}}',
				},
			},
		},
		...overrides,
	};
}
