import type { INodeProperties } from 'n8n-workflow';

export const inviteOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['invite'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get an invite',
				routing: {
					request: {
						method: 'GET',
						url: '=/invites/{{$parameter.inviteCode}}',
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete an invite',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/invites/{{$parameter.inviteCode}}',
					},
				},
			},
		],
		default: 'get',
	},
];

export const inviteFields: INodeProperties[] = [
	{
		displayName: 'Invite Code',
		name: 'inviteCode',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['invite'],
			},
		},
		description: 'Invite code from a Discord invite URL',
	},
];
