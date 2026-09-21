# CURRENT MISSION

## Mission 001 — Rebuild the source of truth

### Objective
Port the best real HERBARIUM baseline into this repository as a reproducible, testable project without regressing validated behavior.

### Current state
IN PROGRESS on `candidate/mission-001-source-recovery`.

A reproducible source slice exists in `src/` with mobile-first capture inputs, conservative UNKNOWN behavior, local IndexedDB evidence persistence, explicit local/offline/error states, separate document-level mobile pages with distinct URLs, and recovered Collection, Book, Atlas and conservative Academy read surfaces backed only by real local observations. These are recovery-layer improvements only and do not claim complete feature parity with v0.5/0.6. This is intentionally NOT promoted to main.

### Completed slice — explicit negative/non-plant gate
The candidate now connects an explicit user-provided negative signal to the real save path. `object`, `animal`, `print` and `tablecloth` produce REJECT; absent or unknown signals remain UNKNOWN. Executable fixture tests cover those four categories and assert that the gate never returns VERIFIED. Candidate head `b1345025` passed HERBARIUM Guard #152.

This is deliberately NOT described as automatic image recognition: no local pixel detector/model is installed yet, and the UI states that the negative signal is not inferred automatically from the image.

### Open slice — local automatic plant-vs-non-plant detector feasibility
One coherent next step only: determine and, only if technically/licensing-safe, integrate the smallest local/offline detector that can consume actual image pixels before save and return only a negative/non-plant signal or UNKNOWN. Do not identify species in this slice.

Required work:
1. evaluate candidate local/open-source components for license, maintenance, browser/iPhone compatibility, model size and commercial reuse;
2. prefer a deterministic local model/runtime with no paid/cloud API and no upload requirement;
3. keep UNKNOWN as mandatory fallback for unavailable runtime, model-load failure, unsupported browser, low confidence or ambiguous output;
4. REJECT may be emitted automatically only from an actually executed pixel/model result with a documented conservative threshold; no filename/metadata/colour-only shortcut may masquerade as recognition;
5. preserve the explicit manual negative signal as a separate auditable path;
6. add executable tests for model unavailable/error/ambiguous cases and negative fixtures before any automatic REJECT claim;
7. do not publish an accuracy percentage until a separate benchmark is built and calibrated.

### Exit gate for active slice
- selected component has documented license/commercial-use status and compatibility notes, or the slice records a justified NO-GO without adding unsafe code;
- actual pixel inference is wired before any automatic REJECT claim;
- model/runtime failure and ambiguity always resolve to UNKNOWN, never VERIFIED;
- no network/cloud dependency is required by the core path;
- explicit manual REJECT continues to work independently;
- automated regressions are repeatable and GitHub Actions is green on the resulting candidate head.

### Active slice — UI rebuild: design system + Home

User review of the public preview identified the recovered UI as materially below the desired product quality. This cycle therefore treats visual/UX recovery as part of rebuilding the source of truth, without changing the scientific status model or local persistence path.

Implemented candidate slice:
- rebuilt `src/index.html` around four obvious mobile actions: camera observation, library observation, collection and botanical book;
- replaced the dark technical visual system with a light botanical design system using ivory/cream surfaces, forest/sage hierarchy, warm bronze accents, softer cards and larger touch targets;
- added a mobile bottom navigation while preserving every existing document URL;
- preserved local stats IDs, IndexedDB-backed app wiring, UNKNOWN/REJECT behavior and the existing observation routes;
- extended executable smoke coverage to lock the new Home structure and core design tokens;
- rollback point: `rollback/mission-001-ui-pre-rebuild-728381e5`;
- product/test head `88452d50e92a207b7e7ee04067d17b4e7a223a25` passed HERBARIUM Guard #164.

Exit gate for this slice:
- Home and shared design system are materially rebuilt rather than recolored;
- camera/library, collection, book, atlas and academy links remain present;
- mobile breakpoint and capture layout regression assertions remain executable;
- no VERIFIED species or synthetic product data is introduced;
- GitHub Actions is green on the final candidate head before preview synchronization.

The local automatic detector feasibility work remains open and resumes after this UI recovery slice; it has not been declared complete.

### Remaining Mission 001 work
1. Complete the detector feasibility/integration slice above.
2. Continue feature-by-feature comparison against the recovered RC3 standalone and candidate 0.6.
3. Recover only additional validated application structure/assets justified from recovered evidence; do not reintroduce synthetic achievements, territories or species.
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
