/**
 * js/views/lab/orbital-viewer.js
 * Laboratório — Visualizador de Orbitais Atômicos
 *
 * Calcula a densidade de probabilidade |psi(r,theta,phi)|^2 do hidrogênio
 * num plano de corte 2D (plano xz) e renderiza em ImageData com colormap.
 *
 * Orbitais suportados: 1s, 2s, 2p_z, 2p_x, 3s, 3p_z, 3d_z2, 3d_xz
 * As funções de onda são calculadas em unidades de Bohr (a0).
 *
 * Exporta: renderOrbitalViewer(container), destroyOrbitalViewer()
 */

import { createHiDPICanvas, esc } from '../../ui.js';

// Raio de Bohr em unidades arbitrárias no canvas
const A0 = 1;

// -------------------------------------------------------------------------
// Parte radial R_nl(r) [hidrogênio, não-normalizada para visualização]
// r em unidades de a0
// -------------------------------------------------------------------------
function radial(n, l, r) {
  const rho = 2 * r / (n * A0);
  switch (`${n}${l}`) {
    case '10': return Math.exp(-r / A0);
    case '20': return (2 - rho) * Math.exp(-rho / 2);
    case '21': return rho * Math.exp(-rho / 2);
    case '30': return (27 - 18 * rho + 2 * rho * rho) * Math.exp(-rho / 3);
    case '31': return (6 - rho) * rho * Math.exp(-rho / 3);
    case '32': return rho * rho * Math.exp(-rho / 3);
    default:   return 0;
  }
}

// Polinômios de Legendre associados P_l^|m|(cos theta)
function assocLegendre(l, m, cosT, sinT) {
  const am = Math.abs(m);
  switch (`${l}${am}`) {
    case '00': return 1;
    case '10': return cosT;
    case '11': return sinT;
    case '20': return 1.5 * cosT * cosT - 0.5;
    case '21': return 3 * cosT * sinT;
    case '22': return 3 * sinT * sinT;
    default:   return 0;
  }
}

