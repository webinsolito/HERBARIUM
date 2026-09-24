// V5 arbitration policy: exact dual-model agreement remains the normal path.
// An exceptionally strong primary candidate may survive verifier disagreement;
// the upstream non-plant gate still runs before species inference.
export const ARBITRATION_POLICY=Object.freeze({strongPrimaryTop1:0.97,strongPrimaryMargin:0.60});
function taxonKey(value){return String(value||'').trim().toLowerCase().replace(/×/g,'x').split(/\s+/).slice(0,2).join(' ');}
export function decideSpeciesConsensusV5(primary,verifier,policy=ARBITRATION_POLICY){
 if(primary?.status!=='PROPOSED')return {...primary,consensus:false,arbitrated:false};
 if(verifier?.status!=='PROPOSED')return {status:'UNKNOWN',reason:'verifier-not-confident',scientificName:null,rawScore:primary.rawScore??null,margin:primary.margin??null,calibrated:false,consensus:false,arbitrated:false};
 if(taxonKey(primary.scientificName)===taxonKey(verifier.scientificName))return {status:'PROPOSED',reason:'cross-dataset-dual-model-consensus',scientificName:primary.scientificName,rawScore:primary.rawScore,margin:primary.margin,calibrated:false,consensus:true,arbitrated:false,verifierScientificName:verifier.scientificName,verifierScore:verifier.rawScore,verifierMargin:verifier.margin};
 const strongPrimary=Number(primary.rawScore)>=policy.strongPrimaryTop1&&Number(primary.margin)>=policy.strongPrimaryMargin;
 if(strongPrimary)return {status:'PROPOSED',reason:'strong-primary-arbitration',scientificName:primary.scientificName,rawScore:primary.rawScore,margin:primary.margin,calibrated:false,consensus:false,arbitrated:true,verifierScientificName:verifier.scientificName,verifierScore:verifier.rawScore,verifierMargin:verifier.margin};
 return {status:'UNKNOWN',reason:'cross-dataset-model-disagreement',scientificName:null,rawScore:primary.rawScore??null,margin:primary.margin??null,calibrated:false,consensus:false,arbitrated:false,verifierScientificName:verifier.scientificName};
}
