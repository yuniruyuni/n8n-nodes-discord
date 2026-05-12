# Discord Full Coverage TODO

Updated: 2026-05-11

Source of truth for platform scope: https://docs.discord.com/llms.txt as reviewed on 2026-05-11.

This document tracks implementation work for `@yuniruyuni/n8n-nodes-discord`. The detailed current/planned/boundary inventory lives in [coverage-matrix.md](./coverage-matrix.md).

## Coverage Contract

- [ ] Every official Discord `developers/resources/*` page is either implemented as an n8n resource or explicitly marked as boundary/out-of-scope.
- [ ] REST resources use Discord terminology, expose audit-log reasons where supported, and provide raw JSON fallbacks for complex payloads.
- [ ] Gateway receive events are selectable in `Discord Trigger` or documented as not useful in n8n.
- [ ] Gateway send events are implemented only where they have workflow value; protocol-only events remain internal.
- [ ] Interactions cover command CRUD, `INTERACTION_CREATE`, response callbacks, original response, followups, autocomplete, components, and modals.
- [ ] OAuth2, bot token, webhook URL/token, and interaction verification credentials remain separate.
- [ ] OAuth2 scopes, permission bitfields, intents, and rate limits are documented and surfaced in node UX.
- [ ] SDK-only/client-local surfaces are recorded as boundaries, not silently omitted.

## Official Docs Index Areas

Tracked directly:

- REST API reference and Resources: Application, Application Role Connection Metadata, Audit Log, Auto Moderation, Channel, Emoji, Entitlement, Guild, Guild Scheduled Event, Guild Template, Invite, Lobby, Message, Poll, SKU, Soundboard, Stage Instance, Sticker, Subscription, User, Voice, Webhook.
- Events: Gateway, Gateway Events, Webhook Events.
- Interactions: Application Commands, Interactions Overview, Receiving and Responding to Interactions.
- Components: Components Overview, Component Reference, Message Components, Modal Components.
- Topics: OAuth2, Permissions, Rate Limits, Opcodes and Status Codes, Threads, Voice Connections, Teams.
- Platform guides that map to APIs: Bots, Server and Channel Management, Webhooks, Interactions and Commands, Components and Modals, OAuth2 and Permissions, Premium Apps and Activities.

Boundary-tracked:

- Activities and Embedded App SDK.
- Discord Social SDK.
- RPC.
- Rich Presence except REST/SDK-overlap notes.
- Discovery, policy, design, marketing, and tutorial pages unless they expose API behavior needed by node UX.

## Current Implementation Snapshot

- [x] Credentials: bot token, OAuth2 authorization code, webhook URL, interaction application/public key.
- [x] REST node scaffold with user, message, webhook, channel, guild, role, member, invite, application command, and interaction response resources.
- [x] Current user: get bot/current user, get user by ID.
- [x] Message vertical slice: send, get, delete channel message.
- [x] Webhook vertical slice: execute by full URL, get webhook by ID.
- [x] Channel partial: get, modify, delete.
- [x] Guild partial: get, modify, get channels.
- [x] Role partial: create, get many, modify, delete.
- [x] Member partial: get, modify, remove.
- [x] Invite partial: get, delete.
- [x] Application Command partial: global/guild list, create, get, update, delete, bulk overwrite, guild command permissions get/update with raw JSON payloads.
- [x] Interaction Response partial: initial callback, original response get/edit/delete, followup create with raw JSON payloads.
- [x] Shared helpers: snowflake validation/parsing, permissions, audit-log reason helpers, pagination fields, raw message payload helpers.
- [x] Gateway trigger scaffold with connection, identify, heartbeat, resume, reconnect, static session state, and raw payload option.
- [x] Gateway event selector expanded across official receive-event groups from the 2026-05-11 Gateway Events docs, plus any event.
- [x] Gateway intents list and expanded event-to-intent mapping.

## Immediate Planning Tasks

- [x] Add [coverage-matrix.md](./coverage-matrix.md) from the 2026-05-11 official docs index.
- [ ] Add ADR for node/resource naming conventions.
- [ ] Add ADR for Discord rate limit strategy.
- [ ] Add ADR for Gateway session/resume strategy.
- [ ] Add ADR for guided UI builders vs raw JSON payloads.
- [ ] Decide whether webhook execution remains in `Discord` or gets a dedicated `DiscordWebhook` node using `DiscordWebhookApi`.
- [ ] Decide whether HTTP interaction receiving/verification needs a separate trigger node from Gateway-based `INTERACTION_CREATE`.

