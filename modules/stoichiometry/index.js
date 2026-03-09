/**
 * modules/stoichiometry/index.js — Módulo: Estequiometria
 * Lavoisier — Laboratório Visual de Química
 *
 * Implementa:
 *  - Diagrama de proporções em barras animado
 *  - Calculadora de mol/massa/moléculas
 *  - Reagente limitante: calcula automaticamente qual esgota primeiro
 *  - Rendimento teórico e percentual
 *  - Exercício guiado
 */

import { esc }            from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';
import { SimLoop }         from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

/* -----------------------------------------------------------------------
   Reações para o diagrama de proporções
----------------------------------------------------------------------- */
const REACTIONS = {
  water: {
    label: 'Formação da água',
    equation: '2 H₂ + O₂ → 2 H₂O',
    reagents: [
      { formula:'H₂',  mm:2.016,  coeff:2, color: COLOR.H },
      { formula:'O₂',  mm:32.00,  coeff:1, color: COLOR.O },
    ],
    product: { formula:'H₂O', mm:18.015, coeff:2, color: COLOR.electron },
  },
  ammonia: {
    label: 'Síntese da amônia (Haber)',
    equation: 'N₂ + 3 H₂ → 2 NH₃',
    reagents: [
      { formula:'N₂',  mm:28.014, coeff:1, color: COLOR.N },
      { formula:'H₂',  mm:2.016,  coeff:3, color: COLOR.H },
    ],
    product: { formula:'NH₃', mm:17.031, coeff:2, color: COLOR.electron },
  },
  ethane: {
    label: 'Combustão do etano',
    equation: '2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O',
    reagents: [
      { formula:'C₂H₆', mm:30.069, coeff:2, color: COLOR.C },
      { formula:'O₂',   mm:32.00,  coeff:7, color: COLOR.O },
    ],
    product: { formula:'CO₂', mm:44.01, coeff:4, color: COLOR.electron },
  },
};

const AVOGADRO = 6.022e23;

/* -----------------------------------------------------------------------
   Estado — resetado em render()
----------------------------------------------------------------------- */
let _rxKey       = 'water';
let _moles       = 1.0;
let _loop        = null;
let _lrMolesA    = 2.0;   // mol do reagente A no calc de limitante
let _lrMolesB    = 2.0;   // mol do reagente B
let _actualYield = 80;    // % rendimento real (slider)
let _exAttempts  = 0;
let _exDone      = false;

/* -----------------------------------------------------------------------
   Canvas: barras de proporção
----------------------------------------------------------------------- */
function startCanvas(canvasEl) {
  const frame = canvasEl.parentElement;
  const W     = Math.min(frame.clientWidth || 520, 520);
  const H     = 200;
  const dpr   = window.devicePixelRatio || 1;
  canvasEl.width  = Math.round(W * dpr);
  canvasEl.height = Math.round(H * dpr);
  canvasEl.style.width  = W + 'px';
  canvasEl.style.height = H + 'px';
  const ctx = canvasEl.getContext('2d');
  ctx.scale(dpr, dpr);

  if (_loop) _loop.stop();

  _loop = new SimLoop((dt, t) => {
    const rx = REACTIONS[_rxKey];
    clearCanvas(ctx, W, H);

    const compounds  = [...rx.reagents, rx.product];
    const totalCoeff = compounds.reduce((s, c) => s + c.coeff, 0);
    const barW       = Math.floor((W - 40) / compounds.length) - 12;
    const baseY      = H - 24;
    const maxH       = H - 64;

    ctx.fillStyle = COLOR.textMuted;
    ctx.font      = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(rx.equation, W / 2, 18);

    compounds.forEach((c, i) => {
      const x       = 20 + i * (barW + 12);
      const barH    = Math.max(8, (c.coeff / totalCoeff) * maxH);
      const pulse   = 1 + 0.04 * Math.sin(t * 2 + i);
      const bx      = x;
      const by      = baseY - barH * pulse;

      ctx.fillStyle   = c.color + '33';
      ctx.strokeStyle = c.color;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.roundRect(bx, by, barW, barH * pulse, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = c.color;
      ctx.font      = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.coeff, bx + barW / 2, by + barH * pulse / 2 + 5);

      ctx.fillStyle = COLOR.textPrimary;
      ctx.font      = '12px sans-serif';
      ctx.fillText(c.formula, bx + barW / 2, baseY + 14);

      if (i < rx.reagents.length - 1) {
        ctx.fillStyle = COLOR.textMuted;
        ctx.font      = '16px sans-serif';
        ctx.fillText('+', bx + barW + 6, baseY - 10);
      } else if (i === rx.reagents.length - 1) {
        ctx.fillStyle = COLOR.textMuted;
        ctx.font      = '16px sans-serif';
        ctx.fillText('→', bx + barW + 6, baseY - 10);
      }
    });
  });

  _loop.start();
}

