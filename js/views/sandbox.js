/**
 * js/views/sandbox.js — View: Laboratório livre
 * Lavoisier — Laboratório Visual de Química
 *
 * Construtor livre de moléculas com arrastar e soltar.
 * O aluno posiciona átomos e o sistema detecta e exibe as ligações.
 */

import { createHiDPICanvas, esc } from '../ui.js';
import { SimLoop }                 from '../engine/simulation.js';
import {
  clearCanvas, drawAtom, drawBond, drawLabel, COLOR
} from '../engine/renderer.js';
import { DragManager, hitCircle }  from '../engine/interaction.js';
import { markSectionDone }         from '../state.js';

const ATOM_PALETTE = [
  { symbol:'H',  r:14, maxBonds:1 },
  { symbol:'C',  r:18, maxBonds:4 },
  { symbol:'N',  r:18, maxBonds:3 },
  { symbol:'O',  r:20, maxBonds:2 },
  { symbol:'Cl', r:20, maxBonds:1 },
  { symbol:'S',  r:20, maxBonds:2 },
  { symbol:'P',  r:20, maxBonds:3 },
  { symbol:'Na', r:22, maxBonds:1 },
  { symbol:'Ca', r:22, maxBonds:2 },
  { symbol:'Fe', r:22, maxBonds:2 },
];

const BOND_THRESHOLD = 70; // px — distância para ligar automaticamente

let _atoms      = [];
let _bonds      = [];
let _loop       = null;
let _canvas     = null;
let _ctx        = null;
let _W = 600, _H = 420;
let _drag       = null;
let _selected   = 'C';   // átomo selecionado na palette

export function renderSandbox(outlet) {
  outlet.innerHTML = _html();
  _initCanvas();
  _bindEvents();
  markSectionDone('sandbox', 'visited');
}

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
  _atoms = []; _bonds = [];
}

function _html() {
  return `
<div class="module-page" id="sandbox-page">

  <button class="module-back btn-ghost" data-nav="/">
    &#8592; Início
  </button>

  <header class="module-header">
    <h1 class="module-title">Laboratório Livre</h1>
    <p class="module-concept">
      Monte moléculas livremente. Clique no canvas para adicionar um átomo do tipo selecionado.
      Arraste-os para reorganizar. Átomos próximos se ligam automaticamente.
    </p>
  </header>

  <section class="module-section">
    <h2 class="module-section-title">Construtor de Moléculas</h2>

    <!-- Palette de átomos -->
    <div class="molecule-toolbar" id="sandbox-palette" role="group" aria-label="Selecione o tipo de átomo">
      ${ATOM_PALETTE.map(a => `
        <button class="atom-btn ${a.symbol === _selected ? 'active' : ''}"
                data-atom="${esc(a.symbol)}"
                aria-pressed="${a.symbol === _selected}"
                title="${esc(a.symbol)} — máx. ${a.maxBonds} ligação(ões)">${esc(a.symbol)}</button>
      `).join('')}
    </div>

    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin:0.75rem 0">
      <button class="btn btn-sm btn-secondary" id="sb-undo">Remover último</button>
      <button class="btn btn-sm btn-ghost"     id="sb-clear">Limpar tudo</button>
    </div>

    <!-- Canvas -->
    <div class="canvas-frame" id="sandbox-canvas-frame" style="cursor:crosshair">
      <div class="canvas-label">Clique para adicionar átomo</div>
    </div>

    <div class="info-card" style="margin-top:1rem">
      <p style="font-size:0.8125rem;color:var(--text-secondary)">
        Átomo selecionado: <strong id="selected-atom-label" style="color:var(--accent-electron)">${esc(_selected)}</strong>
        &nbsp;&mdash;&nbsp;
        Átomos: <strong id="atom-count">0</strong>
        &nbsp;&mdash;&nbsp;
        Ligações: <strong id="bond-count">0</strong>
      </p>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Sugestões para explorar</h2>
    <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
      ${[
        ['Água', [['O',250,200,20],['H',190,250,14],['H',310,250,14]]],
        ['CO₂',  [['C',250,200,18],['O',165,200,20],['O',335,200,20]]],
        ['CH₄',  [['C',250,200,18],['H',320,200,14],['H',250,130,14],['H',180,200,14],['H',250,270,14]]],
        ['NaCl', [['Na',200,200,22],['Cl',310,200,20]]],
      ].map(([name, atoms]) => `
        <button class="btn btn-sm btn-secondary" data-preset='${JSON.stringify(atoms)}'>
          ${esc(name)}
        </button>
      `).join('')}
    </div>
  </section>

</div>`;
}

