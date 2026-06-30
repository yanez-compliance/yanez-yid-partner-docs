# Errors

Yanez APIs use HTTP status codes and JSON error bodies.

## Common Status Codes

| Status | Meaning |
| --- | --- |
| `200` | Request succeeded. |
| `400` | Malformed identifier, public key, or parameter. |
| `401` | Authentication failed. Signed request failures are intentionally generic. |
| `404` | Requested resource does not exist. |
| `422` | JSON body is invalid, required fields are missing, or unknown fields were sent. |
| `429` | Rate limit exceeded. |
| `500` | Server error. Retry only if the request is safe or idempotent. |

## Error Body

Most errors use this shape:

```json
{
  "detail": "Unauthorized"
}
```

Do not depend on detailed error strings for control flow. Use status codes and
documented response fields.

## Rate Limiting

Partner endpoints may return:

```json
{
  "detail": "Too many requests"
}
```

Use exponential backoff and avoid retry loops that reuse the same signed nonce.
Each signed request attempt should use a fresh nonce and timestamp.

