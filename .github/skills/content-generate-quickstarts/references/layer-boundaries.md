# Layer boundaries

## Three-layer ownership

| Layer | Scope | Owns |
|---|---|---|
| **A — General framework** | All quickstart scenarios | Scenario schema, general conceptual spine, stage orchestration, timing/quality evidence, semantic content-package contract, protected-technical-contract enforcement, parity/idempotence validation. |
| **B — Base adapter** (e.g. `cosmos-nosql-vector`) | One product family | Authority locations, shared authentication/configuration/lifecycle/language mappings, sourced product identities, lifecycle-skill delegation. |
| **C — Extension adapter** (e.g. `create-index`) | One article/scenario within a product family | Scenario constitution, sample directory mappings, environment contract, protected tokens, resource lifecycle, drift items, target article identifiers. |

## What Layers A–C do NOT own

Publication conventions are exclusively owned by the editorial gate
(`mosaic:writer` or an approved equivalent):

- Backticks around hardcoded values and options.
- Microsoft/product branding and terminology presentation.
- Microsoft Learn/Mosaic metadata requirements.
- Style, accessibility, heading/list/table/link presentation, scanability.

Adapters carry mappings and authority-locator citations. They never copy
constitution rule text as a competing ruleset and never encode editorial
conventions.

## Source-of-truth authority ranking

| Rank | Source | Role |
|---|---|---|
| 1 | Base constitution (`.github/QUICKSTART-CONSTITUTION.md`) | Shared technical contract for all NoSQL quickstarts. |
| 2 | Scenario constitution (e.g. `.github/docs/CREATE-INDEX-CONSTITUTION.md`) | Scenario-specific technical requirements that extend the base. |
| 3 | Current sample implementation, dependency manifests, configuration templates, tests, and committed reference output | Executable evidence per language. |
| 4 | Canonical lifecycle skills and their success criteria | Operational contracts for provision, validate, cleanup, deprovision. |
| 5 | Target repository metadata facts and publication context | Passed through to the editorial gate; not compiled into technical layers. |
| 6 | Existing article/PR text | Update target only — never technical authority. |

## No reference implementation

No single language sample is the reference implementation. The constitutions
define observable behavior. Language-specific code may differ only where SDK
APIs require it. All five language implementations must maintain parity.
