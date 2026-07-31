---
hide:
  - navigation
  - toc
---

# YanezYID Partner Portal

<div class="hero" markdown>

<span class="hero__eyebrow">Partner Integration</span>

## Verify a user's biometric identity — without holding their biometrics

Yanez lets your application confirm that a user holds a Yanez biometric
identity. Biometric data never leaves the user's device, your signing keys never
leave your backend, and every partner request is signed end to end.

[Start the quickstart](quickstart.md){ .md-button .md-button--primary }
[Browse the API reference](api/backend-api.md){ .md-button }

</div>

## Choose your path

<div class="grid cards" markdown>

-   :material-rocket-launch:{ .lg .middle } **Quickstart**

    ---

    Sign your first partner request and validate a `yid` in about ten minutes.

    [:octicons-arrow-right-24: First signed request](quickstart.md)

-   :material-web:{ .lg .middle } **Web apps**

    ---

    Browser front end, partner backend as the trust boundary, QR or link handoff.

    [:octicons-arrow-right-24: Web integration](platforms/web.md)

-   :material-android:{ .lg .middle } **Android apps**

    ---

    Deep-link handoff to YanezYID on Android, plus build-flavor URI schemes.

    [:octicons-arrow-right-24: Android integration](platforms/android.md)

-   :material-apple:{ .lg .middle } **iPhone apps**

    ---

    Handoff to YanezYID on iOS with App Attest, signed from your backend.

    [:octicons-arrow-right-24: iOS integration](platforms/ios.md)

</div>

## Core building blocks

<div class="grid cards" markdown>

-   :material-key-chain:{ .lg .middle } **Request signing**

    ---

    Ed25519 signatures over a canonical string. No bearer tokens, no shared
    secrets in the client.

    [:octicons-arrow-right-24: Authentication](authentication.md)

-   :material-link-variant:{ .lg .middle } **Deep link signing**

    ---

    Build and sign the `yanezbio://sign` link that launches YanezYID.

    [:octicons-arrow-right-24: Deep link signing](deep-link-signing.md)

-   :material-shield-check:{ .lg .middle } **Callback verification**

    ---

    Verify the BLS12-381 signature yourself. Never trust a client-asserted
    result.

    [:octicons-arrow-right-24: Callback verification](callback.md)

-   :material-api:{ .lg .middle } **Record validation**

    ---

    One endpoint confirms a `yid` and its key binding against the Yanez registry.

    [:octicons-arrow-right-24: Backend API](api/backend-api.md)

</div>

## Environments

| Environment | Base URL | Use for |
| --- | --- | --- |
| Test | `https://ptest.yanez.ai` | All development and certification work. |
| Production | `https://yid.yanez.ai` | Live traffic, after the [production checklist](production-checklist.md). |

## Keep up to date

<div class="grid cards" markdown>

-   :material-history:{ .lg .middle } **Changelog**

    ---

    API changes, app releases, and breaking-change notices.

    [:octicons-arrow-right-24: Recent releases](changelog/index.md)

-   :material-cellphone-arrow-down:{ .lg .middle } **Download the app**

    ---

    Store links, supported versions, and the deep-link testbed.

    [:octicons-arrow-right-24: Get YanezYID](download.md)

-   :material-lifebuoy:{ .lg .middle } **Support**

    ---

    Contacts, rate limits, key rotation, and escalation paths.

    [:octicons-arrow-right-24: Get help](support.md)

</div>
