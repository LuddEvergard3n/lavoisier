/**
 * modules/reactions/index.js — Módulo: Reações Químicas
 * Lavoisier — Laboratório Visual de Química
 *
 * Implementa:
 *  - Balanceador visual de equações com contagem atômica em tempo real
 *  - 4 reações: formação da água, ferrugem, fotossíntese, combustão do metano
 *  - Simulação de partículas Canvas para visualização cinética
 *  - Exercício guiado
 */

import { esc, createHiDPICanvas }  from '../../js/ui.js';
import { markSectionDone }         from '../../js/state.js';
import { SimLoop, Particle, spawnParticles } from '../../js/engine/simulation.js';
import { clearCanvas, drawParticle, drawLabel, COLOR } from '../../js/engine/renderer.js';

/* -----------------------------------------------------------------------
   Reações disponíveis
----------------------------------------------------------------------- */
const REACTIONS = {
  water: {
    label: 'Formação da água',
    info:  'Dois volumes de H₂ reagem com um volume de O₂ formando dois de H₂O. A reação libera 572 kJ/mol — é altamente exotérmica. Representa a combustão completa do hidrogênio.',
    reagents: [
      { formula:'H₂', coeff:2, atoms:{ H:2 }, color:'#e6edf3' },
      { formula:'O₂', coeff:1, atoms:{ O:2 }, color:'#ef476f' },
    ],
    products: [
      { formula:'H₂O', coeff:2, atoms:{ H:2, O:1 }, color:'#4fc3f7' },
    ],
    answer: { reagents:[2,1], products:[2] },
  },
  rust: {
    label: 'Ferrugem (oxidação do ferro)',
    info:  'O ferro reage com oxigênio formando óxido de ferro(III) — Fe₂O₃. Esta reação lenta é responsável pela degradação de estruturas metálicas. A presença de água (umidade) acelera o processo.',
    reagents: [
      { formula:'Fe',  coeff:4, atoms:{ Fe:1 }, color:'#ffd166' },
      { formula:'O₂',  coeff:3, atoms:{ O:2 },  color:'#ef476f' },
    ],
    products: [
      { formula:'Fe₂O₃', coeff:2, atoms:{ Fe:2, O:3 }, color:'#ffa726' },
    ],
    answer: { reagents:[4,3], products:[2] },
  },
  photo: {
    label: 'Fotossíntese (simplificada)',
    info:  'Plantas usam luz solar para converter CO₂ e H₂O em glicose (C₆H₁₂O₆) e liberam O₂. Este processo captura ~2800 kJ/mol de energia luminosa e é a base de toda a cadeia alimentar.',
    reagents: [
      { formula:'CO₂', coeff:6, atoms:{ C:1, O:2 }, color:'#8b949e' },
      { formula:'H₂O', coeff:6, atoms:{ H:2, O:1 }, color:'#4fc3f7' },
    ],
    products: [
      { formula:'C₆H₁₂O₆', coeff:1, atoms:{ C:6, H:12, O:6 }, color:'#6bcb77' },
      { formula:'O₂',       coeff:6, atoms:{ O:2 },             color:'#ef476f' },
    ],
    answer: { reagents:[6,6], products:[1,6] },
  },
  methane: {
    label: 'Combustão do metano',
    info:  'O metano (gás natural) reage com oxigênio formando CO₂ e H₂O. Libera 890 kJ/mol — é a reação que acontece em fogões e aquecedores. A combustão incompleta (pouco O₂) forma CO (monóxido de carbono), gás tóxico.',
    reagents: [
      { formula:'CH₄', coeff:1, atoms:{ C:1, H:4 }, color:'#b39ddb' },
      { formula:'O₂',  coeff:2, atoms:{ O:2 },       color:'#ef476f' },
    ],
    products: [
      { formula:'CO₂', coeff:1, atoms:{ C:1, O:2 }, color:'#8b949e' },
      { formula:'H₂O', coeff:2, atoms:{ H:2, O:1 }, color:'#4fc3f7' },
    ],
    answer: { reagents:[1,2], products:[1,2] },
  },
};

