/**
 * js/views/sandbox.js — View: Laboratório
 * Lavoisier — Laboratório Visual de Química
 *
 * Hub com 7 ferramentas em abas:
 *   1. Construtor de Moléculas  (original)
 *   2. Estruturas de Lewis      (lab/lewis-builder.js)
 *   3. Balanceador de Equações  (lab/equation-balancer.js)
 *   4. Calculadora Estequiométrica (lab/stoich-calc.js)
 *   5. Simulador de Titulação   (lab/titration-sim.js)
 *   6. Visualizador de Orbitais (lab/orbital-viewer.js)
 *   7. Tabela de Solubilidade   (lab/solubility-table.js)
 *
 * Cada aba é montada quando selecionada e desmontada ao trocar.
 */

import { createHiDPICanvas, esc } from '../ui.js';
import { SimLoop }                 from '../engine/simulation.js';
import {
  clearCanvas, drawAtom, drawBond, drawLabel, COLOR,
} from '../engine/renderer.js';
import { DragManager, hitCircle }  from '../engine/interaction.js';
import { markSectionDone }         from '../state.js';

import {
  renderEquationBalancer, destroyEquationBalancer,
} from './lab/equation-balancer.js';
import {
  renderOrbitalViewer, destroyOrbitalViewer,
} from './lab/orbital-viewer.js';
import {
  renderTitrationSim, destroyTitrationSim,
} from './lab/titration-sim.js';
import {
  renderStoichCalc, destroyStoichCalc,
} from './lab/stoich-calc.js';
import {
  renderLewisBuilder, destroyLewisBuilder,
} from './lab/lewis-builder.js';
import {
  renderSolubilityTable, destroySolubilityTable,
} from './lab/solubility-table.js';

// -------------------------------------------------------------------------
// Definição das abas
// -------------------------------------------------------------------------
const TABS = [
  {
    id: 'molecules', label: 'Construtor', icon: '\u2B21',
    desc: 'Monte moléculas livremente por arrastar e soltar.',
    mount: mountMolecules, unmount: unmountMolecules,
  },
  {
    id: 'lewis', label: 'Lewis', icon: '\u26AC',
    desc: 'Estruturas de Lewis com pares não-ligantes e carga formal.',
    mount: c => renderLewisBuilder(c), unmount: destroyLewisBuilder,
  },
  {
    id: 'balancer', label: 'Balanceador', icon: '\u21CC',
    desc: 'Balanceie equações químicas por álgebra linear.',
    mount: c => renderEquationBalancer(c), unmount: destroyEquationBalancer,
  },
  {
    id: 'stoich', label: 'Estequiometria', icon: '\u2697',
    desc: 'Calcule quantidades e identifique o reagente limitante.',
    mount: c => renderStoichCalc(c), unmount: destroyStoichCalc,
  },
  {
    id: 'titration', label: 'Titulação', icon: '\u223F',
    desc: 'Simule curvas de pH em titulações ácido-base.',
    mount: c => renderTitrationSim(c), unmount: destroyTitrationSim,
  },
  {
    id: 'orbitals', label: 'Orbitais', icon: '\u25CE',
    desc: 'Visualize a densidade de probabilidade dos orbitais atômicos.',
    mount: c => renderOrbitalViewer(c), unmount: destroyOrbitalViewer,
  },
  {
    id: 'solubility', label: 'Solubilidade', icon: '\u229E',
    desc: 'Tabela interativa de solubilidade com detalhes dos precipitados.',
    mount: c => renderSolubilityTable(c), unmount: destroySolubilityTable,
  },
];

// -------------------------------------------------------------------------
// Estado do hub
// -------------------------------------------------------------------------
let _activeTabIdx = 0;
let _outlet       = null;
let _tabClickBound = false;

// -------------------------------------------------------------------------
// Entry points
// -------------------------------------------------------------------------
export function renderSandbox(outlet) {
  _outlet = outlet;
  _activeTabIdx = 0;
  _tabClickBound = false;
  outlet.innerHTML = _hubHTML();
  _bindTabClicks();
  _mountTab(0);
  markSectionDone('sandbox', 'visited');
}

export function destroy() {
  const tab = TABS[_activeTabIdx];
  if (tab && tab.unmount) tab.unmount();
}

// -------------------------------------------------------------------------
// Hub HTML
// -------------------------------------------------------------------------
function _hubHTML() {
  const tabBtns = TABS.map((t, i) => `
    <button class="lab-tab-btn${i === 0 ? ' active' : ''}"
            data-tabidx="${i}"
            aria-selected="${i === 0}"
            title="${esc(t.desc)}">
      <span class="lab-tab-icon">${esc(t.icon)}</span>
      <span class="lab-tab-label">${esc(t.label)}</span>
    </button>
  `).join('');

  return `
<div class="module-page" id="sandbox-page">

  <button class="module-back btn-ghost" data-nav="/">
    &#8592; Início
  </button>

  <header class="module-header">
    <h1 class="module-title">Laboratório</h1>
    <p class="module-concept">
      Ferramentas interativas de cálculo, visualização e exploração química.
    </p>
  </header>

  <nav class="lab-tabs" role="tablist" aria-label="Ferramentas do laboratório">
    ${tabBtns}
  </nav>

  <p id="lab-tab-desc" class="lab-tab-desc">${esc(TABS[0].desc)}</p>

  <section class="module-section" style="padding-top:0.75rem">
    <div id="lab-tool-container"></div>
  </section>

</div>`;
}

