# Pessoa AI Agent Rules

## Authority

Before changing code, an AI agent must read:

1. `docs/ROADMAP.md` — current stage and implementation ceiling.
2. The contract for the current stage — currently `docs/P0-TRUST.md`.
3. This file — permitted agent behaviour.
4. `docs/DECISIONS.md` — recorded architectural decisions.

## Stage control

The `current_stage` in `docs/ROADMAP.md` is authoritative.

- Agents must not infer, redefine, skip, or advance the current stage.
- Only an authorised human may change `current_stage`.
- The current stage is the maximum permitted implementation scope.
- Later-stage work may be inspected, discussed, or documented, but must not be implemented.

## Change discipline

Prefer the smallest change that satisfies the current-stage contract.

Do not use a current-stage task as an excuse to:

- redesign unrelated architecture;
- refactor working functionality speculatively;
- change the visual language;
- migrate storage;
- introduce future-stage features;
- remove existing functionality.

If a necessary fix appears to require later-stage work, stop and report the dependency rather than silently expanding scope.

## Before implementation

First audit the existing implementation relevant to the task. Identify:

- current behaviour;
- affected files and pathways;
- existing abstractions that should be reused;
- risks and dependencies;
- tests that cover the behaviour.

Do not replace working architecture merely because another design would be preferable.

## During implementation

- Preserve existing functionality unless the current contract explicitly requires a change.
- Keep privacy boundaries explicit and truthful.
- Do not expose secrets or credentials.
- Do not silently introduce fallback behaviour that changes processing location.
- Reuse authoritative shared layers where they already exist.
- Do not create duplicate policy or routing logic unnecessarily.

## Before declaring completion

An agent must provide evidence, not merely state that a requirement is satisfied.

Report:

1. files changed and why;
2. tests added or modified;
3. tests run and results;
4. acceptance criteria passed, partial, or failed;
5. remaining exceptions;
6. deferred work belonging to later stages.

## Stop conditions

Stop and ask for human direction if:

- the requested change conflicts with the current-stage contract;
- implementation would cross the stage boundary;
- a privacy or security decision is ambiguous;
- preserving existing behaviour conflicts with a proposed change;
- a schema or storage redesign appears necessary before its scheduled stage.

## Stage advancement

Passing tests does not itself advance the roadmap.

A stage is complete only when its acceptance criteria have been verified and an authorised human changes `current_stage` in `docs/ROADMAP.md`.
