# Glossary

**PoH / PoU** — Proof of Humanity / Proof of Uniqueness. The two guarantees Yanez provides: that a signing user is a live human, and that no duplicate exists in the registry.

**yid** — The stable unique Yanez ID for a user. An opaque identifier (not a KYC identity), constant across tiers and sessions.

**Bio-derived key** — A BLS12-381 cryptographic key derived from the user's biometric on-device. The biometric never leaves the device.

**Threshold tier** — An assurance level (e.g. `low`, `medium`, `high`). Each tier has its own group public key. Tiers are ordered; a higher tier means greater biometric agreement.

**Matched tier** — The tier whose key produced the single BLS signature at sign time.

**Group public key** — The BLS12-381 G1 public key for a threshold tier (48 bytes, 96 hex chars).

**Address** — `EIP-55(keccak256(pubkey_g1)[-20:])`. A stable, human-referenceable identifier derived from a group public key. Not a usable Ethereum address.

**Challenge** — A nonce-based, time-boxed, single-use payload issued by the partner backend and signed by YanezYID. Binds the signature to a specific user, action, and context.

**request_id** — The unique identifier for a challenge. Correlates the callback to the challenge that was issued.

**Callback** — The out-of-band POST YanezYID sends to the partner backend's public URL after signing a challenge. Not authenticated by the user's session — trust comes from the challenge.

**Registry** — The Yanez source of truth for uniqueness and the `yid ↔ keys` mapping. The only thing that proves a `(yid, keys)` pair represents a genuine, unique human.

**Partner signing key** — An Ed25519 key pair held by the partner backend, used to sign partner-to-Yanez API requests. Distinct from the user's BLS bio key.

**partner_id** — The Yanez-issued identifier for a partner account (e.g. `ptr_…`).

**kid** — The partner signing-key identifier. Included in every signed request so Yanez can resolve the correct public key.