// -------------------------------------------------------------------------
// Troca de aba
// -------------------------------------------------------------------------
function _bindTabClicks() {
  if (!_outlet || _tabClickBound) return;
  _tabClickBound = true;
  _outlet.addEventListener('click', e => {
    const btn = e.target.closest('[data-tabidx]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.tabidx, 10);
    if (!isNaN(idx) && idx !== _activeTabIdx) _mountTab(idx);
  });
}

function _mountTab(idx) {
  if (!_outlet) return;

  // Desmontar aba anterior
  const prev = TABS[_activeTabIdx];
  if (prev && prev.unmount && idx !== _activeTabIdx) prev.unmount();

  _activeTabIdx = idx;
  const tab = TABS[idx];

  // Atualizar botões
  _outlet.querySelectorAll('.lab-tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === idx);
    btn.setAttribute('aria-selected', String(i === idx));
  });

  // Atualizar descrição
  const descEl = _outlet.querySelector('#lab-tab-desc');
  if (descEl) descEl.textContent = tab.desc;

  // Montar ferramenta no container
  const container = _outlet.querySelector('#lab-tool-container');
  if (container) {
    container.innerHTML = '';
    tab.mount(container);
  }
}

// =========================================================================
// Ferramenta 1 — Construtor de Moléculas
// =========================================================================

const ATOM_PALETTE = [
  { symbol: 'H',  r: 14, maxBonds: 1 },
  { symbol: 'C',  r: 18, maxBonds: 4 },
  { symbol: 'N',  r: 18, maxBonds: 3 },
  { symbol: 'O',  r: 20, maxBonds: 2 },
  { symbol: 'F',  r: 17, maxBonds: 1 },
  { symbol: 'Cl', r: 20, maxBonds: 1 },
  { symbol: 'S',  r: 20, maxBonds: 2 },
  { symbol: 'P',  r: 20, maxBonds: 3 },
  { symbol: 'Na', r: 22, maxBonds: 1 },
  { symbol: 'Ca', r: 22, maxBonds: 2 },
  { symbol: 'Fe', r: 22, maxBonds: 2 },
];
const BOND_THRESHOLD = 70;

let _atoms    = [];
let _bonds    = [];
let _loop     = null;
let _canvas   = null;
let _ctx      = null;
let _W = 600;
let _H = 420;
let _drag     = null;
let _selected = 'C';
let _molAbort = null;

