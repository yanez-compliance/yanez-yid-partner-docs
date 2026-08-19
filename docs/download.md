---
title: Download and Versions
description: Get the YanezYID app, check supported versions, and test deep links.
---

# Download YanezYID

**YanezYID** performs biometric capture on the user's device. Biometric data
never leaves the device — the app returns only a `yid` and a BLS-signed
attestation to your callback.

Partner applications do **not** embed this app. They hand off to it with a
[signed deep link](deep-link-signing.md).

<div class="app-panel" markdown>
<p class="app-panel__name">YanezYID</p>
<p class="app-panel__sub">YANEZ COMPLIANCE INC. · Free · Utilities</p>

<div class="app-panel__badges" markdown>
[![Download on the App Store](assets/badge-app-store.svg)](https://apps.apple.com/us/app/yanezyid/id6784028862){ .badge .badge--apple data-os="ios" }
[![Get it on Google Play](assets/badge-google-play.png)](https://play.google.com/store/apps/details?id=ai.yanez.yid){ .badge .badge--google data-os="android" }
</div>

<p class="app-panel__req">Requires iOS 17.6 or later (v1.3.0) · Android 9.0 or later (v1.3.0)</p>
</div>

## Supported versions

| | iOS                         | Android                     |
| --- |-----------------------------|-----------------------------|
| Current release | **1.3.0**                   | **1.3.0**                   |
| Requires | iOS 17.6 or later           | Android 9.0 or later        |
| Package identifier | `com.yanez.baund`           | `ai.yanez.yid`              |
| Deep link | `https://yid.yanez.ai/open` | `https://yid.yanez.ai/open` |
| Last updated | 18 August 2026              | 18 August 2026              |

Publisher: YANEZ COMPLIANCE INC.

!!! info "Minimum supported version"

    Yanez has not yet declared a minimum supported app version — every released
    build is currently supported. Once a floor is set, users below it will fail
    the deep-link handoff rather than degrade gracefully, so it will be
    announced as a **Breaking** entry in the [changelog](changelog/index.md).

!!! tip "Version skew across platforms"

    iOS and Android ship independently and are not on matched version numbers.
    Gate behaviour on what the callback actually returns, never on an assumed
    app version.

## Deep-link URLs by environment

Deliver the signed deep link as an HTTPS App Link (iOS Universal Link / Android
App Link). The base URL depends on the environment, not the build flavor:

| Environment | `DEEP_LINK_BASE` |
| --- | --- |
| Production | `https://yid.yanez.ai/open` |
| Partner test (ptest) | `https://ptest.yanez.ai/open` |

If YanezYID isn't installed, or the installed version hasn't claimed the
domain yet, the link falls back to the App Store or Google Play instead of
failing silently. See [Deep Link Signing](deep-link-signing.md#url-format) for
the full format.

### Custom scheme (deprecated)

The `yanezbio://` custom scheme is deprecated: it still resolves, but it fails
silently when the app isn't installed. Migrate to the HTTPS form. For existing
integrations, production builds register `yanezbio://sign` on both platforms.
Test schemes are **not** symmetric across platforms:

| Build | iOS scheme | Android scheme |
| --- | --- | --- |
| Production | `yanezbio://sign` | `yanezbio://sign` |
| Dev | `yanezbio://sign` | `yanezbio-dev://sign` |
| Partner test | `yanezbio://sign` | `yanezbio-partner://sign` |

iOS currently registers only `yanezbio://` — there is no suffixed test scheme —
so iOS test builds share the production scheme. Do not assume an Android-style
suffix will resolve on iOS.

## Deep-link testbed

Use this to confirm the app opens and rejects an unsigned link before you wire
up your backend signer.

### 1. Confirm the app is installed and the link resolves

An unsigned link should open the app and be **rejected** with *"Untrusted
signing request"*. That rejection is the successful outcome of this step — it
proves the link resolved and signature enforcement is active. If the link opens
the store instead, the app isn't installed or hasn't claimed the domain yet
(see [Troubleshooting](#troubleshooting)).

```text
https://ptest.yanez.ai/open?message=eyJ2IjoxfQ&callback=https%3A%2F%2Fexample.com%2Fcb&method=redirect&request_id=00000000-0000-0000-0000-000000000000&event=enroll&description=Link+test&app_id=ptr_your_id
```

=== "Android"

    ```bash
    adb shell am start -a android.intent.action.VIEW -d "https://ptest.yanez.ai/open?..."
    ```

=== "iOS Simulator"

    ```bash
    xcrun simctl openurl booted "https://ptest.yanez.ai/open?..."
    ```

=== "Device"

    Render the link as a QR code and scan it with the device camera, or host it
    on an HTTPS page you control and tap it.

The deprecated custom scheme opens the same way with `yanezbio://sign?...` in
place of the HTTPS base (`yanezbio-dev://sign?...` or
`yanezbio-partner://sign?...` for the Android `dev` and `partner` build
flavors). Pasting a custom scheme directly into a mobile browser address bar is
unreliable.

### 2. Confirm a signed link is accepted

Generate a properly signed link with your backend — see
[Deep Link Signing](deep-link-signing.md) — and open it the same way. The app
should now show your `description` and proceed with the flow.

### 3. Confirm the callback lands

| `method` | Requirement |
| --- | --- |
| `post` | HTTPS URL on a Yanez-allowlisted domain (currently `yanez.ai` and its subdomains). Android silently drops anything else. |
| `redirect` | No domain restriction. Use this while testing against your own domain. |

Start with `method=redirect` against your own host, then switch to `post` once
Yanez has allowlisted your callback domain.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Nothing happens when a custom-scheme link opens | App not installed, or the scheme does not match the installed build flavor (see the deprecated custom-scheme table above). Switch to the HTTPS App Link, which falls back to the store instead. |
| HTTPS deep link always opens the store, even with the app installed | The installed app version hasn't claimed the `DEEP_LINK_BASE` domain yet (App Links / Universal Links). Expected until the user updates to an app version that supports it — not an integration bug on your side. |
| "Untrusted signing request" | `app_sig` is missing, malformed, or does not verify against your registered public key. Also shown when `app_id` is absent. |
| App opens but no callback arrives | `method=post` to a non-allowlisted host — silently dropped on Android. Switch to `redirect` to confirm, then request allowlisting. |
| Signature verifies locally but not in the app | `app_sig` must be the **last** parameter, and signed over the exact unsigned URL bytes with no re-ordering or re-encoding. |