/* Estado local — resetado a cada render() */
let _rxKey   = 'water';
let _coeffs  = null;   // { reagents: number[], products: number[] }
let _loop    = null;
let _W       = 0;
let _H       = 160;
let _particles = [];
let _exAttempts = 0;
let _exDone     = false;

/* -----------------------------------------------------------------------
   Exports
----------------------------------------------------------------------- */
export function render(outlet) {
  if (_loop) { _loop.stop(); _loop = null; }
  _rxKey      = 'water';
  _exAttempts = 0;
  _exDone     = false;
  _particles  = [];

  outlet.innerHTML = _buildHTML();
  _resetCoeffs('water');
  _renderEquation();
  _updateBalance();
  _initCanvas();
  _bindEvents();
  _initRedox();
  markSectionDone('reactions', 'visited');
}


function _initRedox() {
  // Redox examples
    const REDOX_DATA = [{'title': 'Permanganato + Fe²⁺ (ácido)', 'anodo': '5Fe²⁺ → 5Fe³⁺ + 5e⁻', 'catodo': 'MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O', 'global': 'MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O', 'note': 'Usado em titulação de permanganato (auto-indicador: vira rosa permanente no PE).'}, {'title': 'Dicromato + I⁻ (ácido)', 'anodo': '6I⁻ → 3I₂ + 6e⁻', 'catodo': 'Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O', 'global': 'Cr₂O₇²⁻ + 6I⁻ + 14H⁺ → 2Cr³⁺ + 3I₂ + 7H₂O', 'note': 'I₂ formado detectado por titulação com tiossulfato (iodometria).'}, {'title': 'Desproportionamento do H₂O₂', 'anodo': 'H₂O₂ → O₂ + 2H⁺ + 2e⁻', 'catodo': 'H₂O₂ + 2H⁺ + 2e⁻ → 2H₂O', 'global': '2H₂O₂ → 2H₂O + O₂', 'note': 'Catalisado por MnO₂ ou catalase. O mesmo reagente é oxidante e redutor simultaneamente.'}, {'title': 'Cobre em HNO₃ concentrado', 'anodo': 'Cu → Cu²⁺ + 2e⁻', 'catodo': 'NO₃⁻ + 2H⁺ + e⁻ → NO₂ + H₂O (×2)', 'global': 'Cu + 4HNO₃(conc) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O', 'note': 'Produz gás marrom-alaranjado NO₂. HNO₃ diluído produz NO incolor.'}];
    function renderRedox(idx) {
      const d = REDOX_DATA[idx];
      const container = document.getElementById('redox-content');
      if(!container||!d) return;
      container.innerHTML = `
        <h3 style="margin-top:0;color:var(--accent-electron)">${d.title}</h3>
        <p style="font-size:var(--text-xs);color:var(--accent-reaction);margin:.2rem 0">Oxidação: <span style="font-family:monospace">${d.anodo}</span></p>
        <p style="font-size:var(--text-xs);color:var(--accent-organic);margin:.2rem 0">Redução: <span style="font-family:monospace">${d.catodo}</span></p>
        <p style="font-size:var(--text-sm);font-family:monospace;color:var(--accent-bond);margin:.5rem 0;font-weight:600">${d.global}</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary)">${d.note}</p>
      `;
      REDOX_DATA.forEach((_,j)=>{const b=document.getElementById('rdx-'+j);if(b) b.className='btn btn-xs '+(j===idx?'btn-secondary':'btn-ghost');});
    }
    renderRedox(0);
    REDOX_DATA.forEach((_,i)=>{ document.getElementById('rdx-'+i)?.addEventListener('click',()=>renderRedox(i)); });
}

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
}

