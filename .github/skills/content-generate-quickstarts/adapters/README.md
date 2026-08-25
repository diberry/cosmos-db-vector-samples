# Adapters directory

This directory contains adapter definitions for the `content-generate-quickstarts`
skill. Adapters are organized by product family and scenario.

## Directory layout

```text
adapters/
  cosmos-nosql-vector/          # Layer B — Cosmos NoSQL vector base adapter
    base.yaml                   # Authority locations, shared mappings, product identities
    conceptual-spine.md         # Cosmos-specific additions to the general spine
    create-index.yaml           # Layer C — Article 2/create-index extension
    create-index-spine.md       # Article 2 semantic additions
  scenarios/                    # Goal 1.1 scenario-conformance fixtures
    azure-sql-vector-search.yaml
    redis-vector-search.yaml
  README.md                     # This file
```

## Rules

1. Adapters carry **authority-locator mappings and citations**, never copied
   constitution rule text. Constitution files remain the single source of truth
   and are resolved at run time.

2. Adapters **never encode editorial conventions** — backtick formatting,
   branding presentation, metadata rendering, style, accessibility, and
   terminology treatment are exclusively owned by the editorial gate
   (`mosaic:writer` or an approved equivalent).

3. Each adapter file specifies a `schemaVersion` and an `adapterId`. Base
   adapters declare product-family authorities; extension adapters declare
   `extendsBaseAdapter` to inherit those authorities.

4. Scenario fixtures under `scenarios/` are structural proofs for SMART goal 1.1
   and are NOT implemented scenarios. Unsourced fields are explicitly marked
   `status: not-yet-sourced`.
