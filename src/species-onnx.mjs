export const SPECIES_ENGINE_VERSION='plantnet-bioclip-consensus-v3';
export const SPECIES_MODEL_LICENSE='OpenRAIL + MIT';
export const SPECIES_MODEL_URL='https://huggingface.co/cpoisson/plantnet300k-mobilenetv3-small/resolve/main/plantnet_mobilenetv3.onnx';
export const SPECIES_VERIFIER_MODEL_URL='https://huggingface.co/crazedcodernate/bioclip-2.5-mobile-fastvit/resolve/main/flora_student_fp16.onnx';
export const SPECIES_VERIFIER_LABELS_URL='https://huggingface.co/crazedcodernate/bioclip-2.5-mobile-fastvit/resolve/main/taxa_labels.json';
export const SPECIES_VERIFIER_TABLE_URL='https://huggingface.co/crazedcodernate/bioclip-2.5-mobile-fastvit/resolve/main/taxa_table.npy';
export const SPECIES_LABELS_URL='https://huggingface.co/cpoisson/plantnet300k-mobilenetv3-small/resolve/main/plantnet300K_species_id_2_name.json';
const ORT_SCRIPT_URL='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.min.js';
const ORT_WASM_BASE='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/';
const INPUT=224;
export const SPECIES_POLICY=Object.freeze({minTop1:.92,minMargin:.25,maxViews:2});
let runtimePromise=null,primarySessionPromise=null,verifierSessionPromise=null,labelsPromise=null,verifierAssetsPromise=null;

function loadOrt(){
  if(globalThis.ort?.InferenceSession)return Promise.resolve(globalThis.ort);
  if(runtimePromise)return runtimePromise;
  runtimePromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');s.src=ORT_SCRIPT_URL;s.async=true;s.crossOrigin='anonymous';
    s.onload=()=>globalThis.ort?.InferenceSession?resolve(globalThis.ort):reject(new Error('species-ort-missing'));
    s.onerror=()=>reject(new Error('species-ort-load-failed'));document.head.appendChild(s);
  });
  return runtimePromise;
}

