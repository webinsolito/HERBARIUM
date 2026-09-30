import { renderSubjectGate, applySubjectAdmission } from './subject-gate-ui.js';
import { classifyPlantSubject } from './plant-subject-gate.js';
import { evidenceFromImageElement } from './local-subject-evidence.js';

const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
function aggregateEvidence(items){
  if(!items.length)return null;
  const plants=items.map(x=>x.plant),negatives=items.map(x=>x.nonPlant),best=Math.max(...plants),avg=mean(plants),spread=best-Math.min(...plants);
  return{
    plant:+Math.max(0,Math.min(1,best*.58+avg*.42-spread*.35)).toFixed(3),
    nonPlant:+Math.max(...negatives).toFixed(3),quality:+Math.min(...items.map(x=>x.quality??0)).toFixed(3),
    source:'local-pixels-multiview-v2',views:items.length,disagreement:+spread.toFixed(3),
    analysisMs:items.reduce((n,x)=>n+(x.analysis?.ms||0),0),analysisPixels:items.reduce((n,x)=>n+(x.analysis?.pixels||0),0),
    features:items.map(x=>x.features||{})
  };
}

function persistDecision(save,result,evidence){
  const status=result?.status||'unknown';
  save.dataset.subjectStatus=status;
  save.dataset.subjectReason=result?.reason||'analysis-unavailable';
  save.dataset.subjectPlant=String(result?.plant??0);
  save.dataset.subjectNonPlant=String(result?.nonPlant??0);
  save.dataset.subjectQuality=String(result?.quality??0);
  save.dataset.subjectSource=evidence?.source||'unavailable';
}

export function attachFieldRuntimeGuard(doc=document){
  const field=doc.querySelector('#field'),save=doc.querySelector('#saveObsBtn'),quality=doc.querySelector('#qualityCard'),grid=doc.querySelector('#captureGrid');
  if(!field||!save||!quality||!grid)return{attached:false,reason:'field-controls-missing'};
  if(doc.querySelector('#subjectGateCard'))return{attached:true,reused:true};

  const card=doc.createElement('section');card.id='subjectGateCard';card.className='card subject-gate-card';
  quality.insertAdjacentElement('afterend',card);
  let result=null;renderSubjectGate(card,result);
  const recognize=doc.createElement('button');recognize.id='recognizeBtn';recognize.className='btn secondary full';recognize.type='button';recognize.textContent='Riconoscimento in attesa della foto';recognize.style.marginTop='12px';card.appendChild(recognize);
  const evidenceCopy=doc.createElement('p');evidenceCopy.className='notice subject-evidence';evidenceCopy.setAttribute('aria-live','polite');card.appendChild(evidenceCopy);
  const original=save.textContent;let syncVersion=0,lastSignature='';

  async function sync(){
    const version=++syncVersion,thumbs=[...grid.querySelectorAll('.thumb')],signature=thumbs.map(x=>x.currentSrc||x.src||'').join('|');
    if(signature===lastSignature&&thumbs.length)return;lastSignature=signature;
    if(!thumbs.length){
      result=null;renderSubjectGate(card,result);recognize.textContent='Riconoscimento in attesa della foto';evidenceCopy.textContent='Aggiungi una foto: validazione e controllo avvengono solo sul dispositivo.';
      applySubjectAdmission({recognitionButton:recognize},result);persistDecision(save,result,null);save.disabled=true;save.setAttribute('aria-disabled','true');save.textContent=original;return;
    }

    card.dataset.loading='true';evidenceCopy.textContent='Analizzo il soggetto sul dispositivo…';save.disabled=true;save.setAttribute('aria-disabled','true');
    const evidences=[];for(const img of thumbs){try{evidences.push(await evidenceFromImageElement(img,1))}catch{}}
    if(version!==syncVersion)return;
    const evidence=aggregateEvidence(evidences);result=classifyPlantSubject(evidence);
    renderSubjectGate(card,result);card.dataset.loading='false';
    const admission=applySubjectAdmission({recognitionButton:recognize,saveButton:save},result);persistDecision(save,result,evidence);
    const status=result.status,perf=evidence?` · ${evidence.analysisMs} ms / ${evidence.analysisPixels.toLocaleString('it-IT')} px`:'';
    if(status==='plant'){
      recognize.textContent='Soggetto ammesso · specie ancora UNKNOWN';
      evidenceCopy.textContent=`Soggetto botanico plausibile su ${evidence.views} vista${evidence.views===1?'':'e'}${perf}. Nessun nome viene assegnato.`;
      save.textContent='Salva come specie UNKNOWN';
    }else if(status==='non-plant'){
      recognize.textContent='REJECT · riconoscimento bloccato';
      evidenceCopy.textContent=`Foto respinta dal controllo botanico${perf}. Non verrà salvata nella raccolta: sostituiscila con foglia, fiore o pianta intera.`;
      save.textContent='Foto respinta · riprova';
    }else{
      recognize.textContent='UNKNOWN · riconoscimento bloccato';
      evidenceCopy.textContent=`Evidenza insufficiente su ${evidence?.views||thumbs.length} vista${thumbs.length===1?'':'e'}${perf}. Puoi salvarla solo nel taccuino UNKNOWN.`;
      save.textContent='Salva nel taccuino UNKNOWN';
    }
    save.disabled=!admission.maySaveUnknown;save.setAttribute('aria-disabled',String(save.disabled));save.setAttribute('aria-describedby','subjectGateCard');
  }

  let timer;const scheduleSync=()=>{clearTimeout(timer);timer=setTimeout(sync,120)};
  const Observer=doc.defaultView?.MutationObserver||MutationObserver;const observer=new Observer(scheduleSync);
  observer.observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
  doc.defaultView?.addEventListener('herbarium:shot-updated',scheduleSync);sync();
  return{attached:true,recognitionBlocked:true,detector:'local-pixels-multiview-v2',analysisEdge:160,rejectPersists:false};
}

export function attachToRuntimeFrame(frame){
  if(!frame)throw new TypeError('runtime frame is required');
  const bind=()=>{try{return attachFieldRuntimeGuard(frame.contentDocument)}catch{return{attached:false,reason:'runtime-unavailable'}}};
  frame.addEventListener('load',bind);try{if(frame.contentDocument?.readyState==='interactive'||frame.contentDocument?.readyState==='complete')queueMicrotask(bind)}catch{}
  return bind;
}
