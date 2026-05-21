# ADR 004: Operation and Payload Boundaries

## Status

Accepted (2026-05-21)

## Context

Discord resources expose many operations with similar shapes, but plain file splitting does not improve the model by itself. The meaningful boundary is between n8n's editor parameter shape and Discord's wire payload shape.

The package also has repeated mutation behavior: several Discord endpoints return empty success responses, many message-like endpoints share content/embeds/components/attachments/allowed_mentions handling, and Gateway send operations share an opcode plus payload contract.

## Decision

Model reusable behavior around operation contracts:

- Message-like payloads are built through `shared/messageLikePayload.ts`.
- Empty mutation success output is shared through `shared/routing.ts`.
- Gateway Send payloads are built through `DiscordGatewayCommand/payloads.ts`.
- Operation-scoped UI fields are grouped first, then gated through `shared/displayOptions.ts`.
- Gateway receive-event filters live in an event policy registry instead of the connection loop.

Resource files should remain responsible for exposing n8n properties and endpoint routing. They should avoid reimplementing parameter-to-wire conversion when a shared payload boundary exists.

## Consequences

- `Message`, `Webhook`, and future interaction/message-style operations can share component, embed, attachment, and v2 flag behavior.
- Gateway command validation can be tested independently from the n8n node class.
- Large resources can move toward Twitch-style operation field groups without changing saved workflow parameter names.
- Event-specific Gateway behavior can grow without adding conditionals to `DiscordGatewayConnection`.
- Future refactors should add shared operation concepts only when they represent Discord/n8n boundary behavior, not just because a file is large.
