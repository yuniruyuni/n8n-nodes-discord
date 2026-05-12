# Handoff Context

Generated: 2026-05-11

## Current Goal

Build `@yuniruyuni/n8n-nodes-discord` as a Discord equivalent of `@yuniruyuni/n8n-nodes-twitch`, but with an explicit full-coverage roadmap for Discord REST resources, Gateway events, webhooks, interactions, OAuth2, permissions, and monetization/platform surfaces.

The full checklist is maintained in:

- `docs/discord-full-coverage-todo.md`

## Repository Origin

This repository was created by copying `/home/yuniruyuni/src/github.com/yuniruyuni/n8n-nodes-twitch` to:

- `/home/yuniruyuni/src/github.com/yuniruyuni/n8n-nodes-discord`

Then Twitch-specific implementation files were removed and replaced with the Discord scaffold. A fresh `git init` was run in the Discord repository. The repository currently has no commits.

The source Twitch repository was restored to its prior state except for the planning file:

- `/home/yuniruyuni/src/github.com/yuniruyuni/n8n-nodes-twitch/docs/discord-full-coverage-todo.md`

## Current Implementation

Package metadata:

- Package name: `@yuniruyuni/n8n-nodes-discord`
- Version: `0.1.0`
- Node.js engine: `>=21.0.0`
- n8n node registrations:
  - `dist/nodes/Discord/Discord.node.js`
  - `dist/nodes/DiscordTrigger/DiscordTrigger.node.js`
- n8n credential registrations:
  - `dist/credentials/DiscordBotApi.credentials.js`
  - `dist/credentials/DiscordOAuth2Api.credentials.js`
  - `dist/credentials/DiscordWebhookApi.credentials.js`
  - `dist/credentials/DiscordInteractionApi.credentials.js`

Credentials implemented:

- `credentials/DiscordBotApi.credentials.ts`
  - Bot token.
  - Optional application ID.
  - Generic auth header: `Authorization: Bot <token>`.
  - Test request: `GET https://discord.com/api/v10/users/@me`.

- `credentials/DiscordOAuth2Api.credentials.ts`
  - Authorization Code Grant scaffold.
  - Discord auth/token URLs.
  - Practical default scopes.
  - Test request: `GET https://discord.com/api/v10/users/@me`.

- `credentials/DiscordWebhookApi.credentials.ts`
  - Webhook URL.
  - Test request: `GET <webhookUrl>`.

- `credentials/DiscordInteractionApi.credentials.ts`
  - Application ID.
  - Public key.
  - Placeholder test request: `GET https://discord.com/api/v10/gateway`.

REST node implemented:

- `nodes/Discord/Discord.node.ts`
- Shared constants:
  - `nodes/Discord/shared/constants.ts`
  - `DISCORD_API_BASE_URL = https://discord.com/api/v10`
  - `DISCORD_GATEWAY_VERSION = 10`
- Shared intents helper:
  - `nodes/Discord/shared/intents.ts`
- Shared helper additions:
  - `nodes/Discord/shared/snowflake.ts`
  - `nodes/Discord/shared/permissions.ts`
  - `nodes/Discord/shared/auditLog.ts`
  - `nodes/Discord/shared/pagination.ts`
  - `nodes/Discord/shared/messagePayload.ts`

Initial resources:

- `nodes/Discord/resources/User.ts`
  - Get current user: `GET /users/@me`
  - Get user: `GET /users/{user.id}`

- `nodes/Discord/resources/Message.ts`
  - Send message: `POST /channels/{channel.id}/messages`
  - Get message: `GET /channels/{channel.id}/messages/{message.id}`
  - Delete message: `DELETE /channels/{channel.id}/messages/{message.id}`

- `nodes/Discord/resources/Webhook.ts`
  - Execute webhook by full URL.
  - Get webhook: `GET /webhooks/{webhook.id}`

- `nodes/Discord/resources/Channel.ts`
  - Get channel.
  - Modify channel.
  - Delete channel.

- `nodes/Discord/resources/Guild.ts`
  - Get guild.
  - Modify guild.
  - Get guild channels.

- `nodes/Discord/resources/Role.ts`
  - Create role.
  - Get many roles.
  - Modify role.
  - Delete role.

- `nodes/Discord/resources/Member.ts`
  - Get member.
  - Modify member.
  - Remove member.

- `nodes/Discord/resources/Invite.ts`
  - Get invite.
  - Delete invite.

- `nodes/Discord/resources/ApplicationCommand.ts`
  - Global/guild list, create, get, update, delete, bulk overwrite.
  - Guild command permissions get/update with raw JSON payloads.
  - Note: permission update needs OAuth2/Bearer handling before it is fully production-ready.

- `nodes/Discord/resources/InteractionResponse.ts`
  - Initial callback.
  - Original response get/edit/delete.
  - Followup create.

Gateway trigger implemented:

- `nodes/DiscordTrigger/DiscordTrigger.node.ts`
- `nodes/DiscordTrigger/DiscordGatewayConnection.ts`
- `nodes/DiscordTrigger/GatewayWebSocket.ts`
- `nodes/DiscordTrigger/events/index.ts`

Current Gateway behavior:

- Fetches Gateway URL with `GET /gateway/bot`.
- Opens WebSocket with `?v=10&encoding=json`.
- Handles opcodes:
  - Dispatch
  - Heartbeat
  - Identify
  - Resume
  - Reconnect
  - Invalid Session
  - Hello
  - Heartbeat ACK
- Tracks sequence number.
- Tracks session ID and resume gateway URL.
- Persists session state in node workflow static data.
- Sends heartbeat using `n8n-workflow` `sleep`, not `setInterval`, to satisfy n8n Cloud lint rules.
- Emits selected event payloads.
- Supports raw Gateway payload output.
- Reconnects with exponential backoff up to 5 attempts.

