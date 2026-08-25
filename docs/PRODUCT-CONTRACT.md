# Pessoa Product Contract

**Status:** COMPLETE  
**Stage:** 0 — Product Contract  
**Purpose:** Define what Pessoa is before engineering how it works.

## Product identity

Pessoa is a personal environment for people who think, create, research, write, organise and develop projects. It supports researchers, writers, creatives, project managers and other forms of intellectual and creative work.

Pessoa is the **environment in which the work takes place**. AI is a capability within that environment, not the environment itself.

> **The model helps think and write. Pessoa remains responsible for structure, evidence, citations and guardrails.**

Pessoa helps people think, write, organise evidence, develop ideas and work with their projects without requiring them to surrender their work to the cloud.

## Core relationship

Pessoa is organised around five linked concepts:

**Person → Project → Work Mode → Work Product → Privacy State**

These concepts define the product contract. Later engineering stages must preserve this conceptual relationship unless the contract is deliberately revised by an authorised human.

## 1. Person

The **Person** is the human using Pessoa.

Pessoa is a personal, user-centred system. The person's work, projects, preferences, reflections and AI interactions belong in the context of that person rather than existing as disconnected application features.

The Person is not itself a Work Product.

## 2. Project

A **Project** is the organising context for a person's work.

Projects provide the primary contextual boundary through which related work, tools, AI tasks and outputs can be understood.

A project may contain multiple kinds of work and multiple Work Products.

A project may have different expressions while remaining one intellectual or creative project. Like the different expressions or voices of the same writer, these forms may differ without losing the identity and continuity of the underlying project.

## 3. Work Mode

A **Work Mode** describes what the person is doing within a project at a given time.

Examples may include research, writing, analysis, reflection, planning, editing, project management or other supported modes of work.

Work Mode is contextual. It should guide relevant tools, AI behaviour and presentation without creating unnecessary duplication of the underlying work.

## 4. Work Product

A **Work Product** is a meaningful expression or artefact produced, developed or maintained through the person's work.

Examples may include research notes, evidence collections, questions, drafts, analyses, manuscripts, plans, datasets, presentations or other substantive outputs.

A Work Product is distinct from the tool used to create it and from the AI task used to assist with it.

A single Project may therefore contain multiple Work Products representing different expressions of the same intellectual or creative work.

**Stage 2 will define and implement the concrete `WorkProduct[]` schema. This contract does not define that schema.**

## 5. Privacy State

**Privacy State** describes the applicable processing and privacy condition for the person's work and AI interactions.

It is a first-class product concern, not an implementation detail.

Where AI processing is involved, Pessoa must distinguish the applicable processing route and privacy boundary. The Stage 1 Trust/P0 contract defines the operational requirements for this.

## The Pessoa research and creative cycle

Pessoa can conceptually support a recurring cycle of:

**Collect → Read → Question → Connect → Evaluate → Write → Cite → Reconsider → Export**

This is a conceptual model, not a mandatory linear workflow. People may begin at any point, move backwards, repeat stages or branch into different directions.

AI operates **inside** these activities rather than replacing them.

The same environment can support other forms of intellectual and creative work that do not follow this exact cycle.

## AI as a capability layer

AI capability is defined by **tasks and contextual capacity**, rather than dependence on a particular model or provider.

Pessoa may support different levels of AI task capability, for example:

| AI task capability | Light | Standard | Deep | Taurus |
|---|:---:|:---:|:---:|:---:|
| Summarise a short passage | ✓ | ✓ | ✓ | ✓ |
| Rewrite selected text | ✓ | ✓ | ✓ | ✓ |
| Generate questions | ✓ | ✓ | ✓ | ✓ |
| Brainstorm | ✓ | ✓ | ✓ | ✓ |
| Basic feedback | ✓ | ✓ | ✓ | ✓ |
| Analyse a long paper | Limited | ✓ | ✓ | ✓ |
| Compare multiple documents | — | ✓ | ✓ | ✓ |
| Extract evidence across documents | — | Limited | ✓ | ✓ |
| Large-scale literature synthesis | — | Limited | ✓ | ✓ |
| Complex reasoning | Limited | ✓ | ✓ | ✓✓ |
| Large document context | Limited | Moderate | Large | Very large |
| Cross-document connections | — | Limited | ✓ | ✓✓ |
| Extended research/creative task | — | Limited | ✓ | ✓✓ |

These capability levels are conceptual product categories. They do not prescribe particular models, providers, token limits or implementation mechanisms.

**Taurus** denotes sustained, high-context work across a substantial intellectual or creative project rather than simply a larger or more powerful named model.

AI task capability may evolve as models and local technologies evolve without changing the underlying product contract.

## Ownership, inclusion and capacity

> **The user's work is always theirs.**

Pessoa does not claim ownership of, restrict access to, or hold a user's intellectual or creative work hostage to a subscription.

> **Core → Pessoa is genuinely free.**

The core Pessoa environment — including its care, accessibility, organisation and fundamental working capabilities — is not itself a paywalled product feature. A person with modest needs may use Pessoa completely free, indefinitely.

> **Core + more storage + AI → paid capacity.**

The free tier begins with a smaller storage capacity. This is a capacity boundary, not a restriction on ownership or access to the core environment. The precise capacity is a technical and commercial decision and is not fixed by this contract.

Paid tiers may provide additional capacity, including:

- greater storage;
- greater AI capacity;
- larger document/context capacity;
- access to more demanding AI task capabilities.

Payment increases capacity; it does not purchase the user's work, determine who deserves access to Pessoa, or purchase the fundamental Pessoa environment.

All users, whether paying or not, can:

- add projects;
- import their work;
- export their work;
- delete their work;
- access their existing work;
- use the core Pessoa capabilities available within their capacity.

Professional users may require substantially greater storage and AI capacity than the free tier provides. This is a legitimate basis for paid capacity without turning the core environment into a paywalled product.

Pessoa's commitment to free core access is part of its principles of **inclusion, accessibility and care**.

> **Pessoa does not paywall its core USP: the environment and care.**

## Relationship rule

The concepts should remain connected as follows:

```text
Person
  ↓
Project
  ↓
Work Mode
  ↓
Work Product
  ↓
Privacy State
```

This is a conceptual product relationship, not a requirement that the data model literally become a single nested object.

## Engineering boundary

This document defines **what Pessoa is**, not how it must be implemented.

Therefore it does not prescribe:

- a storage engine;
- a database schema;
- `WorkProduct[]` implementation details;
- UI structure;
- React component structure;
- PWA architecture;
- Tauri architecture;
- AI provider implementation;
- commercial price points or exact storage quotas.

Those are governed by later stages and subsequent product decisions.

## Stage 0 completion

Stage 0 is complete. This document is the authoritative conceptual foundation for the staged Pessoa roadmap.

**Stage 1 — Trust/P0 is now the active implementation stage.**
