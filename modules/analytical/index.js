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
let _exIdx     = 0;
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

const EXERCISES = [
  { q: 'ε=500 L/(mol·cm), l=2 cm, c=0,001 mol/L. Absorbância A?', opts: ['0,5','1,0','2,0','0,25'], ans: 1, exp: 'A = ε×l×c = 500×2×0,001 = 1,0.', hint: 'A = ε l c (Lei de Beer-Lambert).' },
  { q: 'Técnica mais adequada para separar aminoácidos com alta sensibilidade:', opts: ['CG','CLAE fase reversa com UV','Extração líquido-líquido','Destilação fracionada'], ans: 1, exp: 'Aminoácidos não são voláteis (inviabiliza CG). CLAE fase reversa (C18) + detector UV é o padrão.', hint: 'CG requer volatilidade. Aminoácidos são polares e não voláteis.' },
  { q: 'LOD pelo critério IUPAC é:', opts: ['Sinal = 10×ruído','3σ_branco / S','Precisão de 1%','Sinal mínimo do instrumento'], ans: 1, exp: 'LOD = 3σ_branco/S. LOQ = 10σ/S. σ = desvio padrão do branco, S = sensibilidade.', hint: 'IUPAC usa 3 desvios padrão do branco.' },
  { q: 'Na titulação de Ca²⁺ com EDTA, o EBT (Eriochrome Black T) vira de:', opts: ['Azul→vermelho','Vermelho→azul no ponto de equivalência','Incolor→roxo','Amarelo→laranja'], ans: 1, exp: 'EBT-Ca²⁺ = vermelho. No ponto de equivalência, EDTA remove Ca²⁺ do indicador → EBT livre = azul.', hint: 'Antes do ponto: EBT ligado ao metal (vermelho). Após: EBT livre (qual cor?).' },
  { q: 'Por que ICP-MS tem LOD menor que ICP-OES?', opts: ['Temperatura mais alta','Separa íons por m/z com contagem individual — sem fundo óptico','Usa argônio mais puro','Analisa sólidos sem digestão'], ans: 1, exp: 'ICP-OES detecta emissão óptica competindo com fundo. ICP-MS conta íons individuais por m/z, alcançando LOD sub-ppt.', hint: 'OES detecta fótons em competição. MS conta íons individualmente.' },,
  { q:'Uma solução tem absorbância A=0,60 em cubeta de 1 cm com ε=1500 L/(mol·cm). Qual a concentração? (Beer-Lambert: A=εlc)', opts:['4×10⁻⁴ mol/L','9×10⁻⁴ mol/L','4×10⁻³ mol/L','0,60 mol/L'], ans:0, exp:'c = A/(ε×l) = 0,60/(1500×1) = 4×10⁻⁴ mol/L.', hint:'A = ε × l × c. Isola c: c = A/(ε×l).' },
  { q:'O limite de detecção (LOD) é definido como o sinal correspondente a:', opts:['10× o desvio padrão do branco','3× o desvio padrão do ruído de fundo (IUPAC)','1× o sinal do branco','A menor concentração no padrão'], ans:1, exp:'LOD (IUPAC) = 3σ (3 desvios-padrão do ruído/branco). LOQ (limite de quantificação) = 10σ. Abaixo do LOD, o sinal não é distinguível do ruído com >99% de confiança.', hint:'LOD = 3σ (detecta). LOQ = 10σ (quantifica com precisão).' },
  { q:'Na titulação de 25 mL de NaOH com HCl 0,1 mol/L, o volume no ponto de equivalência é 20 mL. A concentração do NaOH é:', opts:['0,08 mol/L','0,10 mol/L','0,125 mol/L','0,05 mol/L'], ans:0, exp:'Na ponto equivalente: n(NaOH) = n(HCl). C(NaOH)×0,025 = 0,1×0,020. C(NaOH) = 0,002/0,025 = 0,08 mol/L.', hint:'Ponto de equivalência: n_ácido = n_base. CV=CV.' },
  { q:'Na cromatografia, o fator de retenção k' = (tR - t₀)/t₀. Um analito eluiu em 12 min com t₀ = 3 min. k' = ?', opts:['3,0','4,0','9,0','0,25'], ans:0, exp:'k' = (12 - 3)/3 = 9/3 = 3,0. k' = 0 significa que o analito não interage com a fase estacionária (eluiu junto com o solvente).', hint:'k' = (tR - t0)/t0. tR = tempo de retenção; t0 = tempo morto.' },
  { q:'O Ksp do AgCl é 1,8×10⁻¹⁰. A solubilidade molar do AgCl em água pura é:', opts:['1,8×10⁻¹⁰ mol/L','1,3×10⁻⁵ mol/L','3,6×10⁻¹⁰ mol/L','9×10⁻⁶ mol/L'], ans:1, exp:'AgCl ⇌ Ag⁺ + Cl⁻. Ksp = s² = 1,8×10⁻¹⁰. s = √(1,8×10⁻¹⁰) ≈ 1,34×10⁻⁵ mol/L.', hint:'AgCl → s mol/L de Ag⁺ e s mol/L de Cl⁻. Ksp = s×s = s².' },
  { q:'O indicador fenolftaleína muda de cor de incolor para rosa em pH:', opts:['4-6','7','8,2-10,0','12-14'], ans:2, exp:'Fenolftaleína: incolor (forma ácida HIn) abaixo de pH 8,2; rosa/magenta (forma básica In⁻) acima de 10,0. Transição em 8,2-10. Ideal para neutralizações com ponto de equivalência em pH > 7 (bases fortes + ácidos fracos).', hint:'Fenolftaleína: cor muda em pH alcalino (~8-10). Azul de bromotimol: pH 6-7,6.' },
  { q:'A espectrometria de massa mede:', opts:['A absorção de luz UV pelos compostos','A razão massa/carga (m/z) dos fragmentos iônicos da molécula','A fluorescência dos analitos','A condutividade iônica da solução'], ans:1, exp:'Em MS: a molécula é ionizada e fragmentada. O espectrômetro separa os íons por m/z. O pico de maior m/z geralmente é o íon molecular M⁺ (massa molar). Os fragmentos informam a estrutura. Combinar MS com RMN e IV identifica completamente moléculas desconhecidas.', hint:'MS: mede m/z. IV: grupos funcionais. RMN: conectividade carbono-hidrogênio.' },
  { q:'Na CLAE (HPLC) de fase reversa, qual solvente eluirá um analito apolar mais rapidamente?', opts:['Água pura (mais polar, maior força)','Acetonitrila 90%/água 10% (mais apolar, elui apolares mais rápido)','Qualquer solvente — fase reversa não depende da polaridade','Metanol 10%/água 90%'], ans:1, exp:'HPLC fase reversa: fase estacionária apolar (C18). Analitos apolares têm mais afinidade pela fase estacionária → maiores tempos de retenção. Para eluí-los rapidamente, usa-se solvente mais apolar (acetonitrila alta concentração), que compete com a fase estacionária.', hint:'Fase reversa: estacionária apolar. Apolar elui com solvente apolar. Polar elui com água.' },
  { q:'Qual validação analítica verifica que o método mede apenas o que se propõe a medir?', opts:['Precisão','Seletividade/especificidade','Linearidade','Robustez'], ans:1, exp:'Seletividade: o método deve medir o analito sem interferência de matriz, impurezas ou outros compostos presentes. Precisão = reprodutibilidade. Linearidade = proporcionalidade sinal×concentração. Robustez = resistência a pequenas variações de parâmetros.', hint:'Seletividade: "mede só o que deve medir". Precisão: "mede com reprodutibilidade".' },
  { q:'A desvantagem do método das adições de padrão em relação à curva de calibração externa é:', opts:['É mais preciso','Requer múltiplas alíquotas da amostra e é mais trabalhoso, mas compensa efeito de matriz','Não corrige o efeito de matriz','É só para amostras sólidas'], ans:1, exp:'Adições de padrão: adiciona quantidades conhecidas do analito à própria amostra → compensa o efeito de matriz (supressão/aumento de sinal pela amostra real). Desvantagem: precisa de mais preparo. Vantagem: resultado mais exato quando a matriz interfere.', hint:'Adição de padrão: mais trabalho, mas compensa efeito de matriz. Curva externa: simples, mas pressupõe que a matriz não interfere.' }
];

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
  const exOpts = EXERCISES[0].opts.map((opt,i) =>
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
    <p class="module-text">A absorbância de uma solução é proporcional à concentração e ao caminho óptico: <strong>A = ε·l·c</strong>. A transmitância T = 10^(-A). Usada em espectrofotometria para quantificar proteínas, DNA, metais em solução.</p>
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
    <p class="module-text">Para um sal pouco solúvel M_mX_n ⇌ m M^n+ + n X^m-, o Ksp = [M]^m[X]^n no equilíbrio. Ksp menor = menos solúvel. O efeito do íon comum reduz a solubilidade adicionando um dos íons já presentes.</p>
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

  <!-- Ksp formal: Qion, precipitação, dissolução por pH -->
  <section class="module-section">
    <h2 class="module-section-title">Ksp — Produto iônico Q e dissolução por pH</h2>
    <p class="module-text">
      Comparar o <strong>produto iônico Q</strong> com Ksp decide o que ocorre:
      Q &lt; Ksp → solução insaturada (dissolve mais sólido).
      Q = Ksp → equilíbrio (saturado).
      Q &gt; Ksp → precipitação espontânea.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.4rem">
        AgCl ⇌ Ag⁺ + Cl⁻ &nbsp;|&nbsp; Ksp = [Ag⁺][Cl⁻] = 1,8 × 10⁻¹⁰
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Solubilidade molar s: Ksp = s² → s = √Ksp (para sal 1:1 sem íon comum)<br>
        Com íon comum [Cl⁻] = C₀ extra: s = Ksp / (s + C₀) ≈ Ksp / C₀ (para C₀ >> s)<br>
        Dissolução por pH: Mg(OH)₂ ⇌ Mg²⁺ + 2 OH⁻ → acidificar consome OH⁻ → dissolve mais
      </p>
    </div>

    <!-- Calculadora Q vs Ksp -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Produto iônico Q vs Ksp — precipita?
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">log Ksp:</span>
        <input type="range" id="qksp-logKsp" min="-18" max="-2" step="0.5" value="-10"
               style="width:130px;accent-color:var(--accent-electron)">
        <span id="qksp-logKsp-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:80px">1,0×10⁻¹⁰</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">[M⁺] (mol/L):</span>
        <input type="range" id="qksp-cM" min="-6" max="0" step="0.1" value="-3"
               style="width:130px;accent-color:var(--accent-bond)">
        <span id="qksp-cM-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:80px">1,0×10⁻³</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">[X⁻] (mol/L):</span>
        <input type="range" id="qksp-cX" min="-6" max="0" step="0.1" value="-3"
               style="width:130px;accent-color:var(--accent-organic)">
        <span id="qksp-cX-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:80px">1,0×10⁻³</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Q = [M⁺][X⁻]</p>
        <div id="qksp-Q" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Ksp</p>
        <div id="qksp-Ksp" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Resultado</p>
        <div id="qksp-result" style="font-size:var(--text-sm);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">s molar (sem íon comum)</p>
        <div id="qksp-s" style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary)">—</div>
      </div>
    </div>
  </section>

  <!-- Propriedades coligativas: osmometria + crioscopia formal -->
  <section class="module-section">
    <h2 class="module-section-title">Coligativas — Osmometria e determinação de Massa Molar</h2>
    <p class="module-text">
      A pressão osmótica é a propriedade coligativa mais sensível — usada para determinar a
      massa molar de macromoléculas (proteínas, polímeros) porque π é detectável mesmo para
      concentrações mínimas. A crioscopia é usada para anticongelantes; a ebuloscopia, para
      soluções concentradas de açúcar.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        π = i·M·R·T &nbsp;&nbsp;|&nbsp;&nbsp; M = m_soluto / (Mm · V_solução)
      </p>
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-bond);margin-bottom:.3rem">
        ΔTf = i · Kf · m &nbsp;&nbsp;|&nbsp;&nbsp; ΔTb = i · Kb · m
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Kf(H₂O) = 1,86 K·kg/mol &nbsp;|&nbsp; Kb(H₂O) = 0,512 K·kg/mol<br>
        R = 0,08206 L·atm/(mol·K) &nbsp;|&nbsp; Isolando Mm: M = π/(iRT) → Mm = m_soluto/(M·V)
      </p>
    </div>

    <!-- Calculadora: medir Mm por osmometria -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Osmometria — calcular Massa Molar
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">Massa de soluto (g):</span>
        <input type="range" id="osm-mass" min="0.01" max="10" step="0.01" value="1.0"
               style="width:120px;accent-color:var(--accent-electron)">
        <span id="osm-mass-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">1,0 g</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">Volume da solução (mL):</span>
        <input type="range" id="osm-vol" min="10" max="1000" step="10" value="100"
               style="width:120px;accent-color:var(--accent-bond)">
        <span id="osm-vol-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:60px">100 mL</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">π medido (atm):</span>
        <input type="range" id="osm-pi" min="0.001" max="5" step="0.001" value="0.124"
               style="width:120px;accent-color:var(--accent-organic)">
        <span id="osm-pi-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:70px">0,124 atm</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">T (K):</span>
        <input type="range" id="osm-T" min="273" max="373" step="1" value="298"
               style="width:120px;accent-color:var(--accent-reaction)">
        <span id="osm-T-val" style="font-size:var(--text-sm);color:var(--accent-reaction);min-width:60px">298 K</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">M (mol/L)</p>
        <div id="osm-M" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Mm calculada (g/mol)</p>
        <div id="osm-Mm" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">ΔTf (K) — m=Mm/kg</p>
        <div id="osm-dTf" style="font-size:var(--text-base);font-weight:600;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">ΔTb (K)</p>
        <div id="osm-dTb" style="font-size:var(--text-base);font-weight:600;color:var(--accent-reaction)">—</div>
      </div>
    </div>
    <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--space-3)">
      Exemplo de uso: solução com 1,0 g de proteína em 100 mL, π = 0,124 atm a 298 K →
      M = 0,124/(0,08206×298) ≈ 5,06×10⁻³ mol/L → Mm = 1,0/(5,06×10⁻³×0,1) ≈ 1976 g/mol.
    </p>
  </section>


  <!-- Estatística analítica -->
  <section class="module-section">
    <h2 class="module-section-title">Estatística analítica — incertezas e validação</h2>
    <p class="module-text">
      Todo resultado analítico deve ser acompanhado da incerteza. Erros <strong>sistemáticos</strong>
      (viés, bias) afetam a exatidão — corrigidos por calibração. Erros <strong>aleatórios</strong>
      (ruído) afetam a precisão — reduzidos por replicatas.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr));margin-bottom:var(--space-5)">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Média e desvio padrão</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">x̄ = Σxᵢ/n &nbsp;|&nbsp; s = √[Σ(xᵢ-x̄)²/(n-1)]</p>
        <p style="font-size:var(--text-sm)">s estima σ da população. RSD (%) = (s/x̄)×100 = coeficiente de variação. Aceita-se RSD &lt;1% para análise química quantitativa.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Intervalo de confiança</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">IC = x̄ ± t(α,n-1) · s/√n</p>
        <p style="font-size:var(--text-sm)">t de Student para n-1 graus de liberdade. 95%IC: t(95%,3)=3,18; t(95%,9)=2,26; t(95%,∞)=1,96. Maior n → IC menor.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Propagação de incerteza</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">u(y) = √Σ(∂y/∂xᵢ · u(xᵢ))²</p>
        <p style="font-size:var(--text-sm)">Soma/subtração: adicionam-se incertezas absolutas em quadratura. Produto/divisão: adicionam-se incertezas relativas. Ex: C = m/(Mm·V) → u(C)/C = √[(u(m)/m)² + (u(V)/V)²].</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Teste t de Student</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">t_calc = |x̄ - μ| / (s/√n)</p>
        <p style="font-size:var(--text-sm)">Compara média experimental com valor aceito (μ). Se t_calc &gt; t_tabela → diferença significativa (hipótese nula rejeitada). Usado para detectar erro sistemático.</p>
      </div>
    </div>

    <!-- Calculadora de estatística -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Calculadora de estatística para triplicata
    </h3>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:var(--space-4)">
      ${[1,2,3,4,5].map(i=>`
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:60px">x${i}:</span>
        <input type="number" id="stat-x${i}" value="${[10.12,10.08,10.15,0,0][i-1]}" step="0.001"
               style="width:100px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-default);border-radius:var(--radius-sm);padding:.25rem .5rem;font-size:var(--text-sm)">
        <span style="font-size:var(--text-xs);color:var(--text-muted)">(deixe 0 para ignorar)</span>
      </div>`).join('')}
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-top:.3rem">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:130px">Valor aceito μ:</span>
        <input type="number" id="stat-mu" value="10.10" step="0.001"
               style="width:100px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-default);border-radius:var(--radius-sm);padding:.25rem .5rem;font-size:var(--text-sm)">
      </div>
      <button class="btn btn-sm btn-secondary" id="stat-calc-btn" style="margin-top:.5rem;width:fit-content">Calcular</button>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Média x̄</p><div id="stat-mean" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">s (desvio padrão)</p><div id="stat-s" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">RSD (%)</p><div id="stat-rsd" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-organic)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">IC 95%</p><div id="stat-ic" style="font-size:var(--text-base);font-weight:600;color:var(--accent-reaction)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">t_calc</p><div id="stat-t" style="font-size:var(--text-lg);font-weight:700;color:var(--text-secondary)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Erro sistemático?</p><div id="stat-bias" style="font-size:var(--text-sm);font-weight:700;color:var(--text-secondary)">—</div></div>
    </div>
  </section>

  <!-- Cromatografia -->
  <section class="module-section">
    <h2 class="module-section-title">Cromatografia — princípios e técnicas</h2>
    <p class="module-text">
      Cromatografia separa componentes de uma mistura baseada em sua partição entre fase
      estacionária (FE) e fase móvel (FM). Componentes mais retidos pela FE eluem mais tarde.
      Quantidade: fator de retenção k = (t_R - t_M)/t_M.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        N = (t_R/σ)² = 16(t_R/W)² &nbsp;&nbsp;|&nbsp;&nbsp; Rs = 2(t_R2-t_R1)/(W₁+W₂) &nbsp;&nbsp;|&nbsp;&nbsp; H = L/N
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        N = número de pratos teóricos (eficiência). Rs = resolução (≥1,5 para separação completa).<br>
        H = HETP (altura equivalente a um prato teórico). Menor H = coluna mais eficiente.<br>
        Van Deemter: H = A + B/u + Cu (u = velocidade da FM)
      </p>
    </div>
    <div style="overflow-x:auto;margin-bottom:var(--space-4)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Técnica</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">FM</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">FE</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Detecção</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Aplicações típicas</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['CCD/TLC','Solvente (polaridade crescente)','Sílica gel / alumina (placa)','Rf = d_composto/d_solvente','Triagem rápida, Rf, pureza'],
            ['CG (GC)','Gás inerte (He, N₂)','Líquido em suporte / WCOT','TCD, FID, MS','Voláteis, aromas, biodiesel, álcoois'],
            ['HPLC','Solvente líquido (gradiente)','Sílica C18 / fase reversa','UV-Vis, DAD, RI, MS','Fármacos, aminoácidos, pesticidas'],
            ['CLAE-MS','Solvente / amortecedor','C18 fase reversa','Espectrômetro de massa (ESI, APCI)','Proteínas, metabolômica'],
            ['Iônica (IC)','Solução tampão aquosa','Resina trocadora de íons','Condutividade','Ânions/cátions em água'],
            ['Exclusão por tamanho (GPC)','Solvente orgânico/aquoso','Partículas porosas (poros calibrados)','RI, UV','Massa molar de polímeros (Mn, Mw)'],
          ].map(_r => { const [t,fm,fe,det,app]=_r; return `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-weight:700;color:var(--accent-electron)">${t}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">${fm}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">${fe}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--accent-bond)">${det}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${app}</td>
          </tr>`; }).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- Complexometria EDTA -->
  <section class="module-section">
    <h2 class="module-section-title">Complexometria — titulação com EDTA</h2>
    <p class="module-text">
      EDTA (ácido etilenodiaminotetracético, H₄Y) é um ligante hexadentado que forma
      complexos 1:1 extremamente estáveis com íons metálicos. Amplamente usado para
      determinação de dureza da água (Ca²⁺ + Mg²⁺) e metais pesados.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        M^n+ + Y⁴⁻ → [MY]^(n-4) &nbsp;&nbsp;|&nbsp;&nbsp; K_f = [MY] / ([M][Y])
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        K_f efetivo = K_f · α_Y(pH): quanto maior o pH, maior a fração Y⁴⁻ livre → maior K_f efetivo<br>
        Indicador: Eriochrome Black T (EBT): vinho com M²⁺ → azul no ponto de equivalência (pH 10)<br>
        Dureza: 1 grau alemão (°dH) = 10 mg CaCO₃/L; dureza total = [Ca²⁺] + [Mg²⁺] em mmol/L
      </p>
    </div>
    <div style="overflow-x:auto;margin-bottom:var(--space-4)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Íon</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">log K_f</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">pH ótimo</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Indicador</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['Ca²⁺',  '10,69', '10–12', 'EBT, murexida'],
            ['Mg²⁺',  '8,69',  '10',    'EBT'],
            ['Fe³⁺',  '25,10', '2',     'Ácido sulfossalicílico'],
            ['Zn²⁺',  '16,50', '5–6',   'EBT, xilenol laranja'],
            ['Cu²⁺',  '18,80', '3–4',   'PAN, murexida'],
            ['Pb²⁺',  '18,04', '4–5',   'Xilenol laranja'],
            ['Ni²⁺',  '18,62', '4',     'Murexida'],
          ].map(_r => { const [ion,logK,pH,ind]=_r; return `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;font-weight:700;color:var(--accent-electron)">${ion}</td>
            <td style="padding:.4rem .6rem;color:var(--accent-organic)">${logK}</td>
            <td style="padding:.4rem .6rem;color:var(--accent-bond)">${pH}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${ind}</td>
          </tr>`; }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Calculadora EDTA: dureza -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Calculadora de dureza total da água
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">C_EDTA (mol/L):</span>
        <input type="range" id="edta-C" min="0.001" max="0.1" step="0.001" value="0.01"
               style="width:120px;accent-color:var(--accent-electron)">
        <span id="edta-C-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:80px">0,0100 M</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">V_EDTA no PE (mL):</span>
        <input type="range" id="edta-V" min="0.1" max="50" step="0.1" value="15.6"
               style="width:120px;accent-color:var(--accent-bond)">
        <span id="edta-V-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:70px">15,6 mL</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">V_amostra (mL):</span>
        <input type="range" id="edta-Va" min="10" max="200" step="1" value="100"
               style="width:120px;accent-color:var(--accent-organic)">
        <span id="edta-Va-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:60px">100 mL</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">n_EDTA (mmol)</p><div id="edta-n" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Dureza total (mmol/L)</p><div id="edta-dur" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">CaCO₃ equiv. (mg/L)</p><div id="edta-caco3" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-organic)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Dureza (°dH)</p><div id="edta-dH" style="font-size:var(--text-base);font-weight:600;color:var(--text-secondary)">—</div></div>
    </div>
  </section>


  <!-- AAS e ICP -->
  <section class="module-section">
    <h2 class="module-section-title">Espectroscopia de absorção atômica (AAS) e ICP-OES</h2>
    <p class="module-text">
      A <strong>absorção atômica (AAS)</strong> mede a absorção de radiação por átomos livres
      na fase gasosa. Cada elemento tem linhas de absorção únicas (fingerprint atômico).
      Altamente seletiva e sensível — detecta metais traço em μg/L (ppb) a ng/L (ppt).
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        A = log(I₀/I) = ε · b · c &nbsp;&nbsp;(Beer-Lambert para átomos)
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Fonte de radiação: lâmpada de cátodo oco (HCL) específica para cada elemento — emite a linha ressonante.<br>
        Atomizador: converte a amostra em átomos livres. Dois tipos principais: chama e forno de grafite (GFAAS).<br>
        Detector: fotomultiplicador (PMT) ou CCD. Modulação AC elimina emissão do atomizador (chopper).
      </p>
    </div>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));margin-bottom:var(--space-5)">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">AAS em chama (FAAS)</h3>
        <p style="font-size:var(--text-sm)">Nebulizador injeta aerossol na chama ar-acetileno (2300°C) ou N₂O-acetileno (2950°C). N₂O necessário para elementos refratários (Al, V, Ti, W). LOD: 1–50 μg/L. Vazão: 3–5 mL/min de amostra. Rápido mas menos sensível que GFAAS.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">GFAAS — forno de grafite</h3>
        <p style="font-size:var(--text-sm)">3 etapas: secagem (110°C, 20s) → pirólise (400–1400°C, elimina matriz) → atomização (1700–2700°C, 3–5s). Volume: 10–50 μL. LOD: 0,01–1 μg/L. 10–100× mais sensível que FAAS. Modificadores de matriz (Pd(NO₃)₂ + Mg(NO₃)₂) estabilizam analito.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">ICP-OES</h3>
        <p style="font-size:var(--text-sm)">Plasma de argônio induzido por acoplamento capacitivo (6000–10000 K). Ioniza e excita todos os elementos simultaneamente. Detecção: emissão de cada elemento em λ característico. LOD: 0,1–10 μg/L. Multielementar (50+ elementos em 1 análise). Mais robusto que AAS para matrizes complexas.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">ICP-MS</h3>
        <p style="font-size:var(--text-sm)">ICP acoplado a espectrômetro de massas (quadrupolo, setor magnético ou TOF). Separa íons por m/z. LOD: 0,001–0,1 μg/L (sub-ppt). Isótopos: quantificação absoluta por diluição isotópica. Interferências: isobáricas (⁵⁶Fe e ⁴⁰Ar¹⁶O) → modo de colisão/reação (KED).</p>
      </div>
    </div>

    <div style="overflow-x:auto;margin-bottom:var(--space-4)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Técnica</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">LOD típico</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Elementos/análise</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Custo relativo</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Aplicação típica</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['FAAS',   '1–50 μg/L',   '1 por vez',  'Baixo',      'Rotina de metais em água, alimentos'],
            ['GFAAS',  '0,01–1 μg/L', '1 por vez',  'Médio',      'Metais traço em sangue, urina, solos'],
            ['ICP-OES','0,1–10 μg/L', '50+ por vez','Médio-alto', 'Análise ambiental, geoquímica, aço'],
            ['ICP-MS', '0,001–0,1 μg/L','50+ + isót.','Alto',     'Raros, Pb em criança, diluição isotópica'],
            ['XRF',    '1–100 mg/kg', '50+ sólidos','Médio',      'Análise de sólidos sem digestão'],
          ].map(([t,lod,el,c,app]) => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-weight:700;color:var(--accent-electron)">${t}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs);color:var(--accent-organic)">${lod}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">${el}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${c}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${app}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- Calculadora de LOQ / curva de calibração -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Limite de detecção e quantificação
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">Desvio padrão do branco s_b (absorbância):</span>
        <input type="range" id="aas-sb" min="0.0001" max="0.01" step="0.0001" value="0.002"
               style="width:120px;accent-color:var(--accent-electron)">
        <span id="aas-sb-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:70px">0,0020</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">Sensibilidade S (L/mg = absorbância por mg/L):</span>
        <input type="range" id="aas-sens" min="0.001" max="1.0" step="0.001" value="0.1"
               style="width:120px;accent-color:var(--accent-bond)">
        <span id="aas-sens-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:60px">0,100</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">LOD (3s/S)</p><div id="aas-lod" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">LOQ (10s/S)</p><div id="aas-loq" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Sensi. caract. (μg/mL)</p><div id="aas-charac" style="font-size:var(--text-base);font-weight:600;color:var(--accent-organic)">—</div></div>
    </div>
  </section>


  <section class="module-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/5)</h2>
    <p class="module-text">${esc(EXERCISES[0].q)}</p>
    <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">${exOpts}</div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next" style="margin-top:1rem;display:none">Próximo exercício &#8594;</button>
  </section>

  <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">Hemograma conta hemoglobina por absorbância a 540 nm. Diálise usa osmose para filtrar ureia do sangue. Sal nas estradas derruba ponto de fusão do gelo para -15°C (CaCl₂, i=3). BaSO₄ é o contraste de raio-X gastrointestinal por ser tão insolúvel (Ksp=1,1×10⁻¹⁰) que não é absorvido pelo organismo.</p>
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
          markSectionDone('analytical', 'exercise');
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
  });
  _initQKsp();
  _initOsmometry();
  _initStatistics();
  _initAAS();
  _initEDTA();
}

