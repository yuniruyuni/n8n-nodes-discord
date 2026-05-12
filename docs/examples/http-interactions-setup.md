# Wire the HTTP Interactions Trigger

Receive Discord interactions (slash commands, buttons, modals, ...) over HTTPS instead of the gateway WebSocket. This is the recommended mode for stateless or serverless deployments.

## Prerequisites

- A Discord application (Developer Portal): note the **Application ID** and **Public Key** under
  **General Information**
- A Discord Bot credential in n8n that includes the application's public key (used for Ed25519 signature verification)
- Your n8n instance is reachable over HTTPS from the public internet (Discord will not accept HTTP or self-signed certs without a trusted CA)
- Commands registered via the `Application Command` resource (see `slash-command-with-response.md`)

No gateway intents are required for HTTP interactions.

## Workflow

`Discord HTTP Interaction Trigger` -> `Discord` (Interaction Response, deferred) -> ... work ... -> `Discord` (Interaction Response, follow up)

### Node configuration: Discord HTTP Interaction Trigger

| Field | Value |
| --- | --- |
| Credential | `Discord Bot API` (must include Public Key) |
| Path | leave as auto-generated, or set e.g. `discord-interactions` |

Activate the workflow. n8n exposes a **Production Webhook URL** for the node, for example:

```
https://n8n.example.com/webhook/discord-interactions
```

### Configure the Interactions Endpoint URL

In the Developer Portal, open your application > **General Information** > **Interactions Endpoint URL** and paste the production webhook URL above. Click **Save Changes**.

Discord immediately sends a **PING** (`type: 1`) request signed with your application's private key. The trigger node:

1. Verifies the `X-Signature-Ed25519` header against your stored Public Key
2. Replies with `{ "type": 1 }` (PONG)

If verification passes, the Developer Portal shows "All your endpoints are valid." The trigger does this automatically — you do not need a branch in the workflow for PING.

## Downstream: deferred response + follow up

Because HTTP interactions also have the 3-second deadline, defer immediately:

### Node 1: Discord (Interaction Response)

| Field | Value |
| --- | --- |
| Resource | `Interaction Response` |
| Operation | `Create Initial Callback` |
| Interaction ID | `={{ $json.id }}` |
| Interaction Token | `={{ $json.token }}` |
| Type | `5` (DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE) |

Discord shows "Bot is thinking..." to the user.

### ... your real work nodes here (HTTP calls, AI, database, etc.) ...

### Node 2: Discord (Interaction Response, follow up)

| Field | Value |
| --- | --- |
| Resource | `Interaction Response` |
| Operation | `Create Followup Message` |
| Application ID | `123456789012345678` |
| Interaction Token | `={{ $('Discord HTTP Interaction Trigger').item.json.token }}` |
| Content | `Done! Result: {{ $json.result }}` |

Followups can be sent for up to **15 minutes** after the original interaction.

## What to expect

- Saving the Interactions Endpoint URL: a single PING then "valid" confirmation
- User invokes the command: trigger fires with the interaction payload, immediate "thinking" indicator appears, real reply lands when the followup posts
- The trigger node itself returns a `200` with the PONG/deferred ACK; n8n's normal item flow continues from its output

## Common pitfalls

- "Interactions endpoint URL could not be verified": Public Key mismatch in the credential, workflow not activated, or URL not publicly reachable
- "The application did not respond": you did not send an initial callback within 3 seconds; defer first, then follow up
- Using the test webhook URL: it only stays live while the editor is open — always use the **Production** URL for the Developer Portal
