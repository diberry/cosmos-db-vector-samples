# Article 2 / create-index — conceptual spine additions

This document defines the Article 2 semantic additions nested under the general
nine-concept spine and the Cosmos DB for NoSQL vector base spine. It follows the
plan's seven required items exactly. Each section states semantic roles and
required concepts only — no editorial, style, branding, or metadata rules.
Authority locators reference the source; they do not copy constitution prose.

---

## 1. Customer outcome and two core ideas

The customer learns how to:

- **Control plane:** Use the language's Azure Resource Manager SDK to create,
  verify, and delete two containers with immutable vector embedding and index
  policies.
- **Data plane:** Use the Cosmos DB SDK to load documents and compare Cosine,
  DotProduct, and Euclidean queries across DiskANN and QuantizedFlat.

The observable success result is a six-row results table covering both index
types and all three distance functions, followed by successful cleanup.

- Authority: `CREATE-INDEX-CONSTITUTION.md preamble, § VI`

---

## 2. Responsibility boundaries

- `azd up` provisions the account, Azure OpenAI resource, RBAC, and the
  `HotelsCreateIndex` database; the postprovision hook restores generated data
  files.
- Sample code never creates, updates, or deletes the database.
- The control-plane module owns container creation, verification, and guarded
  container cleanup.
- The data-plane module owns document insertion and `VectorDistance()` queries.
- `azd down` removes the provisioned Azure environment after testing is
  complete.

- Authority: `CREATE-INDEX-CONSTITUTION.md § III.3.1, IX`

---

## 3. Prerequisites

- Azure subscription, Git, language runtime/toolchain, Azure CLI, Azure
  Developer CLI, and the sample repository.
- `azd auth login` for provisioning/deprovisioning and `az login` or
  `azd auth login` for local `DefaultAzureCredential`.
- Management-plane permission, Cosmos DB Built-in Data Contributor, and
  Cognitive Services OpenAI User.

- Authority: `QUICKSTART-CONSTITUTION.md § II`,
  `CREATE-INDEX-CONSTITUTION.md § II.2.1`

---

## 4. Authentication model

- Developer identity drives `azd` deployment and local execution.
- Code uses one `DefaultAzureCredential` model for ARM, Cosmos DB, and Azure
  OpenAI clients.
- Hosted execution uses managed identity.
- Keys, connection strings, and public OpenAI credentials are prohibited.

- Authority: `QUICKSTART-CONSTITUTION.md § II.2.1`,
  `CREATE-INDEX-CONSTITUTION.md § II.2.1`

---

## 5. Configuration contract

- Show all required variables using exact constitution names (nine required,
  plus configurable defaults).
- Explain language-native configuration loading and whether a template is
  automatically loaded.
- Separate required values from optional defaults.
- Explain shared container defaults, custom-name deletion opt-in,
  distinct-name validation, field-name validation, and the region-specific
  data file.

- Authority: `CREATE-INDEX-CONSTITUTION.md § I.1.1, I.1.2, I.1.3, I.1.4`

---

## 6. Run and understand the code

- Map each command and source module to provisioning, control-plane,
  data-plane, output, and cleanup concepts.
- Explain immutable policies, index type versus query distance function,
  partition scoping, parameterized embeddings, and validated field-name
  interpolation.

- Authority: `CREATE-INDEX-CONSTITUTION.md § III, IV`,
  `QUICKSTART-CONSTITUTION.md § IV, V`

---

## 7. Validate and clean up

- Run the canonical shared validator and require its five-language success
  condition only when live evidence is authorized.
- Use the canonical local cleanup skill for generated files.
- Explain guarded control-plane deletion of the two sample containers.
- Require explicit confirmation before the canonical deprovision skill runs
  `azd down --force`.

- Authority: `CREATE-INDEX-CONSTITUTION.md § VII.7.2, VII.7.3, IX`