/* -----------------------------------------------------------------------
   HTML
----------------------------------------------------------------------- */
function _buildHTML() {
  const rxButtons = Object.entries(REACTIONS).map(([k, r]) =>
    `<button class="atom-btn ${k === _rxKey ? 'active' : ''}"
             data-rx="${esc(k)}">${esc(r.label)}</button>`
  ).join('');

  return `
<div class="module-page" id="module-rx">
  <button class="module-back btn-ghost" data-nav="/modules">
    &#8592; Módulos
  </button>

  <header class="module-header">
    <h1 class="module-title">Reações Químicas</h1>
    <p class="module-concept">
      Uma reação química reorganiza átomos, mas nunca os cria nem os destrói (Lei de Lavoisier:
      conservação da massa). Balancear uma equação é garantir que o número de átomos de cada
      elemento seja igual nos dois lados. Ajuste os coeficientes abaixo.
    </p>
  </header>

    <!-- Redox e números de oxidação -->
  <section class="module-section">
    <h2 class="module-section-title">Reações redox — oxidação e redução</h2>
    <p class="module-text">Reações de oxidação-redução (redox) envolvem transferência de elétrons. <strong>Oxidação</strong>: perda de e⁻ (NOx aumenta). <strong>Redução</strong>: ganho de e⁻ (NOx diminui). Mnemônica: LEO diz GER (Lose Electrons = Oxidation; Gain Electrons = Reduction).</p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-bottom:1rem">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Regras de NOx</h3>
        <p style="font-size:var(--text-xs)">Elemento livre = 0 | H: +1 (exceto hidretos: −1) | O: −2 (exceto peróxidos: −1; OF₂: +2) | Metais alcalinos: +1 | Alcalinoterrosos: +2 | F: sempre −1 | Soma = carga total da espécie</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-electron)">Meia-reação anódica</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">Zn → Zn²⁺ + 2e⁻</p>
        <p style="font-size:var(--text-sm)">Anodo: oxidação (perde e⁻). NOx de Zn: 0 → +2.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Meia-reação catódica</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">Cu²⁺ + 2e⁻ → Cu</p>
        <p style="font-size:var(--text-sm)">Catodo: redução (ganha e⁻). NOx de Cu: +2 → 0.</p></div>
    </div>

    <p class="module-text"><strong>Balanceamento redox pelo método de meia-reação:</strong> (1) separar meia-reações; (2) balancear átomos (H₂O para O; H⁺ para H); (3) balancear cargas com e⁻; (4) igualar e⁻ e somar; (5) em meio básico: adicionar OH⁻ para neutralizar H⁺.</p>

    <div id="redox-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.75rem">
      <button class="btn btn-xs btn-secondary" id="rdx-0" data-rdx="0">MnO₄⁻/Fe²⁺</button>
      <button class="btn btn-xs btn-ghost" id="rdx-1" data-rdx="1">Cr₂O₇²⁻/I⁻</button>
      <button class="btn btn-xs btn-ghost" id="rdx-2" data-rdx="2">H₂O₂ (disproportioning)</button>
      <button class="btn btn-xs btn-ghost" id="rdx-3" data-rdx="3">Cu/HNO₃</button>
    </div>
    <div id="redox-content" class="info-card" style="background:var(--bg-raised)"></div>
  </section>

<section class="module-section">
    <h2 class="module-section-title">Balanceador visual</h2>
    <div class="molecule-toolbar" id="rx-selector" role="group" aria-label="Selecionar reação">
      ${rxButtons}
    </div>

    <div id="rx-info-card" class="info-card" style="margin:var(--space-4) 0"></div>

    <div id="rx-equation" class="reaction-equation" role="region" aria-label="Equação química"></div>

    <div id="rx-balance" class="mass-balance"></div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Simulação cinética</h2>
    <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-3)">
      Partículas dos reagentes colidem e formam produtos. A taxa de colisão aumenta com temperatura
      e concentração (teoria das colisões efetivas).
    </p>
    <div class="canvas-frame">
      <canvas id="rx-canvas" aria-label="Simulação de partículas"></canvas>
      <span class="canvas-label">Cinética de reação</span>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Exercício Guiado</h2>
    <div class="exercise-card">
      <p class="exercise-question">
        Na reação de combustão do metano:
        <strong>CH₄ + O₂ → CO₂ + H₂O</strong>.
        Quais coeficientes balanceiam esta equação?
      </p>
      <div class="exercise-options" id="rx-ex-options" role="group">
        ${[
          'CH₄ + 2O₂ → CO₂ + 2H₂O',
          'CH₄ + O₂ → CO₂ + H₂O',
          '2CH₄ + O₂ → CO₂ + 2H₂O',
          'CH₄ + 3O₂ → CO₂ + 2H₂O',
        ].map(o => `<button class="exercise-option" data-answer="${esc(o)}">${esc(o)}</button>`).join('')}
      </div>
      <div class="hint-box" id="rx-ex-hint"></div>
      <div class="exercise-feedback" id="rx-ex-feedback"></div>
      <div class="exercise-actions">
        <button class="btn btn-secondary btn-sm" id="rx-btn-hint">Usar dica</button>
        <button class="btn btn-primary btn-sm"   id="rx-btn-check" style="display:none">Verificar</button>
      </div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Onde isso aparece na vida real?</h2>
    <div class="real-life-card">
      <div class="real-life-label">Energia</div>
      <p>Combustíveis fósseis (gás natural, gasolina, carvão) liberam energia via reações de
         combustão. A eficiência energética depende de balancear corretamente os reagentes —
         mistura rica desperdiça combustível; mistura pobre gera CO.</p>
    </div>
    <div class="real-life-card">
      <div class="real-life-label">Medicina</div>
      <p>A respiração celular é uma reação de oxidação da glicose: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O
         + energia. Cada mol de glicose gera ~30 ATP — a moeda energética das células.</p>
    </div>
    <div style="margin-top:2rem;text-align:center">
      <button class="btn btn-secondary" data-nav="/modules">
        &#8592; Ver todos os módulos
      </button>
    </div>
  </section>
</div>`;
}

