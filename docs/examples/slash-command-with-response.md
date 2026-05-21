# Define a Slash Command and Respond to It

Register a global slash command, then handle invocations by sending an immediate channel message reply.

## Prerequisites

- Discord Bot credential configured in n8n
- The bot was invited with the `applications.commands` OAuth2 scope (in addition to `bot`). If not, re-invite via
  `https://discord.com/api/oauth2/authorize?client_id=...&scope=bot%20applications.commands&permissions=...`
- Application ID and (for guild-scoped commands) guild ID

## Step 1 — Register the command (run once)

Single node: **Discord**

| Field | Value |
| --- | --- |
| Resource | `Application Command` |
| Operation | `Create` (Global) — or `Create Guild Command` for a single guild |
| Application ID | `123456789012345678` |
| Guild ID (guild op only) | `123456789012345678` |
| Name | `ping` |
| Description | `Replies with pong.` |
| Type | `1` (CHAT_INPUT) |

Run this workflow once. Global commands can take up to one hour to propagate; guild commands are visible immediately.

## Step 2 — Receive invocations

Use whichever trigger fits your deployment:

- **Discord Trigger** (gateway, bot stays online): Events = `INTERACTION_CREATE`
- HTTPS-only Interactions Endpoint URL: use n8n's built-in Webhook + Code verification path; see `http-interactions-setup.md`

Filter to your command, e.g. an IF node testing
`={{ $json.data?.name === 'ping' && $json.type === 2 }}`
(`type` 2 = `APPLICATION_COMMAND`).

## Step 3 — Respond

Single node: **Discord**

| Field | Value |
| --- | --- |
| Resource | `Interaction Response` |
| Operation | `Create Initial Callback` |
| Interaction ID | `={{ $json.id }}` |
| Interaction Token | `={{ $json.token }}` |
| Type | `4` (CHANNEL_MESSAGE_WITH_SOURCE) |
| Content | `pong` |

Optional flags inside **Additional Fields > Data**:

| Field | Value |
| --- | --- |
| Flags | `64` to make the reply ephemeral (visible only to the invoker) |
| TTS | `false` |

## Response deadline

You have **3 seconds** from receiving the interaction to call `Create Initial Callback`. If your handler needs longer (HTTP calls, AI generation, etc.), respond with **Type 5** (`DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE`) within those 3 seconds and then use `Interaction Response > Edit Original` to send the actual content within 15 minutes.

## What to expect

- After Step 1, typing `/` in any channel where the bot has access shows your `ping` command in the picker.
- After Step 3, invocations are answered with `pong` posted as the bot, attributed to the invoker ("user used /ping").
- Failing to respond in time yields "The application did not respond" to the user.

## Common pitfalls

- Command not appearing: `applications.commands` scope missing from the invite, or you registered globally and are within the propagation window
- `Unknown Interaction` (10062): you waited more than 3 seconds; switch to deferred response
- `Interaction has already been acknowledged` (40060): two branches both sent an initial callback — only one is allowed
