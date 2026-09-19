# CURRENT MISSION

## Mission 001 — Rebuild the source of truth

### Objective
Port the best real HERBARIUM baseline into this repository as a reproducible, testable project without regressing validated behavior.

### Inputs
- live reference: https://herbarium-taccuino-zero.jorrob98.chatgpt.site
- `recovery/HERBARIUM_TEST_PC.html`
- `recovery/candidate-0.6-index.html`
- `docs/history/CHANGELOG_v0.4.md`
- `docs/history/ROADMAP_2027.md`
- `RECOVERY.md`

### Required work
1. Inspect the live reference and recovery files.
2. Identify the most recent/complete behavior; do not assume the oldest standalone HTML is stable.
3. Create a reproducible application baseline in versioned source files.
4. Preserve mobile-first iPhone UX, camera/library flow, local persistence, offline/privacy behavior and prudent reject/unknown logic where actually present.
5. Add automated smoke/regression tests for the recovered baseline.
6. Do not add unrelated new features in this mission.

### Exit gate
- source lives in the repo;
- local build/serve command documented;
- automated tests are repeatable;
- GitHub Actions green;
- no known regression versus the recovered baseline;
- differences from the live reference are documented honestly.

Status: READY
