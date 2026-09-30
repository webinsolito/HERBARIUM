import { SUBJECT, classifyPlantSubject, subjectGateCopy } from './plant-subject-gate.js';

export function evaluateSubjectAdmission(evidence) {
  const result = classifyPlantSubject(evidence);
  const copy = subjectGateCopy(result);
  return Object.freeze({
    ...result,...copy,
    mayRecognize: result.status === SUBJECT.PLANT,
    maySaveUnknown: result.status !== SUBJECT.NON_PLANT,
    maySaveAsIdentified: false
  });
}

export function renderSubjectGate(container, evidence) {
  if (!container) throw new TypeError('subject gate container is required');
  const state = evaluateSubjectAdmission(evidence);
  const label=state.status===SUBJECT.NON_PLANT?'REJECT':state.status===SUBJECT.PLANT?'BOTANICO · SPECIE UNKNOWN':'UNKNOWN';
  container.dataset.subjectStatus = state.status;
  container.dataset.tone = state.tone;
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  container.innerHTML = '';

  const head=document.createElement('div');head.className='subject-result-head';
  const eyebrow = document.createElement('span');eyebrow.className = 'k';eyebrow.textContent = 'Esito locale';
  const stamp=document.createElement('strong');stamp.className=`subject-stamp ${state.tone}`;stamp.textContent=label;
  head.append(eyebrow,stamp);
  const title = document.createElement('h3');title.textContent = state.title;
  const detail = document.createElement('p');detail.className = 'notice';detail.textContent = state.detail;
  const privacy=document.createElement('small');privacy.className='subject-privacy';privacy.textContent='Sul dispositivo · foto privata · nessuna specie assegnata';
  container.append(head,title,detail,privacy);
  container.hidden = false;
  return state;
}

export function applySubjectAdmission({ recognitionButton, saveButton }, evidence) {
  const state = evaluateSubjectAdmission(evidence);
  if (recognitionButton) {
    recognitionButton.disabled = !state.mayRecognize;
    recognitionButton.setAttribute('aria-disabled', String(!state.mayRecognize));
  }
  if(saveButton){
    saveButton.disabled=!state.maySaveUnknown||saveButton.dataset.requiresVerifiedSpecies==='true';
    saveButton.setAttribute('aria-disabled',String(saveButton.disabled));
  }
  return state;
}
