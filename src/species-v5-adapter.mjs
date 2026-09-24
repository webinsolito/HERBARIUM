import { createSpeciesRecognitionAdapter as createV4Adapter } from './species-onnx.mjs';
import { decideSpeciesConsensusV5 } from './species-consensus-v5.mjs';

export const SPECIES_ENGINE_VERSION='plantnet-bioclip-consensus-v5';

// Transitional V5 adapter. It preserves the already-tested V4 inference path
// and only changes arbitration after both primary and verifier have executed.
// This keeps model loading/preprocessing untouched while making the V5 policy
// independently testable before replacing the legacy export in species-onnx.
export function createSpeciesRecognitionAdapter(){
  const legacy=createV4Adapter();
  return {
    last:null,
    async infer(evidence){
      const result=await legacy.infer(evidence);
      if(result?.reason!=='cross-dataset-model-disagreement' || !result?.primary || !result?.verifier){
        return this.last={...result,arbitrated:false,engineVersion:SPECIES_ENGINE_VERSION};
      }
      const decision=decideSpeciesConsensusV5(result.primary,result.verifier);
      return this.last={
        ...result,
        ...decision,
        primary:result.primary,
        verifier:result.verifier,
        views:result.views,
        verifierViews:result.verifierViews,
        engineVersion:SPECIES_ENGINE_VERSION
      };
    }
  };
}
