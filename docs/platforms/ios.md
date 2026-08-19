# iPhone App Integration

iPhone integrations use YanezYID on iOS or an SDK flow for user
capture and Apple App Attest, while partner secrets stay on the partner backend.

## Responsibilities

| Component | Responsibility |
| --- | --- |
| Partner iPhone app | Starts the user flow and displays status. |
| YanezYID (iOS) | Performs biometric capture and YanezYID-side operations. |
| Partner backend | Signs partner API requests and validates resulting `yid` values. |
| Yanez backend | Verifies partner signatures, attestation, and record state. |

## App Handoff

YanezYID opens via a signed deep link. Deliver it as an **HTTPS Universal
Link**: `{DEEP_LINK_BASE}?...` (e.g. `https://yid.yanez.ai/open?...`). The
link is verified against `/.well-known/apple-app-site-association` on that
domain and falls back to the App Store automatically when the app isn't
installed or hasn't claimed the link yet, so it is safe to render as a QR code.

The **custom scheme** `yanezbio://sign?...` is **deprecated**. It still works
but fails silently if the app isn't installed — migrate to the HTTPS form. See
[Custom Scheme (Deprecated)](../deep-link-signing.md#custom-scheme-deprecated).

The partner backend generates and signs the deep link; the partner app
delivers it as a QR code or tappable link.

See [Deep Link Signing](../deep-link-signing.md) for the full parameter
reference, the `DEEP_LINK_BASE` per environment, signing steps, and a Python
example.

## User Activity and Integrations

YanezYID on iOS can read user-scoped activity and integrations for a `yid`
through app-attested Yanez endpoints:

```http
GET /reg/ios/activities/{yid}
GET /reg/ios/activities/{yid}/recent
GET /reg/ios/integrations/{yid}
```

These are user-app endpoints, not partner backend endpoints. Partner backends
should use the signed partner APIs documented in [Backend API](../api/backend-api.md).

## Completion

After the iPhone flow completes, the partner backend should validate any
returned `yid` using:

```http
POST /api/partners/records/validate
```

