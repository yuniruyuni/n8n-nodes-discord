# Workflow Examples

Focused, copy-pasteable walkthroughs for `@yuniruyuni/n8n-nodes-discord`. Each file lists prerequisites, node-by-node configuration, and what to expect at runtime.

## Index

| File | Summary |
| --- | --- |
| [send-message.md](./send-message.md) | Post a text (and optional rich embed) message to a channel using the Discord Bot credential. |
| [webhook-execute.md](./webhook-execute.md) | Fire a channel webhook URL with content, an embed, and a binary file attachment (auto multipart). |
| [gateway-trigger-message-create.md](./gateway-trigger-message-create.md) | Subscribe to `MESSAGE_CREATE` over the gateway and echo content (requires Message Content intent). |
| [slash-command-with-response.md](./slash-command-with-response.md) | Register a global slash command, receive `INTERACTION_CREATE`, and reply within the 3-second window. |
| [http-interactions-setup.md](./http-interactions-setup.md) | Receive interactions over HTTPS with n8n's built-in Webhook + Code verification path, then defer and follow up. |
| [guild-scheduled-event.md](./guild-scheduled-event.md) | Create an `EXTERNAL` guild scheduled event with location metadata and a base64 cover image. |
| [ban-and-audit-log.md](./ban-and-audit-log.md) | Ban a user with a reason and history purge, then read back the `MEMBER_BAN_ADD` (22) audit log entry. |
| [oauth2-url-builders.md](./oauth2-url-builders.md) | Build the Discord OAuth2 bot-install, authorize, and token revocation URLs with n8n's built-in Code node. |

## Conventions used in these examples

- Snowflake placeholder: `123456789012345678`
- Webhook URL token placeholder: `AbCdEfGhIjKlMnOpQrStUvWxYz`
- All expressions use n8n's `={{ ... }}` syntax
- Times are ISO 8601 (`2026-05-11T18:00:00.000Z`) — produced via `$now.toISO()` in examples
