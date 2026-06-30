# Onboarding

Use this checklist to prepare for Yanez partner onboarding.

## Information to Provide

Send Yanez:

- partner display name
- legal entity name, if different
- technical contact email
- security contact email
- target environment, such as sandbox or production
- supported application type: web, Android, iPhone, or multiple
- public Ed25519 signing key as JWK
- signing key id, such as `partner_key_2026_01`

Do not send private keys.

## Values Yanez Provides

Yanez provides:

- `partner_id`
- active `kid`
- environment base URL
- launch checklist and test cases
- supported handoff configuration for the selected platform

Store `partner_id` and `kid` in backend configuration. Store the private key in
backend secret storage.

## Key Generation

Partners generate their own Ed25519 key pair. Yanez stores only the public key.

The public JWK should look like:

```json
{
  "kty": "OKP",
  "crv": "Ed25519",
  "x": "base64url-encoded-32-byte-public-key"
}
```

## Launch Gates

Before production, Yanez and the partner should confirm:

- signed partner requests work in sandbox
- malformed signatures fail with `401`
- record validation behavior is understood
- platform handoff works end to end
- retry behavior uses new nonces
- key rotation has been rehearsed
- privacy and user-facing disclosures have been reviewed

