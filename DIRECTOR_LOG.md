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


## 2026-09-21 — Mission 001 / blocking Home fidelity correction
- User review showed the public Home still behaved like a wide desktop landing and diverged materially from the approved mobile mockup.
- Confirmed candidate head before the correction at `cc72a38e83242ab84d6759b83ef0d438f37aae7e`.
- Created rollback `rollback/ui-major-home-before-cc72a38e`.
- Rebuilt the Home around a hard compact app constraint (`max-width:520px`) so desktop no longer expands the UI into a wide two-column landing.
- Added local photographic hero asset `src/assets/hero-approved.webp` from the approved visual direction and replaced the flat vector-led hero composition.
- Moved the green camera CTA into the hero, added three compact visual destination cards, compact banner, local summary and fixed bottom navigation.
- Hid the technical network badge visually while retaining the `network` element required by existing application logic.
- Preserved routes, local counters, IndexedDB behavior and conservative UNKNOWN/REJECT data rules.
- Initial Guard #179 failed only because the new smoke-test regex was over-escaped; application HTML/CSS validation had passed.
- Fixed the assertion escaping without weakening the UI contract.
- Final product/test head `0d40c2633418bfdd76d283ba68c781c99f0b597d` passed HERBARIUM Guard #180.
- Preview synchronization is permitted only after this documentation head also passes Guard.


## 2026-09-21 — Bellis Lab V1 / Day 1
- Froze immersive candidate `197e686`; no further integration on that branch.
- Created `candidate/bellis-lab-v1` from rollback `025fef8`.
- Did not modify Home, Collection, Book, Atlas or Academy.
- Evaluated Bellis asset sources. Rejected `SM-Sclass/3D-virtual-herbal-plant/public/assets/models/daisies.glb` despite ~1.4 MB size because the repository declares no license.
- Kept CC-BY Sketchfab Bellis/daisy candidates on HOLD pending direct asset and node inspection.
- Selected Three.js r186 locally vendored (MIT) with GLTFLoader + OrbitControls.
- Added isolated Bellis lab with local GLB audit, node gate, real raycasting path, orbit/zoom/reset/auto-rotate and designed exploded-view logic that remains disabled until scene graph passes.
- No scientific facts, recognition result or VERIFIED state added.
- Visual approval remains NOT VERIFIED until a real licensed model is loaded and screenshots/browser/device QA are produced.


## 2026-09-23 — HERBARIUM V1 intensive functional consolidation
- Created `candidate/herbarium-v1-functional` and rollback `rollback/herbarium-v1-pre-functional-78aed584`.
- Stopped visual rebuild work and concentrated on one end-to-end local-first observation flow.
- Reworked capture persistence into an honest UNKNOWN/REJECT pipeline; no species model is simulated and no capture path writes VERIFIED.
- Added byte-signature image validation, MIME mismatch rejection, 12 MB input cap, 40 MP decoded-pixel cap, resize/recompression and EXIF stripping by re-encoding.
- Added storage capacity check, save read-back verification and delete read-back verification.
- Added real result page for UNKNOWN, REJECT, pre-existing VERIFIED/PROPOSED records and errors.
- Collection now shows all real observations including REJECT, opens results and supports persistent deletion.
- Book consumes real stored non-REJECT observations; validated botanical plates still require real VERIFIED + scientificName data.
- Atlas shows only stored real location data and otherwise stays elegantly empty.
- Academy remains intentionally minimal and data-driven.
- Added Service Worker app shell, same-origin caching and network-first freshness with offline fallback.
- Restored one Bellis technical WebGL demo only, explicitly labelled as procedural demo and not recognition.
- Added CSP to core pages and removed dynamic innerHTML from the V1 application renderer.
- Initial browser QA on head `9a102acd` returned 23 PASS / 9 FAIL: six failures were a QA script error caused by selecting a control inside a closed disclosure; three were Playwright WebKit internal errors during forced offline reload.
- Corrected QA to interact with the disclosure like a user. WebKit now validates installed cache; Chromium performs actual offline reload. This limitation is not misreported as WebKit offline PASS.
- Browser QA later passed 32/32 on product head `3b852794`.
- Fixed a real collection-delete listener reliability bug and hardened optional persistent-storage handling plus Service Worker cache freshness.
- Added explicit oversized-file, persistent-delete and WebGL-fallback browser cases.
- Final pre-documentation head `d49430aa3bba17436e42e077b20be6a8e16de2b6`: HERBARIUM Guard #197 SUCCESS and Browser QA run 35865744198 SUCCESS.
- Duplicate browser QA-on-push workflow was moved to manual-only to avoid redundant Actions/e-mail noise.
- Real iPhone hardware camera/GPU testing, automatic species recognition, automatic pixel detector and final Bellis GLB remain open and are not claimed complete.
