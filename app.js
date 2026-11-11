'use strict';

// Este proyecto utiliza pdf-lib en el navegador: nunca envía los PDFs a un servidor.
const state = {
  a: null,
  b: null,
  loading: { a: false, b: false },
  request: { a: 0, b: 0 },
  busy: false,
  resultUrl: null,
};
const $ = (selector) => document.querySelector(selector);
const choose = () => document.querySelector('input[name="order"]:checked')?.value || 'reverse';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function setStatus(message = '', type = 'info') {
  const node = $('#status');
  node.textContent = message;
  node.className = message ? `status-message ${type}` : 'status-message hidden';
}

function invalidateResult() {
  if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
  state.resultUrl = null;
  $('#result').classList.add('hidden');
  $('#download').removeAttribute('href');
}

function refreshButton() {
  const ready = Boolean(state.a?.doc && state.b?.doc);
  $('#generate').disabled = !ready || state.busy || state.loading.a || state.loading.b;
  $('#generate-text').textContent = state.busy ? 'Intercalando páginas…' : 'Intercalar y generar PDF';
}

function refreshFile(slot) {
  const entry = state[slot];
  const selected = $(`#selected-${slot}`);
  const drop = $(`#drop-${slot}`);
  selected.classList.toggle('hidden', !entry);
  drop.classList.toggle('hidden', Boolean(entry));
  if (entry) {
    $(`#name-${slot}`).textContent = entry.file.name;
    $(`#meta-${slot}`).textContent = state.loading[slot]
      ? 'Leyendo el documento…'
      : `${entry.count} ${entry.count === 1 ? 'página' : 'páginas'} · ${formatSize(entry.file.size)}`;
  }
}

function pagePlan(totalA, totalB, reverse) {
  const plan = [];
  for (let i = 0; i < Math.max(totalA, totalB); i += 1) {
    if (i < totalA) plan.push({ source: 'a', page: i + 1 });
    if (i < totalB) plan.push({ source: 'b', page: reverse ? totalB - i : i + 1 });
  }
  return plan;
}

function updatePreview() {
  const hasBoth = Boolean(state.a?.doc && state.b?.doc);
  const totalA = hasBoth ? state.a.count : 4;
  const totalB = hasBoth ? state.b.count : 4;
  const preview = pagePlan(totalA, totalB, choose() === 'reverse');
  const container = $('#page-stream');
  container.replaceChildren();

  // Para documentos largos mostramos las primeras 8 páginas y las 2 últimas.
  const firstCount = preview.length > 12 ? 8 : preview.length;
  const shown = preview.length > 12
    ? [...preview.slice(0, firstCount), null, ...preview.slice(-2)]
    : preview;

  for (const [index, item] of shown.entries()) {
    if (!item) {
      const ellipsis = document.createElement('div');
      ellipsis.className = 'stream-ellipsis';
      ellipsis.textContent = `··· ${preview.length - 10} páginas intermedias ···`;
      container.append(ellipsis);
      continue;
    }
    const resultNumber = index > firstCount ? preview.length - (shown.length - index) + 1 : index + 1;
    const node = document.createElement('div');
    node.className = 'stream-item';

    const number = document.createElement('span');
    number.className = 'stream-num';
    number.textContent = String(resultNumber).padStart(2, '0');

    const symbol = document.createElement('span');
    symbol.className = `stream-symbol ${item.source}`;
    symbol.textContent = item.source.toUpperCase();

    const name = document.createElement('span');
    name.className = 'stream-name';
    name.textContent = item.source === 'a' ? 'Primer PDF' : 'Segundo PDF';

    const page = document.createElement('span');
    page.className = 'stream-page';
    page.textContent = `Pág. ${item.page}`;

    node.append(number, symbol, name, page);
    container.append(node);
  }

  $('#total-pages').textContent = hasBoth ? String(totalA + totalB) : '—';
  $('#preview-caption').textContent = hasBoth
    ? `Orden que tendrá tu documento final (${totalA + totalB} páginas).`
    : 'Ejemplo de cómo quedarán las páginas al intercalar.';
}

function clearFile(slot) {
  if (state.busy) return;
  state.request[slot] += 1; // Invalida cualquier lectura asíncrona anterior.
  state[slot] = null;
  state.loading[slot] = false;
  $(`#file-${slot}`).value = '';
  invalidateResult();
  setStatus();
  refreshFile(slot);
  refreshButton();
  updatePreview();
}

