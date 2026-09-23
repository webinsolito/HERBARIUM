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
- Primary model: `cpoisson/plantnet300k-mobilenetv3-small` — OpenRAIL.
- Independent verifier: `crazedcodernate/bioclip-2.5-mobile-fastvit` — MIT.
- Primary dataset family: PlantNet-300K, 1,081 species.
- Verifier coverage: 4,271 plant species from iNaturalist 2021 via BioCLIP 2.5 distilled embeddings.
- HERBARIUM first runs the lightweight PlantNet MobileNetV3 model. BioCLIP Mobile is loaded only when PlantNet would otherwise produce a strong proposal.
- A species can become PROPOSED only when PlantNet and the independently trained BioCLIP verifier choose the same genus+species taxon.
- Cross-dataset disagreement or verifier unavailability fails safe to UNKNOWN.
- This cross-dataset verifier replaced the earlier ResNet18 verifier because ResNet18 shared the same PlantNet-300K closed-set coverage and could agree on the same wrong nearest class for species absent from PlantNet.
- HERBARIUM stores raw softmax scores only as diagnostics. They are explicitly **not calibrated confidence**.
- Automatic output can be PROPOSED or UNKNOWN; it cannot become VERIFIED.

## Product rule
Upstream benchmark numbers belong to the upstream model/dataset evaluation and are not HERBARIUM accuracy. HERBARIUM must run a separated representative benchmark before showing any reliability percentage to users.

## Network/privacy boundary
The photo bytes are decoded and inferred in the browser. Runtime/model assets may be downloaded on first use and cached for reuse; the product code has no image-upload endpoint in the recognition flow.
