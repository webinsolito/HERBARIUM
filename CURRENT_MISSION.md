# CURRENT MISSION

## Mission 001 — Rebuild the source of truth

### Objective
Port the best real HERBARIUM baseline into this repository as a reproducible, testable project without regressing validated behavior.

### Current state
IN PROGRESS on `candidate/mission-001-source-recovery`.

A reproducible source slice now exists in `src/` with mobile-first capture inputs, conservative UNKNOWN behavior, local IndexedDB evidence persistence, explicit local/offline/error states, isolated hash-addressable mobile screens, and recovered Collection, Book, Atlas and conservative Academy read surfaces backed only by real local observations. These are recovery-layer improvements only and do not claim complete feature parity with v0.5/0.6. This is intentionally NOT promoted to main.

### Recovered and guarded in current source
- camera/library-compatible image inputs and multi-view evidence roles;
- bounded local image preparation and IndexedDB persistence;
- conservative UNKNOWN-only observation semantics;
- Home/capture mobile UI foundation;
- Collection read path for real UNKNOWN observations only, with no starter plants or fake verified species;
- Book / Volume I pending-observation read path with no fake species;
- Atlas read path for already-stored finite coordinates and region names, with no cloud/map/GPS request added;
- Academy read path tied only to real UNKNOWN observations, using existing multi-view evidence to suggest documentation exercises without inventing lessons, species or progress.

### Remaining required work
1. Continue feature-by-feature comparison against the recovered RC3 standalone and candidate 0.6.
2. Add explicit negative/non-plant safeguards and regression fixtures for objects, animals, prints and tablecloth-like inputs before any identification claim.
3. Recover only additional validated application structure/assets that can be justified from recovered evidence; do not reintroduce synthetic achievements, territories or species.
4. Preserve offline/privacy behavior and avoid synthetic species, territories, coordinates or achievements.
5. Verify GitHub Actions green on every candidate product/test head before preview synchronization or promotion.

### Exit gate
- complete source-of-truth baseline lives in the repo;
- local build/serve command documented;
- automated tests repeatable and green;
- GitHub Actions green on candidate head;
- no known regression versus recovered baseline;
- differences from live reference documented honestly.

Status: IN PROGRESS — DO NOT PROMOTE
