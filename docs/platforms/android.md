# Android App Integration

Android integrations use YanezYID on Android or an SDK flow for user
capture and platform attestation, while partner secrets stay on the partner
backend.

## Responsibilities

| Component | Responsibility |
| --- | --- |
| Partner Android app | Starts the user flow and displays status. |
| YanezYID (Android) | Performs biometric capture and YanezYID-side operations. |
| Partner backend | Signs partner API requests and validates resulting `yid` values. |
| Yanez backend | Verifies partner signatures, attestation, and record state. |

## Public Key Discovery

When the Android app needs to verify a partner-signed payload, it can fetch the
partner's active public keys:

```http
GET /api/partners/{partner_id}/public-keys
```

## App Handoff

YanezYID on Android opens via a signed deep link — the same signed link
contract as iOS. Deliver it as an **HTTPS App Link**:
`{DEEP_LINK_BASE}?...` (e.g. `https://yid.yanez.ai/open?...`). The link is
verified against `/.well-known/assetlinks.json` on that domain and falls back
to the Play Store automatically when the app isn't installed or hasn't claimed
the link yet, so it is safe to render as a QR code.

The **custom scheme** `yanezbio://sign?...` (a `BROWSABLE` intent filter on
the `yanezbio` scheme, with no Digital Asset Links verification) is
**deprecated**. It still works but fails silently if the app isn't installed —
migrate to the HTTPS form. See
[Custom Scheme (Deprecated)](../deep-link-signing.md#custom-scheme-deprecated).

A partner delivers the link as a QR code or tappable link and the OS routes it
to the installed YanezYID app.

See [Deep Link Signing](../deep-link-signing.md) for the full parameter
reference, the `DEEP_LINK_BASE` per environment, signing steps, and a Python
example.

The partner private key remains on the backend. The Android app receives only
public or short-lived flow data.

Android-specific: YanezYID only POSTs a `method=post` callback to an
HTTPS URL on a Yanez-allowlisted domain (`yanez.ai` and subdomains).
If your backend callback is on your own domain, use `method=redirect` or have
your callback domain allowlisted. See [Callback Verification](../callback.md#delivery-modes).

## Completion

After the Android flow completes, the partner backend should validate any
returned `yid` using:

```http
POST /api/partners/records/validate
```

