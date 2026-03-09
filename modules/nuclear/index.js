/**
 * modules/nuclear/index.js -- Modulo: Quimica Nuclear
 */
import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';
import { SimLoop }         from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

const ISOTOPES = [
  { name:'Carbono-14',   symbol:'14C',  t12:5730,     unit:'anos',  use:'Datação arqueológica (até ~50.000 anos)' },
  { name:'Iodo-131',     symbol:'131I', t12:8.02,     unit:'dias',  use:'Tratamento de câncer de tireoide e diagnóstico' },
  { name:'Urânio-238',   symbol:'238U', t12:4.468e9,  unit:'anos',  use:'Datação geológica; combustível nuclear' },
  { name:'Tecnécio-99m', symbol:'99mTc',t12:6.01,     unit:'horas', use:'Mais usado em medicina nuclear: cintilografia' },
  { name:'Flúor-18',     symbol:'18F',  t12:109.8,    unit:'min',   use:'PET scan (tomografia por emissão de positrons)' },
  { name:'Trítio-3',     symbol:'3H',   t12:12.32,    unit:'anos',  use:'Marcadores isotópicos, relógios radioluminescentes' },
  { name:'Plutônio-239', symbol:'239Pu',t12:24100,    unit:'anos',  use:'Combustível nuclear e armas' },
  { name:'Rádio-226',    symbol:'226Ra',t12:1600,     unit:'anos',  use:'Histórico; atualmente banido para luminescência' },
];

let _loop = null, _isoIdx = 0, _n0 = 100, _exAttempts = 0, _exDone = false;

function startDecayCanvas(el) {
  const frame = el.parentElement;
  const W = Math.min(frame.clientWidth||520, 520), H = 200;
  const dpr = window.devicePixelRatio||1;
  el.width  = Math.round(W*dpr); el.height = Math.round(H*dpr);
  el.style.width = W+'px'; el.style.height = H+'px';
  const ctx = el.getContext('2d'); ctx.scale(dpr, dpr);
  const simT12 = 4.0; // seconds per half-life in simulation
  const lambda = Math.LN2 / simT12;
  let nuclei = Array.from({length: _n0}, () => ({
    x: 30 + Math.random()*(W/2-50), y: 20 + Math.random()*(H-40),
    decayed: false, flash: 0,
  }));
  let elapsed = 0;
  if (_loop) _loop.stop();
  _loop = new SimLoop(dt => {
    clearCanvas(ctx, W, H);
    elapsed += dt;
    ctx.strokeStyle = COLOR.border; ctx.lineWidth=1.2; ctx.strokeRect(18,18,W/2-28,H-36);
    const cX = W/2+8, cW = W/2-20, cH = H-36, cY = 18;
    ctx.strokeRect(cX, cY, cW, cH);
    nuclei.forEach(n => {
      if (!n.decayed && Math.random() < lambda*dt) { n.decayed=true; n.flash=0.4; }
      if (n.flash > 0) { n.flash -= dt; }
      if (!n.decayed) {
        ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI*2);
        ctx.fillStyle = COLOR.electron+'cc'; ctx.fill();
      } else if (n.flash > 0) {
        ctx.beginPath(); ctx.arc(n.x+W/2, n.y, 5, 0, Math.PI*2);
        ctx.fillStyle = COLOR.reaction+Math.round(n.flash/0.4*200).toString(16).padStart(2,'0');
        ctx.fill();
      }
    });
    const remaining = nuclei.filter(n=>!n.decayed).length;
    ctx.fillStyle = COLOR.textMuted; ctx.font='10px sans-serif'; ctx.textAlign='left';
    ctx.fillText('Ativos: '+remaining+'/'+_n0, 22, H-22);
    ctx.fillText('t = '+elapsed.toFixed(1)+'s', 22, H-8);
    // decay curve
    ctx.beginPath();
    for (let i=0; i<=100; i++) {
      const x = cX+(i/100)*cW, y = cY+cH - Math.exp(-lambda*(i/100)*simT12*6)*cH;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.strokeStyle=COLOR.electron; ctx.lineWidth=1.5; ctx.stroke();
    const curX = cX+Math.min(elapsed/(simT12*6),1)*cW;
    const curN = Math.exp(-lambda*elapsed);
    ctx.beginPath(); ctx.arc(curX, cY+cH-curN*cH, 4, 0, Math.PI*2);
    ctx.fillStyle=COLOR.reaction; ctx.fill();
    if (remaining===0 || elapsed > simT12*8) {
      elapsed=0;
      nuclei = Array.from({length:_n0}, () => ({
        x: 30+Math.random()*(W/2-50), y: 20+Math.random()*(H-40), decayed:false, flash:0
      }));
    }
  });
  _loop.start();
}