/* -----------------------------------------------------------------------
   Lógica de balanceamento
----------------------------------------------------------------------- */

/** Inicializa coeficientes como 1 para todos os compostos da reação. */
function _resetCoeffs(rxKey) {
  const rx = REACTIONS[rxKey];
  _coeffs = {
    reagents: rx.reagents.map(() => 1),
    products: rx.products.map(() => 1),
  };
}

/** Conta átomos de um lado (reagentes ou produtos) com coeficientes aplicados. */
function _countAtoms(compounds, coeffs) {
  const count = {};
  compounds.forEach((c, i) => {
    const cf = coeffs[i] || 1;
    Object.entries(c.atoms).forEach(([el, n]) => {
      count[el] = (count[el] || 0) + n * cf;
    });
  });
  return count;
}

/** Verifica se os dois lados estão balanceados. */
function _isBalanced(rx, coeffs) {
  const left  = _countAtoms(rx.reagents, coeffs.reagents);
  const right = _countAtoms(rx.products, coeffs.products);
  const allEl = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const el of allEl) {
    if ((left[el] || 0) !== (right[el] || 0)) return false;
  }
  return true;
}

/* -----------------------------------------------------------------------
   Render da equação
----------------------------------------------------------------------- */
function _renderEquation() {
  const rx     = REACTIONS[_rxKey];
  const eqEl   = document.getElementById('rx-equation');
  const infoEl = document.getElementById('rx-info-card');
  if (!eqEl) return;

  if (infoEl) {
    infoEl.innerHTML = `<h3>${esc(rx.label)}</h3>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.5rem">
        ${esc(rx.info)}
      </p>`;
  }

  const makeCompound = (c, idx, side) => {
    const coeff = _coeffs[side][idx];
    return `<div class="reaction-compound">
      <button class="reaction-coeff" data-side="${side}" data-idx="${idx}" data-dir="-1"
              aria-label="Diminuir coeficiente">−</button>
      <span class="reaction-coeff" style="cursor:default;min-width:24px;text-align:center">
        ${coeff}
      </span>
      <button class="reaction-coeff" data-side="${side}" data-idx="${idx}" data-dir="1"
              aria-label="Aumentar coeficiente">+</button>
      <span style="color:${esc(c.color)};font-family:var(--font-mono);font-size:var(--text-lg)">
        ${esc(c.formula)}
      </span>
    </div>`;
  };

  const reagentHTML = rx.reagents.map((c, i) =>
    (i > 0 ? '<span class="reaction-plus">+</span>' : '') + makeCompound(c, i, 'reagents')
  ).join('');

  const productHTML = rx.products.map((c, i) =>
    (i > 0 ? '<span class="reaction-plus">+</span>' : '') + makeCompound(c, i, 'products')
  ).join('');

  eqEl.innerHTML = reagentHTML +
    `<span class="reaction-arrow" aria-label="reage formando">&#8594;</span>` +
    productHTML;
}