function mountMolecules(container) {
  _atoms = []; _bonds = []; _selected = 'C';
  _molAbort = new AbortController();
  const sig = _molAbort.signal;

  container.innerHTML = `
<div class="lab-tool" id="mol-builder">
  <p class="lab-tool-desc">
    Selecione um átomo e clique no canvas para posicioná-lo.
    Arraste para reorganizar. Átomos próximos se ligam automaticamente.
  </p>

  <div class="molecule-toolbar" id="sb-palette" role="group" aria-label="Selecione o tipo de átomo">
    ${ATOM_PALETTE.map(a => `
      <button class="atom-btn ${a.symbol === _selected ? 'active' : ''}"
              data-atom="${esc(a.symbol)}"
              aria-pressed="${a.symbol === _selected}"
              title="${esc(a.symbol)} \u2014 m\u00e1x. ${a.maxBonds} lig.">${esc(a.symbol)}</button>
    `).join('')}
  </div>

  <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin:0.75rem 0;align-items:center">
    <button class="btn btn-sm btn-secondary" id="sb-undo">Remover \u00FAltimo</button>
    <button class="btn btn-sm btn-ghost"     id="sb-clear">Limpar tudo</button>
    <span style="font-size:0.8125rem;color:var(--text-secondary)">
      \u00c1tomo: <strong id="sb-sel-label" style="color:var(--accent-electron)">${esc(_selected)}</strong>
      &nbsp;|&nbsp; \u00c1tomos: <strong id="atom-count">0</strong>
      &nbsp;|&nbsp; Liga\u00e7\u00f5es: <strong id="bond-count">0</strong>
    </span>
  </div>

  <div class="canvas-frame" id="sb-canvas-frame" style="cursor:crosshair">
    <div class="canvas-label">Clique para adicionar \u00e1tomo</div>
  </div>

  <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem">
    ${[
      ['H\u2082O',    [['O',250,200,20],['H',190,255,14],['H',310,255,14]]],
      ['CO\u2082',    [['C',250,200,18],['O',165,200,20],['O',335,200,20]]],
      ['CH\u2084',    [['C',250,200,18],['H',325,200,14],['H',250,125,14],['H',175,200,14],['H',250,275,14]]],
      ['NH\u2083',    [['N',250,190,18],['H',185,245,14],['H',250,265,14],['H',315,245,14]]],
      ['NaCl',      [['Na',200,200,22],['Cl',310,200,20]]],
      ['H\u2082SO\u2084', [['S',250,200,20],['O',165,200,20],['O',335,200,20],['O',250,115,20],['O',250,285,20],['H',250,55,14],['H',250,345,14]]],
    ].map(([name, atoms]) => `
      <button class="btn btn-sm btn-secondary" data-mol-preset='${JSON.stringify(atoms)}'>
        ${esc(name)}
      </button>
    `).join('')}
  </div>
</div>`;

  const frame = container.querySelector('#sb-canvas-frame');
  _W = Math.min(frame.clientWidth || 600, 700);
  _H = 420;
  const { canvas, ctx } = createHiDPICanvas(_W, _H);
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Canvas de construção de moléculas');
  frame.insertBefore(canvas, frame.firstChild);
  _canvas = canvas; _ctx = ctx;

  canvas.addEventListener('click', e => {
    if (_drag && _drag._active) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (_atoms.some(a => hitCircle(x, y, a.x, a.y, a.r + 2))) return;
    const def = ATOM_PALETTE.find(a => a.symbol === _selected) || { r: 16, maxBonds: 1 };
    _atoms.push({ symbol: _selected, x, y, r: def.r, maxBonds: def.maxBonds });
    _rebuildBonds(); _updateCounts();
  }, { signal: sig });

  _drag = new DragManager(canvas);
  _drag.onDragStart = (x, y) => {
    for (let i = _atoms.length - 1; i >= 0; i--) {
      if (hitCircle(x, y, _atoms[i].x, _atoms[i].y, _atoms[i].r + 4)) return i;
    }
    return null;
  };
  _drag.onDragMove = (x, y, idx) => {
    if (idx === null) return;
    _atoms[idx].x = Math.max(_atoms[idx].r, Math.min(_W - _atoms[idx].r, x));
    _atoms[idx].y = Math.max(_atoms[idx].r, Math.min(_H - _atoms[idx].r, y));
    _rebuildBonds(); _updateCounts();
  };

  if (_loop) { _loop.stop(); _loop = null; }
  _loop = new SimLoop(() => {
    if (!_ctx) return;
    clearCanvas(_ctx, _W, _H);
    _bonds.forEach(bond => {
      const a = _atoms[bond.a], b = _atoms[bond.b];
      if (a && b) drawBond(_ctx, a.x, a.y, b.x, b.y, 1, COLOR.bond);
    });
    _atoms.forEach(atom => drawAtom(_ctx, atom.x, atom.y, atom.r, atom.symbol));
    if (_atoms.length === 0) {
      drawLabel(_ctx, 'Selecione um \u00e1tomo e clique aqui para come\u00e7ar',
        _W / 2, _H / 2, COLOR.textMuted, '13px "Segoe UI",sans-serif');
    }
  });
  _loop.start();

  container.querySelector('#sb-palette').addEventListener('click', e => {
    const btn = e.target.closest('[data-atom]');
    if (!btn) return;
    _selected = btn.dataset.atom;
    container.querySelectorAll('#sb-palette .atom-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.atom === _selected);
      b.setAttribute('aria-pressed', String(b.dataset.atom === _selected));
    });
    const lbl = container.querySelector('#sb-sel-label');
    if (lbl) lbl.textContent = _selected;
  }, { signal: sig });

  container.querySelector('#sb-undo').addEventListener('click', () => {
    _atoms.pop(); _rebuildBonds(); _updateCounts();
  }, { signal: sig });

  container.querySelector('#sb-clear').addEventListener('click', () => {
    _atoms = []; _bonds = []; _updateCounts();
  }, { signal: sig });

  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-mol-preset]');
    if (!btn) return;
    try {
      const preset = JSON.parse(btn.dataset.molPreset);
      const def0 = { r: 16, maxBonds: 1 };
      _atoms = preset.map(([symbol, x, y, r]) => {
        const def = ATOM_PALETTE.find(a => a.symbol === symbol) || def0;
        return { symbol, x, y, r: r || def.r, maxBonds: def.maxBonds };
      });
      _rebuildBonds(); _updateCounts();
    } catch (_) {}
  }, { signal: sig });
}

function unmountMolecules() {
  if (_loop)     { _loop.stop(); _loop = null; }
  if (_drag)     { if (typeof _drag.destroy === 'function') _drag.destroy(); _drag = null; }
  if (_molAbort) { _molAbort.abort(); _molAbort = null; }
  _atoms = []; _bonds = []; _canvas = null; _ctx = null;
}

function _rebuildBonds() {
  _bonds = [];
  for (let i = 0; i < _atoms.length; i++) {
    for (let j = i + 1; j < _atoms.length; j++) {
      const dx = _atoms[i].x - _atoms[j].x;
      const dy = _atoms[i].y - _atoms[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < BOND_THRESHOLD) {
        _bonds.push({ a: i, b: j });
      }
    }
  }
}

function _updateCounts() {
  const ac = document.getElementById('atom-count');
  const bc = document.getElementById('bond-count');
  if (ac) ac.textContent = String(_atoms.length);
  if (bc) bc.textContent = String(_bonds.length);
}