// -------------------------------------------------------------------------
// Catálogo de orbitais
// -------------------------------------------------------------------------
const ORBITALS = [
  {
    id: '1s',   label: '1s',
    n: 1, l: 0, m: 0,
    desc: 'n=1, l=0, m=0. Esférico. Elétron mais próximo do núcleo. Todos os átomos têm 1s na configuração [core].',
    scale: 4,
    psi: (x, z) => {
      const r = Math.sqrt(x * x + z * z);
      return radial(1, 0, r);
    },
  },
  {
    id: '2s',   label: '2s',
    n: 2, l: 0, m: 0,
    desc: 'n=2, l=0, m=0. Esférico com um nó radial. Maior que 1s; lobo externo e interno separados por superfície nodal.',
    scale: 12,
    psi: (x, z) => {
      const r = Math.sqrt(x * x + z * z);
      return radial(2, 0, r);
    },
  },
  {
    id: '2pz',  label: '2p\u2082',
    n: 2, l: 1, m: 0,
    desc: 'n=2, l=1, m=0. Dois lobos ao longo do eixo z. Plano xy é o nó angular. Fundamental em ligacoes sigma e pi.',
    scale: 14,
    psi: (x, z) => {
      const r = Math.sqrt(x * x + z * z);
      if (r < 1e-9) return 0;
      const cosT = z / r;
      const sinT = Math.sqrt(1 - cosT * cosT);
      return radial(2, 1, r) * assocLegendre(1, 0, cosT, sinT);
    },
  },
  {
    id: '2px',  label: '2p\u2081',
    n: 2, l: 1, m: 1,
    desc: 'n=2, l=1, m=±1. Dois lobos ao longo do eixo x (no plano xz de corte). Combinação linear de m=+1 e m=-1.',
    scale: 14,
    psi: (x, z) => {
      const r = Math.sqrt(x * x + z * z);
      if (r < 1e-9) return 0;
      const cosT = z / r;
      const sinT = Math.sqrt(1 - cosT * cosT);
      // phi = 0 no plano xz -> cos(phi) = 1
      return radial(2, 1, r) * assocLegendre(1, 1, cosT, sinT);
    },
  },
  {
    id: '3s',   label: '3s',
    n: 3, l: 0, m: 0,
    desc: 'n=3, l=0, m=0. Três lobos radiais concêntricos com 2 nós radiais. Elétrons de valência em átomos da 3ª linha.',
    scale: 26,
    psi: (x, z) => {
      const r = Math.sqrt(x * x + z * z);
      return radial(3, 0, r);
    },
  },
  {
    id: '3pz',  label: '3p\u2082',
    n: 3, l: 1, m: 0,
    desc: 'n=3, l=1, m=0. Lembra 2p_z mas maior e com nó radial adicional em cada lobo.',
    scale: 28,
    psi: (x, z) => {
      const r = Math.sqrt(x * x + z * z);
      if (r < 1e-9) return 0;
      const cosT = z / r;
      const sinT = Math.sqrt(1 - cosT * cosT);
      return radial(3, 1, r) * assocLegendre(1, 0, cosT, sinT);
    },
  },
  {
    id: '3dz2', label: '3d\u2082\u00b2',
    n: 3, l: 2, m: 0,
    desc: 'n=3, l=2, m=0. Dois lobos ao longo de z e anel toroidal no plano xy. Fundamental em complexos de metais de transição.',
    scale: 30,
    psi: (x, z) => {
      const r = Math.sqrt(x * x + z * z);
      if (r < 1e-9) return 0;
      const cosT = z / r;
      const sinT = Math.sqrt(1 - cosT * cosT);
      return radial(3, 2, r) * (1.5 * cosT * cosT - 0.5);
    },
  },
  {
    id: '3dxz', label: '3d\u2093\u2082',
    n: 3, l: 2, m: 1,
    desc: 'n=3, l=2, m=±1. Quatro lobos entre os eixos x e z. Combinação linear de m=+1 e m=-1.',
    scale: 30,
    psi: (x, z) => {
      const r = Math.sqrt(x * x + z * z);
      if (r < 1e-9) return 0;
      const cosT = z / r;
      const sinT = Math.sqrt(1 - cosT * cosT);
      return radial(3, 2, r) * assocLegendre(2, 1, cosT, sinT);
    },
  },
];

// -------------------------------------------------------------------------
// Colormap: plasma-like (preto → azul → violeta → amarelo → branco)
// -------------------------------------------------------------------------
function colormap(t) {
  // t em [0,1]
  t = Math.max(0, Math.min(1, t));
  if (t < 0.25) {
    const s = t / 0.25;
    return [0, 0, Math.round(128 * s)];
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return [Math.round(80 * s), 0, Math.round(128 + 100 * s)];
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return [Math.round(80 + 160 * s), 0, Math.round(228 - 150 * s)];
  } else {
    const s = (t - 0.75) / 0.25;
    return [240, Math.round(200 * s), Math.round(78 + 177 * s)];
  }
}

// -------------------------------------------------------------------------
// Render do canvas para um orbital
// -------------------------------------------------------------------------
function renderOrbital(canvas, ctx, orbDef) {
  const W = canvas.width;
  const H = canvas.height;
  const scale = orbDef.scale; // unidades de Bohr que cabem no raio da view

  const img = ctx.createImageData(W, H);
  const data = img.data;

  // 1ª passagem: calcular |psi|^2 e encontrar o máximo
  const vals = new Float32Array(W * H);
  let maxVal = 0;

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      // Coordenadas em Bohr (plano xz)
      const x = ((px / W) * 2 - 1) * scale;
      const z = ((py / H) * 2 - 1) * scale;
      const psi = orbDef.psi(x, z);
      const prob = psi * psi;
      vals[py * W + px] = prob;
      if (prob > maxVal) maxVal = prob;
    }
  }

  // 2ª passagem: normalizar e colorir
  for (let i = 0; i < W * H; i++) {
    const t = maxVal > 0 ? Math.pow(vals[i] / maxVal, 0.35) : 0;
    const [r, g, b] = colormap(t);
    data[i * 4]     = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);

  // Eixos
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H);
  ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
  ctx.stroke();

  // Labels de eixo
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px monospace';
  ctx.fillText('z', W / 2 + 4, 12);
  ctx.fillText('x', W - 14, H / 2 - 4);
  ctx.fillText(`${scale}a\u2080`, 2, H - 4);
}

