# Deep Link Signing

YanezYID opens partner-initiated flows via a signed deep link. Partners
generate the deep link on the partner backend and deliver it to the user as a
QR code or tappable link.

Deliver the deep link as an **HTTPS App Link** (an iOS Universal Link / Android
App Link). The `yanezbio://` custom scheme is
[deprecated](#custom-scheme-deprecated): it still works, but migrate to the
HTTPS form.

## URL Format

```
{DEEP_LINK_BASE}?message=<b64url>&callback=<url>&method=post&request_id=<uuid>&event=<event>&description=<text>&app_id=<partner_id>[&kid=<kid>]&app_sig=<b64url>
```

| Environment | `DEEP_LINK_BASE` |
| --- | --- |
| Production | `https://yid.yanez.ai/open` |
| Partner test (ptest) | `https://ptest.yanez.ai/open` |

There is one exact path, `/open`, with nothing beneath it (`/open/foo` is a
`404`). Everything the link needs to carry rides in the query string.

| Parameter | Required | Notes |
| --- | --- | --- |
| `message` | yes | Base64url-encoded payload the app signs verbatim (see [Message Payload](#message-payload)). |
| `callback` | yes | URL YanezYID posts results to. For `method=post` this must be an HTTPS URL on a Yanez-allowlisted domain — see [Callback Verification](callback.md#delivery-modes). |
| `method` | yes | `post` or `redirect` — selects callback delivery (case-insensitive). If omitted or unrecognized the app defaults to `redirect`. See [Delivery Modes](callback.md#delivery-modes). |
| `request_id` | yes | Unique per-request identifier (a UUID works, but the app treats it as an opaque string). Use a fresh value per request. |
| `event` | yes | See [Supported Events](#supported-events). |
| `description` | yes | Short human-readable label shown in YanezYID. |
| `app_id` | yes | Your `partner_id` (e.g. `ptr_416582cd9ea9bb6c3750de1c`). |
| `kid` | no | Signing key id. Include if you manage multiple keys. |
| `app_sig` | yes | Ed25519 signature. **Must be the last parameter.** |

## How the Link Resolves

iOS (Universal Links) and Android (App Links) hand the link to YanezYID when
it's installed and has claimed the domain; otherwise the link opens normally
in the browser and `{DEEP_LINK_BASE}` 302-redirects the user to the App Store
or Google Play automatically, based on their device. This is what makes the
HTTPS form safe to render as a **QR code**: it never dead-ends.

!!! info "Falls back to the store, never fails silently"

    If the installed app hasn't claimed the domain yet, the link simply opens
    the App Store / Play Store listing instead of the app — the same
    graceful fallback a user with no app installed gets.

## Supported Events

| Event | `event` value |
| --- | --- |
| Enroll a user | `enroll` |
| Transaction signing | `transaction.signed` |

`event` is a required, non-empty string; YanezYID treats it as opaque and
does not validate or reject the value. Use the values above — `transaction.signed`
is the canonical type the Yanez backend records for a signing. (Some test
tooling emits `transaction_sign`; because the value is opaque to the app, either
is accepted, but prefer `transaction.signed` for consistency with the backend.)

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

YanezYID does **not** parse or validate these fields. It treats the decoded
`message` as opaque bytes: it signs them verbatim (BLS) and echoes the same
base64url string back in the callback. The JSON shape above is a
partner-backend convention so your own callback handler can correlate and
inspect the request — the app only requires that `message` is valid base64url.
Keep the exact bytes stable, since the signature is computed over them.

## Signing

The app verifies `app_sig` against your registered public key. To sign:

1. Build the complete deep link string (`{DEEP_LINK_BASE}` plus all parameters)
   **except** `app_sig`.
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

DEEP_LINK_BASE = "https://yid.yanez.ai/open"  # https://ptest.yanez.ai/open in partner test

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
    f"{DEEP_LINK_BASE}"
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

## Custom Scheme (Deprecated)

!!! warning "Deprecated — migrate to the HTTPS App Link"

    The `yanezbio://` custom scheme is deprecated. It still works, but it fails
    silently when the app isn't installed — nothing happens, with no way to
    recover — so it must not be used for new integrations. Migrate existing
    integrations to the [HTTPS URL format](#url-format); the query string and
    signing are unchanged.

The deprecated form carries the same parameters on a different base:

```
yanezbio://sign?message=<b64url>&callback=<url>&method=post&request_id=<uuid>&event=<event>&description=<text>&app_id=<partner_id>[&kid=<kid>]&app_sig=<b64url>
```

Production builds register the `yanezbio://sign` scheme. Suffixed test schemes
are platform-specific: the Android `dev` and `partner` build flavors register
`yanezbio-dev://sign` and `yanezbio-partner://sign`. iOS registers only
`yanezbio://` (no suffixed scheme), so iOS test builds use `yanezbio://` as
well.

Signing is identical to the HTTPS case: build the complete custom-scheme URL
with every parameter except `app_sig`, sign those exact bytes, and append
`&app_sig=<signature>` last.

## Common Errors

| Error | Cause |
| --- | --- |
| "Untrusted signing request" | `app_sig` is missing, malformed, or doesn't verify against the registered public key. Also shown when `app_id` is absent and the app cannot look up the partner record. |
