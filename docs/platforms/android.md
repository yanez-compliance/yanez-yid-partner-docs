# Android App Integration

Android integrations use the Yanez Android biometrics app or SDK flow for user
capture and platform attestation, while partner secrets stay on the partner
backend.

## Responsibilities

| Component | Responsibility |
| --- | --- |
| Partner Android app | Starts the user flow and displays status. |
| Yanez Android biometrics app | Performs biometric capture and Yanez app-side operations. |
| Partner backend | Signs partner API requests and validates resulting `yid` values. |
| Yanez backend | Verifies partner signatures, attestation, and record state. |

## Public Key Discovery

When the Android app needs to verify a partner-signed payload, it can fetch the
partner's active public keys:

```http
GET /api/partners/{partner_id}/public-keys
```

## App Handoff

The exact Android handoff contract should be confirmed for the production app.
Common options are:

- Android App Links
- custom URI schemes
- explicit intents between installed applications

Whichever mechanism is used, the partner private key remains on the backend.
The Android app receives only public or short-lived flow data.

## Completion

After the Android flow completes, the partner backend should validate any
returned `yid` using:

```http
POST /api/partners/records/validate
```

If the flow reports a signing event, the app can report it to:

```http
POST /api/partners/signing-events
```

Current phase note: signing events are app-reported activity events. Treat them
as audit/activity signals unless your Yanez launch agreement states otherwise.

