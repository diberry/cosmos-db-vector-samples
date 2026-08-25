---
name: content-generate-quickstarts
description: Generate, audit, or update Microsoft Learn quickstart content from this repository's constitutions and sample evidence. Use when asked to audit a quickstart PR against the constitutions, generate quickstart drafts, or produce a dry-run content patch. Do not use for live Azure operations, modifying samples, or writing to a documentation repository.
---

# Generate quickstart content

**ORCHESTRATION SKILL.** INVOKES: constitution-driven content generation,
technical validation, cross-language parity checks, and editorial-gate routing.

This is the automation-owned orchestration ENGINE with three explicit layers:

- **Layer A** — General reusable quickstart generation framework.
- **Layer B** — `cosmos-nosql-vector` base adapter.
- **Layer C** — `create-index` baseline extension.

Scenario tools are ADAPTERS plugged into the engine, not handoffs to separate
generators. See `references/layer-boundaries.md` for the ownership boundary.

## USE FOR:

"Audit the create-index PR articles", "generate quickstart drafts",
"produce a dry-run content patch", "check quickstart parity across languages",
"audit a quickstart PR against the constitutions", or "run a dry-run update
for all five create-index articles".

## DO NOT USE FOR:

- Live Azure operations (provision, deprovision, validate samples).
- Modifying sample code, tests, or reference output.
- Writing directly to a documentation repository checkout.
- Updating an external PR, pushing a branch, or changing ADO state.
- Implementing Mosaic/editorial style, branding, or metadata rules — those are
  editorial-gate-owned.

Delegate live lifecycle work to the canonical skills listed in the delegation
table below.

## Modes

| Mode | Behavior |
|---|---|
| `audit` | Read-only comparison of selected articles or a PR against compiled authorities; emits a language-by-requirement coverage matrix. |
| `create` | Generates missing quickstarts from the target repository's base revision using the selected adapters. |
| `update-pr` | Reads an existing PR, preserves unrelated edits, and emits a scoped patch for selected quickstart files and TOC. |

**All modes default to dry-run.** No external target is written without
separate explicit approval.

## Editorial paths

| Path | Behavior | Publication-ready? |
|---|---|---|
| `draft-only` (default) | Byte-identical pass-through of Stage 9 validated drafts. Intentionally skips editorial quality. | **Never** |
| `mosaic` | Invokes `mosaic:writer` after Stage 9 technical validation. Mosaic owns editorial and publication conventions. | Yes, after Stage 11 revalidation passes. |
| `approved-equivalent` | Uses a contract-compatible approved editorial gate with complete repository-local evidence. | Yes, after Stage 11 revalidation passes. |

## Ownership boundary

Layers A–C own technical/source fidelity and semantic structure ONLY. They emit
schema-valid semantic/structured content packages containing sourced claims,
required concepts, protected technical tokens, audience intent, section roles,
link targets, and metadata facts.

The editorial gate (`mosaic:writer` or an approved equivalent) exclusively owns
publication conventions:

- Backticks around hardcoded values and options.
- Microsoft/product branding.
- Microsoft Learn/Mosaic metadata requirements.
- Style, accessibility, terminology presentation, headings/lists/tables/link
  presentation, and scanability.

This skill MUST NOT implement those editorial rules.

### Forbidden editorial transformations

The editorial gate may NOT change:

- Commands and their ordering.
- Environment-variable names.
- Code, code behavior, API/SDK semantics, or configuration values.
- Resource names or boundaries.
- Authentication or cleanup behavior.
- Safety gates.
- Validated technical claims.
- Source citations.
- Language-specific facts.
- Meaning of prerequisites or expected results.

Unclassified changes fail closed.

## Internal stages, artifacts, and gates

Every stage writes named artifacts under:

```text
output\<run-id>\
```

Run-id = timestamp + source revision. Output is isolated by run and remains
inside the sample repository.