Trigger event selector:

- Includes `*`, `READY`, `MESSAGE_CREATE`, `INTERACTION_CREATE`, and the official receive-event groups listed in the 2026-05-11 Gateway Events documentation.
- `nodes/Discord/shared/intents.ts` has expanded event-to-intent mapping for the current selector set.

## Verification

Commands run in `/home/yuniruyuni/src/github.com/yuniruyuni/n8n-nodes-discord`:

```bash
npm install
npm run build
npm run lint
```

Results:

- `npm install`: completed successfully.
- `npm run build`: successful.
- `npm run lint`: successful.

Latest verification after the 2026-05-11 parallel implementation pass:

- `npm run build`: successful.
- `npm run lint`: successful.

Notes:

- `npm install` reported 17 vulnerabilities from the dependency tree: 2 moderate, 14 high, 1 critical.
- These were not fixed yet. Do not run `npm audit fix --force` casually because it may introduce breaking changes.

## n8n Cloud Compatibility Notes

Lint initially failed because:

- Credentials without `test` properties are rejected.
- Trigger node needed `usableAsTool`.
- Gateway code used restricted globals/imports: `process`, `setInterval`, `clearInterval`, `os`, `timers`.

Fixes applied:

- Added credential tests.
- Added `usableAsTool: true` to `DiscordTrigger`.
- Replaced timer imports/global timer usage with an async heartbeat loop based on `sleep`.
- Replaced `process.platform` with static `os: 'linux'` in Identify properties.

Keep these constraints in mind when editing. The n8n node linter is strict about Cloud compatibility.

## Important Design Decisions

ADR files:

- `docs/arch/001-discord-coverage-boundaries.md`
- `docs/arch/002-discord-credentials.md`

Design constraints:

- Treat `docs/discord-full-coverage-todo.md` as product scope.
- Every Discord official Resource page should become either implemented code or a documented boundary/out-of-scope entry.
- Keep bot-token, OAuth2, webhook, and interaction credentials separate.
- Do not implement unsupported user-token/self-bot automation patterns.
- Prefer n8n declarative routing for REST endpoints.
- Use shared helpers for Discord-specific complexity: snowflakes, permissions, intents, embeds, components, attachments, pagination, rate limits.
- Keep raw JSON fallback for complex Discord payloads.

## Current Git State

The Discord repository was initialized with `git init`, but no files are committed yet.

Expected `git status --short` shape:

```text
?? .github/
?? .gitignore
?? .prettierrc.js
?? CHANGELOG.md
?? LICENSE.md
?? README.ja.md
?? README.md
?? credentials/
?? docs/
?? eslint.config.mjs
?? icons/
?? nodes/
?? package-lock.json
?? package.json
?? shared/
?? tsconfig.json
```

`dist/` and `node_modules/` are ignored.

## Next Recommended Work

Start Milestone 2: Core Bot Automation.

Recommended order:

1. Add `Channel` resource.
   - Get channel.
   - Modify channel.
   - Delete/close channel.
   - Get channel messages.
   - Create message can either stay in `Message` or be mirrored carefully.
   - Pins.
   - Reactions.
   - Invites.
   - Thread operations.
   - Permission overwrites.

2. Add `Guild` resource.
   - Get guild.
   - Modify guild.
   - Channels.
   - Members.
   - Roles.
   - Bans.
   - Invites.
   - Widget/welcome/onboarding basics.

3. Add `ApplicationCommand` resource.
   - Global command CRUD.
   - Guild command CRUD.
   - Bulk overwrite.
   - Command option builder plus raw JSON fallback.

4. Add shared helpers before resource sprawl gets too large.
   - `shared/snowflake.ts`
   - `shared/pagination.ts`
   - `shared/permissions.ts`
   - `shared/embeds.ts`
   - `shared/components.ts`
   - `shared/attachments.ts`
   - `shared/auditLogReason.ts`

5. Expand Gateway event coverage.
   - Move events into grouped files like the Twitch trigger does.
   - Add required-intents and privileged-intents metadata.
   - Add close-code mapping.
   - Harden resume behavior.

## Known Gaps

- Webhook execution currently asks for a full webhook URL as a node parameter, despite `DiscordWebhookApi` existing. Decide whether to:
  - keep webhook execution inside the Bot-auth `Discord` node,
  - split a dedicated `DiscordWebhook` node using `DiscordWebhookApi`,
  - or allow credential selection.

- `DiscordOAuth2Api` is registered but not used by operations yet.

- `DiscordInteractionApi` is registered but no HTTP interaction trigger/response node exists yet.

- Message send only supports `content`. It does not yet support embeds, components, attachments, stickers, polls, flags, nonce, reply, or allowed mentions.

- Gateway event coverage is only an initial subset.

- Gateway close-code mapping is not implemented.

- No unit tests exist yet.

- `shared/updateDisplayOptions.ts` was copied from the Twitch repository. It is currently harmless but not yet used by Discord code.

## Useful Commands

```bash
cd /home/yuniruyuni/src/github.com/yuniruyuni/n8n-nodes-discord
npm run build
npm run lint
rg "Twitch|twitch|n8n-nodes-twitch" -n . --glob '!node_modules/**' --glob '!dist/**'
git status --short
```

## Status Summary

Milestone 0 is complete.

Milestone 1 vertical slice is code-complete and passes build/lint, but not manually tested against a live Discord bot token yet.

Next step is to commit the scaffold, then begin Core Bot Automation starting with `Channel`, `Guild`, and `ApplicationCommand`.
