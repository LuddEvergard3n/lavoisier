/**
 * js/views/lab/lewis-builder.js
 * Laboratório — Construtor de Estruturas de Lewis
 *
 * Extensão do construtor de moléculas:
 * - Exibe pares de elétrons não-ligantes ao redor de cada átomo
 * - Calcula e exibe a carga formal de cada átomo
 * - Indica violação da regra do octeto
 * - Sugere estruturas ressonantes para casos comuns
 *
 * Carga formal = e- de valência - e- não-ligantes - (e- de ligação / 2)
 *
 * Exporta: renderLewisBuilder(container), destroyLewisBuilder()
 */

import { createHiDPICanvas, esc } from '../../ui.js';
import { COLOR, clearCanvas, elementColor } from '../../engine/renderer.js';
import { DragManager, hitCircle }           from '../../engine/interaction.js';
import { SimLoop }                          from '../../engine/simulation.js';

// Elétrons de valência e octeto alvo por elemento
const VALENCE = {
  H:1, He:2, Li:1, Be:2, B:3, C:4, N:5, O:6, F:7, Ne:8,
  Na:1, Mg:2, Al:3, Si:4, P:5, S:6, Cl:7, Ar:8,
  K:1, Ca:2, Br:7, I:7, Se:6, As:5,
};
const OCTET_TARGET = {
  H:2, He:2, Li:2, Be:4, B:6, C:8, N:8, O:8, F:8,
  Na:8, Mg:8, Al:8, Si:8, P:10, S:12, Cl:8, Ar:8,
  K:8, Ca:8, Br:8, I:8, Se:8, As:10,
};

const ATOM_PALETTE = [
  { symbol:'H',  r:13, color:'#a0c4ff' },
  { symbol:'C',  r:17, color:'#6bcb77' },
  { symbol:'N',  r:17, color:'#4fc3f7' },
  { symbol:'O',  r:18, color:'#ef476f' },
  { symbol:'F',  r:17, color:'#ffd166' },
  { symbol:'Cl', r:19, color:'#95d5b2' },
  { symbol:'S',  r:19, color:'#ffd166' },
  { symbol:'P',  r:19, color:'#ffb347' },
  { symbol:'Br', r:20, color:'#cc5803' },
  { symbol:'I',  r:20, color:'#9b5de5' },
];

const BOND_THRESHOLD = 65;

// -------------------------------------------------------------------------
// Calcular pares não-ligantes e carga formal
// -------------------------------------------------------------------------
function calcLewisProps(atoms, bonds) {
  return atoms.map(atom => {
    const val = VALENCE[atom.symbol] || 4;
    const oct = OCTET_TARGET[atom.symbol] || 8;

    // Número de ligações (conta ligações duplas/triplas como 2/3)
    let bondCount = 0;
    bonds.forEach(b => {
      if (b.a === atom.id || b.b === atom.id) {
        bondCount += b.order || 1;
      }
    });

    // Elétrons de ligação
    const bondElectrons = bondCount * 2;

    // Elétrons de valência atribuídos
    // Regra: preencher octeto primeiro (ou target) com não-ligantes
    const lonePairElectrons = Math.max(0, oct - bondElectrons);
    const actualLoneElec   = Math.min(lonePairElectrons, val * 2 - bondElectrons);
    const lonePairs        = Math.floor(Math.max(0, actualLoneElec) / 2);

    // Carga formal = val - lonePairElec - bondElec/2
    const formalCharge = val - lonePairs * 2 - bondCount;

    // Violação do octeto
    const totalElec = lonePairs * 2 + bondElectrons;
    const octetOK   = totalElec === oct || atom.symbol === 'H' || atom.symbol === 'He';

    return { ...atom, lonePairs, formalCharge, octetOK, bondCount };
  });
}

