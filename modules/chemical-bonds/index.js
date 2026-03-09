/**
 * modules/chemical-bonds/index.js — Módulo: Ligações Químicas
 * Lavoisier — Laboratório Visual de Química
 *
 * Implementa:
 *  - Visualização Canvas de moléculas com ligações
 *  - 5 presets: H₂O, CO₂, NH₃, CH₄, NaCl
 *  - Arraste de átomos (DragManager)
 *  - Indicador de polaridade e tipo de ligação
 *  - Exercício guiado
 */

import { esc, createHiDPICanvas }  from '../../js/ui.js';
import { markSectionDone }         from '../../js/state.js';
import { SimLoop }                 from '../../js/engine/simulation.js';
import { DragManager, hitCircle }  from '../../js/engine/interaction.js';
import {
  clearCanvas, drawAtom, drawBond, drawDipole,
  elementColor, COLOR
} from '../../js/engine/renderer.js';

/* -----------------------------------------------------------------------
   Definição das moléculas-preset
----------------------------------------------------------------------- */
const MOLECULES = {
  H2O: {
    label: 'H₂O — Água',
    type:  'covalente polar',
    info:  'Dois átomos de H compartilham elétrons com o O. O oxigênio é mais eletronegativo (3,44) — puxa os elétrons para si, criando dipolos. A geometria angular gera um dipolo resultante permanente: o O fica parcialmente negativo (δ−) e os H ficam positivos (δ+).',
    atoms: [
      { s:'O', x:0.50, y:0.45, r:22 },
      { s:'H', x:0.28, y:0.65, r:14 },
      { s:'H', x:0.72, y:0.65, r:14 },
    ],
    bonds: [[0,1,1],[0,2,1]],
    dipole: true,
    polar: true,
  },
  CO2: {
    label: 'CO₂ — Dióxido de Carbono',
    type:  'covalente apolar',
    info:  'Cada oxigênio faz dupla ligação com o carbono e puxa os elétrons (O é mais eletronegativo). Porém a geometria é linear e simétrica — os dois dipolos se cancelam. Resultado: molécula apolar mesmo com ligações polares.',
    atoms: [
      { s:'C', x:0.50, y:0.50, r:20 },
      { s:'O', x:0.22, y:0.50, r:20 },
      { s:'O', x:0.78, y:0.50, r:20 },
    ],
    bonds: [[0,1,2],[0,2,2]],
    dipole: false,
    polar: false,
  },
  NH3: {
    label: 'NH₃ — Amônia',
    type:  'covalente polar',
    info:  'Três hidrogênios ligados ao nitrogênio, que possui um par de elétrons não-ligante (par solitário). A geometria piramidal + maior eletronegatividade do N cria um dipolo resultante apontando para o N. Isso torna a amônia polar e solúvel em água.',
    atoms: [
      { s:'N', x:0.50, y:0.38, r:21 },
      { s:'H', x:0.28, y:0.60, r:14 },
      { s:'H', x:0.50, y:0.68, r:14 },
      { s:'H', x:0.72, y:0.60, r:14 },
    ],
    bonds: [[0,1,1],[0,2,1],[0,3,1]],
    dipole: true,
    polar: true,
  },
  CH4: {
    label: 'CH₄ — Metano',
    type:  'covalente apolar',
    info:  'Quatro hidrogênios ligados ao carbono em geometria tetraédrica perfeita. C e H têm eletronegatividades parecidas (C:2,55; H:2,20) e a simetria cancela qualquer dipolo. Metano é apolar — não se mistura com água.',
    atoms: [
      { s:'C', x:0.50, y:0.50, r:20 },
      { s:'H', x:0.28, y:0.30, r:14 },
      { s:'H', x:0.72, y:0.30, r:14 },
      { s:'H', x:0.28, y:0.70, r:14 },
      { s:'H', x:0.72, y:0.70, r:14 },
    ],
    bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1]],
    dipole: false,
    polar: false,
  },
  NaCl: {
    label: 'NaCl — Cloreto de Sódio',
    type:  'iônica',
    info:  'O Na (metal alcalino, baixa energia de ionização) cede seu elétron ao Cl (halogênio, alta eletronegatividade). Formam-se íons: Na⁺ e Cl⁻. A atração eletrostática entre cargas opostas é a ligação iônica — muito mais forte que covalente polar.',
    atoms: [
      { s:'Na', x:0.32, y:0.50, r:24, charge:'+' },
      { s:'Cl', x:0.68, y:0.50, r:24, charge:'−' },
    ],
    bonds: [[0,1,1]],
    dipole: true,
    polar: true,
    ionic: true,
  },
};

