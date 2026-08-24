# Pessoa Product Contract

**Status:** COMPLETE  
**Stage:** 0 — Product Contract  
**Purpose:** Define the product abstraction before engineering it.

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

## 3. Work Mode

A **Work Mode** describes what the person is doing within a project at a given time.

Examples may include research, writing, analysis, reflection, planning, editing or other supported modes of work.

Work Mode is contextual. It should guide relevant tools, AI behaviour and presentation without creating unnecessary duplication of the underlying work.

## 4. Work Product

A **Work Product** is a meaningful artefact produced, developed or maintained through the person's work.

Examples may include research notes, drafts, analyses, manuscripts, plans, datasets or other substantive outputs.

Work Product is distinct from the tool used to create it and from the AI task used to assist with it.

**Stage 2 will define and implement the concrete `WorkProduct[]` schema. This contract does not define that schema.**

## 5. Privacy State

**Privacy State** describes the applicable processing/privacy condition for the person's work and AI interactions.

It is a first-class product concern, not an implementation detail.

Where AI processing is involved, the product must distinguish the applicable processing route and privacy boundary. The Stage 1 Trust/P0 contract defines the operational requirements for this.

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
- AI provider implementation.

Those are governed by later stages.

## Stage 0 completion

Stage 0 is complete when this product contract is accepted as the authoritative conceptual foundation for the staged Pessoa roadmap.

**Stage 1 — Trust/P0 is now the active implementation stage.**
