(() => {
  'use strict';
  const STORAGE_KEY = 'herbarium.observations.v1';
  const inputs = [...document.querySelectorAll('input[type=file]')];
  const analyse = document.getElementById('analyse');
  const result = document.getElementById('result');
  const observationCount = document.getElementById('observationCount');
  const speciesCount = document.getElementById('speciesCount');

  const loadObservations = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  const renderStats = () => {
    const observations = loadObservations();
    observationCount.textContent = String(observations.length);
    speciesCount.textContent = '0'; // UNKNOWN observations never become verified species.
  };

  const update = () => {
    const count = inputs.filter(input => input.files && input.files.length).length;
    analyse.disabled = count === 0;
    result.textContent = count
      ? `UNKNOWN — ${count} vista/e raccolte. Motore botanico validato non installato.`
      : 'UNKNOWN — aggiungi almeno una foto.';
  };

  inputs.forEach(input => input.addEventListener('change', update));
  analyse.addEventListener('click', () => {
    const roles = inputs.filter(input => input.files && input.files.length).map(input => input.id);
    if (!roles.length) return;
    const observations = loadObservations();
    observations.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
      roles,
      status: 'UNKNOWN'
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
    result.textContent = 'UNKNOWN — osservazione salvata localmente; nessuna identificazione automatica simulata.';
    renderStats();
  });

  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(button.dataset.view).classList.add('active');
  }));

  const network = document.getElementById('network');
  const setNetwork = () => { network.textContent = navigator.onLine ? 'online · local-first' : 'offline-first'; };
  addEventListener('online', setNetwork);
  addEventListener('offline', setNetwork);
  setNetwork();
  renderStats();
  update();
})();
