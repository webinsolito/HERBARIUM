# HERBARIUM — ML sources, licenses and safety boundaries

## P0-A non-plant gate
- Runtime: ONNX Runtime Web 1.30.0 — MIT.
- Model: ONNX Model Zoo SSD-MobileNetV1-12 INT8 COCO.
- Repository: `onnxmodelzoo/ssd_mobilenet_v1_12-int8`.
- Declared repository license: Apache-2.0.
- Role: negative evidence only (people, animals, vehicles, screens and selected hard objects).
- It never emits a species and never emits VERIFIED.
- Out-of-distribution textiles/prints can remain UNKNOWN; no forced decision is allowed.

## P0-B species proposal
- Runtime: ONNX Runtime Web 1.30.0 — MIT.
- Model source: `cpoisson/plantnet300k-mobilenetv3-small`.
- Dataset family: PlantNet-300K, 1,081 species.
- Declared model license: OpenRAIL.
- Role in HERBARIUM: local/offline-first candidate proposal only.
- HERBARIUM stores the raw softmax score only as a model diagnostic. It is explicitly **not calibrated confidence**.
- Automatic output can be PROPOSED or UNKNOWN; it cannot become VERIFIED.

## Product rule
Upstream benchmark numbers belong to the upstream model/dataset evaluation and are not HERBARIUM accuracy. HERBARIUM must run a separated representative benchmark before showing any reliability percentage to users.

## Network/privacy boundary
The photo bytes are decoded and inferred in the browser. Runtime/model assets may be downloaded on first use and cached for reuse; the product code has no image-upload endpoint in the recognition flow.
