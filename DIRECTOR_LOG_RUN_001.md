# Director Run 001 — 2026-09-19

## Control
- main head verified: `7966ac68eab375b9bfb4a8ecd944f7a67a80f692`.
- main HERBARIUM Guard run 35418552362: SUCCESS.
- Mission 001 was READY and no prior implementation cycle existed.
- Recovery artifacts inspected: standalone RC3 and candidate 0.6. Candidate 0.6 references split assets not yet recovered into the repository, so it cannot honestly be promoted as runnable source yet.

## Direction
Continue Mission 001 only. No new feature mission opened.

## Execution
Created candidate branch `candidate/mission-001-source-recovery` from main rollback point. Added a deliberately conservative reproducible source slice:
- `src/index.html`
- `src/app.js`
- `src/styles.css`
- `tests/smoke.mjs`
- `package.json`

The slice provides mobile-first photo inputs and refuses to fabricate identification: without a validated botanical engine it stays UNKNOWN. It does not claim recovered feature parity.

## Verification
- GitHub Actions was triggered on candidate commits.
- At the end of this run, candidate Guard run 35418669427 for head `896d7d53706a1541136eeed8bddaad35f5e9e250` was still IN PROGRESS, therefore this cycle is NOT considered complete and nothing is promoted.
- Real iPhone/browser/Core ML/offline-device tests were not executed.

## Next
First priority next cycle: inspect the final candidate Action result. If red, fix it before anything else. If green, continue recovering the complete candidate 0.6 source/assets and expand regression coverage before considering promotion.