/* Estado local — resetado a cada render() */
let _loop    = null;
let _drag    = null;
let _molKey  = 'H2O';
let _atoms   = [];    // cópias mutáveis com posições canvas
let _W       = 0;
let _H       = 0;
let _exAttempts = 0;
let _exDone     = false;

/* -----------------------------------------------------------------------
   Exports
----------------------------------------------------------------------- */

const VSEPR_GEOMETRIES = [
  {
    name: 'Linear', angle: '180°', example: 'CO₂, BeH₂, C₂H₂',
    pairs: 2, lone: 0,
    desc: '2 pares ligantes, 0 pares livres. Repulsão simétrica — ângulo máximo 180°.',
    polar: 'Apolar (se grupos iguais)',
    svg: `<svg viewBox="0 0 160 60" width="160" height="60" aria-hidden="true">
      <circle cx="20" cy="30" r="12" fill="#ef476f" opacity=".8"/>
      <text x="20" y="34" text-anchor="middle" font-size="10" fill="white">O</text>
      <line x1="32" y1="30" x2="68" y2="30" stroke="#4fc3f7" stroke-width="3"/>
      <circle cx="80" cy="30" r="12" fill="#8b949e" opacity=".8"/>
      <text x="80" y="34" text-anchor="middle" font-size="10" fill="white">C</text>
      <line x1="92" y1="30" x2="128" y2="30" stroke="#4fc3f7" stroke-width="3"/>
      <circle cx="140" cy="30" r="12" fill="#ef476f" opacity=".8"/>
      <text x="140" y="34" text-anchor="middle" font-size="10" fill="white">O</text>
      <text x="80" y="56" text-anchor="middle" font-size="9" fill="#6e7681">180°</text>
    </svg>`,
  },
  {
    name: 'Angular', angle: '~104,5°', example: 'H₂O, SO₂, H₂S',
    pairs: 2, lone: 2,
    desc: '2 pares ligantes + 2 pares livres. Pares livres comprimem o ângulo abaixo de 109,5°.',
    polar: 'Polar (dipolos não se cancelam)',
    svg: `<svg viewBox="0 0 160 80" width="160" height="80" aria-hidden="true">
      <circle cx="80" cy="50" r="12" fill="#ef476f" opacity=".8"/>
      <text x="80" y="54" text-anchor="middle" font-size="10" fill="white">O</text>
      <line x1="72" y1="42" x2="44" y2="22" stroke="#e6edf3" stroke-width="2.5"/>
      <circle cx="36" cy="16" r="10" fill="#e6edf3" opacity=".8"/>
      <text x="36" y="20" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <line x1="88" y1="42" x2="116" y2="22" stroke="#e6edf3" stroke-width="2.5"/>
      <circle cx="124" cy="16" r="10" fill="#e6edf3" opacity=".8"/>
      <text x="124" y="20" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <text x="80" y="72" text-anchor="middle" font-size="9" fill="#6e7681">104,5°</text>
    </svg>`,
  },
  {
    name: 'Trigonal plana', angle: '120°', example: 'BF₃, SO₃, NO₃⁻',
    pairs: 3, lone: 0,
    desc: '3 pares ligantes, 0 livres. Ângulos iguais de 120° no plano.',
    polar: 'Apolar (se grupos iguais)',
    svg: `<svg viewBox="0 0 160 100" width="160" height="100" aria-hidden="true">
      <circle cx="80" cy="50" r="12" fill="#8b949e" opacity=".8"/>
      <text x="80" y="54" text-anchor="middle" font-size="9" fill="white">B</text>
      <line x1="80" y1="38" x2="80" y2="14" stroke="#6bcb77" stroke-width="2.5"/>
      <circle cx="80" cy="10" r="9" fill="#6bcb77" opacity=".9"/>
      <text x="80" y="14" text-anchor="middle" font-size="8" fill="#0d1117">F</text>
      <line x1="69" y1="56" x2="46" y2="80" stroke="#6bcb77" stroke-width="2.5"/>
      <circle cx="40" cy="86" r="9" fill="#6bcb77" opacity=".9"/>
      <text x="40" y="90" text-anchor="middle" font-size="8" fill="#0d1117">F</text>
      <line x1="91" y1="56" x2="114" y2="80" stroke="#6bcb77" stroke-width="2.5"/>
      <circle cx="120" cy="86" r="9" fill="#6bcb77" opacity=".9"/>
      <text x="120" y="90" text-anchor="middle" font-size="8" fill="#0d1117">F</text>
      <text x="80" y="96" text-anchor="middle" font-size="9" fill="#6e7681">120°</text>
    </svg>`,
  },
  {
    name: 'Piramidal', angle: '~107°', example: 'NH₃, PCl₃, NF₃',
    pairs: 3, lone: 1,
    desc: '3 pares ligantes + 1 par livre. O par livre empurra os ligantes para baixo.',
    polar: 'Polar (par livre cria assimetria)',
    svg: `<svg viewBox="0 0 160 100" width="160" height="100" aria-hidden="true">
      <circle cx="80" cy="30" r="12" fill="#4fc3f7" opacity=".8"/>
      <text x="80" y="34" text-anchor="middle" font-size="10" fill="#0d1117">N</text>
      <line x1="80" y1="42" x2="80" y2="68" stroke="#e6edf3" stroke-width="2.5"/>
      <circle cx="80" cy="74" r="10" fill="#e6edf3" opacity=".8"/>
      <text x="80" y="78" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <line x1="70" y1="38" x2="46" y2="65" stroke="#e6edf3" stroke-width="2.5"/>
      <circle cx="40" cy="72" r="10" fill="#e6edf3" opacity=".8"/>
      <text x="40" y="76" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <line x1="90" y1="38" x2="114" y2="65" stroke="#e6edf3" stroke-width="2.5"/>
      <circle cx="120" cy="72" r="10" fill="#e6edf3" opacity=".8"/>
      <text x="120" y="76" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <text x="80" y="96" text-anchor="middle" font-size="9" fill="#6e7681">107°</text>
    </svg>`,
  },
  {
    name: 'Tetraédrica', angle: '109,5°', example: 'CH₄, CCl₄, SiH₄',
    pairs: 4, lone: 0,
    desc: '4 pares ligantes, 0 livres. Ângulo máximo de separação no espaço 3D.',
    polar: 'Apolar (se grupos iguais)',
    svg: `<svg viewBox="0 0 160 100" width="160" height="100" aria-hidden="true">
      <circle cx="80" cy="50" r="12" fill="#8b949e" opacity=".8"/>
      <text x="80" y="54" text-anchor="middle" font-size="10" fill="white">C</text>
      <line x1="80" y1="38" x2="80" y2="12" stroke="#e6edf3" stroke-width="2"/>
      <circle cx="80" cy="8"  r="9" fill="#e6edf3" opacity=".8"/>
      <text x="80" y="12" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <line x1="70" y1="58" x2="42" y2="78" stroke="#e6edf3" stroke-width="2"/>
      <circle cx="36" cy="84" r="9" fill="#e6edf3" opacity=".8"/>
      <text x="36" y="88" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <line x1="90" y1="58" x2="118" y2="78" stroke="#e6edf3" stroke-width="2"/>
      <circle cx="124" cy="84" r="9" fill="#e6edf3" opacity=".8"/>
      <text x="124" y="88" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <line x1="68" y1="50" x2="36" y2="44" stroke="#e6edf3" stroke-width="2" stroke-dasharray="4,3"/>
      <circle cx="30" cy="42" r="9" fill="#e6edf3" opacity=".8"/>
      <text x="30" y="46" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <text x="80" y="98" text-anchor="middle" font-size="9" fill="#6e7681">109,5°</text>
    </svg>`,
  },
];

