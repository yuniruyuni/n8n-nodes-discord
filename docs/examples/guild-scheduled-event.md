# Create a Guild Scheduled Event

Schedule an external (non-voice-channel, link-based) event on a guild's Events list, with cover art.

## Prerequisites

- Discord Bot credential configured in n8n
- The bot has the `MANAGE_EVENTS` permission in the target guild
- Guild ID
- A cover image encoded as a base64 data URI. Supported types: JPEG, PNG, GIF. Recommended size: 800x320, under 10 MiB. Example shape:
  `data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...`

## Workflow

Single node: **Discord**

### Node configuration

| Field | Value |
| --- | --- |
| Credential | `Discord Bot API` |
| Resource | `Guild Scheduled Event` |
| Operation | `Create` |
| Guild ID | `123456789012345678` |
| Name | `n8n + Discord Community Call` |
| Description | `Monthly community walk-through and Q&A.` |
| Entity Type | `3` (EXTERNAL) |
| Privacy Level | `2` (GUILD_ONLY) — the only currently allowed value |
| Scheduled Start Time | `={{ $now.plus({ days: 7 }).set({ hour: 18, minute: 0, second: 0 }).toISO() }}` |
| Scheduled End Time | `={{ $now.plus({ days: 7 }).set({ hour: 19, minute: 0, second: 0 }).toISO() }}` |

For `EXTERNAL` events, both an end time and `entity_metadata.location` are **required** by Discord.

### Additional Fields

| Field | Value |
| --- | --- |
| Entity Metadata | `{ "location": "Online — https://meet.example.com/n8n" }` (JSON object) |
| Image | `data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...` |

If you would create a voice/stage-channel-bound event instead, set:

- Entity Type = `1` (STAGE_INSTANCE) or `2` (VOICE)
- Channel ID = `123456789012345678`
- Omit `entity_metadata` and `scheduled_end_time` (optional for those types)

## What to expect

- The node output is the created scheduled event object, including `id`, `creator_id`, `status` (1 = SCHEDULED), `entity_metadata.location`, and `image` hash.
- The event appears immediately under the guild's **Events** tab. Members can hit "Interested" and receive Discord notifications when it starts.
- To start it programmatically later: use `Guild Scheduled Event > Modify` with `status: 2` (ACTIVE); to end it: `status: 3` (COMPLETED).

## Common pitfalls

- `Missing Permissions` (50013): bot role lacks `Manage Events`
- `entity_metadata.location` missing for `EXTERNAL`: Discord returns `40000` / Invalid Form Body. Always set it for type 3.
- Image rejected: must be a true data URI (`data:image/<type>;base64,<payload>`), not a plain URL and not raw base64 without the prefix
- Start time in the past: Discord rejects events scheduled to begin earlier than "now"
