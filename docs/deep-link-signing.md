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

`app_sig` is computed over the canonical `yanezbio://sign?<query>` form of the
link, never over the HTTPS URL — see [Signing](#signing).

| Parameter | Required | Notes |
| --- | --- | --- |
| `message` | yes | Base64url-encoded payload the app signs verbatim (see [Message Payload](#message-payload)). |
| `callback` | yes | URL YanezYID delivers the result to — an HTTPS endpoint on your backend for `method=post`, or any URL the phone can open for `method=redirect`. Percent-encode it. There is no callback-domain allowlist. See [Delivery Modes](callback.md#delivery-modes). |
| `method` | yes | `post` or `redirect` — selects callback delivery (case-insensitive). Must be present and non-empty or the link is rejected; an unrecognized value falls back to `redirect`. See [Delivery Modes](callback.md#delivery-modes). |
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

The app verifies `app_sig` against your registered public key. The signature is
**always computed over the canonical custom-scheme form of the link**, whatever
base you deliver it on: YanezYID rewrites a trusted HTTPS App Link
(`https://<host>/open?<query>`) to `yanezbio://sign?<query>` before it
verifies, so the signed bytes never include `{DEEP_LINK_BASE}`.

To sign:

1. Build the canonical string `yanezbio://sign?<query>` with every parameter
   **except** `app_sig`, in the order shown above.
2. Take the exact UTF-8 bytes of that string — do not re-order, percent-decode,
   or normalize.
3. Sign with your Ed25519 private key.
4. Base64url-encode the 64-byte signature.
5. Append `&app_sig=<signature>` as the final parameter.
6. Deliver the link as `{DEEP_LINK_BASE}?<query>&app_sig=<signature>` — the
   same query string, byte for byte, on the HTTPS base.

!!! danger "Do not sign the HTTPS URL"

    A signature computed over `https://yid.yanez.ai/open?...` is rejected by
    the app with *"Untrusted signing request"*. Sign `yanezbio://sign?...`, then
    swap only the base.

```python
import base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()

def sign_deep_link(canonical_unsigned: str, private_key_hex: str) -> str:
    """`canonical_unsigned` is `yanezbio://sign?...` with every parameter except app_sig."""
    private_key = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(private_key_hex))
    sig = b64url(private_key.sign(canonical_unsigned.encode()))
    return f"{canonical_unsigned}&app_sig={sig}"
```

## Example (Enroll)

```python
import base64, json, secrets, time, urllib.parse, uuid

PARTNER_ID = "ptr_..."        # your partner_id
PRIVATE_KEY_HEX = "..."       # 32-byte Ed25519 private key, hex
DEEP_LINK_BASE = "https://yid.yanez.ai/open"  # https://ptest.yanez.ai/open in partner test
CANONICAL_BASE = "yanezbio://sign"            # what app_sig covers, in every environment

request_id = str(uuid.uuid4())
now = int(time.time())
message = json.dumps({
    "v": 1,
    "rp": "your.rp.domain",
    "request_id": request_id,
    "user_id": "your-internal-user-id",
    "action": "enroll",
    "ref": "enroll:your-internal-user-id",
    "required_tier": None,
    "nonce": secrets.token_urlsafe(32),
    "iat": now,
    "exp": now + 604800,
}, separators=(",", ":"))

encoded_message = base64.urlsafe_b64encode(message.encode()).rstrip(b"=").decode()
callback = "https://your-backend.example.com/api/yanez/callback"

query = (
    f"message={encoded_message}"
    f"&callback={urllib.parse.quote(callback, safe='')}"
    f"&method=post"
    f"&request_id={request_id}"
    f"&event=enroll"
    f"&description={urllib.parse.quote('Yanez Enrollment', safe='')}"
    f"&app_id={PARTNER_ID}"
)

# 1. Sign the canonical form.
signed_canonical = sign_deep_link(f"{CANONICAL_BASE}?{query}", PRIVATE_KEY_HEX)
# -> yanezbio://sign?message=...&app_id=ptr_...&app_sig=...

# 2. Deliver the identical query (including app_sig) on the HTTPS base.
deep_link = f"{DEEP_LINK_BASE}?{signed_canonical.split('?', 1)[1]}"
# -> https://yid.yanez.ai/open?message=...&app_id=ptr_...&app_sig=...
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

Production builds on both platforms register `yanezbio://sign`. Test builds
differ by platform:

| Build | iOS | Android |
| --- | --- | --- |
| Production | `yanezbio://sign` | `yanezbio://sign` |
| Dev | `yanezbio-dev://sign` only | `yanezbio://sign` (also `yanezbio-dev://sign`) |
| Partner test | `yanezbio-partner://sign` only | `yanezbio://sign` (also `yanezbio-partner://sign`) |

An iOS test build does **not** respond to `yanezbio://sign` — use its suffixed
scheme; the app normalizes it to `yanezbio` before verifying, so the signature
is unchanged. On Android use `yanezbio://sign` on every flavor: the suffixed
Android schemes open the app, but a signed link delivered on them currently
fails signature verification.

Signing is identical to the HTTPS case: `app_sig` covers the canonical
`yanezbio://sign?<query>` bytes with every parameter except `app_sig`, appended
last — see [Signing](#signing).

## Common Errors

| Message | Cause |
| --- | --- |
| "Untrusted signing request" | `app_sig` is missing, malformed, not the last parameter, or doesn't verify against the registered public key — including a signature computed over the HTTPS URL instead of `yanezbio://sign?...`. Also shown when `app_id` or another required parameter is absent. |
| "This signing request could not be verified" | The app could not fetch the partner's keys: `app_id` is not registered **in this app's environment** (a ptest `partner_id` on the production app, or vice versa), the partner has no active key, or the device is offline. |
