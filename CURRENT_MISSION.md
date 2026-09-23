# CURRENT MISSION

## HERBARIUM V1 — Functional Freeze Candidate

Branch: `candidate/herbarium-v1-functional`
Rollback: `rollback/herbarium-v1-pre-functional-78aed584`

### Objective
Deliver a complete, conservative, local-first V1 flow before any new visual rebuild:

PHOTO
→ VALIDATION
→ ANALYSIS
→ UNKNOWN / REJECT
→ RESULT
→ SAVE
→ COLLECTION
→ BOOK / ATLAS
→ 3D DEMO WHEN AVAILABLE

### Functional state

#### Photo input — IMPLEMENTED
- camera input and photo-library input;
- file signature sniffing for JPEG, PNG, WebP, HEIC/HEIF and AVIF;
- MIME/signature mismatch rejection;
- 12 MB input limit;
- decoded-image pixel ceiling;
- resize to max 1600 px edge;
- local JPEG recompression;
- EXIF removed by re-encoding;
- no server upload.

#### Conservative analysis — IMPLEMENTED
- explicit negative categories: object, animal, print, tablecloth => REJECT;
- no validated automatic species engine is connected;
- missing detector runtime => UNKNOWN;
- no code path writes VERIFIED during capture;
- result explains identification is unavailable instead of inventing a species.

#### Persistence — IMPLEMENTED
- IndexedDB local storage;
- transaction completion + read-back verification after save;
- delete + read-back verification;
- local storage capacity estimate before saving;
- optional persistent-storage request when browser supports it;
- object URLs revoked on page lifecycle cleanup.

#### Result page — IMPLEMENTED
Handles:
- UNKNOWN;
- REJECT;
- pre-existing VERIFIED records only when scientificName is actually stored;
- PROPOSED records only when scientificName is actually stored;
- missing observation/error states;
- deletion.

No species is manufactured by the V1 flow.

#### Collection — IMPLEMENTED
- all real saved observations;
- photo;
- state;
- date;
- evidence count;
- result link;
- persistent deletion.

#### Book — IMPLEMENTED
- only real saved non-REJECT observations;
- validated plates only from records already containing VERIFIED + scientificName;
- no synthetic species.

#### Atlas — IMPLEMENTED SAFE EMPTY STATE
- only stored real coordinates/regions are shown;
- no geolocation request;
- no invented location;
- current capture flow does not collect location, so Atlas normally remains empty unless real location data already exists.

#### Academy — MINIMAL / REAL DATA ONLY
- only real saved non-REJECT observations;
- basic evidence-count guidance;
- no fake courses or scientific claims.

#### Offline — IMPLEMENTED BASELINE
- Service Worker local app-shell cache;
- same-origin only;
- network-first updates with cache fallback;
- actual Chromium offline reload passed;
- WebKit cache population passed;
- forced WebKit offline+reload cannot be claimed because Playwright WebKit produced an internal runner error in the earlier attempt.

#### 3D — IMPLEMENTED AS TECHNICAL DEMO ONLY
- one Bellis perennis technical demo;
- real WebGL interaction;
- rotation;
- zoom;
- exploded view;
- parts;
- visible WebGL-unavailable fallback;
- explicitly marked as procedural technical demo and NOT recognition output;
- final scientifically validated Bellis GLB is still not approved.

### Security baseline
Implemented:
- content signature checks;
- MIME spoofing rejection;
- upload size and decoded-pixel limits;
- local re-encoding / EXIF removal;
- CSP on core pages;
- no cloud photo upload;
- no geolocation request;
- no dynamic innerHTML in the V1 application renderer;
- no external runtime fetch/XHR in app.js;
- same-origin Service Worker;
- IndexedDB storage verification;
- object URL cleanup;
- npm Guard audit reported 0 vulnerabilities.

### Automated validation
Current product head before documentation:
- `d49430aa3bba17436e42e077b20be6a8e16de2b6`
- HERBARIUM Guard #197: SUCCESS
- HERBARIUM Browser QA run 35865744198: SUCCESS

Browser QA covers Chromium + WebKit at 360 / 390 / 430 px:
- no horizontal overflow on core pages;
- valid image → UNKNOWN → result → reload → collection/book/atlas;
- manual negative → REJECT;
- spoofed non-image rejection;
- >12 MB rejection;
- persistent deletion;
- Service Worker cache;
- Chromium real offline reload;
- Bellis demo separation from recognition;
- WebGL fallback.

### NOT VERIFIED / OPEN
1. Real physical iPhone camera/permission flow.
2. Real iPhone GPU/memory/pinch performance for 3D.
3. Automatic non-plant pixel detector.
4. Automatic species recognition.
5. Final scientifically accurate Bellis GLB/GLTF.
6. Full visual polish pass.

### Freeze rule
No new features until P0 bugs are closed. Graphics get a dedicated later pass.

Status: V1 FUNCTIONAL CANDIDATE — DO NOT PROMOTE TO MAIN WITHOUT FINAL REVIEW
