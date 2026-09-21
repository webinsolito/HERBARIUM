# CURRENT MISSION

## Bellis Lab V1 — Day 1 / STOP + RECOVERY

Branch: `candidate/bellis-lab-v1`
Base: `rollback/mission-001-pre-immersive-025fef8d`

### Rule
Do not modify Home, Collection, Book, Atlas or Academy until Bellis perennis is visually approved.

### Objective
Build an isolated, license-safe Bellis 3D laboratory and select a real GLB/GLTF asset strategy. The procedural 197e686 experiment remains frozen as technical reference only.

### Implemented in this slice
- isolated `species-bellis-lab.html`;
- local vendored Three.js r186 + GLTFLoader + OrbitControls (MIT);
- local-only GLB audit input, max 25 MB, no upload;
- real raycasting path;
- scene-graph gate for FLOWER_HEAD, PETALS, DISC, INVOLUCRE, STEM, LEAVES, ROOT_SYSTEM;
- Exploded View disabled until required nodes exist;
- mobile DPR cap and render pause when hidden;
- `BELLIS_ASSET_AUDIT.md` records rejected/hold candidates.

### Asset status
NO MODEL APPROVED.

The discovered GitHub Bellis GLB was rejected because the repository has no declared license. CC-BY Sketchfab candidates remain HOLD until bytes, quality and scene graph are inspected.

### Exit gate Day 1
- new candidate exists from rollback;
- no Home redesign;
- lab exists;
- runtime dependency/license documented;
- unsafe asset rejected;
- real GLB audit path implemented;
- CI green.

Status: IN PROGRESS — DO NOT PROMOTE
