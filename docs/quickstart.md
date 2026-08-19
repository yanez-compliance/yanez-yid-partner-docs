# Quickstart

Go from nothing to a verified signed request against the Yanez test
environment. Budget about ten minutes.

You need a backend you can run code on. Everything here happens server-side —
the partner private key must never reach a browser or a mobile app.

!!! info "What you get at the end"

    A working request signer, and a `200` from the record validation endpoint
    proving Yanez accepts your signature.

## 1. Generate a signing key pair

Yanez authenticates partners with Ed25519 request signatures. You generate the
key pair; Yanez only ever sees the public half.

```python title="generate_key.py"
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

print("Private key hex (store as a backend secret):", raw_priv.hex())
print("Public JWK (send to Yanez):", json.dumps(
    {"kty": "OKP", "crv": "Ed25519", "x": b64url(raw_pub)}
))
```

Run it once with `pip install cryptography`. Put the private key hex in your
backend secret store. Never commit it.

## 2. Onboard with Yanez

Send Yanez the public JWK and a key id you choose, such as
`partner_key_2026_01`. See [Onboarding](onboarding.md) for the full list of
details to supply.

Yanez sends back:

| Value | Example | Where it goes |
| --- | --- | --- |
| `partner_id` | `ptr_abc123` | Backend config |
| `kid` | `partner_key_2026_01` | Backend config |
| Base URL | `https://ptest.yanez.ai` | Backend config |

You cannot complete step 4 until Yanez confirms your key is active.

## 3. Build the request signer

Every signed request carries eight `X-Yanez-*` headers. The signature covers a
canonical string — not the raw HTTP request — built by joining these nine lines
with `\n`, with no trailing newline:

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

=== "Python"

    ```python title="yanez_sign.py"
    import base64
    import hashlib
    import secrets
    from datetime import datetime, timezone

    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

    PARTNER_ID = "ptr_abc123"
    KEY_ID = "partner_key_2026_01"
    PRIVATE_KEY_HEX = "..."  # 32-byte Ed25519 private key, hex


    def b64url(raw: bytes) -> str:
        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


    def sign(method: str, path_with_query: str, body: bytes = b"") -> dict:
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        nonce = secrets.token_urlsafe(18)
        body_hash = b64url(hashlib.sha256(body).digest())

        canonical = "\n".join([
            "YANEZ-SIG-V1", method.upper(), path_with_query,
            PARTNER_ID, KEY_ID, "EdDSA", timestamp, nonce, body_hash,
        ]).encode()

        key = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(PRIVATE_KEY_HEX))

        return {
            "Content-Type": "application/json",
            "X-Yanez-Partner-Id": PARTNER_ID,
            "X-Yanez-Key-Id": KEY_ID,
            "X-Yanez-Signature-Alg": "EdDSA",
            "X-Yanez-Timestamp": timestamp,
            "X-Yanez-Nonce": nonce,
            "X-Yanez-Content-SHA256": body_hash,
            "X-Yanez-Signature": b64url(key.sign(canonical)),
        }
    ```

=== "Node.js"

    ```javascript title="yanez-sign.mjs"
    import crypto from "node:crypto";

    const PARTNER_ID = "ptr_abc123";
    const KEY_ID = "partner_key_2026_01";
    const PRIVATE_KEY_HEX = "..."; // 32-byte Ed25519 private key, hex

    // Node needs a PKCS#8 DER key; for Ed25519 the 16-byte header is constant.
    const PKCS8_ED25519_HEADER = Buffer.from("302e020100300506032b657004220420", "hex");

    const b64url = (buf) => buf.toString("base64url");

    function privateKey() {
      return crypto.createPrivateKey({
        key: Buffer.concat([PKCS8_ED25519_HEADER, Buffer.from(PRIVATE_KEY_HEX, "hex")]),
        format: "der",
        type: "pkcs8",
      });
    }

    export function sign(method, pathWithQuery, body = Buffer.alloc(0)) {
      const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
      const nonce = b64url(crypto.randomBytes(18));
      const bodyHash = b64url(crypto.createHash("sha256").update(body).digest());

      const canonical = [
        "YANEZ-SIG-V1", method.toUpperCase(), pathWithQuery,
        PARTNER_ID, KEY_ID, "EdDSA", timestamp, nonce, bodyHash,
      ].join("\n");

      // Ed25519 signs the message directly — the digest argument must be null.
      const signature = crypto.sign(null, Buffer.from(canonical), privateKey());

      return {
        "Content-Type": "application/json",
        "X-Yanez-Partner-Id": PARTNER_ID,
        "X-Yanez-Key-Id": KEY_ID,
        "X-Yanez-Signature-Alg": "EdDSA",
        "X-Yanez-Timestamp": timestamp,
        "X-Yanez-Nonce": nonce,
        "X-Yanez-Content-SHA256": bodyHash,
        "X-Yanez-Signature": b64url(signature),
      };
    }
    ```

