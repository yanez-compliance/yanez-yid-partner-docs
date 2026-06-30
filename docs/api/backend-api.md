# Backend API

This page documents the partner-facing API surface. Examples use sandbox
placeholder hosts and credentials.

## Validate a Record

```http
POST /api/partners/records/validate
```

Validates whether a Yanez identity record exists and, optionally, whether a
public key is bound to that record.

This endpoint requires [signed partner request authentication](../authentication.md).

### Request

```json
{
  "yid": "796aaf67d496447fa4059dcea80b03aa",
  "public_key": "3b6a0f..."
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `yid` | yes | 32 hex characters. Treat as opaque. |
| `public_key` | no | Hex public key. A leading `0x` is accepted. |

Unknown request fields are rejected.

### Response

```json
{
  "yid_valid": true,
  "public_key_valid": true
}
```

| Field | Meaning |
| --- | --- |
| `yid_valid` | `true` when the Yanez record exists. |
| `public_key_valid` | `null` when no public key was sent; otherwise whether the supplied key is bound to the record. |

### Outcomes

| Request | Record exists | Key bound | Response |
| --- | --- | --- | --- |
| `yid` only | yes | n/a | `{ "yid_valid": true, "public_key_valid": null }` |
| `yid` only | no | n/a | `{ "yid_valid": false, "public_key_valid": null }` |
| `yid` and `public_key` | yes | yes | `{ "yid_valid": true, "public_key_valid": true }` |
| `yid` and `public_key` | yes | no | `{ "yid_valid": true, "public_key_valid": false }` |
| `yid` and `public_key` | no | n/a | `{ "yid_valid": false, "public_key_valid": false }` |

### Python Example

```python
import json
import requests

body = json.dumps({
    "yid": "796aaf67d496447fa4059dcea80b03aa",
    "public_key": "3b6a0f...",
}).encode()

path = "/api/partners/records/validate"
headers = sign_yanez_request("POST", path, body)

response = requests.post(
    BASE_URL + path,
    data=body,
    headers=headers,
    timeout=10,
)
response.raise_for_status()
print(response.json())
```

## Discover Partner Public Keys

```http
GET /api/partners/{partner_id}/public-keys
```

Returns active public signing keys for a partner. This endpoint is public so
Yanez apps can verify partner-signed mobile payloads.

### Response

```json
{
  "partner_id": "ptr_abc123",
  "keys": [
    {
      "kid": "partner_key_2026_01",
      "alg": "EdDSA",
      "public_key_jwk": {
        "kty": "OKP",
        "crv": "Ed25519",
        "x": "base64url-encoded-32-byte-public-key"
      }
    }
  ]
}
```

An unknown partner returns `404`. A known partner with no currently valid keys
returns `200` with an empty `keys` list.

## Report a Signing Event

```http
POST /api/partners/signing-events
```

Reports a supported app-side signing event to Yanez.

Current phase note: this endpoint verifies the partner-signed payload and checks
that the supplied `yid` exists. It is an app-reported activity event, not a
server-side biometric proof by itself.

### Request

```json
{
  "yid": "796aaf67d496447fa4059dcea80b03aa",
  "payload": "yanezbio://sign?..."
}
```

### Response

```json
{
  "event_id": "evt_...",
  "request_id": "req_..."
}
```

## List Partner-Scoped Activities

```http
GET /api/partners/{yid}/activities
```

Returns events for the supplied `yid` that belong to the authenticated partner,
newest first.

This endpoint requires [signed partner request authentication](../authentication.md).

### Response

```json
[
  {
    "event_id": "evt_...",
    "event_type": "transaction.signed",
    "occurred_at": "2026-06-26T17:00:00+00:00",
    "payload": {
      "request_id": "req_..."
    },
    "partner_name": "Example Partner"
  }
]
```