// -------------------------------------------------------------------------
// Calcular ordem de ligação automática por distância
// (heurística simples: se dois carbonos são ligados, pode ser dupla)
// -------------------------------------------------------------------------
function computeBonds(atoms) {
  const bonds = [];
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const dx = atoms[i].x - atoms[j].x;
      const dy = atoms[i].y - atoms[j].y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < BOND_THRESHOLD) {
        bonds.push({ a: atoms[i].id, b: atoms[j].id, order: 1 });
      }
    }
  }
  return bonds;
}

// -------------------------------------------------------------------------
// Desenho
// -------------------------------------------------------------------------
function draw(canvas, ctx, W, H, atoms, bonds) {
  clearCanvas(ctx, W, H);
  ctx.lineWidth = 1;

  // Ligações
  bonds.forEach(bond => {
    const a = atoms.find(x => x.id === bond.a);
    const b = atoms.find(x => x.id === bond.b);
    if (!a || !b) return;

    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = -dy / len, uy = dx / len; // perpendicular

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth   = 2;
    const offsets = bond.order === 1 ? [0]
      : bond.order === 2 ? [-4, 4]
      : [-6, 0, 6];

    offsets.forEach(off => {
      ctx.beginPath();
      ctx.moveTo(a.x + ux * off, a.y + uy * off);
      ctx.lineTo(b.x + ux * off, b.y + uy * off);
      ctx.stroke();
    });
  });

  // Átomos + pares não-ligantes + carga formal
  const withProps = calcLewisProps(atoms, bonds);
  withProps.forEach(atom => {
    // Círculo do átomo
    const col = elementColor(atom.symbol) || atom.color || '#888';
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, atom.r, 0, Math.PI * 2);
    ctx.fillStyle = atom.octetOK ? col : '#ff6b6b';
    ctx.fill();
    ctx.strokeStyle = atom.octetOK ? 'rgba(255,255,255,0.3)' : '#ff0000';
    ctx.lineWidth   = atom.octetOK ? 1 : 2;
    ctx.stroke();

    // Símbolo
    ctx.fillStyle  = '#ffffff';
    ctx.font       = `bold ${atom.r > 16 ? 13 : 11}px sans-serif`;
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(atom.symbol, atom.x, atom.y);

    // Pares não-ligantes (pontos)
    const dirs = [[0,-1],[0,1],[-1,0],[1,0]]; // cima, baixo, esq, dir
    for (let p = 0; p < Math.min(atom.lonePairs, 4); p++) {
      const [dx, dy] = dirs[p % 4];
      const dist = atom.r + 9;
      const bx = atom.x + dx * dist;
      const by = atom.y + dy * dist;
      ctx.fillStyle = '#aaddff';
      // Dois pontos por par
      const perp_x = -dy, perp_y = dx;
      ctx.beginPath(); ctx.arc(bx + perp_x * 3, by + perp_y * 3, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bx - perp_x * 3, by - perp_y * 3, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    // Carga formal
    if (atom.formalCharge !== 0) {
      const sign = atom.formalCharge > 0 ? '+' : '';
      ctx.fillStyle = atom.formalCharge > 0 ? '#ff8888' : '#88aaff';
      ctx.font       = 'bold 10px sans-serif';
      ctx.textAlign  = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${sign}${atom.formalCharge}`, atom.x + atom.r - 2, atom.y - atom.r - 2);
    }
  });
}

// -------------------------------------------------------------------------
// Render / Destroy
// -------------------------------------------------------------------------
let _loop      = null;
let _canvas    = null;
let _ctx       = null;
let _atoms     = [];
let _bonds     = [];
let _drag      = null;
let _selected  = 'C';
let _nextId    = 1;
let _W = 560, _H = 380;
let _abortController = null;

export function renderLewisBuilder(container) {
  _abortController = new AbortController();
  const sig = _abortController.signal;
  _atoms = []; _bonds = []; _nextId = 1; _selected = 'C';

  container.innerHTML = `
<div class="lab-tool" id="lewis-builder">
  <p class="lab-tool-desc">
    Monte estruturas de Lewis. Pares não-ligantes (<span style="color:#aaddff">pontos azuis</span>)
    são calculados automaticamente. Carga formal aparece no canto superior do átomo.
    Átomo com <span style="color:#ff6b6b">borda vermelha</span> viola o octeto.
  </p>

  <div class="molecule-toolbar" id="lewis-palette">
    ${ATOM_PALETTE.map(a => `
      <button class="atom-btn ${a.symbol === 'C' ? 'active' : ''}"
              data-latom="${esc(a.symbol)}"
              style="background:${a.color}22;border-color:${a.color}"
              title="${esc(a.symbol)} (valência ${VALENCE[a.symbol] || '?'})">${esc(a.symbol)}</button>
    `).join('')}
  </div>

  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin:0.5rem 0;align-items:center">
    <button class="btn btn-sm btn-secondary" id="lew-toggle-order">Alternar ligação dupla/simples</button>
    <button class="btn btn-sm btn-secondary" id="lew-undo">Remover último</button>
    <button class="btn btn-sm btn-ghost"     id="lew-clear">Limpar</button>
    <span style="font-size:0.8125rem;color:var(--text-secondary)">
      Átomo: <strong id="lew-sel-label" style="color:var(--accent-electron)">${_selected}</strong>
    </span>
  </div>

  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem">
    ${[
      ['H\u2082O',  [[100,190,'O'],[40,240,'H'],[160,240,'H']]],
      ['CO\u2082',  [[200,190,'C'],[100,190,'O'],[300,190,'O']]],
      ['NH\u2083',  [[200,180,'N'],[130,240,'H'],[200,260,'H'],[270,240,'H']]],
      ['CH\u2082O', [[200,180,'C'],[130,230,'H'],[270,230,'H'],[200,110,'O']]],
      ['HCN',      [[200,190,'H'],[270,190,'C'],[340,190,'N']]],
      ['SO\u2082',  [[200,190,'S'],[120,190,'O'],[280,190,'O']]],
    ].map(([name, preset]) => `
      <button class="btn btn-sm btn-secondary" data-lpreset='${JSON.stringify(preset)}'>
        ${esc(name)}
      </button>
    `).join('')}
  </div>

  <div class="canvas-frame" id="lewis-canvas-frame" style="cursor:crosshair"></div>

  <div id="lew-status" class="info-card" style="margin-top:0.75rem;font-size:0.8125rem;color:var(--text-secondary)"></div>
</div>`;

  const frame = container.querySelector('#lewis-canvas-frame');
  _W = Math.min(frame.clientWidth || 560, 560);
  _H = 380;
  _canvas = document.createElement('canvas');
  _canvas.width  = _W;
  _canvas.height = _H;
  _canvas.style.cssText = 'width:100%;height:380px;cursor:crosshair;display:block';
  frame.appendChild(_canvas);
  _ctx = _canvas.getContext('2d');

  _loop = new SimLoop(() => {
    _bonds = computeBonds(_atoms);
    draw(_canvas, _ctx, _W, _H, _atoms, _bonds);
    updateStatus();
  }, 30);
  _loop.start();

  _drag = new DragManager(_canvas, {
    hitTest: (x, y) => _atoms.find(a => hitCircle(x, y, a.x, a.y, a.r + 4)),
    onDrag:  (atom, dx, dy) => {
      atom.x = Math.max(atom.r, Math.min(_W - atom.r, atom.x + dx));
      atom.y = Math.max(atom.r, Math.min(_H - atom.r, atom.y + dy));
    },
  });

  function updateStatus() {
    const props = calcLewisProps(_atoms, _bonds);
    const bad   = props.filter(a => !a.octetOK);
    const cf    = props.filter(a => a.formalCharge !== 0);
    let msg = `Átomos: ${_atoms.length} | Ligações: ${_bonds.length}`;
    if (bad.length)  msg += ` | Octeto violado: ${bad.map(a => a.symbol).join(', ')}`;
    if (cf.length)   msg += ` | Carga formal ≠ 0: ${cf.map(a => `${a.symbol}(${a.formalCharge > 0 ? '+' : ''}${a.formalCharge})`).join(', ')}`;
    const el = container.querySelector('#lew-status');
    if (el) el.textContent = msg;
  }

  // Click no canvas: adicionar átomo
  _canvas.addEventListener('click', e => {
    const rect = _canvas.getBoundingClientRect();
    const sx   = _canvas.width / rect.width;
    const sy   = _canvas.height / rect.height;
    const cx   = (e.clientX - rect.left) * sx;
    const cy   = (e.clientY - rect.top)  * sy;
    if (_atoms.some(a => hitCircle(cx, cy, a.x, a.y, a.r + 6))) return;
    const def = ATOM_PALETTE.find(p => p.symbol === _selected);
    _atoms.push({ id: _nextId++, symbol: _selected, r: def ? def.r : 17, x: cx, y: cy, color: def ? def.color : '#888' });
  }, { signal: sig });

  // Palette
  container.querySelectorAll('[data-latom]').forEach(btn => {
    btn.addEventListener('click', () => {
      _selected = btn.dataset.latom;
      container.querySelectorAll('[data-latom]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const lbl = container.querySelector('#lew-sel-label');
      if (lbl) lbl.textContent = _selected;
    }, { signal: sig });
  });

  // Alternar ordem de ligação: clique em dois átomos
  let _pendingToggle = null;
  container.querySelector('#lew-toggle-order').addEventListener('click', () => {
    _pendingToggle = 'waiting';
    const btn = container.querySelector('#lew-toggle-order');
    btn.textContent = 'Clique no 1° átomo...';
  }, { signal: sig });

  _canvas.addEventListener('click', e => {
    if (_pendingToggle !== 'waiting' && typeof _pendingToggle !== 'object') return;
    const rect = _canvas.getBoundingClientRect();
    const cx   = (e.clientX - rect.left) * (_canvas.width / rect.width);
    const cy   = (e.clientY - rect.top)  * (_canvas.height / rect.height);
    const hit  = _atoms.find(a => hitCircle(cx, cy, a.x, a.y, a.r + 4));
    if (!hit) return;

    if (_pendingToggle === 'waiting') {
      _pendingToggle = hit;
      const btn = container.querySelector('#lew-toggle-order');
      if (btn) btn.textContent = `1°: ${hit.symbol} — Clique no 2°...`;
    } else if (typeof _pendingToggle === 'object' && _pendingToggle !== null && _pendingToggle !== hit) {
      const a = _pendingToggle, b = hit;
      const bond = _bonds.find(bnd =>
        (bnd.a === a.id && bnd.b === b.id) || (bnd.a === b.id && bnd.b === a.id)
      );
      if (bond) {
        bond.order = bond.order >= 3 ? 1 : (bond.order || 1) + 1;
      }
      _pendingToggle = null;
      const btn = container.querySelector('#lew-toggle-order');
      if (btn) btn.textContent = 'Alternar ligação dupla/simples';
    }
  }, { signal: sig });

  container.querySelector('#lew-undo').addEventListener('click', () => {
    _atoms.pop();
    _bonds = computeBonds(_atoms);
  }, { signal: sig });

  container.querySelector('#lew-clear').addEventListener('click', () => {
    _atoms = []; _bonds = []; _nextId = 1;
  }, { signal: sig });

  // Presets
  container.querySelectorAll('[data-lpreset]').forEach(btn => {
    btn.addEventListener('click', () => {
      _atoms = []; _bonds = []; _nextId = 1;
      const preset = JSON.parse(btn.dataset.lpreset);
      preset.forEach(([x, y, sym]) => {
        const def = ATOM_PALETTE.find(p => p.symbol === sym);
        _atoms.push({ id: _nextId++, symbol: sym, r: def ? def.r : 17, x, y, color: def ? def.color : '#888' });
      });
    }, { signal: sig });
  });
}

export function destroyLewisBuilder() {
  if (_loop)  { _loop.stop(); _loop = null; }
  if (_drag)  { _drag.destroy(); _drag = null; }
  if (_abortController) { _abortController.abort(); _abortController = null; }
  _atoms = []; _bonds = []; _canvas = null; _ctx = null;
}
