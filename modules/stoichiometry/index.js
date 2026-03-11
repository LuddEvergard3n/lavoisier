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
let _exIdx     = 0;
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
const EXERCISES = [
  { q: 'Quantos mols de H₂ são necessários para produzir 4 mol de NH₃ pela síntese de Haber (N₂ + 3H₂ → 2NH₃)?', opts: ['3 mol','6 mol','4 mol','2 mol'], ans: 1, exp: '2 mol NH₃ requerem 3 mol H₂. Para 4 mol NH₃: 4/2 × 3 = 6 mol H₂.', hint: 'Use a relação estequiométrica: 2 mol NH₃ para 3 mol H₂.' },
  { q: 'Na reação C₃H₈ + 5O₂ → 3CO₂ + 4H₂O, quantos gramas de CO₂ se formam ao queimar 44 g de propano (M = 44 g/mol)?', opts: ['44 g','88 g','132 g','176 g'], ans: 2, exp: '44 g propano = 1 mol. 1 mol C₃H₈ → 3 mol CO₂. 3 × 44 g/mol = 132 g CO₂.', hint: '44 g ÷ 44 g/mol = ? mol propano. Depois use a relação 1:3.' },
  { q: 'Qual é o reagente limitante na reação Zn + 2HCl → ZnCl₂ + H₂ com 0,5 mol Zn e 0,8 mol HCl?', opts: ['Zn, pois é menor em massa','HCl, pois 0,8 < 1,0 mol necessário','Ambos são equivalentes','Depende da temperatura'], ans: 1, exp: '0,5 mol Zn precisaria de 1,0 mol HCl. Temos só 0,8 mol HCl — é o limitante.', hint: 'Calcule quantos mols de HCl seriam necessários para consumir todo o Zn.' },
  { q: 'Um processo tem rendimento de 80%. Quantos gramas de produto (M = 100 g/mol) são obtidos se o rendimento teórico é 5 mol?', opts: ['500 g','400 g','250 g','80 g'], ans: 1, exp: 'Rendimento teórico: 5 mol × 100 g/mol = 500 g. Rendimento real: 500 × 0,80 = 400 g.', hint: 'Rendimento real = rendimento teórico × (% / 100).' },
  { q: 'Na equação 2H₂O₂ → 2H₂O + O₂, a razão molar H₂O₂ : O₂ é:', opts: ['1:1','2:1','1:2','2:3'], ans: 1, exp: '2 mol H₂O₂ produzem 1 mol O₂. Razão = 2:1.', hint: 'Leia diretamente os coeficientes estequiométricos.' },,
  { q:'Qual é a massa molar do CaCO₃? (Ca=40, C=12, O=16)', opts:['68 g/mol','84 g/mol','100 g/mol','116 g/mol'], ans:2, exp:'CaCO₃: 40 (Ca) + 12 (C) + 3×16 (O) = 40 + 12 + 48 = 100 g/mol.', hint:'Some as massas atômicas de todos os átomos na fórmula.' },
  { q:'Quantos mol há em 11 g de CO₂? (M = 44 g/mol)', opts:['0,10 mol','0,25 mol','0,50 mol','1,0 mol'], ans:1, exp:'n = m/M = 11/44 = 0,25 mol.', hint:'n = m / M. Divide a massa pela massa molar.' },
  { q:'Na síntese de amônia N₂ + 3H₂ → 2NH₃, partindo de 28 g de N₂ e excesso de H₂, qual a massa de NH₃ produzida? (N=14, H=1)', opts:['17 g','34 g','51 g','28 g'], ans:1, exp:'28 g N₂ / 28 g/mol = 1 mol N₂. 1 mol N₂ → 2 mol NH₃. Massa = 2 × 17 = 34 g.', hint:'M(N₂)=28 g/mol. 1 mol N₂ → 2 mol NH₃. M(NH₃)=17 g/mol.' },
  { q:'Na reação A + 2B → C, com 3 mol de A e 4 mol de B, qual é o reagente limitante e quantos mol de C são produzidos?', opts:['A limita; 3 mol C','B limita; 2 mol C','A limita; 1,5 mol C','Sem limitante; 3 mol C'], ans:1, exp:'Para consumir 3 mol A são necessários 6 mol B (mas só há 4). Com 4 mol B consome-se 2 mol A → produz 2 mol C. B é o limitante (necessita proporção 1A:2B; 4 mol B só permite 2 mol A).', hint:'Calcule a proporção necessária: para usar todo A, quanto B é preciso? E vice-versa.' },
  { q:'Uma reação tem rendimento de 75%. Para produzir 30 g do produto, qual é a massa teórica mínima necessária calcular?', opts:['22,5 g','30 g','40 g','37,5 g'], ans:2, exp:'Rendimento = massa_real / massa_teórica × 100. 75% = 30 / massa_teórica × 100. massa_teórica = 30 / 0,75 = 40 g.', hint:'Rendimento% = (obtido/teórico)×100. Isola o teórico.' },
  { q:'0,5 mol de gás a CNTP (0°C, 1 atm) ocupa aproximadamente:', opts:['22,4 L','11,2 L','5,6 L','44,8 L'], ans:1, exp:'1 mol de gás ideal a CNTP ocupa 22,4 L. 0,5 mol ocupa 0,5 × 22,4 = 11,2 L.', hint:'Volume molar a CNTP = 22,4 L/mol. Multiplique pelo número de mols.' },
  { q:'Na combustão completa do etanol C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O, qual o percentual atômico de oxigênio no etanol?', opts:['6,25%','26,1%','13,0%','50%'], ans:1, exp:'C₂H₅OH: 2C + 6H + 1O. Total = 9 átomos. % de O = 1/9 × 100 ≈ 11,1%. Em % mássico: M=46 g/mol; O=16 g/mol; 16/46×100 ≈ 34,8%. A questão pergunta atômico: 1 átomo O de 9 total = 11,1%.', hint:'Conte todos os átomos na fórmula. Percentual atômico = n_átomo_X / total_átomos × 100.' },
  { q:'A fórmula empírica de um composto com 40%C, 6,7%H e 53,3%O (em massa) é:', opts:['CH₂O','C₂H₄O₂','C₃H₆O₃','CHO'], ans:0, exp:'Divide cada % pela massa atômica: C=40/12=3,33; H=6,7/1=6,7; O=53,3/16=3,33. Razão: C:H:O = 3,33:6,7:3,33 = 1:2:1. Fórmula empírica = CH₂O (formol, açúcares, ácido acético, etc.)', hint:'Divida o % pela massa atômica. Depois divida todos pelo menor resultado.' },
  { q:'Para preparar 200 mL de solução 0,5 mol/L de NaCl (M=58,5 g/mol), qual massa de NaCl é necessária?', opts:['5,85 g','11,7 g','29,25 g','58,5 g'], ans:0, exp:'n = C × V = 0,5 mol/L × 0,200 L = 0,1 mol. m = n × M = 0,1 × 58,5 = 5,85 g.', hint:'n = C × V (em litros). m = n × M.' },
  { q:'Na reação de Haber N₂ + 3H₂ ⇌ 2NH₃, o rendimento industrial é ~15% por passagem. Com 100 mol N₂ por ciclo, produz-se:', opts:['200 mol NH₃','30 mol NH₃','15 mol NH₃','150 mol NH₃'], ans:1, exp:'Teórico: 100 mol N₂ → 200 mol NH₃. Com 15% de rendimento: 200 × 0,15 = 30 mol NH₃ por passagem. Os gases não convertidos são reciclados — a conversão total chega a ~98%.', hint:'Rendimento% × produção teórica = produção real.' }
];

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
  _exIdx      = 0;
  _exAttempts  = 0;
  _exDone     = false;

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

  <!-- Fórmula empírica e molecular -->
  <section class="module-section">
    <h2 class="module-section-title">Fórmula empírica e análise elementar</h2>
    <p class="module-text">
      A <strong>análise elementar</strong> fornece a composição percentual em massa
      de cada elemento. A partir dela, calcula-se a <strong>fórmula empírica</strong>
      (menores proporções inteiras) e, com a massa molar experimental, a
      <strong>fórmula molecular</strong>.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        Etapas: %massa → mol/100g → dividir pelo menor → arredondar → FE → n = Mm/M_FE → FM
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Exemplo: composto C 40,00%, H 6,67%, O 53,33%. Mm = 180 g/mol.<br>
        mol: C 40/12=3,33; H 6,67/1=6,67; O 53,33/16=3,33. Dividir pelo menor (3,33):<br>
        C:H:O = 1:2:1 → FE = CH₂O (Mm_FE = 30). n = 180/30 = 6. FM = C₆H₁₂O₆ (glicose).
      </p>
    </div>

    <!-- Calculadora de fórmula empírica -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Calculadora: % C, H, O → Fórmula empírica
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:130px">%C:</span>
        <input type="range" id="ef-C" min="0" max="95" step="0.5" value="40"
               style="width:120px;accent-color:var(--accent-electron)">
        <span id="ef-C-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:50px">40,0%</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:130px">%H:</span>
        <input type="range" id="ef-H" min="0" max="20" step="0.1" value="6.7"
               style="width:120px;accent-color:var(--accent-bond)">
        <span id="ef-H-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:50px">6,7%</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:130px">Mm real (g/mol):</span>
        <input type="range" id="ef-Mm" min="10" max="600" step="5" value="180"
               style="width:120px;accent-color:var(--accent-organic)">
        <span id="ef-Mm-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:70px">180 g/mol</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">%O (restante)</p>
        <div id="ef-O-val" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-reaction)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Fórmula Empírica</p>
        <div id="ef-FE" style="font-size:var(--text-xl);font-weight:700;font-family:monospace;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">n (multiplicador)</p>
        <div id="ef-n" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Fórmula Molecular</p>
        <div id="ef-FM" style="font-size:var(--text-xl);font-weight:700;font-family:monospace;color:var(--accent-organic)">—</div>
      </div>
    </div>

    <!-- Pureza de reagente -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:var(--space-6);margin-bottom:var(--space-3)">
      Pureza de reagente — correção da massa
    </h3>
    <p class="module-text">
      Reagentes de laboratório nunca são 100% puros. A massa real útil = massa × (pureza/100).
      O rendimento de reação calcula-se com: <strong>η = (m_real / m_teórica) × 100%</strong>.
      Ambos os fatores reduzem o produto final.
    </p>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:190px">Massa do reagente bruto (g):</span>
        <input type="range" id="pur-mass" min="1" max="100" step="0.5" value="20"
               style="width:120px;accent-color:var(--accent-electron)">
        <span id="pur-mass-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">20,0 g</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:190px">Pureza (%):</span>
        <input type="range" id="pur-pur" min="50" max="100" step="0.5" value="95"
               style="width:120px;accent-color:var(--accent-bond)">
        <span id="pur-pur-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:50px">95,0%</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:190px">Rendimento da reação (%):</span>
        <input type="range" id="pur-yield" min="10" max="100" step="1" value="80"
               style="width:120px;accent-color:var(--accent-organic)">
        <span id="pur-yield-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:50px">80%</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Massa pura (g)</p>
        <div id="pur-pure" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Fator total (pureza × η)</p>
        <div id="pur-total-factor" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Produto real / 100 g bruto</p>
        <div id="pur-product" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
    </div>
  </section>


  <!-- Exercício -->
  <section class="module-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/5)</h2>
    <p class="module-text">${esc(EXERCISES[0].q)}</p>
    <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">
      ${EXERCISES[0].opts.map((opt, i) => `
        <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
                id="ex-opt-${i}" data-exopt="${i}">${esc(opt)}</button>
      `).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next" style="margin-top:1rem;display:none">Próximo exercício &#8594;</button>
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
  _initEmpiricalFormula();
  _initPurity();
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

function _initEmpiricalFormula() {
  const MM = { C: 12.011, H: 1.008, O: 15.999 };

  // Reduzir a inteiros aproximados: divide pelo mdc com tolerância
  function toInt(ratios) {
    // Tentar denominadores 1..6
    let best = ratios.map(r => Math.round(r));
    let bestErr = ratios.reduce((s,r,i) => s + Math.abs(r - best[i]), 0);
    for (let d = 2; d <= 6; d++) {
      const attempt = ratios.map(r => Math.round(r * d));
      const err = ratios.reduce((s,r,i) => s + Math.abs(r - attempt[i]/d), 0);
      if (err < bestErr - 0.001) { best = attempt; bestErr = err; }
    }
    return best;
  }

  function updateEF() {
    const pC  = parseFloat(document.getElementById('ef-C')?.value ?? 40);
    const pH  = parseFloat(document.getElementById('ef-H')?.value ?? 6.7);
    const Mm  = parseFloat(document.getElementById('ef-Mm')?.value ?? 180);
    const pO  = Math.max(0, 100 - pC - pH);

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('ef-C-val',  pC.toFixed(1) + '%');
    set('ef-H-val',  pH.toFixed(1) + '%');
    set('ef-O-val',  pO.toFixed(1) + '%');
    set('ef-Mm-val', Mm.toFixed(0) + ' g/mol');

    const molC = pC / MM.C;
    const molH = pH / MM.H;
    const molO = pO > 0.1 ? pO / MM.O : 0;

    const mols = [molC, molH, molO].filter(m => m > 0.01);
    const min  = Math.min(...mols);
    const ratios = [molC, molH, molO].map(m => m > 0.01 ? m / min : 0);

    const [nC, nH, nO] = toInt(ratios);
    const Mfe = nC * MM.C + nH * MM.H + nO * MM.O;
    const n   = Mfe > 0 ? Math.round(Mm / Mfe) : 1;

    let fe = '';
    if (nC > 0) fe += 'C' + (nC > 1 ? nC : '');
    if (nH > 0) fe += 'H' + (nH > 1 ? nH : '');
    if (nO > 0) fe += 'O' + (nO > 1 ? nO : '');

    let fm = '';
    if (nC > 0) fm += 'C' + (nC * n > 1 ? nC * n : '');
    if (nH > 0) fm += 'H' + (nH * n > 1 ? nH * n : '');
    if (nO > 0) fm += 'O' + (nO * n > 1 ? nO * n : '');

    set('ef-FE', fe || '—');
    set('ef-FM', fm || '—');
    set('ef-n',  n > 0 ? '× ' + n : '—');
  }
  if (document.getElementById('ef-C')) {
    updateEF();
    ['ef-C','ef-H','ef-Mm'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updateEF));
  }
}

