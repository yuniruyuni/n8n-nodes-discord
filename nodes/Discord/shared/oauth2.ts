import type { INodePropertyOptions } from 'n8n-workflow';

export const DISCORD_OAUTH2_SCOPES = [
	'bot',
	'applications.commands',
	'applications.commands.update',
	'applications.commands.permissions.update',
	'identify',
	'email',
	'connections',
	'guilds',
	'guilds.join',
	'guilds.members.read',
	'gdm.join',
	'rpc',
	'rpc.notifications.read',
	'rpc.voice.read',
	'rpc.voice.write',
	'rpc.activities.write',
	'webhook.incoming',
	'messages.read',
	'applications.builds.upload',
	'applications.builds.read',
	'applications.store.update',
	'applications.entitlements',
	'applications.profile.fragmentation',
	'activities.read',
	'activities.write',
	'activities.invites.write',
	'relationships.read',
	'role_connections.write',
	'voice',
	'dm_channels.read',
	'dm_channels.messages.read',
	'dm_channels.messages.write',
	'openid',
] as const;

export type DiscordOAuth2Scope = (typeof DISCORD_OAUTH2_SCOPES)[number];

const SCOPE_DESCRIPTIONS: Record<DiscordOAuth2Scope, string> = {
	bot: 'Adds the bot to the selected guild',
	'applications.commands': 'Allows the application to use application commands in a guild',
	'applications.commands.update': 'Allows updating the application\'s commands using a bearer token',
	'applications.commands.permissions.update': 'Allows updating permissions for the application\'s commands in a guild the user has permissions to',
	identify: 'Allows fetching the user\'s account information without email',
	email: 'Enables the email field on the user object',
	connections: 'Allows fetching the user\'s linked third-party accounts',
	guilds: 'Allows fetching basic information about all of the user\'s guilds',
	'guilds.join': 'Allows joining users to a guild via the join endpoint',
	'guilds.members.read': 'Allows reading the authenticated user\'s member info in a guild',
	'gdm.join': 'Allows joining users to a group DM',
	rpc: 'Allows controlling a user\'s local Discord client (whitelist only)',
	'rpc.notifications.read': 'Allows receiving notifications pushed to the user (whitelist only)',
	'rpc.voice.read': 'Allows reading the user\'s voice settings and listening to voice events (whitelist only)',
	'rpc.voice.write': 'Allows updating the user\'s voice settings (whitelist only)',
	'rpc.activities.write': 'Allows updating the user\'s activity (whitelist only)',
	'webhook.incoming': 'Returns a webhook on the access-token response for the chosen channel',
	'messages.read': 'For local RPC server access; reads messages in all client channels (whitelist only)',
	'applications.builds.upload': 'Allows uploading or updating builds for the application (whitelist only)',
	'applications.builds.read': 'Allows reading build data for the application',
	'applications.store.update': 'Allows managing store SKUs and assets for the application',
	'applications.entitlements': 'Allows reading entitlements for the application',
	'applications.profile.fragmentation': 'Allows the application to read and update its own profile fragmentation data',
	'activities.read': 'Allows reading the user\'s activity history (whitelist only)',
	'activities.write': 'Allows the application to update the user\'s activity (whitelist only outside the GameSDK)',
	'activities.invites.write': 'Allows the application to send activity invites on behalf of the user',
	'relationships.read': 'Allows reading the user\'s relationships (whitelist only)',
	'role_connections.write': 'Allows updating the user\'s linked roles connection metadata for the application',
	voice: 'Allows connecting to voice on the user\'s behalf and seeing voice members (whitelist only)',
	'dm_channels.read': 'Allows reading the structure of the user\'s DM and group DM channels (whitelist only)',
	'dm_channels.messages.read': 'Allows reading messages in DM and group DM channels (whitelist only)',
	'dm_channels.messages.write': 'Allows sending messages on the user\'s behalf in DM and group DM channels (whitelist only)',
	openid: 'Enables OpenID Connect; includes an id_token in the access-token response',
};

export const discordOAuth2ScopeOptions: INodePropertyOptions[] = DISCORD_OAUTH2_SCOPES.map((scope) => ({
	name: scope,
	value: scope,
	description: SCOPE_DESCRIPTIONS[scope],
}));

const DEFAULT_BOT_INSTALL_SCOPES: readonly string[] = ['bot', 'applications.commands'];

const OAUTH2_AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';

// Exported as a constant. The Discord token-revocation endpoint is a fixed
// URL with no parameters, so a builder function would add only noise.
export const TOKEN_REVOCATION_URL = 'https://discord.com/api/v10/oauth2/token/revoke';

export function buildTokenRevocationUrl(): string {
	return TOKEN_REVOCATION_URL;
}

export interface BuildBotInstallUrlInput {
	applicationId: string;
	permissions?: string | number | bigint;
	scopes?: string[];
	guildId?: string;
	disableGuildSelect?: boolean;
}

export function buildBotInstallUrl(input: BuildBotInstallUrlInput): string {
	const scopes = input.scopes && input.scopes.length > 0 ? input.scopes : [...DEFAULT_BOT_INSTALL_SCOPES];
	const params = new URLSearchParams();
	params.set('client_id', input.applicationId);
	params.set('scope', scopes.join(' '));

	if (input.permissions !== undefined) {
		params.set('permissions', BigInt(input.permissions).toString());
	}
	if (input.guildId !== undefined) {
		params.set('guild_id', input.guildId);
	}
	if (input.disableGuildSelect !== undefined) {
		params.set('disable_guild_select', input.disableGuildSelect ? 'true' : 'false');
	}

	return `${OAUTH2_AUTHORIZE_URL}?${params.toString()}`;
}

export interface BuildAuthorizeUrlInput {
	applicationId: string;
	scopes: string[];
	redirectUri: string;
	state?: string;
	prompt?: 'consent' | 'none';
	responseType?: 'code' | 'token';
	integrationType?: 0 | 1;
}

export function buildAuthorizeUrl(input: BuildAuthorizeUrlInput): string {
	const params = new URLSearchParams();
	params.set('client_id', input.applicationId);
	params.set('response_type', input.responseType ?? 'code');
	params.set('redirect_uri', input.redirectUri);
	params.set('scope', input.scopes.join(' '));

	if (input.state !== undefined) {
		params.set('state', input.state);
	}
	if (input.prompt !== undefined) {
		params.set('prompt', input.prompt);
	}
	if (input.integrationType !== undefined) {
		params.set('integration_type', input.integrationType.toString());
	}

	return `${OAUTH2_AUTHORIZE_URL}?${params.toString()}`;
}
