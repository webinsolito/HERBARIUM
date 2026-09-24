// Public species-engine entrypoint. V4 inference is preserved in
// species-onnx-v4.mjs; V5 adds guarded arbitration without changing app.js.
export { createSpeciesRecognitionAdapter, SPECIES_ENGINE_VERSION } from './species-v5-adapter.mjs';
export {
  SPECIES_MODEL_LICENSE,
  SPECIES_MODEL_URL,
  SPECIES_VERIFIER_MODEL_URL,
  SPECIES_VERIFIER_LABELS_URL,
  SPECIES_VERIFIER_TABLE_URL,
  SPECIES_LABELS_URL,
  SPECIES_POLICY,
  decideSpeciesProposal,
  decideModelConsensus
} from './species-onnx-v4.mjs';