| Stage | Action | Required output artifact | Gate before next stage |
|---|---|---|---|
| 1 | Resolve run context | `01-run-context.json` | Schema-valid; all paths absolute, revisions immutable, adapters recognized, editorial path recognized, approved-equivalent gate identity/version/approval complete when selected, target read-only unless write gate present. |
| 2 | Compile authorities | `02-authority-manifest.json` | Every requirement has authority rank, full source path, revision, locator, and `technical` or `editorial-publication` ownership; conflicts stop the run; editorial-publication requirements not compiled into Layers A–C. |
| 3 | Instantiate general framework | `03-general-spine.json`, `03-general-spine.md` | All nine general spine concepts present or have source-backed not-applicable records; no Learn/Mosaic styling, branding, metadata-rendering, or presentation rules embedded. |
| 4 | Apply Cosmos base adapter | `04-cosmos-nosql-vector-contract.json`, `04-cosmos-nosql-vector-spine.md` | Every addition traces to Layer B authority; no constitution text copied as competing ruleset; editorial branding/terminology treatment left to Mosaic. |
| 5 | Apply create-index adapter | `05-create-index-contract.json`, `05-create-index-spine.md` | Article 2 technical coverage complete; conflicting/missing sample evidence stops generation; adapter does not encode backtick, branding, Learn metadata, or other Mosaic conventions. |
| 6 | Extract language evidence | `06-language-evidence\dotnet.json`, `go.json`, `java.json`, `python.json`, `typescript.json` | Each file validates against language-evidence schema; no adapter derives one language from another. |
| 7 | Audit target coverage | `07-coverage-matrix.json`, `07-coverage-matrix.md` | Every contract item classified present, missing, stale, contradictory, or not applicable with evidence. |
| 8 | Render technical drafts and semantic packages | `08-generated\`, `08-semantic-package\`, `08-target.patch`, `08-change-manifest.json` | Path allowlist, semantic section coverage, source-citation, package-schema, protected-token, and unrelated-edit preservation checks pass. No external target written; drafts not marked publication-quality. |
| 9 | Validate technical and constitutional contract | `09-validation-report.md`, `09-parity-matrix.json`, `09-idempotence.json`, `09-protected-technical-contract.json` | All required technical checks pass; any unsupported claim, semantic mismatch, broken protected link, protected-contract gap, package mismatch, or second-run diff blocks Mosaic and release. |
| 10 | Apply or skip editorial quality | Mosaic: `10-mosaic\stage-status.json`, `10-mosaic\input\`, `10-mosaic\revised\`, `10-mosaic\change-report.json`, `10-mosaic\writer-result.json`, `10-mosaic\editorial-validation.json`, `10-mosaic\protected-token-claim-report.json`, `10-mosaic\hash-manifest.json`. Equivalent: `10-equivalent-gate\gate-manifest.json`, `10-equivalent-gate\input\`, `10-equivalent-gate\revised\`, `10-equivalent-gate\editorial-result.json`, `10-equivalent-gate\change-report.json`, `10-equivalent-gate\protected-token-claim-report.json`, `10-equivalent-gate\hash-manifest.json`. Draft only: `10-draft-pass-through\stage-status.json`, `10-draft-pass-through\hash-manifest.json`. All paths: `10-editorial-output-selection.json`. | Mosaic and equivalent runs must prove required editorial conventions were applied, persist schema-valid machine-reviewable evidence, and preserve the protected technical contract. Draft-only input/output hashes must be identical and the run is permanently non-publication-ready. Selection must point only to the correct `revised\` or unchanged Stage 9 draft set. |
| 11 | Revalidate selected editorial output | `11-post-editorial-validation.md`, `11-input-provenance.json`, `11-contract-coverage.json`, `11-parity-matrix.json`, `11-link-report.json`, `11-protected-technical-diff.json`, `11-semantic-package-fidelity.json`, `11-idempotence.json` | Input provenance must match selected Stage 10 revised-output path and hashes. Post-editorial technical revalidation mandatory for Mosaic and approved-equivalent output. Missing/unreadable revised output, hash mismatch, protected change, unsupported claim, semantic-package divergence, parity regression, broken protected link, or second-run diff blocks publication. Draft-only runs may validate unchanged drafts but remain non-publication-ready. |
| 12 | Package evidence and final publication validation | `12-run-summary.md`, `12-timing-metrics.json`, `12-quality-metrics.json`, `12-publication-validation.json`, `12-pending-actions.json` | Summary and evidence fields match prior artifacts; publication readiness false unless Stage 11 passes and a publication-capable editorial gate validated all required publication conventions; external writes and Azure operations enumerated but not executed without explicit approval. |

## Approval gates

Each of the following actions requires separate explicit approval and is only
ENUMERATED in `12-pending-actions.json`, never executed by this skill:

- Writing to a documentation checkout.
- Pushing a branch.
- Changing an external PR.
- Updating ADO.
- Any Azure operation.

## Run

From the repository root with PowerShell 7+:

### Audit all five PR articles (dry-run)

```pwsh
pwsh -NoProfile -File scripts\Invoke-QuickstartFactory.ps1 `
  -Operation audit `
  -BaseAdapter cosmos-nosql-vector `
  -ExtensionAdapter create-index `
  -Language All `
  -Target "https://github.com/MicrosoftDocs/nosql-docs-pr/pull/642" `
  -EditorialPath draft-only `
  -OutputRoot ".github\skills\content-generate-quickstarts\output" `
  -DryRun
