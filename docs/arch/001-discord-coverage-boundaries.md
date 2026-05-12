# ADR 001: Discord Coverage and Runtime Boundaries

## Status

Accepted (2026-05-11)

## Context

Discord's developer platform includes REST resources, Gateway events, webhooks, interactions, OAuth2, permissions, monetization, Activities, Social SDK, RPC, and voice/media transport. Not every surface maps cleanly to an n8n server-side node.

## Decision

The project will track full Discord platform coverage in `docs/discord-full-coverage-todo.md`. Every official Resource page and Gateway event must either be implemented or explicitly documented as out of scope for n8n runtime reasons.

The first implementation target is server-side automation:

- Bot REST API
- Gateway events
- Webhooks
- Interactions
- OAuth2 user flows
- Monetization resources

SDK-only or local-client surfaces such as Embedded App SDK, Social SDK, RPC, and full voice media transport are tracked, but may be documented as boundary areas unless they expose REST-compatible behavior.

## Consequences

- The TODO file is part of the product scope, not just planning notes.
- Unsupported areas must be visible and justified.
- REST and Gateway functionality can ship incrementally while preserving the full-coverage contract.