## Milestones

### Milestone 1: Vertical Slice

- [x] Bot credential.
- [x] `GET /users/@me`.
- [x] Send channel message.
- [x] Execute webhook.
- [x] Gateway connect and receive selected events.
- [x] Build/lint baseline from scaffold.

### Milestone 2: Core Bot Automation

- [x] Add first-pass Channel, Guild, Role, Member, and Invite operations.
- [ ] Expand Channel and Message operations, including pagination, reactions, pins, threads, embeds, components, attachments, polls, and allowed mentions.
- [ ] Expand Guild operations for bans, prune, integrations, widgets, onboarding, voice state, and audit-log reasons.
- [ ] Add Webhook management, not only execution.
- [ ] Add Audit Log resource.
- [x] Add shared helpers for snowflakes, pagination, audit-log reasons, allowed mentions/raw embeds, and permissions.
- [ ] Add shared helpers for multipart uploads, guided embeds, and guided components.

### Milestone 3: Interactions and Components

- [x] Add Application Command CRUD.
- [ ] Support command builders and raw JSON.
- [ ] Support Gateway `INTERACTION_CREATE` output shape for commands, components, modals, and autocomplete.
- [x] Add interaction callback/original-response/followup operations.
- [ ] Add guided builders for buttons, selects, text inputs, modals, and autocomplete responses.

### Milestone 4: Moderation and Community

- [ ] Auto Moderation.
- [ ] Guild Scheduled Event.
- [ ] Emoji.
- [ ] Sticker.
- [ ] Soundboard.
- [ ] Stage Instance.
- [ ] Thread UX polish through Channel or a dedicated Thread resource.

### Milestone 5: Monetization and App Platform

- [ ] SKU.
- [ ] Entitlement.
- [ ] Subscription.
- [ ] Application Role Connection Metadata.
- [ ] OAuth2 user-authorized operations and user-installable app contexts.
- [ ] Premium app examples for entitlement checks.

### Milestone 6: Gateway Coverage

- [ ] Expose every official Gateway receive event or mark it as boundary/not useful.
- [ ] Complete event-to-intent mapping and privileged-intent warnings.
- [ ] Add close-code/status-code mapping.
- [ ] Add useful non-protocol Gateway send events: Request Guild Members, Request Soundboard Sounds, Update Presence, and voice-state boundary decision.
- [ ] Add tests around opcode handling, resume, heartbeat ACK timeouts, reconnect, and event normalization.

### Milestone 7: Boundary Documentation

- [ ] Voice Connections: keep REST voice operations; document full voice gateway/media transport as out-of-scope unless a concrete n8n workflow use case appears.
- [ ] RPC: document local Discord client dependency as out-of-scope for server-side n8n.
- [ ] Activities/Embedded App SDK: implement only REST overlaps; document browser SDK runtime as out-of-scope.
- [ ] Social SDK: implement only REST-compatible overlap; document C++/Unity/Unreal SDK runtime as out-of-scope.
- [ ] Discovery, design, policy, and guide pages: keep as docs/reference links unless they change node behavior.

### Milestone 8: Release Readiness

- [ ] README and README.ja describe supported resources, credentials, Gateway intents, OAuth2 setup, and boundaries.
- [ ] Example workflows for send message, webhook execute, slash command CRUD, interaction response, and Gateway trigger.
- [ ] Snapshot tests for node descriptions.
- [ ] Mock REST route tests for representative resources.
- [ ] Manual integration tests against a Discord test application.
- [ ] `npm run build` and `npm run lint` pass before release.

## Definition of Done for Full Coverage

- [ ] [coverage-matrix.md](./coverage-matrix.md) has no undocumented official index entries.
- [ ] Every implemented resource has endpoint-level operation tracking in code comments, tests, or resource docs.
- [ ] Every planned resource has an owner milestone.
- [ ] Every boundary/out-of-scope area has a short rationale.
- [ ] Bot, OAuth2, webhook, and interaction credentials are never conflated.
- [ ] Rate-limit and permission behavior is visible to workflow authors.
