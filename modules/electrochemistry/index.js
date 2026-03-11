/**
 * modules/electrochemistry/index.js — Módulo: Eletroquímica
 * Lavoisier — Laboratório Visual de Química
 *
 * Implementa:
 *  - Célula galvânica animada no canvas (pilha de Daniell)
 *  - Fluxo de elétrons e íons visualizado
 *  - Seleção de diferentes semirreações
 *  - Exercício guiado
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';
import { SimLoop }         from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

/* -----------------------------------------------------------------------
   Semirreações e potenciais padrão
----------------------------------------------------------------------- */
const CELLS = {
  daniell: {
    label:    'Pilha de Daniell (Zn/Cu)',
    anodo:    { metal:'Zn', ion:'Zn²⁺', E0:-0.76, color:'#b0bec5' },
    catodo:   { metal:'Cu', ion:'Cu²⁺', E0:+0.34, color:'#ffa726' },
    reaction: 'Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)',
    voltage:  1.10,
    info:     'Primeira pilha prática (1836). E°célula = E°catodo - E°anodo = 0,34 - (-0,76) = 1,10 V.',
  },
  znfe: {
    label:    'Zn / Fe',
    anodo:    { metal:'Zn', ion:'Zn²⁺', E0:-0.76, color:'#b0bec5' },
    catodo:   { metal:'Fe', ion:'Fe²⁺', E0:-0.44, color:'#8b949e' },
    reaction: 'Zn(s) + Fe²⁺(aq) → Zn²⁺(aq) + Fe(s)',
    voltage:  0.32,
    info:     'E°célula = -0,44 - (-0,76) = 0,32 V. Zn ainda é o anodo (mais negativo).',
  },
  znag: {
    label:    'Zn / Ag',
    anodo:    { metal:'Zn', ion:'Zn²⁺', E0:-0.76, color:'#b0bec5' },
    catodo:   { metal:'Ag', ion:'Ag⁺',  E0:+0.80, color:'#e0e0e0' },
    reaction: 'Zn(s) + 2Ag⁺(aq) → Zn²⁺(aq) + 2Ag(s)',
    voltage:  1.56,
    info:     'E°célula = 0,80 - (-0,76) = 1,56 V. Alta diferença de potencial.',
  },
};

/* -----------------------------------------------------------------------
   Estado do módulo — resetado em render()
----------------------------------------------------------------------- */
let _cellKey    = 'daniell';
let _electrons  = [];
let _ions       = [];
let _loop       = null;
let _exIdx     = 0;
let _exAttempts = 0;
let _exDone     = false;

/* -----------------------------------------------------------------------
   Partícula: elétron ou íon
----------------------------------------------------------------------- */
class FlowParticle {
  constructor(type, path, speed) {
    this.type  = type;   // 'electron' | 'ion_fwd' | 'ion_bwd'
    this.path  = path;   // array de pontos [{x,y}]
    this.t     = Math.random();
    this.speed = speed;
    this.done  = false;
  }

  update(dt) {
    this.t += dt * this.speed;
    if (this.t >= 1) this.t = 0;
  }

  position() {
    const { path, t } = this;
    const n   = path.length - 1;
    const seg = Math.floor(t * n);
    const f   = (t * n) - seg;
    const a   = path[Math.min(seg, n - 1)];
    const b   = path[Math.min(seg + 1, n)];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }
}

