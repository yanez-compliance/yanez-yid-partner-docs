# Web App Integration

For web applications, the partner backend is the trust boundary.

```text
Browser
  -> partner backend
  -> Yanez API
```

The browser must never receive the partner private signing key.

## Recommended Flow

1. The browser asks the partner backend to start or continue a Yanez flow.
2. The partner backend creates any required signed Yanez request.
3. The partner backend stores local pending state.
4. The browser displays the returned link or QR code (see [Deep Link Signing](../deep-link-signing.md)).
5. The Yanez app or browser ceremony completes.
6. The partner backend validates the resulting `yid` with Yanez.

## Backend Responsibilities

The partner backend should:

- store the Ed25519 private key securely
- sign Yanez partner API requests
- keep local user/session state
- validate any `yid` before trusting it
- handle retries and idempotency
- keep production and sandbox credentials separate

## Browser Responsibilities

The browser can:

- call the partner backend
- display partner-generated flow links or QR codes
- show pending, success, or failure states

The browser should not:

- sign Yanez API requests directly
- contain private keys
- call signed Yanez partner endpoints directly

## Validating a User

After the user completes a Yanez flow and the partner backend receives a `yid`,
the backend should call:

```http
POST /api/partners/records/validate
```

If the partner also receives a user public key, include it in the validation
request.

