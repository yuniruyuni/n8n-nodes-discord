# Send a Discord Message

Post a plain text (and optionally rich-embed) message to a channel with the Discord node.

## Prerequisites

- Discord Bot credential configured in n8n (`Discord Bot API` credential with bot token)
- The bot must be a member of the target guild and have `View Channel` and `Send Messages` permissions
- Target channel ID (right-click channel in Discord with Developer Mode on, "Copy Channel ID")

## Workflow

Single node: **Discord**

### Node configuration

| Field | Value |
| --- | --- |
| Credential | `Discord Bot API` |
| Resource | `Message` |
| Operation | `Send` |
| Channel ID | `123456789012345678` |
| Content | `Hello from n8n!` |

That is the minimum required to send a text message.

### Optional: add an embed

Open **Additional Fields > Embeds** and click **Add Embed**:

| Field | Value |
| --- | --- |
| Title | `Build #42 succeeded` |
| Description | `All checks passed on branch \`main\`.` |
| Color | `3066993` (hex `0x2ECC71`, green; decimal integer) |
| URL | `https://example.com/builds/42` |
| Timestamp | `={{ $now.toISO() }}` |

Inside the embed open **Fields** and add entries:

| Name | Value | Inline |
| --- | --- | --- |
| Duration | `2m 13s` | true |
| Commit | `a1b2c3d` | true |
| Triggered by | `release-bot` | false |

You may also set **Author**, **Footer**, **Thumbnail URL**, and **Image URL** in the same embed.

## What to expect

When the workflow runs, the bot posts the message to the channel. The node output contains the created message object from Discord, including `id`, `channel_id`, `author`, `timestamp`, and the `embeds` array if you added any. You can reference `={{ $json.id }}` downstream to react, edit, or reply.

## Common pitfalls

- `Missing Access` (50001): the bot is not in the guild or cannot see the channel
- `Missing Permissions` (50013): the bot role lacks `Send Messages` or `Embed Links`
- `Invalid Form Body` on the embed: color must be an integer, not a `#RRGGBB` string
