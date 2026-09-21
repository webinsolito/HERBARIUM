# HERBARIUM — Director Log

This log is maintained by the hourly director.

## 2026-09-20 — Mission 001 / explicit negative gate final verification
- Re-read README, DIRECTOR, CURRENT_MISSION, DIRECTOR_LOG and ROADMAP and independently checked candidate, main relation, draft PR #1 and Actions.
- Verified candidate product/test head `b1345025d0b6e0e6b45df2fb95bc85e11ab265fe`: HERBARIUM Guard #152 completed SUCCESS. The previous queued status is superseded.
- Audited `src/app.js`, `src/negative-gate.mjs` and `tests/smoke.mjs`: the save path reads the explicit `negativeSignal`, stores REJECT plus `negativeCategory` for object/animal/print/tablecloth, leaves absent/unknown signals UNKNOWN, and the executable gate never returns VERIFIED.
- Confirmed this is NOT automatic pixel recognition; the current gate consumes an explicit user signal only. No Core ML/browser model/offline pixel inference claim is made.
- Created rollback `rollback/mission-001-negative-connected-b1345025` before advancing mission documentation.
- Closed only the explicit-negative sub-slice. Mission 001 remains IN PROGRESS and main/stable remains unpromoted.
- Next single slice: evaluate a genuinely local/offline plant-vs-non-plant pixel detector for license, commercial reuse, maintenance, browser/iPhone compatibility and conservative UNKNOWN fallback before integrating any automatic REJECT.
- Candidate documentation head after this log update requires a fresh HERBARIUM Guard before it can be considered green or synchronized to preview.


## 2026-09-21 — Mission 001 / UI rebuild: design system + Home
- Re-read README, DIRECTOR, CURRENT_MISSION, DIRECTOR_LOG and ROADMAP; checked candidate branch, PR #1, open issues and GitHub Actions.
- Verified PR #1 head before the cycle at `728381e52d602abe9d631c24994be30c5ab0be64`; no open issues were returned.
- Created rollback `rollback/mission-001-ui-pre-rebuild-728381e5` before product changes.
- Rebuilt `src/index.html` as a modern mobile-first Home with four primary user destinations, a simplified botanical hero, local summary and bottom navigation.
- Replaced `src/styles.css` with a shared light botanical design system (ivory/cream, forest/sage, warm bronze, larger touch targets, softer cards) while preserving selectors used by observation, collection, book, atlas and academy pages.
- Extended `tests/smoke.mjs` with executable assertions for the rebuilt Home structure, key CTAs, mobile tab bar and design-system tokens.
- Product/test commits: `2ab26870`, `81365216`, `88452d50`.
- HERBARIUM Guard #164 completed SUCCESS on product/test head `88452d50e92a207b7e7ee04067d17b4e7a223a25`.
- Scientific status behavior, IndexedDB persistence and UNKNOWN/REJECT rules were not changed in this slice.
- Final documentation head still requires its own Guard before preview synchronization.
- Next after preview sync: continue the UX rebuild on observation/capture and result presentation, then resume the still-open local detector integration slice.