export function render(outlet) {
  // Limpar loop anterior se existir
  if (_loop) { _loop.stop(); _loop = null; }
  _drag    = null;
  _molKey  = 'H2O';
  _atoms   = [];
  _exAttempts = 0;
  _exDone     = false;

  outlet.innerHTML = _buildHTML();
  _initCanvas();
  _bindEvents();
  _initMO();
  markSectionDone('chemical-bonds', 'visited');
}


function _initMO() {
  // MO Theory tabs
    const MO_DATA = {'H2': {'config': '(σ1s)²', 'elig': 2, 'eanti': 0, 'bond': 1, 'mag': 'Diamagnético', 'note': 'Mais simples: 2e⁻ no OM ligante σ1s.'}, 'He2': {'config': '(σ1s)²(σ*1s)²', 'elig': 2, 'eanti': 2, 'bond': 0, 'mag': 'Diamagnético', 'note': 'OL=0: He₂ não existe estável em condições normais.'}, 'N2': {'config': '(σ2s)²(σ*2s)²(π2p)⁴(σ2p)²', 'elig': 8, 'eanti': 2, 'bond': 3, 'mag': 'Diamagnético', 'note': 'Ligação tripla: a mais forte e curta entre elementos 2p (945 kJ/mol).'}, 'O2': {'config': '(σ2s)²(σ*2s)²(σ2p)²(π2p)⁴(π*2p)²', 'elig': 8, 'eanti': 4, 'bond': 2, 'mag': 'Paramagnético (2e⁻)', 'note': '2e⁻ desemparelhados nos π*2p — paramagnético! Lewis prevê ligação dupla mas não o paramagnetismo.'}, 'F2': {'config': '(σ2s)²(σ*2s)²(σ2p)²(π2p)⁴(π*2p)⁴', 'elig': 8, 'eanti': 6, 'bond': 1, 'mag': 'Diamagnético', 'note': 'OL=1 apesar de muitos e⁻ antiligantes. Ligação F-F fraca (155 kJ/mol) — π* cheio.'}, 'NO': {'config': '(σ2s)²(σ*2s)²(σ2p)²(π2p)⁴(π*2p)¹', 'elig': 8, 'eanti': 3, 'bond': 2.5, 'mag': 'Paramagnético (1e⁻)', 'note': 'OL=2,5 — semi-ligação extra. Radical estável. Neurotransmissor e vasodilatador (Viagra e nitroglicerina liberam NO).'}};
    function renderMO(key) {
      const m = MO_DATA[key];
      const container = document.getElementById('mo-content');
      if(!container || !m) return;
      container.innerHTML = `
        <div style="display:flex;align-items:baseline;gap:1rem;flex-wrap:wrap;margin-bottom:.5rem">
          <span style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron)">${m.config}</span>
        </div>
        <div style="display:flex;gap:1.5rem;flex-wrap:wrap;margin-bottom:.5rem">
          <span style="font-size:var(--text-sm)">e⁻ ligantes: <strong style="color:var(--accent-organic)">${m.elig}</strong></span>
          <span style="font-size:var(--text-sm)">e⁻ antiligantes: <strong style="color:var(--accent-reaction)">${m.eanti}</strong></span>
          <span style="font-size:var(--text-sm)">Ordem de ligação: <strong style="color:var(--accent-electron)">${m.bond}</strong></span>
        </div>
        <p style="font-size:var(--text-sm);color:var(--accent-bond);margin:.2rem 0">${m.mag}</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.4rem 0 0">${m.note}</p>
      `;
      Object.keys(MO_DATA).forEach(k => {
        const btn = document.getElementById('mo-tab-'+k);
        if(btn) btn.className='btn btn-xs '+(k===key?'btn-secondary':'btn-ghost');
      });
    }
    renderMO('H2');
    Object.keys(MO_DATA).forEach(k => {
      document.getElementById('mo-tab-'+k)?.addEventListener('click', ()=>renderMO(k));
    });
}

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
  _drag = null;
}

