/**
 * js/views/lab/titration-sim.js
 * Laboratório — Simulador de Titulação
 *
 * Calcula a curva de pH ponto a ponto para quatro combinações:
 *   ácido forte + base forte   (HCl + NaOH)
 *   ácido fraco + base forte   (CH3COOH + NaOH)
 *   base fraca  + ácido forte  (NH3 + HCl)
 *   ácido fraco + base fraca   (CH3COOH + NH3)  [aprox]
 *
 * O usuário define os parâmetros e adiciona o titulante
 * gota a gota (ou em saltos). A curva é desenhada ao vivo em canvas.
 *
 * Exporta: renderTitrationSim(container), destroyTitrationSim()
 */

import { esc } from '../../ui.js';

const Kw = 1e-14; // a 25 °C

// -------------------------------------------------------------------------
// Cálculo de pH para os quatro casos
// -------------------------------------------------------------------------

/** pH de uma solução de ácido forte */
function pHStrongAcid(C) {
  if (C <= 0) return 7;
  const H = (-C + Math.sqrt(C * C + 4 * Kw)) / 2;
  return -Math.log10(Math.max(H, 1e-15));
}

/** pH de uma solução de base forte */
function pHStrongBase(C) {
  if (C <= 0) return 7;
  const OH = (-C + Math.sqrt(C * C + 4 * Kw)) / 2;
  const H  = Kw / Math.max(OH, 1e-15);
  return -Math.log10(Math.max(H, 1e-15));
}

/** pH de ácido fraco usando aproximação de Newton-Raphson */
function pHWeakAcid(C, Ka) {
  if (C <= 0) return 7;
  // H^3 + Ka*H^2 - (Kw + Ka*C)*H - Ka*Kw = 0
  let H = Math.sqrt(Ka * C);
  for (let i = 0; i < 30; i++) {
    const f  = H * H * H + Ka * H * H - (Kw + Ka * C) * H - Ka * Kw;
    const df = 3 * H * H + 2 * Ka * H - (Kw + Ka * C);
    const dH = f / df;
    H -= dH;
    H = Math.max(H, 1e-15);
    if (Math.abs(dH) < 1e-14) break;
  }
  return -Math.log10(H);
}

/** pH de base fraca */
function pHWeakBase(C, Kb) {
  if (C <= 0) return 7;
  const Ka = Kw / Kb;
  // Tratar como ácido fraco do ácido conjugado — approx Henderson
  // Para C grande: OH ~ sqrt(Kb*C) -> H = Kw/OH
  let OH = Math.sqrt(Kb * C);
  for (let i = 0; i < 30; i++) {
    const f  = OH * OH * OH + Kb * OH * OH - (Kw + Kb * C) * OH - Kb * Kw;
    const df = 3 * OH * OH + 2 * Kb * OH - (Kw + Kb * C);
    const dOH = f / df;
    OH -= dOH;
    OH = Math.max(OH, 1e-15);
    if (Math.abs(dOH) < 1e-14) break;
  }
  return 14 + Math.log10(OH);
}

/**
 * Calcula o pH em qualquer ponto da titulação.
 * @param {number} VA   - volume do analito (L)
 * @param {number} CA   - concentração do analito
 * @param {number} VT   - volume de titulante adicionado (L)
 * @param {number} CT   - concentração do titulante
 * @param {string} type - 'SA-SB' | 'WA-SB' | 'WB-SA' | 'WA-WB'
 * @param {number} Ka   - Ka do ácido fraco (quando aplicável)
 * @param {number} Kb   - Kb da base fraca (quando aplicável)
 */
