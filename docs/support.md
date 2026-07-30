---
title: Support
description: Contacts, operational limits, key rotation, and escalation paths for Yanez partners.
---

# Support

## Get in touch

<support@yanez.ai>

When you write in, include your `partner_id`, `kid`, the environment, the approximate UTC timestamp, and the `request_id` if the issue involves a deep link or callback. Never include a private key, and never paste one into an issue.

## Operational limits

These are enforced by the Yanez backend. Build against them rather than
discovering them in production.

| Limit | Value | Applies to |
| --- | --- | --- |
| Request rate | 60 requests per 60 seconds, per IP | Partner endpoints. Enforced **before** authentication, so a `429` can precede a `401`. |
| Timestamp skew | ±300 seconds from server time | `X-Yanez-Timestamp` on every signed request. |
| Nonce replay window | 600 seconds | `X-Yanez-Nonce`, per partner and key. Single use. |
| `yid` format | 32 hex characters, case-insensitive | Validate length and charset only — do not assert UUID structure. |
| Public key size | 32–256 bytes | Ed25519 = 64 hex chars; BLS12-381 G1 = 96 hex chars. |

### Retry guidance

- Use exponential backoff on `429` and `500`.
- **Generate a fresh nonce and timestamp for every attempt.** Replaying a signed
  request verbatim fails the nonce check and burns the retry.
- Do not retry `400`, `401`, or `422` — they are deterministic. Fix the request.
- Run NTP on any host that signs requests. Clock drift is the most common cause
  of a sudden, total `401` across all traffic.

See [Errors](api/errors.md) for the full status code reference.

## Key rotation runbook

Rotate on a schedule, and immediately on suspected compromise. Rotation is
zero-downtime if you follow the order — the old key stays valid until you ask
for revocation.

1. Generate a new Ed25519 key pair on the partner backend. See
   [Onboarding](onboarding.md#key-generation).
2. Send Yanez the new public JWK and a new `kid`. Never send the private key.
3. **Wait for Yanez to confirm the new key is active.** Do not proceed on
   assumption — signing with an unactivated `kid` returns `401`.
4. Switch new requests to the new `kid`.
5. Keep the old key loaded until in-flight requests drain.
6. Ask Yanez to revoke the old `kid`, and confirm the revocation landed.

!!! danger "Suspected compromise"

    Contact `support@yanez.ai` **before** step 6 and ask for
    immediate revocation of the old `kid`. Accept the failed in-flight requests
    — a compromised signing key can mint valid partner requests until it is
    revoked.

Rehearse rotation in the test environment before launch. It is a
[launch gate](onboarding.md#launch-gates).

## Environments

| Environment | Base URL | Notes |
| --- | --- | --- |
| Test | `https://ptest.yanez.ai` | All development and certification. Separate `partner_id` and keys. |
| Production | `https://yid.yanez.ai` | Live traffic only, after the [production checklist](production-checklist.md). |

Keep test and production credentials in separate secret stores. A production
private key in a test config is a reportable incident.

## Before you escalate

Most integration failures are one of these. Check them first — it will be the
first thing support asks.

- [ ] Server clock is within ±300 seconds of UTC (NTP running).
- [ ] The body is serialized **once**, then hashed, signed, and sent as the same
      bytes.
- [ ] `PATH_WITH_QUERY` is signed exactly as sent — no re-sorting, no re-encoding.
- [ ] Signatures and hashes are base64url **without padding**.
- [ ] A fresh nonce per attempt, including retries.
- [ ] `X-Yanez-Signature-Alg` is `EdDSA` and matches the registered key.
- [ ] Yanez has confirmed your `kid` is active in this environment.
- [ ] For `method=post` callbacks, the callback host is allowlisted.
- [ ] For callbacks, the BLS signature is verified over the **decoded** `message`
      bytes, and `eth_address` is re-derived server-side.

The [quickstart troubleshooting table](quickstart.md#5-troubleshoot-a-401) maps
each of these to the symptom it produces.

## Status and announcements

Breaking changes, minimum-supported-version bumps, and API additions are
published in the [changelog](changelog/index.md). Watch the
[documentation repository](https://github.com/yanez-compliance/yanez-yid-partner-docs)
on GitHub to be notified when one lands.

!!! warning "No status page yet"

    If you operate a service status page, link it here. Partners need a
    self-service way to distinguish an outage from an integration bug.
