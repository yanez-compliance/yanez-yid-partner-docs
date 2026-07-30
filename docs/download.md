---
title: Download and Versions
description: Get the Yanez Biometrics app, check supported versions, and test deep links.
---

# Download YanezYID

**YanezYID** performs biometric capture on the user's device. Biometric data
never leaves the device — the app returns only a `yid` and a BLS-signed
attestation to your callback.

Partner applications do **not** embed this app. They hand off to it with a
[signed deep link](deep-link-signing.md).

<div class="app-panel" markdown>

![YanezYID app icon](assets/yanezyid-icon.jpg){ .app-panel__icon }

<div class="app-panel__body" markdown>
<p class="app-panel__name">YanezYID</p>
<p class="app-panel__sub">YANEZ COMPLIANCE INC. · Free · Utilities</p>

<div class="app-panel__badges" markdown>
[![Download on the App Store](assets/badge-app-store.svg)](https://apps.apple.com/us/app/yanezyid/id6784028862){ .badge .badge--apple data-os="ios" }
[![Get it on Google Play](assets/badge-google-play.png)](https://play.google.com/store/apps/details?id=ai.yanez.yid){ .badge .badge--google data-os="android" }
</div>

<p class="app-panel__req">Requires iOS 17.6 or later (v1.0) · Android 9.0 or later (v1.1.0)</p>
</div>

</div>

## Supported versions

| | iOS | Android |
| --- | --- | --- |
| Current release | **1.1.0** | **1.1.0** |
| Requires | iOS 17.6 or later | Android 9.0 or later |
| Package identifier | `com.yanez.baund` | `ai.yanez.yid` |
| Deep-link scheme | `yanezbio://` | `yanezbio://` |
| Last updated | 15 July 2026 | 28 July 2026 |

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

## URI schemes by build

Production builds register `yanezbio://sign` on both platforms. Test schemes
are **not** symmetric across platforms:

| Build | iOS scheme | Android scheme |
| --- | --- | --- |
| Production | `yanezbio://sign` | `yanezbio://sign` |
| Dev | `yanezbio://sign` | `yanezbio-dev://sign` |
| Partner test | `yanezbio://sign` | `yanezbio-partner://sign` |

iOS currently registers only `yanezbio://` — there is no suffixed test scheme —
so iOS test builds share the production scheme. Do not assume an Android-style
suffix will resolve on iOS.

Integrate against `yanezbio://` for production on both platforms.

## Deep-link testbed

Use this to confirm the app opens and rejects an unsigned link before you wire
up your backend signer.

### 1. Confirm the app is installed and the scheme resolves

An unsigned link should open the app and be **rejected** with *"Untrusted
signing request"*. That rejection is the successful outcome of this step — it
proves the scheme resolved and signature enforcement is active.

```text
yanezbio://sign?message=eyJ2IjoxfQ&callback=https%3A%2F%2Fexample.com%2Fcb&method=redirect&request_id=00000000-0000-0000-0000-000000000000&event=enroll&description=Scheme+test&app_id=ptr_your_id
```

=== "Android"

    ```bash
    adb shell am start -a android.intent.action.VIEW -d "yanezbio://sign?..."

    # dev build flavor
    adb shell am start -a android.intent.action.VIEW -d "yanezbio-dev://sign?..."
    ```

=== "iOS Simulator"

    ```bash
    xcrun simctl openurl booted "yanezbio://sign?..."
    ```

=== "Device"

    Host the link on an HTTPS page you control and tap it, or render it as a QR
    code and scan it with the device camera. Pasting a custom scheme directly
    into a mobile browser address bar is unreliable.

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
| Nothing happens when the link opens | App not installed, or the scheme does not match the installed build flavor. Check the table above. |
| "Untrusted signing request" | `app_sig` is missing, malformed, or does not verify against your registered public key. Also shown when `app_id` is absent. |
| App opens but no callback arrives | `method=post` to a non-allowlisted host — silently dropped on Android. Switch to `redirect` to confirm, then request allowlisting. |
| Signature verifies locally but not in the app | `app_sig` must be the **last** parameter, and signed over the exact unsigned URL bytes with no re-ordering or re-encoding. |
