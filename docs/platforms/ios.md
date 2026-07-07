# iPhone App Integration

iPhone integrations use the Yanez iOS biometrics app or SDK flow for user
capture and Apple App Attest, while partner secrets stay on the partner backend.

## Responsibilities

| Component | Responsibility |
| --- | --- |
| Partner iPhone app | Starts the user flow and displays status. |
| Yanez iOS biometrics app | Performs biometric capture and Yanez app-side operations. |
| Partner backend | Signs partner API requests and validates resulting `yid` values. |
| Yanez backend | Verifies partner signatures, attestation, and record state. |

## App Handoff

The Yanez app opens via a signed `yanezbio://sign?` deep link. The partner
backend generates and signs the deep link; the partner app delivers it as a QR
code or tappable link.

See [Deep Link Signing](../deep-link-signing.md) for the full parameter
reference, signing steps, and a Python example.

## User Activity and Integrations

The Yanez iOS app can read user-scoped activity and integrations for a `yid`
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

As on Android, when the flow completes a signing the Yanez app reports it via
`POST /api/partners/signing-events` — see
[Report a Signing Event](../api/backend-api.md#report-a-signing-event). These
are app-reported activity signals; trust for the signature itself comes from
[callback verification](../callback.md).

