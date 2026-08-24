# Pessoa P0 — Trust Contract

**Stage:** 1 — Trust / P0  
**Status:** ACTIVE  
**Gate:** HARD GATE

## Purpose

P0 establishes trustworthy AI routing and processing boundaries without redesigning Pessoa's data model or storage architecture.

## Non-negotiable requirements

1. **No automatic local → cloud fallback.** A local failure must never silently move processing to a cloud provider.
2. **Provider choice must be explicit.** The user must be able to understand and choose the AI provider/route where applicable.
3. **Processing location must be visible.** The UI must truthfully distinguish on-device/browser-local processing from cloud/external processing.
4. **Browser-local providers must actually route from the browser.** Configuration alone does not establish locality; the execution path must be verified.
5. **Cloud credentials remain server-side.** Secrets must not be exposed in client code, bundles, configuration, logs, or browser-visible responses.
6. **AI tasks must use the shared task layer.** Existing AI entry points should converge on the authoritative task/execution pathway rather than duplicating routing logic.
7. **Research-integrity rules must be applied consistently.** Research-related AI execution must use the existing integrity/provenance rules regardless of provider.
8. **Structured outputs must be validated at runtime where schemas are declared.** TypeScript types, prompts, or parsing alone are not sufficient.
9. **Preserve existing functionality and UI.** P0 is a hardening pass, not a redesign.
10. **No WorkProduct/schema redesign yet.** Do not introduce `WorkProduct[]`, redesign persistence, migrate storage, or begin Stage 2+ work.

## Privacy invariant

> A failure of a more private processing route must never automatically escalate the task to a less private processing route.

In particular, **LOCAL → CLOUD requires an explicit user decision**.

## Acceptance principle

P0 is complete only when the implementation and tests provide evidence that these requirements hold in the actual execution path, not merely in UI copy or configuration.

## Out of scope

Do not implement:

- Stage 2 schema redesign or migration;
- IndexedDB migration;
- PWA work;
- Tauri/native desktop work;
- unrelated feature development;
- speculative architecture rewrites;
- visual redesign.

Future-stage findings belong in `docs/DECISIONS.md` or a dedicated deferred-work record and must remain unimplemented.