function _initQKsp() {
  function updateQKsp() {
    const logKsp = parseFloat(document.getElementById('qksp-logKsp')?.value ?? -10);
    const logCM  = parseFloat(document.getElementById('qksp-cM')?.value ?? -3);
    const logCX  = parseFloat(document.getElementById('qksp-cX')?.value ?? -3);
    const Ksp = Math.pow(10, logKsp);
    const cM  = Math.pow(10, logCM);
    const cX  = Math.pow(10, logCX);
    const Q   = cM * cX;
    const s   = Math.sqrt(Ksp);

    const fmt = v => v < 0.001 ? v.toExponential(2) : v.toPrecision(3);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('qksp-logKsp-val', fmt(Ksp));
    set('qksp-cM-val',     fmt(cM));
    set('qksp-cX-val',     fmt(cX));
    set('qksp-Q',    fmt(Q));
    set('qksp-Ksp',  fmt(Ksp));
    set('qksp-s',    fmt(s) + ' mol/L');

    const res = document.getElementById('qksp-result');
    if (res) {
      if (Math.abs(Q - Ksp) / Ksp < 0.01) {
        res.textContent = 'Q = Ksp — equilíbrio';
        res.style.color = 'var(--accent-organic)';
      } else if (Q < Ksp) {
        res.textContent = 'Q < Ksp — dissolve';
        res.style.color = 'var(--accent-electron)';
      } else {
        res.textContent = 'Q > Ksp — precipita!';
        res.style.color = 'var(--accent-reaction)';
      }
    }
  }
  if (document.getElementById('qksp-logKsp')) {
    updateQKsp();
    ['qksp-logKsp','qksp-cM','qksp-cX'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updateQKsp));
  }
}

