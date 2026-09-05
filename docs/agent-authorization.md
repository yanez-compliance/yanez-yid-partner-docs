# Agent Authorization

Agent authorization lets an AI agent ask a YanezYID owner to approve exact
terms before a sensitive action is executed. The agent can request approval,
but its `yak_` key cannot approve the request or perform the action.

The complete flow is:

```text
Agent submits exact terms
  -> Yanez stores the authorization request
  -> APNs sends the iPhone a content-light doorbell
  -> YanezYID fetches the authoritative pending request
  -> The user reviews the complete terms and makes a fresh biometric decision
  -> The agent receives a signed approval receipt
  -> The action executor verifies and consumes the receipt before acting
```

## Create an iOS-compatible purchase request

Create requests from the agent's trusted backend or runtime. Never put the
`yak_` credential in an iPhone app, browser, prompt, URL, or log.

```bash
curl --location 'https://<YANEZ_BASE_URL>/api/agent/authorizations' \
  --header 'Idempotency-Key: <NEW_RANDOM_UUID>' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <YANEZ_AGENT_API_KEY>' \
  --data '{
    "terms": {
      "action": "purchase",
      "approval_title": "Purchase PEP Research queries",
      "summary": "Buy a bundle of 10 Yanez PEP Research queries",
      "merchant": "Yanez PEP Research",
      "currency": "USD",
      "amount": {
        "minor_units": 100,
        "currency": "USD",
        "display": "$1.00"
      },
      "details": [
        {
          "label": "Merchant",
          "value": "Yanez PEP Research"
        },
        {
          "label": "Bundle",
          "value": "10 PEP Research queries"
        },
        {
          "label": "Amount",
          "value": "$1.00",
          "emphasized": true
        }
      ]
    },
    "decision_window_seconds": 600
  }'
```

`decision_window_seconds` may be 60 through 3600. The server turns it into the
absolute `decide_by` time used by the iPhone.

`intent_expires_at` is optional. When supplied, it must be a future ISO 8601
timestamp and bounds how long the relying party may act on an approval. Do not
reuse an old example timestamp.

The current YanezYID iOS presentation model uses the structured
`approval_title`, `amount`, and `details` fields above. `action` and `summary`
remain the portable minimum required by the authorization API; include the
structured fields when the request will be reviewed in the current iPhone app.

!!! danger "Protect the agent key"

    Treat the complete `yak_` value as a secret. If it appears in a ticket,
    chat, screenshot, log, or documentation, revoke it in YanezYID and create a
    replacement.

!!! warning "Use idempotency keys by logical operation"

    Generate a random `Idempotency-Key` once for a logical request and reuse it
    only when retrying that same body after an ambiguous failure. A new purchase
    needs a new idempotency key. Reusing a key with different JSON returns
    `409 Conflict`.

### Creation response

```json
{
  "request_id": "azr_9f1c...",
  "status": "pending",
  "decide_by": "2026-09-04T23:35:00Z"
}
```

The `request_id` connects the agent request, push notification, YanezYID inbox
entry, decision, and signed receipt.

## What reaches the iPhone

APNs carries a doorbell, not the purchase terms:

```json
{
  "aps": {
    "alert": {
      "title": "Approval needed",
      "body": "PEP Research Agent is waiting for your approval"
    },
    "sound": "default"
  },
  "request_id": "azr_9f1c..."
}
```

The top-level `request_id` is available in
`UNNotificationContent.userInfo`. The notification deliberately excludes the
merchant, amount, and complete `terms`, keeping those details out of the APNs
payload and lock-screen transport.

```swift
let userInfo = response.notification.request.content.userInfo

guard let requestID = userInfo["request_id"] as? String else {
    return
}

openAuthorizationRequest(id: requestID)
```

The notification is not the source of truth. After a tap, YanezYID uses its
device-attested session to refresh the pending-authorization inbox and selects
the record matching `request_id`.

## What YanezYID fetches and displays

The pending inbox returns server-added routing information together with the
exact terms originally submitted by the agent:

```json
[
  {
    "request_id": "azr_9f1c...",
    "key_id": "yak_a1b2c3d4e5f6",
    "agent_label": "PEP Research Agent",
    "terms": {
      "action": "purchase",
      "approval_title": "Purchase PEP Research queries",
      "summary": "Buy a bundle of 10 Yanez PEP Research queries",
      "merchant": "Yanez PEP Research",
      "currency": "USD",
      "amount": {
        "minor_units": 100,
        "currency": "USD",
        "display": "$1.00"
      },
      "details": [
        {
          "label": "Merchant",
          "value": "Yanez PEP Research"
        },
        {
          "label": "Bundle",
          "value": "10 PEP Research queries"
        },
        {
          "label": "Amount",
          "value": "$1.00",
          "emphasized": true
        }
      ]
    },
    "decide_by": "2026-09-04T23:35:00Z",
    "created_at": "2026-09-04T23:25:00Z"
  }
]
```

The app uses these fields as follows:

| Field | iPhone behavior |
| --- | --- |
| `request_id` | Selects and decides the exact request opened from APNs. |
| `agent_label` | Identifies the agent asking for approval. The label comes from the registered `yak_` key, not the create body. |
| `terms.approval_title` | Titles the review screen. |
| `terms.summary` | States the complete action in user-readable language. |
| `terms.amount` | Supplies exact minor units, currency, and formatted display text. |
| `terms.details` | Supplies the ordered rows the user reviews before deciding. |
| `decide_by` | Controls the countdown and disables decisions after expiry. |

If the app receives only the APNs doorbell, it may show a locked placeholder
while it refreshes. The request becomes reviewable only after the authoritative
inbox response decodes successfully. A schema mismatch in `terms` must be
treated as an integration error, not as user rejection or an empty inbox.

## Decide and poll

Approval and rejection occur inside YanezYID and require a fresh biometric
scan. The device decision applies to the exact stored terms; the iPhone does
not resubmit or rewrite them.

The agent polls the request until it reaches a terminal state:

```bash
curl --location \
  'https://<YANEZ_BASE_URL>/api/agent/authorizations/azr_9f1c...?wait=25' \
  --header 'Authorization: Bearer <YANEZ_AGENT_API_KEY>'
```

An approval response contains the signed receipt:

```json
{
  "request_id": "azr_9f1c...",
  "status": "approved",
  "artifact": "eyJhbGciOiJFZERTQSIsImtpZCI6...",
  "decided_at": "2026-09-04T23:28:12Z",
  "consent_not_after": null
}
```

Stop on `rejected` or `expired`. Do not generate replacement requests in a
loop. The action executor must verify the receipt, compare its signed terms to
the proposed action, enforce freshness and consent bounds, and consume it for
a single-use action before performing the purchase.
