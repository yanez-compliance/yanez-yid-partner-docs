# Production Checklist

Before production launch, confirm:

- Partner account is active in the production environment.
- Production public signing key has been registered with Yanez.
- Partner private key is stored in backend secret storage.
- Sandbox and production credentials are separated.
- Signed requests use fresh timestamps and unique nonces.
- JSON bodies are serialized once before hashing and signing.
- Query strings are signed exactly as sent.
- Record validation is performed before trusting a returned `yid`.
- Key rotation has been tested.
- Rate-limit and retry behavior has been tested.
- Web, Android, or iPhone handoff has been tested end to end.
- User cancellation, timeout, and retry states are handled.
- Logs avoid secrets, signatures, and sensitive biometric data.
- Support contacts and escalation paths are documented.
- Privacy and biometric-data disclosures have been reviewed.

