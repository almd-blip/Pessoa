# Pessoa Engineering Roadmap

## Current stage

```yaml
current_stage: 1
stage_name: "Trust / P0"
status: "ACTIVE"
implementation_ceiling: 1
```

**Only an authorised human may change `current_stage`. Agents must not advance the stage.**

## Product sequence

### Stage 0 — Product Contract

Person → Project → Work Mode → Work Product → Privacy State

### Stage 1 — Trust / P0

AI routing, privacy, provenance, shared task layer.

**Hard gate.**

### Stage 2 — Schema

`WorkProduct[]`, backward-compatible migration of existing data.

**No storage-engine migration yet.**

### Stage 3 — UI / Application Architecture

Contextual project-centred UI + `App.tsx` decomposition.

### Stage 4 — Data Durability

`localStorage → IndexedDB`, carefully migrated.

### Stage 5 — PWA

Installability + robust offline experience.

### Stage 6 — Desktop

Tauri + serious local AI/native capability.

### Continuous

Evaluation, accessibility, regression and trust testing throughout.

## Stage gate rule

The current stage is the **maximum permitted implementation scope**.

An agent may:

- inspect later-stage work;
- identify dependencies;
- document deferred work;
- recommend future changes.

An agent must not implement later-stage work while the current stage is active.

A later stage opens only after the current stage's acceptance criteria have been verified and an authorised human changes `current_stage` here.

## Scope test

Before implementing a change, ask:

> Which stage does this belong to, and does it depend on a stage that is not complete?

If it belongs to a later stage, **defer it**.

## Current gate

Pessoa is currently at **Stage 1 — Trust / P0**.

Stage 1 must be verified before Stage 2 work begins.