/* -----------------------------------------------------------------------
   Calculadora de mol
----------------------------------------------------------------------- */
function updateCalc() {
  const rx           = REACTIONS[_rxKey];
  const totalMoles   = _moles * rx.product.coeff;
  const mass         = totalMoles * rx.product.mm;
  const molecules    = totalMoles * AVOGADRO;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('calc-moles',     totalMoles.toFixed(3) + ' mol');
  set('calc-mass',      mass.toFixed(2) + ' g');
  set('calc-molecules', molecules.toExponential(3) + ' moléculas');

  rx.reagents.forEach((r, i) => {
    const el = document.getElementById(`calc-reagent-${i}`);
    if (el) el.textContent = `${(r.coeff * _moles).toFixed(3)} mol de ${r.formula} = ${(r.coeff * _moles * r.mm).toFixed(2)} g`;
  });
}

/* -----------------------------------------------------------------------
   Reagente limitante
   Dado n_A mol do reagente A e n_B mol do reagente B, determina qual
   limita a reação e calcula o produto máximo e o excesso.
----------------------------------------------------------------------- */
function updateLimiting() {
  const rx = REACTIONS[_rxKey];
  if (rx.reagents.length < 2) return;

  const A = rx.reagents[0];   // coefA
  const B = rx.reagents[1];   // coefB
  const P = rx.product;

  // Unidades de reação disponíveis para cada reagente
  const unitsFromA = _lrMolesA / A.coeff;
  const unitsFromB = _lrMolesB / B.coeff;

  const limitingUnits = Math.min(unitsFromA, unitsFromB);
  const isALimiting   = unitsFromA <= unitsFromB;
  const limitingName  = isALimiting ? A.formula : B.formula;
  const excessName    = isALimiting ? B.formula : A.formula;
  const excessMoles   = isALimiting
    ? _lrMolesB - limitingUnits * B.coeff
    : _lrMolesA - limitingUnits * A.coeff;

  const productMoles = limitingUnits * P.coeff;
  const productMass  = productMoles * P.mm;

  // Rendimento real
  const yieldFraction   = _actualYield / 100;
  const actualMoles     = productMoles * yieldFraction;
  const actualMass      = actualMoles * P.mm;

  const set = (id, v, color) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = v;
    if (color) el.style.color = color;
  };

  set('lr-limiting',      limitingName, COLOR.reaction);
  set('lr-excess',        excessName,   COLOR.electron);
  set('lr-excess-moles',  excessMoles.toFixed(3) + ' mol em excesso');
  set('lr-product-theo',  productMoles.toFixed(3) + ' mol = ' + productMass.toFixed(2) + ' g');
  set('lr-product-real',  actualMoles.toFixed(3) + ' mol = ' + actualMass.toFixed(2) + ' g');

  // barras visuais de comparação
  const maxW  = 200;
  const wA    = Math.round((unitsFromA / Math.max(unitsFromA, unitsFromB)) * maxW);
  const wB    = Math.round((unitsFromB / Math.max(unitsFromA, unitsFromB)) * maxW);

  const barA = document.getElementById('lr-bar-a');
  const barB = document.getElementById('lr-bar-b');
  if (barA) barA.style.width = wA + 'px';
  if (barB) barB.style.width = wB + 'px';
  if (barA) barA.style.background = isALimiting ? COLOR.reaction : COLOR.electron;
  if (barB) barB.style.background = isALimiting ? COLOR.electron : COLOR.reaction;
}

