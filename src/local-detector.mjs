export const DETECTOR_STATUS=Object.freeze({UNKNOWN:'UNKNOWN',REJECT:'REJECT'});
export const DEFAULT_NON_PLANT_THRESHOLD=0.985;
export const DEFAULT_MIN_MARGIN=0.20;

const unknown=reason=>({status:DETECTOR_STATUS.UNKNOWN,negativeCategory:null,reason});
const clamp01=value=>Math.max(0,Math.min(1,Number(value)));

/**
 * Conservative local pixel-gate contract.
 * An adapter MUST execute inference on decoded image pixels on-device and return:
 * { executed:true, nonPlantScore:0..1, category?:string, plantScore?:0..1, topMargin?:0..1 }.
 *
 * Safety invariant: malformed output, missing runtime, model error, weak confidence,
 * or plant/non-plant disagreement always stays UNKNOWN. This module never returns
 * a species and never returns VERIFIED.
 */
export async function classifyPixelsLocally(pixelSource, adapter, {
  threshold=DEFAULT_NON_PLANT_THRESHOLD,
  minMargin=DEFAULT_MIN_MARGIN
}={}) {
  if(!pixelSource) return unknown('no-pixels');
  if(!adapter || typeof adapter.infer!=='function') return unknown('runtime-unavailable');
  if(!Number.isFinite(threshold) || threshold<=0.5 || threshold>1) return unknown('invalid-threshold');
  if(!Number.isFinite(minMargin) || minMargin<0 || minMargin>1) return unknown('invalid-margin');
  try {
    const result=await adapter.infer(pixelSource);
    if(!result || result.executed!==true) return unknown('inference-not-executed');
    const score=Number(result.nonPlantScore);
    if(!Number.isFinite(score) || score<0 || score>1) return unknown('invalid-output');
    const plantScore=result.plantScore==null?null:Number(result.plantScore);
    if(plantScore!=null && (!Number.isFinite(plantScore)||plantScore<0||plantScore>1)) return unknown('invalid-output');
    const margin=result.topMargin==null?null:Number(result.topMargin);
    if(margin!=null && (!Number.isFinite(margin)||margin<0||margin>1)) return unknown('invalid-output');
    if(score<threshold) return unknown('ambiguous');
    if(plantScore!=null && score-plantScore<minMargin) return unknown('plant-disagreement');
    if(margin!=null && margin<minMargin) return unknown('weak-margin');
    const category=typeof result.category==='string'&&result.category.trim()?result.category.trim():'non-plant';
    return {status:DETECTOR_STATUS.REJECT,negativeCategory:category,reason:'local-pixel-inference'};
  } catch {
    return unknown('inference-error');
  }
}

/**
 * Helper for future adapters: combines class probabilities without pretending
 * that ImageNet-style labels are a calibrated botanical detector. The caller
 * supplies explicit plant/non-plant label sets; unknown labels contribute to
 * neither side. Returned scores are evidence only and still pass through the
 * conservative threshold + margin gate above.
 */
export function aggregateLabelEvidence(predictions,{plantLabels=[],nonPlantLabels=[]}={}){
  if(!Array.isArray(predictions))return null;
  const plant=new Set(plantLabels.map(x=>String(x).toLowerCase()));
  const nonPlant=new Set(nonPlantLabels.map(x=>String(x).toLowerCase()));
  let plantScore=0,nonPlantScore=0,bestNonPlant={score:0,category:null};
  for(const item of predictions){
    const label=String(item?.label??item?.className??'').trim().toLowerCase();
    const score=clamp01(item?.score??item?.probability??NaN);
    if(!label||!Number.isFinite(Number(item?.score??item?.probability)))continue;
    if(plant.has(label))plantScore=Math.max(plantScore,score);
    if(nonPlant.has(label)){
      nonPlantScore=Math.max(nonPlantScore,score);
      if(score>=bestNonPlant.score)bestNonPlant={score,category:label};
    }
  }
  const topMargin=Math.abs(nonPlantScore-plantScore);
  return {nonPlantScore,plantScore,topMargin,category:bestNonPlant.category};
}
