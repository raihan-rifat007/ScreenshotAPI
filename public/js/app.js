'use strict';

const $ = id => document.getElementById(id);

const form = $('capture-form');
const urlInput = $('url-input');
const captureBtn = $('capture-btn');
const statusDot = $('status-dot');
const resultEmpty = $('result-empty');
const resultImg = $('result-img');
const resultPdf = $('result-pdf');
const readout = $('readout');
const errorLine = $('error-line');
const consoleFrame = document.querySelector('.console-frame');

let lastBlobUrl = null;
let lastOptions = null;

async function loadDevices() {
  try {
    const res = await fetch('/api/screenshot/devices');
    const data = await res.json();
    const select = $('opt-device');
    (data.devices || []).forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.dataset.width = d.width;
      opt.dataset.height = d.height;
      opt.textContent = `${d.label} (${d.width}\u00d7${d.height})`;
      select.appendChild(opt);
    });
  } catch {}
}

$('opt-device').addEventListener('change', () => {
  const selected = $('opt-device').selectedOptions[0];
  const isCustom = $('opt-device').value === '';
  $('opt-width').disabled = !isCustom;
  $('opt-height').disabled = !isCustom;
  if (!isCustom) {
    $('opt-width').value = selected.dataset.width;
    $('opt-height').value = selected.dataset.height;
  }
});

function buildParams() {
  const params = new URLSearchParams();
  params.set('url', urlInput.value.trim());
  const device = $('opt-device').value;
  if (device) {
    params.set('device', device);
  } else {
    params.set('width', $('opt-width').value);
    params.set('height', $('opt-height').value);
  }
  params.set('format', $('opt-format').value);
  params.set('fullPage', $('opt-fullpage').checked);
  params.set('darkMode', $('opt-darkmode').checked);
  params.set('blockAds', $('opt-blockads').checked);
  params.set('waitUntil', $('opt-wait').value);
  const delay = parseInt($('opt-delay').value, 10) || 0;
  if (delay > 0) params.set('delay', delay);
  return params;
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function showError(msg) {
  errorLine.textContent = msg;
  errorLine.classList.remove('hidden');
}
function hideError() { errorLine.classList.add('hidden'); }

form.addEventListener('submit', async e => {
  e.preventDefault();
  hideError();
  captureBtn.disabled = true;
  captureBtn.textContent = 'Capturing…';
  statusDot.classList.add('live');
  consoleFrame.classList.add('locking');

  const params = buildParams();
  lastOptions = params;

  try {
    const started = performance.now();
    const res = await fetch(`/api/screenshot?${params.toString()}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body.errors && body.errors[0]) || body.error || `Request failed (${res.status})`);
    }
    const blob = await res.blob();
    const tookMs = res.headers.get('x-capture-time-ms') || Math.round(performance.now() - started);

    if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
    lastBlobUrl = URL.createObjectURL(blob);

    resultEmpty.classList.add('hidden');
    resultPdf.classList.add('hidden');
    $('rd-dims').textContent = '…';
    resultImg.onload = () => {
      $('rd-dims').textContent = `${resultImg.naturalWidth} \u00d7 ${resultImg.naturalHeight}`;
    };
    resultImg.onerror = () => {
      $('rd-dims').textContent = 'decode failed';
    };
    resultImg.src = lastBlobUrl;
    resultImg.classList.remove('hidden');

    $('rd-format').textContent = $('opt-format').value.toUpperCase();
    $('rd-size').textContent = fmtBytes(blob.size);
    $('rd-time').textContent = `${tookMs} ms`;
    readout.classList.remove('hidden');

    $('dl-btn').href = lastBlobUrl;
    $('dl-btn').download = `screenshot.${$('opt-format').value}`;
  } catch (err) {
    showError(err.message || 'Capture failed');
  } finally {
    captureBtn.disabled = false;
    captureBtn.textContent = 'Capture';
    statusDot.classList.remove('live');
    setTimeout(() => consoleFrame.classList.remove('locking'), 300);
  }
});

$('copy-btn').addEventListener('click', async () => {
  if (!lastOptions) return;
  const fullUrl = `${window.location.origin}/api/screenshot?${lastOptions.toString()}`;
  try {
    await navigator.clipboard.writeText(fullUrl);
    const btn = $('copy-btn');
    const original = btn.textContent;
    btn.textContent = 'Copied';
    setTimeout(() => { btn.textContent = original; }, 1400);
  } catch {}
});

$('pdf-btn').addEventListener('click', async () => {
  if (!urlInput.value.trim()) return;
  hideError();
  const btn = $('pdf-btn');
  const original = btn.textContent;
  btn.textContent = 'Generating…';
  try {
    const params = new URLSearchParams({ url: urlInput.value.trim() });
    const res = await fetch(`/api/pdf?${params.toString()}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body.errors && body.errors[0]) || body.error || 'PDF generation failed');
    }
    const blob = await res.blob();
    const pdfUrl = URL.createObjectURL(blob);
    resultImg.classList.add('hidden');
    resultEmpty.classList.add('hidden');
    resultPdf.href = pdfUrl;
    resultPdf.classList.remove('hidden');
  } catch (err) {
    showError(err.message);
  } finally {
    btn.textContent = original;
  }
});

$('copy-curl').addEventListener('click', async () => {
  const text = $('curl-block').textContent;
  try {
    await navigator.clipboard.writeText(text);
    const btn = $('copy-curl');
    const original = btn.textContent;
    btn.textContent = 'Copied';
    setTimeout(() => { btn.textContent = original; }, 1400);
  } catch {}
});

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem('theme', theme);
  const icon = $('theme-icon');
  icon.innerHTML = theme === 'dark'
    ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
    : '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
}

$('theme-btn').addEventListener('click', () => {
  applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
});

const savedTheme = localStorage.getItem('theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(savedTheme);

$('curl-block').textContent =
  `curl "${window.location.origin}/api/screenshot?url=https://example.com&width=1280&height=800" --output shot.png`;

loadDevices();
