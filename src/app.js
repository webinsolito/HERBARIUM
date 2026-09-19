(() => {
  'use strict';
  const inputs = [...document.querySelectorAll('input[type=file]')];
  const analyse = document.getElementById('analyse');
  const result = document.getElementById('result');
  const update = () => {
    const count = inputs.filter(input => input.files && input.files.length).length;
    analyse.disabled = count === 0;
    result.textContent = count ? `UNKNOWN — ${count} vista/e raccolte. Motore botanico validato non installato.` : 'UNKNOWN — aggiungi almeno una foto.';
  };
  inputs.forEach(input => input.addEventListener('change', update));
  analyse.addEventListener('click', () => { result.textContent = 'UNKNOWN — nessuna identificazione automatica simulata in questa baseline.'; });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(button.dataset.view).classList.add('active');
  }));
  const network = document.getElementById('network');
  const setNetwork = () => { network.textContent = navigator.onLine ? 'online · local-first' : 'offline-first'; };
  addEventListener('online', setNetwork); addEventListener('offline', setNetwork); setNetwork(); update();
})();