function calcHalflife() {
  const iso = ISOTOPES[_isoIdx];
  const nHL = parseInt(document.getElementById('hl-n')?.value||1, 10);
  const frac = Math.pow(0.5, nHL);
  const elapsed = nHL * iso.t12;
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set('hl-remaining', (_n0*frac).toFixed(2)+' nucl.');
  set('hl-percent', (frac*100).toFixed(4)+'%');
  set('hl-elapsed', elapsed<1e6 ? elapsed.toFixed(2)+' '+iso.unit : elapsed.toExponential(3)+' '+iso.unit);
  const bar=document.getElementById('hl-bar'); if(bar) bar.style.width=Math.round(frac*220)+'px';
}

const EXERCISE = {
  question: 'Um isótopo com meia-vida de 10 anos tem atividade inicial de 1000 Bq. Qual a atividade após 30 anos?',
  options: ['500 Bq','250 Bq','125 Bq','333 Bq'],
  correct: 2,
  explanation: '30 anos = 3 meias-vidas. A = 1000 × (½)³ = 125 Bq.',
};

export function render(outlet) {
  if (_loop) { _loop.stop(); _loop=null; }
  _isoIdx=0; _n0=100; _exAttempts=0; _exDone=false;

  const isoCanvasBtns = ISOTOPES.map((iso,i) =>
    `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="iso-btn-${i}" data-isoidx="${i}">${iso.symbol}</button>`
  ).join('');
  const isoHlBtns = ISOTOPES.map((iso,i) =>
    `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="hliso-btn-${i}" data-hliso="${i}">${iso.symbol}</button>`
  ).join('');
  const exOpts = EXERCISE.options.map((opt,i) =>
    `<button class="btn btn-ghost" style="text-align:left;justify-content:flex-start" id="ex-opt-${i}" data-exopt="${i}">${esc(opt)}</button>`
  ).join('');

  outlet.innerHTML = `
<div class="page module-page">
  <button class="module-back btn-ghost" data-nav="/modules">&larr; Módulos</button>
  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/>
      </svg>
    </div>
    <div><h1 class="module-title">Química Nuclear</h1>
    <p class="module-subtitle">Radioatividade, meia-vida, fissão, fusão e aplicações.</p></div>
  </header>

  <section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">Núcleos instáveis emitem partículas e energia para atingir configurações estáveis — isso é radioatividade. Becquerel descobriu em 1896 ao deixar urânio sobre chapa fotográfica. A meia-vida (t½) é o tempo para metade dos núcleos decair: de 10⁻¹⁷ s (Be-8) a 4,5×10⁹ anos (U-238).</p>
    <p class="module-text"><strong>N(t) = N₀ × e^(−λt) = N₀ × (½)^(t/t½)</strong>, onde λ = ln2/t½ é a constante de decaimento. A atividade A = λN decresce à mesma taxa.</p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Tipos de radiação</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Alfa (α)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">²²⁶Ra → ²²²Rn + ⁴He</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted)">Carga +2 | 4 u | detida por papel | perigosa se inalada (²²²Rn)</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-electron)">Beta⁻ (β⁻)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">¹⁴C → ¹⁴N + e⁻ + antineutrino</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted)">Carga −1 | nêutron→próton | detida por alumínio | base datação ¹⁴C</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Beta⁺ (β⁺)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">¹⁸F → ¹⁸O + e⁺ + neutrino</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted)">Carga +1 | próton→nêutron | aniquila com e⁻ → 2γ 511 keV | PET scan</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-bond)">Gama (γ)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">⁶⁰Co* → ⁶⁰Co + γ</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted)">Carga 0 | fóton altamente energético | requer chumbo/concreto | radioterapia</p></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Simulação de decaimento</h2>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.75rem">${isoCanvasBtns}</div>
    <div class="canvas-frame"><canvas id="nuclear-canvas"></canvas></div>
    <p id="iso-info" style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.5rem">Carbono-14 | t½ = 5730 anos</p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Calculadora de meia-vida</h2>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem">${isoHlBtns}</div>
    <div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:200px;font-size:var(--text-sm);color:var(--text-secondary)">Núcleos iniciais N₀:</label>
        <input type="range" id="hl-n0" min="10" max="10000" step="10" value="100" style="width:140px;accent-color:var(--accent-electron)">
        <span id="hl-n0-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">100</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:200px;font-size:var(--text-sm);color:var(--text-secondary)">Número de meias-vidas:</label>
        <input type="range" id="hl-n" min="1" max="20" step="1" value="1" style="width:140px;accent-color:var(--accent-reaction)">
        <span id="hl-n-val" style="font-size:var(--text-sm);color:var(--accent-reaction);min-width:30px">1</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
      <div id="hl-bar" style="height:14px;background:var(--accent-electron);border-radius:3px;transition:width .3s;min-width:2px;width:220px"></div>
      <span style="font-size:var(--text-xs);color:var(--text-muted)">fração restante</span>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Núcleos restantes</p><div id="hl-remaining" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">50,00</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Porcentagem</p><div id="hl-percent" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">50,0000%</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Tempo decorrido</p><div id="hl-elapsed" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">5730 anos</div></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Fissão e Fusão</h2>
    <div class="module-grid" style="grid-template-columns:1fr 1fr">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Fissão nuclear</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">²³⁵U + n → ⁹²Kr + ¹⁴¹Ba + 3n + E</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.5rem">Núcleo pesado se divide. Déficit de massa Δm → E = Δmc². Reatores e bombas atômicas. Reação em cadeia: 1 fissão → 3 nêutrons → 3 fissões → 9 nêutrons...</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-electron)">Fusão nuclear</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">²H + ³H → ⁴He + n + 17,6 MeV</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.5rem">Núcleos leves se unem. Fonte do Sol (pp-chain, CNO cycle). Exige T > 10⁷ K. Tokamak ITER (França) em construção para fusão controlada.</p></div>
    </div>
    <p class="module-text" style="margin-top:.75rem">Fe-56 tem a maior energia de ligação por nucleon. Elementos mais pesados liberam energia por fissão; mais leves por fusão.</p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Dose e unidades</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      <div class="info-card"><h3 style="margin-top:0">Becquerel (Bq)</h3><p style="font-size:var(--text-sm)">1 desintegração/s. 1 Ci = 3,7×10¹⁰ Bq.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Gray (Gy)</h3><p style="font-size:var(--text-sm)">Dose absorvida: 1 J/kg de tecido.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Sievert (Sv)</h3><p style="font-size:var(--text-sm)">Sv = Gy × Q. Raios γ: Q=1; partículas α: Q=20.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Referências</h3><p style="font-size:var(--text-sm)">Natural: ~2,4 mSv/ano. Limiar risco: ~100 mSv. Dose letal: ~4–5 Sv.</p></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Exercício</h2>
    <p class="module-text">${esc(EXERCISE.question)}</p>
    <div id="exercise-opts" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">${exOpts}</div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
  </section>

  <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">⁹⁹ᵐTc é usado em 80% dos exames de medicina nuclear. PET com ¹⁸F-FDG detecta tumores. ¹⁴C datou a Mortalha de Turim e os Manuscritos do Mar Morto. Usinas nucleares geram 10% da eletricidade mundial com emissão de CO₂ quase zero durante operação. Radioterapia com γ trata ~50% dos tumores sólidos.</p>
  </div>
</div>
`;

  const canvas = document.getElementById('nuclear-canvas');
  if (canvas) startDecayCanvas(canvas);
  calcHalflife();

  ISOTOPES.forEach((iso, i) => {
    document.getElementById('iso-btn-'+i)?.addEventListener('click', () => {
      _isoIdx=i;
      ISOTOPES.forEach((_,j) => { const b=document.getElementById('iso-btn-'+j); if(b) b.className='btn btn-xs '+(j===i?'btn-secondary':'btn-ghost'); });
      const info=document.getElementById('iso-info'); if(info) info.textContent=iso.name+' | t½ = '+iso.t12+' '+iso.unit;
      if(_loop){_loop.stop();_loop=null;}
      const c=document.getElementById('nuclear-canvas'); if(c) startDecayCanvas(c);
    });
    document.getElementById('hliso-btn-'+i)?.addEventListener('click', () => {
      _isoIdx=i;
      ISOTOPES.forEach((_,j) => { const b=document.getElementById('hliso-btn-'+j); if(b) b.className='btn btn-xs '+(j===i?'btn-secondary':'btn-ghost'); });
      calcHalflife();
    });
  });
  document.getElementById('hl-n0')?.addEventListener('input', e => {
    _n0=parseInt(e.target.value,10); const v=document.getElementById('hl-n0-val'); if(v) v.textContent=_n0; calcHalflife();
  });
  document.getElementById('hl-n')?.addEventListener('input', e => {
    const v=document.getElementById('hl-n-val'); if(v) v.textContent=e.target.value; calcHalflife();
  });
  document.querySelectorAll('[data-exopt]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(_exDone) return; _exAttempts++;
      const choice=parseInt(btn.dataset.exopt,10), fb=document.getElementById('exercise-feedback');
      if(choice===EXERCISE.correct) {
        _exDone=true; btn.style.borderColor='var(--accent-organic)'; btn.style.color='var(--accent-organic)';
        if(fb) fb.innerHTML='<p class="feedback-correct">Correto! '+EXERCISE.explanation+'</p>';
        markSectionDone('nuclear','exercise');
      } else {
        btn.style.borderColor='var(--accent-reaction)'; btn.style.color='var(--accent-reaction)';
        if(fb&&_exAttempts===1) fb.innerHTML='<p class="feedback-hint">Dica: 30 anos = 3 meias-vidas. Aplique (½)³.</p>';
      }
    });
  });
}

export function destroy() { if(_loop){_loop.stop();_loop=null;} }
