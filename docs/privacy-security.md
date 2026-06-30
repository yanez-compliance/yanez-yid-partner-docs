# Privacy and Security

Yanez integrations involve biometric identity flows, so partners should treat
all integration data with care.

## Data Handling

Partners should:

- collect only the data required for the integration
- avoid storing biometric payloads unless explicitly approved
- avoid logging signatures, private keys, full biometric payloads, or sensitive user data
- separate sandbox and production data
- define retention periods for integration logs and user-flow state

## User Disclosure

Partner applications should clearly explain:

- when the user is leaving the partner app or website for a Yanez biometric flow
- what action the user is authorizing
- whether the result will be linked to the partner account
- how the user can get support

## Secret Management

Partner private signing keys must be stored server-side. Recommended storage
options include:

- cloud KMS
- HSM-backed signing
- encrypted secret storage with restricted runtime access

Do not place private keys in:

- browser JavaScript
- mobile app bundles
- public repositories
- client-side configuration files

## Incident Response

If a partner signing key may be exposed:

1. Stop signing new requests with the affected key.
2. Generate a replacement Ed25519 key pair.
3. Contact Yanez to register the replacement public key.
4. Rotate production traffic to the new `kid`.
5. Ask Yanez to revoke the affected key.