// -------------------------------------------------------------------------
// Render / Destroy
// -------------------------------------------------------------------------
let _abortController = null;
let _currentOrbIdx   = 0;
let _canvas          = null;
let _ctx             = null;

export function renderOrbitalViewer(container) {
  _abortController = new AbortController();
  const sig = _abortController.signal;
  _currentOrbIdx = 0;

  container.innerHTML = `
<div class="lab-tool" id="orbital-viewer">
  <p class="lab-tool-desc">
    Densidade de probabilidade |&psi;(x,z)|&sup2; num corte pelo plano xz.
    Quanto mais brilhante, maior a probabilidade de encontrar o elétron.
  </p>

  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem" id="orb-btns">
    ${ORBITALS.map((o, i) => `
      <button class="btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-secondary'}"
              data-orb="${i}">${esc(o.label)}</button>
    `).join('')}
  </div>

  <div style="display:flex;gap:1.25rem;flex-wrap:wrap;align-items:flex-start">
    <div class="canvas-frame" id="orb-canvas-frame"
         style="width:320px;height:320px;flex-shrink:0;padding:0;overflow:hidden;border-radius:8px"></div>
    <div id="orb-info" style="flex:1;min-width:200px"></div>
  </div>
</div>`;

  const frame = container.querySelector('#orb-canvas-frame');
  _canvas = document.createElement('canvas');
  _canvas.width  = 320;
  _canvas.height = 320;
  _canvas.style.cssText = 'width:100%;height:100%;display:block';
  frame.appendChild(_canvas);
  _ctx = _canvas.getContext('2d');

  function selectOrb(idx) {
    _currentOrbIdx = idx;
    const o = ORBITALS[idx];
    container.querySelectorAll('[data-orb]').forEach(btn => {
      btn.className = `btn btn-sm ${+btn.dataset.orb === idx ? 'btn-primary' : 'btn-secondary'}`;
    });
    renderOrbital(_canvas, _ctx, o);
    container.querySelector('#orb-info').innerHTML = `
<div class="info-card">
  <h3 style="margin-top:0;color:var(--accent-electron)">${esc(o.label)}</h3>
  <p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.6">${esc(o.desc)}</p>
  <div style="margin-top:0.75rem;display:flex;gap:1rem;font-size:0.8125rem">
    <span>n = <strong>${o.n}</strong></span>
    <span>l = <strong>${o.l}</strong></span>
    <span>m = <strong>${o.m}</strong></span>
  </div>
</div>
<div class="info-card" style="margin-top:0.5rem">
  <p style="font-size:0.8125rem;color:var(--text-muted);margin:0">
    Colormap: preto (prob. 0) &rarr; azul &rarr; violeta &rarr; amarelo (prob. max).<br>
    Plano de corte: xz (&phi; = 0).
  </p>
</div>`;
  }

  container.querySelectorAll('[data-orb]').forEach(btn => {
    btn.addEventListener('click', () => selectOrb(+btn.dataset.orb), { signal: sig });
  });

  selectOrb(0);
}

export function destroyOrbitalViewer() {
  if (_abortController) { _abortController.abort(); _abortController = null; }
  _canvas = null; _ctx = null;
}
