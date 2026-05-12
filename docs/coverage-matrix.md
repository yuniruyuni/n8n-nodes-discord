# Discord Coverage Matrix

Updated: 2026-05-11

Official index: https://docs.discord.com/llms.txt reviewed on 2026-05-11.

Status legend:

- `Current`: implemented or scaffolded in this repository.
- `Planned`: should be implemented for full Discord API coverage.
- `Boundary`: tracked, but only REST-compatible/server-side n8n pieces should be implemented.
- `Out of scope`: not planned for this n8n node because it depends on client SDKs, local Discord clients, media transport, policy content, or marketing/design guidance.

## REST Resources

| Official docs page | Status | Current implementation | Planned next coverage | Boundary notes |
| --- | --- | --- | --- | --- |
| Application Resource | Planned | None | Current application, edit current application, activity instance, app-level command helpers | Keep app management separate from OAuth2 setup docs. |
| Application Role Connection Metadata | Planned | None | Get/update metadata records, metadata types, localization | Needed for linked roles and user-authorized flows. |
| Audit Logs Resource | Planned | None | Get guild audit log, filters, pagination | Bot permission and audit-log reason docs required. |
| Auto Moderation | Planned | None | Rule CRUD, trigger metadata, actions, exemptions | Requires strong guided builders plus raw JSON. |
| Channels Resource | Current partial | Get, modify, delete channel; message operations call channel message endpoints | Reactions, pins, invites, permissions, threads, typing, forum/media threads, richer channel-specific fields | May keep message UX as separate first-class resource. |
| Emoji Resource | Planned | None | Guild and application emoji CRUD, image upload, roles, audit reasons | Binary image helper required. |
| Entitlement Resource | Planned | None | List/get/consume entitlements, test entitlement CRUD, filters, pagination | Monetization milestone. |
| Guild Resource | Current partial | Get guild, modify guild, list guild channels; Gateway can receive guild events | Create/delete where supported, bans, prune, integrations, widgets, onboarding, voice state, fuller member/role coverage | Many operations need audit-log reason. |
| Guild Scheduled Event | Planned | None | Scheduled event CRUD, users, recurrence, images | Community milestone. |
| Guild Template Resource | Planned | None | Template get/create/sync/modify/delete, create guild from template | Audit-log reason where supported. |
| Invite Resource | Current partial | Get invite, delete invite | Counts, expiration, scheduled event parameter, channel/guild invite endpoints | Also appears through channel/guild invite endpoints. |
| Lobby Resource | Boundary | None | Confirm REST endpoints and implement only server-side useful operations | Activity/Social SDK coupling may limit n8n usefulness. |
| Message Resource | Current partial | Send, get, delete channel message | List/edit/bulk delete/crosspost, reactions, pins, polls, embeds, components, attachments, allowed mentions | Underlying official endpoints are mostly Channel Resource endpoints. |
| Poll Resource | Planned | None | Get answer voters, end poll, create poll payload support through message send | Poll creation belongs in message payload builder. |
| SKU Resource | Planned | None | List SKUs and any official get operation, SKU types | Monetization milestone. |
| Soundboard Resource | Planned | None | Send/list/get/create/modify/delete sounds, audio upload, emoji fields | Gateway has soundboard update/request surfaces too. |
| Stage Instance Resource | Planned | None | Create/get/modify/delete stage instances | Community audio event management only; not voice media. |
| Sticker Resource | Planned | None | Get/list/create/modify/delete stickers, Nitro packs, uploads, tags | Binary file helper required. |
| Subscription Resource | Planned | None | List/get SKU subscriptions, filters, pagination, status fields | Monetization milestone. |
| User Resource | Current partial | Get current bot/current user, get user by ID | Modify current user, current user guilds/member, leave guild, create DM/group DM, connections, app role connection | OAuth2-only operations must be hidden from bot-only auth. |
| Voice Resource | Boundary | None | List voice regions and REST voice-state operations via Guild/Voice resources | Full voice gateway, UDP, and media transport are out of scope unless separately justified. |
| Webhook Resource | Current partial | Execute webhook by full URL; get webhook by ID | Create/list/get with token/modify/delete, message get/edit/delete, Slack/GitHub-compatible execute, thread/wait support, attachments | Decide dedicated webhook node vs Discord resource. |

## Gateway and Events

