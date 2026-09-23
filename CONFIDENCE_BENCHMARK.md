# HERBARIUM confidence benchmark sources

This benchmark is intentionally separated from the product test fixtures.

## Plant set
TensorFlow flower_photos dataset:
- 3,670 flower photographs
- classes: daisy, dandelion, roses, sunflowers, tulips
- benchmark run samples two deterministic sorted images per class (10 plant images total)
- TensorFlow documents the dataset images as CC-BY; creator attribution is included in the dataset LICENSE.txt.
- The benchmark does **not** treat those five folder names as exact species ground truth for HERBARIUM. They are used to test plant preservation, reject behavior and proposal behavior.

## Negative set
- cat, bird, Grace Hopper/person, hot dog: google-coral/test_data (repository license Apache-2.0)
- tablecloth: Wikimedia Commons, public domain
- floral print: Metropolitan Museum of Art via Wikimedia Commons, CC0 1.0
- laptop screen: Wikimedia Commons, CC BY-SA 4.0

## Metrics currently valid
- plant reject count/rate on this fixed sample
- negative false-species count/rate on this fixed sample
- negative reject count/rate on this fixed sample
- species proposal count/rate on this fixed plant sample
- automatic VERIFIED count
- median end-to-end processing time in the CI browser

These are **benchmark sample metrics**, not population accuracy and not a calibrated probability for a user-facing confidence percentage.
