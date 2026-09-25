import { renderSubjectGate, applySubjectAdmission } from './subject-gate-ui.js';
import { classifyPlantSubject } from './plant-subject-gate.js';
import { evidenceFromImageElement } from './local-subject-evidence.js';

export function attachFieldRuntimeGuard(doc=document){
 const field=doc.querySelector('#field'),save=doc.querySelector('#saveObsBtn'),quality=doc.querySelector('#qualityCard'),grid=doc.querySelector('#captureGrid');
 if(!field||!save||!quality||!grid)return{attached:false,reason:'field-controls-missing'};
 if(doc.querySelector('#subjectGateCard'))return{attached:true,reused:true};
 const card=doc.createElement('section');card.id='subjectGateCard';card.className='card subject-gate-card';card.style.cssText='background:linear-gradient(145deg,rgba(145,176,140,.15),rgba(16,35,27,.98));border-color:rgba(145,176,140,.48);box-shadow:0 18px 40px rgba(0,0,0,.16)';quality.insertAdjacentElement('afterend',card);
 let result=null;renderSubjectGate(card,result);
 const recognize=doc.createElement('button');recognize.id='recognizeBtn';recognize.className='btn secondary full';recognize.type='button';recognize.textContent='Riconoscimento bloccato';recognize.style.marginTop='10px';card.appendChild(recognize);
 const original=save.textContent;
 async function sync(){
   const thumbs=[...grid.querySelectorAll('.thumb')];
   if(!thumbs.length){result=null;renderSubjectGate(card,result);recognize.textContent='Riconoscimento in attesa della foto';applySubjectAdmission({recognitionButton:recognize},result);save.disabled=true;save.textContent=original;return;}
   const evidences=[];for(const img of thumbs){try{evidences.push(await evidenceFromImageElement(img,1))}catch{}}
   const evidence=evidences.length?{plant:Math.max(...evidences.map(e=>e.plant)),nonPlant:Math.max(...evidences.map(e=>e.nonPlant)),quality:1}:null;
   result=evidence?classifyPlantSubject(evidence):null;renderSubjectGate(card,result);applySubjectAdmission({recognitionButton:recognize},result);
   recognize.textContent=result?.status==='plant'?'Soggetto ammesso · recognition non ancora collegata':'Riconoscimento bloccato';
   save.disabled=false;save.textContent=result?.status==='plant'?'Salva osservazione botanica non identificata':'Salva osservazione non identificata';save.setAttribute('aria-describedby','subjectGateCard');
 }
 let timer;const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(sync,40)});observer.observe(grid,{childList:true,subtree:true});sync();
 return{attached:true,recognitionBlocked:true,detector:'local-pixels'};
}
export function attachToRuntimeFrame(frame){if(!frame)throw new TypeError('runtime frame is required');const bind=()=>{try{return attachFieldRuntimeGuard(frame.contentDocument)}catch{return{attached:false,reason:'runtime-unavailable'}}};frame.addEventListener('load',bind,{once:true});return bind;}
