# Receive Interactions Over HTTPS

The package no longer ships a dedicated `Discord HTTP Interaction Trigger`. For most workflows, receive slash commands and component interactions with **Discord Trigger** over the Gateway by selecting `INTERACTION_CREATE`.

If you specifically need Discord's HTTPS **Interactions Endpoint URL** without a bot Gateway connection, use n8n's built-in **Webhook** trigger plus a **Code** node that verifies Discord's Ed25519 signature.

## Recommended: Gateway Interaction Flow

Use this when a bot token is acceptable.

`Discord Trigger (INTERACTION_CREATE)` -> `Discord` (Interaction Response, deferred) -> work nodes -> `Discord` (Interaction Response, followup or edit original)

### Discord Trigger

| Field | Value |
| --- | --- |
| Event | `INTERACTION_CREATE` |
| Auto Calculate Intents | `true` |

The trigger emits the interaction payload. Filter to your command or component with an IF node, for example:

```text
={{ $json.data?.name === 'ping' && $json.type === 2 }}
```

## HTTPS-Only Boundary Flow

Use this when you cannot keep a Gateway connection open. This uses built-in n8n nodes, not a package-provided trigger.

`Webhook` -> `Code` (verify Ed25519 signature) -> `Discord` (Interaction Response, deferred) -> work nodes -> `Discord` (Interaction Response, followup)

### Prerequisites

- A Discord application public key from **Developer Portal > General Information**
- A production n8n webhook URL reachable over HTTPS
- Commands registered via the `Application Command` resource

### Webhook Trigger

| Field | Value |
| --- | --- |
| HTTP Method | `POST` |
| Response Mode | `Using Respond to Webhook Node` or equivalent immediate response handling |
| Path | `discord-interactions` |

Configure the production webhook URL as the application's **Interactions Endpoint URL**.

### Signature Verification

Discord sends these headers:

- `X-Signature-Ed25519`
- `X-Signature-Timestamp`

Verify `timestamp + rawBody` against the application's public key before trusting the payload. The implementation in `nodes/DiscordWebhookEventTrigger/DiscordWebhookEventTrigger.node.ts` shows the same Ed25519 SPKI wrapping and verification logic used for Discord Application Webhook Events.

### PING Handling

When saving the endpoint URL, Discord sends a PING interaction. Reply immediately:

```json
{ "type": 1 }
```

For normal interactions, either respond within 3 seconds with `Interaction Response > Create Initial Callback`, or defer first with type `5` and send the real result later.

## Deferred Response + Followup

### Node 1: Discord (Interaction Response)

| Field | Value |
| --- | --- |
| Resource | `Interaction Response` |
| Operation | `Create Initial Callback` |
| Interaction ID | `={{ $json.id }}` |
| Interaction Token | `={{ $json.token }}` |
| Type | `5` (`DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE`) |

### Node 2: Discord (Interaction Response)

| Field | Value |
| --- | --- |
| Resource | `Interaction Response` |
| Operation | `Create Followup Message` |
| Application ID | `123456789012345678` |
| Interaction Token | `={{ $json.token }}` |
| Content | `Done! Result: {{ $json.result }}` |

Followups can be sent for up to 15 minutes after the original interaction.