/** Atualiza o painel de balanço de massa. */
function _updateBalance() {
  const rx      = REACTIONS[_rxKey];
  const balEl   = document.getElementById('rx-balance');
  if (!balEl) return;

  const left  = _countAtoms(rx.reagents, _coeffs.reagents);
  const right = _countAtoms(rx.products, _coeffs.products);
  const allEl = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
  const ok    = _isBalanced(rx, _coeffs);

  const makeRow = (el) => {
    const l = left[el]  || 0;
    const r = right[el] || 0;
    const match = l === r;
    return `<div style="display:flex;justify-content:space-between;align-items:center;
                        font-family:var(--font-mono);font-size:var(--text-sm);
                        padding:2px 0;color:${match ? 'var(--state-correct)' : 'var(--state-error)'}">
      <span>${esc(el)}: ${l}</span>
      <span>${match ? '=' : '≠'}</span>
      <span>${r}</span>
    </div>`;
  };

  balEl.innerHTML = `
    <div class="mass-side">
      <div class="mass-side-label">Reagentes</div>
      ${allEl.map(el => makeRow(el)).join('')}
    </div>
    <div class="mass-balanced ${ok ? 'ok' : 'fail'}" aria-live="polite">
      ${ok ? '✓' : '✗'}
    </div>
    <div class="mass-side">
      <div class="mass-side-label">Produtos</div>
      ${allEl.map(el => {
        const l = left[el] || 0;
        const r = right[el] || 0;
        const match = l === r;
        return `<div style="display:flex;justify-content:space-between;align-items:center;
                             font-family:var(--font-mono);font-size:var(--text-sm);
                             padding:2px 0;color:${match ? 'var(--state-correct)' : 'var(--state-error)'}">
          <span>${esc(el)}: ${r}</span>
          <span>${match ? '=' : '≠'}</span>
          <span>${l}</span>
        </div>`;
      }).join('')}
    </div>`;

  if (ok) markSectionDone('reactions', 'balanced');
  _respawnParticles();
}

/* -----------------------------------------------------------------------
   Canvas de partículas
----------------------------------------------------------------------- */
function _initCanvas() {
  const canvas = document.getElementById('rx-canvas');
  if (!canvas) return;

  const frame = canvas.parentElement;
  _W = Math.min(frame?.clientWidth || 520, 520);

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(_W * dpr);
  canvas.height = Math.round(_H * dpr);
  canvas.style.width  = _W + 'px';
  canvas.style.height = _H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  _respawnParticles();

  _loop = new SimLoop((dt) => {
    _particles.forEach(p => p.update(dt, _W, _H));
    clearCanvas(ctx, _W, _H);
    _particles.forEach(p => {
      drawParticle(ctx, p.x, p.y, p.r, p.color, 0.85);
      if (p.label) drawLabel(ctx, p.label, p.x, p.y, p.color, `bold 11px "Segoe UI",sans-serif`);
    });
  });
  _loop.start();
}

