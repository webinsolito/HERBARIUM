# HERBARIUM — Director Log

This log is maintained by the hourly director.

## 2026-09-19 — Bootstrap
- Repository `webinsolito/HERBARIUM` initialized.
- Operational contract, roadmap and recovery state created.
- Historical recovery artifacts imported without promoting them to stable.
- GitHub Actions guard enabled.
- Mission 001 assigned: rebuild a reproducible source-of-truth baseline.

## 2026-09-19 — Mission 001 / local persistence slice
- Verified candidate head `5414e2d5c115b6ce819a2d958f9e76e54cdfbd2c`: HERBARIUM Guard run 35420460651 completed SUCCESS.
- Mission 001 remains incomplete; no new feature mission opened.
- Compared recovered candidate 0.6 shell with current source slice: recovered product includes broader Field/Atlas/Academy/Book structure while current source remains intentionally minimal.
- Implemented local persistence for UNKNOWN observations only. Stored records contain timestamp, captured roles and `status: UNKNOWN`; no image bytes, guessed species or verified-species increment are persisted.
- Extended smoke regression guards to require local persistence and forbid VERIFIED status in the current baseline.
- Candidate commits: `28a9e7d30218400dc7a6e6a341d7f6cfe97fbb96`, `a0518fe5d6b01a7f305cd70e4eb9ac3017fec66f`.
- Promotion remains forbidden until the new candidate CI is green and Mission 001 exit gate is met.
