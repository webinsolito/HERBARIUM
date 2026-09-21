# CURRENT MISSION

## Mission 001 — Rebuild the source of truth

### Current state
IN PROGRESS on `candidate/mission-001-source-recovery`. Main/stable is not promoted.

The recovered application still preserves local IndexedDB evidence storage, camera/library inputs, UNKNOWN/REJECT behavior, collection/book surfaces and no mandatory cloud/API dependency.

### Completed conservative evidence slice
Explicit user-provided non-plant signals `object`, `animal`, `print` and `tablecloth` can produce REJECT. Missing or ambiguous evidence remains UNKNOWN. This is not species recognition.

### Open recognition slice
A real species-recognition engine is still NOT connected. Until one is validated, HERBARIUM must not convert user photos into named species or invented confidence values.

### Active slice — Immersive 3D architecture + Bellis demo

The previously published editorial/card-based Home was rejected. The active visual direction is now an immersive natural encyclopedia in which the 3D organism is the primary interface.

Implemented candidate baseline:
- `src/index.html`: full-screen immersive Home centered on a real WebGL canvas instead of hero + cards;
- `src/immersive.css`: new dark natural/cinematic design system, responsive overlays and mobile-first adaptations;
- `src/plant3d.js`: zero-network native WebGL engine with custom shaders and procedural 3D plant geometry;
- `src/species-bellis.html`: separate Bellis perennis demo URL with species panel, contextual part panel, hotspots and viewer controls;
- actual pointer/touch rotation, wheel/two-pointer zoom, auto-rotate, reset and camera focus;
- actual animated exploded view: petals, central head, involucre, stem, leaves, roots and demo seeds move apart as separate 3D meshes;
- discrete part selection via hotspots and part rail;
- WebGL-unavailable fallback surface;
- no CDN, fetch or mandatory network dependency in the 3D engine;
- existing camera/library flow remains linked from the Home;
- rollback: `rollback/mission-001-pre-immersive-025fef8d`.

Validated product/test head:
- `c2830d75948365250305a2bc6a34e573b1262931`
- HERBARIUM Guard #183: SUCCESS.

### What is deliberately NOT claimed
- The procedural Bellis geometry is an interaction prototype, NOT a scientifically validated Bellis GLB/GLTF reconstruction.
- The Bellis page is NOT the output of user-photo recognition and explicitly labels recognition as not connected.
- No real species confidence, similar-species result or scientific measurement has been invented.
- "Sections" remains disabled/placeholder.
- Mesh raycasting is not yet implemented; part selection currently uses hotspots and the part rail.
- Microscopic/cellular progressive zoom is not yet implemented.
- A real GLB/GLTF species catalog is not yet integrated.
- Real iPhone/Android/browser GPU performance has not been tested.
- Local Chromium visual validation was attempted but the execution environment could not initialize EGL/ANGLE/WebGL, so no browser-render PASS is claimed.

### Architecture direction
The first prototype uses native WebGL to keep the experiment dependency-free and offline. For the real species catalog, evaluate Three.js + GLTF/GLB loaders, Draco and KTX2 only when real model assets are introduced and after license/performance review.

### Exit gate for active slice
- final candidate head green in HERBARIUM Guard;
- Home remains organism-first rather than card/landing-first;
- Bellis demo is a separate real page;
- rotation, zoom, exploded separation, reset and part focus remain implemented in code;
- no recognition or scientific-accuracy claim is implied by the demo;
- no mandatory network dependency for the first 3D scene;
- fallback remains present;
- public candidate preview updated only after final documentation head is green.

### Next coherent slice
Replace the procedural Bellis interaction prototype with a properly sourced/validated, optimized GLB/GLTF Bellis asset or a justified alternative; then add true mesh selection/raycasting and validate performance in an actual browser/device environment before expanding to more species.

Status: IN PROGRESS — DO NOT PROMOTE