/* -----------------------------------------------------------------------
   HTML
----------------------------------------------------------------------- */
function _buildHTML() {
  const molButtons = Object.entries(MOLECULES).map(([k, m]) =>
    `<button class="atom-btn ${k === _molKey ? 'active' : ''}"
             data-mol="${esc(k)}">${esc(m.label)}</button>`
  ).join('');

  return `
<div class="module-page" id="module-cb">
  <button class="module-back btn-ghost" data-nav="/modules">
    &#8592; Módulos
  </button>

  <header class="module-header">
    <h1 class="module-title">Ligações Químicas</h1>
    <p class="module-concept">
      Os átomos se unem para atingir configuração eletrônica estável.
      O tipo de ligação depende da diferença de eletronegatividade entre os átomos:
      covalente (compartilham elétrons), iônica (transferem elétrons) ou metálica.
      Arraste os átomos para explorar a geometria molecular.
    </p>
  </header>

    <!-- Teoria de Orbitais Moleculares (TOM) -->
  <section class="module-section">
    <h2 class="module-section-title">Teoria dos Orbitais Moleculares (TOM)</h2>
    <p class="module-text">Enquanto a Teoria de Lewis descreve ligações como pares de elétrons localizados, a TOM trata os elétrons como ondas espalhadas por toda a molécula. Orbitais atômicos se combinam por combinação linear (LCAO) formando orbitais moleculares ligantes (menor energia) e antiligantes (maior energia, assinalado com *).</p>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));margin-bottom:1rem">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Ordem de ligação</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">OL = (e⁻ lig − e⁻ antilig) / 2</p>
        <p style="font-size:var(--text-sm);margin-top:.4rem">OL = 0: molécula não existe (He₂). OL = 1: ligação simples (H₂). OL = 2: dupla (O₂). OL = 3: tripla (N₂). Maior OL = ligação mais curta e forte.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Paramagnetismo</h3>
        <p style="font-size:var(--text-sm)">Elétrons desemparelhados → paramagnético (atraído por campo magnético). O₂ tem 2 e⁻ desemparelhados (πg*) — paramagnético. N₂: todos emparelhados — diamagnético. Lewis não prevê o paramagnetismo do O₂; a TOM prevê.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Hibridização</h3>
        <p style="font-size:var(--text-sm)">Orbitais atômicos se misturam antes de formar ligações: sp (linear, 180°), sp² (trigonal, 120°), sp³ (tetraédrico, 109,5°), sp³d (bipiramidal), sp³d² (octaédrico). O número de grupos ligantes + pares livres = hibridização.</p>
      </div>
    </div>

    <div id="mo-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.75rem">
      <button class="btn btn-xs btn-secondary" id="mo-tab-H2" data-mo="H2">H₂</button>
      <button class="btn btn-xs btn-ghost" id="mo-tab-He2" data-mo="He2">He₂</button>
      <button class="btn btn-xs btn-ghost" id="mo-tab-N2" data-mo="N2">N₂</button>
      <button class="btn btn-xs btn-ghost" id="mo-tab-O2" data-mo="O2">O₂</button>
      <button class="btn btn-xs btn-ghost" id="mo-tab-F2" data-mo="F2">F₂</button>
      <button class="btn btn-xs btn-ghost" id="mo-tab-NO" data-mo="NO">NO</button>
    </div>
    <div id="mo-content" class="info-card" style="background:var(--bg-raised)"></div>
  </section>

<section class="module-section">
    <h2 class="module-section-title">Visualização interativa</h2>
    <div class="sim-panel">
      <div class="molecule-toolbar" id="mol-selector" role="group" aria-label="Selecionar molécula">
        ${molButtons}
      </div>
      <div class="canvas-frame" id="bond-canvas-frame">
        <canvas id="bond-canvas" aria-label="Visualização da molécula"></canvas>
        <span class="canvas-label">Arraste os átomos</span>
      </div>
      <div id="bond-info" class="info-card"></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Polaridade e dipolos</h2>
    <div class="info-card">
      <h3>O que determina a polaridade de uma molécula?</h3>
      <p>Dois fatores em conjunto: a <strong>polaridade das ligações</strong> (diferença de
      eletronegatividade) e a <strong>geometria molecular</strong>. Uma molécula pode ter ligações
      polares e ainda ser apolar se a simetria cancelar os dipolos (CO₂, CH₄).</p>
    </div>
    <div class="info-card" style="margin-top:var(--space-4)">
      <h3>Ligação metálica</h3>
      <p>Em metais, os elétrons de valência não pertencem a átomos individuais — formam um
      "mar de elétrons" que percorre o cristal. Isso explica condutividade elétrica, maleabilidade
      e brilho metálico.</p>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Exercício Guiado</h2>
    <div class="exercise-card">
      <p class="exercise-question">
        O <strong>CO₂</strong> possui ligações covalentes polares (C–O).
        Por que a molécula como um todo é classificada como <strong>apolar</strong>?
      </p>
      <div class="exercise-options" id="cb-ex-options" role="group">
        ${[
          'Porque C e O têm a mesma eletronegatividade',
          'Porque a geometria linear cancela os dipolos das ligações',
          'Porque a ligação dupla anula a polaridade',
          'Porque CO₂ é um óxido — óxidos são sempre apolares',
        ].map(o => `<button class="exercise-option" data-answer="${esc(o)}">${esc(o)}</button>`).join('')}
      </div>
      <div class="hint-box" id="cb-ex-hint"></div>
      <div class="exercise-feedback" id="cb-ex-feedback"></div>
      <div class="exercise-actions">
        <button class="btn btn-secondary btn-sm" id="cb-btn-hint">Usar dica</button>
        <button class="btn btn-primary btn-sm"   id="cb-btn-check" style="display:none">Verificar</button>
      </div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Onde isso aparece na vida real?</h2>
    <div class="real-life-card">
      <div class="real-life-label">Culinária</div>
      <p>A água (H₂O, polar) dissolve sal (NaCl, iônico) e açúcar (polar), mas não dissolve
         óleo (apolar). "Semelhante dissolve semelhante" é consequência direta da polaridade.</p>
    </div>
    <div class="real-life-card">
      <div class="real-life-label">Medicina</div>
      <p>Medicamentos lipofílicos (apolares) atravessam membranas celulares com facilidade.
         Medicamentos hidrofílicos (polares) ficam no sangue. Isso determina como fármacos
         são distribuídos e eliminados.</p>
    </div>
    <div style="margin-top:2rem;text-align:center">
      <button class="btn btn-primary" data-nav="/module/reactions">
        Próximo: Reações Químicas &#8594;
      </button>
    </div>
  </section>
</div>`;
}

