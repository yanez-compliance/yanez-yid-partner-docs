# Android App Integration

Android integrations use YanezYID on Android or an SDK flow for user
capture and platform attestation, while partner secrets stay on the partner
backend.

## Responsibilities

| Component | Responsibility |
| --- | --- |
| Partner Android app | Starts the user flow and displays status. |
| YanezYID (Android) | Performs biometric capture and YanezYID-side operations. |
| Partner backend | Signs partner API requests and validates resulting `yid` values. |
| Yanez backend | Verifies partner signatures, attestation, and record state. |

## Public Key Discovery

When the Android app needs to verify a partner-signed payload, it can fetch the
partner's active public keys:

```http
GET /api/partners/{partner_id}/public-keys
```

## App Handoff

YanezYID on Android opens via a signed deep link — the same signed link
contract as iOS. Deliver it as an **HTTPS App Link**:
`{DEEP_LINK_BASE}?...` (e.g. `https://yid.yanez.ai/open?...`). The link is
verified against `/.well-known/assetlinks.json` on that domain and falls back
to the Play Store automatically when the app isn't installed or hasn't claimed
the link yet, so it is safe to render as a QR code.

The **custom scheme** `yanezbio://sign?...` (a `BROWSABLE` intent filter on
the `yanezbio` scheme, with no Digital Asset Links verification) is
**deprecated**. It still works but fails silently if the app isn't installed —
migrate to the HTTPS form. See
[Custom Scheme (Deprecated)](../deep-link-signing.md#custom-scheme-deprecated).

A partner delivers the link as a QR code or tappable link and the OS routes it
to the installed YanezYID app.

See [Deep Link Signing](../deep-link-signing.md) for the full parameter
reference, the `DEEP_LINK_BASE` per environment, signing steps, and a Python
example.

The partner private key remains on the backend. The Android app receives only
public or short-lived flow data.

## Agent Authorization Return

An agent-authorization request may include an optional `terms.return_url` when
YanezYID should return the user to the partner app after an approval. Use an
absolute custom-scheme or HTTPS URL without embedded credentials, and register
any custom scheme in the partner app.

Configure the callback activity as `singleTask`. `singleTop` is not sufficient:
when YanezYID opens the return URL from its own task, Android may create a second
partner activity with a fresh `ViewModel` instead of returning to the order that
is waiting for authorization.

```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTask">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
            android:scheme="partner-app"
            android:host="authorization-complete" />
    </intent-filter>
</activity>
```

Handle the URL both when Android creates the activity and when it delivers the
URL to the existing activity:

```kotlin
class MainActivity : ComponentActivity() {
    private val store: OrderViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        store.handleAuthorizationReturn(intent?.data)
        // Install the app UI.
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        store.handleAuthorizationReturn(intent.data)
    }
}
```

Before dispatching the authorization, preserve the merchant-generated attempt ID
and the order context needed to redraw the pending screen. At minimum, retain them
in a `SavedStateHandle` for activity and process recreation; use durable encrypted
app storage if the order must also survive removal of the Android task. When the
app starts or receives the return URL and an attempt is still active:

1. Show the existing order's waiting-for-authorization screen.
2. Resume polling with the same attempt ID. Do not create a replacement request.
3. Retrieve and verify the signed approval receipt.
4. Consume the single-use authorization.
5. Show the order confirmation only after consumption succeeds.

YanezYID opens the URL only after the approval is synchronized and the user
finishes the review. The URL receives no appended result fields and is not proof
of approval; continue polling and verify the signed authorization receipt before
acting. See [Agent Authorization](../agent-authorization.md#return-to-a-mobile-app)
for the request example and security requirements.

## Completion

After the Android flow completes, the partner backend should validate any
returned `yid` using:

```http
POST /api/partners/records/validate
```
