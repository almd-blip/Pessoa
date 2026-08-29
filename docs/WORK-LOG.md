# Pessoa — Work Log

## Purpose

This file is the persistent chronological record of significant engineering work on Pessoa. It provides a compact, auditable handoff between development sessions so that project state can be reviewed without repeatedly reconstructing the full conversation history.

This file records **what happened**. It does not itself authorise changes or create formal product decisions.

## Governance distinction

- **WORK-LOG.md** — records completed work, verification, current engineering state, unresolved questions, deferrals, and next actions.
- **DECISIONS.md** — records formal decisions that have been approved and entered into the project decision register.
- **ROADMAP.md** — records the authoritative roadmap and stage status. Stage advancement remains subject to the repository's governance rules.

## Recording rules

Significant engineering sessions should append a dated entry rather than rewriting previous history.

Entries should distinguish, where relevant:

- **FACT** — confirmed from the repository or directly observed during verification.
- **CONTRACT** — required by an authoritative governance document.
- **PROPOSAL** — recommended design or implementation choice that has not itself become a formal decision.
- **DECISION** — an approved decision already recorded in `docs/DECISIONS.md`.
- **OPEN DECISION** — a material question requiring human approval.
- **DEFERRED** — intentionally not addressed in the current stage or task.

## Entry template

```text
## YYYY-MM-DD — <short description>

**Stage:** <current stage>
**Branch / HEAD:** <branch> / <commit SHA>

### Work completed
- ...

### Verification
- ...

### Files changed
- ...

### Decisions
- ...

### Open decisions
- ...

### Deferred / out of scope
- ...

### Next action
- ...
```

## 2026-08-29 — Work-log established

**Stage:** Stage 2 — Schema

### FACT

A persistent project work log has been established at `docs/WORK-LOG.md` so future development sessions can record engineering updates in the repository itself.

### Governance

Formal decisions belong in `docs/DECISIONS.md`; roadmap stage status belongs in `docs/ROADMAP.md`; this file is a work-history and handoff record only.

### Next action

Future significant engineering sessions should append a dated entry containing branch/HEAD, work completed, verification, files changed, decisions, open questions, deferrals, and next action. No stage advancement should be inferred from a work-log entry alone.
