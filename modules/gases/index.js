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

const EXERCISE = {
  question: 'Um gás ideal ocupa 5 L a 2 atm e 300 K. Qual o volume a 1 atm e 600 K (mesmo n)?',
  options: ['5 L', '10 L', '20 L', '2,5 L'],
  correct: 2,
  explanation: 'Lei combinada: V₂ = P₁V₁T₂/(T₁P₂) = 2×5×600/(300×1) = 20 L. Dobrar T dobra V; reduzir P à metade dobra V novamente.',
};

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
    <p class="module-text">O gás ideal ignora volume molecular e interações. Van der Waals corrige: <strong>(P + n²a/V²)(V − nb) = nRT</strong>. Parâmetro <em>a</em>: atração intermolecular; <em>b</em>: volume excluído por mol.</p>
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
    <h2 class="module-section-title">Exercício</h2>
    <p class="module-text">${EXERCISE.question}</p>
    <div id="exercise-opts" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">
      ${EXERCISE.options.map((opt,i) => `<button class="btn btn-ghost" style="text-align:left;justify-content:flex-start" id="ex-opt-${i}" data-exopt="${i}">${opt}</button>`).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
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
}

export function destroy() { if(_loop) { _loop.stop(); _loop=null; } }
