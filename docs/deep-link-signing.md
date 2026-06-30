# Deep Link Signing

The Yanez app opens partner-initiated flows via a signed deep link. Partners
generate the deep link on the partner backend and deliver it to the user as a
QR code or tappable link.

## URL Format

```
yanezbio://sign?message=<b64url>&callback=<url>&method=post&request_id=<uuid>&event=<event>&description=<text>&app_id=<partner_id>[&kid=<kid>]&app_sig=<b64url>
```

| Parameter | Required | Notes |
| --- | --- | --- |
| `message` | yes | Base64url-encoded JSON payload (see below). |
| `callback` | yes | URL the Yanez app posts results to. |
| `method` | yes | Always `post`. |
| `request_id` | yes | UUID. Use a fresh value per request. |
| `event` | yes | See [Supported Events](#supported-events). |
| `description` | yes | Short human-readable label shown in the Yanez app. |
| `app_id` | yes | Your `partner_id` (e.g. `ptr_416582cd9ea9bb6c3750de1c`). |
| `kid` | no | Signing key id. Include if you manage multiple keys. |
| `app_sig` | yes | Ed25519 signature. **Must be the last parameter.** |

## Supported Events

| Event | `event` value |
| --- | --- |
| Enroll a user | `enroll` |
| Transaction signing | `transaction.signed` |

## Message Payload

The `message` parameter is a base64url-encoded JSON object:

```json
{
  "v": 1,
  "rp": "<your RP domain>",
  "request_id": "<same uuid as request_id param>",
  "user_id": "<your internal user id>",
  "action": "<event>",
  "ref": "<event>:<user_id>",
  "required_tier": null,
  "nonce": "<random string>",
  "iat": 1782395776,
  "exp": 1783000576
}
```

## Signing

The app verifies `app_sig` against your registered public key. To sign:

1. Build the complete deep link string with all parameters **except** `app_sig`.
2. Take the exact UTF-8 bytes of that string — do not re-order, percent-decode,
   or normalize.
3. Sign with your Ed25519 private key.
4. Base64url-encode the 64-byte signature.
5. Append `&app_sig=<signature>` as the final parameter.

```python
import base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()

def sign_deep_link(unsigned_url: str, private_key_hex: str) -> str:
    private_key = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(private_key_hex))
    sig = b64url(private_key.sign(unsigned_url.encode()))
    return f"{unsigned_url}&app_sig={sig}"
```

## Example (Enroll)

```python
import json, base64, uuid

message = json.dumps({
    "v": 1,
    "rp": "your.rp.domain",
    "request_id": str(uuid.uuid4()),
    "user_id": "your-internal-user-id",
    "action": "enroll",
    "ref": "enroll:your-internal-user-id",
    "required_tier": None,
    "nonce": secrets.token_urlsafe(32),
    "iat": int(time.time()),
    "exp": int(time.time()) + 604800,
}, separators=(",", ":"))

encoded_message = base64.urlsafe_b64encode(message.encode()).rstrip(b"=").decode()
request_id = str(uuid.uuid4())
callback = "https://your-backend.example.com/api/yanez/callback"

unsigned = (
    f"yanezbio://sign"
    f"?message={encoded_message}"
    f"&callback={urllib.parse.quote(callback, safe='')}"
    f"&method=post"
    f"&request_id={request_id}"
    f"&event=enroll"
    f"&description=Yanez+Enrollment"
    f"&app_id={PARTNER_ID}"
)

deep_link = sign_deep_link(unsigned, PRIVATE_KEY_HEX)
```

## Common Errors

| Error | Cause |
| --- | --- |
| "Untrusted signing request" | `app_sig` is missing, malformed, or doesn't verify against the registered public key. Also shown when `app_id` is absent and the app cannot look up the partner record. |
