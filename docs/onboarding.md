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

```python
import base64
import json

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import (
    Encoding, NoEncryption, PrivateFormat, PublicFormat,
)


def b64url(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


priv = Ed25519PrivateKey.generate()
raw_priv = priv.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption())
raw_pub = priv.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)

public_key_jwk = {"kty": "OKP", "crv": "Ed25519", "x": b64url(raw_pub)}

print("=== Private key (hex) — store securely, set as YANEZ_PRIVATE_KEY_HEX ===")
print(raw_priv.hex())
print()
print("=== Public key JWK — send to Yanez onboarding ===")
print(json.dumps(public_key_jwk, indent=2))
```

Requires `pip install cryptography`. Run once, store the private key hex in backend secret
storage, and send Yanez only the public JWK.

## Launch Gates

Before production, Yanez and the partner should confirm:

- signed partner requests work in sandbox
- malformed signatures fail with `401`
- record validation behavior is understood
- platform handoff works end to end
- retry behavior uses new nonces
- key rotation has been rehearsed
- privacy and user-facing disclosures have been reviewed

