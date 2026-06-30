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

## Public Key Discovery

When the iPhone app needs to verify a partner-signed payload, it can fetch the
partner's active public keys:

```http
GET /api/partners/{partner_id}/public-keys
```

## App Handoff

The exact iPhone handoff contract should be confirmed for the production app.
Common options are:

- Universal Links
- custom URL schemes
- app-to-app return URLs

Use Universal Links when possible because they are harder to spoof than custom
schemes.

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

