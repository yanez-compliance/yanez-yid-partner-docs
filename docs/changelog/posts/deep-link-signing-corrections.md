---
date: 2026-08-19
categories:
  - iOS
  - Android
  - Docs
---

# Deep-link signing and callback corrections

Three statements in the integration reference did not match the shipped apps.
If you built deep-link signing from the docs on or after 2026-08-18, re-read
[Signing](../../deep-link-signing.md#signing) — the HTTPS example signed the
wrong bytes.

<!-- more -->

## :material-alert: Corrected behaviour

- **`app_sig` covers the canonical `yanezbio://sign?<query>` bytes, not the
  HTTPS URL.** YanezYID rewrites `https://<host>/open?<query>` to
  `yanezbio://sign?<query>` before verifying. Sign the canonical form, then
  deliver the identical query on `{DEEP_LINK_BASE}`. A signature over the HTTPS
  URL is rejected with "Untrusted signing request". See
  [Signing](../../deep-link-signing.md#signing).
- **There is no callback-domain allowlist.** `method=post` delivers to whatever
  URL the signed link carries, on both platforms. The 2026-07-07 entry that said
  Android drops non-allowlisted hosts was wrong. Return `2xx` from your
  callback; see [Delivery Modes](../../callback.md#delivery-modes).
- **iOS test builds register only their suffixed scheme** (`yanezbio-dev://`,
  `yanezbio-partner://`); every Android flavor accepts `yanezbio://`. The
  2026-07-07 entry had this backwards. See
  [Custom Scheme (Deprecated)](../../deep-link-signing.md#custom-scheme-deprecated).

## :material-information: Clarified

- `method` must be present: an omitted value is rejected at the signature gate;
  an unrecognized value falls back to `redirect`.
- Two rejection messages: "Untrusted signing request" (signature or parameter
  problem) versus "This signing request could not be verified" (the partner's
  keys could not be fetched — usually a `partner_id` from the other
  environment). See [Common Errors](../../deep-link-signing.md#common-errors).
- Signed requests carry seven `X-Yanez-*` headers, not eight.
