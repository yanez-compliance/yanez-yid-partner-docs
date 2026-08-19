---
date: 2026-07-07
categories:
  - Backend API
  - iOS
  - Android
---

# Documentation synced with implementation

The integration reference was corrected against the shipped implementation.
Several documented behaviours were wrong; if you integrated before this date,
re-read the callback and validation pages.

!!! warning "Partially superseded"

    Two statements below were themselves wrong — the `post` callback allowlist
    (there is none) and the iOS custom-scheme note (iOS test builds register a
    suffixed scheme). See the
    [2026-08-19 corrections](deep-link-signing-corrections.md).

<!-- more -->

## :material-alert: Corrected behaviour

- **Record validation returns `200` for an unknown `yid`**, not `404`. Branch on
  the `yid_valid` and `public_key_valid` booleans, never on the HTTP status. See
  the full truth table in the [Backend API](../../api/backend-api.md).
- **The callback carries no verification-status flag.** The partner backend must
  independently verify the BLS12-381 signature over the decoded `message` bytes.
  See [Callback Verification](../../callback.md).
- **`post` callbacks require an allowlisted HTTPS domain.** The Android app
  silently drops a `post` callback to a non-allowlisted host. Use
  `method=redirect`, or ask Yanez to allowlist your domain before launch.

## :material-close-circle: Removed

- Yanez mobile-app-only endpoints were removed from the partner documentation.
  They are app-attested user endpoints, not partner backend endpoints, and were
  never callable with partner request signatures.

## :material-information: Clarified

- `transaction.signed` is the canonical event value recorded by the Yanez
  backend. The app treats `event` as opaque, so `transaction_sign` also works,
  but prefer the canonical form.
- iOS registers only the `yanezbio://` scheme. The suffixed `yanezbio-dev://`
  and `yanezbio-partner://` schemes are Android build flavors only.