/* -----------------------------------------------------------------------
   Canvas
----------------------------------------------------------------------- */
function _initCanvas() {
  const frame  = document.getElementById('bond-canvas-frame');
  const canvas = document.getElementById('bond-canvas');
  if (!frame || !canvas) return;

  // Dimensões fixas — não dependem do layout responsivo para hit detection
  _W = Math.min(frame.clientWidth || 520, 520);
  _H = 320;

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(_W * dpr);
  canvas.height = Math.round(_H * dpr);
  canvas.style.width  = _W + 'px';
  canvas.style.height = _H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  _loadMolecule(_molKey);
  _updateInfo(_molKey);

  _drag = new DragManager(canvas);
  _drag.onDragStart = (x, y) => {
    for (let i = _atoms.length - 1; i >= 0; i--) {
      if (hitCircle(x, y, _atoms[i].x, _atoms[i].y, _atoms[i].r + 6)) return i;
    }
    return null;
  };
  _drag.onDragMove = (x, y, idx) => {
    if (idx === null || idx === undefined) return;
    _atoms[idx].x = Math.max(_atoms[idx].r, Math.min(_W - _atoms[idx].r, x));
    _atoms[idx].y = Math.max(_atoms[idx].r, Math.min(_H - _atoms[idx].r, y));
  };

  _loop = new SimLoop(() => _draw(ctx));
  _loop.start();
}

