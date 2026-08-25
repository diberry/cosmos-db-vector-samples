# Cosmos DB for NoSQL vector — conceptual spine additions

This document defines the Cosmos-specific semantic ADDITIONS to the general
nine-concept quickstart spine. Each section states what the Cosmos NoSQL vector
family adds; it references authority locators rather than copying constitution
prose. Adapters may add scenario-specific detail but may NOT reorder or silently
omit a general concept. A not-applicable item requires recorded evidence.

No editorial, style, branding, or metadata rules appear in this spine.

---

## 1. Outcome and scope

**Cosmos addition:** The customer builds an Azure Cosmos DB for NoSQL
application that performs vector search using `VectorDistance()`. The outcome is
observable through a results table covering configured index types and distance
functions.

- Authority: `QUICKSTART-CONSTITUTION.md § I.1.1`

---

## 2. Architecture and responsibility boundaries

**Cosmos addition:** Two distinct responsibility models exist in this family:

- **Vector-search samples** — data-plane only; infrastructure is pre-provisioned
  by `azd up` and Bicep; sample code never creates or deletes containers.
- **Create-index samples** — control-plane + data-plane; sample code uses ARM
  SDKs for container lifecycle while `azd up` provisions the account, database,
  and Azure OpenAI resource.

Control-plane functions live in a named control-plane module; data-plane
operations live in a separate module.

- Authority: `QUICKSTART-CONSTITUTION.md § I.1.1`, `copilot-instructions.md §
  General NoSQL sample rules`

---

## 3. Prerequisites and access

**Cosmos addition:** Requires Azure subscription, Azure CLI, Azure Developer
CLI, Git, language runtime/toolchain, and the sample repository. Permissions
include management-plane access (for create-index), Cosmos DB Built-in Data
Contributor, and Cognitive Services OpenAI User.

- Authority: `QUICKSTART-CONSTITUTION.md § II, III`

---

## 4. Provision and configure

**Cosmos addition:** `azd up` provisions the Cosmos DB account and Azure OpenAI
resource. The `postprovision` hook restores generated data files. Each language
uses its native configuration-loading mechanism (see base constitution table).
Committed `.env.example` or `appsettings.json` templates are maintained; runtime
configuration files remain gitignored.

- Authority: `QUICKSTART-CONSTITUTION.md § III.3.2`,
  `CREATE-INDEX-CONSTITUTION.md § I.1.4`

---

## 5. Authenticate securely

**Cosmos addition:** Three authentication contexts:

1. **Developer identity** — drives `azd` deployment and local execution via
   `az login` / `azd auth login`.
2. **Local code credential** — `DefaultAzureCredential` for ARM, Cosmos DB, and
   Azure OpenAI clients in local runs.
3. **Hosted managed identity** — `DefaultAzureCredential` resolves to managed
   identity in hosted environments.

Keys, connection strings, and public OpenAI credentials are prohibited.

- Authority: `QUICKSTART-CONSTITUTION.md § II.2.1`,
  `CREATE-INDEX-CONSTITUTION.md § II.2.1`

---

## 6. Run and understand the code

**Cosmos addition:**

- Uses `VectorDistance()` SQL function with `TOP` / `ORDER BY`; no MongoDB wire
  protocol.
- Configurable field names validated against `^[A-Za-z_][A-Za-z0-9_]*$` before
  SQL interpolation.
- One SDK generation per service surface; cross-language parity required; no
  language is the reference implementation.
- SDK-specific insertion strategies differ by language (bulk vs. item-by-item).

- Authority: `QUICKSTART-CONSTITUTION.md § IV, V, VI`

---

## 7. Validate the outcome

**Cosmos addition:** The shared repository validator compares output
structurally against committed `sample-output.txt`. Validation normalizes header
aliases and ignores volatile scores/timings.

- Authority: `CREATE-INDEX-CONSTITUTION.md § VII.7.2`

---

## 8. Clean up safely

**Cosmos addition:** Separates three cleanup scopes:

1. **Application-level cleanup** — control-plane container deletion (for
   create-index) with documented safeguards and opt-in.
2. **Local generated-file cleanup** — canonical cleanup script removes build
   artifacts, dependencies, logs, and optionally copied data.
3. **Environment deprovisioning** — `azd down` removes provisioned Azure
   resources after explicit confirmation.

- Authority: `CREATE-INDEX-CONSTITUTION.md § III.3.2, IX`,
  `samples-cleanup-nosql-create-index SKILL.md`,
  `sample-deprovision-nosql-create-index SKILL.md`

---

## 9. Continue learning

**Cosmos addition:** Links to Cosmos DB for NoSQL vector search documentation,
SDK references per language, and the next scenario using target-repository
conventions. Link targets are metadata facts passed to the editorial gate.

- Authority: target repository publication context (authority rank 5)
