# n8n-nodes-discord

This is an n8n community node package for Discord API integration. The project is being built for broad Discord Developer Platform coverage: REST API resources, Gateway events, webhooks, interactions, OAuth2, permissions, and monetization resources.

English | [日本語](README.ja.md)

## Current Development Status

This repository has just been scaffolded from `n8n-nodes-twitch` patterns and is in active development.

Implemented vertical slice:

- Discord Bot API credential
- Discord OAuth2 credential scaffold
- Discord Webhook credential scaffold
- Discord Interaction credential scaffold
- `Discord` node
  - User: get current bot user, get user
  - Message: send, get, delete
  - Webhook: execute, get
- `Discord Trigger` node
  - Gateway connection
  - Identify
  - Heartbeat and ACK monitoring
  - Session state persistence
  - Reconnect attempts
  - Initial event selector for core events

Full coverage plan:

- [docs/discord-full-coverage-todo.md](docs/discord-full-coverage-todo.md)

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
4. Enable required Gateway intents in the Developer Portal when using trigger events that need privileged intents.
5. Invite the bot to a server with the permissions needed for the operations you want to run.

## Architecture

The REST node follows n8n's declarative routing style where practical. Complex Discord payloads such as embeds, components, attachments, application commands, and interaction responses will use shared builders plus raw JSON fallbacks.

The trigger node uses Discord Gateway over WebSocket. It tracks heartbeat ACKs, session ID, sequence number, and reconnect state so future work can harden resume behavior and sharding.

## License

[MIT](LICENSE.md)
