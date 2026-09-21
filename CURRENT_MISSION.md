# CURRENT MISSION

## Mission 001 — Rebuild the source of truth

### Objective
Port the best real HERBARIUM baseline into this repository as a reproducible, testable project without regressing validated behavior.

### Current state
IN PROGRESS on `candidate/mission-001-source-recovery`.

A reproducible source slice exists in `src/` with mobile-first capture inputs, conservative UNKNOWN behavior, local IndexedDB evidence persistence, explicit local/offline/error states, separate document-level mobile pages with distinct URLs, and recovered Collection, Book, Atlas and conservative Academy read surfaces backed only by real local observations. These are recovery-layer improvements only and do not claim complete feature parity with v0.5/0.6. This is intentionally NOT promoted to main.

### Completed slice — explicit negative/non-plant gate
The candidate connects an explicit user-provided negative signal to the real save path. `object`, `animal`, `print` and `tablecloth` produce REJECT; absent or unknown signals remain UNKNOWN. Executable fixture tests cover those four categories and assert that the gate never returns VERIFIED.

This is deliberately NOT described as automatic image recognition: no validated local pixel detector/model is installed yet.

### Open slice — local automatic plant-vs-non-plant detector feasibility
Evaluate and, only if technically/licensing-safe, integrate a local/offline detector that consumes actual image pixels before save and returns only a negative/non-plant signal or UNKNOWN. Do not identify species in this slice.

Required constraints:
1. license/commercial use, maintenance, browser/iPhone compatibility and model size must be checked;
2. no mandatory paid/cloud API;
3. unavailable runtime, model-load failure, unsupported browser, low confidence or ambiguity => UNKNOWN;
4. automatic REJECT only from actually executed pixel/model inference with conservative threshold;
5. explicit manual negative signal remains separate and auditable;
6. executable regressions required before any automatic REJECT claim;
7. no accuracy percentage before a separate calibrated benchmark.

### Active slice — UI rebuild: approved compact Home fidelity
The prior Home rebuild remained visually too close to a desktop landing page and diverged materially from the user-approved mobile mockup. The current correction treats that as a blocking UX regression.

Implemented:
- Home constrained to a compact app viewport with `max-width:520px` even on desktop instead of expanding into a wide two-column landing;
- new local photographic botanical hero asset `src/assets/hero-approved.webp` derived from the approved visual direction;
- headline, photographic hero and green primary camera CTA composed as one mobile-first section;
- three compact visual cards immediately below for Library, Observations and Botanical Book;
- compact environmental banner and bottom navigation;
- visible technical network badge removed from the Home while the `network` element remains available to existing application logic through a visually-hidden status;
- existing routes, local counters, privacy/offline behavior and conservative status logic preserved;
- rollback: `rollback/ui-major-home-before-cc72a38e`;
- final product/test head `0d40c2633418bfdd76d283ba68c781c99f0b597d` passed HERBARIUM Guard #180.

Exit gate for this UI slice:
- Home remains visually compact/app-like on wide screens rather than stretching into a desktop landing;
- approved photographic hero asset is present locally in the candidate;
- Camera, Library, Observations, Book, Academy and Atlas navigation remain available;
- local stats IDs remain wired;
- smoke tests protect the 520px Home constraint, hero asset and new structural classes;
- no fake species or synthetic observations are introduced;
- final candidate head must be green before preview synchronization.

The detector feasibility work remains open and resumes after the visual recovery is accepted.

### Remaining Mission 001 work
1. Complete the detector feasibility/integration slice above.
2. Continue feature-by-feature comparison against the recovered RC3 standalone and candidate 0.6.
3. Recover only validated application structure/assets justified from evidence; do not reintroduce synthetic achievements, territories or species.
4. Preserve offline/privacy behavior and avoid synthetic species, territories, coordinates or achievements.
5. Verify GitHub Actions green on every candidate product/test head before preview synchronization or promotion.

### Mission 001 exit gate
- complete source-of-truth baseline lives in the repo;
- local build/serve command documented;
- automated tests repeatable and green;
- GitHub Actions green on candidate head;
- no known regression versus recovered baseline;
- differences from live reference documented honestly.

Status: IN PROGRESS — DO NOT PROMOTE