function _loadMolecule(key) {
  const mol = MOLECULES[key];
  if (!mol) return;
  _atoms = mol.atoms.map(a => ({
    ...a,
    x: a.x * _W,
    y: a.y * _H,
  }));
}

function _draw(ctx) {
  const mol = MOLECULES[_molKey];
  if (!mol) return;

  clearCanvas(ctx, _W, _H);

  // Ligações
  for (const [i, j, order] of mol.bonds) {
    const a = _atoms[i];
    const b = _atoms[j];
    const color = mol.ionic ? '#ef5350' : COLOR.bond;
    drawBond(ctx, a.x, a.y, b.x, b.y, order, color);
  }

  // Dipolos (somente covalente polar, não iônico)
  if (mol.dipole && !mol.ionic) {
    for (const [i, j] of mol.bonds) {
      const a   = _atoms[i];
      const b   = _atoms[j];
      const ea  = 0;  // simplificado — seta do menos para o mais eletroneg.
      const col = COLOR.neutral;
      // Seta do H/Na para o átomo mais eletroneg.
      const fromIdx = _moreElectroneg(mol.atoms[i].s, mol.atoms[j].s) ? j : i;
      const toIdx   = fromIdx === i ? j : i;
      const from = _atoms[fromIdx];
      const to   = _atoms[toIdx];
      ctx.save();
      ctx.globalAlpha = 0.4;
      drawDipole(ctx, from.x, from.y, to.x, to.y, col);
      ctx.restore();
    }
  }

  // Átomos
  for (const a of _atoms) {
    drawAtom(ctx, a.x, a.y, a.r, a.s);
    // Carga iônica
    if (a.charge) {
      ctx.save();
      ctx.font = `bold 13px "Segoe UI",sans-serif`;
      ctx.fillStyle = a.charge === '+' ? COLOR.reaction : COLOR.electron;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(a.charge, a.x + a.r * 0.85, a.y - a.r * 0.85);
      ctx.restore();
    }
  }

  // Legenda de tipo
  ctx.save();
  ctx.font      = '12px "Segoe UI",sans-serif';
  ctx.fillStyle = COLOR.textMuted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(mol.type, _W - 12, _H - 10);
  ctx.restore();
}

