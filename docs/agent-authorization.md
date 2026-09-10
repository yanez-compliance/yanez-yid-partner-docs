# Agent Authorization

Agent Authorization lets an agent ask the owner of a Yanez identity to approve a
specific action. The agent creates a request with exact `terms`, the user reviews it
in YanezYID, and the relying party verifies the resulting receipt before acting.

The canonical HTTP schemas, receipt rules, SDKs, and conformance fixtures live in the
[Yanez Agent Authorization documentation](https://yanez-compliance.github.io/yanez-agent-authorization/).

## Flow

1. The agent creates an authorization request with its `yak_` credential.
2. YanezYID presents the pending request to the user.
3. The user approves or rejects it. Both decisions require a fresh biometric
   verification and are signed by the user's registered biometric key.
4. The agent polls the request and receives a signed receipt for an approval.
5. The relying party verifies the receipt, compares the approved terms with the
   proposed action, and consumes it when the action is single-use.

See the canonical [HTTP quickstart](https://yanez-compliance.github.io/yanez-agent-authorization/http-quickstart/)
for the complete create, poll, verify, and consume sequence.

## Return to a mobile app

Add an optional `return_url` to `terms` when YanezYID should return the user to an
Android or iPhone app after approval:

```json
{
  "terms": {
    "schema_version": 1,
    "action": "purchase",
    "approval_title": "Purchase running shoes",
    "summary": "Buy running shoes for $180.00 at Example Store",
    "merchant": "Example Store",
    "currency": "USD",
    "amount": {
      "minor_units": 18000,
      "currency": "USD"
    },
    "details": [
      {
        "label": "Item",
        "value": "Running shoes, model X, size 10",
        "emphasized": false
      },
      {
        "label": "Amount",
        "value": "$180.00",
        "emphasized": true
      }
    ],
    "return_url": "partner-app://authorization-complete"
  },
  "decision_window_seconds": 900
}
```

`schema_version` is required and must currently be `1`. Generate display text from
`amount.minor_units` and `amount.currency`.

`return_url` must be an absolute URL with a scheme and must not contain embedded
credentials. It may use a custom scheme registered by the partner app or an HTTPS URL.
Paths, query parameters, and fragments are preserved. YanezYID does not append an
authorization result or request identifier.

On Android and iOS, YanezYID opens the URL after the approval has been synchronized
and the user finishes the review. It does not open the URL after rejection or when the
review is closed without a decision. Opening the URL is best-effort, so the agent must
continue to poll the authorization request.

!!! warning "A return URL is navigation, not proof"

    Never treat arrival at `return_url` as evidence that the action was approved.
    Execute the action only after retrieving and verifying the signed receipt according
    to the canonical
    [receipt rules](https://yanez-compliance.github.io/yanez-agent-authorization/receipts/).

## Exact-terms comparison

`return_url` is part of `terms`. It is therefore included in the signed receipt and in
the relying party's deep comparison of the approved terms. Build the terms object once
and use the same object when creating the request and verifying the receipt. Changing
the return URL or its routing context requires a new authorization request.