/** Recria partículas baseado nos coeficientes atuais. */
function _respawnParticles() {
  const rx = REACTIONS[_rxKey];
  _particles = [];
  let seed = 1;

  const spawn = (formula, coeff, color) => {
    const n = Math.min(coeff * 4, 24);
    spawnParticles(n, _W || 520, _H, 9, 60 + Math.random() * 30, color, formula, seed++).forEach(p => {
      _particles.push(p);
    });
  };

  rx.reagents.forEach((c, i) => spawn(c.formula, _coeffs.reagents[i], c.color));
}

/* -----------------------------------------------------------------------
   Eventos
----------------------------------------------------------------------- */
function _bindEvents() {
  // Seleção de reação
  document.getElementById('rx-selector')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-rx]');
    if (!btn) return;
    _rxKey = btn.dataset.rx;
    document.querySelectorAll('#rx-selector .atom-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.rx === _rxKey);
    });
    _resetCoeffs(_rxKey);
    _renderEquation();
    _updateBalance();
    markSectionDone('reactions', 'interaction');
  });

  // Coeficientes (delegado ao elemento da equação)
  document.getElementById('rx-equation')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-dir]');
    if (!btn) return;
    const side = btn.dataset.side;   // 'reagents' | 'products'
    const idx  = parseInt(btn.dataset.idx, 10);
    const dir  = parseInt(btn.dataset.dir, 10);
    if (!_coeffs[side]) return;
    const next = (_coeffs[side][idx] || 1) + dir;
    if (next < 1 || next > 9) return;
    _coeffs[side][idx] = next;
    _renderEquation();
    _updateBalance();
  });

  // Exercício
  const CORRECT = 'CH₄ + 2O₂ → CO₂ + 2H₂O';
  const HINTS   = [
    'Selecione "Combustão do metano" no balanceador e tente ajustar os coeficientes até equilibrar.',
    'Conte os átomos: CH₄ tem 1C e 4H. CO₂ tem 1C — ok. Para 4H, precisamos de 2H₂O (cada tem 2H).',
    'Com 2H₂O nos produtos, temos 2O. Mais 1O do CO₂ = 3O no total. O₂ tem 2 átomos, então precisamos de 2O₂ (= 4O — espera! Confira: 2×2 = 4, mas CO₂+2H₂O = 2+2 = 4O. Bate!)',
  ];

  const optEl   = document.getElementById('rx-ex-options');
  const checkEl = document.getElementById('rx-btn-check');
  const hintEl  = document.getElementById('rx-btn-hint');
  const fbEl    = document.getElementById('rx-ex-feedback');
  const hintBox = document.getElementById('rx-ex-hint');

  if (!optEl || !checkEl || !hintEl || !fbEl || !hintBox) return;

  optEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-answer]');
    if (!btn || _exDone) return;
    optEl.querySelectorAll('.exercise-option').forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('selected');
    btn.setAttribute('aria-pressed', 'true');
    checkEl.style.display = 'inline-flex';
  });

  checkEl.addEventListener('click', () => {
    if (_exDone) return;
    const sel = optEl.querySelector('.exercise-option.selected');
    if (!sel) return;
    _exAttempts++;
    const ok = sel.dataset.answer === CORRECT;
    optEl.querySelectorAll('.exercise-option').forEach(b => {
      b.disabled = true;
      if (b.dataset.answer === CORRECT) b.classList.add('correct');
      else if (b.classList.contains('selected')) b.classList.add('wrong');
    });
    fbEl.textContent = ok
      ? 'Correto! CH₄ + 2O₂ → CO₂ + 2H₂O. Reagentes: 1C, 4H, 4O. Produtos: 1C, 4H, 4O. Balanceado!'
      : 'Não está certo. Tente usar o balanceador acima para a combustão do metano e conte os átomos.';
    fbEl.className = `exercise-feedback ${ok ? 'bg-correct' : 'bg-error'}`;
    if (ok) { _exDone = true; markSectionDone('reactions', 'exercise'); }
  });

  hintEl.addEventListener('click', () => {
    const idx = Math.min(_exAttempts, HINTS.length - 1);
    hintBox.textContent = HINTS[idx];
    hintBox.classList.add('visible');
  });
}
