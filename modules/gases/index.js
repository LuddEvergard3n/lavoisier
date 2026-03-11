/**
 * modules/gases/index.js — Módulo: Gases
 * Lavoisier — Laboratório Visual de Química
 *
 * Cobre EM e Superior:
 *  - Teoria cinético-molecular (canvas animado)
 *  - Leis históricas: Boyle, Charles, Gay-Lussac, Avogadro
 *  - Gás ideal PV = nRT (calculadora de 4ª variável)
 *  - Gás real: equação de Van der Waals
 *  - Lei de Dalton das pressões parciais
 *  - Lei de Graham da efusão
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';
import { SimLoop }         from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

const R_ATM = 0.08206;   // L·atm/(mol·K)
const T0    = 273.15;    // K

const VDW = {
  H2:  { a:0.244,   b:0.02661, label:'H₂'  },
  N2:  { a:1.39,    b:0.03913, label:'N₂'  },
  O2:  { a:1.382,   b:0.03186, label:'O₂'  },
  CO2: { a:3.640,   b:0.04267, label:'CO₂' },
  NH3: { a:4.169,   b:0.03707, label:'NH₃' },
  H2O: { a:5.536,   b:0.03049, label:'H₂O' },
  He:  { a:0.03457, b:0.02370, label:'He'  },
  CH4: { a:2.253,   b:0.04278, label:'CH₄' },
};

let _loop = null, _igSolve = 'P', _igP = 1.0, _igV = 22.414, _igN = 1.0, _igT = 273.15;
let _vdwGas = 'CO2', _vdwV = 22.0, _vdwN = 1.0, _vdwT = 300;
let _dalMix = [1.0, 0.5, 0.25], _dalP = 1.0;
let _graM1 = 2.016, _graM2 = 32.0;
let _canvasTemp = 300, _exAttempts = 0, _exDone = false;

/* Canvas KMT */
function startKMTCanvas(canvasEl) {
  const frame = canvasEl.parentElement;
  const W = Math.min(frame.clientWidth || 520, 520), H = 200;
  const dpr = window.devicePixelRatio || 1;
  canvasEl.width  = Math.round(W * dpr); canvasEl.height = Math.round(H * dpr);
  canvasEl.style.width = W + 'px'; canvasEl.style.height = H + 'px';
  const ctx = canvasEl.getContext('2d'); ctx.scale(dpr, dpr);
  const parts = Array.from({length: 45}, () => {
    const spd = 50 + Math.random() * 90, ang = Math.random() * Math.PI * 2;
    return { x: 30 + Math.random()*(W-60), y: 25 + Math.random()*(H-50),
             vx: spd*Math.cos(ang), vy: spd*Math.sin(ang), r: 4 };
  });
  if (_loop) _loop.stop();
  _loop = new SimLoop(dt => {
    clearCanvas(ctx, W, H);
    const mult = _canvasTemp / 300;
    ctx.strokeStyle = COLOR.border; ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 18, W-36, H-36);
    ctx.fillStyle = COLOR.textMuted; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText('T = ' + _canvasTemp + ' K', W-22, 14);
    parts.forEach(p => {
      p.x += p.vx * dt * mult; p.y += p.vy * dt * mult;
      if (p.x < 18+p.r)   { p.x = 18+p.r;   p.vx =  Math.abs(p.vx); }
      if (p.x > W-18-p.r) { p.x = W-18-p.r; p.vx = -Math.abs(p.vx); }
      if (p.y < 18+p.r)   { p.y = 18+p.r;   p.vy =  Math.abs(p.vy); }
      if (p.y > H-18-p.r) { p.y = H-18-p.r; p.vy = -Math.abs(p.vy); }
      const s = Math.hypot(p.vx, p.vy) * mult, hot = Math.min(1, s/200);
      const r = Math.round(79*(1-hot)+239*hot), g = Math.round(162*(1-hot)+71*hot), b = Math.round(219*(1-hot)+111*hot);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fill();
    });
  });
  _loop.start();
}

function calcIdealGas() {
  let result, label, unit, extra = '';
  switch (_igSolve) {
    case 'P': result = (_igN*R_ATM*_igT)/_igV; label='P'; unit='atm'; extra=`(${(result*101.325).toFixed(2)} kPa)`; break;
    case 'V': result = (_igN*R_ATM*_igT)/_igP; label='V'; unit='L'; break;
    case 'n': result = (_igP*_igV)/(R_ATM*_igT); label='n'; unit='mol'; break;
    case 'T': result = (_igP*_igV)/(_igN*R_ATM); label='T'; unit='K'; extra=`(${(result-T0).toFixed(2)} °C)`; break;
  }
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set('ig-result-label', label+' ='); set('ig-result-value', result.toFixed(4));
  set('ig-result-unit', unit); set('ig-result-extra', extra);
}

