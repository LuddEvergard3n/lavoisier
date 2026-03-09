/**
 * modules/analytical/index.js -- Quimica Analitica
 *
 * Cobre:
 *  - Titulacao acido-base: curva pH x volume (canvas)
 *  - Lei de Beer-Lambert: A = epsilon * l * c
 *  - Produto de solubilidade Ksp
 *  - Propriedades coligativas: DeltaTb, DeltaTf, pressao osmotica
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';
import { SimLoop }         from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

const KSP_TABLE = [
  { name:'AgCl',    ksp:1.8e-10,  desc:'Cloreto de prata — precipita em solucoes de Ag+ + Cl-' },
  { name:'BaSO4',   ksp:1.1e-10,  desc:'Sulfato de bario — contraste em raio-X gastrointestinal' },
  { name:'CaCO3',   ksp:3.3e-9,   desc:'Carbonato de calcio — calcario, ossos, conchas' },
  { name:'PbS',     ksp:9.0e-29,  desc:'Sulfeto de chumbo — extremamente insolvel' },
  { name:'Ca3(PO4)2',ksp:2.1e-33, desc:'Fosfato de calcio — mineral dos dentes e ossos (hidroxiapatita)' },
  { name:'Mg(OH)2', ksp:5.6e-12,  desc:'Hidroxido de magnesio — leite de magnesia, antiacido' },
  { name:'Fe(OH)3', ksp:2.8e-39,  desc:'Hidroxido ferrico — precipitado marrom-ferrugem' },
  { name:'CaF2',    ksp:3.5e-11,  desc:'Fluoreto de calcio — fluorita, mineral industrial' },
];

const SOLUTES_COLIG = [
  { name:'NaCl (i=2)',   Kb:0.512, Kf:1.858, i:2, Mw:58.44,  ex:'Sal de cozinha — abaixa ponto de congelamento do gelo' },
  { name:'Glicose (i=1)',Kb:0.512, Kf:1.858, i:1, Mw:180.16, ex:'Nao eletrolito — usado em soros hospitalares' },
  { name:'CaCl2 (i=3)', Kb:0.512, Kf:1.858, i:3, Mw:110.98, ex:'Sal de degelo de estradas (i=3 abaixa mais Tf)' },
  { name:'MgSO4 (i=2)', Kb:0.512, Kf:1.858, i:2, Mw:120.37, ex:'Sal de Epsom — suplemento de magnesio' },
];

let _loop = null, _titVol = 0, _titC = 0.1, _titType = 'strong-strong';
let _beerEps = 1000, _beerL = 1.0, _beerC = 0.001;
let _kspIdx = 0, _kspExtra = 0;
let _coligIdx = 0, _coligM = 1.0;
let _exAttempts = 0, _exDone = false;

/* Canvas: curva de titulacao */
function drawTitration(el) {
  const frame = el.parentElement;
  const W = Math.min(frame.clientWidth||520, 520), H = 240;
  const dpr = window.devicePixelRatio||1;
  el.width  = Math.round(W*dpr); el.height = Math.round(H*dpr);
  el.style.width = W+'px'; el.style.height = H+'px';
  const ctx = el.getContext('2d'); ctx.scale(dpr, dpr);

  function phAt(v) {
    // Simplified strong acid + strong base: HA vol=25mL, C=0.1M; base C=0.1M
    const Va=25, Ca=0.1, Cb=0.1;
    const na = Va*Ca, nb = v*Cb;
    if (Math.abs(na-nb) < 0.001) return 7;
    if (nb < na) {
      const cH = (na-nb)/(Va+v);
      return -Math.log10(cH);
    } else {
      const cOH = (nb-na)/(Va+v);
      return 14 + Math.log10(cOH);
    }
  }

  if (_loop) _loop.stop();
  _loop = new SimLoop(() => {
    clearCanvas(ctx, W, H);
    const padX=40, padY=14, gW=W-padX-16, gH=H-padY*2-20;

    // axes
    ctx.strokeStyle=COLOR.border; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(padX,padY); ctx.lineTo(padX,padY+gH); ctx.lineTo(padX+gW,padY+gH); ctx.stroke();

    // y labels (pH 0-14)
    ctx.fillStyle=COLOR.textMuted; ctx.font='9px sans-serif'; ctx.textAlign='right';
    for (let ph=0; ph<=14; ph+=2) {
      const y = padY + gH - (ph/14)*gH;
      ctx.fillText(ph, padX-4, y+3);
      ctx.strokeStyle=COLOR.border+'44'; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.moveTo(padX,y); ctx.lineTo(padX+gW,y); ctx.stroke();
    }

    // x labels (0-50 mL)
    ctx.fillStyle=COLOR.textMuted; ctx.textAlign='center';
    for (let v=0; v<=50; v+=10) {
      const x = padX + (v/50)*gW;
      ctx.fillText(v, x, padY+gH+12);
    }
    ctx.fillText('Volume titulante (mL)', padX+gW/2, H-2);

    // pH curve
    ctx.beginPath();
    for (let vi=0; vi<=50; vi+=0.25) {
      const x = padX+(vi/50)*gW;
      const ph = Math.max(0, Math.min(14, phAt(vi)));
      const y = padY+gH-(ph/14)*gH;
      vi===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.strokeStyle=COLOR.electron; ctx.lineWidth=2; ctx.stroke();

    // equivalence point
    ctx.strokeStyle=COLOR.reaction; ctx.lineWidth=1.2; ctx.setLineDash([4,3]);
    const eqX = padX+(25/50)*gW;
    ctx.beginPath(); ctx.moveTo(eqX,padY); ctx.lineTo(eqX,padY+gH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=COLOR.reaction; ctx.font='9px sans-serif'; ctx.textAlign='center';
    ctx.fillText('PE', eqX, padY-2);

    // current point
    const curPH = Math.max(0,Math.min(14,phAt(_titVol)));
    const curX = padX+(_titVol/50)*gW;
    const curY = padY+gH-(curPH/14)*gH;
    ctx.beginPath(); ctx.arc(curX,curY,5,0,Math.PI*2);
    ctx.fillStyle=COLOR.bond; ctx.fill();
    ctx.fillStyle=COLOR.bond; ctx.font='bold 10px sans-serif'; ctx.textAlign='left';
    ctx.fillText('pH '+curPH.toFixed(2), curX+8, curY+4);
  });
  _loop.start();
}

function calcBeer() {
  const A = _beerEps * _beerL * _beerC;
  const T = Math.pow(10, -A) * 100;
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('beer-a', A.toFixed(4));
  set('beer-t', T.toFixed(2)+'%');
  const bar=document.getElementById('beer-bar');
  if(bar) bar.style.width=Math.round(Math.max(0,Math.min(1,1-A))*200)+'px';
}

function calcKsp() {
  const s=KSP_TABLE[_kspIdx];
  const ksp=s.ksp;
  // For simple 1:1 salts like AgCl: s = sqrt(Ksp); for others simplified
  const solubility = Math.sqrt(ksp); // simplified
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('ksp-val', ksp.toExponential(2));
  set('ksp-sol', solubility.toExponential(3)+' mol/L');
  set('ksp-desc', s.desc);

  // common ion effect: add extra [Cl-] = _kspExtra
  if (_kspExtra > 0) {
    // [Ag+][Cl-] = Ksp; [Cl-] ~ _kspExtra (excess), so [Ag+] = Ksp/_kspExtra
    const s2 = ksp / (_kspExtra + solubility);
    set('ksp-common', s2.toExponential(3)+' mol/L (efeito de ion comum)');
  } else {
    set('ksp-common', '— (sem ion comum)');
  }
}

function calcColig() {
  const s = SOLUTES_COLIG[_coligIdx];
  const m = _coligM; // molalidade mol/kg
  const Kb = 0.512, Kf = 1.858, R = 0.08206;
  const DTb = s.i * Kb * m;
  const DTf = s.i * Kf * m;
  const rho = 1.0; // kg/L water approximation
  const M_sol = m * s.Mw / 1000; // mol/L approx
  const pi = s.i * M_sol * R * 298; // atm, T=25C
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('colig-dtb', '+'+DTb.toFixed(4)+' °C (PE = '+(100+DTb).toFixed(4)+' °C)');
  set('colig-dtf', '-'+DTf.toFixed(4)+' °C (PF = '+(-DTf).toFixed(4)+' °C)');
  set('colig-pi', pi.toFixed(4)+' atm = '+(pi*101.325).toFixed(2)+' kPa');
}

const EXERCISE = {
  question: 'Num experimento de Beer-Lambert, epsilon=500 L/(mol·cm), l=2 cm, c=0,001 mol/L. Qual a absorbancia A?',
  options: ['A = 1,00','A = 0,50','A = 2,00','A = 0,25'],
  correct: 0,
  explanation: 'A = epsilon × l × c = 500 × 2 × 0,001 = 1,00. A transmitancia correspondente e T = 10^(-1) = 10%.',
};

export function render(outlet) {
  if (_loop) { _loop.stop(); _loop=null; }
  _titVol=0; _beerEps=1000; _beerL=1.0; _beerC=0.001;
  _kspIdx=0; _kspExtra=0; _coligIdx=0; _coligM=1.0;
  _exAttempts=0; _exDone=false;

  const kspBtns = KSP_TABLE.map((s,i) =>
    `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="ksp-btn-${i}" data-kspidx="${i}">${s.name}</button>`
  ).join('');
  const coligBtns = SOLUTES_COLIG.map((s,i) =>
    `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="colig-btn-${i}" data-coligidx="${i}">${s.name}</button>`
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
        <path d="M8 3v6l-4 6h16l-4-6V3"/><path d="M6 3h12"/>
      </svg>
    </div>
    <div><h1 class="module-title">Química Analítica</h1>
    <p class="module-subtitle">Titulação, Beer-Lambert, Ksp e propriedades coligativas.</p></div>
  </header>

  <section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">Química analítica responde a "quanto?" e "o quê?". Uma gota de indicador no ponto de equivalência de uma titulação; a absorbância de uma solução colorida revelando a concentração de hemoglobina no sangue; a quantidade de flúor na água de abastecimento — tudo depende de métodos quantitativos precisos.</p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Titulação ácido-base — curva pH × volume</h2>
    <p class="module-text">Titulação de 25 mL de ácido forte (HCl 0,1 M) com base forte (NaOH 0,1 M). O ponto de equivalência (PE) ocorre a 25 mL — pH = 7 para ácido forte + base forte.</p>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:.75rem">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">Volume adicionado (mL):</label>
      <input type="range" id="tit-vol" min="0" max="50" step="0.5" value="0" style="width:180px;accent-color:var(--accent-electron)">
      <span id="tit-vol-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:55px">0,0 mL</span>
    </div>
    <div class="canvas-frame"><canvas id="tit-canvas"></canvas></div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Lei de Beer-Lambert</h2>
    <p class="module-text">A absorbância de uma solução é proporcional à concentração e ao caminho óptico: <strong>A = ε·l·c</strong>. A transmitância T = 10^(−A). Usada em espectrofotometria para quantificar proteínas, DNA, metais em solução.</p>
    <div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:220px;font-size:var(--text-sm);color:var(--text-secondary)">ε — coef. extinção molar (L/mol·cm):</label>
        <input type="range" id="beer-eps" min="100" max="100000" step="100" value="1000" style="width:140px;accent-color:var(--accent-electron)">
        <span id="beer-eps-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:80px">1000</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:220px;font-size:var(--text-sm);color:var(--text-secondary)">l — caminho óptico (cm):</label>
        <input type="range" id="beer-l" min="0.1" max="10" step="0.1" value="1" style="width:140px;accent-color:var(--accent-bond)">
        <span id="beer-l-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:50px">1,0 cm</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:220px;font-size:var(--text-sm);color:var(--text-secondary)">c — concentração (mol/L):</label>
        <input type="range" id="beer-c" min="0.00001" max="0.01" step="0.00001" value="0.001" style="width:140px;accent-color:var(--accent-organic)">
        <span id="beer-c-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:80px">0,00100 M</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
      <div style="font-size:var(--text-xs);color:var(--text-muted);min-width:80px">Transmitância:</div>
      <div style="width:200px;height:14px;background:linear-gradient(to right,#0d1117,#4fc3f7);border-radius:3px;position:relative">
        <div id="beer-bar" style="height:100%;background:var(--bg-raised);border-right:2px solid var(--accent-electron);border-radius:3px;transition:width .3s;width:100px"></div>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:1fr 1fr">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Absorbância A</p><div id="beer-a" style="font-size:var(--text-2xl);font-weight:700;color:var(--accent-electron)">1,0000</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Transmitância T</p><div id="beer-t" style="font-size:var(--text-2xl);font-weight:700;color:var(--accent-bond)">10,00%</div></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Produto de solubilidade — Ksp</h2>
    <p class="module-text">Para um sal pouco solúvel M_mX_n ⇌ m M^n+ + n X^m−, o Ksp = [M]^m[X]^n no equilíbrio. Ksp menor = menos solúvel. O efeito do íon comum reduz a solubilidade adicionando um dos íons já presentes.</p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem">${kspBtns}</div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Ksp</p><div id="ksp-val" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Solubilidade (1:1)</p><div id="ksp-sol" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div></div>
    </div>
    <p id="ksp-desc" style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.5rem"></p>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-top:.75rem">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">Ion comum extra (mol/L):</label>
      <input type="range" id="ksp-extra" min="0" max="1" step="0.01" value="0" style="width:140px;accent-color:var(--accent-reaction)">
      <span id="ksp-extra-val" style="font-size:var(--text-sm);color:var(--accent-reaction);min-width:60px">0,00</span>
    </div>
    <p id="ksp-common" style="font-size:var(--text-sm);color:var(--accent-bond);margin-top:.5rem"></p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Propriedades coligativas</h2>
    <p class="module-text">Propriedades que dependem apenas do <em>número</em> de partículas de soluto, não da identidade: elevação do ponto de ebulição (ΔTb = Kb·m·i), abaixamento do ponto de fusão (ΔTf = Kf·m·i) e pressão osmótica (π = MRTi). Eletrólitos contam com fator de van't Hoff i.</p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem">${coligBtns}</div>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">Molalidade m (mol/kg H₂O):</label>
      <input type="range" id="colig-m" min="0.1" max="5" step="0.1" value="1" style="width:140px;accent-color:var(--accent-electron)">
      <span id="colig-m-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">1,0 m</span>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Elevação PE (ΔTb)</p><div id="colig-dtb" style="font-size:var(--text-base);font-weight:700;color:var(--accent-reaction)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Abaixamento PF (ΔTf)</p><div id="colig-dtf" style="font-size:var(--text-base);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Pressão osmótica (π)</p><div id="colig-pi" style="font-size:var(--text-base);font-weight:700;color:var(--accent-organic)">—</div></div>
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
    <p class="module-text">Hemograma conta hemoglobina por absorbância a 540 nm. Diálise usa osmose para filtrar ureia do sangue. Sal nas estradas derruba ponto de fusão do gelo para −15°C (CaCl₂, i=3). BaSO₄ é o contraste de raio-X gastrointestinal por ser tão insolúvel (Ksp=1,1×10⁻¹⁰) que não é absorvido pelo organismo.</p>
  </div>
</div>
`;

  const canvas = document.getElementById('tit-canvas');
  if (canvas) drawTitration(canvas);
  calcBeer(); calcKsp(); calcColig();

  document.getElementById('tit-vol')?.addEventListener('input', e => {
    _titVol = parseFloat(e.target.value);
    const v=document.getElementById('tit-vol-val'); if(v) v.textContent=_titVol.toFixed(1).replace('.',',')+' mL';
  });
  document.getElementById('beer-eps')?.addEventListener('input', e => { _beerEps=parseInt(e.target.value,10); const v=document.getElementById('beer-eps-val'); if(v) v.textContent=_beerEps; calcBeer(); });
  document.getElementById('beer-l')?.addEventListener('input', e => { _beerL=parseFloat(e.target.value); const v=document.getElementById('beer-l-val'); if(v) v.textContent=_beerL.toFixed(1).replace('.',',')+' cm'; calcBeer(); });
  document.getElementById('beer-c')?.addEventListener('input', e => { _beerC=parseFloat(e.target.value); const v=document.getElementById('beer-c-val'); if(v) v.textContent=_beerC.toFixed(5)+' M'; calcBeer(); });
  KSP_TABLE.forEach((_,i) => {
    document.getElementById('ksp-btn-'+i)?.addEventListener('click', () => {
      _kspIdx=i; KSP_TABLE.forEach((_,j)=>{const b=document.getElementById('ksp-btn-'+j);if(b) b.className='btn btn-xs '+(j===i?'btn-secondary':'btn-ghost');}); calcKsp();
    });
  });
  document.getElementById('ksp-extra')?.addEventListener('input', e => {
    _kspExtra=parseFloat(e.target.value); const v=document.getElementById('ksp-extra-val'); if(v) v.textContent=_kspExtra.toFixed(2); calcKsp();
  });
  SOLUTES_COLIG.forEach((_,i) => {
    document.getElementById('colig-btn-'+i)?.addEventListener('click', () => {
      _coligIdx=i; SOLUTES_COLIG.forEach((_,j)=>{const b=document.getElementById('colig-btn-'+j);if(b) b.className='btn btn-xs '+(j===i?'btn-secondary':'btn-ghost');}); calcColig();
    });
  });
  document.getElementById('colig-m')?.addEventListener('input', e => {
    _coligM=parseFloat(e.target.value); const v=document.getElementById('colig-m-val'); if(v) v.textContent=_coligM.toFixed(1).replace('.',',')+' m'; calcColig();
  });
  document.querySelectorAll('[data-exopt]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(_exDone) return; _exAttempts++;
      const choice=parseInt(btn.dataset.exopt,10), fb=document.getElementById('exercise-feedback');
      if(choice===EXERCISE.correct) {
        _exDone=true; btn.style.borderColor='var(--accent-organic)'; btn.style.color='var(--accent-organic)';
        if(fb) fb.innerHTML='<p class="feedback-correct">Correto! '+EXERCISE.explanation+'</p>';
        markSectionDone('analytical','exercise');
      } else {
        btn.style.borderColor='var(--accent-reaction)'; btn.style.color='var(--accent-reaction)';
        if(fb&&_exAttempts===1) fb.innerHTML='<p class="feedback-hint">Dica: A = epsilon × l × c. Multiplique os tres valores.</p>';
      }
    });
  });
}

export function destroy() { if(_loop){_loop.stop();_loop=null;} }
