(() => {
  'use strict';
  const STORAGE_KEY = 'herbarium.observations.v1';
  const MAX_IMAGE_EDGE = 1600;
  const JPEG_QUALITY = 0.78;
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

  const fileToDataUrl = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Impossibile leggere la foto.'));
    reader.readAsDataURL(file);
  });

  const loadImage = dataUrl => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Impossibile decodificare la foto.'));
    image.src = dataUrl;
  });

  const prepareEvidenceImage = async file => {
    const original = await fileToDataUrl(file);
    const image = await loadImage(original);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas non disponibile.');
    context.drawImage(image, 0, 0, width, height);
    return {
      image: canvas.toDataURL('image/jpeg', JPEG_QUALITY),
      width,
      height,
      originalBytes: file.size || null
    };
  };

  inputs.forEach(input => input.addEventListener('change', update));
  analyse.addEventListener('click', async () => {
    const selected = inputs.filter(input => input.files && input.files.length);
    if (!selected.length) return;
    analyse.disabled = true;
    result.textContent = 'Preparazione e salvataggio locale delle prove fotografiche…';
    try {
      const evidence = await Promise.all(selected.map(async input => {
        const prepared = await prepareEvidenceImage(input.files[0]);
        return {
          role: input.id,
          name: input.files[0].name || null,
          type: 'image/jpeg',
          ...prepared
        };
      }));
      const observations = loadObservations();
      observations.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
        roles: evidence.map(item => item.role),
        evidence,
        status: 'UNKNOWN'
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
      result.textContent = 'UNKNOWN — prove fotografiche ottimizzate e salvate solo su questo dispositivo; nessuna identificazione automatica simulata.';
      renderStats();
    } catch (error) {
      console.error(error);
      result.textContent = error && error.name === 'QuotaExceededError'
        ? 'UNKNOWN — spazio locale insufficiente. Nessuna osservazione incompleta è stata registrata.'
        : 'UNKNOWN — salvataggio locale non riuscito. Nessuna osservazione incompleta è stata registrata.';
    } finally {
      update();
    }
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