function calcpH(VA, CA, VT, CT, type, Ka, Kb) {
  const nA   = CA * VA;   // mol analito
  const nT   = CT * VT;   // mol titulante
  const VTot = VA + VT;

  if (type === 'SA-SB') {
    // Ácido forte (analito) + Base forte (titulante)
    const excess = nA - nT;
    if (excess > 1e-12) return pHStrongAcid(excess / VTot);
    if (excess < -1e-12) return pHStrongBase(-excess / VTot);
    return 7.0;
  }

  if (type === 'WA-SB') {
    // Ácido fraco (analito) + Base forte (titulante)
    const nBase = nT;
    const nAcid = nA - nBase;
    if (nAcid > 1e-12 && nBase > 1e-12) {
      // Região tampão: Henderson-Hasselbalch
      return -Math.log10(Ka) + Math.log10(nBase / nAcid);
    }
    if (nBase <= 1e-12) {
      // Antes da titulação começa
      return pHWeakAcid(nA / VTot, Ka);
    }
    if (nAcid <= 1e-12) {
      if (Math.abs(nAcid) < 1e-12) {
        // Ponto de equivalência: solução do sal CH3COO-Na+
        const Cbase = nA / VTot;  // concentração do ânion
        const Kb_conj = Kw / Ka;
        return 14 - pHWeakAcid(Cbase, Kb_conj);
      }
      // Excesso de base forte
      return pHStrongBase((nBase - nA) / VTot);
    }
    return pHWeakAcid(nA / VTot, Ka);
  }

  if (type === 'WB-SA') {
    // Base fraca (analito) + Ácido forte (titulante)
    const nAcid  = nT;
    const nBase  = nA - nAcid;
    if (nBase > 1e-12 && nAcid > 1e-12) {
      // Região tampão
      const pKa = 14 + Math.log10(Kb);
      return pKa + Math.log10(nBase / nAcid);
    }
    if (nAcid <= 1e-12) {
      return pHWeakBase(nA / VTot, Kb);
    }
    if (nBase <= 1e-12) {
      if (Math.abs(nBase) < 1e-12) {
        // Ponto de equivalência: solução do sal NH4Cl
        const Cacid = nA / VTot;
        const Ka_conj = Kw / Kb;
        return pHWeakAcid(Cacid, Ka_conj);
      }
      return pHStrongAcid((nAcid - nA) / VTot);
    }
    return pHWeakBase(nA / VTot, Kb);
  }

  // WA-WB: simplficado para fins didáticos
  const ratio = nT / nA;
  if (ratio < 0.01) return pHWeakAcid(nA / VTot, Ka);
  if (ratio > 0.99) return pHWeakBase(nT / VTot, Kb);
  return -Math.log10(Ka) + Math.log10(nT / (nA - nT));
}

// -------------------------------------------------------------------------
// Configurações pré-definidas
// -------------------------------------------------------------------------
const SYSTEMS = [
  {
    id: 'SA-SB',
    label: 'HCl + NaOH',
    desc:  'Ácido forte + Base forte. Ponto de equivalência em pH 7.',
    Ka: null, Kb: null,
    defaultCA: 0.1, defaultCT: 0.1, defaultVA: 25,
  },
  {
    id: 'WA-SB',
    label: 'CH\u2083COOH + NaOH',
    desc:  'Ácido fraco + Base forte. pKa = 4,76. Ponto de equivalência em pH > 7.',
    Ka: 1.76e-5, Kb: null,
    defaultCA: 0.1, defaultCT: 0.1, defaultVA: 25,
  },
  {
    id: 'WB-SA',
    label: 'NH\u2083 + HCl',
    desc:  'Base fraca + Ácido forte. pKb = 4,74. Ponto de equivalência em pH < 7.',
    Ka: null, Kb: 1.8e-5,
    defaultCA: 0.1, defaultCT: 0.1, defaultVA: 25,
  },
  {
    id: 'WA-WB',
    label: 'CH\u2083COOH + NH\u2083',
    desc:  'Ácido fraco + Base fraca. Aproximação didática de Henderson-Hasselbalch.',
    Ka: 1.76e-5, Kb: 1.8e-5,
    defaultCA: 0.1, defaultCT: 0.1, defaultVA: 25,
  },
];

