import { renderSubjectGate, applySubjectAdmission } from './subject-gate-ui.js';
import { classifyPlantSubject } from './plant-subject-gate.js';
import { evidenceFromImageElement } from './local-subject-evidence.js';

const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
function aggregateEvidence(items){
 if(!items.length)return null;
 // Conservative multi-view policy: one green-looking frame must not override
 // contradictory views. Strongest negative evidence is preserved; plant support
 // blends best view with the mean and is penalised by disagreement.
 const plants=items.map(x=>x.plant),negatives=items.map(x=>x.nonPlant);
 const best=Math.max(...plants),avg=mean(plants),spread=best-Math.min(...plants);
 return {
  plant:+Math.max(0,Math.min(1,best*.58+avg*.42-spread*.35)).toFixed(3),
  nonPlant:+Math.max(...negatives).toFixed(3),
  quality:+Math.min(...items.map(x=>x.quality??0)).toFixed(3),
  source:'local-pixels-multiview',views:items.length,
  disagreement:+spread.toFixed(3)
 };
}

export function attachFieldRuntimeGuard(doc=document){
 const field=doc.querySelector('#field'),save=doc.querySelector('#saveObsBtn'),quality=doc.querySelector('#qualityCard'),grid=doc.querySelector('#captureGrid');
 if(!field||!save||!quality||!grid)return{attached:false,reason:'field-controls-missing'};
 if(doc.querySelector('#subjectGateCard'))return{attached:true,reused:true};
 const card=doc.createElement('section');card.id='subjectGateCard';card.className='card subject-gate-card';card.style.cssText='background:linear-gradient(145deg,rgba(145,176,140,.15),rgba(16,35,27,.98));border-color:rgba(145,176,140,.48);box-shadow:0 18px 40px rgba(0,0,0,.16)';quality.insertAdjacentElement('afterend',card);
 let result=null;renderSubjectGate(card,result);
 const recognize=doc.createElement('button');recognize.id='recognizeBtn';recognize.className='btn secondary full';recognize.type='button';recognize.textContent='Riconoscimento bloccato';recognize.style.marginTop='10px';card.appendChild(recognize);
 const evidenceCopy=doc.createElement('p');evidenceCopy.className='notice';evidenceCopy.setAttribute('aria-live','polite');card.appendChild(evidenceCopy);
 const original=save.textContent;let syncVersion=0;
 async function sync(){
   const version=++syncVersion,thumbs=[...grid.querySelectorAll('.thumb')];
   if(!thumbs.length){result=null;renderSubjectGate(card,result);recognize.textContent='Riconoscimento in attesa della foto';evidenceCopy.textContent='Aggiungi una foto: il controllo avviene sul dispositivo.';applySubjectAdmission({recognitionButton:recognize},result);save.dataset.subjectStatus='unknown';save.disabled=true;save.textContent=original;return;}
   evidenceCopy.textContent='Controllo locale del soggetto in corso…';
   const evidences=[];for(const img of thumbs){try{evidences.push(await evidenceFromImageElement(img,1))}catch{}}
   if(version!==syncVersion)return;
   const evidence=aggregateEvidence(evidences);result=evidence?classifyPlantSubject(evidence):null;renderSubjectGate(card,result);applySubjectAdmission({recognitionButton:recognize},result);
   const status=result?.status;save.dataset.subjectStatus=status||'unknown';
   recognize.textContent=status==='plant'?'Soggetto ammesso · recognition non ancora collegata':'Riconoscimento bloccato';
   evidenceCopy.textContent=!evidence?'Controllo non disponibile: resta UNKNOWN.':status==='plant'?`Controllo locale superato su ${evidence.views} vista${evidence.views===1?'':'e'}. Nessuna specie viene ancora assegnata.`:status==='non-plant'?'Il soggetto non supera il controllo botanico. Puoi conservarlo solo come osservazione non identificata.':`Evidenza incerta su ${evidence.views} vista${evidence.views===1?'':'e'}: aggiungi una foto chiara di foglia o fiore.`;
   save.disabled=false;save.textContent=status==='plant'?'Salva osservazione botanica non identificata':'Salva osservazione non identificata';save.setAttribute('aria-describedby','subjectGateCard');
 }
 let timer;const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(sync,60)});observer.observe(grid,{childList:true,subtree:true});sync();
 return{attached:true,recognitionBlocked:true,detector:'local-pixels-multiview'};
}
export function attachToRuntimeFrame(frame){if(!frame)throw new TypeError('runtime frame is required');const bind=()=>{try{return attachFieldRuntimeGuard(frame.contentDocument)}catch{return{attached:false,reason:'runtime-unavailable'}}};frame.addEventListener('load',bind,{once:true});return bind;}