=== "Request shape"

    ```http
    POST /api/partners/records/validate HTTP/1.1
    Host: ptest.yanez.ai
    Content-Type: application/json
    X-Yanez-Partner-Id: ptr_abc123
    X-Yanez-Key-Id: partner_key_2026_01
    X-Yanez-Signature-Alg: EdDSA
    X-Yanez-Timestamp: 2026-06-26T17:00:00Z
    X-Yanez-Nonce: req_01JABCDEF456
    X-Yanez-Content-SHA256: XDkZIoM5W0EY1xr-P3B_JetGPzeWRIW26sYNDYDMswo
    X-Yanez-Signature: gf8tD2LfN9EdKzTUDBV_dtf4PJ-gSKSlslQkk4RDRsN...

    {"yid":"796aaf67d496447fa4059dcea80b03aa"}
    ```

    Both the content hash and the signature are **base64url without padding**.
    The hash above is the real SHA-256 of the body shown — useful to check your
    own encoder against.

    There is no cURL one-liner for this — the signature has to be computed by
    your backend before the request is sent.

!!! danger "Serialize the body exactly once"

    Hash, sign, and send **the same bytes**. Re-serializing the JSON between
    hashing and sending is the single most common cause of a `401`.

## 4. Make your first call

Validate a record. An unknown `yid` is not an error — it returns `200` with
`yid_valid: false`, which still proves your signature was accepted.

```python title="first_call.py"
import json
import requests

from yanez_sign import sign

BASE_URL = "https://ptest.yanez.ai"
PATH = "/api/partners/records/validate"

body = json.dumps({"yid": "0" * 32}).encode()
response = requests.post(BASE_URL + PATH, data=body, headers=sign("POST", PATH, body), timeout=10)

print(response.status_code, response.json())
```

| You see | Meaning |
| --- | --- |
| `200 {"yid_valid": false, "public_key_valid": null}` | :material-check: Signature accepted. You are integrated. |
| `401` | Signature rejected. See the troubleshooting table below. |
| `422` | Body is missing `yid`, has an unknown field, or is invalid JSON. |
| `429` | Over 60 requests per 60 seconds from your IP. Back off and retry. |

## 5. Troubleshoot a 401

Yanez returns a deliberately generic `401` that never says which check failed.
Work down this list:

| Check | Common mistake |
| --- | --- |
| Clock skew | Server time must be within **±300 seconds**. Enable NTP. |
| Body hash | Hashed a re-serialized copy of the body instead of the bytes sent. |
| Path | `PATH_WITH_QUERY` must match what you send, byte for byte. Do not sort query parameters or re-encode after signing. |
| Nonce reuse | Nonces are single-use per partner and key for **600 seconds**. Generate a fresh one per attempt, including retries. |
| Key not active | Yanez has not activated your `kid` yet, or it is outside its validity window. |
| Algorithm mismatch | `X-Yanez-Signature-Alg` must be `EdDSA` and match the registered key. |
| Encoding | Signatures and hashes are **base64url without padding**, not standard base64 or hex. |

## Next steps

You now have an authenticated backend. The user-facing flow is next:

<div class="grid cards" markdown>

-   **1. Launch YanezYID**

    ---

    Build and sign an HTTPS deep link (`{DEEP_LINK_BASE}?...`), then deliver
    it as a QR code or tappable link.

    [:octicons-arrow-right-24: Deep link signing](deep-link-signing.md)

-   **2. Receive the result**

    ---

    YanezYID posts a BLS-signed result to your callback. Verify it
    yourself — the payload carries no trusted status flag.

    [:octicons-arrow-right-24: Callback verification](callback.md)

-   **3. Confirm the binding**

    ---

    Validate the `(yid, public_key)` pair against the Yanez registry before you
    persist it.

    [:octicons-arrow-right-24: Backend API](api/backend-api.md)

-   **4. Go live**

    ---

    Work the launch gates and the production checklist with your Yanez contact.

    [:octicons-arrow-right-24: Production checklist](production-checklist.md)

</div>