/* -----------------------------------------------------------------------
   Canvas: célula galvânica
----------------------------------------------------------------------- */
function startCanvas(canvasEl) {
  const frame = canvasEl.parentElement;
  const W     = Math.min(frame.clientWidth || 520, 520);
  const H     = 280;
  const dpr   = window.devicePixelRatio || 1;
  canvasEl.width  = Math.round(W * dpr);
  canvasEl.height = Math.round(H * dpr);
  canvasEl.style.width  = W + 'px';
  canvasEl.style.height = H + 'px';
  const ctx = canvasEl.getContext('2d');
  ctx.scale(dpr, dpr);

  // geometria fixa
  const aX = W * 0.18;  // anodo x centro
  const cX = W * 0.82;  // catodo x centro
  const solY = H * 0.55;
  const solH = H * 0.3;
  const solW = W * 0.3;
  const elecH = H * 0.35;
  const elecW = 18;
  const wireY = H * 0.12;

  // percurso elétron (pelo fio externo)
  const electronPath = [
    { x: aX, y: solY - elecH },
    { x: aX, y: wireY },
    { x: W/2, y: wireY * 0.7 },
    { x: cX, y: wireY },
    { x: cX, y: solY - elecH },
  ];

  // percurso íon+ no eletrólito (ponte salina)
  const ionFwdPath = [
    { x: W * 0.38, y: solY + solH * 0.5 },
    { x: W * 0.5,  y: solY + solH * 0.6 },
    { x: W * 0.62, y: solY + solH * 0.5 },
  ];
  const ionBwdPath = [...ionFwdPath].reverse();

  // criar partículas
  const cell = CELLS[_cellKey];
  _electrons = Array.from({ length: 8 }, () =>
    new FlowParticle('electron', electronPath, 0.18 + Math.random() * 0.1)
  );
  _ions = [
    ...Array.from({ length: 4 }, () => new FlowParticle('ion_fwd', ionFwdPath, 0.12)),
    ...Array.from({ length: 4 }, () => new FlowParticle('ion_bwd', ionBwdPath, 0.12)),
  ];

  if (_loop) _loop.stop();

  _loop = new SimLoop((dt, t) => {
    clearCanvas(ctx, W, H);

    const cell = CELLS[_cellKey];

    // soluções
    ctx.fillStyle = cell.anodo.color + '22';
    ctx.strokeStyle = cell.anodo.color + '88';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(aX - solW/2, solY, solW, solH, 4);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = cell.catodo.color + '22';
    ctx.strokeStyle = cell.catodo.color + '88';
    ctx.beginPath();
    ctx.roundRect(cX - solW/2, solY, solW, solH, 4);
    ctx.fill(); ctx.stroke();

    // ponte salina
    ctx.fillStyle = '#30363d55';
    ctx.strokeStyle = COLOR.border;
    ctx.beginPath();
    ctx.roundRect(W*0.38, solY + solH * 0.2, W*0.24, solH * 0.6, 3);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = COLOR.textMuted;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ponte', W/2, solY + solH * 0.52);
    ctx.fillText('salina', W/2, solY + solH * 0.65);

    // eletrodos
    ctx.fillStyle = cell.anodo.color;
    ctx.fillRect(aX - elecW/2, solY - elecH, elecW, elecH + solH * 0.7);
    ctx.fillStyle = cell.catodo.color;
    ctx.fillRect(cX - elecW/2, solY - elecH, elecW, elecH + solH * 0.7);

    // rótulos eletrodos
    ctx.fillStyle = COLOR.textPrimary;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cell.anodo.metal, aX, solY - elecH - 6);
    ctx.fillText(cell.catodo.metal, cX, solY - elecH - 6);
    ctx.fillStyle = COLOR.textMuted;
    ctx.font = '10px sans-serif';
    ctx.fillText('anodo (-)', aX, solY - elecH - 18);
    ctx.fillText('catodo (+)', cX, solY - elecH - 18);

    // fio externo
    ctx.strokeStyle = COLOR.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(aX, solY - elecH);
    ctx.lineTo(aX, wireY);
    ctx.lineTo(cX, wireY);
    ctx.lineTo(cX, solY - elecH);
    ctx.stroke();

    // voltagem no meio do fio
    ctx.fillStyle = COLOR.bond;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${cell.voltage.toFixed(2)} V`, W/2, wireY - 6);

    // seta de corrente
    ctx.strokeStyle = COLOR.bond;
    ctx.lineWidth = 1.5;
    const arrowX = W * 0.62;
    ctx.beginPath();
    ctx.moveTo(arrowX, wireY - 3);
    ctx.lineTo(arrowX - 8, wireY + 5);
    ctx.lineTo(arrowX + 8, wireY + 5);
    ctx.closePath();
    ctx.stroke();

    // elétrons
    _electrons.forEach(p => {
      p.update(dt);
      const pos = p.position();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = COLOR.electron;
      ctx.fill();
      // cauda
      const prev = { ...pos };
      const prevT = Math.max(0, p.t - 0.05);
      const seg  = Math.floor(prevT * (p.path.length-1));
      const f2   = prevT * (p.path.length-1) - seg;
      const a    = p.path[Math.min(seg, p.path.length-2)];
      const b    = p.path[Math.min(seg+1, p.path.length-1)];
      const px   = a.x + (b.x-a.x)*f2;
      const py   = a.y + (b.y-a.y)*f2;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(px, py);
      ctx.strokeStyle = COLOR.electron + '55';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // íons
    _ions.forEach(p => {
      p.update(dt);
      const pos = p.position();
      const isPos = p.type === 'ion_fwd';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isPos ? cell.anodo.color : cell.catodo.color;
      ctx.fill();
    });

    // rótulos soluções
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = cell.anodo.color;
    ctx.fillText(cell.anodo.ion + '(aq)', aX, solY + solH + 14);
    ctx.fillStyle = cell.catodo.color;
    ctx.fillText(cell.catodo.ion + '(aq)', cX, solY + solH + 14);
  });

  _loop.start();
}

/* -----------------------------------------------------------------------
   Exercício
----------------------------------------------------------------------- */
const EXERCISES = [
  { q: 'Na pilha Daniell (Zn/Cu), o Zn é o ânodo porque:', opts: ['É mais barato','E°(Zn²⁺/Zn) = -0,76 V < E°(Cu²⁺/Cu) = +0,34 V — oxida-se','É sólido','Tem maior massa'], ans: 1, exp: 'E°célula = 0,34 - (-0,76) = 1,10 V. Zn tem menor E° de redução — oxida-se no ânodo.', hint: 'O ânodo é onde ocorre oxidação. Qual metal tem menor E° de redução?' },
  { q: 'Na eletrólise da água, qual gás se forma no cátodo?', opts: ['O₂','H₂','H₂O','OH⁻'], ans: 1, exp: 'Cátodo (redução): 2H₂O + 2e⁻ → H₂ + 2OH⁻. Ânodo: 2H₂O → O₂ + 4H⁺ + 4e⁻.', hint: 'No cátodo ocorre redução. O que é reduzido na eletrólise da água?' },
  { q: 'A relação entre ΔG° e E°célula é:', opts: ['ΔG° = +nFE°','ΔG° = -nFE°','ΔG° = nRT ln E°','ΔG° = E°/n'], ans: 1, exp: 'ΔG° = -nFE°. Se E° > 0, ΔG° < 0 → espontânea.', hint: 'O sinal garante que E° positivo corresponde a ΔG° negativo.' },
  { q: 'Quantos coulombs para depositar 1 mol de Cu²⁺ + 2e⁻ → Cu?', opts: ['96485 C','192970 C','48243 C','1 C'], ans: 1, exp: '1 mol Cu requer 2 mol e⁻ = 2 × 96485 = 192970 C.', hint: 'q = n_elétrons × F. Cu²⁺ + 2e⁻: quantos elétrons por átomo de Cu?' },
  { q: 'Pela equação de Nernst, E diminui quando:', opts: ['T aumenta','Q aumenta (produtos se acumulam)','n aumenta e Q < 1','E° aumenta'], ans: 1, exp: 'E = E° - (RT/nF)lnQ. Quando Q cresce, lnQ > 0, E diminui.', hint: 'E = E° - (RT/nF)lnQ. Analise o efeito de Q crescente.' },,
  { q:'Na pilha Daniell (Zn|ZnSO₄||CuSO₄|Cu): E°(Zn²⁺/Zn)=-0,76V; E°(Cu²⁺/Cu)=+0,34V. E°célula = ?', opts:['-1,10 V','+1,10 V','+0,42 V','-0,42 V'], ans:1, exp:'E°célula = E°cátodo - E°ânodo = +0,34 - (-0,76) = +1,10 V. Positivo → espontânea. Cátodo: Cu²⁺ + 2e⁻ → Cu. Ânodo: Zn → Zn²⁺ + 2e⁻.', hint:'E°célula = E°cátodo - E°ânodo. Cátodo tem E° maior (redução espontânea).' },
  { q:'ΔG° da pilha Daniell com n=2 elétrons e E°=1,10 V é:', opts:['+212,5 kJ/mol','-212,3 kJ/mol','+106 kJ/mol','-53 kJ/mol'], ans:1, exp:'ΔG° = -nFE° = -2 × 96485 × 1,10 = -212268 J/mol ≈ -212,3 kJ/mol. Negativo → espontânea.', hint:'ΔG° = -nFE°. F = 96485 C/mol. Converter J para kJ (/1000).' },
  { q:'Na eletrólise do CuSO₄ com eletrodos inertes, o que ocorre no cátodo?', opts:['O₂ é produzido','Cu²⁺ + 2e⁻ → Cu (cobre metálico deposita)','H₂ é produzido','SO₄²⁻ é oxidado'], ans:1, exp:'Cátodo: redução. O Cu²⁺ é o cátion com maior potencial de redução disponível (+0,34 V >> potencial de redução do H₂O). Cu deposita no cátodo. No ânodo: 2H₂O → O₂ + 4H⁺ + 4e⁻.', hint:'Cátodo = redução. O íon metálico mais nobre é reduzido preferencialmente.' },
  { q:'Pela 1ª Lei de Faraday, qual a massa de Cu depositada ao passar 2 A por 965 s? (M(Cu)=64 g/mol, F=96500 C/mol, n=2)', opts:['0,32 g','0,64 g','1,28 g','0,16 g'], ans:1, exp:'Q = I × t = 2 × 965 = 1930 C. n_mol = Q/(n×F) = 1930/(2×96500) = 0,01 mol. m = 0,01 × 64 = 0,64 g.', hint:'m = (I × t × M) / (n × F). Ou: Q = It; n_mol = Q/(n×F); m = n_mol × M.' },
  { q:'A equação de Nernst E = E° - (RT/nF)lnQ mostra que a f.e.m. da pilha diminui quando:', opts:['A temperatura aumenta','Q aumenta (reagentes consumidos, produtos acumulam)','Q diminui (mais reagentes)','F aumenta'], ans:1, exp:'E = E° - (0,0592/n)logQ a 25°C. Q grande significa menos reagente / mais produto → pilha perto do equilíbrio → menor E. No equilíbrio, Q = K e E = 0 (pilha "morta").', hint:'Q grande → E diminui. Q = K → E = 0 (pilha morta).' },
  { q:'No processo de anodização do alumínio, o Al é o:', opts:['Cátodo — é reduzido formando Al₂O₃','Ânodo — é oxidado formando camada de Al₂O₃','Eletrólito','Catalisador'], ans:1, exp:'Anodização: Al é o ânodo. Al - 3e⁻ → Al³⁺, que reage com O²⁻ do eletrólito formando Al₂O₃. A camada de óxido é densa, protetora e pode ser colorida. Nome "anodização" vem de "ânodo".', hint:'Anodização = processo anódico (oxidação). Al é oxidado → ânodo.' },
  { q:'Uma bateria de lítio tem E° = 3,7 V e capacidade de 3000 mAh. A energia armazenada em Wh é:', opts:['3 Wh','11,1 Wh','3000 Wh','0,3 Wh'], ans:1, exp:'Energia (Wh) = V × Ah = 3,7 V × 3 Ah = 11,1 Wh. (3000 mAh = 3 Ah). Em Joules: 11,1 × 3600 ≈ 40.000 J = 40 kJ.', hint:'Energia (Wh) = Tensão × Capacidade(Ah). 1000 mAh = 1 Ah.' },
  { q:'A corrosão do ferro em ambiente úmido ocorre como pilha galvânica. A área mais aerada (mais O₂) age como:', opts:['Ânodo — ferro se oxida','Cátodo — O₂ é reduzido (O₂ + 2H₂O + 4e⁻ → 4OH⁻)','Eletrólito','Inibidor da corrosão'], ans:1, exp:'Mecanismo de corrosão em área aerada: O₂ é reduzido no cátodo (área aerada). No ânodo (área menos aerada ou com defeito): Fe → Fe²⁺ + 2e⁻. Os elétrons fluem pelo metal do ânodo para o cátodo. Isso explica por que arranhões e frestas corroem primeiro.', hint:'O₂ é agente oxidante. Onde há O₂: cátodo. Onde Fe se dissolve: ânodo.' },
  { q:'Na eletrólise da água: qual é a razão molar de H₂:O₂ produzida?', opts:['1:1','2:1','1:2','4:1'], ans:1, exp:'Cátodo: 4H₂O + 4e⁻ → 2H₂ + 4OH⁻ (2 mol H₂). Ânodo: 2H₂O → O₂ + 4H⁺ + 4e⁻ (1 mol O₂). Razão H₂:O₂ = 2:1. Volumetricamente, o cátodo produz o dobro do ânodo.', hint:'Estequiometria: 2H₂O → 2H₂ + O₂. H₂:O₂ = 2:1.' },
  { q:'O potencial padrão de redução E° é medido em relação ao:', opts:['Eletrodo de cobre padrão','Eletrodo Padrão de Hidrogênio (EPH), com E°=0 V por convenção','Eletrodo de prata-cloreto de prata','Potencial médio de todos os metais'], ans:1, exp:'E° é medido vs. EPH (eletrodo de hidrogênio padrão): Pt | H₂(1 atm) | H⁺(1 mol/L), com E° = 0,000 V por definição. Todos os potenciais são relativos a esse padrão. Metais com E° > 0 são "mais nobres" que H₂.', hint:'EPH é a referência universal: E° = 0 V. Todos os outros são medidos em relação a ele.' }
];

/* -----------------------------------------------------------------------
   render()
----------------------------------------------------------------------- */
export function render(outlet) {
  _cellKey   = 'daniell';
  _electrons = [];
  _ions      = [];
  if (_loop) { _loop.stop(); _loop = null; }
  _exAttempts = 0;
  _exDone     = false;

  outlet.innerHTML = `
<div class="page module-page">

  <button class="module-back btn-ghost" data-nav="/modules">
    &larr; Módulos
  </button>

  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Eletroquímica</h1>
      <p class="module-subtitle">Pilhas, fluxo de elétrons e reações de oxidação-redução.</p>
    </div>
  </header>

  <!-- Fenômeno -->
    <!-- Equação de Nernst -->
  <section class="module-section">
    <h2 class="module-section-title">Equação de Nernst e ΔG = -nFE</h2>
    <p class="module-text"><strong>E = E° - (0,0592/n)·logQ</strong> a 25°C. Quando Q = 1 (condições padrão), E = E°. Quando Q aumenta (produtos acumulam), E decresce. No equilíbrio: E = 0, Q = K. Termodinâmica: <strong>ΔG = -nFE</strong> e ΔG° = -RT·lnK.</p>
    <div style="display:flex;flex-direction:column;gap:.6rem;margin:.75rem 0 1rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">E° célula (V):</label>
        <input type="range" id="nernst-e0" min="0.1" max="3" step="0.01" value="1.1" style="width:140px;accent-color:var(--accent-electron)">
        <span id="nernst-e0-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:55px">1,10 V</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">n (moles de e⁻):</label>
        <input type="range" id="nernst-n" min="1" max="6" step="1" value="2" style="width:140px;accent-color:var(--accent-bond)">
        <span id="nernst-n-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:25px">2</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">log Q (log do quociente):</label>
        <input type="range" id="nernst-q" min="-6" max="6" step="0.1" value="0" style="width:140px;accent-color:var(--accent-organic)">
        <span id="nernst-q-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:100px">Q = 1 (padrão)</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">E real (V)</p><div id="nernst-e" style="font-size:var(--text-2xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">ΔG (kJ/mol)</p><div id="nernst-dg" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">K equilíbrio</p><div id="nernst-k" style="font-size:var(--text-base);font-weight:600;color:var(--accent-bond)">—</div></div>
    </div>
  </section>

  <!-- Corrosão -->
  <section class="module-section">
    <h2 class="module-section-title">Corrosão e proteção catódica</h2>
    <p class="module-text">Corrosão é uma célula eletroquímica involuntária: o ferro (E°= -0,44V) oxida em presença de O₂ e umidade. Reação global: <strong>4Fe + 3O₂ + 6H₂O → 2Fe₂O₃·3H₂O</strong>.</p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Proteção catódica</h3><p style="font-size:var(--text-sm)">Metal ligado ao polo negativo (catodo) — impossibilita oxidação. Dutos subterrâneos, plataformas offshore, cascos de navios.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-bond)">Anodo de sacrifício</h3><p style="font-size:var(--text-sm)">Zn (E°= -0,76V) mais ativo que Fe corrói no lugar do aço. Zinco em cascos de navios e calhas galvanizadas.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Galvanização</h3><p style="font-size:var(--text-sm)">Revestimento de aço com Zn por eletrodeposição ou imersão a quente. Barreira física + proteção catódica.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Par galvânico</h3><p style="font-size:var(--text-sm)">Cu + Al em eletrólito: Al (E°= -1,66V) corrói rapidamente. Evitar metais muito diferentes em contato úmido.</p></div>
    </div>
  </section>

<section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">
      Coloque um prego de zinco em solução de sulfato de cobre: o zinco vai se dissolver e cobre
      metálico vai se depositar sobre o prego. Há transferência de elétrons — uma reação de
      oxirredução. Uma pilha separa essa transferência para canalizar os elétrons por um fio externo,
      produzindo corrente elétrica.
    </p>
    <p class="module-text">
      Oxidação = perda de elétrons (anodo). Redução = ganho de elétrons (catodo).
      Mnemônico: <strong>OILRIG</strong> — Oxidation Is Loss, Reduction Is Gain.
    </p>
  </section>

  <!-- Célula galvânica -->
  <section class="module-section">
    <h2 class="module-section-title">Célula galvânica</h2>

    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
      ${Object.entries(CELLS).map(_r => { const [k, c]=_r; return `
        <button class="btn btn-sm ${k === 'daniell' ? 'btn-secondary' : 'btn-ghost'}"
                id="cell-btn-${k}" data-cellkey="${k}">${esc(c.label)}</button>
      `; }).join('')}
    </div>

    <div class="canvas-frame">
      <canvas id="electro-canvas"></canvas>
    </div>

    <div id="cell-info" style="margin-top:.75rem;font-size:var(--text-sm);color:var(--text-secondary)">
      ${esc(CELLS['daniell'].info)}
    </div>
    <div id="cell-reaction" style="margin-top:.5rem;font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron)">
      ${esc(CELLS['daniell'].reaction)}
    </div>
  </section>


  <!-- Eletrólise -->
  <section class="module-section">
    <h2 class="module-section-title">Eletrólise — Reação não espontânea</h2>
    <p class="module-text">
      Na célula galvânica, a reação espontânea gera corrente. Na <strong>eletrólise</strong>,
      o inverso: usamos corrente elétrica externa para forçar uma reação não espontânea.
      O polo negativo da fonte é o <strong>catodo</strong> (redução); o positivo é o
      <strong>anodo</strong> (oxidação).
    </p>
    <p class="module-text">
      Exemplo clássico: eletrólise da água → 2H₂O → 2H₂ + O₂. 
      No catodo (-): 4H⁺ + 4e⁻ → 2H₂. No anodo (+): 2H₂O → O₂ + 4H⁺ + 4e⁻.
    </p>
    <div class="module-grid" style="grid-template-columns:1fr 1fr">
      <div class="info-card">
        <h3 style="color:var(--accent-electron);margin-top:0">Célula Galvânica</h3>
        <p style="font-size:var(--text-sm)">Reação espontânea gera corrente.<br>ΔG &lt; 0, E°célula &gt; 0.<br>Ex: pilhas, baterias.</p>
      </div>
      <div class="info-card">
        <h3 style="color:var(--accent-bond);margin-top:0">Eletrólise</h3>
        <p style="font-size:var(--text-sm)">Corrente força reação não espontânea.<br>ΔG &gt; 0, exige energia elétrica.<br>Ex: galvanoplastia, alumínio, cloro.</p>
      </div>
    </div>
  </section>

  <!-- Leis de Faraday -->
  <section class="module-section">
    <h2 class="module-section-title">Leis de Faraday — calculadora</h2>
    <p class="module-text">
      As leis de Faraday relacionam a massa de substância depositada/consumida com a carga
      elétrica usada:
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin:.5rem 0 1rem;max-width:420px">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin:0">
        m = (M · I · t) / (n · F)<br>
        <span style="color:var(--text-muted)">M = massa molar | I = corrente (A) | t = tempo (s)<br>n = nº de elétrons | F = 96.485 C/mol</span>
      </p>
    </div>

    <div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:160px;font-size:var(--text-sm);color:var(--text-secondary)">Metal depositado:</label>
        <select id="far-metal" style="background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:.25rem .5rem;font-size:var(--text-sm)">
          <option value="63.55,2">Cobre (Cu²⁺, n=2)</option>
          <option value="107.87,1">Prata (Ag⁺, n=1)</option>
          <option value="26.98,3">Alumínio (Al³⁺, n=3)</option>
          <option value="58.69,2">Níquel (Ni²⁺, n=2)</option>
          <option value="196.97,3">Ouro (Au³⁺, n=3)</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:160px;font-size:var(--text-sm);color:var(--text-secondary)">Corrente I (A):</label>
        <input type="range" id="far-curr" min="0.1" max="20" step="0.1" value="2" style="width:140px;accent-color:var(--accent-electron)">
        <span id="far-curr-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:50px">2,0 A</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:160px;font-size:var(--text-sm);color:var(--text-secondary)">Tempo t (min):</label>
        <input type="range" id="far-time" min="1" max="120" step="1" value="30" style="width:140px;accent-color:var(--accent-bond)">
        <span id="far-time-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:50px">30 min</span>
      </div>
    </div>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Carga total Q</p>
        <div id="far-q" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Massa depositada</p>
        <div id="far-mass" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Moles de elétrons</p>
        <div id="far-mol-e" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
    </div>
  </section>

  <!-- Série eletroquímica e pilha de concentração -->
  <section class="module-section">
    <h2 class="module-section-title">Série eletroquímica e pilha de concentração</h2>
    <p class="module-text">
      A <strong>série eletroquímica</strong> ordena os pares redox por E° (potencial padrão
      vs EHN). Quanto maior E°, maior tendência a reduzir. A diferença entre dois pares
      define o potencial da pilha: E°célula = E°catodo - E°anodo.
    </p>
    <div style="overflow-x:auto;margin-bottom:var(--space-5)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Par redox (semi-reação de redução)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">E° (V)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Agente redox</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['F₂ + 2e⁻ → 2F⁻',              '+2,87','Oxidante mais forte'],
            ['MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺',   '+1,51',''],
            ['Cl₂ + 2e⁻ → 2Cl⁻',             '+1,36',''],
            ['Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺','+1,33',''],
            ['O₂ + 4H⁺ + 4e⁻ → 2H₂O',        '+1,23','Corrosão do Fe'],
            ['Ag⁺ + e⁻ → Ag',                 '+0,80',''],
            ['Fe³⁺ + e⁻ → Fe²⁺',              '+0,77',''],
            ['Cu²⁺ + 2e⁻ → Cu',               '+0,34','Eletrodo positivo pilha Daniell'],
            ['2H⁺ + 2e⁻ → H₂',               ' 0,00','Referência (EHN)'],
            ['Fe²⁺ + 2e⁻ → Fe',               '-0,44','Corrói em contato com Cu'],
            ['Zn²⁺ + 2e⁻ → Zn',               '-0,76','Proteção catódica do Fe'],
            ['Al³⁺ + 3e⁻ → Al',               '-1,66',''],
            ['Mg²⁺ + 2e⁻ → Mg',               '-2,37',''],
            ['Na⁺ + e⁻ → Na',                  '-2,71',''],
            ['Li⁺ + e⁻ → Li',                  '-3,04','Redutor mais forte'],
          ].map(_r => { const [rxn, eo, note]=_r; return `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs);color:var(--accent-electron)">${rxn}</td>
            <td style="padding:.4rem .6rem;font-weight:700;color:${parseFloat(eo)>0?'var(--accent-organic)':parseFloat(eo)<0?'var(--accent-reaction)':'var(--text-muted)'}">${eo}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${note}</td>
          </tr>`; }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Calculadora E°célula -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Calculadora de E°célula
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">E°catodo (V):</span>
        <input type="range" id="ecell-cat" min="-3.1" max="2.9" step="0.01" value="0.34"
               style="width:130px;accent-color:var(--accent-organic)">
        <span id="ecell-cat-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:70px">+0,340 V</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">E°anodo (V):</span>
        <input type="range" id="ecell-ano" min="-3.1" max="2.9" step="0.01" value="-0.76"
               style="width:130px;accent-color:var(--accent-reaction)">
        <span id="ecell-ano-val" style="font-size:var(--text-sm);color:var(--accent-reaction);min-width:70px">-0,760 V</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">n (e⁻ transferidos):</span>
        <input type="range" id="ecell-n" min="1" max="6" step="1" value="2"
               style="width:130px;accent-color:var(--accent-electron)">
        <span id="ecell-n-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:30px">2</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">E°célula</p>
        <div id="ecell-E" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">ΔG° (kJ/mol)</p>
        <div id="ecell-dG" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">K de equilíbrio</p>
        <div id="ecell-K" style="font-size:var(--text-base);font-weight:600;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Espontânea?</p>
        <div id="ecell-spont" style="font-size:var(--text-sm);font-weight:700;color:var(--text-secondary)">—</div>
      </div>
    </div>

    <!-- Pilha de concentração -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:var(--space-6);margin-bottom:var(--space-3)">
      Pilha de concentração
    </h3>
    <p class="module-text">
      Dois eletrodos do mesmo metal em soluções de concentrações diferentes.
      E°célula = 0, mas Nernst gera E ≠ 0: <strong>E = (RT/nF) · ln([alta]/[baixa])</strong>.
      Usada em sensores de pH, eletrodos íon-seletivos e biossensores.
    </p>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">[C₁] — compartimento 1 (mol/L):</span>
        <input type="range" id="cc-c1" min="-4" max="0" step="0.1" value="-2"
               style="width:120px;accent-color:var(--accent-electron)">
        <span id="cc-c1-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:80px">0,0100 M</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">[C₂] — compartimento 2 (mol/L):</span>
        <input type="range" id="cc-c2" min="-4" max="0" step="0.1" value="0"
               style="width:120px;accent-color:var(--accent-bond)">
        <span id="cc-c2-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:80px">1,0000 M</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">E (V) a 25°C, n=1</p>
        <div id="cc-E" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">ln(C₂/C₁)</p>
        <div id="cc-lnQ" style="font-size:var(--text-base);font-weight:600;color:var(--accent-bond)">—</div>
      </div>
    </div>

    <!-- pH-metro -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:var(--space-6);margin-bottom:var(--space-3)">
      pH-metro e eletrodo de vidro
    </h3>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Princípio</h3>
        <p style="font-size:var(--text-sm)">Eletrodo de vidro gera potencial proporcional à atividade de H⁺ na solução: E = const - 0,05916·pH (a 25°C). A membrana de vidro delgada (<0,1mm) é seletivamente permeável a H⁺ — troca catiônica. Impedância alta (10⁸–10¹² Ω) exige amplificador operacional.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Calibração com tampões</h3>
        <p style="font-size:var(--text-sm)">O pH-metro é calibrado com 2–3 soluções tampão padrão (pH 4,00; 7,00; 10,00). A curva de calibração mapeia E_medido → pH. Drift térmico: compensação automática de temperatura (ATC). Slope ideal: 59,16 mV/pH a 25°C.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Eletrodos íon-seletivos (ISE)</h3>
        <p style="font-size:var(--text-sm)">Generalização: membranas com seletividade para F⁻ (fluoreto de lantânio), NO₃⁻, Ca²⁺, K⁺. Usados em análise de água, solos e clínica. Equação de Nikolsky: E = const + (RT/zF)·ln(aᵢ + Kᵢⱼ·aⱼ^(z/zⱼ)).</p>
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

  <!-- Cotidiano -->
  <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">
      Baterias de íon-lítio (smartphones, carros elétricos) são células eletroquímicas recarregáveis.
      A eletrólise é usada para galvanoplastia (cromação, niquelação), purificação de metais e
      produção de cloro e hidrogênio. A corrosão do ferro é um processo eletroquímico espontâneo
      — prevenida com pintura, galvanização ou proteção catódica (aço com zinco).
    </p>
  </div>

</div>
`;

  const canvas = document.getElementById('electro-canvas');
  if (canvas) startCanvas(canvas);

  Object.keys(CELLS).forEach(k => {
    document.getElementById(`cell-btn-${k}`)?.addEventListener('click', () => {
      _cellKey   = k;
      _electrons = [];
      _ions      = [];
      if (_loop) _loop.stop();
      Object.keys(CELLS).forEach(k2 => {
        const btn = document.getElementById(`cell-btn-${k2}`);
        if (btn) btn.className = `btn btn-sm ${k2 === k ? 'btn-secondary' : 'btn-ghost'}`;
      });
      const info = document.getElementById('cell-info');
      const rxEl = document.getElementById('cell-reaction');
      if (info) info.textContent = CELLS[k].info;
      if (rxEl) rxEl.textContent = CELLS[k].reaction;
      const c = document.getElementById('electro-canvas');
      if (c) startCanvas(c);
    });
  });

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
        markSectionDone('electrochemistry', 'exercise');
      } else {
        btn.style.borderColor = 'var(--accent-reaction)';
        btn.style.color       = 'var(--accent-reaction)';
        if (fb && _exAttempts === 1) {
          fb.innerHTML = `<p class="feedback-hint">Dica: o anodo é onde ocorre oxidação (perda de elétrons). Qual metal se oxida mais facilmente — o de potencial de redução mais baixo ou mais alto?</p>`;
        }
      }
    });
  });

// Faraday calculator
  const FARADAY = 96485; // C/mol
  function updateFaraday() {
    const sel  = document.getElementById('far-metal');
    const [M, n] = (sel?.value || '63.55,2').split(',').map(Number);
    const I    = parseFloat(document.getElementById('far-curr')?.value || 2);
    const tMin = parseInt(document.getElementById('far-time')?.value || 30, 10);
    const t    = tMin * 60; // segundos
    const Q    = I * t;
    const molE = Q / FARADAY;
    const mass = (M * I * t) / (n * FARADAY);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('far-q',     Q.toFixed(0) + ' C');
    set('far-mass',  mass.toFixed(3) + ' g');
    set('far-mol-e', molE.toFixed(4) + ' mol');
    set('far-curr-val', I.toFixed(1).replace('.', ',') + ' A');
    set('far-time-val', tMin + ' min');
  }
  updateFaraday();
  document.getElementById('far-metal')?.addEventListener('change', updateFaraday);
  document.getElementById('far-curr')?.addEventListener('input', updateFaraday);
  document.getElementById('far-time')?.addEventListener('input', updateFaraday);

// Nernst equation calculator
  const F = 96485; // C/mol
  function updateNernst() {
    const E0 = parseFloat(document.getElementById('nernst-e0')?.value || 1.1);
    const n  = parseInt(document.getElementById('nernst-n')?.value  || 2, 10);
    const logQ = parseFloat(document.getElementById('nernst-q')?.value || 0);
    const Q = Math.pow(10, logQ);
    const E = E0 - (0.05916 / n) * logQ;  // at 25°C
    const dG = -n * F * E / 1000;          // kJ/mol
    const K = Math.pow(10, n * E0 / 0.05916);
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('nernst-e0-val', E0.toFixed(2).replace('.',',')+' V');
    set('nernst-n-val', n);
    set('nernst-q-val', 'Q = '+Q.toExponential(2)+(logQ===0?' (padrão)':''));
    set('nernst-e', E.toFixed(4).replace('.',',')+' V');
    set('nernst-dg', dG.toFixed(2).replace('.',',')+' kJ/mol');
    set('nernst-k', K.toExponential(3));
    const eEl = document.getElementById('nernst-e');
    if (eEl) eEl.style.color = E > 0 ? 'var(--accent-organic)' : 'var(--accent-reaction)';
  }
  updateNernst();
  ['nernst-e0','nernst-n','nernst-q'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateNernst);
  });
}
function _initEcell() {
  const F = 96485, R = 8.314, T = 298.15;

  function updateEcell() {
    const Ecat = parseFloat(document.getElementById('ecell-cat')?.value ?? 0.34);
    const Eano = parseFloat(document.getElementById('ecell-ano')?.value ?? -0.76);
    const n    = parseInt(document.getElementById('ecell-n')?.value ?? 2, 10);

    const Ecell = Ecat - Eano;
    const dG    = -n * F * Ecell / 1000; // kJ/mol
    const logK  = n * Ecell / 0.05916;
    const K     = Math.pow(10, logK);

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('ecell-cat-val', (Ecat >= 0 ? '+' : '') + Ecat.toFixed(3) + ' V');
    set('ecell-ano-val', (Eano >= 0 ? '+' : '') + Eano.toFixed(3) + ' V');
    set('ecell-n-val',   n);
    set('ecell-E',   (Ecell >= 0 ? '+' : '') + Ecell.toFixed(3) + ' V');
    set('ecell-dG',  dG.toFixed(1) + ' kJ/mol');
    set('ecell-K',   K > 1e6 ? K.toExponential(2) : K.toPrecision(3));

    const spEl = document.getElementById('ecell-spont');
    if (spEl) {
      spEl.textContent  = Ecell > 0 ? 'Sim (E > 0)' : Ecell < 0 ? 'Não (E < 0)' : 'Equilíbrio';
      spEl.style.color  = Ecell > 0 ? 'var(--accent-organic)' : 'var(--accent-reaction)';
    }
  }

  function updateCC() {
    const logC1 = parseFloat(document.getElementById('cc-c1')?.value ?? -2);
    const logC2 = parseFloat(document.getElementById('cc-c2')?.value ?? 0);
    const C1 = Math.pow(10, logC1);
    const C2 = Math.pow(10, logC2);
    const lnQ = Math.log(C2 / C1);
    const E   = (R * T / F) * lnQ;  // n=1

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('cc-c1-val', C1.toFixed(4) + ' M');
    set('cc-c2-val', C2.toFixed(4) + ' M');
    set('cc-lnQ', lnQ.toFixed(3));
    set('cc-E',   (E >= 0 ? '+' : '') + E.toFixed(4) + ' V');
  }

  if (document.getElementById('ecell-cat')) {
    updateEcell();
    ['ecell-cat','ecell-ano','ecell-n'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updateEcell));
  }
  if (document.getElementById('cc-c1')) {
    updateCC();
    ['cc-c1','cc-c2'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updateCC));
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
          markSectionDone('electrochemistry', 'exercise');
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