/** Retorna true se a tem eletronegatividade maior que b */
function _moreElectroneg(a, b) {
  const en = { O:3.44, N:3.04, Cl:3.16, F:3.98, C:2.55, H:2.20, Na:0.93, S:2.58 };
  return (en[a] || 2) > (en[b] || 2);
}

function _updateInfo(key) {
  const mol   = MOLECULES[key];
  const panel = document.getElementById('bond-info');
  if (!mol || !panel) return;

  const typeColor = mol.ionic
    ? '#ef5350'
    : mol.polar ? '#ffd166' : '#6bcb77';

  panel.innerHTML = `
    <h3 style="margin-bottom:var(--space-3)">
      ${esc(mol.label)}
      <span class="badge" style="margin-left:.5rem;background:${typeColor}22;
            color:${typeColor};border-color:${typeColor}55">${esc(mol.type)}</span>
    </h3>
    <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.65">
      ${esc(mol.info)}
    </p>`;
}

/* -----------------------------------------------------------------------
   Eventos
----------------------------------------------------------------------- */
function _bindEvents() {
  // Seleção de molécula
  document.getElementById('mol-selector')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-mol]');
    if (!btn) return;
    _molKey = btn.dataset.mol;
    document.querySelectorAll('#mol-selector .atom-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mol === _molKey);
    });
    _loadMolecule(_molKey);
    _updateInfo(_molKey);
    markSectionDone('chemical-bonds', 'interaction');
  });

  // Exercício
  const CORRECT = 'Porque a geometria linear cancela os dipolos das ligações';
  const HINTS   = [
    'Selecione o CO₂ no simulador e observe a simetria da molécula.',
    'Uma molécula polar precisa ter dipolos que NÃO se cancelam. O que acontece quando dipolos opostos têm igual intensidade?',
    'O₂ puxa os elétrons para os dois lados com a mesma força. Na geometria linear, esses dois vetores apontam em direções opostas e se somam a zero.',
  ];

  const optEl   = document.getElementById('cb-ex-options');
  const checkEl = document.getElementById('cb-btn-check');
  const hintEl  = document.getElementById('cb-btn-hint');
  const fbEl    = document.getElementById('cb-ex-feedback');
  const hintBox = document.getElementById('cb-ex-hint');

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
      ? 'Correto! O CO₂ é linear e simétrico. Os dois dipolos C→O apontam em sentidos opostos e se cancelam — dipolo resultante = zero = molécula apolar.'
      : 'Não está certo. Pense em vetores: dois dipolos iguais em direções opostas se somam a zero.';
    fbEl.className = `exercise-feedback ${ok ? 'bg-correct' : 'bg-error'}`;
    if (ok) { _exDone = true; markSectionDone('chemical-bonds', 'exercise'); }
  });

  hintEl.addEventListener('click', () => {
    const idx = Math.min(_exAttempts, HINTS.length - 1);
    hintBox.textContent = HINTS[idx];
    hintBox.classList.add('visible');
  });
}
