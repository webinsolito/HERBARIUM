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
- Replaced synchronous `localStorage` evidence persistence with IndexedDB object storage, keeping evidence as compressed JPEG `Blob` values rather than base64 strings.
- Observation writes are transaction-based; failed/aborted writes are rejected instead of being reported as successful.
- UNKNOWN semantics remain unchanged; verified species count stays zero and no identification engine is simulated.
- Extended smoke guards to require IndexedDB/object-store/Blob persistence and explicitly forbid fallback writes to localStorage.
- Candidate commits: `b9e0725c289792fce414d8bd488764d90e30b595`, `27420e77cc9fed55460816d76332057bd4ef38d7`.
- Guard run 35428635147 for `27420e77...` subsequently completed SUCCESS.

## 2026-09-19 — Mission 001 / independent rejection audit
- Local Autopilot run `35438997195` was marked SUCCESS although its model proposal was rejected as invalid JSON; no code improvement was accepted from that proposal.
- Controller on main was fixed so `LOCAL_AUTOPILOT_REJECTED` fails the workflow rather than silently reporting success.
- Mission 001 remains IN PROGRESS and stable product code remains unpromoted.

## 2026-09-20 — Mission 001 / candidate guard verified
- Re-read README, DIRECTOR, CURRENT_MISSION, DIRECTOR_LOG and ROADMAP.
- Verified candidate `9a878f76bdaa5df1c2ee8b12dda54ec6ec99acd2`: HERBARIUM Guard #85 push SUCCESS and #86 pull_request SUCCESS.
- Candidate remains diverged from main; no unsafe merge/reset or stable promotion attempted.

## 2026-09-20 — Mission 001 / UI consistency slice
- Verified prior UI foundation `01edccfeaa0d621406f7aaf3b23731494b44d71f`: Guard #89 push SUCCESS and #90 pull_request SUCCESS.
- Created rollback `rollback/mission-001-ui-consistency-01edccfe`.
- Unified Home/capture visual hierarchy without adding or simulating product capabilities.
- Candidate UI head `c7b8df05c477b936503797faeef0642e58b18162` passed Guard #91.
- Preview synchronized and clearly labelled CANDIDATE PREVIEW.

## 2026-09-20 — Mission 001 / explicit local-state and error slice
- Independent control confirmed candidate head `28ad466a9693dd13ee2522fcd047d167f73d6cbb` was green on Guard #93 push and #94 pull_request before changes.
- Continued Mission 001 only; no unrelated feature opened.
- Implemented explicit local/offline status wording and accessibility labels, pre-save validation for invalid/non-image or oversized evidence, and clearer no-partial-save/storage failure messages in `src/app.js`.
- Extended `tests/smoke.mjs` with regression assertions for online/offline local-data states and failure/no-partial-save wording.
- Candidate head `922be5a7eefbde5f0dda2d8118a0fb492d07b949` passed HERBARIUM Guard #97 push and #98 pull_request: SUCCESS.
- Public preview synchronized to the green candidate and labelled `CANDIDATE PREVIEW · 922be5a7`; preview repo commits `d49f9ce9` and `34768aa4` update the HTML marker and candidate app logic.
- No real-iPhone, real-browser, permission-dialog or offline-network test is claimed; these remain unverified by this cycle.
- Mission 001 remains IN PROGRESS. Next priority is feature-parity recovery of the missing baseline structure (collection/book/atlas/academy) and explicit negative/non-plant safeguards, one coherent slice at a time.

## 2026-09-20 — Mission 001 / real local Book recovery slice
- Independent control re-read the operational files and confirmed candidate head `568c8b233312ea58921cab3aee9c368103304696` had Guard #99 push and #100 pull_request SUCCESS; draft PR #1 remains open and main/stable was not promoted.
- Inspected the recovered candidate 0.6 artifact and confirmed it contained a Book/Volume I surface with a pending/uncertain observation section; current source lacked that structure.
- Created rollback `rollback/mission-001-book-recovery-568c8b23` before product changes.
- Single mission: recover a conservative Book slice backed only by real IndexedDB observations already saved by the current candidate.
- Added Volume I navigation and a pending-observations renderer. Only records with `status === 'UNKNOWN'` are shown; no species name, verified state, starter plant or fake collection data is generated.
- Added empty/error states that do not mutate local data and extended smoke guards for Book presence, UNKNOWN-only filtering and absence of fake/starter species fixtures.
- Product/test head is `54522e931109601ce2602fb3ba5547baf8f33fe4`. At log-write time HERBARIUM Guard #107 for that head was queued, so this slice is NOT yet declared complete or previewable.
- No real-browser, real-iPhone or real-offline test is claimed.
- Next action: require Guard green on the latest candidate head; only then synchronize `/herbarium/`. If Guard fails, fix that failure before any other feature-parity work.

## 2026-09-20 — Mission 001 / conservative local Atlas recovery slice
- Independent control re-read README, DIRECTOR, CURRENT_MISSION, DIRECTOR_LOG and ROADMAP; main remains unpromoted and draft PR #1 is the only open issue/PR.
- Verified previous candidate head `da3b62add7627dca8ee898658e25c9946399ee81`: HERBARIUM Guard #109 push and #110 pull_request both completed SUCCESS. The previous log's pending-guard statement is therefore superseded by this verification.
- Inspected `recovery/candidate-0.6-index.html` and confirmed the recovered baseline contained a Living Atlas surface based on real observation coordinates/regions.
- Created rollback `rollback/mission-001-atlas-recovery-da3b62ad` before product changes.
- Single mission: recover a conservative Atlas read-only slice backed exclusively by fields already present in local IndexedDB records; no GPS request, map service, cloud call, synthetic territory or fake coordinate was added.
- Added Atlas navigation, counts for observations with finite stored coordinates, distinct stored region names, explicit empty/error states and privacy wording. Observations without geographic data remain excluded.
- Extended smoke regression guards for Atlas structure, real-coordinate checks, region reads, empty/error behavior and absence of `fetch`, XMLHttpRequest or geolocation calls in the current core.
- Candidate product/test head `6461c32e3b6a7b67ec93647697c90307f669913d` passed HERBARIUM Guard #111 push and #112 pull_request: SUCCESS, including repository contract, secret sanity, HTML validation, JavaScript syntax and project tests.
- Public preview was synchronized from that green head to `webinsolito/webinsolito` commit `9a6b2bd1fb670b7aaa05015dd0e2b0c78e28f453`, labelled `CANDIDATE PREVIEW · 6461c32e`; repository contents were re-read and match the expected marker and Atlas surface.
- No real-browser HTTP rendering, real-iPhone, real-offline-network or GPS permission test is claimed.
- Mission 001 remains IN PROGRESS. Next highest-priority recovery gap is a real Collection/Academy slice or explicit negative/non-plant safeguard work, one coherent cycle at a time.
