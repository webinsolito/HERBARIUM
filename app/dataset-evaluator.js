import { evidenceFromPixels } from './local-subject-evidence.js';
import { evaluatePlantSubject } from './plant-subject-gate.js';

const LABELS=new Set(['PLANT','NON_PLANT']);
export function summarizeEvaluations(rows=[]){
 const out={total:rows.length,plant:{total:0,pass:0,reject:0,uncertain:0},nonPlant:{total:0,pass:0,reject:0,uncertain:0}};
 for(const r of rows){const k=r.label==='PLANT'?'plant':'nonPlant';out[k].total++;const s=r.status==='PLANT'?'pass':r.status==='NON_PLANT'?'reject':'uncertain';out[k][s]++;}
 return out;
}
export async function evaluateDataset(entries,{decode}={}){
 if(!Array.isArray(entries)) throw new TypeError('entries must be an array');
 if(typeof decode!=='function') throw new TypeError('decode adapter required');
 const rows=[];
 for(const entry of entries){
  if(!entry||!LABELS.has(entry.label)||!entry.file) {rows.push({name:entry?.name||'',label:entry?.label||null,status:'INVALID',reason:'invalid-entry'});continue;}
  try{
   const pixels=await decode(entry.file); const evidence=evidenceFromPixels(pixels);
   const decision=evaluatePlantSubject(evidence);
   rows.push({name:entry.name||entry.file.name||'',label:entry.label,status:decision.status,evidence,reason:decision.reason});
  }catch(error){rows.push({name:entry.name||entry.file.name||'',label:entry.label,status:'INVALID',reason:error?.message||'decode-failed'});}
 }
 const valid=rows.filter(r=>r.status!=='INVALID');
 return {rows,summary:summarizeEvaluations(valid),invalid:rows.length-valid.length,scientificMetricsAvailable:valid.length>0&&valid.some(r=>r.label==='PLANT')&&valid.some(r=>r.label==='NON_PLANT')};
}

export async function decodeImageFile(file){
 if(!(file instanceof Blob)) throw new TypeError('image file required');
 const bitmap=await createImageBitmap(file);try{
  const max=192,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height)),width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0,width,height);
  return {...ctx.getImageData(0,0,width,height),quality:1};
 }finally{bitmap.close();}
}