function _initOsmometry() {
  const R = 0.08206, Kf = 1.86, Kb = 0.512;
  function updateOsm() {
    const mass = parseFloat(document.getElementById('osm-mass')?.value ?? 1.0);
    const vol  = parseFloat(document.getElementById('osm-vol')?.value  ?? 100) / 1000; // L
    const pi   = parseFloat(document.getElementById('osm-pi')?.value   ?? 0.124);
    const T    = parseFloat(document.getElementById('osm-T')?.value    ?? 298);

    const M    = pi / (R * T);            // mol/L
    const Mm   = mass / (M * vol);        // g/mol
    const m_mol= M * vol / (0.100);       // molalidade aproximada (solvente = vol-tiny)
    const dTf  = Kf * m_mol;
    const dTb  = Kb * m_mol;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('osm-mass-val', mass.toFixed(2) + ' g');
    set('osm-vol-val',  (vol * 1000).toFixed(0) + ' mL');
    set('osm-pi-val',   pi.toFixed(3) + ' atm');
    set('osm-T-val',    T.toFixed(0) + ' K');
    set('osm-M',   M < 0.001 ? M.toExponential(3) : M.toFixed(5));
    set('osm-Mm',  Mm < 10000 ? Mm.toFixed(1) : Mm.toExponential(3));
    set('osm-dTf', dTf.toFixed(4) + ' K');
    set('osm-dTb', dTb.toFixed(4) + ' K');
  }
  if (document.getElementById('osm-mass')) {
    updateOsm();
    ['osm-mass','osm-vol','osm-pi','osm-T'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updateOsm));
  }
}

