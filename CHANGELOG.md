# Changelog

## Unreleased

### Added

#### REST resources

- 16 new resources: Application, ApplicationRoleConnectionMetadata,
  AuditLog, AutoModeration, Emoji, Entitlement, GuildScheduledEvent,
  GuildTemplate, Lobby, Poll, SKU, Soundboard, StageInstance, Sticker,
  Subscription, Voice.
- Channel resource expanded with reactions, pins, thread operations,
  invites, channel permissions, group DM recipients, follow announcement,
  bulk delete, crosspost, typing indicator, archived thread listings
  (~31 new operations). Guided `allowFlags`/`denyFlags` for
  `editChannelPermissions` using shared permission constants.
- Guild resource expanded with create/delete, bans, prune, integrations,
  widget, vanity URL, welcome screen, onboarding, voice state, member
  search and list, channel positions, active threads (~28 new operations).
- Message resource: list, edit, bulk delete, crosspost; send/edit accept
  embeds, guided buttons / string select / mentionable select,
  attachments (binary + multipart fork), allowed_mentions, flags,
  message_reference, nonce, tts.
- User resource: modifyCurrent, getCurrentGuilds, getCurrentGuildMember,
  leaveGuild, createDm, createGroupDm, getCurrentConnections,
  application role connection get/update. OAuth2-only operations
  annotated in descriptions. Binary avatar / banner uploads via the
  data URI helper.
- Webhook resource: create, channel/guild lists, with-token variants,
  modify, delete; Slack/GitHub-compatible execute; message
  get/edit/delete; execute and editMessage accept guided payload
  builders with multipart fork.
- ApplicationCommand: localization (guided per-locale collection + raw
  JSON), contexts, integration types, default_member_permissions
  (guided multi-select + raw bitfield), dm_permission, nsfw, command
  type, and a guided `commandOptions` collection covering every
  Discord option type with min/max, choices, autocomplete,
  channel_types. Typed fields override raw payload on collision.
- InteractionResponse: editFollowupMessage, deleteFollowupMessage,
  getFollowupMessage; callback gains guided response-type selector
  covering channel message, defer, defer-update, update, autocomplete,
  modal, and launch activity, plus guided component fields for
  message responses and `modalTextInputs` for modals.
- AutoModeration: rule CRUD with per-trigger-type guided
  trigger_metadata (KEYWORD / KEYWORD_PRESET / MENTION_SPAM /
  MEMBER_PROFILE) and a guided actions collection; raw JSON kept as
  escape hatch.
- Emoji, Soundboard, GuildScheduledEvent, User (modifyCurrent), and
  Application (editCurrent) now accept a binary property name in
  addition to the data URI string field; the data URI is built at
  request time from the workflow item's binary input.

#### Trigger and action nodes

- `Discord HTTP Interaction Trigger` — Ed25519-verified HTTPS
  endpoint, auto PING/PONG, emits non-PING interaction payloads.
- `Discord Webhook Event Trigger` — Ed25519-verified HTTPS endpoint
  for Discord Application Webhook Events with an event-type filter.
  Reuses `DiscordInteractionApi`.
- `Discord Gateway Command` — sends Update Presence (op 3), Update
  Voice State (op 4), Request Guild Members (op 8), Request
  Soundboard Sounds (op 31) through an active `Discord Trigger`
  connection identified by `Connection Name`.
- `Discord OAuth2` — pure-compute helper exposing Bot install URL,
  OAuth2 authorize URL, and the token revocation URL as workflow
  operations.

#### Shared helpers

- `embeds.ts` — types, guided collection builder, transformer,
  validators with Discord limits.
- `components.ts` — v2 type union, button/select/text-input builders,
  action-row transformers, validators.
- `allowedMentions.ts` — guided builder with mutual-exclusion
  validation.
- `attachments.ts` — multipart body assembly via global FormData/Blob,
  payload_json metadata builder.
- `rateLimits.ts` — header constants, parsers, retry-after extraction.
- `oauth2.ts` — 33-scope option list, bot install URL builder,
  authorize URL builder, token revocation URL.
- `dataUri.ts` — buffer → data URI conversion plus an
  `IExecuteSingleFunctions`-aware helper that reads the workflow
  item's binary property and produces a data URI at request time.
- `closeCodes.ts` — Gateway close-code map for codes 4000-4014.
- 21 per-category Gateway event metadata files under
  `nodes/DiscordTrigger/events/` with required-intent and
  privileged-intent flags.

#### Tooling

- Node-built-in test runner via `tsx` loader (no other deps). 89 unit
  tests covering snowflake, pagination, permissions, embeds,
  components, allowedMentions, attachments, rateLimits, closeCodes.
- `docs/examples/` with seven workflow walkthroughs plus an index:
  send-message, webhook-execute, gateway-trigger-message-create,
  slash-command-with-response, http-interactions-setup,
  guild-scheduled-event, ban-and-audit-log.

### Notes

- All REST resource pages from the official Discord docs index are
  now represented at usable depth. Coverage detail lives in
  `docs/coverage-matrix.md`.
- Build / lint / 89 tests clean under `n8n-node build`,
  `n8n-node lint`, and `npm test`.
- `eslint.config.mjs` ignores `tests/`; this triggers an informational
  strict-mode notice from `n8n-node lint` but exit code stays 0.
- Voice gateway / UDP media transport, RPC, Embedded App SDK, Social
  SDK, Rich Presence are intentionally out of scope.

## 0.1.0

- Initial Discord package scaffold.
- Added Discord credentials.
- Added initial REST node vertical slice.
- Added initial Gateway trigger vertical slice.
- Added full coverage TODO.
