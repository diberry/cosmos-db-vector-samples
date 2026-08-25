# General quickstart spine

This file defines the nine-part conceptual spine that every quickstart generated
by the content-generate-quickstarts skill must follow. It describes **semantic
section roles only**. Adapters may add scenario-specific detail to any concept
but may **not** reorder or silently omit a concept. A not-applicable concept
requires recorded source-backed evidence explaining why it does not apply.

Authority: plan at
`C:\my-squad-projects\project-dina-data-ai\projects\data-plus-ai\plans\plan-2026-08-25-1015.md`,
section "General quickstart/scenario spine".

Constitution references (not copied here; the constitutions remain authoritative
in their existing files):

- Base:
  `C:\my-squad-projects\project-dina-data-ai\repos\cosmos-db-vector-samples\.github\QUICKSTART-CONSTITUTION.md`
- Scenario (create-index example):
  `C:\my-squad-projects\project-dina-data-ai\repos\cosmos-db-vector-samples\.github\docs\CREATE-INDEX-CONSTITUTION.md`

---

## Concepts

### 1. Outcome and scope

- **conceptId:** `spine.outcome-and-scope`
- **Section role:** State what the customer builds, what they learn, the
  observable success result, and what the quickstart intentionally does not
  cover.
- **Required evidence:** Scenario definition, constitution scope, and adapter
  outcome claims with source citations.
- **Adapter rule:** Adapters may add scenario-specific outcomes but may not
  reorder or silently omit this concept.

### 2. Architecture and responsibility boundaries

- **conceptId:** `spine.architecture-and-responsibility-boundaries`
- **Section role:** Identify provisioned resources, tool-owned work,
  sample-code work, control-plane work, data-plane work, and cleanup ownership.
- **Required evidence:** Lifecycle steps, SDK surface ownership, and resource
  boundaries from the scenario definition and constitution, with source
  citations.
- **Adapter rule:** Adapters may add scenario-specific boundaries but may not
  reorder or silently omit this concept.

### 3. Prerequisites and access

- **conceptId:** `spine.prerequisites-and-access`
- **Section role:** List subscriptions/accounts, tools, runtime, repository,
  permissions, quotas, and region constraints from adapter evidence.
- **Required evidence:** Language evidence runtime/toolchain, constitution
  prerequisites, and scenario access requirements with citations.
- **Adapter rule:** Adapters may add scenario-specific prerequisites but may not
  reorder or silently omit this concept.

### 4. Provision and configure

- **conceptId:** `spine.provision-and-configure`
- **Section role:** Explain the environment lifecycle, required and optional
  configuration, generated assets, defaults, and safety switches.
- **Required evidence:** Configuration contract, environment variable list,
  default values, safety opt-ins, and configuration loading behavior from the
  constitution and language evidence with citations.
- **Adapter rule:** Adapters may add scenario-specific configuration but may not
  reorder or silently omit this concept.

### 5. Authenticate securely

- **conceptId:** `spine.authenticate-securely`
- **Section role:** Distinguish developer/tool authentication, local code
  authentication, and hosted identity; prefer passwordless patterns unless an
  authority explicitly requires otherwise.
- **Required evidence:** Authentication model, credential type, forbidden
  mechanisms, and developer/hosted identity distinction from the constitution
  with citations.
- **Adapter rule:** Adapters may add scenario-specific authentication detail but
  may not reorder or silently omit this concept.

### 6. Run and understand the code

- **conceptId:** `spine.run-and-understand-the-code`
- **Section role:** Pair each command and module with the concept it
  demonstrates; explain SDK roles and evidence-backed language differences.
- **Required evidence:** Entry point, run command, module responsibilities,
  snippets, SDK reference links, and documented language differences from
  language evidence with citations.
- **Adapter rule:** Adapters may add scenario-specific code explanations but may
  not reorder or silently omit this concept.

### 7. Validate the outcome

- **conceptId:** `spine.validate-the-outcome`
- **Section role:** Define expected output, deterministic checks,
  troubleshooting boundaries, and success criteria.
- **Required evidence:** Validation command, success criteria, and expected
  output from the scenario definition and language evidence with citations.
- **Adapter rule:** Adapters may add scenario-specific validation but may not
  reorder or silently omit this concept.

### 8. Clean up safely

- **conceptId:** `spine.clean-up-safely`
- **Section role:** Separate application-level cleanup, local generated-file
  cleanup, and environment deprovisioning, with destructive actions explicitly
  gated.
- **Required evidence:** Cleanup script path, destructive operation opt-in,
  resource boundaries, and lifecycle skill references from the scenario
  definition and constitution with citations.
- **Adapter rule:** Adapters may add scenario-specific cleanup but may not
  reorder or silently omit this concept.

### 9. Continue learning

- **conceptId:** `spine.continue-learning`
- **Section role:** Link to relevant concepts, SDK references, and the next
  scenario using target-repository conventions.
- **Required evidence:** Reference links from the scenario definition and SDK
  reference links from language evidence with citations.
- **Adapter rule:** Adapters may add scenario-specific learning paths but may
  not reorder or silently omit this concept.

---

## Out of scope

The following concerns are **editorial-gate-owned** and must NOT appear in this
spine reference, in adapter spine files, or in technical-layer schemas. They are
owned exclusively by `mosaic:writer` or a contract-compatible approved
equivalent editorial gate:

- Backtick formatting rules (e.g. backticks around hardcoded values and options)
- Microsoft branding rules
- Product branding presentation rules
- Microsoft Learn / Mosaic metadata shape and rendering
- Style conventions
- Accessibility conventions
- Terminology presentation rules
- Heading, list, table, and link presentation formatting
- Scanability conventions

The technical layers pass semantic roles, sourced claims, protected tokens,
audience intent, product identities, link targets, and metadata facts to the
editorial gate in a structured semantic content package. The editorial gate
determines how those facts are expressed for publication.
