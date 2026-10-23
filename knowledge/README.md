# Knowledge sources

Markdown files in this folder are ingested into the AI knowledge base by
`npm run ingest`.

Only files placed here are read. The pipeline never picks up files from
elsewhere on disk (PRD §33).

## File format

Each file is a markdown document with a small frontmatter block:

```markdown
---
title: A short, human readable title
source_type: public_article
classification: PUBLIC
version: 1
---

The body of the document. Phone numbers are redacted automatically.
```

| Field            | Required | Notes                                                                              |
| ---------------- | -------- | ---------------------------------------------------------------------------------- |
| `title`          | no       | Falls back to the first `#` heading of the body.                                     |
| `source_type`    | no       | Falls back to a value derived from the file name. `unknown` when it cannot be derived. |
| `classification` | no       | One of `PUBLIC`, `PROFESSIONAL`, `CONFIDENTIAL`, `PRIVATE` (PRD §34). Derived from the source type when omitted. |
| `version`        | no       | A positive integer. Defaults to `1`. Bump it when the content changes.               |

`README.md` files are treated as documentation for this folder and are never
ingested.
