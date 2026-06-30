# Authentication

Production partner backend requests use Ed25519 request signatures.

Bearer API keys are not used for partner API access.

## Required Headers

Every signed request includes:

```http
X-Yanez-Partner-Id: ptr_abc123
X-Yanez-Key-Id: partner_key_2026_01
X-Yanez-Timestamp: 2026-06-26T17:00:00Z
X-Yanez-Nonce: req_01JABCDEF456
X-Yanez-Content-SHA256: base64url(sha256(raw_request_body_bytes))
X-Yanez-Signature-Alg: EdDSA
X-Yanez-Signature: base64url(ed25519_signature)
```

For requests with no body, hash zero bytes.

## Canonical String

Build the canonical string by joining these lines with `\n` and no trailing
newline:

```text
YANEZ-SIG-V1
<HTTP_METHOD_UPPERCASE>
<PATH_WITH_QUERY>
<X-Yanez-Partner-Id>
<X-Yanez-Key-Id>
<X-Yanez-Signature-Alg>
<X-Yanez-Timestamp>
<X-Yanez-Nonce>
<X-Yanez-Content-SHA256>
```

`PATH_WITH_QUERY` must be the raw path and query exactly as sent. Do not sort
query parameters or normalize percent encoding after signing.

## Python Signing Example

```python
import base64
import hashlib
import secrets
from datetime import datetime, timezone

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

BASE_URL = "https://ptest.yanez.ai"
PARTNER_ID = "ptr_abc123"
KEY_ID = "partner_key_2026_01"
PRIVATE_KEY_HEX = "replace-with-32-byte-private-key-hex"


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def sign_yanez_request(method: str, path_with_query: str, body: bytes = b"") -> dict:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    nonce = secrets.token_urlsafe(18)
    body_hash = b64url(hashlib.sha256(body).digest())

    canonical = "\n".join([
        "YANEZ-SIG-V1",
        method.upper(),
        path_with_query,
        PARTNER_ID,
        KEY_ID,
        "EdDSA",
        timestamp,
        nonce,
        body_hash,
    ]).encode()

    private_key = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(PRIVATE_KEY_HEX))

    return {
        "Content-Type": "application/json",
        "X-Yanez-Partner-Id": PARTNER_ID,
        "X-Yanez-Key-Id": KEY_ID,
        "X-Yanez-Signature-Alg": "EdDSA",
        "X-Yanez-Timestamp": timestamp,
        "X-Yanez-Nonce": nonce,
        "X-Yanez-Content-SHA256": body_hash,
        "X-Yanez-Signature": b64url(private_key.sign(canonical)),
    }
```

Serialize a JSON request body once, then use the exact same bytes for hashing,
signing, and sending.

## Verification

Yanez verifies:

1. all required `X-Yanez-*` headers are present
2. the partner account is active
3. the `kid` resolves to an active signing key
4. the signing key is inside its validity window
5. `X-Yanez-Signature-Alg` matches the algorithm of the resolved key
6. the timestamp is within **±300 seconds** of server time
7. the body hash matches the raw request body
8. the Ed25519 signature matches the canonical string
9. the nonce has not been used before for the same partner and key (replay window: 600 seconds)

Authentication failures return a generic `401 Unauthorized` — the response does not indicate which check failed.

## Key Rotation

Recommended rotation process:

1. Generate a new Ed25519 key pair on the partner backend.
2. Send the new public JWK and `kid` to Yanez.
3. Wait for Yanez to confirm the new key is active.
4. Start signing new requests with the new `kid`.
5. Keep the old key available until in-flight requests drain.
6. Ask Yanez to revoke the old `kid`.

