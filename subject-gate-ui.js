import { SUBJECT, classifyPlantSubject, subjectGateCopy } from './plant-subject-gate.js';

/**
 * Safe bridge between detector evidence and the Field UI.
 * Fail-closed by design: missing/invalid evidence can never enable recognition.
 */
export function evaluateSubjectAdmission(evidence) {
  const result = classifyPlantSubject(evidence);
  const copy = subjectGateCopy(result);
  return Object.freeze({
    ...result,
    ...copy,
    mayRecognize: result.status === SUBJECT.PLANT,
    maySaveAsIdentified: false
  });
}

export function renderSubjectGate(container, evidence) {
  if (!container) throw new TypeError('subject gate container is required');
  const state = evaluateSubjectAdmission(evidence);
  container.dataset.subjectStatus = state.status;
  container.dataset.tone = state.tone;
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  container.innerHTML = '';

  const eyebrow = document.createElement('span');
  eyebrow.className = 'k';
  eyebrow.textContent = 'Controllo soggetto';
  const title = document.createElement('h3');
  title.textContent = state.title;
  const detail = document.createElement('p');
  detail.className = 'notice';
  detail.textContent = state.detail;

  container.append(eyebrow, title, detail);
  container.hidden = false;
  return state;
}

export function applySubjectAdmission({ recognitionButton, saveButton }, evidence) {
  const state = evaluateSubjectAdmission(evidence);
  if (recognitionButton) {
    recognitionButton.disabled = !state.mayRecognize;
    recognitionButton.setAttribute('aria-disabled', String(!state.mayRecognize));
  }
  // A plant-subject pass is not a species verification. Saving as identified
  // remains blocked until the recognition pipeline returns its own verified result.
  if (saveButton && saveButton.dataset.requiresVerifiedSpecies === 'true') {
    saveButton.disabled = true;
    saveButton.setAttribute('aria-disabled', 'true');
  }
  return state;
}