function _initCanvas() {
  const frame = document.getElementById('sandbox-canvas-frame');
  if (!frame) return;

  _W = Math.min(frame.clientWidth || 600, 700);
  _H = 420;

  const { canvas, ctx } = createHiDPICanvas(_W, _H);
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Canvas de construção livre de moléculas');
  frame.insertBefore(canvas, frame.firstChild);
  _canvas = canvas;
  _ctx    = ctx;

  // Click = adicionar átomo na posição clicada
  canvas.addEventListener('click', e => {
    if (_drag?._active) return; // ignorar click ao soltar drag
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Não adicionar se clicou sobre átomo existente
    if (_atoms.some(a => hitCircle(x, y, a.x, a.y, a.r + 2))) return;
    _addAtom(_selected, x, y);
  });

  // DragManager
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
    _rebuildBonds();
    _updateCounts();
  };

  if (_loop) _loop.stop();
  _loop = new SimLoop(() => _renderFrame());
  _loop.start();
}

function _addAtom(symbol, x, y) {
  const def = ATOM_PALETTE.find(a => a.symbol === symbol) || { r: 16, maxBonds: 1 };
  _atoms.push({ symbol, x, y, r: def.r, maxBonds: def.maxBonds });
  _rebuildBonds();
  _updateCounts();
}

function _rebuildBonds() {
  _bonds = [];
  for (let i = 0; i < _atoms.length; i++) {
    for (let j = i + 1; j < _atoms.length; j++) {
      const dx = _atoms[i].x - _atoms[j].x;
      const dy = _atoms[i].y - _atoms[j].y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < BOND_THRESHOLD) {
        _bonds.push({ a: i, b: j });
      }
    }
  }
}

function _renderFrame() {
  if (!_ctx) return;
  clearCanvas(_ctx, _W, _H);

  // Ligações
  _bonds.forEach(bond => {
    const a = _atoms[bond.a], b = _atoms[bond.b];
    if (!a || !b) return;
    drawBond(_ctx, a.x, a.y, b.x, b.y, 1, COLOR.bond);
  });

  // Átomos
  _atoms.forEach(atom => {
    drawAtom(_ctx, atom.x, atom.y, atom.r, atom.symbol);
  });

  if (_atoms.length === 0) {
    drawLabel(_ctx, 'Selecione um átomo acima e clique aqui para começar',
      _W/2, _H/2, COLOR.textMuted, '13px "Segoe UI",sans-serif');
  }
}

function _updateCounts() {
  const ac = document.getElementById('atom-count');
  const bc = document.getElementById('bond-count');
  if (ac) ac.textContent = String(_atoms.length);
  if (bc) bc.textContent = String(_bonds.length);
}

function _bindEvents() {
  // Palette
  document.getElementById('sandbox-palette')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-atom]');
    if (!btn) return;
    _selected = btn.dataset.atom;
    document.querySelectorAll('#sandbox-palette .atom-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.atom === _selected);
      b.setAttribute('aria-pressed', String(b.dataset.atom === _selected));
    });
    const lbl = document.getElementById('selected-atom-label');
    if (lbl) lbl.textContent = _selected;
  });

  // Undo
  document.getElementById('sb-undo')?.addEventListener('click', () => {
    _atoms.pop();
    _rebuildBonds();
    _updateCounts();
  });

  // Clear
  document.getElementById('sb-clear')?.addEventListener('click', () => {
    _atoms = []; _bonds = [];
    _updateCounts();
  });

  // Presets
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-preset]');
    if (!btn) return;
    try {
      const preset = JSON.parse(btn.dataset.preset);
      _atoms = preset.map(([symbol, x, y, r]) => {
        const def = ATOM_PALETTE.find(a => a.symbol === symbol) || { r: 16, maxBonds: 1 };
        return { symbol, x, y, r: r || def.r, maxBonds: def.maxBonds };
      });
      _rebuildBonds();
      _updateCounts();
    } catch (_) {}
  });
}
