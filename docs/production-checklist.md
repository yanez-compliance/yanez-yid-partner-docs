# Production Checklist

Before production launch, confirm:

**Partner setup**

- Partner account is active in the production environment.
- Production public signing key has been registered with Yanez.
- Partner private key is stored in backend secret storage, not in client code.
- Sandbox and production credentials are separated.

**Request signing**

- Signed requests use fresh timestamps (±300s) and unique nonces per request.
- JSON bodies are serialized once before hashing and signing.
- Query strings are signed exactly as sent — no re-ordering or re-encoding.

**Callback security**

- Backend verifies the BLS signature on every callback; the `verified` field in
  the callback payload is advisory only and is ignored.
- Callback is verified against the exact bytes of the challenge the backend
  issued (message byte-equality).
- Challenges are single-use: marked consumed on first receipt, regardless of
  outcome.
- `eth_address` values in the callback are recomputed server-side from
  `group_public_key`; client-supplied addresses are not trusted.
- Step-up enforces `matched_tier ≥ required_tier` and same-key-as-registration.

**Registry & dedup**

- Registry check (`POST /api/partners/records/validate`) is called at
  enrollment before persisting the binding.
- If registry is unavailable at enrollment, binding is stored as provisional
  and backfilled — uniqueness guarantees are not claimed until confirmed.

**Resilience & recovery**

- Rate-limiting and retry behavior has been tested (60 req/60s limit on
  validate endpoint).
- A recovery path exists (e.g. 2FA + account verification) so a biometric
  failure cannot permanently lock a user out.
- User cancellation, timeout, and retry states are handled.

**Platform & compliance**

- Record validation is performed before trusting a returned `yid`.
- Key rotation has been tested with two active keys.
- Web, Android, or iPhone handoff has been tested end to end.
- Logs avoid secrets, signatures, biometrics, and sensitive user data.
- Biometrics and user PIN/password are never stored or reused as Yanez factors.
- Support contacts and escalation paths are documented.
- Privacy and biometric-data disclosures have been reviewed.