async function loadFile(slot, file) {
  if (state.busy || !file) return;
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
    setStatus('El archivo seleccionado no parece ser un PDF. Elige un documento .pdf.', 'error');
    return;
  }
  if (file.size === 0) {
    setStatus('El archivo está vacío. Selecciona un PDF válido.', 'error');
    return;
  }
  if (!window.PDFLib?.PDFDocument) {
    setStatus('No se ha podido cargar la biblioteca PDF. Comprueba tu conexión a Internet y actualiza la página.', 'error');
    return;
  }

  const requestId = ++state.request[slot];
  state.loading[slot] = true;
  state[slot] = { file, count: 0, doc: null };
  invalidateResult();
  setStatus();
  refreshFile(slot);
  refreshButton();
  updatePreview();

  try {
    const doc = await window.PDFLib.PDFDocument.load(await file.arrayBuffer());
    if (requestId !== state.request[slot]) return;
    const count = doc.getPageCount();
    if (!count) throw new Error('El documento no contiene páginas.');
    state[slot] = { file, doc, count };
    if (file.size > 75 * 1024 * 1024) {
      setStatus('El archivo es grande. El procesamiento puede consumir bastante memoria en este dispositivo.', 'info');
    }
  } catch (err) {
    if (requestId !== state.request[slot]) return;
    state[slot] = null;
    $(`#file-${slot}`).value = '';
    const encrypted = /encrypt|password|contraseñ|cifrad/i.test(String(err?.message || err?.name || ''));
    setStatus(encrypted
      ? 'No se pueden procesar PDFs protegidos con contraseña. Desbloquéalo previamente.'
      : `No se ha podido leer «${file.name}». Comprueba que sea un PDF válido.`, 'error');
    console.error('Error al leer PDF:', err);
  } finally {
    if (requestId === state.request[slot]) {
      state.loading[slot] = false;
      refreshFile(slot);
      refreshButton();
      updatePreview();
    }
  }
}

async function generate() {
  if (state.busy || !state.a?.doc || !state.b?.doc) return;
  if (!window.PDFLib?.PDFDocument) {
    setStatus('No está disponible la biblioteca PDF. Comprueba tu conexión e inténtalo de nuevo.', 'error');
    return;
  }
  state.busy = true;
  invalidateResult();
  setStatus('Procesando los documentos localmente en tu navegador…', 'info');
  refreshButton();

  try {
    // El segundo PDF se COPIA en orden inverso solo si se ha marcado la opción.
    const output = await window.PDFLib.PDFDocument.create();
    const indexesA = state.a.doc.getPageIndices();
    const indexesB = state.b.doc.getPageIndices();
    if (choose() === 'reverse') indexesB.reverse();
    const pagesA = await output.copyPages(state.a.doc, indexesA);
    const pagesB = await output.copyPages(state.b.doc, indexesB);

    for (let i = 0; i < Math.max(pagesA.length, pagesB.length); i += 1) {
      if (i < pagesA.length) output.addPage(pagesA[i]);
      if (i < pagesB.length) output.addPage(pagesB[i]);
    }
    output.setTitle('Documento intercalado');
    output.setCreator('IntercalaPDF');
    const bytes = await output.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    state.resultUrl = URL.createObjectURL(blob);
    $('#download').href = state.resultUrl;
    $('#download').download = 'documento_intercalado.pdf';
    $('#result-meta').textContent = `${output.getPageCount()} páginas · ${formatSize(blob.size)}`;
    $('#result').classList.remove('hidden');
    setStatus();
  } catch (err) {
    console.error('Error intercalando PDFs:', err);
    setStatus('No se pudo generar el documento. Si los archivos son grandes, prueba en un equipo con más memoria o con PDFs más pequeños.', 'error');
  } finally {
    state.busy = false;
    refreshButton();
  }
}

for (const slot of ['a', 'b']) {
  const drop = $(`#drop-${slot}`);
  const input = $(`#file-${slot}`);
  input.addEventListener('change', (event) => loadFile(slot, event.target.files?.[0]));
  for (const type of ['dragenter', 'dragover']) {
    drop.addEventListener(type, (event) => {
      event.preventDefault();
      event.stopPropagation();
      drop.classList.add('dragging');
    });
  }
  drop.addEventListener('dragleave', (event) => {
    event.preventDefault();
    if (!drop.contains(event.relatedTarget)) drop.classList.remove('dragging');
  });
  drop.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    drop.classList.remove('dragging');
    loadFile(slot, event.dataTransfer?.files?.[0]);
  });
  $(`[data-clear="${slot}"]`).addEventListener('click', () => clearFile(slot));
}

document.querySelectorAll('input[name="order"]').forEach((input) => {
  input.addEventListener('change', () => {
    invalidateResult();
    setStatus();
    updatePreview();
  });
});
$('#generate').addEventListener('click', generate);
window.addEventListener('beforeunload', invalidateResult);

updatePreview();
refreshButton();
