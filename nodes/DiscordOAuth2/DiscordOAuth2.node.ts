import {
	NodeConnectionTypes,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

import {
	buildAuthorizeUrl,
	buildBotInstallUrl,
	buildTokenRevocationUrl,
	discordOAuth2ScopeOptions,
} from '../Discord/shared/oauth2';
import { DISCORD_SNOWFLAKE_PATTERN } from '../Discord/shared/snowflake';

const SNOWFLAKE_REGEX = new RegExp(DISCORD_SNOWFLAKE_PATTERN);

export class DiscordOAuth2 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Discord OAuth2',
		name: 'discordOAuth2',
		icon: { light: 'file:discord.svg', dark: 'file:discord.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Build Discord OAuth2 URLs (bot install, authorize, token revocation) without making any HTTP request',
		defaults: {
			name: 'Discord OAuth2',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Build Bot Install URL',
						value: 'buildBotInstallUrl',
						description: 'Build a URL that adds the bot to a guild',
						action: 'Build bot install URL',
					},
					{
						name: 'Build Authorize URL',
						value: 'buildAuthorizeUrl',
						description: 'Build a user-facing OAuth2 authorization URL',
						action: 'Build authorize URL',
					},
					{
						name: 'Get Token Revocation URL',
						value: 'getTokenRevocationUrl',
						description: "Get Discord's OAuth2 token revocation endpoint URL",
						action: 'Get token revocation URL',
					},
				],
				default: 'buildBotInstallUrl',
			},

			// Build Bot Install URL fields
			{
				displayName: 'Application ID',
				name: 'applicationId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: { operation: ['buildBotInstallUrl', 'buildAuthorizeUrl'] },
				},
				description: "Snowflake ID of the Discord application (the bot's client ID)",
			},
			{
				displayName: 'Permissions',
				name: 'permissions',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['buildBotInstallUrl'] } },
				description:
					'Permission bitfield as a decimal string. Use the Permissions resource or a Discord helper to compute this.',
			},
			{
				displayName: 'Scopes',
				name: 'botInstallScopes',
				type: 'multiOptions',
				options: discordOAuth2ScopeOptions,
				default: ['bot', 'applications.commands'],
				displayOptions: { show: { operation: ['buildBotInstallUrl'] } },
				description: 'OAuth2 scopes to request for the install URL',
			},
			{
				displayName: 'Guild ID',
				name: 'guildId',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['buildBotInstallUrl'] } },
				description: "Snowflake ID of a guild to pre-fill the install dialog's guild selector",
			},
			{
				displayName: 'Disable Guild Select',
				name: 'disableGuildSelect',
				type: 'boolean',
				default: false,
				displayOptions: { show: { operation: ['buildBotInstallUrl'] } },
				description: 'Whether to prevent the user from changing the pre-selected guild',
			},

			// Build Authorize URL fields
			{
				displayName: 'Scopes',
				name: 'authorizeScopes',
				type: 'multiOptions',
				options: discordOAuth2ScopeOptions,
				default: ['identify'],
				displayOptions: { show: { operation: ['buildAuthorizeUrl'] } },
				description: 'OAuth2 scopes to request from the user',
			},
			{
				displayName: 'Redirect URI',
				name: 'redirectUri',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['buildAuthorizeUrl'] } },
				description: "Redirect URI registered with the application. Must be a valid URL.",
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['buildAuthorizeUrl'] } },
				description: 'Opaque value used to maintain state between the request and callback (CSRF protection)',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'options',
				options: [
					{ name: 'Consent', value: 'consent' },
					{ name: 'None', value: 'none' },
				],
				default: 'consent',
				displayOptions: { show: { operation: ['buildAuthorizeUrl'] } },
				description:
					'Whether to re-prompt the user for consent. Use "none" to skip the consent screen for previously authorized scopes.',
			},
			{
				displayName: 'Response Type',
				name: 'responseType',
				type: 'options',
				options: [
					{ name: 'Code', value: 'code' },
					{ name: 'Token', value: 'token' },
				],
				default: 'code',
				displayOptions: { show: { operation: ['buildAuthorizeUrl'] } },
				description: 'OAuth2 response type. Use "code" for the authorization code flow, "token" for implicit.',
			},
			{
				displayName: 'Integration Type',
				name: 'integrationType',
				type: 'options',
				options: [
					{ name: 'Guild Install', value: '0' },
					{ name: 'User Install', value: '1' },
					{ name: 'None (Omit)', value: 'none' },
				],
				default: '0',
				displayOptions: { show: { operation: ['buildAuthorizeUrl'] } },
				description:
					'Application integration type. Select "None" to omit the integration_type parameter from the URL.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;

			let url: string;

			if (operation === 'buildBotInstallUrl') {
				const applicationId = (this.getNodeParameter('applicationId', i, '') as string).trim();
				const permissions = (this.getNodeParameter('permissions', i, '') as string).trim();
				const scopes = this.getNodeParameter('botInstallScopes', i, []) as string[];
				const guildId = (this.getNodeParameter('guildId', i, '') as string).trim();
				const disableGuildSelect = this.getNodeParameter('disableGuildSelect', i, false) as boolean;

				if (applicationId === '') {
					throw new NodeOperationError(this.getNode(), 'Application ID is required', {
						itemIndex: i,
					});
				}
				if (!SNOWFLAKE_REGEX.test(applicationId)) {
					throw new NodeOperationError(
						this.getNode(),
						`Application ID is not a valid Discord snowflake: ${applicationId}`,
						{ itemIndex: i },
					);
				}
				if (guildId !== '' && !SNOWFLAKE_REGEX.test(guildId)) {
					throw new NodeOperationError(
						this.getNode(),
						`Guild ID is not a valid Discord snowflake: ${guildId}`,
						{ itemIndex: i },
					);
				}
				if (permissions !== '') {
					try {
						BigInt(permissions);
					} catch {
						throw new NodeOperationError(
							this.getNode(),
							`Permissions must be a decimal bitfield string: ${permissions}`,
							{ itemIndex: i },
						);
					}
				}

				url = buildBotInstallUrl({
					applicationId,
					permissions: permissions === '' ? undefined : permissions,
					scopes,
					guildId: guildId === '' ? undefined : guildId,
					disableGuildSelect,
				});
			} else if (operation === 'buildAuthorizeUrl') {
				const applicationId = (this.getNodeParameter('applicationId', i, '') as string).trim();
				const scopes = this.getNodeParameter('authorizeScopes', i, []) as string[];
				const redirectUri = (this.getNodeParameter('redirectUri', i, '') as string).trim();
				const state = (this.getNodeParameter('state', i, '') as string).trim();
				const prompt = this.getNodeParameter('prompt', i, 'consent') as 'consent' | 'none';
				const responseType = this.getNodeParameter('responseType', i, 'code') as 'code' | 'token';
				const integrationTypeRaw = this.getNodeParameter('integrationType', i, '0') as string;

				if (applicationId === '') {
					throw new NodeOperationError(this.getNode(), 'Application ID is required', {
						itemIndex: i,
					});
				}
				if (!SNOWFLAKE_REGEX.test(applicationId)) {
					throw new NodeOperationError(
						this.getNode(),
						`Application ID is not a valid Discord snowflake: ${applicationId}`,
						{ itemIndex: i },
					);
				}
				if (redirectUri === '') {
					throw new NodeOperationError(this.getNode(), 'Redirect URI is required', {
						itemIndex: i,
					});
				}
				try {
					new URL(redirectUri);
				} catch {
					throw new NodeOperationError(
						this.getNode(),
						`Redirect URI is not a valid URL: ${redirectUri}`,
						{ itemIndex: i },
					);
				}

				let integrationType: 0 | 1 | undefined;
				if (integrationTypeRaw === '0') {
					integrationType = 0;
				} else if (integrationTypeRaw === '1') {
					integrationType = 1;
				} else {
					integrationType = undefined;
				}

				url = buildAuthorizeUrl({
					applicationId,
					scopes,
					redirectUri,
					state: state === '' ? undefined : state,
					prompt,
					responseType,
					integrationType,
				});
			} else if (operation === 'getTokenRevocationUrl') {
				url = buildTokenRevocationUrl();
			} else {
				throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, {
					itemIndex: i,
				});
			}

			returnData.push({
				json: { url },
				pairedItem: { item: i },
			});
		}

		return [returnData];
	}
}
