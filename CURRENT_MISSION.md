# CURRENT MISSION

## Mission 001 — Rebuild the source of truth

### Objective
Port the best real HERBARIUM baseline into this repository as a reproducible, testable project without regressing validated behavior.

### Current state
IN PROGRESS on `candidate/mission-001-source-recovery`.

A first reproducible source slice now exists in `src/` with mobile-first capture inputs, conservative UNKNOWN behavior, local serve command and an automated smoke test. The candidate also contains a shared mobile UI foundation and a coherent Home/capture visual shell; these are recovery-layer improvements only and do not claim feature parity with v0.5/0.6. This is intentionally NOT promoted to main.

### Remaining required work
1. Compare the recovered RC3 standalone and candidate 0.6 behavior feature-by-feature.
2. Recover the complete application structure/assets needed by candidate 0.6 instead of keeping only a minimal shell.
3. Preserve camera/library flow, local persistence, offline/privacy behavior, collection/book/atlas/academy features that are actually present and validated.
4. Add regression tests for recovered core flows and explicit non-plant/UNKNOWN safeguards.
5. Verify GitHub Actions green on the candidate head before any promotion.

### Exit gate
- complete source-of-truth baseline lives in the repo;
- local build/serve command documented;
- automated tests repeatable and green;
- GitHub Actions green on candidate head;
- no known regression versus recovered baseline;
- differences from live reference documented honestly.

Status: IN PROGRESS — DO NOT PROMOTE
