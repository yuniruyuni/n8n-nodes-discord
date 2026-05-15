# ADR 003 — Field Naming Conventions

Status: Accepted (2026-05-15)

## Context

This package exposes 4 n8n nodes (`Discord`, `Discord Trigger`, `Discord Gateway Send`, `Discord Webhook Event Trigger`) sharing the same Discord domain vocabulary. Without a documented convention, parameter naming drifts: snowflake IDs may appear as `userId` in one resource and `user_id` or `User` in another; descriptions oscillate between Discord API documentation prose and end-user help; placeholders are inconsistent.

A sibling package, `n8n-nodes-twitch`, codified its own naming rules in its ADR-001. We considered porting that ADR verbatim — most notably the rule that strips the `ID` suffix from display names ("Broadcaster" instead of "Broadcaster ID"). We rejected that port: Twitch deals primarily with a single ID type (a user/broadcaster), while Discord's surface is dominated by snowflakes for many distinct resource types (guild, channel, user, role, message, application, sticker, entitlement, …) that must remain visually distinguishable in the n8n UI.

This ADR records Discord-specific naming rules.

## Decision

### 1. Display names retain the `ID` / `IDs` suffix

`displayName` is `Guild ID`, `Channel ID`, `User ID`, `Role IDs` etc. The suffix makes the parameter type unambiguous on a form filled with many ID fields, and lines up with how the Discord developer documentation labels these values.

This deliberately diverges from Twitch ADR-001.

### 2. Internal `name` is camelCase

`name: 'guildId'`, `name: 'channelId'`, `name: 'roleIds'`. Plural is `Ids` (lowercase `d`). Never use snake_case in `name` even though Discord's JSON wire format does.

When routing builds the request body, the camelCase parameter is mapped to its snake_case API field at the boundary (typically via `routing.send.property` or an inline body expression).

### 3. Descriptions are end-user help, not API documentation

Descriptions answer "what should the user type here?" and "what happens?". They are NOT a translation of the Discord docs.

Anti-pattern:

> `Channel ID. Discord snowflake ID of the channel.`

Preferred:

> `Snowflake ID of the channel to post into. Find by right-clicking the channel with Developer Mode enabled.`

Where a constraint or hidden behavior exists, mention it:

> `Snowflake ID of the guild. Bot must be a member with the relevant permission.`

> `Leave empty to disconnect the bot from voice.`

### 4. Placeholders demonstrate format

Every required or commonly-filled field uses a `placeholder` that is a syntactically valid example, never `''`:

| Field shape | Placeholder |
|---|---|
| Single snowflake | `e.g. 123456789012345678` |
| Comma-separated snowflakes | `e.g. 123456789012345678, 234567890123456789` |
| Invite code | `e.g. discordBan` |
| Template code | `e.g. 6L7Z67mu` |
| Webhook URL | `https://discord.com/api/webhooks/...` |
| Binary property name | `data` |
| Data URI | `data:image/png;base64,...` |
| ISO 8601 timestamp | `2026-12-31T23:59:59Z` |

### 5. Required vs optional

Mark `required: true` only on fields whose absence makes the operation impossible. Optional fields that have a sensible default (e.g., pagination `limit`) do not need `required`. Conditionally-required fields (e.g., `query` for `Request Guild Members` when `User IDs` is empty) are NOT marked `required` because the n8n editor cannot represent the conditional — instead the description explains the rule and the preSend hook validates.

### 6. Audit log reason field

Mutating guild operations that Discord supports `X-Audit-Log-Reason` on use the `createAuditLogReasonField()` helper from `shared/auditLog.ts`. It is placed last in the field list, after all operation-specific fields, so it consistently appears at the bottom of the form across resources.

### 7. Per-operation field gating

Use `displayOptions.show.operation = [...]` to scope each field to the operations that consume it. Avoid leaking fields across operations they don't apply to. When a single field name is used by multiple operations (`channelId` on both `send` and `delete` Message ops), gate accordingly rather than duplicating definitions.

### 8. Notice fields where context matters

Use `type: 'notice'` to surface invariants the user cannot infer from the form alone:

- Authentication selector consequences (Bot vs OAuth2 scope)
- Cross-node dependencies (Gateway Send needs an active Trigger)
- Discord-side prerequisites (Developer Portal configuration)

Notices are positioned where the user encounters the relevant decision (top of node, after the selector that triggers them, etc.).

### 9. Resource and Operation `name` values are stable

Internal `name` values on the `resource` and `operation` selectors must NEVER change once published. They are referenced by saved workflows on users' machines. New operations get new names; existing names stay even after display label revisions.

`displayName`, `description`, `placeholder`, and option ordering may change freely — they are presentation only.

## Consequences

- Forms feel consistent across the 26 Discord REST resources and the trigger/send nodes.
- AI agents using `usableAsTool` can rely on plain-language descriptions rather than Discord API jargon.
- Maintaining the convention takes ongoing discipline; new contributions touching field metadata must follow this ADR.
- Migrating older fields that don't conform happens opportunistically when a resource is edited for other reasons.

## References

- `docs/arch/001-discord-coverage-boundaries.md`
- `docs/arch/002-discord-credentials.md`
- `nodes/Discord/shared/validators.ts` (validation helpers complement these naming rules)
- `nodes/Discord/shared/auditLog.ts` (audit log reason field convention)
- `n8n-nodes-twitch/docs/arch/001-field-naming-conventions.md` (the ADR we intentionally diverge from)
