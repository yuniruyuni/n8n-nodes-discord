# ADR 002: Bot, OAuth2, Webhook, and Interaction Credentials

## Status

Accepted (2026-05-11)

## Context

Discord supports several authentication models. Bot tokens, OAuth2 user access tokens, webhook URLs, and interaction verification keys have different security properties and are useful for different workflow types.

## Decision

The package defines separate credentials:

- `DiscordBotApi` for bot-token REST and Gateway access.
- `DiscordOAuth2Api` for user-authorized OAuth2 operations.
- `DiscordWebhookApi` for webhook execution workflows.
- `DiscordInteractionApi` for HTTP interaction verification metadata.

Bot-token automation must not be mixed with unsupported user-token automation. OAuth2 is limited to official OAuth2 flows and scopes.

## Consequences

- Node operations can clearly state which credential type they require.
- Webhook and interaction workflows can be hardened independently.
- The UI can avoid suggesting unsafe Discord automation patterns.
