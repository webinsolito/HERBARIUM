# P0-A Automatic non-plant gate — implementation note

## Selected runtime
- ONNX Runtime Web 1.30.0
- License: MIT
- Execution provider: WebAssembly, single thread for broad mobile/Safari compatibility
- User image pixels are processed in-browser; no image upload endpoint is used.

## Selected model
- SSD-MobileNetV1-12 INT8 ONNX from the ONNX Model Zoo
- Source: onnxmodelzoo/ssd_mobilenet_v1_12-int8
- License declared by model repository: Apache-2.0
- Size: about 9.5 MB
- Input: RGB uint8 NHWC; the exported model accepts dynamic image dimensions
- COCO object classes
- Model is loaded lazily only when automatic gate analysis is needed.
- Reason for replacement: the previous EfficientDet conversion failed ONNX Runtime Web session creation with ShapeInferenceError on both Chromium and WebKit; it was not kept as a hidden fallback.

## Conservative policy
This is NOT a plant classifier and never outputs a species.

REJECT is allowed only for strong, large detections in narrow negative groups:
- people
- animals
- vehicles
- screens/devices
- a small set of unmistakable hard objects

A potted-plant cue forces UNKNOWN.
Multiple evidence images must agree before automatic REJECT.
No strong negative evidence => UNKNOWN.

Tablecloths, decorative prints and other out-of-distribution images are NOT forced to REJECT by this stage; they stay UNKNOWN until a second detector/classifier is validated.

## Offline behavior
Runtime/model are fetched on first use from pinned-version/vendor URLs and cached by the service worker. After successful bootstrap they can be reused offline. If runtime/model are unavailable, the gate fails safe to UNKNOWN and the observation can still be saved.

## Real fixture set
The P0-A browser QA downloads real images from google-coral/test_data (Apache-2.0):
- cat.bmp
- bird.bmp
- grace_hopper.bmp
- hot_dog.jpg
- sunflower.bmp

Negative fixtures must never produce a species. Sunflower is a guard against accidental REJECT.

## Still open
- tablecloth / textile-specific detection
- printed plant / decorative pattern-specific detection
- real iPhone hardware validation
- calibrated plant classifier
