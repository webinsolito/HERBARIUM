import { renderSubjectGate, applySubjectAdmission } from './subject-gate-ui.js';

const copy = {
  missing: 'Il controllo soggetto non è ancora disponibile per questa foto. Puoi conservarla nel taccuino, ma Herbarium non la tratterà come specie identificata.'
};

export function attachFieldRuntimeGuard(doc = document) {
  const field = doc.querySelector('#field');
  const save = doc.querySelector('#saveObsBtn');
  const quality = doc.querySelector('#qualityCard');
  if (!field || !save || !quality) return { attached: false, reason: 'field-controls-missing' };
  if (doc.querySelector('#subjectGateCard')) return { attached: true, reused: true };

  const card = doc.createElement('section');
  card.id = 'subjectGateCard';
  card.className = 'card subject-gate-card';
  card.style.cssText = 'background:linear-gradient(145deg,rgba(145,176,140,.12),rgba(16,35,27,.98));border-color:rgba(145,176,140,.42)';
  quality.insertAdjacentElement('afterend', card);

  const state = renderSubjectGate(card, null);
  const detail = card.querySelector('.notice');
  if (detail) detail.textContent = copy.missing;

  const recognize = doc.createElement('button');
  recognize.id = 'recognizeBtn';
  recognize.className = 'btn secondary full';
  recognize.type = 'button';
  recognize.textContent = 'Riconoscimento in attesa del controllo soggetto';
  recognize.style.marginTop = '10px';
  card.appendChild(recognize);
  applySubjectAdmission({ recognitionButton: recognize, saveButton: save }, null);

  const originalSaveLabel = save.textContent;
  const sync = () => {
    const hasPhoto = !!doc.querySelector('#captureGrid .thumb');
    // Saving an observation is allowed, but identification is fail-closed.
    // Existing RC3 persistence marks manual names unverified; no species is promoted.
    save.disabled = !hasPhoto;
    save.textContent = hasPhoto ? 'Salva osservazione non identificata' : originalSaveLabel;
    save.setAttribute('aria-describedby', 'subjectGateCard');
  };
  const observer = new MutationObserver(sync);
  observer.observe(doc.querySelector('#captureGrid'), { childList: true, subtree: true });
  sync();
  return { attached: true, subjectStatus: state.status, recognitionBlocked: recognize.disabled };
}

export function attachToRuntimeFrame(frame) {
  if (!frame) throw new TypeError('runtime frame is required');
  const bind = () => {
    try { return attachFieldRuntimeGuard(frame.contentDocument); }
    catch { return { attached: false, reason: 'runtime-unavailable' }; }
  };
  frame.addEventListener('load', bind, { once: true });
  return bind;
}
