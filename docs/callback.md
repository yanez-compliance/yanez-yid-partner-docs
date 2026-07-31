# Callback Verification

After the user completes a Yanez flow, YanezYID POSTs the signed result
directly to the partner backend's callback URL — not through the client. The
callback may arrive from a different device (cross-device QR scan).

The callback endpoint is **not** authenticated by the user's session. Its trust
comes entirely from the single-use challenge: the `request_id` must map to a
pending, unexpired challenge that the backend issued, and the signed bytes must
equal that challenge exactly.

## Callback Payload

YanezYID POSTs `application/json`:

```json
{
  "request_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "yid": "<stable unique yid>",
  "message": "<the exact base64url message from the deep link>",
  "keys": [
    { "threshold_tier": "low",    "group_public_key": "0x<48-byte G1 hex>", "eth_address": "0x<EIP-55>" },
    { "threshold_tier": "medium", "group_public_key": "0x<48-byte G1 hex>", "eth_address": "0x<EIP-55>" },
    { "threshold_tier": "high",   "group_public_key": "0x<48-byte G1 hex>", "eth_address": "0x<EIP-55>" }
  ],
  "matched_tier": "high",
  "signature": "0x<96-byte G2 hex>"
}
```

| Field | Notes |
| --- | --- |
| `request_id` | Correlates the callback to the challenge the backend issued. |
| `yid` | Stable unique Yanez ID for the user. |
| `message` | The exact `message` value from the deep link, base64url-encoded. |
| `keys` | One entry per threshold tier. The app always sends **all** registered tiers (enrollment and step-up alike); for step-up only the `matched_tier` entry is strictly required to verify. |
| `matched_tier` | The tier whose key produced `signature`. |
| `signature` | A single BLS12-381 G2 signature (96 bytes), produced by the matched tier's key. |

The callback carries no verification-status flag. **The backend MUST
independently verify the BLS signature (see [Verification
Steps](#verification-steps)) and never trust any client-asserted "verified"
state.**

## Delivery Modes

The deep link's `method` parameter selects how YanezYID returns the result:

| `method` | Delivery |
| --- | --- |
| `post` | The payload above is sent as an `application/json` POST body to the `callback` URL. |
| `redirect` | The same fields are returned as query parameters appended to the `callback` URL (`keys` is serialized as a JSON string parameter). |

**`post` callbacks require an allowlisted HTTPS domain.** The Android app
delivers a `post` callback only to an **HTTPS** URL whose host is a
Yanez-allowlisted domain (currently `yanez.ai` and its subdomains);
any other host is silently rejected. `redirect` callbacks have no domain
restriction. iOS does not currently enforce this allowlist, but do not rely on
the asymmetry. If your callback runs on your own domain, use `method=redirect`
or ask Yanez to allowlist your callback domain before launch.

The verification steps below are identical for both modes — always verify the
signature over the decoded `message` bytes regardless of how the result arrived.

## Verification Steps

All of the following must hold before the callback is accepted. Mark the
challenge consumed on first receipt, regardless of outcome — challenges are
single-use even if verification fails.

1. `request_id` maps to a stored challenge that is **not expired** and **not consumed**.
   Mark it consumed immediately.
2. Decoded `message` bytes are **byte-for-byte equal** to the canonical challenge
   the backend issued for this `request_id`.
3. `matched_tier` is a valid tier and is present in `keys`.
4. The matched key's `group_public_key` is 48 bytes; `signature` is 96 bytes.
5. **BLS verifies** `signature` against the matched `group_public_key` over the
   decoded `message` bytes.
6. For each entry in `keys`, `eth_address` equals `derive_address(group_public_key)`.
   Store the server-derived address — do not trust the client-supplied value.
7. **Enrollment only:** all tiers in `keys` pass step 6; store the full key set
   with deduplication.
8. **Step-up only:** `matched_tier ≥ required_tier`, and the matched
   `group_public_key` equals the key stored for this user and tier at enrollment.
9. *(Recommended)* Call `POST /api/partners/records/validate` to confirm the
   `(yid, group_public_key)` pair against the Yanez registry.

## BLS Verification

The signature scheme is BLS12-381 G2Basic with DST
`BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_`.

```python
from py_ecc.bls import G2Basic

PUBKEY_LEN, SIG_LEN = 48, 96

def verify_bls(pubkey_g1: bytes, message: bytes, signature_g2: bytes) -> bool:
    if len(pubkey_g1) != PUBKEY_LEN or len(signature_g2) != SIG_LEN:
        return False
    try:
        return bool(G2Basic.Verify(pubkey_g1, message, signature_g2))
    except Exception:
        return False
```

`message` is the decoded (raw bytes) value of the `message` field — the same
bytes YanezYID signed verbatim.

## Address Derivation

```python
from eth_utils import keccak, to_checksum_address

def derive_address(pubkey_g1: bytes) -> str:
    # EIP-55 checksum address derived from the BLS G1 public key.
    # This is a stable identifier — it is NOT a usable Ethereum address.
    return to_checksum_address(keccak(pubkey_g1)[-20:])
```

## Client Result Delivery

The client learns the outcome by polling a status endpoint or via push (SSE) —
never as a direct reply to the signing hop. Correlate by `request_id`.