function _initStatistics() {
  // t-table 95%: index = n-1 (graus de liberdade)
  const T_TABLE = [12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228];

  function calc() {
    const vals = [1,2,3,4,5].map(i => {
      const v = parseFloat(document.getElementById('stat-x'+i)?.value ?? 0);
      return v;
    }).filter(v => v !== 0);
    const mu = parseFloat(document.getElementById('stat-mu')?.value ?? 10.1);

    if (vals.length < 2) return;
    const n    = vals.length;
    const mean = vals.reduce((a,b) => a+b, 0) / n;
    const s2   = vals.reduce((a,v) => a + (v-mean)**2, 0) / (n-1);
    const s    = Math.sqrt(s2);
    const rsd  = (s / mean) * 100;
    const df   = n - 1;
    const t_tab = T_TABLE[Math.min(df-1, T_TABLE.length-1)];
    const ic   = t_tab * s / Math.sqrt(n);
    const t_calc = Math.abs(mean - mu) / (s / Math.sqrt(n));
    const biased = t_calc > t_tab;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('stat-mean', mean.toFixed(4));
    set('stat-s',    s.toFixed(4));
    set('stat-rsd',  rsd.toFixed(3) + '%');
    set('stat-ic',   '±' + ic.toFixed(4) + ' (95%)');
    set('stat-t',    t_calc.toFixed(3) + ' (t_tab=' + t_tab.toFixed(3) + ')');

    const biasEl = document.getElementById('stat-bias');
    if (biasEl) {
      biasEl.textContent  = biased ? 'Sim (erro sistemático)' : 'Não (dentro do IC)';
      biasEl.style.color  = biased ? 'var(--accent-reaction)' : 'var(--accent-organic)';
    }
  }

  document.getElementById('stat-calc-btn')?.addEventListener('click', calc);
  if (document.getElementById('stat-x1')) calc();
}

