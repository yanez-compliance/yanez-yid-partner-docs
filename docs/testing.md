# Testing

Use sandbox credentials and sandbox Yanez URLs for all integration testing.

## Suggested Test Plan

| Area | Test |
| --- | --- |
| Request signing | Valid signed request succeeds. |
| Request signing | Missing signature returns `401`. |
| Request signing | Reused nonce returns `401`. |
| Request signing | Body changed after signing returns `401`. |
| Record validation | Existing `yid` returns `yid_valid: true`. |
| Record validation | Missing `yid` returns `yid_valid: false`. |
| Record validation | Bound public key returns `public_key_valid: true`. |
| Record validation | Wrong public key returns `public_key_valid: false`. |
| Platform flow | User can complete the flow from the partner app. |
| Platform flow | Cancellation and retry are handled cleanly. |
| Key rotation | New key can be activated before old key is revoked. |

## Sandbox Data

Yanez will provide or approve sandbox test identities during onboarding. Do not
use production user data in sandbox.

## Logging

Log these values on the partner backend:

- request path
- partner request id
- `kid`
- Yanez response status
- Yanez `event_id` or partner correlation id when available

Do not log private keys, signatures, full biometric payloads, or sensitive user
data.

