# Backend API

This page documents the partner-facing API surface. Examples use sandbox
placeholder hosts and credentials.

## Validate a Record

```http
POST /api/partners/records/validate
```

Confirms whether a Yanez identity record exists and, optionally, that a public
key is bound to it. This is the only registry endpoint — there is no separate
registration step. Yanez manages the yid-key binding; partners use this
endpoint to verify it.

Run this after verifying the user's callback signature, before persisting the
binding. Returns booleans, not the record.

This endpoint requires [signed partner request authentication](../authentication.md).

### Request

```json
{
  "yid": "796aaf67d496447fa4059dcea80b03aa",
  "public_key": "0x3b6a0f..."
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `yid` | yes | Opaque 32-char hex record ID, case-insensitive. Validate only that it is 32 hex characters — do not assert UUID structure. |
| `public_key` | no | The user's public key for this `yid`. Raw hex, `0x` prefix optional, case-insensitive. Ed25519 = 64 hex chars; BLS12-381 G1 = 96 hex chars. Omit to check `yid` only. |

Unknown fields are rejected with `422`.

### Response — 200 OK

```json
{
  "yid_valid": true,
  "public_key_valid": true
}
```

The pair is confirmed only when **both** are `true`.

| `yid` exists | `public_key` sent | Key bound | `yid_valid` | `public_key_valid` |
| :---: | :---: | :---: | :---: | :---: |
| yes | no | — | `true` | `null` |
| no | no | — | `false` | `null` |
| yes | yes | yes | `true` | `true` |
| yes | yes | no | `true` | `false` |
| no | yes | — | `false` | `false` |

An unknown `yid` returns `200` with `yid_valid: false` — **not a 404**. Branch
on the booleans, not the HTTP status. The endpoint only tells you whether the
key you supplied is bound — it never enumerates the keys on a record. A `yid`
may carry several keys; this endpoint only tests membership. Duplicate
detection happens at enrollment.

### Errors

| Status | When |
| --- | --- |
| `400` | `yid` not 32 hex chars; `public_key` non-hex or outside 32–256 bytes. |
| `401` | Signature or auth failed — generic, never says which check failed. |
| `422` | Missing `yid`, unknown field, or invalid JSON body. |
| `429` | More than 60 requests per 60 seconds per IP. Enforced before auth, so it can precede a `401`. Body: `{"detail":"Too many requests"}`. |

### Python Example

```python
import base64, hashlib, json, secrets
from datetime import datetime, timezone
from typing import Optional

import requests
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

BASE_URL   = "https://ptest.yanez.ai"
PARTNER_ID = "ptr_..."
KEY_ID     = "key-1"
PRIVATE_KEY = "..."  # 32-byte Ed25519 private key as hex


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def validate_pair(yid: str, public_key: Optional[str] = None) -> dict:
    path = "/api/partners/records/validate"
    payload = {"yid": yid}
    if public_key is not None:
        payload["public_key"] = public_key
    body = json.dumps(payload).encode()

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    nonce = secrets.token_urlsafe(18)
    body_hash = b64url(hashlib.sha256(body).digest())

    canonical = "\n".join([
        "YANEZ-SIG-V1", "POST", path, PARTNER_ID, KEY_ID, "EdDSA",
        timestamp, nonce, body_hash,
    ]).encode()
    sig = b64url(Ed25519PrivateKey.from_private_bytes(bytes.fromhex(PRIVATE_KEY)).sign(canonical))

    headers = {
        "Content-Type":           "application/json",
        "X-Yanez-Partner-Id":     PARTNER_ID,
        "X-Yanez-Key-Id":         KEY_ID,
        "X-Yanez-Signature-Alg":  "EdDSA",
        "X-Yanez-Timestamp":      timestamp,
        "X-Yanez-Nonce":          nonce,
        "X-Yanez-Content-SHA256": body_hash,
        "X-Yanez-Signature":      sig,
    }
    resp = requests.post(BASE_URL + path, data=body, headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.json()


if __name__ == "__main__":
    result = validate_pair(yid="<yid>", public_key="0x<hex>")
    confirmed = result["yid_valid"] and result["public_key_valid"]
    print("Confirmed" if confirmed else f"Rejected: {result}")
```

