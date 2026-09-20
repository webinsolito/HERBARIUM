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
