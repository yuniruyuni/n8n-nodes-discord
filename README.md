# n8n-nodes-discord

This is an n8n community node package for Discord API integration with broad Discord Developer Platform coverage: REST resources, Gateway events, webhook events, OAuth2, permissions, and monetization.

English | [日本語](README.ja.md)

## Resources

The `Discord` REST node exposes 26 resources, organized by capability:

**Messaging & content**
- `Message`, `Channel`, `Webhook`, `Sticker`, `Emoji`, `Soundboard`, `Poll`

**Server management**
- `Guild`, `Member`, `Role`, `Invite`, `AuditLog`, `Voice`

**Interactions & commands**
- `ApplicationCommand`, `InteractionResponse`

**Community & events**
- `GuildScheduledEvent`, `GuildTemplate`, `StageInstance`

**Monetization**
- `SKU`, `Subscription`, `Entitlement`

**Moderation**
- `AutoModeration`

**App platform**
- `Application`, `ApplicationRoleConnectionMetadata`, `Lobby`, `User`

`Message`, `Webhook`, and `InteractionResponse` ship guided builders for embeds, components (buttons, selects, text inputs, V2 layout), attachments (with multipart upload), and allowed mentions. `ApplicationCommand` covers slash command CRUD with localization, contexts, integration types, and the `default_member_permissions` selector. Mutating guild operations surface an audit log reason field.

## Triggers

- `Discord Trigger` — Gateway connection over WebSocket. Identify, heartbeat, resume, reconnect, session persistence. Event selector across the full Discord Gateway event catalog with privileged intent metadata. Carries a `Connection Name` used by `Discord Gateway Send`.
- `Discord Webhook Event Trigger` — receives Discord Application Webhook Events (`APPLICATION_AUTHORIZED`, `ENTITLEMENT_CREATE`, etc.) via HTTPS webhook with Ed25519 signature verification and event-type filtering.

## Action helpers

- `Discord Gateway Send` — sends Gateway commands (Update Presence, Update Voice State, Request Guild Members, Request Soundboard Sounds) through an active `Discord Trigger` connection. AI-agent friendly (`usableAsTool: true`).

## Credentials

- `Discord Bot API` — bot token with `Authorization: Bot <token>` header. Default credential type for server automation.
- `Discord OAuth2 API` — Authorization Code Grant for user-token flows. Selected per node via the `Authentication` selector.
- `Discord Webhook API` — incoming webhook URL.
- `Discord Interaction API` — application ID and Ed25519 public key, used by the Webhook Event Trigger.

## Coverage

See [`docs/coverage-matrix.md`](docs/coverage-matrix.md) for the resource-by-resource status against the official Discord docs index. The full implementation checklist lives in [`docs/discord-full-coverage-todo.md`](docs/discord-full-coverage-todo.md). Workflow examples live in [`docs/examples/`](docs/examples/).

## Development

```bash
npm install
npm run build
npm run lint
npm run dev
```

## Discord Setup

1. Create an application in the Discord Developer Portal.
2. Add a bot to the application.
3. Copy the bot token into the `Discord Bot API` credential.
4. Enable required Gateway intents in the Developer Portal when using trigger events that need privileged intents (`GUILD_MEMBERS`, `GUILD_PRESENCES`, `MESSAGE_CONTENT`).
5. Invite the bot to a server with the permissions needed for the operations you want to run.
6. For Webhook Events, set the Webhook Events URL on the application to the path produced by `Discord Webhook Event Trigger`, and copy the application's public key into the `Discord Interaction API` credential.

## Architecture

The REST node follows n8n's declarative routing style. Complex Discord payloads (embeds, components, attachments, allowed mentions, application commands, interaction responses) use shared builders alongside raw JSON fallbacks.

The Gateway trigger uses Discord Gateway over WebSocket. It tracks heartbeat ACKs, session ID, sequence number, and reconnect state with close-code awareness. Privileged intents and per-event required intents are surfaced via metadata in `nodes/DiscordTrigger/events/`. The Gateway Send action node pushes commands through the same WebSocket via an in-process bus identified by `Connection Name`.

The Webhook Event Trigger verifies Discord's Ed25519 signatures using Node's built-in `node:crypto` with no third-party dependency.

## License

[MIT](LICENSE.md)