// -------------------------------------------------------------------------
// Desenho da curva no canvas
// -------------------------------------------------------------------------
function drawCurve(canvas, ctx, points, VTmax, eqV, eqpH) {
  const W = canvas.width, H = canvas.height;
  const PAD = { t: 20, r: 20, b: 40, l: 50 };
  const pw = W - PAD.l - PAD.r;
  const ph = H - PAD.t - PAD.b;

  ctx.clearRect(0, 0, W, H);

  // Fundo
  ctx.fillStyle = '#161b22';
  ctx.fillRect(0, 0, W, H);

  // Grade
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let ph_ = 0; ph_ <= 14; ph_ += 2) {
    const y = PAD.t + ph - (ph_ / 14) * ph;
    ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + pw, y); ctx.stroke();
  }

  // Linha de pH 7
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.setLineDash([4, 4]);
  const y7 = PAD.t + ph - (7 / 14) * ph;
  ctx.beginPath(); ctx.moveTo(PAD.l, y7); ctx.lineTo(PAD.l + pw, y7); ctx.stroke();
  ctx.setLineDash([]);

  // Linha do ponto de equivalência
  if (eqV !== null && eqV <= VTmax) {
    ctx.strokeStyle = 'rgba(239,71,111,0.4)';
    ctx.setLineDash([4, 4]);
    const xEq = PAD.l + (eqV / VTmax) * pw;
    ctx.beginPath(); ctx.moveTo(xEq, PAD.t); ctx.lineTo(xEq, PAD.t + ph); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Eixos
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.l, PAD.t);
  ctx.lineTo(PAD.l, PAD.t + ph);
  ctx.lineTo(PAD.l + pw, PAD.t + ph);
  ctx.stroke();

  // Labels eixo Y (pH)
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  for (let p = 0; p <= 14; p += 2) {
    const y = PAD.t + ph - (p / 14) * ph;
    ctx.fillText(p, PAD.l - 6, y + 3);
  }
  ctx.save();
  ctx.translate(12, PAD.t + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('pH', 0, 0);
  ctx.restore();

  // Label eixo X
  ctx.textAlign = 'center';
  ctx.fillText(`V titulante (mL)`, PAD.l + pw / 2, H - 6);
  [0, VTmax / 2, VTmax].forEach(v => {
    const x = PAD.l + (v / VTmax) * pw;
    ctx.fillText(v.toFixed(1), x, PAD.t + ph + 16);
  });

  // Curva
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.lineWidth = 2;
  const grad = ctx.createLinearGradient(PAD.l, 0, PAD.l + pw, 0);
  grad.addColorStop(0, '#4fc3f7');
  grad.addColorStop(1, '#6bcb77');
  ctx.strokeStyle = grad;

  points.forEach(([vt, ph_], i) => {
    const x = PAD.l + (vt / VTmax) * pw;
    const y = PAD.t + ph - (Math.min(14, Math.max(0, ph_)) / 14) * ph;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Ponto atual
  if (points.length > 0) {
    const [vt, ph_] = points[points.length - 1];
    const x = PAD.l + (vt / VTmax) * pw;
    const y = PAD.t + ph - (Math.min(14, Math.max(0, ph_)) / 14) * ph;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd166';
    ctx.fill();

    // pH atual
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`pH = ${ph_.toFixed(2)}`, PAD.l + pw - 80, 16);
  }
}

// -------------------------------------------------------------------------
// Render / Destroy
// -------------------------------------------------------------------------
let _abortController = null;
let _canvas = null;
let _ctx    = null;
let _state  = null;

export function renderTitrationSim(container) {
  _abortController = new AbortController();
  const sig = _abortController.signal;

  _state = {
    sysIdx: 0,
    CA: 0.1, CT: 0.1, VA: 25,
    VTmax: 50,
    points: [],
    VTcurrent: 0,
  };

  container.innerHTML = `
<div class="lab-tool" id="titration-sim">
  <p class="lab-tool-desc">
    Escolha o sistema, defina as concentrações e adicione o titulante.
    A curva de pH é construída em tempo real.
  </p>

  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem" id="tit-sys-btns">
    ${SYSTEMS.map((s, i) => `
      <button class="btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-secondary'}"
              data-sys="${i}" title="${esc(s.desc)}">${esc(s.label)}</button>
    `).join('')}
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:0.5rem;margin-bottom:0.75rem">
    <label class="lab-param-label">
      C analito (mol/L)
      <input type="number" id="tit-CA" class="lab-number-input" min="0.001" max="2" step="0.01" value="0.1">
    </label>
    <label class="lab-param-label">
      V analito (mL)
      <input type="number" id="tit-VA" class="lab-number-input" min="1" max="100" step="1" value="25">
    </label>
    <label class="lab-param-label">
      C titulante (mol/L)
      <input type="number" id="tit-CT" class="lab-number-input" min="0.001" max="2" step="0.01" value="0.1">
    </label>
    <label class="lab-param-label">
      V max titulante (mL)
      <input type="number" id="tit-Vmax" class="lab-number-input" min="5" max="200" step="5" value="50">
    </label>
  </div>

  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem;align-items:center">
    <button class="btn btn-primary btn-sm" id="tit-add1">+0,5 mL</button>
    <button class="btn btn-primary btn-sm" id="tit-add5">+2 mL</button>
    <button class="btn btn-secondary btn-sm" id="tit-auto">Curva completa</button>
    <button class="btn btn-ghost btn-sm"    id="tit-reset">Reiniciar</button>
    <span id="tit-status" style="font-size:0.875rem;color:var(--text-secondary);margin-left:0.5rem"></span>
  </div>

  <div class="canvas-frame" id="tit-canvas-frame" style="padding:0;overflow:hidden;border-radius:8px"></div>

  <div id="tit-info" class="info-card" style="margin-top:0.75rem;font-size:0.875rem"></div>
</div>`;

  // Canvas
  const frame = container.querySelector('#tit-canvas-frame');
  _canvas = document.createElement('canvas');
  const W = Math.min(frame.clientWidth || 580, 580);
  const H = Math.round(W * 0.55);
  _canvas.width  = W;
  _canvas.height = H;
  _canvas.style.cssText = 'width:100%;display:block';
  frame.appendChild(_canvas);
  _ctx = _canvas.getContext('2d');

  function getSys()  { return SYSTEMS[_state.sysIdx]; }

  function eqVolume() {
    // V titulante no ponto de equivalência = CA*VA / CT
    return (_state.CA * _state.VA) / _state.CT;
  }

  function addPoint(VT) {
    const sys = getSys();
    const ph = calcpH(
      _state.VA / 1000, _state.CA,
      VT / 1000, _state.CT,
      sys.id,
      sys.Ka || 1e-4,
      sys.Kb || 1e-4
    );
    _state.points.push([VT, ph]);
    return ph;
  }

  function updateStatus() {
    const ph = _state.points.length
      ? _state.points[_state.points.length - 1][1].toFixed(2)
      : '--';
    const VT = _state.VTcurrent.toFixed(1);
    const eqV = eqVolume().toFixed(2);
    container.querySelector('#tit-status').textContent =
      `V adicionado: ${VT} mL  |  pH: ${ph}  |  Eq: ${eqV} mL`;
  }

  function redraw() {
    drawCurve(_canvas, _ctx, _state.points, _state.VTmax, eqVolume(), null);
    updateStatus();
  }

  function reset() {
    _state.points   = [];
    _state.VTcurrent = 0;
    // Ponto inicial (VT = 0)
    addPoint(0);
    redraw();
    updateInfo();
  }

  function updateInfo() {
    const sys = getSys();
    let extra = '';
    if (sys.Ka) {
      const pKa = (-Math.log10(sys.Ka)).toFixed(2);
      extra += `pKa = ${pKa}. `;
    }
    if (sys.Kb) {
      const pKb = (-Math.log10(sys.Kb)).toFixed(2);
      extra += `pKb = ${pKb}. `;
    }
    const eqV = eqVolume().toFixed(2);
    container.querySelector('#tit-info').innerHTML =
      `<strong>${esc(sys.label)}</strong> &mdash; ${esc(sys.desc)} ${esc(extra)}
       Ponto de equivalência estimado: ${esc(eqV)} mL de titulante.`;
  }

  function selectSys(idx) {
    _state.sysIdx = idx;
    container.querySelectorAll('[data-sys]').forEach(b => {
      b.className = `btn btn-sm ${+b.dataset.sys === idx ? 'btn-primary' : 'btn-secondary'}`;
    });
    reset();
  }

  function readParams() {
    _state.CA    = parseFloat(container.querySelector('#tit-CA').value)  || 0.1;
    _state.VA    = parseFloat(container.querySelector('#tit-VA').value)  || 25;
    _state.CT    = parseFloat(container.querySelector('#tit-CT').value)  || 0.1;
    _state.VTmax = parseFloat(container.querySelector('#tit-Vmax').value) || 50;
  }

  // Eventos
  container.querySelectorAll('[data-sys]').forEach(b => {
    b.addEventListener('click', () => { readParams(); selectSys(+b.dataset.sys); }, { signal: sig });
  });

  ['tit-CA','tit-VA','tit-CT','tit-Vmax'].forEach(id => {
    container.querySelector(`#${id}`).addEventListener('change', () => {
      readParams(); reset();
    }, { signal: sig });
  });

  container.querySelector('#tit-add1').addEventListener('click', () => {
    if (_state.VTcurrent >= _state.VTmax) return;
    _state.VTcurrent = Math.min(_state.VTcurrent + 0.5, _state.VTmax);
    addPoint(_state.VTcurrent);
    redraw();
  }, { signal: sig });

  container.querySelector('#tit-add5').addEventListener('click', () => {
    if (_state.VTcurrent >= _state.VTmax) return;
    _state.VTcurrent = Math.min(_state.VTcurrent + 2, _state.VTmax);
    addPoint(_state.VTcurrent);
    redraw();
  }, { signal: sig });

  container.querySelector('#tit-auto').addEventListener('click', () => {
    _state.points = [];
    _state.VTcurrent = 0;
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const VT = (_state.VTmax / steps) * i;
      addPoint(VT);
    }
    _state.VTcurrent = _state.VTmax;
    redraw();
  }, { signal: sig });

  container.querySelector('#tit-reset').addEventListener('click', () => {
    readParams(); reset();
  }, { signal: sig });

  reset();
  updateInfo();
}

export function destroyTitrationSim() {
  if (_abortController) { _abortController.abort(); _abortController = null; }
  _canvas = null; _ctx = null; _state = null;
}
