# Yanez Partner Docs

Public partner integration documentation for YanezYID.

These docs are authored in Markdown and can be published as a static HTML site
with MkDocs Material.

## Local Preview

Install MkDocs Material:

```bash
python -m pip install mkdocs-material
```

Run the docs site:

```bash
mkdocs serve
```

The site is served at `http://127.0.0.1:8000`.

## Structure

```text
docs/
  index.md
  overview.md
  concepts.md
  authentication.md
  api/
    backend-api.md
    errors.md
  platforms/
    web.md
    android.md
    ios.md
  testing.md
  production-checklist.md
```

## Publishing

This repository is intended to be public. Before publishing, confirm that all
examples use sandbox values, placeholder credentials, and public URLs only.

