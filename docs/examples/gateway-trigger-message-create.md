# React to MESSAGE_CREATE Events (Gateway Trigger)

Echo every new message in any channel the bot can see, using the Discord gateway WebSocket.

## Prerequisites

- Discord Bot credential configured in n8n
- **Privileged intent**: `MESSAGE CONTENT INTENT` must be enabled for your application at
  **Discord Developer Portal > Your App > Bot > Privileged Gateway Intents > Message Content Intent**.
  Without it, `content`, `embeds`, `attachments`, and `components` on incoming messages are empty strings/arrays.
- The bot must be invited to the guild with `View Channel` and `Read Message History` permissions for any channel you want to observe.
- For DM observation no extra setup is needed; for guild messages the `GUILD_MESSAGES` intent is also required (auto-calculated, see below).

## Workflow

`Discord Trigger` -> `Discord` (Send Message)

### Node configuration: Discord Trigger

| Field | Value |
| --- | --- |
| Credential | `Discord Bot API` |
| Events | `MESSAGE_CREATE` |
| Ignore Bots | `true` (recommended, prevents echo loops) |

The trigger automatically derives the required gateway intents from the selected events. Selecting `MESSAGE_CREATE` enables `GUILDS`, `GUILD_MESSAGES`, `DIRECT_MESSAGES`, and (because Message Content is needed for usable payloads) `MESSAGE_CONTENT`. You do not need to compute the bitmask by hand.

### Node configuration: Discord (echo)

| Field | Value |
| --- | --- |
| Credential | `Discord Bot API` |
| Resource | `Message` |
| Operation | `Send` |
| Channel ID | `={{ $json.channel_id }}` |
| Content | `Echo: {{ $json.content }}` |

To reply as a thread reference instead of a plain message, open **Additional Fields > Message Reference** and set:

| Field | Value |
| --- | --- |
| Message ID | `={{ $json.id }}` |
| Fail If Not Exists | `false` |

## What to expect

- The trigger node stays connected over a single WebSocket session and emits one item per inbound `MESSAGE_CREATE` payload.
- Each item's `$json` matches Discord's [Message Object](https://discord.com/developers/docs/resources/channel#message-object): `id`, `channel_id`, `guild_id`, `author`, `content`, `timestamp`, `attachments`, `embeds`, ...
- The echo node posts a reply in the same channel. With `Ignore Bots = true`, the bot's own echo will not re-trigger the workflow.

## Common pitfalls

- Empty `content` on every event: the **Message Content** privileged intent is not enabled
- `Disallowed intents` error on connect: a privileged intent is enabled in the node but not enabled in the Developer Portal
- Workflow self-loops: enable **Ignore Bots**, or guard with `={{ $json.author.bot ? null : $json.id }}` and a downstream IF node
