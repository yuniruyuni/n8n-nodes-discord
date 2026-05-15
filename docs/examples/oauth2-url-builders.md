# Build Discord OAuth2 URLs with a Code Node

The dedicated `Discord OAuth2` node was removed in `0.3.0`. URL building is pure string composition that does not need a custom node — n8n's built-in **Code** node handles it in a few lines. The snippets below cover the three URLs that node previously produced: the bot install URL, a generic authorize URL, and the token revocation endpoint.

Each snippet:

- Runs in **Code > JavaScript** in *Run Once for Each Item* mode.
- Reads parameters from `$input.item.json` so you can wire any upstream source (Set, Webhook, manual trigger).
- Returns `{ url }` so downstream nodes (HTTP Request, Set, Respond to Webhook) can consume it directly.
- Uses only the standard `URLSearchParams` and `URL` globals — no `npm` dependencies.

## Build Bot Install URL

Generates `https://discord.com/oauth2/authorize?...` for adding the bot to a guild. Defaults `scopes` to `['bot', 'applications.commands']` when omitted.

```javascript
const input = $input.item.json;
const applicationId = input.applicationId;
const permissions = input.permissions; // decimal string, e.g. "8"
const scopes = Array.isArray(input.scopes) && input.scopes.length > 0
  ? input.scopes
  : ['bot', 'applications.commands'];
const guildId = input.guildId;
const disableGuildSelect = input.disableGuildSelect;

const params = new URLSearchParams();
params.set('client_id', applicationId);
params.set('scope', scopes.join(' '));
if (permissions !== undefined && permissions !== null && permissions !== '') {
  params.set('permissions', BigInt(permissions).toString());
}
if (guildId) {
  params.set('guild_id', guildId);
}
if (disableGuildSelect !== undefined) {
  params.set('disable_guild_select', disableGuildSelect ? 'true' : 'false');
}

const url = new URL(`https://discord.com/oauth2/authorize?${params.toString()}`).toString();
return { url };
```

## Build Authorize URL

Generic OAuth2 authorize URL for user-facing flows (login, role connections, webhook install). Supports the `state`, `prompt`, `response_type`, and `integration_type` parameters.

```javascript
const input = $input.item.json;
const applicationId = input.applicationId;
const scopes = input.scopes; // string[]
const redirectUri = input.redirectUri;
const state = input.state;
const prompt = input.prompt; // 'consent' | 'none'
const responseType = input.responseType ?? 'code'; // 'code' | 'token'
const integrationType = input.integrationType; // '0' | '1' | undefined

const params = new URLSearchParams();
params.set('client_id', applicationId);
params.set('response_type', responseType);
params.set('redirect_uri', redirectUri);
params.set('scope', scopes.join(' '));
if (state) {
  params.set('state', state);
}
if (prompt) {
  params.set('prompt', prompt);
}
if (integrationType !== undefined && integrationType !== null && integrationType !== '') {
  params.set('integration_type', String(integrationType));
}

const url = new URL(`https://discord.com/oauth2/authorize?${params.toString()}`).toString();
return { url };
```

## Get Token Revocation URL

The token revocation endpoint is a fixed URL with no parameters. Either hard-code it in the HTTP Request node that performs the `POST`, or expose it via a one-line Code node:

```javascript
return { url: 'https://discord.com/api/v10/oauth2/token/revoke' };
```

Send the actual revocation as `POST` with `Content-Type: application/x-www-form-urlencoded` and a body containing `token`, `client_id`, and `client_secret` (plus optional `token_type_hint`).