function calcVdW() {
  const g = VDW[_vdwGas];
  const Pi = (_vdwN*R_ATM*_vdwT)/_vdwV;
  const denom = _vdwV - _vdwN*g.b;
  const Pv = denom > 0 ? (_vdwN*R_ATM*_vdwT)/denom - (_vdwN*_vdwN*g.a)/(_vdwV*_vdwV) : NaN;
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set('vdw-ideal',  isNaN(Pi) ? '—' : Pi.toFixed(4)+' atm');
  set('vdw-real',   isNaN(Pv) ? '—' : Pv.toFixed(4)+' atm');
  set('vdw-diff',   isNaN(Pv)||isNaN(Pi)||Pi===0 ? '—' : ((Pv-Pi)/Pi*100).toFixed(2)+'%');
  set('vdw-a', g.a.toFixed(3)); set('vdw-b', g.b.toFixed(5));
}

function calcDalton() {
  const total = _dalMix.reduce((s,v)=>s+v, 0);
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set('dal-total', total.toFixed(3)+' mol');
  [0,1,2].forEach(i => {
    const frac = total > 0 ? _dalMix[i]/total : 0;
    set(`dal-frac-${i}`, (frac*100).toFixed(1)+'%');
    set(`dal-pp-${i}`, (frac*_dalP).toFixed(4)+' atm');
  });
}

function calcGraham() {
  const ratio = Math.sqrt(_graM2/_graM1);
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set('graham-result', ratio.toFixed(3)+'×');
  set('graham-explain', 'A molécula mais leve (M₁) difunde '+ratio.toFixed(2)+'× mais rápido que a mais pesada.');
}