function _initEDTA() {
  const Mm_CaCO3 = 100.09;

  function update() {
    const C  = parseFloat(document.getElementById('edta-C')?.value  ?? 0.01);
    const V  = parseFloat(document.getElementById('edta-V')?.value  ?? 15.6) / 1000;  // L
    const Va = parseFloat(document.getElementById('edta-Va')?.value ?? 100)  / 1000;  // L

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('edta-C-val',  C.toFixed(4) + ' M');
    set('edta-V-val',  (V*1000).toFixed(1) + ' mL');
    set('edta-Va-val', (Va*1000).toFixed(0) + ' mL');

    const n_EDTA = C * V * 1000;           // mmol
    const dur    = n_EDTA / (Va * 1000);  // mmol/L (mM)
    const caco3  = dur * Mm_CaCO3;        // mg/L (ppm)
    const dH     = caco3 / 10;            // 1°dH = 10 mg CaCO₃/L

    set('edta-n',     n_EDTA.toFixed(3) + ' mmol');
    set('edta-dur',   dur.toFixed(4) + ' mmol/L');
    set('edta-caco3', caco3.toFixed(2) + ' mg/L');
    set('edta-dH',    dH.toFixed(2) + ' °dH');
  }

  if (document.getElementById('edta-C')) {
    update();
    ['edta-C','edta-V','edta-Va'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', update));
  }
}

function _initAAS() {
  function update() {
    const sb   = parseFloat(document.getElementById('aas-sb')?.value   ?? 0.002);
    const sens = parseFloat(document.getElementById('aas-sens')?.value ?? 0.1);

    const lod  = 3  * sb / sens;  // mg/L
    const loq  = 10 * sb / sens;  // mg/L
    const char = 0.0044 / sens;   // concentração que dá A=0,0044 (1% absorção)

    const fmt = v => v < 0.001 ? (v*1000).toFixed(3)+' μg/L' : v.toFixed(4)+' mg/L';
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('aas-sb-val',   sb.toFixed(4));
    set('aas-sens-val', sens.toFixed(3));
    set('aas-lod',      fmt(lod));
    set('aas-loq',      fmt(loq));
    set('aas-charac',   char.toFixed(4) + ' mg/L');
  }
  document.getElementById('aas-sb')?.addEventListener('input', update);
  document.getElementById('aas-sens')?.addEventListener('input', update);
  if (document.getElementById('aas-sb')) update();
}

export function destroy() { if(_loop){_loop.stop();_loop=null;} }