| Area | Status | Current implementation | Planned next coverage | Boundary notes |
| --- | --- | --- | --- | --- |
| Gateway connection | Current partial | Fetch gateway URL, connect, identify, heartbeat, resume, reconnect, close, static session state | Close-code mapping, shard options, presence options, stronger tests | Protocol mechanics stay internal unless useful as workflow controls. |
| Gateway send events | Current partial | Identify, Resume, Heartbeat are internal | Request Guild Members, Request Soundboard Sounds, Update Presence, Update Voice State decision | Voice state update may be REST/use-case limited; full voice media is boundary. |
| Core session events | Current partial | `READY`, `RATE_LIMITED`, raw payload option, and any-event option | `RESUMED`, `RECONNECT`, `INVALID_SESSION` normalization or diagnostics | `HELLO` remains internal protocol handling. |
| Application command events | Current partial | `APPLICATION_COMMAND_PERMISSIONS_UPDATE` selectable | Payload normalization | Requires command resource and permissions UX. |
| Auto moderation events | Current partial | Rule create/update/delete and action execution selectable | Payload normalization | Needs Auto Moderation resource parity. |
| Channel/thread events | Current partial | Channel, pins, thread, and thread member/list sync events selectable | Payload normalization and tests | Requires complete intent mapping. |
| Entitlement events | Current partial | Create/update/delete selectable | Payload normalization | Monetization milestone. |
| Guild/member/role events | Current partial | Guild, audit log, ban, emoji/sticker/integration, member, role, scheduled event, and soundboard events selectable | Payload normalization and privileged intent warnings | Privileged member intent warnings required. |
| Guild scheduled event events | Current partial | Create/update/delete/user add/user remove selectable | Payload normalization | Community milestone. |
| Integration/invite/message/reaction/poll events | Current partial | Integration, invite, message, reaction, and poll vote events selectable | Payload normalization | Message content privileged intent warning required. |
| Interaction events | Current partial | `INTERACTION_CREATE` selectable | Normalize command/component/modal/autocomplete payloads and connect to response operations | HTTP interaction trigger remains a separate architecture decision. |
| Presence/typing/user/voice/stage/soundboard/subscription events | Current partial | Selectors and initial intent mapping added | Payload normalization and boundary docs | Presence and voice require explicit boundary and intent warnings. |
| Webhook Events over HTTP | Planned | None | Review event registration, verification, trigger shape, duplicate handling | Could become separate trigger from Gateway. |

## Interactions and Components

| Area | Status | Current implementation | Planned next coverage | Boundary notes |
| --- | --- | --- | --- | --- |
| Application Commands | Current partial | Global/guild list, create, get, update, delete, bulk overwrite, guild command permissions get/update using raw JSON | Guided slash/user/message builders, localization, contexts, integration types, OAuth2/Bearer handling for permission updates | Uses Application Command docs, not a Resource page in `llms.txt`. |
| Receiving Interactions | Current partial | Gateway selector can receive `INTERACTION_CREATE` payloads | Normalize interaction types and metadata; add HTTP endpoint decision | HTTP verification needs `DiscordInteractionApi`. |
| Responding to Interactions | Current partial | Initial callback, original response get/edit/delete, followup create using raw JSON | Guided response types, defer/defer update, autocomplete, modal, followup edit/delete/get | Interaction token should come from trigger data or explicit input. |
| Components | Planned | None | Buttons, string/user/role/mentionable/channel selects, action rows, component reference fields | Include raw JSON fallback. |
| Modals | Planned | None | Modal response builder and text input components | Modal components share component helper. |

## Auth, Permissions, Rate Limits, and Topics

| Area | Status | Current implementation | Planned next coverage | Boundary notes |
| --- | --- | --- | --- | --- |
| OAuth2 | Current partial | OAuth2 credential with authorization/token URLs, scopes, refresh support, `GET /users/@me` test | OAuth2 credential selection in operations, user-installable app scopes, install URL helper, client credentials where useful | User-token/self-bot automation remains unsupported. |
| Permissions | Current partial | Permission constants, options, aggregation, and checks | Channel overwrites, command default member permissions, richer UI integration | Keep values aligned with official Permissions topic. |
| Rate Limits | Planned | n8n request behavior only | Document per-route/global headers, 429 output, retry-after handling, invalid request risk, retry option decision | Avoid custom throttling unless n8n behavior is insufficient. |
| Opcodes and Status Codes | Current partial | Opcode handling exists in Gateway implementation | Add public close-code/status-code mapping for diagnostics | Mostly internal protocol support. |
| Threads | Planned | Covered only through planned Channel work | Thread create/join/member/archive/list endpoints and UX | Dedicated Thread resource only if clearer than Channel. |
| Voice Connections | Boundary | None | Voice region/state REST coverage | Full voice gateway and media transport out of scope for server-side n8n. |
| Teams | Out of scope | None | Link docs from README if needed | Developer Portal/team management is not an automation API surface here. |

## Platform, SDK, and Guide Pages

| Official docs area | Status | Current implementation | Planned next coverage | Boundary notes |
| --- | --- | --- | --- | --- |
| Bots and companion apps | Planned | Bot credential and basic REST/Gateway slice | Use guide content for setup docs and examples | Guide page, not separate API resource. |
| Server and Channel Management | Planned | Basic message/channel event slice | Covered through Guild, Channel, User, Invite, Audit Log resources | Guide page maps to REST resources. |
| Webhooks platform page | Current partial | Webhook execute/get partial | Webhook management and examples | Guide page maps to Webhook Resource. |
| OAuth2 and Permissions platform page | Current partial | Separate OAuth2 credential exists | Setup docs, scope selector, permission integer builder | Guide page maps to topics. |
| Premium Apps and Activities / Monetization | Planned | None | SKU, Entitlement, Subscription, examples | Product docs map to monetization resources. |
| Activities / Embedded App SDK | Boundary | None | Implement only REST overlaps: Application, SKU, Entitlement, Lobby, OAuth2 | Browser Embedded App SDK runtime out of scope. |
| Discord Social SDK | Boundary | None | Implement only REST-compatible account linking/social overlap if exposed | C++/Unity/Unreal SDK runtime out of scope. |
| RPC | Out of scope | None | Document local-client dependency | Local Discord client RPC is not suitable for n8n server runtime. |
| Rich Presence | Boundary | None | Document SDK/API overlap if it becomes relevant | Rich Presence is mainly SDK/client activity state. |
| Discovery, policies, design guidelines, tutorials, quick starts, community resources | Out of scope | None | Reference from README only when helpful | Not node operations unless they change API behavior. |
