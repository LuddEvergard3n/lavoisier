/**
 * modules/solutions/index.js — Módulo: Soluções e pH
 * Lavoisier — Laboratório Visual de Química
 *
 * Seções: pH interativo, teoria ácido-base, diluição C1V1=C2V2, tampões Henderson-Hasselbalch
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';
import { SimLoop }         from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

const PH_EXAMPLES = [
  { ph: 0.0, label: 'HCl concentrado'  },
  { ph: 2.0, label: 'Suco de limão'    },
  { ph: 3.0, label: 'Vinagre'          },
  { ph: 4.5, label: 'Café'             },
  { ph: 5.5, label: 'Chuva ácida'      },
  { ph: 7.0, label: 'Água pura (25°C)' },
  { ph: 7.4, label: 'Sangue humano'    },
  { ph: 8.3, label: 'Água do mar'      },
  { ph: 9.0, label: 'Bicarbonato'      },
  { ph:11.0, label: 'Amônia doméstica' },
  { ph:13.0, label: 'Soda cáustica'    },
];

const BUFFERS = [
  { name:'Acetato',     pKa:4.76, acid:'CH₃COOH', base:'CH₃COO⁻', use:'Conservantes alimentares, fermentação' },
  { name:'Carbonato',   pKa:6.35, acid:'H₂CO₃',   base:'HCO₃⁻',   use:'Regulação do pH do sangue' },
  { name:'Fosfato',     pKa:7.20, acid:'H₂PO₄⁻',  base:'HPO₄²⁻',  use:'Tampão intracelular, soluções fisiológicas' },
  { name:'Amônia',      pKa:9.25, acid:'NH₄⁺',     base:'NH₃',     use:'Produtos de limpeza, síntese industrial' },
];

function phColor(ph) {
  const t = Math.max(0, Math.min(1, ph / 14));
  if (t < 0.5) {
    const f = t * 2;
    return `rgb(${Math.round(239*(1-f)+107*f)},${Math.round(71*(1-f)+203*f)},${Math.round(111*(1-f)+119*f)})`;
  }
  const f = (t - 0.5) * 2;
  return `rgb(${Math.round(107*(1-f)+79*f)},${Math.round(203*(1-f)+162*f)},${Math.round(119*(1-f)+219*f)})`;
}

let _ph = 7.0, _loop = null, _bufIdx = 1, _bufRatio = 1.0;
let _dilC1 = 1.0, _dilV1 = 100, _dilV2 = 500;
let _exAttempts = 0, _exDone = false;

function startCanvas(canvasEl) {
  const frame = canvasEl.parentElement;
  const W = Math.min(frame.clientWidth || 520, 520), H = 240;
  const dpr = window.devicePixelRatio || 1;
  canvasEl.width  = Math.round(W * dpr);
  canvasEl.height = Math.round(H * dpr);
  canvasEl.style.width  = W + 'px';
  canvasEl.style.height = H + 'px';
  const ctx = canvasEl.getContext('2d');
  ctx.scale(dpr, dpr);
  if (_loop) _loop.stop();

  _loop = new SimLoop((dt, t) => {
    clearCanvas(ctx, W, H);
    const padX = 24, sY = 36, sH = 22, sW = W - padX * 2;
    const grad = ctx.createLinearGradient(padX, 0, padX + sW, 0);
    grad.addColorStop(0,   '#ef476f'); grad.addColorStop(0.35,'#ffd166');
    grad.addColorStop(0.5, '#6bcb77'); grad.addColorStop(0.65,'#4fc3f7');
    grad.addColorStop(1,   '#4163b0');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(padX, sY, sW, sH, 4); ctx.fill();

    for (let i = 0; i <= 14; i++) {
      const x = padX + (i / 14) * sW;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x, sY + sH - 5, 1, 5);
      ctx.fillStyle = COLOR.textMuted; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(i, x, sY + sH + 13);
    }
    ctx.fillStyle = COLOR.textMuted; ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';   ctx.fillText('ácido',  padX,          sY - 7);
    ctx.textAlign = 'center'; ctx.fillText('neutro', padX + sW / 2, sY - 7);
    ctx.textAlign = 'right';  ctx.fillText('base',   padX + sW,     sY - 7);

    const mx = padX + (_ph / 14) * sW, pulse = 1 + 0.07 * Math.sin(t * 3);
    ctx.beginPath(); ctx.arc(mx, sY + sH / 2, 7 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = COLOR.bg; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = COLOR.bg; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(_ph.toFixed(1), mx, sY + sH / 2 + 3);

    const nearby = PH_EXAMPLES.filter(e => Math.abs(e.ph - _ph) < 2).slice(0, 3);
    let dotY = sY + sH + 28;
    nearby.forEach(ex => {
      const x = padX + (ex.ph / 14) * sW;
      ctx.beginPath(); ctx.arc(x, dotY, 4, 0, Math.PI * 2);
      ctx.fillStyle = phColor(ex.ph); ctx.fill();
      ctx.fillStyle = COLOR.textPrimary; ctx.font = '10px sans-serif';
      ctx.textAlign = x > W * 0.8 ? 'right' : x < W * 0.2 ? 'left' : 'center';
      ctx.fillText(ex.label, x, dotY + 14);
      dotY += 30;
    });

    ctx.fillStyle = COLOR.textMuted; ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`[H⁺] = ${Math.pow(10,-_ph).toExponential(2)} mol/L`, padX, H - 8);
    ctx.textAlign = 'right';
    ctx.fillText(`[OH⁻] = ${Math.pow(10,_ph-14).toExponential(2)} mol/L`, W - padX, H - 8);
  });
  _loop.start();
}

function updateDilution() {
  const c2 = (_dilC1 * _dilV1) / _dilV2;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('dil-c2', c2 < 0.001 ? c2.toExponential(3) : c2.toFixed(4));
  const factor = Math.min(_dilV1 / _dilV2, 1);
  const bar = document.getElementById('dil-bar');
  if (bar) bar.style.width = Math.round(factor * 200) + 'px';
  set('dil-factor', `Fator de diluição: 1 : ${(_dilV2 / _dilV1).toFixed(1)}`);
}

function updateBuffer() {
  const buf = BUFFERS[_bufIdx];
  const ph  = buf.pKa + Math.log10(_bufRatio);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('buf-ph',    ph.toFixed(2));
  set('buf-pka',   buf.pKa.toFixed(2));
  set('buf-range', `${(buf.pKa-1).toFixed(1)} – ${(buf.pKa+1).toFixed(1)}`);
  set('buf-ratio-label', `[${buf.base}]/[${buf.acid}] = ${_bufRatio.toFixed(2)}`);
}

const EXERCISE = {
  question: 'O suco gástrico tem pH ≈ 1,5. Qual é a [H⁺] aproximada?',
  options:  ['≈ 0,032 mol/L (10⁻¹·⁵)', '≈ 1,5 mol/L', '≈ 10⁻¹² mol/L', '≈ 0,150 mol/L'],
  correct:  0,
  explanation: '[H⁺] = 10⁻ᵖᴴ = 10⁻¹·⁵ ≈ 0,032 mol/L. Esse pH ativa a pepsina e desnatura proteínas ingeridas.',
};

export function render(outlet) {
  _ph = 7.0; if (_loop) { _loop.stop(); _loop = null; }
  _bufIdx = 1; _bufRatio = 1.0; _dilC1 = 1.0; _dilV1 = 100; _dilV2 = 500;
  _exAttempts = 0; _exDone = false;

  outlet.innerHTML = `
<div class="page module-page">
  <button class="module-back btn-ghost" data-nav="/modules">&larr; Módulos</button>
  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M9 3v11a3 3 0 006 0V3"/><path d="M6 3h12"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Soluções e pH</h1>
      <p class="module-subtitle">Dissolução, concentração, pH, diluição e tampões.</p>
    </div>
  </header>

  <section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">Bicarbonato e vinagre efervescem violentamente ao misturar. Antiácido neutraliza acidez gástrica em segundos. Tudo envolve ácidos, bases e pH — a escala que mede [H⁺] em solução.</p>
    <p class="module-text"><strong>pH = −log[H⁺]</strong>. Em água pura: [H⁺] = 10⁻⁷ → pH = 7. Cada unidade representa fator 10: pH 5 é 100× mais ácido que pH 7.</p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Escala de pH interativa</h2>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">pH:</label>
      <input type="range" id="ph-slider" min="0" max="14" step="0.1" value="7" style="width:200px;accent-color:var(--accent-electron)">
      <span id="ph-value" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron);min-width:36px">7,0</span>
    </div>
    <div class="canvas-frame"><canvas id="ph-canvas"></canvas></div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Ácidos e Bases — Brønsted-Lowry</h2>
    <p class="module-text">Ácido doa H⁺. Base aceita H⁺. Ácidos <strong>fortes</strong> ionizam 100%; ácidos <strong>fracos</strong> estabelecem equilíbrio descrito pelo Ka.</p>
    <div class="module-grid" style="grid-template-columns:1fr 1fr;margin-top:.75rem">
      <div class="info-card">
        <h3 style="color:var(--accent-reaction);margin-top:0">Ácido forte</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">HCl → H⁺ + Cl⁻<br>(100%)</p>
      </div>
      <div class="info-card">
        <h3 style="color:var(--accent-electron);margin-top:0">Ácido fraco</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">CH₃COOH ⇌ H⁺ + CH₃COO⁻<br>Ka = 1,8×10⁻⁵</p>
      </div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Calculadora de diluição — C₁V₁ = C₂V₂</h2>
    <p class="module-text">Ao diluir, os moles de soluto são conservados: C₁V₁ = C₂V₂. Ajuste os parâmetros abaixo.</p>
    <div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">C₁ — concentração inicial (mol/L):</label>
        <input type="range" id="dil-c1" min="0.01" max="10" step="0.01" value="1" style="width:140px;accent-color:var(--accent-electron)">
        <span id="dil-c1-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:70px">1,00 mol/L</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">V₁ — volume inicial (mL):</label>
        <input type="range" id="dil-v1" min="10" max="1000" step="10" value="100" style="width:140px;accent-color:var(--accent-bond)">
        <span id="dil-v1-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:70px">100 mL</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">V₂ — volume final (mL):</label>
        <input type="range" id="dil-v2" min="100" max="5000" step="100" value="500" style="width:140px;accent-color:var(--accent-organic)">
        <span id="dil-v2-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:70px">500 mL</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
      <div id="dil-bar" style="height:14px;background:var(--accent-electron);border-radius:3px;transition:width .3s;width:40px;min-width:4px"></div>
      <span id="dil-factor" style="font-size:var(--text-sm);color:var(--text-secondary)"></span>
    </div>
    <div class="info-card" style="max-width:260px">
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">C₂ — concentração final</p>
      <span id="dil-c2" style="font-size:var(--text-2xl);font-weight:700;color:var(--accent-electron)">0,2000</span>
      <span style="font-size:var(--text-sm);color:var(--text-muted)"> mol/L</span>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Sistemas tampão — Henderson-Hasselbalch</h2>
    <p class="module-text">Um tampão resiste a variações de pH. É formado por um ácido fraco e sua base conjugada. O pH é calculado por:</p>
    <div class="info-card" style="background:var(--bg-raised);margin:.5rem 0 1rem;max-width:320px">
      <p style="font-family:monospace;font-size:var(--text-lg);color:var(--accent-electron);text-align:center;margin:0">pH = pKa + log([A⁻]/[HA])</p>
    </div>
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
      ${BUFFERS.map((b, i) => `<button class="btn btn-sm ${i===1?'btn-secondary':'btn-ghost'}" id="buf-btn-${i}" data-bufidx="${i}">${b.name}</button>`).join('')}
    </div>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">Razão [base]/[ácido]:</label>
      <input type="range" id="buf-ratio" min="0.01" max="100" step="0.01" value="1" style="width:160px;accent-color:var(--accent-electron)">
      <span id="buf-ratio-label" style="font-size:var(--text-sm);color:var(--text-secondary);min-width:160px"></span>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">pH resultante</p>
        <div id="buf-ph" style="font-size:var(--text-2xl);font-weight:700;color:var(--accent-electron)">7,35</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">pKa do par</p>
        <div id="buf-pka" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">6,35</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Faixa eficaz (pKa ± 1)</p>
        <div id="buf-range" style="font-size:var(--text-lg);font-weight:600;color:var(--text-secondary)">5,35 – 7,35</div>
      </div>
    </div>
    <p id="buf-use" style="margin-top:.75rem;font-size:var(--text-sm);color:var(--text-secondary)">${BUFFERS[1].use}</p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Exercício</h2>
    <p class="module-text">${EXERCISE.question}</p>
    <div id="exercise-opts" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">
      ${EXERCISE.options.map((opt, i) => `<button class="btn btn-ghost" style="text-align:left;justify-content:flex-start" id="ex-opt-${i}" data-exopt="${i}">${opt}</button>`).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
  </section>

  <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">O sangue humano é mantido a pH 7,35–7,45 pelo sistema H₂CO₃/HCO₃⁻. Piscinas requerem pH 7,2–7,6 para eficácia do cloro. Solos ácidos são corrigidos com calcário. Laboratórios farmacêuticos calculam diluições seriadas para padronizar soluções de referência.</p>
  </div>
</div>
`;

  const canvas = document.getElementById('ph-canvas');
  if (canvas) startCanvas(canvas);
  updateDilution();
  updateBuffer();

  document.getElementById('ph-slider')?.addEventListener('input', e => {
    _ph = parseFloat(e.target.value);
    const v = document.getElementById('ph-value');
    if (v) v.textContent = _ph.toFixed(1).replace('.', ',');
  });
  document.getElementById('dil-c1')?.addEventListener('input', e => {
    _dilC1 = parseFloat(e.target.value);
    const v = document.getElementById('dil-c1-val');
    if (v) v.textContent = _dilC1.toFixed(2).replace('.', ',') + ' mol/L';
    updateDilution();
  });
  document.getElementById('dil-v1')?.addEventListener('input', e => {
    _dilV1 = parseInt(e.target.value, 10);
    const v = document.getElementById('dil-v1-val');
    if (v) v.textContent = _dilV1 + ' mL';
    updateDilution();
  });
  document.getElementById('dil-v2')?.addEventListener('input', e => {
    _dilV2 = parseInt(e.target.value, 10);
    const v = document.getElementById('dil-v2-val');
    if (v) v.textContent = _dilV2 + ' mL';
    updateDilution();
  });
  BUFFERS.forEach((_, i) => {
    document.getElementById(`buf-btn-${i}`)?.addEventListener('click', () => {
      _bufIdx = i; _bufRatio = 1.0;
      const rs = document.getElementById('buf-ratio'); if (rs) rs.value = '1';
      BUFFERS.forEach((_, j) => {
        const btn = document.getElementById(`buf-btn-${j}`);
        if (btn) btn.className = `btn btn-sm ${j===i?'btn-secondary':'btn-ghost'}`;
      });
      const useEl = document.getElementById('buf-use');
      if (useEl) useEl.textContent = BUFFERS[i].use;
      updateBuffer();
    });
  });
  document.getElementById('buf-ratio')?.addEventListener('input', e => {
    _bufRatio = parseFloat(e.target.value);
    updateBuffer();
  });
  document.querySelectorAll('[data-exopt]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_exDone) return;
      _exAttempts++;
      const choice = parseInt(btn.dataset.exopt, 10);
      const fb = document.getElementById('exercise-feedback');
      if (choice === EXERCISE.correct) {
        _exDone = true;
        btn.style.borderColor = 'var(--accent-organic)'; btn.style.color = 'var(--accent-organic)';
        if (fb) fb.innerHTML = `<p class="feedback-correct">Correto! ${EXERCISE.explanation}</p>`;
        markSectionDone('solutions', 'exercise');
      } else {
        btn.style.borderColor = 'var(--accent-reaction)'; btn.style.color = 'var(--accent-reaction)';
        if (fb && _exAttempts === 1) fb.innerHTML = `<p class="feedback-hint">Dica: [H⁺] = 10⁻ᵖᴴ. Substitua pH = 1,5.</p>`;
      }
    });
  });
}

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
}
