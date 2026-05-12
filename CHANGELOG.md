# Changelog

## Unreleased

### Added

- 16 new REST resources: Application, ApplicationRoleConnectionMetadata,
  AuditLog, AutoModeration, Emoji, Entitlement, GuildScheduledEvent,
  GuildTemplate, Lobby, Poll, SKU, Soundboard, StageInstance, Sticker,
  Subscription, Voice.
- Channel resource expanded with reactions, pins, thread operations,
  invites, channel permissions, group DM recipients, follow announcement,
  bulk delete, crosspost, typing indicator, archived thread listings
  (~31 new operations).
- Guild resource expanded with create/delete, bans, prune, integrations,
  widget, vanity URL, welcome screen, onboarding, voice state, member
  search and list, channel positions, active threads (~28 new operations).
- Message resource: list, edit, bulk delete, crosspost; send/edit now
  accept embeds (guided builder), components (raw JSON), attachments
  (binary input with multipart fork), allowed_mentions (guided), flags,
  message_reference, nonce, tts.
- User resource: modifyCurrent, getCurrentGuilds, getCurrentGuildMember,
  leaveGuild, createDm, createGroupDm, getCurrentConnections,
  application role connection get/update. OAuth2-only operations
  annotated in descriptions.
- Webhook resource: create, channel/guild webhook lists, with-token
  variants, modify, delete; Slack and GitHub compatibility execute;
  message get/edit/delete; execute and editMessage accept full payload
  builders with multipart fork.
- ApplicationCommand: localization fields, contexts, integration types,
  default_member_permissions, dm_permission, nsfw, command type.
  Typed fields override raw payload on collision.
- InteractionResponse: editFollowupMessage, deleteFollowupMessage,
  getFollowupMessage; callback gains guided response-type selector
  covering channel message, defer, defer-update, update, autocomplete,
  modal, and launch activity, with per-type fields.
- Shared helpers: embeds.ts (types, guided collection builder,
  transformer, validators with Discord limits), components.ts (v2 type
  union, button/select/text-input builders, action-row transformers,
  validators), allowedMentions.ts (guided builder with mutual-exclusion
  validation), attachments.ts (multipart body assembly via global
  FormData/Blob, payload_json metadata builder), rateLimits.ts (header
  constants, parsers, retry-after extraction).

### Notes

- All REST resource pages from the official Discord docs index are now
  represented (some at scaffold level pending payload polish).
- Builds and lints clean under `n8n-node build` and `n8n-node lint`.
- No tests yet; the helpers and routing are unit-test-ready for a
  future test pass.

## 0.1.0

- Initial Discord package scaffold.
- Added Discord credentials.
- Added initial REST node vertical slice.
- Added initial Gateway trigger vertical slice.
- Added full coverage TODO.
