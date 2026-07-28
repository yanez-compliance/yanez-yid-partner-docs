# Yanez Biometrics Partner Integration

> **DRAFT** — This documentation is a work in progress.

Use these docs to integrate a partner application with Yanez Biometrics.

Yanez supports partners whose user experience starts from:

- a web application
- an Android application
- an iPhone application

All integration paths share the same backend trust model: the partner backend
keeps partner signing keys private, Yanez stores only partner public keys, and
partner-to-Yanez backend requests are signed.

## Choose Your Path

| Partner application | Start here |
| --- | --- |
| Web app | [Web Apps](platforms/web.md) |
| Android app | [Android Apps](platforms/android.md) |
| iPhone app | [iPhone Apps](platforms/ios.md) |
| Backend integration | [Backend API](api/backend-api.md) |

## Recommended Reading Order

1. [Overview](overview.md)
2. [Core Concepts](concepts.md)
3. [Authentication](authentication.md)
4. Your platform guide
5. [Deep Link Signing](deep-link-signing.md)
6. [Callback Verification](callback.md)
7. [Backend API](api/backend-api.md)
8. [Testing](testing.md)
9. [Production Checklist](production-checklist.md)
10. [Glossary](glossary.md)

## Environments

| Environment | Base URL |
| --- | --- |
| Test | `https://ptest.yanez.ai` |
| Production | `https://yid.yanez.ai` |