async function createSession(url){
  const ort=await loadOrt();ort.env.wasm.numThreads=1;ort.env.wasm.wasmPaths=ORT_WASM_BASE;
  return ort.InferenceSession.create(url,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
}

async function getPrimarySession(){
  primarySessionPromise??=createSession(SPECIES_MODEL_URL);
  try{return await primarySessionPromise;}catch(error){primarySessionPromise=null;throw error;}
}

async function getVerifierSession(){
  verifierSessionPromise??=createSession(SPECIES_VERIFIER_MODEL_URL);
  try{return await verifierSessionPromise;}catch(error){verifierSessionPromise=null;throw error;}
}

async function getLabels(){
  if(labelsPromise)return labelsPromise;
  labelsPromise=fetch(SPECIES_LABELS_URL,{cache:'force-cache'}).then(async r=>{
    if(!r.ok)throw new Error('species-labels-download-failed');
    const map=await r.json();
    const ids=Object.keys(map).sort((a,b)=>Number(a)-Number(b));
    if(ids.length!==1081)throw new Error('species-label-count-invalid');
    return ids.map(id=>String(map[id]||'').trim());
  });
  try{return await labelsPromise;}catch(error){labelsPromise=null;throw error;}
}

function parseNpyFloat32(buffer){
  const bytes=new Uint8Array(buffer);
  if(bytes.length<16||bytes[0]!==0x93||String.fromCharCode(...bytes.slice(1,6))!=='NUMPY')throw new Error('verifier-table-invalid');
  const major=bytes[6];
  const view=new DataView(buffer);
  const headerLength=major===1?view.getUint16(8,true):view.getUint32(8,true);
  const headerOffset=major===1?10:12;
  const header=new TextDecoder().decode(bytes.slice(headerOffset,headerOffset+headerLength));
  if(!/['"]descr['"]\s*:\s*['"]<f4['"]/.test(header)||/fortran_order['"]?\s*:\s*True/.test(header))throw new Error('verifier-table-format-unsupported');
  const shapeMatch=header.match(/shape['"]?\s*:\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if(!shapeMatch)throw new Error('verifier-table-shape-missing');
  const rows=Number(shapeMatch[1]),cols=Number(shapeMatch[2]),offset=headerOffset+headerLength,count=rows*cols;
  if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<=0||cols<=0||offset+count*4>buffer.byteLength)throw new Error('verifier-table-shape-invalid');
  let data;
  if(offset%4===0)data=new Float32Array(buffer,offset,count);
  else{
    data=new Float32Array(count);
    const dv=new DataView(buffer,offset,count*4);
    for(let i=0;i<count;i++)data[i]=dv.getFloat32(i*4,true);
  }
  return{rows,cols,data};
}

function verifierScientificLabel(item){
  if(typeof item==='string')return item.trim();
  return String(item?.scientific||item?.scientific_name||item?.name||'').trim();
}

async function getVerifierAssets(){
  if(verifierAssetsPromise)return verifierAssetsPromise;
  verifierAssetsPromise=Promise.all([
    fetch(SPECIES_VERIFIER_LABELS_URL,{cache:'force-cache'}),
    fetch(SPECIES_VERIFIER_TABLE_URL,{cache:'force-cache'})
  ]).then(async([labelsResponse,tableResponse])=>{
    if(!labelsResponse.ok||!tableResponse.ok)throw new Error('verifier-assets-download-failed');
    const [labelsRaw,tableBuffer]=await Promise.all([labelsResponse.json(),tableResponse.arrayBuffer()]);
    const table=parseNpyFloat32(tableBuffer);
    const labels=Array.isArray(labelsRaw)?labelsRaw.map(verifierScientificLabel):[];
    if(table.cols!==1024||table.rows!==labels.length||labels.some(x=>!x))throw new Error('verifier-assets-invalid');
    return{labels,table};
  });
  try{return await verifierAssetsPromise;}catch(error){verifierAssetsPromise=null;throw error;}
}

async function decodeEvidence(entry){
  if(!entry?.data||!entry.width||!entry.height)return null;
  const blob=new Blob([entry.data],{type:entry.type||'image/jpeg'});
  if('createImageBitmap'in globalThis){const image=await createImageBitmap(blob);return{image,close:()=>image.close?.()};}
  const url=URL.createObjectURL(blob),image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
  return{image,close:()=>URL.revokeObjectURL(url)};
}

function preprocessPrimary(image,ort){
  const c=document.createElement('canvas');c.width=INPUT;c.height=INPUT;
  const ctx=c.getContext('2d',{alpha:false,willReadFrequently:true});if(!ctx)throw new Error('species-canvas-unavailable');
  const w=image.width||image.naturalWidth,h=image.height||image.naturalHeight,side=Math.min(w,h),sx=(w-side)/2,sy=(h-side)/2;
  ctx.drawImage(image,sx,sy,side,side,0,0,INPUT,INPUT);
  const rgba=ctx.getImageData(0,0,INPUT,INPUT).data,out=new Float32Array(3*INPUT*INPUT);
  const mean=[.485,.456,.406],std=[.229,.224,.225],plane=INPUT*INPUT;
  for(let p=0,i=0;p<plane;p++,i+=4){
    out[p]=(rgba[i]/255-mean[0])/std[0];
    out[plane+p]=(rgba[i+1]/255-mean[1])/std[1];
    out[2*plane+p]=(rgba[i+2]/255-mean[2])/std[2];
  }
  return new ort.Tensor('float32',out,[1,3,INPUT,INPUT]);
}

function preprocessVerifier(image,ort){
  const c=document.createElement('canvas');c.width=INPUT;c.height=INPUT;
  const ctx=c.getContext('2d',{alpha:false,willReadFrequently:true});if(!ctx)throw new Error('verifier-canvas-unavailable');
  ctx.drawImage(image,0,0,INPUT,INPUT);
  const rgba=ctx.getImageData(0,0,INPUT,INPUT).data,out=new Float32Array(3*INPUT*INPUT),plane=INPUT*INPUT;
  for(let p=0,i=0;p<plane;p++,i+=4){
    out[p]=rgba[i]/255;out[plane+p]=rgba[i+1]/255;out[2*plane+p]=rgba[i+2]/255;
  }
  return new ort.Tensor('float32',out,[1,3,INPUT,INPUT]);
}

function softmax(logits){
  let max=-Infinity;for(const x of logits)if(x>max)max=x;
  const probs=new Float64Array(logits.length);let sum=0;
  for(let i=0;i<logits.length;i++){const v=Math.exp(Number(logits[i])-max);probs[i]=v;sum+=v;}
  for(let i=0;i<probs.length;i++)probs[i]/=sum||1;
  return probs;
}

function topK(probs,labels,k=5){
  return Array.from(probs,(score,index)=>({index,score,label:labels[index]||null})).sort((a,b)=>b.score-a.score).slice(0,k);
}

async function inferPrimaryOne(entry){
  const decoded=await decodeEvidence(entry);if(!decoded)return{executed:false,reason:'decode-unavailable'};
  try{
    const [session,labels]=await Promise.all([getPrimarySession(),getLabels()]),ort=globalThis.ort;
    const tensor=preprocessPrimary(decoded.image,ort),result=await session.run({[session.inputNames[0]]:tensor});
    const output=result[session.outputNames[0]]||Object.values(result)[0];
    if(!output?.data||output.data.length!==1081)throw new Error('species-output-invalid');
    return{executed:true,top:topK(softmax(output.data),labels,5)};
  }finally{decoded.close?.();}
}

async function inferVerifierOne(entry){
  const decoded=await decodeEvidence(entry);if(!decoded)return{executed:false,reason:'decode-unavailable'};
  try{
    const [session,assets]=await Promise.all([getVerifierSession(),getVerifierAssets()]),ort=globalThis.ort;
    const tensor=preprocessVerifier(decoded.image,ort),result=await session.run({[session.inputNames[0]]:tensor});
    const output=result[session.outputNames[0]]||Object.values(result)[0],embedding=output?.data;
    if(!embedding||embedding.length!==assets.table.cols)throw new Error('verifier-output-invalid');
    let best=-Infinity,second=-Infinity,bestIndex=-1;
    const {rows,cols,data}=assets.table;
    for(let row=0;row<rows;row++){
      let dot=0,base=row*cols;
      for(let col=0;col<cols;col++)dot+=data[base+col]*Number(embedding[col]);
      if(dot>best){second=best;best=dot;bestIndex=row;}else if(dot>second)second=dot;
    }
    if(bestIndex<0||!Number.isFinite(best))throw new Error('verifier-score-invalid');
    return{executed:true,scientificName:assets.labels[bestIndex],rawScore:best,margin:Number.isFinite(second)?best-second:null};
  }finally{decoded.close?.();}
}

export function decideSpeciesProposal(viewPredictions,policy=SPECIES_POLICY){
  const views=(Array.isArray(viewPredictions)?viewPredictions:[]).filter(x=>x?.executed&&Array.isArray(x.top)&&x.top.length>=2);
  if(!views.length)return{status:'UNKNOWN',reason:'no-species-inference',scientificName:null,rawScore:null,margin:null,calibrated:false};
  const winners=views.map(x=>x.top[0]);
  if(winners.some(x=>!x?.label))return{status:'UNKNOWN',reason:'label-unavailable',scientificName:null,rawScore:null,margin:null,calibrated:false};
  if(winners.some(x=>x.index!==winners[0].index))return{status:'UNKNOWN',reason:'multi-view-disagreement',scientificName:null,rawScore:null,margin:null,calibrated:false};
  const rawScore=Math.min(...winners.map(x=>x.score));
  const margin=Math.min(...views.map(x=>(x.top[0]?.score||0)-(x.top[1]?.score||0)));
  if(rawScore<policy.minTop1)return{status:'UNKNOWN',reason:'weak-top1',scientificName:null,rawScore,margin,calibrated:false};
  if(margin<policy.minMargin)return{status:'UNKNOWN',reason:'weak-margin',scientificName:null,rawScore,margin,calibrated:false};
  return{status:'PROPOSED',reason:'strict-local-model-proposal',scientificName:winners[0].label,rawScore,margin,calibrated:false};
}

function taxonKey(value){
  return String(value||'').trim().toLowerCase().replace(/×/g,'x').split(/\s+/).slice(0,2).join(' ');
}

function decideVerifierViews(predictions){
  const views=(Array.isArray(predictions)?predictions:[]).filter(x=>x?.executed&&x.scientificName);
  if(!views.length)return{status:'UNKNOWN',reason:'verifier-no-inference',scientificName:null,rawScore:null,margin:null,calibrated:false};
  const keys=views.map(x=>taxonKey(x.scientificName));
  if(keys.some(x=>!x)||keys.some(x=>x!==keys[0]))return{status:'UNKNOWN',reason:'verifier-multi-view-disagreement',scientificName:null,rawScore:null,margin:null,calibrated:false};
  return{
    status:'PROPOSED',reason:'verifier-top1',scientificName:views[0].scientificName,
    rawScore:Math.min(...views.map(x=>x.rawScore)),margin:Math.min(...views.map(x=>x.margin??0)),calibrated:false
  };
}

function compactPrimary(predictions){return predictions.map(x=>x.executed?{executed:true,top:x.top.slice(0,3)}:x);}
function compactVerifier(predictions){return predictions.map(x=>x.executed?{executed:true,scientificName:x.scientificName,rawScore:x.rawScore,margin:x.margin}:x);}

export function decideModelConsensus(primary,verifier){
  if(primary?.status!=='PROPOSED')return{...primary,consensus:false};
  if(verifier?.status!=='PROPOSED')return{status:'UNKNOWN',reason:'verifier-not-confident',scientificName:null,rawScore:primary.rawScore??null,margin:primary.margin??null,calibrated:false,consensus:false};
  if(taxonKey(primary.scientificName)!==taxonKey(verifier.scientificName)){
    return{status:'UNKNOWN',reason:'cross-dataset-model-disagreement',scientificName:null,rawScore:primary.rawScore??null,margin:primary.margin??null,calibrated:false,consensus:false,verifierScientificName:verifier.scientificName};
  }
  return{
    status:'PROPOSED',reason:'cross-dataset-dual-model-consensus',scientificName:primary.scientificName,
    rawScore:primary.rawScore,margin:primary.margin,calibrated:false,consensus:true,
    verifierScientificName:verifier.scientificName,verifierScore:verifier.rawScore,verifierMargin:verifier.margin
  };
}

export function createSpeciesRecognitionAdapter(){
  return{
    last:null,
    async infer(evidence){
      const views=(Array.isArray(evidence)?evidence:[]).filter(Boolean).slice(0,SPECIES_POLICY.maxViews);
      if(!views.length)return this.last={status:'UNKNOWN',reason:'no-evidence',scientificName:null,rawScore:null,margin:null,calibrated:false,consensus:false};
      try{
        const primaryPredictions=[];for(const view of views)primaryPredictions.push(await inferPrimaryOne(view));
        const primary=decideSpeciesProposal(primaryPredictions,SPECIES_POLICY);
        if(primary.status!=='PROPOSED')return this.last={...primary,consensus:false,primary,verifier:null,views:compactPrimary(primaryPredictions)};

        let verifierPredictions=[];
        try{for(const view of views)verifierPredictions.push(await inferVerifierOne(view));}
        catch(error){
          return this.last={
            status:'UNKNOWN',reason:'verifier-unavailable',scientificName:null,rawScore:primary.rawScore,margin:primary.margin,calibrated:false,consensus:false,
            primary,verifier:{status:'UNAVAILABLE',reason:String(error?.message||error)},views:compactPrimary(primaryPredictions)
          };
        }
        const verifier=decideVerifierViews(verifierPredictions),decision=decideModelConsensus(primary,verifier);
        return this.last={...decision,primary,verifier,views:compactPrimary(primaryPredictions),verifierViews:compactVerifier(verifierPredictions)};
      }catch(error){
        return this.last={status:'UNAVAILABLE',reason:String(error?.message||error),scientificName:null,rawScore:null,margin:null,calibrated:false,consensus:false};
      }
    }
  };
}
