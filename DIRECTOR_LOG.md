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
- Implemented local persistence for UNKNOWN observations only and regression guards against VERIFIED status.

## 2026-09-19 — Mission 001 / photo evidence persistence slice
- Verified previous candidate head `8535722478760f1b7b3c85ec626f3ca4f955bdd3`: HERBARIUM Guard completed SUCCESS.
- Implemented local-only image evidence persistence; records remain `status: UNKNOWN`.
- Added failure handling so an unreadable image does not create a partial observation.

## 2026-09-19 — Mission 001 / bounded evidence persistence
- Independently verified candidate head `24f75e92a0c716f82d0efb9d8b714637cfb3cf3e`: HERBARIUM Guard completed SUCCESS.
- Added deterministic client-side evidence preparation: maximum edge 1600 px, JPEG quality 0.78 and local-only canvas conversion.
- Candidate head `12e9b5f39b0fbd285d548f3cea5fda17acc428d2` subsequently verified with Guard run 35428457337 SUCCESS.

## 2026-09-19 — Mission 001 / scalable local evidence store
- Independent control verified `12e9b5f39b0fbd285d548f3cea5fda17acc428d2` and Guard run 35428457337 SUCCESS before changing code.
- Mission 001 remains incomplete; no unrelated feature mission opened.
- Replaced synchronous `localStorage` evidence persistence with IndexedDB object storage, keeping evidence as compressed JPEG `Blob` values rather than base64 strings. This removes the previous small localStorage quota bottleneck and base64 storage overhead while remaining local-only/offline-capable.
- Observation writes are transaction-based; failed/aborted writes are rejected instead of being reported as successful. Stats now count the IndexedDB observation store.
- UNKNOWN semantics remain unchanged; verified species count stays zero and no identification engine is simulated.
- Extended smoke guards to require IndexedDB/object-store/Blob persistence and explicitly forbid fallback writes to localStorage.
- Candidate commits: `b9e0725c289792fce414d8bd488764d90e30b595`, `27420e77cc9fed55460816d76332057bd4ef38d7`.
- Guard run 35428635147 for `27420e77...` was queued at final verification, therefore this slice is NOT yet considered completed or promotable.
- Next action: verify that Guard; on failure fix it before any further recovery work. On success continue Mission 001 feature-parity recovery.

## 2026-09-19 — Mission 001 / independent control + H24 handoff
- Verified Guard run `35428635147` for candidate `27420e77cc9fed55460816d76332057bd4ef38d7`: completed SUCCESS. The IndexedDB persistence slice is therefore externally green.
- Confirmed Mission 001 remains IN PROGRESS; no unrelated feature mission opened and stable/main product code was not promoted.
- Confirmed no open PRs or issues at control time.
- Confirmed GitHub-native Local Autopilot run `35433476891` passed candidate verification, restored the pinned local-AI cache, installed the verified llama.cpp runtime, loaded the pinned Apache-2.0 Qwen coding model and entered the bounded patch-generation/test step. Because that run was still in progress, no generated patch is claimed as accepted yet.
- Synchronized the public candidate preview to the latest externally green product head `27420e77` and labelled it explicitly as CANDIDATE PREVIEW. Preview publication is not stable promotion.
- Next action: inspect the Local Autopilot result/PR and HERBARIUM Guard. If green, accept only the bounded Mission 001 improvement; if red, fix that failure before any other work.

## 2026-09-19 — H24 speed-mode handoff
- Controller main updated for deterministic zero-cost fast paths before local AI.
- Redundant scheduled checker removed; Local Autopilot remains the H24 worker.
- This log-only candidate commit intentionally triggers the green Guard -> Local Autopilot event chain to verify the optimized path.

- Speed verification retry: controller syntax fix 875afef4 is now present on main; trigger Guard -> Local Autopilot again.

- Direct-candidate speed verification: main controller fa4532f/e4297b9 removes PR bottleneck and obsolete automerge; trigger Guard -> Local Autopilot.

## 2026-09-19 — Mission 001 / independent rejection audit
- Independently inspected Local Autopilot run `35438997195`: the workflow was marked SUCCESS, but its model proposal was actually rejected as invalid JSON and no code change was accepted in that cycle. The SUCCESS label was therefore not sufficient evidence of a completed improvement.
- Verified that the candidate already contains autopilot commit `ebf63d872bbe5bb8f2f9619b71db85ac69298952`, adding the IndexedDB `loadObservations()` read path and its smoke assertion. Because that bot push did not itself produce a new Guard run, it is not treated as externally green yet.
- Fixed the controller workflow on main at `1e4b6baa2897e9c47542dc704e2c52544ba00272`: Local Autopilot now records its run output and explicitly fails the workflow when `LOCAL_AUTOPILOT_REJECTED` is emitted, instead of silently reporting a rejected cycle as SUCCESS.
- This Director commit intentionally advances the candidate through a normal authenticated repository write so HERBARIUM Guard is triggered against the current candidate contents, including `ebf63d87`.
- Mission 001 remains IN PROGRESS and main/stable product code remains unpromoted.
- Next action: require HERBARIUM Guard green on this candidate head before preview synchronization or further recovery work.

## 2026-09-20 — Mission 001 / candidate guard verified
- Re-read README, DIRECTOR, CURRENT_MISSION, DIRECTOR_LOG and ROADMAP before acting.
- Verified candidate `9a878f76bdaa5df1c2ee8b12dda54ec6ec99acd2`: HERBARIUM Guard run #85 (push) completed SUCCESS and run #86 (pull_request) completed SUCCESS.
- Compared `main` to `candidate/mission-001-source-recovery`: candidate remains diverged (32 commits ahead, 59 behind), so no unsafe merge/reset or stable promotion was attempted.
- Mission 001 remains IN PROGRESS; the candidate source slice is reproducible/tested but is not yet claimed equivalent to recovered v0.5/v0.6.
- This log update is intentionally the only repository change in this cycle; it must itself pass HERBARIUM Guard before it can become the new externally green candidate head.
- Next action after green Guard: synchronize the public candidate preview to this validated head, then continue feature-parity recovery without opening unrelated features.


## 2026-09-20 — Mission 001 / UI consistency slice
- Re-read README, DIRECTOR, CURRENT_MISSION, DIRECTOR_LOG and ROADMAP before acting.
- Verified prior UI foundation head `01edccfeaa0d621406f7aaf3b23731494b44d71f`: HERBARIUM Guard #89 (push) SUCCESS and #90 (pull_request) SUCCESS.
- Created rollback branch `rollback/mission-001-ui-consistency-01edccfe` before the new non-trivial UI change.
- Single mission for this cycle: improve visual consistency of the existing recovery Home and capture flow without adding or simulating product capabilities.
- Unified section headers, privacy/status badges, step cards, action hierarchy, capture tiles and the conservative UNKNOWN result presentation.
- Preserved all four existing image inputs, offline/local semantics and conservative UNKNOWN behavior; no species identification was added.
- No real-iPhone or real-browser visual test is claimed in this cycle.
- This candidate head must pass HERBARIUM Guard before preview synchronization or any further UI recovery work.
- Next action after a green Guard: synchronize the validated candidate preview, then continue Mission 001 with the next highest-priority verified recovery gap.
