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

## 2026-09-19 — Mission 001 / photo evidence persistence slice
- Verified previous candidate head `8535722478760f1b7b3c85ec626f3ca4f955bdd3`: HERBARIUM Guard run 35423044811 completed SUCCESS.
- Mission 001 remains the only active mission; no unrelated feature work opened.
- Found a real source-of-truth gap: observation metadata persisted, but selected photo evidence itself was discarded, so a saved observation could not preserve the evidence it was based on.
- Implemented local-only image evidence persistence using FileReader data URLs for each selected role; records remain `status: UNKNOWN` and no species is guessed or verified.
- Added failure handling so an unreadable image does not create a partial observation.
- Extended smoke guards to require persisted image evidence while continuing to forbid VERIFIED status and uncalibrated percentages.
- Candidate commits: `33f07b94b69b5e5aaddcdead6107f7f7331e5549`, `0103b138730ecd3e6400acfd4c46e88bea647d16`.
- Promotion remains forbidden until GitHub Actions is green on the new head and the broader Mission 001 recovery gate is satisfied.