const EXERCISES = [
  {q:'Um gás ideal ocupa 5 L a 2 atm e 300 K. Qual o volume a 1 atm e 600 K?',opts:['5 L','10 L','20 L','2,5 L'],ans:2,exp:'V₂ = 5 × (2/1) × (600/300) = 20 L.',hint:'P₁V₁/T₁ = P₂V₂/T₂.'},
  {q:'Pressão parcial do N₂ (79%) em ar a P=1 atm:',opts:['0,21 atm','0,79 atm','1 atm','0,50 atm'],ans:1,exp:'P_N₂ = 0,79 × 1 = 0,79 atm (Lei de Dalton).',hint:'P_parcial = fração molar × P_total.'},
  {q:'Gás real a alta pressão — Z = PV/nRT:',opts:['Sempre 1','> 1 (repulsão domina)','< 1 para todos','Independe de P'],ans:1,exp:'Volume excluído pelas moléculas: Z > 1.',hint:'Z=1: ideal. Volume molecular não desprezível eleva Z.'},
  {q:'r(He)/r(N₂) pela Lei de Graham:',opts:['√7 ≈ 2,65','7','1/7','0,38'],ans:0,exp:'r ∝ 1/√M → √(28/4) = √7 ≈ 2,65.',hint:'r ∝ 1/√M.'},
  {q:'Volume molar ideal a STP (0°C, 1 atm):',opts:['22,4 L/mol','24,0 L/mol','11,2 L/mol','44,8 L/mol'],ans:0,exp:'V = nRT/P = 0,08206 × 273,15 = 22,4 L/mol.',hint:'V = nRT/P com T = 273,15 K.'},,
  { q:'1 mol de gás ideal a 25°C (298 K) e 1 atm ocupa:', opts:['22,4 L','24,5 L','22,7 L','25,0 L'], ans:1, exp:'V = nRT/P = 1 × 0,082 × 298 / 1 = 24,4 L ≈ 24,5 L. (22,4 L é o volume a 0°C e 1 atm = CNTP).', hint:'V = nRT/P. R = 0,082 L·atm/(mol·K). T em Kelvin.' },
  { q:'Uma mistura tem N₂ (0,6 atm) e O₂ (0,4 atm). A pressão total e a fração molar de O₂ são:', opts:['1,0 atm; 0,40','0,6 atm; 0,40','1,0 atm; 0,60','0,4 atm; 0,60'], ans:0, exp:'Lei de Dalton: P_total = 0,6 + 0,4 = 1,0 atm. x_O₂ = P_O₂/P_total = 0,4/1,0 = 0,40. Fração molar = pressão parcial / pressão total.', hint:'P_total = ΣP_i (Dalton). x_i = P_i/P_total.' },
  { q:'Um balão a 300 K e 1 atm ocupa 10 L. Resfriado a 150 K a pressão constante, seu volume é:', opts:['20 L','5 L','10 L','1 L'], ans:1, exp:'Lei de Charles: V₁/T₁ = V₂/T₂ a P constante. V₂ = V₁ × T₂/T₁ = 10 × 150/300 = 5 L. Temperatura absoluta (Kelvin) é proporcional ao volume.', hint:'Lei de Charles: V/T = constante (P constante). Usar T em Kelvin!' },
  { q:'Gás real versus gás ideal: o fator de compressibilidade Z = PV/nRT > 1 indica:', opts:['Forças atrativas dominam — V menor que ideal','Forças repulsivas dominam — V maior que ideal','O gás se comporta idealmente','A temperatura está abaixo do ponto de Boyle'], ans:1, exp:'Z > 1: V real > V ideal. As repulsões moleculares (volume excluído, covolume b na Van der Waals) superam as atrações. Comum a alta pressão ou para gases pequenos/não-polares a temperatura moderada.', hint:'Z > 1: repulsão domina (moléculas ocupam espaço físico). Z < 1: atração domina.' },
  { q:'A velocidade mais provável de moléculas de O₂ (M=0,032 kg/mol) a 300 K (R=8,314) é:', opts:['395 m/s','280 m/s','560 m/s','140 m/s'], ans:0, exp:'v_p = √(2RT/M) = √(2 × 8,314 × 300 / 0,032) = √(155887) ≈ 395 m/s.', hint:'v_p = √(2RT/M). R=8,314 J/(mol·K). M em kg/mol. Resultado em m/s.' },
  { q:'A Lei de Graham: uma molécula de H₂ (M=2) efunde __ vezes mais rápido que O₂ (M=32):', opts:['2×','4×','16×','16× mais lento'], ans:1, exp:'v₁/v₂ = √(M₂/M₁) = √(32/2) = √16 = 4. H₂ efunde 4 vezes mais rápido que O₂. Usado na separação de isótopos (U²³⁵F₆ / U²³⁸F₆ por efusão).', hint:'Razão de velocidades = raiz quadrada da razão inversa das massas molares.' },
  { q:'Num cilindro a 10 atm e 300 K contendo 5 mol de gás ideal, qual o volume? (R=0,082)', opts:['12,3 L','123 L','1,23 L','24,6 L'], ans:0, exp:'V = nRT/P = 5 × 0,082 × 300 / 10 = 123/10 = 12,3 L.', hint:'V = nRT/P.' },
  { q:'A equação de Van der Waals (P + a/V²)(V - b) = RT corrige o gás ideal introduzindo:', opts:['a: volume molecular; b: atração intermolecular','a: atração intermolecular (reduz P efetiva); b: volume excluído (reduz V livre)','a e b são desprezíveis a baixa pressão (correto)','a: temperatura crítica; b: pressão crítica'], ans:1, exp:'Termo a/V²: atração entre moléculas reduz a pressão efetiva sobre as paredes (P_real < P_ideal). Termo b: volume excluído pelas moléculas reais reduz o volume livre. Para gás ideal: a=b=0.', hint:'a corrige a pressão (atração). b corrige o volume (tamanho molecular).' },
  { q:'O gás carbônico (CO₂) é mais solúvel em água que N₂ porque:', opts:['CO₂ tem massa molar maior','CO₂ reage com H₂O (CO₂ + H₂O ⇌ H₂CO₃) além de se dissolver fisicamente','N₂ tem menor ponto de ebulição','CO₂ é mais pesado e sedimenta'], ans:1, exp:'CO₂ não apenas dissolve fisicamente (Lei de Henry) mas também reage: CO₂ + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻. Essa reação "consome" o CO₂ dissolvido, deslocando o equilíbrio de dissolução para mais CO₂ entrar. N₂ não reage com água.', hint:'CO₂ reage com água formando ácido carbônico — aumenta a solubilidade efetiva.' },
  { q:'Na lei PV = nRT, se P dobra e T dobra, V:', opts:['Dobra','Fica igual (P e T se compensam)','Quadruplica','Cai à metade'], ans:1, exp:'PV = nRT → V = nRT/P. Se P→2P e T→2T: V_novo = nR(2T)/(2P) = nRT/P = V. Dobrar P e dobrar T se cancela: V não muda.', hint:'V = nRT/P. Analise o efeito de cada variável.' }
];
let _exIdx = 0;

