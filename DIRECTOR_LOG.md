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
