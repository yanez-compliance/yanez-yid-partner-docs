# Core Concepts

## Partner Account

A partner account represents one organization integrating with Yanez. Each
partner account has a stable `partner_id`, an environment, a status, and one or
more signing keys.

Partner status must be `active` before production traffic is accepted.

## Signing Keys

Partners generate an Ed25519 key pair and keep the private key in backend secret
storage. Yanez stores only the public JWK.

Public JWK shape:

```json
{
  "kty": "OKP",
  "crv": "Ed25519",
  "x": "base64url-encoded-32-byte-public-key"
}
```

Private JWKs include a `d` field. Do not send private keys to Yanez.

## Yanez Identity ID

A `yid` identifies a Yanez biometric record. Partner APIs treat it as an opaque
32-character hex string. Do not infer internal structure from the value.

## Public Key Binding

A Yanez record may have one or more public keys bound to it. Partners can call
the record validation API to check whether a supplied public key belongs to a
specific `yid`.

## Sandbox and Production

Use sandbox for development and integration testing. Production credentials,
hostnames, signing keys, and partner account status are separate.