// Dados VdW para calculadora de Z (a em L²·atm/mol², b em L/mol)
const VDW_Z = [
  { label: 'N₂',  a: 1.408,  b: 0.03913 },
  { label: 'CO₂', a: 3.640,  b: 0.04267 },
  { label: 'H₂',  a: 0.2453, b: 0.02651 },
  { label: 'NH₃', a: 4.225,  b: 0.03707 },
  { label: 'He',  a: 0.03457,b: 0.02370 },
];
let _zGasIdx = 0, _zP = 50, _zT = 300;

function calcZ() {
  const R = 0.08206; // L·atm/(mol·K)
  const gas = VDW_Z[_zGasIdx];
  const a = gas.a, b = gas.b;

  // Resolver VdW cubica em V por Newton-Raphson
  // P = RT/(V-b) - a/V² → f(V) = PV³ - (Pb+RT)V² + aV - ab = 0
  const P = _zP, T = _zT;
  const RT = R * T;
  let V = RT / P; // chute inicial: ideal
  for (let i = 0; i < 50; i++) {
    const fv  =  P*V*V*V - (P*b + RT)*V*V + a*V - a*b;
    const dfv =  3*P*V*V - 2*(P*b + RT)*V + a;
    const dV  = fv / dfv;
    V -= dV;
    if (Math.abs(dV) < 1e-9) break;
    if (V <= b) { V = b * 1.01; }
  }
  const Vid = RT / P;
  const Z   = P * V / (R * T);

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('z-P-val', _zP + ' atm');
  set('z-T-val', _zT + ' K');
  set('z-val',   Z.toFixed(4));
  set('z-V',     V.toFixed(4));
  set('z-Vid',   Vid.toFixed(4));
  set('z-regime',
    Math.abs(Z - 1) < 0.01 ? 'Ideal (Z ≈ 1)' :
    Z < 1 ? 'Atração domina (Z < 1)' : 'Repulsão domina (Z > 1)'
  );
  const zEl = document.getElementById('z-val');
  if (zEl) zEl.style.color = Z < 0.99 ? 'var(--accent-electron)' : Z > 1.01 ? 'var(--accent-reaction)' : 'var(--accent-organic)';
}

