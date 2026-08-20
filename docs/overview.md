# Overview

YanezYID lets a partner verify that a user has a Yanez biometric
identity.

YanezYID is a Proof-of-Humanity / Proof-of-Uniqueness system. Biometric
features are turned into cryptographic keys on the user's device, on
the fly — the biometric never leaves the device and is never stored. Because
the keys can only be produced by the live person, a valid signature is proof
of presence (liveness), not merely possession of a stored secret.

A partner integration uses YanezYID to:

- Link a Yanez identity (`yid`) to a local account.
- Guarantee one human → one account (anti-sybil) via Yanez's deduplicated
  registry.
- Gate sensitive actions on a fresh biometric signature (step-up / 2FA).

The partner does **not** capture biometrics, derive keys, or establish
uniqueness. Those live in the Yanez app (on-device) and the Yanez registry.

The main identifiers are:

- `partner_id`: the Yanez-issued identifier for the partner.
- `kid`: the partner signing-key identifier.
- `yid`: the Yanez biometric identity identifier for a user.
- `public_key`: a user public key associated with a Yanez identity record.

## Architecture

| Role | Responsibility |
| --- | --- |
| Partner app (client) | UI only. Requests challenges, renders the QR / opens the deep link, waits for the result. Performs no verification. |
| Partner backend | The security boundary. Issues challenges, receives callbacks, verifies signatures, checks the registry, stores account↔`yid` links. |
| Partner DB / cache | Persists account↔`yid` links (durable) and open challenges (short-lived). |
| Yanez app | Holds the user's bio-derived keys; signs challenges on-device. |
| Yanez registry | Source of truth for uniqueness and the `yid` ↔ keys mapping. |

![Verification flow: User, Partner app, and Yanez app hand off to the Partner backend, which fans out to the partner DB, partner cache, and Yanez registry](assets/roles-architecture-light.svg#only-light)
![Verification flow: User, Partner app, and Yanez app hand off to the Partner backend, which fans out to the partner DB, partner cache, and Yanez registry](assets/roles-architecture-dark.svg#only-dark)

The partner backend is the only place a signature is verified — see
[Deep link signing](deep-link-signing.md) and
[Callback verification](callback.md) for the request/response detail behind
this diagram.

### Partner request signing

Separately from the verification flow above, the partner backend
authenticates its own calls to Yanez APIs (e.g. the record validation API)
with Ed25519 request signatures:

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

