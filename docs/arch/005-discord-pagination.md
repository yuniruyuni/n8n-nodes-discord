# ADR 005: Discord Pagination Strategy

## Status

Accepted (2026-05-21)

## Context

Twitch has a consistent cursor model: response bodies include `pagination.cursor`, and list endpoints use `first` plus `after`. This repository intentionally borrows Twitch's user-facing goal of simpler pagination, but Discord does not expose one uniform pagination contract.

Discord list endpoints commonly use snowflake cursors:

- `before`
- `after`
- `around`
- `limit`

Some endpoints return arrays where the next cursor can be inferred from an item ID. Others use endpoint-specific semantics, timestamps, or objects where automatic pagination would be ambiguous.

## Decision

Classify Discord pagination per endpoint:

- **Manual cursor**: expose Discord's cursor fields directly. Use this when the endpoint supports multiple cursor directions (`before`, `after`, `around`) or when ordering semantics matter to the workflow author.
- **Auto-pageable**: add a future `returnAll`/`limit` UX only when the next cursor can be inferred reliably from returned Discord snowflake IDs and the endpoint ordering is stable.
- **Non-pageable / boundary**: do not invent pagination when Discord's endpoint does not expose enough information or when automatic fetching could change semantics.

`shared/pagination.ts` remains the place for reusable pagination fields. Automatic pagination helpers must be endpoint-specific enough to avoid implying that Discord behaves like Twitch.

## Consequences

- Message history remains manual-cursor because `around`, `before`, and `after` are all meaningful workflow choices.
- Resources such as entitlements, subscriptions, guild bans, scheduled-event users, and current-user guilds may be considered for auto-pageable helpers after each endpoint's ordering and cursor behavior is verified.
- New pagination UX should be documented with the resource operation that uses it, not treated as a global REST rule.
- Tests should cover cursor selection and limit trimming before adding automatic multi-page fetching.
