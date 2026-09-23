export const P0A_GATE_VERSION='ssd-mobilenet-v1-coco-int8-v2';
export const ORT_VERSION='1.30.0';
export const ORT_SCRIPT_URL='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.min.js';
export const ORT_WASM_BASE='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/';
export const MODEL_URL='https://huggingface.co/onnxmodelzoo/ssd_mobilenet_v1_12-int8/resolve/main/ssd_mobilenet_v1_12-int8.onnx';
const INPUT_SIZE=320;
const MIN_SIDE=96;
const COCO=[
'person','bicycle','car','motorcycle','airplane','bus','train','truck','boat','traffic light','fire hydrant','n/a','stop sign','parking meter','bench','bird','cat','dog','horse','sheep','cow','elephant','bear','zebra','giraffe','n/a','backpack','umbrella','n/a','n/a','handbag','tie','suitcase','frisbee','skis','snowboard','sports ball','kite','baseball bat','baseball glove','skateboard','surfboard','tennis racket','bottle','n/a','wine glass','cup','fork','knife','spoon','bowl','banana','apple','sandwich','orange','broccoli','carrot','hot dog','pizza','donut','cake','chair','couch','potted plant','bed','n/a','dining table','n/a','n/a','toilet','n/a','tv','laptop','mouse','remote','keyboard','cell phone','microwave','oven','toaster','sink','refrigerator','n/a','book','clock','vase','scissors','teddy bear','hair drier','toothbrush'];
const GROUPS={
  animal:new Set(['bird','cat','dog','horse','sheep','cow','elephant','bear','zebra','giraffe']),
  person:new Set(['person']),
  vehicle:new Set(['bicycle','car','motorcycle','airplane','bus','train','truck','boat']),
  screen:new Set(['tv','laptop','mouse','remote','keyboard','cell phone']),
  hardObject:new Set(['toilet','microwave','oven','toaster','refrigerator','scissors','toothbrush','backpack','suitcase','sports ball','skateboard','surfboard','tennis racket'])
};
let runtimePromise=null,sessionPromise=null;