export function render(outlet) {
  if (_loop) { _loop.stop(); _loop = null; }
  _igSolve='P'; _igP=1.0; _igV=22.414; _igN=1.0; _igT=273.15;
  _vdwGas='CO2'; _vdwV=22.0; _vdwN=1.0; _vdwT=300;
  _dalMix=[1.0,0.5,0.25]; _dalP=1.0; _graM1=2.016; _graM2=32.0;
  _canvasTemp=300; _exAttempts=0; _exDone=false;

  const vdwBtns = Object.entries(VDW).map(([k,v]) =>
    `<button class="btn btn-xs ${k==='CO2'?'btn-secondary':'btn-ghost'}" id="vdw-btn-${k}" data-vdwgas="${k}">${v.label}</button>`
  ).join('');

  const dalRows = ['N₂','O₂','Ar'].map((nm,i) => `
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:.6rem">
      <label style="min-width:36px;font-family:monospace;font-size:var(--text-sm);color:var(--text-secondary)">${nm}:</label>
      <input type="range" id="dal-mol-${i}" min="0" max="3" step="0.1" value="${[1.0,0.5,0.25][i]}" style="width:130px;accent-color:var(--accent-electron)">
      <span id="dal-mol-val-${i}" style="min-width:50px;font-size:var(--text-sm);color:var(--text-secondary)">${[1.0,0.5,0.25][i].toFixed(1)} mol</span>
      <span style="font-size:var(--text-xs);color:var(--text-muted)">x = <b id="dal-frac-${i}">—</b></span>
      <span style="font-size:var(--text-xs);color:var(--text-muted)">Pp = <b id="dal-pp-${i}">—</b></span>
    </div>`).join('');

  outlet.innerHTML = `
<div class="page module-page">
  <button class="module-back btn-ghost" data-nav="/modules">&larr; Módulos</button>
  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/><path d="M8 12c0-2.5 2-4 4-4s4 1.5 4 4-2 4-4 4-4-1.5-4-4"/>
      </svg>
    </div>
    <div><h1 class="module-title">Gases</h1>
    <p class="module-subtitle">Teoria cinético-molecular, gases ideais e reais, Dalton e Graham.</p></div>
  </header>

  <section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">Pneus murcham no frio, balões incham com calor, panelas de pressão cozinham mais rápido. As leis dos gases descrevem as relações entre pressão (P), volume (V), temperatura (T) e quantidade (n).</p>
    <p class="module-text">A <strong>teoria cinético-molecular</strong> explica o comportamento macroscópico em termos microscópicos: moléculas em movimento aleatório colidem com as paredes, gerando pressão. Temperatura é energia cinética média das moléculas: Ec = ³⁄₂ kT.</p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Simulação cinético-molecular</h2>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:.75rem">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">Temperatura:</label>
      <input type="range" id="kmt-temp" min="100" max="1200" step="50" value="300" style="width:160px;accent-color:var(--accent-electron)">
      <span id="kmt-temp-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:55px">300 K</span>
    </div>
    <div class="canvas-frame"><canvas id="kmt-canvas"></canvas></div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Leis históricas</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-electron)">Boyle (1662)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">PV = cte (T,n fixos)</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted)">Mergulhadores: bolhas crescem ao subir pois P diminui.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-bond)">Charles (1787)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">V/T = cte (P,n fixos)</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted)">Balonismo: ar aquecido expande → sobe.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Gay-Lussac (1809)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">P/T = cte (V,n fixos)</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted)">Aerossóis não devem ser aquecidos: P aumenta até explodir.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Avogadro (1811)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">V/n = cte (T,P fixos)</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted)">1 mol de gás ideal = 22,414 L a 0°C e 1 atm (CNTP).</p></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Gás ideal — PV = nRT</h2>
    <p class="module-text">Selecione a variável a calcular, ajuste as outras três. R = 0,08206 L·atm/(mol·K).</p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem">
      ${['P','V','n','T'].map(v => `<button class="btn btn-sm ${v==='P'?'btn-secondary':'btn-ghost'}" id="ig-solve-${v}" data-igsolve="${v}">Calcular ${v==='P'?'P (atm)':v==='V'?'V (L)':v==='n'?'n (mol)':'T (K)'}</button>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem;margin-bottom:1.25rem">
      ${['P','V','n','T'].map(v => `<div style="display:flex;flex-direction:column;gap:.3rem">
        <label style="font-size:var(--text-sm);color:var(--text-secondary)">${v==='P'?'Pressão P (atm)':v==='V'?'Volume V (L)':v==='n'?'Moles n (mol)':'Temperatura T (K)'}:</label>
        <input type="number" id="ig-${v}" value="${v==='P'?1:v==='V'?22.414:v==='n'?1:273.15}" min="0.001" step="${v==='T'?10:0.1}" style="background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:.35rem .6rem;font-size:var(--text-sm)"></div>`).join('')}
    </div>
    <div class="info-card" style="max-width:300px;background:var(--bg-raised)">
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Resultado</p>
      <div style="display:flex;align-items:baseline;gap:.5rem">
        <span id="ig-result-label" style="color:var(--text-muted)">P =</span>
        <span id="ig-result-value" style="font-size:var(--text-2xl);font-weight:700;color:var(--accent-electron)">1.0000</span>
        <span id="ig-result-unit" style="color:var(--text-muted)">atm</span>
      </div>
      <p id="ig-result-extra" style="font-size:var(--text-xs);color:var(--text-muted);margin:.2rem 0 0"></p>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Gás real — Van der Waals</h2>
    <p class="module-text">O gás ideal ignora volume molecular e interações. Van der Waals corrige: <strong>(P + n²a/V²)(V - nb) = nRT</strong>. Parâmetro <em>a</em>: atração intermolecular; <em>b</em>: volume excluído por mol.</p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem">${vdwBtns}</div>
    <div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:80px;font-size:var(--text-sm);color:var(--text-secondary)">V (L):</label>
        <input type="range" id="vdw-v" min="1" max="100" step="0.5" value="22" style="width:130px;accent-color:var(--accent-electron)">
        <span id="vdw-v-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:55px">22,0 L</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:80px;font-size:var(--text-sm);color:var(--text-secondary)">n (mol):</label>
        <input type="range" id="vdw-n" min="0.1" max="5" step="0.1" value="1" style="width:130px;accent-color:var(--accent-bond)">
        <span id="vdw-n-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:55px">1,0 mol</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:80px;font-size:var(--text-sm);color:var(--text-secondary)">T (K):</label>
        <input type="range" id="vdw-t" min="200" max="1000" step="10" value="300" style="width:130px;accent-color:var(--accent-organic)">
        <span id="vdw-t-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:55px">300 K</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">P ideal</p><div id="vdw-ideal" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">P real (VdW)</p><div id="vdw-real" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Desvio</p><div id="vdw-diff" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-reaction)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">a (L²atm/mol²)</p><div id="vdw-a" style="font-size:var(--text-base);font-weight:600">3.640</div><p style="font-size:var(--text-xs);color:var(--text-muted);margin:.3rem 0 .2rem">b (L/mol)</p><div id="vdw-b" style="font-size:var(--text-base);font-weight:600">0.04267</div></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Dalton — Pressões parciais</h2>
    <p class="module-text">Em misturas de gases ideais: <strong>P_total = Σ x_i · P_total</strong>, onde x_i = fração molar do componente i. O ar atmosférico é ~78% N₂, ~21% O₂, ~1% Ar.</p>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:.75rem">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">P total (atm):</label>
      <input type="range" id="dal-ptotal" min="0.1" max="5" step="0.1" value="1" style="width:130px;accent-color:var(--accent-electron)">
      <span id="dal-ptotal-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:50px">1,0 atm</span>
    </div>
    ${dalRows}
    <div class="info-card" style="max-width:200px"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Total molar</p><div id="dal-total" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">1,750 mol</div></div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Graham — Efusão e difusão</h2>
    <p class="module-text">Moléculas mais leves se movem mais rápido. <strong>v₁/v₂ = √(M₂/M₁)</strong>. Aplicação: separação isotópica de ²³⁵UF₆ e ²³⁸UF₆ por efusão em cascata (Projeto Manhattan).</p>
    <div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">M₁ — massa molar gás 1 (g/mol):</label>
        <input type="range" id="gra-m1" min="1" max="200" step="1" value="2" style="width:130px;accent-color:var(--accent-electron)">
        <span id="gra-m1-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:80px">2 g/mol</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">M₂ — massa molar gás 2 (g/mol):</label>
        <input type="range" id="gra-m2" min="1" max="200" step="1" value="32" style="width:130px;accent-color:var(--accent-bond)">
        <span id="gra-m2-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:80px">32 g/mol</span>
      </div>
    </div>
    <div class="info-card" style="max-width:320px">
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">v₁ / v₂</p>
      <span id="graham-result" style="font-size:var(--text-2xl);font-weight:700;color:var(--accent-electron)">4,000×</span>
      <p id="graham-explain" style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.4rem"></p>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/5)</h2>
    <p class="module-text" id="ex-question">${EXERCISES[0].q}</p>
    <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">
      ${EXERCISES[0].opts.map((opt,i) => `<button class="btn btn-ghost" style="text-align:left;justify-content:flex-start" data-exopt="${i}">${opt}</button>`).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next" style="margin-top:1rem;display:none">Próximo exercício &#8594;</button>
  </section>

  <!-- Fator de compressibilidade e gases reais avançado -->
  <section class="module-section">
    <h2 class="module-section-title">Fator de compressibilidade Z</h2>
    <p class="module-text">
      O <strong>fator de compressibilidade</strong> Z = PV/(nRT) mede o desvio do comportamento ideal.
      Z = 1 → gás ideal. Z &lt; 1 → forças atrativas dominam (comprime mais que o ideal).
      Z &gt; 1 → repulsão de volume dominante (expande mais). A temperaturas altas e baixas pressões,
      Z → 1 para todos os gases.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.4rem">
        Z = PV / nRT &nbsp;|&nbsp; Z = 1 + B/V + C/V² + … (equação do virial)
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        B = segundo coeficiente do virial (depende de T; B &lt; 0 → atração; B &gt; 0 → repulsão)<br>
        Temperatura de Boyle: T onde B = 0 → gás comporta-se como ideal (Z ≈ 1 em baixas P)<br>
        Para N₂: T_Boyle ≈ 327 K; para CO₂: T_Boyle ≈ 710 K
      </p>
    </div>

    <!-- Calculadora Z via Van der Waals -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Calculadora de Z (Van der Waals)
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">Pressão P (atm):</span>
        <input type="range" id="z-P" min="1" max="500" step="1" value="50"
               style="width:130px;accent-color:var(--accent-electron)">
        <span id="z-P-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">50 atm</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">Temperatura T (K):</span>
        <input type="range" id="z-T" min="100" max="1000" step="10" value="300"
               style="width:130px;accent-color:var(--accent-bond)">
        <span id="z-T-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:60px">300 K</span>
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.3rem" id="z-gas-btns">
        ${['N₂','CO₂','H₂','NH₃','He'].map((g,i)=>`<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" data-zgas="${i}">${g}</button>`).join('')}
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Z</p>
        <div id="z-val" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">V (VdW, L/mol)</p>
        <div id="z-V" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">V_ideal (L/mol)</p>
        <div id="z-Vid" style="font-size:var(--text-base);font-weight:600;color:var(--text-secondary)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Regime</p>
        <div id="z-regime" style="font-size:var(--text-sm);font-weight:600;color:var(--accent-organic)">—</div>
      </div>
    </div>

    <!-- Estados correspondentes -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:var(--space-6);margin-bottom:var(--space-3)">
      Lei dos estados correspondentes
    </h3>
    <p class="module-text">
      Gases reais se comportam de forma similar quando comparados em <strong>propriedades
      reduzidas</strong>: T_r = T/T_c, P_r = P/P_c, V_r = V/V_c. Nessas variáveis, o
      diagrama Z(P_r) é <strong>universal</strong> — independe do gás. Isso permite estimar Z
      para qualquer gás a partir de suas propriedades críticas.
    </p>
    <div style="overflow-x:auto;margin-bottom:var(--space-4)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Gás</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">T_c (K)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">P_c (atm)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Z_c</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">T_Boyle (K)</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['He',  5.2,  2.24, 0.302, '~25'],
            ['H₂',  33.2, 12.8, 0.305, '~327'],
            ['N₂',  126,  33.5, 0.290, '~327'],
            ['O₂',  154,  50.1, 0.288, '~405'],
            ['CO₂', 304,  72.8, 0.274, '~710'],
            ['NH₃', 406,  111,  0.242, '~995'],
            ['H₂O', 647,  218,  0.230, '~1550'],
          ].map(([g,tc,pc,zc,tb])=>`
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;font-weight:600;color:var(--accent-electron)">${g}</td>
            <td style="padding:.4rem .6rem">${tc}</td>
            <td style="padding:.4rem .6rem">${pc}</td>
            <td style="padding:.4rem .6rem;color:var(--accent-organic)">${zc}</td>
            <td style="padding:.4rem .6rem;color:var(--text-muted)">${tb}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Z &lt; 1: atração domina</h3>
        <p style="font-size:var(--text-sm)">T moderada, P alta. As forças atrativas entre moléculas puxam umas para as outras → volume menor que o ideal. Ex: CO₂ a 200 atm e 300 K (Z ≈ 0,8).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Z &gt; 1: repulsão domina</h3>
        <p style="font-size:var(--text-sm)">T muito alta ou P extrema. O volume excluído pelas moléculas (parâmetro b) impede compressão — volume maior que o ideal. Ex: H₂ quase sempre (T_Boyle baixa).</p>
      </div>
    </div>
  </section>

    <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">Submarinos comprimem ar a 200 atm em cilindros. Airbags usam decomposição de NaN₃ para gerar N₂ em milissegundos. Refinarias separam O₂ por PSA (pressão oscilante) explorando adsorção diferencial. A separação isotópica do urânio enriquecido usa efusão de UF₆ em cascata de milhares de estágios.</p>
  </div>
</div>
`;

  const canvas = document.getElementById('kmt-canvas');
  if (canvas) startKMTCanvas(canvas);
  calcIdealGas(); calcVdW(); calcDalton(); calcGraham();
  calcZ();
  document.getElementById('z-P')?.addEventListener('input', e => {
    _zP = parseInt(e.target.value, 10); calcZ();
  });
  document.getElementById('z-T')?.addEventListener('input', e => {
    _zT = parseInt(e.target.value, 10); calcZ();
  });
  document.getElementById('z-gas-btns')?.querySelectorAll('[data-zgas]').forEach(btn => {
    btn.addEventListener('click', () => {
      _zGasIdx = parseInt(btn.dataset.zgas, 10);
      document.getElementById('z-gas-btns').querySelectorAll('[data-zgas]').forEach(b => {
        b.className = 'btn btn-xs ' + (parseInt(b.dataset.zgas,10) === _zGasIdx ? 'btn-secondary' : 'btn-ghost');
      });
      calcZ();
    });
  });


  document.getElementById('kmt-temp')?.addEventListener('input', e => {
    _canvasTemp = parseInt(e.target.value, 10);
    const v = document.getElementById('kmt-temp-val'); if(v) v.textContent = _canvasTemp + ' K';
  });
  ['P','V','n','T'].forEach(v => {
    document.getElementById('ig-solve-'+v)?.addEventListener('click', () => {
      _igSolve = v;
      ['P','V','n','T'].forEach(v2 => { const btn=document.getElementById('ig-solve-'+v2); if(btn) btn.className='btn btn-sm '+(v2===v?'btn-secondary':'btn-ghost'); });
      calcIdealGas();
    });
    document.getElementById('ig-'+v)?.addEventListener('input', e => {
      const val = parseFloat(e.target.value);
      if(!isNaN(val) && val > 0) {
        if(v==='P') _igP=val; else if(v==='V') _igV=val; else if(v==='n') _igN=val; else _igT=val;
        calcIdealGas();
      }
    });
  });
  Object.keys(VDW).forEach(k => {
    document.getElementById('vdw-btn-'+k)?.addEventListener('click', () => {
      _vdwGas = k;
      Object.keys(VDW).forEach(k2 => { const btn=document.getElementById('vdw-btn-'+k2); if(btn) btn.className='btn btn-xs '+(k2===k?'btn-secondary':'btn-ghost'); });
      calcVdW();
    });
  });
  document.getElementById('vdw-v')?.addEventListener('input', e => { _vdwV=parseFloat(e.target.value); const v=document.getElementById('vdw-v-val'); if(v) v.textContent=_vdwV.toFixed(1).replace('.',',')+' L'; calcVdW(); });
  document.getElementById('vdw-n')?.addEventListener('input', e => { _vdwN=parseFloat(e.target.value); const v=document.getElementById('vdw-n-val'); if(v) v.textContent=_vdwN.toFixed(1).replace('.',',')+' mol'; calcVdW(); });
  document.getElementById('vdw-t')?.addEventListener('input', e => { _vdwT=parseInt(e.target.value,10); const v=document.getElementById('vdw-t-val'); if(v) v.textContent=_vdwT+' K'; calcVdW(); });
  document.getElementById('dal-ptotal')?.addEventListener('input', e => { _dalP=parseFloat(e.target.value); const v=document.getElementById('dal-ptotal-val'); if(v) v.textContent=_dalP.toFixed(1).replace('.',',')+' atm'; calcDalton(); });
  [0,1,2].forEach(i => {
    document.getElementById('dal-mol-'+i)?.addEventListener('input', e => {
      _dalMix[i]=parseFloat(e.target.value); const v=document.getElementById('dal-mol-val-'+i); if(v) v.textContent=_dalMix[i].toFixed(1)+' mol'; calcDalton();
    });
  });
  document.getElementById('gra-m1')?.addEventListener('input', e => { _graM1=parseInt(e.target.value,10); const v=document.getElementById('gra-m1-val'); if(v) v.textContent=_graM1+' g/mol'; calcGraham(); });
  document.getElementById('gra-m2')?.addEventListener('input', e => { _graM2=parseInt(e.target.value,10); const v=document.getElementById('gra-m2-val'); if(v) v.textContent=_graM2+' g/mol'; calcGraham(); });

  document.querySelectorAll('[data-exopt]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(_exDone) return; _exAttempts++;
      const choice=parseInt(btn.dataset.exopt,10), fb=document.getElementById('exercise-feedback');
      if(choice===EXERCISE.correct) {
        _exDone=true; btn.style.borderColor='var(--accent-organic)'; btn.style.color='var(--accent-organic)';
        if(fb) fb.innerHTML='<p class="feedback-correct">Correto! '+EXERCISE.explanation+'</p>';
        markSectionDone('gases','exercise');
      } else {
        btn.style.borderColor='var(--accent-reaction)'; btn.style.color='var(--accent-reaction)';
        if(fb&&_exAttempts===1) fb.innerHTML='<p class="feedback-hint">Dica: use P₁V₁/T₁ = P₂V₂/T₂. Isole V₂.</p>';
      }
    });
  });

  function loadExercise(idx) {
    const ex = EXERCISES[idx]; if (!ex) return;
    _exAttempts = 0; _exDone = false;
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
    optsEl.innerHTML = ex.opts.map((opt,i)=>
      `<button class="btn btn-ghost" style="text-align:left;justify-content:flex-start" data-exopt="${i}">${esc(opt)}</button>`
    ).join('');
    optsEl.querySelectorAll('[data-exopt]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if (_exDone) return;
        _exAttempts++;
        const choice = parseInt(btn.dataset.exopt, 10);
        const fb2 = document.getElementById('exercise-feedback');
        if (choice===ex.ans) {
          _exDone=true;
          btn.style.borderColor='var(--accent-organic)';
          btn.style.color='var(--accent-organic)';
          if (fb2) fb2.innerHTML=`<p class="feedback-correct">Correto! ${esc(ex.exp)}</p>`;
          markSectionDone('gases','exercise');
          const nxBtn=document.getElementById('ex-next');
          if (nxBtn && idx<EXERCISES.length-1) nxBtn.style.display='inline-flex';
        } else {
          btn.style.borderColor='var(--accent-reaction)';
          btn.style.color='var(--accent-reaction)';
          if (fb2 && _exAttempts===1) fb2.innerHTML=`<p class="feedback-hint">Dica: ${esc(ex.hint)}</p>`;
        }
      });
    });
  }
  loadExercise(0);
  document.getElementById('ex-next')?.addEventListener('click', ()=>{
    _exIdx=Math.min(_exIdx+1, EXERCISES.length-1);
    loadExercise(_exIdx);
  });
}

export function destroy() { if(_loop) { _loop.stop(); _loop=null; } }
