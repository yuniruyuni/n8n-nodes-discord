# Execute a Discord Webhook with Embed and File

Send a message through a channel webhook URL without needing a bot token. Includes a rich embed and a binary attachment.

## Prerequisites

- A Discord channel webhook URL: in Discord, **Channel Settings > Integrations > Webhooks > New Webhook > Copy Webhook URL**
  - Example shape: `https://discord.com/api/webhooks/123456789012345678/AbCdEfGhIjKlMnOpQrStUvWxYz`
- A previous node that produces binary data on the item (for example, **Read Binary File** or **HTTP Request** with response format `File`). Default binary property name is `data`.

No bot credential is required — webhook execution authenticates with the URL token itself.

## Workflow

`Read Binary File` -> `Discord` (Webhook)

### Node configuration: Discord

| Field | Value |
| --- | --- |
| Resource | `Webhook` |
| Operation | `Execute` |
| Webhook URL | `https://discord.com/api/webhooks/123456789012345678/AbCdEfGhIjKlMnOpQrStUvWxYz` |
| Content | `Nightly report attached.` |
| Username (override) | `n8n-reporter` |
| Avatar URL (override) | `https://example.com/avatar.png` |

### Embed (Additional Fields > Embeds > Add Embed)

| Field | Value |
| --- | --- |
| Title | `Nightly Report` |
| Description | `Generated automatically by n8n.` |
| Color | `5814783` |
| Footer Text | `pipeline run {{$execution.id}}` |
| Timestamp | `={{ $now.toISO() }}` |

### Attachment (Additional Fields > Attachments > Add Attachment)

| Field | Value |
| --- | --- |
| Binary Property | `data` |
| Filename (override) | `report.pdf` |
| Description | `Daily PDF summary` |

You can add multiple attachments by repeating the collection.

## Multipart handling

When at least one attachment entry is configured, the node automatically switches the outgoing HTTP request from `application/json` to `multipart/form-data` and serializes the JSON message body under the `payload_json` field. You do not need to configure this manually — supplying a binary property is enough.

## What to expect

- HTTP `204 No Content` from Discord (webhook execute returns no body by default). The node emits an item with the webhook execution metadata.
- If you set query parameter **Wait** = `true` in **Additional Fields**, Discord returns the created message object (`id`, `channel_id`, `attachments`, ...), which the node forwards as JSON.
- The file appears as a normal Discord attachment with the description you set as alt text.

## Common pitfalls

- `Unknown Webhook` (10015): the URL was rotated or deleted
- File too large: webhook uploads are subject to the channel's boost-tier file size limit (10/50/100 MiB)
- Empty `content` and no `embeds` and no `attachments` will be rejected — provide at least one
