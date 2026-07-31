# Overview

YanezYID lets a partner verify that a user has a Yanez biometric
identity.

The main identifiers are:

- `partner_id`: the Yanez-issued identifier for the partner.
- `kid`: the partner signing-key identifier.
- `yid`: the Yanez biometric identity identifier for a user.
- `public_key`: a user public key associated with a Yanez identity record.

## Architecture

```text
Partner app or website
  -> calls partner backend

Partner backend
  -> stores partner private key
  -> signs Yanez API requests
  -> stores partner-side user/session state

Yanez block_search service
  -> stores partner public keys
  -> verifies signed partner requests
  -> validates Yanez identity records
```

The browser or mobile app should not hold the partner private key. If a user
flow needs a signed Yanez request, the partner app asks the partner backend to
create it.

## What Yanez Provides

During onboarding, Yanez provides:

- a `partner_id`
- registration of the partner public signing key
- sandbox and production base URLs
- supported platform flow details
- support contacts for launch readiness

Yanez does not store partner private keys.

## Integration Surfaces

| Surface | Purpose |
| --- | --- |
| Partner request signing | Authenticate partner backend requests to Yanez. |
| Record validation API | Validate a `yid` and optional public-key binding. |
| Platform handoff | Start or return from web, Android, or iPhone user flows. |