function _initPurity() {
  function updatePur() {
    const mass  = parseFloat(document.getElementById('pur-mass')?.value  ?? 20);
    const pur   = parseFloat(document.getElementById('pur-pur')?.value   ?? 95) / 100;
    const yield_ = parseFloat(document.getElementById('pur-yield')?.value ?? 80) / 100;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('pur-mass-val',  mass.toFixed(1) + ' g');
    set('pur-pur-val',   (pur * 100).toFixed(1) + '%');
    set('pur-yield-val', (yield_ * 100).toFixed(0) + '%');

    const pure    = mass * pur;
    const factor  = pur * yield_;
    const product = mass * factor;

    set('pur-pure',         pure.toFixed(2) + ' g');
    set('pur-total-factor', (factor * 100).toFixed(1) + '%');
    set('pur-product',      product.toFixed(2) + ' g');
  }
  if (document.getElementById('pur-mass')) {
    updatePur();
    ['pur-mass','pur-pur','pur-yield'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updatePur));
  }
}


  // --- Exercises (multi) ---
  function loadExercise(idx) {
    const ex = EXERCISES[idx];
    if (!ex) return;
    _exAttempts = 0;
    _exDone     = false;
    const qEl = document.getElementById('ex-question');
    const cEl = document.getElementById('ex-counter');
    const fb  = document.getElementById('exercise-feedback');
    const nx  = document.getElementById('ex-next');
    if (qEl) qEl.textContent = ex.q;
    if (cEl) cEl.textContent = idx + 1;
    if (fb)  fb.innerHTML = '';
    if (nx)  nx.style.display = 'none';
    const optsEl = document.getElementById('ex-options');
    if (!optsEl) return;
    optsEl.innerHTML = ex.opts.map((opt, i) =>
      `<button class="btn btn-ghost" style="text-align:left;justify-content:flex-start" data-exopt="${i}">${esc(opt)}</button>`
    ).join('');
    optsEl.querySelectorAll('[data-exopt]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (_exDone) return;
        _exAttempts++;
        const choice = parseInt(btn.dataset.exopt, 10);
        const fb2 = document.getElementById('exercise-feedback');
        if (choice === ex.ans) {
          _exDone = true;
          btn.style.borderColor = 'var(--accent-organic)';
          btn.style.color       = 'var(--accent-organic)';
          if (fb2) fb2.innerHTML = `<p class="feedback-correct">Correto! ${esc(ex.exp)}</p>`;
          markSectionDone('stoichiometry', 'exercise');
          const nxBtn = document.getElementById('ex-next');
          if (nxBtn && idx < EXERCISES.length - 1) nxBtn.style.display = 'inline-flex';
        } else {
          btn.style.borderColor = 'var(--accent-reaction)';
          btn.style.color       = 'var(--accent-reaction)';
          if (fb2 && _exAttempts === 1) fb2.innerHTML = `<p class="feedback-hint">Dica: ${esc(ex.hint)}</p>`;
        }
      });
    });
  }
  loadExercise(0);
  document.getElementById('ex-next')?.addEventListener('click', () => {
    _exIdx = Math.min(_exIdx + 1, EXERCISES.length - 1);
    loadExercise(_exIdx);
  });
export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
}
