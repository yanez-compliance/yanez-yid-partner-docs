---
date: 2026-08-18
categories:
  - Backend API
  - iOS
  - Android
---

# HTTPS deep links replace the custom scheme

Deep links are now delivered as an HTTPS URL — an iOS Universal Link /
Android App Link. The `yanezbio://` custom scheme is deprecated.

<!-- more -->

## :material-rocket-launch: New

- **HTTPS deep link format**: `{DEEP_LINK_BASE}?message=...&app_sig=...` —
  the same signed query string as `yanezbio://sign?...`, just a different
  base. Signing is unchanged. See
  [Deep Link Signing](../../deep-link-signing.md#url-format).
- **`DEEP_LINK_BASE` per environment**:

  | Environment | `DEEP_LINK_BASE` |
  | --- | --- |
  | Production | `https://yid.yanez.ai/open` |
  | Partner test (ptest) | `https://ptest.yanez.ai/open` |

- **Store fallback.** Unlike the custom scheme, which fails silently if the
  app isn't installed, an HTTPS link degrades gracefully: the OS hands off to
  YanezYID when it's installed and has claimed the domain, otherwise the link
  302-redirects to the correct app store. This makes it safe to render as a
  QR code.

## :material-alert: Deprecated

- **The custom scheme (`yanezbio://sign?...`) is deprecated.** It still works
  and is unchanged, but it must not be used for new integrations. Migrate
  existing integrations to the HTTPS form — only the base changes; the query
  string and signing are identical. See
  [Custom Scheme (Deprecated)](../../deep-link-signing.md#custom-scheme-deprecated).

## :material-information: Clarified

- Until an installed app version claims `DEEP_LINK_BASE` (App Links /
  Universal Links), HTTPS links redirect to the store even with the app
  installed. Not a partner-side integration issue — see
  [Download and Versions](../../download.md#troubleshooting).