/* -----------------------------------------------------------------------
   Exercício
----------------------------------------------------------------------- */
const EXERCISE = {
  question: 'Quantos mols de H₂ são necessários para produzir 4 mol de NH₃ pela síntese de Haber (N₂ + 3 H₂ → 2 NH₃)?',
  options:  ['3 mol', '6 mol', '4 mol', '2 mol'],
  correct:  1,
  explanation: '2 mol NH₃ requerem 3 mol H₂. Para 4 mol NH₃ (dobro da equação): 4 ÷ 2 × 3 = 6 mol H₂.',
};

/* -----------------------------------------------------------------------
   render()
----------------------------------------------------------------------- */
export function render(outlet) {
  _rxKey       = 'water';
  _moles       = 1.0;
  _lrMolesA    = 2.0;
  _lrMolesB    = 2.0;
  _actualYield = 80;
  if (_loop) { _loop.stop(); _loop = null; }
  _exAttempts  = 0;
  _exDone      = false;

  outlet.innerHTML = `
<div class="page module-page">
  <button class="module-back btn-ghost" data-nav="/modules">&larr; Módulos</button>

  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
        <path d="M7 12h10M12 5v14"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Estequiometria</h1>
      <p class="module-subtitle">Proporções, mol, massa, reagente limitante e rendimento.</p>
    </div>
  </header>

  <!-- Fenômeno -->
  <section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">
      Uma receita de pão de queijo pede 2 ovos e 500 g de polvilho. Se você tem 6 ovos mas só
      400 g de polvilho, o polvilho acaba primeiro — ele é o reagente limitante, e sobram ovos
      em excesso. Reações químicas funcionam exatamente assim.
    </p>
    <p class="module-text">
      O <strong>mol</strong> (6,022 × 10²³ partículas — número de Avogadro) é a unidade que
      permite contar átomos como se fosse uma dúzia, mas escalonada para a realidade microscópica.
      Cada mol de C pesa 12 g, de O pesa 16 g — são as massas molares.
    </p>
  </section>

  <!-- Proporções -->
  <section class="module-section">
    <h2 class="module-section-title">Proporções molares em uma reação</h2>
    <p class="module-text">As barras mostram a proporção relativa em mol de cada substância.</p>

    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
      ${Object.entries(REACTIONS).map(([k, rx]) => `
        <button class="btn btn-sm ${k === 'water' ? 'btn-secondary' : 'btn-ghost'}"
                id="rx-btn-${k}" data-rxkey="${k}">${esc(rx.label)}</button>
      `).join('')}
    </div>
    <div class="canvas-frame"><canvas id="stoich-canvas"></canvas></div>
  </section>

  <!-- Calculadora de mol -->
  <section class="module-section">
    <h2 class="module-section-title">Calculadora de mol</h2>
    <p class="module-text">Ajuste o número de "unidades de reação" e veja massa e moléculas do produto.</p>

    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">Unidades de reação (n):</label>
      <input type="range" id="moles-slider" min="0.1" max="5" step="0.1" value="1"
             style="width:140px;accent-color:var(--accent-electron)">
      <span id="moles-value" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:40px">1,0</span>
    </div>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Produto (mol)</p>
        <div id="calc-moles" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Massa</p>
        <div id="calc-mass" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Moléculas</p>
        <div id="calc-molecules" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
    </div>
    <div id="calc-reagents" style="margin-top:.75rem;display:flex;flex-direction:column;gap:.3rem">
      ${REACTIONS['water'].reagents.map((r, i) => `
        <div id="calc-reagent-${i}" style="font-size:var(--text-sm);color:var(--text-secondary)"></div>
      `).join('')}
    </div>
  </section>

  <!-- Reagente limitante -->
  <section class="module-section">
    <h2 class="module-section-title">Reagente limitante e excesso</h2>
    <p class="module-text">
      Insira as quantidades disponíveis de cada reagente (em mol). O sistema identifica qual esgota
      primeiro, quanto sobra em excesso e o produto máximo teórico.
    </p>

    <div id="lr-inputs" style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.25rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label id="lr-label-a" style="min-width:80px;font-size:var(--text-sm);color:var(--text-secondary);font-family:monospace">H₂:</label>
        <input type="range" id="lr-slider-a" min="0.5" max="10" step="0.5" value="2"
               style="width:160px;accent-color:var(--accent-electron)">
        <span id="lr-val-a" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:50px">2,0 mol</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label id="lr-label-b" style="min-width:80px;font-size:var(--text-sm);color:var(--text-secondary);font-family:monospace">O₂:</label>
        <input type="range" id="lr-slider-b" min="0.5" max="10" step="0.5" value="2"
               style="width:160px;accent-color:var(--accent-reaction)">
        <span id="lr-val-b" style="font-size:var(--text-sm);color:var(--accent-reaction);min-width:50px">2,0 mol</span>
      </div>
    </div>

    <!-- barras visuais de unidades disponíveis -->
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:.75rem">
        <span id="lr-label-bar-a" style="min-width:50px;font-size:var(--text-xs);color:var(--text-muted);font-family:monospace">H₂</span>
        <div id="lr-bar-a" style="height:14px;border-radius:3px;transition:width .3s,background .3s;width:200px"></div>
      </div>
      <div style="display:flex;align-items:center;gap:.75rem">
        <span id="lr-label-bar-b" style="min-width:50px;font-size:var(--text-xs);color:var(--text-muted);font-family:monospace">O₂</span>
        <div id="lr-bar-b" style="height:14px;border-radius:3px;transition:width .3s,background .3s;width:200px"></div>
      </div>
    </div>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Reagente limitante</p>
        <div id="lr-limiting" style="font-size:var(--text-lg);font-weight:700;font-family:monospace">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Reagente em excesso</p>
        <div id="lr-excess" style="font-size:var(--text-lg);font-weight:700;font-family:monospace">—</div>
        <div id="lr-excess-moles" style="font-size:var(--text-xs);color:var(--text-muted);margin-top:.2rem"></div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Produto teórico</p>
        <div id="lr-product-theo" style="font-size:var(--text-sm);font-weight:600;color:var(--accent-bond)">—</div>
      </div>
    </div>

    <!-- Rendimento -->
    <div style="margin-top:1.5rem">
      <h3 style="font-size:var(--text-base);font-weight:600;color:var(--text-primary);margin-bottom:.5rem">
        Rendimento percentual
      </h3>
      <p class="module-text">
        Na prática, reações nunca atingem 100%. Perdas por purificação, reações secundárias e
        equilíbrio reduzem o que se obtém. O rendimento real é: <strong>η = (real / teórico) × 100%</strong>.
      </p>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin:.75rem 0">
        <label style="font-size:var(--text-sm);color:var(--text-secondary)">Rendimento real:</label>
        <input type="range" id="yield-slider" min="10" max="100" step="5" value="80"
               style="width:160px;accent-color:var(--accent-organic)">
        <span id="yield-value" style="font-size:var(--text-sm);font-weight:700;color:var(--accent-organic);min-width:40px">80%</span>
      </div>
      <div class="info-card" style="max-width:280px">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Produto real obtido</p>
        <div id="lr-product-real" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
    </div>
  </section>

  <!-- Exercício -->
  <section class="module-section">
    <h2 class="module-section-title">Exercício</h2>
    <p class="module-text">${esc(EXERCISE.question)}</p>
    <div id="exercise-opts" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">
      ${EXERCISE.options.map((opt, i) => `
        <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
                id="ex-opt-${i}" data-exopt="${i}">${esc(opt)}</button>
      `).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
  </section>

  <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">
      Indústrias farmacêuticas calculam o reagente limitante de sínteses que custam R$ 10.000/g.
      Engenheiros de airbags calculam gramas exatos de NaN₃ para gerar N₂ suficiente em 30 ms
      sem sobrar gás tóxico. Refinarias otimizam razões estequiométricas para minimizar subprodutos.
      Rendimento de 90% em 10 etapas sintéticas resulta em 0,9¹⁰ ≈ 35% de produto total.
    </p>
  </div>

</div>
`;

  // canvas
  const canvas = document.getElementById('stoich-canvas');
  if (canvas) startCanvas(canvas);
  updateCalc();
  updateLimiting();

  // botões de reação (afeta ambas as calculadoras)
  Object.keys(REACTIONS).forEach(k => {
    document.getElementById(`rx-btn-${k}`)?.addEventListener('click', () => {
      _rxKey    = k;
      _lrMolesA = 2.0;
      _lrMolesB = 2.0;
      Object.keys(REACTIONS).forEach(k2 => {
        const btn = document.getElementById(`rx-btn-${k2}`);
        if (btn) btn.className = `btn btn-sm ${k2 === k ? 'btn-secondary' : 'btn-ghost'}`;
      });
      // actualizar labels de reagentes
      const rx = REACTIONS[k];
      const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v + ':'; };
      setTxt('lr-label-a',     rx.reagents[0]?.formula ?? '');
      setTxt('lr-label-b',     rx.reagents[1]?.formula ?? '');
      setTxt('lr-label-bar-a', rx.reagents[0]?.formula ?? '');
      setTxt('lr-label-bar-b', rx.reagents[1]?.formula ?? '');
      const sA = document.getElementById('lr-slider-a');
      const sB = document.getElementById('lr-slider-b');
      if (sA) sA.value = '2';
      if (sB) sB.value = '2';
      const vA = document.getElementById('lr-val-a');
      const vB = document.getElementById('lr-val-b');
      if (vA) vA.textContent = '2,0 mol';
      if (vB) vB.textContent = '2,0 mol';
      // recriar reagents display
      const container = document.getElementById('calc-reagents');
      if (container) {
        container.innerHTML = rx.reagents.map((r, i) => `
          <div id="calc-reagent-${i}" style="font-size:var(--text-sm);color:var(--text-secondary)"></div>
        `).join('');
      }
      updateCalc();
      updateLimiting();
    });
  });

  // slider mol
  const molesSlider = document.getElementById('moles-slider');
  const molesVal    = document.getElementById('moles-value');
  molesSlider?.addEventListener('input', () => {
    _moles = parseFloat(molesSlider.value);
    if (molesVal) molesVal.textContent = _moles.toFixed(1).replace('.', ',');
    updateCalc();
  });

  // sliders reagente limitante
  const sliderA = document.getElementById('lr-slider-a');
  const sliderB = document.getElementById('lr-slider-b');
  sliderA?.addEventListener('input', () => {
    _lrMolesA = parseFloat(sliderA.value);
    const v = document.getElementById('lr-val-a');
    if (v) v.textContent = _lrMolesA.toFixed(1).replace('.', ',') + ' mol';
    updateLimiting();
  });
  sliderB?.addEventListener('input', () => {
    _lrMolesB = parseFloat(sliderB.value);
    const v = document.getElementById('lr-val-b');
    if (v) v.textContent = _lrMolesB.toFixed(1).replace('.', ',') + ' mol';
    updateLimiting();
  });

  // slider rendimento
  const yieldSlider = document.getElementById('yield-slider');
  const yieldVal    = document.getElementById('yield-value');
  yieldSlider?.addEventListener('input', () => {
    _actualYield = parseInt(yieldSlider.value, 10);
    if (yieldVal) yieldVal.textContent = _actualYield + '%';
    updateLimiting();
  });

  // exercício
  document.querySelectorAll('[data-exopt]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_exDone) return;
      _exAttempts++;
      const choice = parseInt(btn.dataset.exopt, 10);
      const fb     = document.getElementById('exercise-feedback');
      if (choice === EXERCISE.correct) {
        _exDone = true;
        btn.style.borderColor = 'var(--accent-organic)';
        btn.style.color       = 'var(--accent-organic)';
        if (fb) fb.innerHTML = `<p class="feedback-correct">Correto! ${esc(EXERCISE.explanation)}</p>`;
        markSectionDone('stoichiometry', 'exercise');
      } else {
        btn.style.borderColor = 'var(--accent-reaction)';
        btn.style.color       = 'var(--accent-reaction)';
        if (fb && _exAttempts === 1) {
          fb.innerHTML = `<p class="feedback-hint">Dica: quantas "unidades de reação" são necessárias para 4 mol de NH₃? Coeficiente do produto é 2.</p>`;
        }
      }
    });
  });
}

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
}
