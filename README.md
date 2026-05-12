# n8n-nodes-discord

This is an n8n community node package for Discord API integration with broad Discord Developer Platform coverage: REST resources, Gateway events, HTTP interactions, webhooks, OAuth2, permissions, and monetization.

English | [日本語](README.ja.md)

## Resources

The `Discord` REST node exposes 26 resources:

Application, ApplicationCommand, ApplicationRoleConnectionMetadata, AuditLog, AutoModeration, Channel, Emoji, Entitlement, Guild, GuildScheduledEvent, GuildTemplate, InteractionResponse, Invite, Lobby, Member, Message, Poll, Role, SKU, Soundboard, StageInstance, Sticker, Subscription, User, Voice, Webhook.

Message, Webhook, and InteractionResponse support guided builders for embeds, attachments (with multipart upload), and allowed mentions, plus raw JSON for components. ApplicationCommand supports localization, contexts, integration types, and permission fields. Mutating guild operations support an audit log reason field.

## Triggers

- `Discord Trigger` — Gateway connection over WebSocket. Identify, heartbeat, resume, reconnect, session persistence. Event selector across the full Discord Gateway event catalog with privileged intent metadata. Carries a `Connection Name` used by `Discord Gateway Command`.
- `Discord HTTP Interaction Trigger` — receives Discord application interactions via HTTPS webhook with Ed25519 signature verification and automatic PING/PONG handling.
- `Discord Webhook Event Trigger` — receives Discord Application Webhook Events (APPLICATION_AUTHORIZED, ENTITLEMENT_CREATE, etc.) via HTTPS webhook with Ed25519 signature verification and event-type filtering.

## Action helpers

- `Discord Gateway Command` — sends Gateway commands (Update Presence, Update Voice State, Request Guild Members, Request Soundboard Sounds) through an active `Discord Trigger` connection.
- `Discord OAuth2` — pure-compute helper that builds bot install URLs, OAuth2 authorize URLs, and the token revocation URL.

## Credentials

- `Discord Bot API` — bot token with `Authorization: Bot <token>` header.
- `Discord OAuth2 API` — Authorization Code Grant for user-token flows.
- `Discord Webhook API` — incoming webhook URL.
- `Discord Interaction API` — application ID and Ed25519 public key for HTTP interactions.

## Coverage

See [`docs/coverage-matrix.md`](docs/coverage-matrix.md) for the resource-by-resource status against the official Discord docs index. The full implementation checklist lives in [`docs/discord-full-coverage-todo.md`](docs/discord-full-coverage-todo.md).

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
4. Enable required Gateway intents in the Developer Portal when using trigger events that need privileged intents (GUILD_MEMBERS, GUILD_PRESENCES, MESSAGE_CONTENT).
5. Invite the bot to a server with the permissions needed for the operations you want to run.
6. For HTTP interactions, set the Interactions Endpoint URL on the application to the URL produced by `Discord HTTP Interaction Trigger`, and copy the application's public key into the `Discord Interaction API` credential.

## Architecture

The REST node follows n8n's declarative routing style. Complex Discord payloads (embeds, components, attachments, allowed mentions, application commands, interaction responses) use shared builders alongside raw JSON fallbacks.

The Gateway trigger uses Discord Gateway over WebSocket. It tracks heartbeat ACKs, session ID, sequence number, and reconnect state. Privileged intents and per-event required intents are surfaced via metadata in `nodes/DiscordTrigger/events/`.

The HTTP interactions trigger verifies signatures using Node's built-in `node:crypto` (Ed25519) with no third-party dependency.

## License

[MIT](LICENSE.md)
