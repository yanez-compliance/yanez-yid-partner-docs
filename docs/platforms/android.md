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

YanezYID on Android opens via a signed `yanezbio://sign` deep link — the same
signed link contract as iOS. The app registers this as a **custom-scheme deep
link** (a `BROWSABLE` intent filter on the `yanezbio` scheme) — it is not an
http/https App Link, so there is no domain (Digital Asset Links) verification. A
partner delivers the link as a QR code or tappable link and the OS routes it to
the installed YanezYID app.

See [Deep Link Signing](../deep-link-signing.md) for the full parameter
reference, signing steps, and a Python example.

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