```

### Create quickstart drafts (dry-run)

```pwsh
pwsh -NoProfile -File scripts\Invoke-QuickstartFactory.ps1 `
  -Operation create `
  -BaseAdapter cosmos-nosql-vector `
  -ExtensionAdapter create-index `
  -Language All `
  -EditorialPath draft-only `
  -OutputRoot ".github\skills\content-generate-quickstarts\output" `
  -DryRun
```

### Update PR with scoped patch (dry-run)

```pwsh
pwsh -NoProfile -File scripts\Invoke-QuickstartFactory.ps1 `
  -Operation update-pr `
  -BaseAdapter cosmos-nosql-vector `
  -ExtensionAdapter create-index `
  -Language All `
  -Target "https://github.com/MicrosoftDocs/nosql-docs-pr/pull/642" `
  -EditorialPath draft-only `
  -OutputRoot ".github\skills\content-generate-quickstarts\output" `
  -DryRun
```

### Parameter reference

| Parameter | Type | Default | Description |
|---|---|---|---|
| `-Operation` | `string` | (required) | `audit`, `create`, or `update-pr`. |
| `-BaseAdapter` | `string` | (required) | Base adapter identifier, e.g. `cosmos-nosql-vector`. |
| `-ExtensionAdapter` | `string` | (required) | Extension adapter identifier, e.g. `create-index`. |
| `-Language` | `string` | `All` | `All`, `Python`, `TypeScript`, `DotNet`, `Go`, or `Java`. |
| `-Target` | `string` | `$null` | PR URL, local article paths, or base revision. Required for `audit` and `update-pr`. |
| `-EditorialPath` | `string` | `draft-only` | `draft-only`, `mosaic`, or `approved-equivalent`. |
| `-OutputRoot` | `string` | `.github\skills\content-generate-quickstarts\output` | Run output directory. |
| `-DryRun` | `switch` | `$true` | Dry-run is the default. Pass `-DryRun:$false` to enable writes after approval. |
| `-SourceRevision` | `string` | Current HEAD | Explicit sample commit to pin. |

## Delegation table

This skill composes and cites the canonical lifecycle skills. It does NOT
duplicate their operational logic or invoke live Azure mutations during
ordinary content generation.

| Lifecycle step | Canonical skill | When used |
|---|---|---|
| Provision | `sample-provision-nosql-create-index` | Only with separate explicit approval for live validation. |
| Run and validate | `sample-validate-nosql-create-index` | Only with separate explicit approval for live validation. |
| Clean generated local files | `samples-cleanup-nosql-create-index` | Only with separate explicit approval for local cleanup. |
| Deprovision | `sample-deprovision-nosql-create-index` | Only with separate explicit approval for teardown. |

## Examples

- "Audit all five create-index PR articles against the constitutions."
- "Generate draft quickstarts for all five languages."
- "Produce a dry-run update patch for the TypeScript create-index article."
- "Run a cross-language parity check for the create-index quickstarts."

## Success criteria

- Every generated or audited artifact validates against its stage gate.
- Every technical claim traces to an authoritative source.
- The general nine-concept spine appears in every candidate.
- The Article 2 create-index spine appears in every create-index candidate.
- Cross-language semantic parity holds; differences are evidence-backed.
- No constitution text is copied as a competing ruleset.
- No editorial/style/branding/metadata rules appear in Layers A–C.
- `draft-only` runs are never marked publication-ready.
- A second run over unchanged sources and target content produces no diff.
- No persistent artifact is created outside the sample repository.
- No external write, Azure operation, or ADO update occurs without explicit
  approval.

## Troubleshooting

| Symptom | Cause | Action |
|---|---|---|
| Stage 2 stops with conflict | Constitutions and sample evidence disagree | Resolve the contradiction in the source before rerunning. |
| Stage 5 reports missing evidence | A language sample lacks required files or config | Verify the sample directory and its committed assets. |
| Stage 9 fails parity check | One language diverges from the shared contract | Review the language-evidence artifacts for the divergent language. |
| Stage 11 rejects editorial output | Mosaic or equivalent gate changed a protected token | Inspect the change report and protected-technical-diff for the affected hunk. |
| `12-publication-validation.json` shows `false` | Editorial gate not run or Stage 11 failed | Check editorial path selection and Stage 11 artifacts. |
