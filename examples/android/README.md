# Android Examples

The Android partner flow has two independent handoffs:

- Open YanezYID with the signed HTTPS App Link described in
  [Deep Link Signing](../../docs/deep-link-signing.md).
- Receive the optional agent-authorization `terms.return_url` after the user
  approves and finishes the YanezYID review.

For the return path, register the partner callback activity with
`android:launchMode="singleTask"` and handle the URL in both `onCreate()` and
`onNewIntent()`. This returns the user to the original pending order instead of
creating a second activity with empty order state.

Persist the attempt ID and order context before dispatch. On return, redraw the
waiting-for-authorization screen and resume polling the same attempt. Treat the
URL only as a navigation signal: verify the receipt, consume the authorization,
and then show the order confirmation.

See [Android App Integration](../../docs/platforms/android.md#agent-authorization-return)
for the manifest and activity examples.