function loadScript(){
  if(globalThis.ort?.InferenceSession)return Promise.resolve(globalThis.ort);
  if(runtimePromise)return runtimePromise;
  runtimePromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=ORT_SCRIPT_URL;s.async=true;s.crossOrigin='anonymous';
    s.onload=()=>globalThis.ort?.InferenceSession?resolve(globalThis.ort):reject(new Error('ort-runtime-missing'));
    s.onerror=()=>reject(new Error('ort-runtime-load-failed'));
    document.head.appendChild(s);
  });
  return runtimePromise;
}
async function getSession(){
  if(sessionPromise)return sessionPromise;
  sessionPromise=(async()=>{
    const ort=await loadScript();
    ort.env.wasm.numThreads=1;
    ort.env.wasm.wasmPaths=ORT_WASM_BASE;
    return ort.InferenceSession.create(MODEL_URL,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
  })();
  try{return await sessionPromise;}catch(error){sessionPromise=null;throw error;}
}
function boxArea(box){
  if(!Array.isArray(box)||box.length!==4)return 0;
  const [y1,x1,y2,x2]=box.map(Number);
  return Math.max(0,Math.min(1,y2)-Math.max(0,y1))*Math.max(0,Math.min(1,x2)-Math.max(0,x1));
}
function thresholdFor(label){
  if(GROUPS.person.has(label))return{score:.70,area:.50,category:'person'};
  if(GROUPS.animal.has(label)||GROUPS.vehicle.has(label))return{score:.80,area:.12,category:GROUPS.animal.has(label)?'animal':'object'};
  if(GROUPS.screen.has(label))return{score:.82,area:.20,category:'screen'};
  if(GROUPS.hardObject.has(label))return{score:.90,area:.30,category:'object'};
  return null;
}
export function decideFromDetections(detections){
  let plantCue=0,best=null;
  for(const d of detections||[]){
    const label=String(d.label||'').toLowerCase(),score=Number(d.score)||0,area=Number(d.area)||0;
    if(label==='potted plant')plantCue=Math.max(plantCue,score);
    const rule=thresholdFor(label);if(!rule||score<rule.score||area<rule.area)continue;
    if(!best||score>best.score)best={label,score,area,category:rule.category};
  }
  if(plantCue>=.30)return{decision:'UNKNOWN',plantCue,best:null,reason:'plant-cue'};
  if(!best)return{decision:'UNKNOWN',plantCue,best:null,reason:'no-strong-negative'};
  return{decision:'REJECT',plantCue,best,reason:'strong-coco-negative'};
}
async function decodeEvidence(entry){
  if(!entry?.data||!entry.width||!entry.height)return null;
  if(entry.width<MIN_SIDE||entry.height<MIN_SIDE)return null;
  const blob=new Blob([entry.data],{type:entry.type||'image/jpeg'});
  if('createImageBitmap'in globalThis){
    const bmp=await createImageBitmap(blob);
    return{image:bmp,close:()=>bmp.close?.()};
  }
  const url=URL.createObjectURL(blob);
  const img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
  return{image:img,close:()=>URL.revokeObjectURL(url)};
}
function parseOutputs(outputs){
  const entries=Object.entries(outputs).map(([name,t])=>({name,data:Array.from(t.data||[]),dims:t.dims||[]}));
  const boxesEntry=entries.find(x=>x.dims.at(-1)===4&&x.data.length>=4);
  const countEntry=entries.find(x=>x.data.length===1);
  const vectors=entries.filter(x=>x!==boxesEntry&&x!==countEntry&&x.data.length>1);
  let scores=vectors.find(x=>/score/i.test(x.name));
  let classes=vectors.find(x=>/class/i.test(x.name));
  if(!scores)scores=vectors.find(x=>x.data.every(v=>Number(v)>=0&&Number(v)<=1)&&x.data.some(v=>Math.abs(Number(v)-Math.round(Number(v)))>.001));
  if(!classes)classes=vectors.find(x=>x!==scores&&x.data.every(v=>Number(v)>=0&&Number(v)<100)&&x.data.slice(0,10).every(v=>Math.abs(Number(v)-Math.round(Number(v)))<.01));
  if(!boxesEntry||!scores||!classes)throw new Error('detector-output-unrecognized');
  const n=Math.min(Number(countEntry?.data?.[0]||scores.data.length),scores.data.length,classes.data.length,25);
  const out=[];
  for(let i=0;i<n;i++){
    const idx=Math.round(Number(classes.data[i]));
    out.push({label:(idx>0?COCO[idx-1]:null)||'unknown',score:Number(scores.data[i])||0,box:boxesEntry.data.slice(i*4,i*4+4),area:boxArea(boxesEntry.data.slice(i*4,i*4+4))});
  }
  return out;
}
async function inferOne(entry){
  const decoded=await decodeEvidence(entry);
  if(!decoded)return{executed:false,reason:'insufficient-resolution',detections:[]};
  try{
    const session=await getSession(),ort=globalThis.ort;
    const c=document.createElement('canvas');c.width=INPUT_SIZE;c.height=INPUT_SIZE;
    const ctx=c.getContext('2d',{alpha:false,willReadFrequently:true});if(!ctx)throw new Error('canvas-unavailable');
    ctx.drawImage(decoded.image,0,0,INPUT_SIZE,INPUT_SIZE);
    const rgba=ctx.getImageData(0,0,INPUT_SIZE,INPUT_SIZE).data,rgb=new Uint8Array(INPUT_SIZE*INPUT_SIZE*3);
    for(let i=0,j=0;i<rgba.length;i+=4){rgb[j++]=rgba[i];rgb[j++]=rgba[i+1];rgb[j++]=rgba[i+2];}
    const inputName=session.inputNames[0];
    const result=await session.run({[inputName]:new ort.Tensor('uint8',rgb,[1,INPUT_SIZE,INPUT_SIZE,3])});
    const detections=parseOutputs(result),decision=decideFromDetections(detections);
    return{executed:true,...decision,detections:detections.slice(0,8)};
  }finally{decoded.close?.();}
}
export function createAutomaticNonPlantAdapter(){
  const adapter={
    last:null,
    async infer(pixelSource){
      const evidence=(pixelSource?.evidence||[]).filter(Boolean).slice(0,2);
      if(!evidence.length)return{executed:false,reason:'no-evidence'};
      const results=[];
      try{for(const item of evidence)results.push(await inferOne(item));}
      catch(error){adapter.last={status:'UNAVAILABLE',reason:String(error?.message||error)};return{executed:false,reason:'model-unavailable'};}
      const executed=results.filter(x=>x.executed);
      if(!executed.length){adapter.last={status:'UNKNOWN',reason:results[0]?.reason||'not-executed'};return{executed:false,reason:results[0]?.reason||'not-executed'};}
      const rejects=executed.filter(x=>x.decision==='REJECT');
      const plantCue=Math.max(0,...executed.map(x=>x.plantCue||0));
      if(executed.length>1&&rejects.length!==executed.length){
        adapter.last={status:'UNKNOWN',reason:'multi-evidence-disagreement',results};
        return{executed:true,nonPlantScore:.50,plantScore:plantCue,topMargin:.0,category:null};
      }
      const best=rejects.sort((a,b)=>(b.best?.score||0)-(a.best?.score||0))[0];
      if(!best){
        adapter.last={status:'UNKNOWN',reason:'no-strong-negative',results};
        return{executed:true,nonPlantScore:.50,plantScore:plantCue,topMargin:.0,category:null};
      }
      const policyScore=.999;
      adapter.last={status:'REJECT',reason:'strong-coco-negative',label:best.best.label,category:best.best.category,rawScore:best.best.score,area:best.best.area,results};
      return{executed:true,nonPlantScore:policyScore,plantScore:plantCue,topMargin:Math.max(0,policyScore-plantCue),category:best.best.category};
    }
  };
  return adapter;
}
