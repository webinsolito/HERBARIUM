# Bellis perennis — 3D Asset Audit

Date: 2026-09-21
Branch: `candidate/bellis-lab-v1`

## Decision

No Bellis model is approved for integration yet.

The current procedural WebGL plant on `candidate/mission-001-source-recovery` is frozen as a technical interaction reference only. It is not a final visual asset.

## Runtime strategy

Selected for the lab:
- Three.js r186, vendored locally under `src/vendor/three-r186/`.
- `GLTFLoader` for GLB/glTF 2.0.
- `OrbitControls` for orbit/pan/zoom.
- No CDN dependency.
- No Draco, Meshopt or KTX2 in Day 1. Add only if the approved asset actually uses/benefits from them.
- DPR capped in the lab to reduce mobile GPU load.
- Rendering pauses when the page is hidden.
- GLB local-audit input never uploads the file.

Three.js license: MIT.

## Required scene graph gate

A candidate asset must expose distinct objects/nodes that can be mapped to:

- FLOWER_HEAD
- PETALS / RAY_FLORETS
- DISC / CENTRAL_HEAD
- INVOLUCRE
- STEM
- LEAVES
- ROOT_SYSTEM

SEEDS are optional and must only exist if botanically/visually appropriate.

If the model is a single merged mesh, it fails the exploded-view architecture gate unless a legally permitted source file can be separated and re-exported without degrading the model.

## Candidate research

### REJECTED — SM-Sclass/3D-virtual-herbal-plant / daisies.glb

- File exists: `public/assets/models/daisies.glb`.
- Repository metadata explicitly maps it to "Daisies (Bellis perennis)".
- Approximate file size: 1.4 MB.
- Repository exposes no license in GitHub metadata and no root LICENSE was found.
- Result: REJECT for HERBARIUM commercial reuse until rights are clarified.

### HOLD — Sketchfab Low-Poly Plants/Flowers (MG_HM_SJ5)

- Search metadata explicitly lists Daisy (Bellis perennis).
- License reported by Sketchfab search metadata: Creative Commons Attribution.
- Approximate full pack: 43.8k triangles / 22.6k vertices.
- Not integrated: the asset bytes and internal scene graph have not been independently inspected in this run.
- Result: HOLD for visual/node audit, not approved.

### HOLD — Sketchfab Daisy Flower (LiliumLetifer)

- Search metadata reports downloadable model under Creative Commons Attribution.
- Approximate model: 1k triangles / 586 vertices.
- Exact Bellis-perennis identity is not established by the metadata reviewed here.
- Result: HOLD, likely too low-detail for final museum-quality close zoom until visually inspected.

### HOLD — Sketchfab Daisy Flower (Rukh3D)

- Search metadata reports Creative Commons Attribution.
- Approximate model: 28.9k triangles / 14.5k vertices.
- Exact Bellis-perennis identity and node segmentation have not been independently verified.
- Result: HOLD for inspection, not approved.

## Lab behavior

`species-bellis-lab.html` is intentionally isolated from Home, Collection, Book, Atlas and Academy.

Until an asset passes the license + visual + scene-graph gate:
- the lab shows ASSET NOT APPROVED;
- no fake flower is rendered;
- Exploded View stays disabled;
- a local GLB can be loaded for audit without uploading it;
- the lab counts meshes/triangles and validates node names;
- raycasting selects the actual loaded mesh;
- the model is not promoted into the product.

## Visual gate still required

Before approval, produce and inspect:
- front
- left 3/4
- right 3/4
- side
- rear
- top
- underside
- exploded view
- mobile

A green CI run is not visual approval.
