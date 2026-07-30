---
date: 2026-07-30
categories:
  - Docs
---

# Partner portal

The partner documentation is now a portal: a landing page, a quickstart, this
changelog, a download and version page, and a support page — alongside the
existing integration reference.

<!-- more -->

## :material-rocket-launch: New

- **[Quickstart](../../quickstart.md)** — generate a key, sign a request, and
  get a `200` from the validation endpoint in about ten minutes, with a
  troubleshooting table for the generic `401`.
- **Node.js request signer** — the quickstart now shows the canonical-string
  signer in both Python and Node.js. Both produce byte-identical signatures.
- **[Download and versions](../../download.md)** — store links, the URI schemes
  registered per platform and build flavor, and the deep-link testbed.
- **[Support](../../support.md)** — rate limits, timing windows, the key
  rotation runbook, and escalation paths in one place.
- **This changelog** — tagged by surface, with **Breaking** called out.

## :material-wrench: Changed

- Navigation is now grouped into tabs, with the integration reference split into
  **Start Here**, **Integration**, **Backend API**, **Platform Guides**, and
  **Going Live**.
- <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> opens search from any page.

No API behaviour changed in this release.
