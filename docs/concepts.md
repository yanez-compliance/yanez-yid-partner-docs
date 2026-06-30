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

Private JWKs include a `d` field. Do not send private keys to Yanez — any JWK containing `d` is rejected.

## Yanez Identity ID

A `yid` is the stable unique Yanez ID for a user — a unique identifier, not a
KYC identity. Partner APIs treat it as an opaque 32-character hex string.
Do not infer internal structure from the value.

## Bio-Derived Keys (BLS)

The Yanez app derives cryptographic keys from the user's biometric on-device.
The biometric never leaves the device and is never stored.

The scheme is **BLS12-381 G2Basic**:

| Item | Size |
| --- | --- |
| Group public key (G1) | 48 bytes (96 hex chars) |
| Signature (G2) | 96 bytes (192 hex chars) |

DST: `BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_`

## Threshold Tiers

Each Yanez record has multiple assurance levels called **threshold tiers**
(e.g. `low`, `medium`, `high`). Tiers are ordered — `low < medium < high`.
Each tier has its own distinct group public key.

A higher tier means greater biometric agreement and higher assurance.
Step-up authentication requires `matched_tier ≥ required_tier`.

## Address

Each BLS public key has a derived **address**:

```
EIP-55(keccak256(pubkey_g1)[-20:])
```

This is a stable, human-referenceable identifier. It is **not** a usable
Ethereum address. See [Callback Verification](callback.md) for the derivation
function.

## Public Key Binding

A Yanez record carries one group public key per threshold tier. Partners can
call the record validation API to check whether a supplied public key is bound
to a specific `yid`. The validate endpoint tests membership only — it never
enumerates all keys on a record.

## Sandbox and Production

Use sandbox for development and integration testing. Production credentials,
hostnames, signing keys, and partner account status are separate.

