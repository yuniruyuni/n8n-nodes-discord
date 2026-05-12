# Ban a User and Inspect the Audit Log

Ban a guild member with a reason and a short message-history purge, then read back the matching audit log entry.

## Prerequisites

- Discord Bot credential configured in n8n
- The bot has the `BAN_MEMBERS` and `VIEW_AUDIT_LOG` permissions in the target guild
- The bot's highest role is **above** the target user's highest role (Discord role hierarchy is enforced server-side)
- Guild ID and target user ID

## Workflow

`Discord` (Create Ban) -> `Discord` (Get Guild Audit Log)

### Step 1 — Create the ban

Node: **Discord**

| Field | Value |
| --- | --- |
| Credential | `Discord Bot API` |
| Resource | `Guild` |
| Operation | `Create Ban` |
| Guild ID | `123456789012345678` |
| User ID | `987654321098765432` |
| Delete Message Seconds | `3600` (purge last 1 hour of messages; max `604800` = 7 days) |
| Audit Log Reason | `Spam in #general, ticket #4421` |

Discord returns `204 No Content` on success. The node emits an item carrying the inputs plus a synthetic `success: true` so downstream nodes can chain.

### Step 2 — Read the audit log entry

Node: **Discord**

| Field | Value |
| --- | --- |
| Credential | `Discord Bot API` |
| Resource | `Audit Log` |
| Operation | `Get Guild Audit Log` |
| Guild ID | `123456789012345678` |

In **Additional Fields**:

| Field | Value |
| --- | --- |
| User ID (executor filter) | the bot's own user ID, e.g. `111111111111111111` |
| Action Type | `22` (MEMBER_BAN_ADD) |
| Limit | `1` |

The most recent entry will be the ban you just created.

To filter to entries _targeting_ the banned user instead of those _performed by_ the executor, omit `User ID` and post-filter on `={{ $json.audit_log_entries[0].target_id === '987654321098765432' }}`.

## What to expect

- Step 1: the user is banned and their session is invalidated. Any unread messages from the last hour are removed from view.
- Step 2 output (shape, truncated):

```
{
  "audit_log_entries": [
    {
      "id": "1191100000000000000",
      "action_type": 22,
      "user_id": "111111111111111111",
      "target_id": "987654321098765432",
      "reason": "Spam in #general, ticket #4421",
      "changes": [ { "key": "...", "new_value": "..." } ]
    }
  ],
  "users": [...],
  "webhooks": [],
  "integrations": []
}
```

The `reason` field round-trips exactly what you put in **Audit Log Reason** (it is sent via the `X-Audit-Log-Reason` HTTP header).

## Common pitfalls

- `Missing Permissions` (50013) on ban: bot is below the target in the role hierarchy, or lacks `Ban Members`
- `Unknown Ban` / empty audit log: there is replication lag of a few hundred ms after the ban; either add a Wait node (~1s) or use `Guild > Get Bans` to confirm before reading the log
- `delete_message_seconds` out of range: must be between `0` and `604800` (inclusive)
- `Audit Log Reason` truncated: Discord limits it to 512 characters
