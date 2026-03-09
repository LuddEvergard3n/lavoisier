/**
 * modules/biochemistry/index.js -- Modulo: Bioquimica
 *
 * Cobre:
 *  - 20 aminoacidos essenciais (grupos, propriedades)
 *  - Estrutura proteica (primaria, secundaria, terciaria, quaternaria)
 *  - DNA e RNA: bases nitrogenadas, dupla-helice, transcricao/traducao
 *  - Glicidios: glucose, frutose, sacarose, amido, celulose
 *  - Lipidios: acidos graxos saturados/insaturados, triglicerideos, fosfolipidios
 *  - Cinetica enzimatica: Michaelis-Menten, Vmax, Km
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';
import { SimLoop }         from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

const AA_GROUPS = [
  { group: 'Apotar (alifaticos)', color: '#8b949e',
    aas: [
      {name:'Glicina',   abr:'Gly',sym:'G', mw:75.03,  desc:'O menor AA; sem quiralidade; abundante em colageno'},
      {name:'Alanina',   abr:'Ala',sym:'A', mw:89.09,  desc:'Metil lateral; muito comum em proteinas'},
      {name:'Valina',    abr:'Val',sym:'V', mw:117.15, desc:'Essencial; cadeia ramificada; musculo'},
      {name:'Leucina',   abr:'Leu',sym:'L', mw:131.17, desc:'Essencial; mais abundante em proteinas musculares'},
      {name:'Isoleucina',abr:'Ile',sym:'I', mw:131.17, desc:'Essencial; dois centros estereogenicos'},
    ]
  },
  { group: 'Aromaticos', color: '#ffd166',
    aas: [
      {name:'Fenilalanina',abr:'Phe',sym:'F',mw:165.19,desc:'Essencial; precursor da tirosina e dopamina'},
      {name:'Tirosina',    abr:'Tyr',sym:'Y',mw:181.19,desc:'OH fenolico; fosforilavel; precursor hormonal'},
      {name:'Triptofano',  abr:'Trp',sym:'W',mw:204.23,desc:'Essencial; maior AA; precursor da serotonina'},
    ]
  },
  { group: 'Polares (sem carga)', color: '#6bcb77',
    aas: [
      {name:'Serina',     abr:'Ser',sym:'S',mw:105.09,desc:'OH; muito fosforilado em sinalizacao'},
      {name:'Treonina',   abr:'Thr',sym:'T',mw:119.12,desc:'Essencial; OH; dois centros estereo'},
      {name:'Cisteina',   abr:'Cys',sym:'C',mw:121.16,desc:'SH; forma pontes dissulfeto (S-S) em proteinas'},
      {name:'Metionina',  abr:'Met',sym:'M',mw:149.21,desc:'Essencial; tioeter; AA de inicio de traducao'},
      {name:'Asparagina', abr:'Asn',sym:'N',mw:132.12,desc:'Amida; glicosilada em N-glicosilacao'},
      {name:'Glutamina',  abr:'Gln',sym:'Q',mw:146.15,desc:'Amida; combustivel de enterocitos'},
    ]
  },
  { group: 'Acidos (carga -)', color: '#ef476f',
    aas: [
      {name:'Aspartato',abr:'Asp',sym:'D',mw:133.10,desc:'pKa~3,9; carboxilato; ciclo do aspartato'},
      {name:'Glutamato',abr:'Glu',sym:'E',mw:147.13,desc:'pKa~4,1; neurotransmissor excitatório'},
    ]
  },
  { group: 'Basicos (carga +)', color: '#4fc3f7',
    aas: [
      {name:'Lisina',   abr:'Lys',sym:'K',mw:146.19,desc:'Essencial; pKa~10,5; ubiquitinado'},
      {name:'Arginina', abr:'Arg',sym:'R',mw:174.20,desc:'Guanidinio; precursor do NO; pKa~12,5'},
      {name:'Histidina',abr:'His',sym:'H',mw:155.16,desc:'Essencial; imidazol pKa~6; centro ativo de enzimas'},
    ]
  },
  { group: 'Especiais', color: '#9b8fc4',
    aas: [
      {name:'Prolina',abr:'Pro',sym:'P',mw:115.13,desc:'Imino; quebra alfa-helices; abundante em colageno'},
    ]
  },
];

const ENZYMES = [
  { name:'Lactase',     Vmax:100, Km:5.0,   sub:'Lactose', prod:'Glicose + Galactose',
    note:'Deficiencia causa intolerancia a lactose (>65% adultos mundialmente)' },
  { name:'Catalase',    Vmax:1e7, Km:25,    sub:'H2O2',    prod:'H2O + O2',
    note:'Enzima mais rapida conhecida: 4×10^7 reacoes/s (fegado, eritrocitos)' },
  { name:'Urease',      Vmax:200, Km:2.5,   sub:'Ureia',   prod:'NH3 + CO2',
    note:'H. pylori usa urease para sobreviver no pH acido gastrico' },
  { name:'Hexoquinase', Vmax:50,  Km:0.1,   sub:'Glucose', prod:'G-6-P',
    note:'1a reacao da glicose; inibida por produto (G-6-P) — regulacao por feedback' },
];

let _loop = null, _aaGroupIdx = 0, _aaIdx = 0;
let _enzymeIdx = 0, _subConc = 1.0;
let _exAttempts = 0, _exDone = false;

/* Canvas: Michaelis-Menten curve */
function drawMMCanvas(el) {
  const frame = el.parentElement;
  const W = Math.min(frame.clientWidth||520,520), H = 200;
  const dpr = window.devicePixelRatio||1;
  el.width=Math.round(W*dpr); el.height=Math.round(H*dpr);
  el.style.width=W+'px'; el.style.height=H+'px';
  const ctx = el.getContext('2d'); ctx.scale(dpr,dpr);

  if(_loop) _loop.stop();
  _loop = new SimLoop(() => {
    clearCanvas(ctx, W, H);
    const enz = ENZYMES[_enzymeIdx];
    const {Vmax, Km} = enz;
    const padX=48, padY=14, gW=W-padX-14, gH=H-padY-32;
    const xMax = Km*6;

    // axes
    ctx.strokeStyle=COLOR.border; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(padX,padY); ctx.lineTo(padX,padY+gH); ctx.lineTo(padX+gW,padY+gH); ctx.stroke();

    // Vmax label
    ctx.strokeStyle=COLOR.textMuted+'66'; ctx.lineWidth=0.8; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(padX, padY+4); ctx.lineTo(padX+gW, padY+4); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=COLOR.textMuted; ctx.font='9px sans-serif'; ctx.textAlign='right';
    ctx.fillText('Vmax', padX-3, padY+7);

    // Km vertical line
    const kmX = padX+(Km/xMax)*gW;
    ctx.strokeStyle=COLOR.bond+'88'; ctx.lineWidth=0.8; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(kmX,padY+4); ctx.lineTo(kmX,padY+gH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=COLOR.bond; ctx.font='9px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Km', kmX, padY+gH+12);

    // curve v = Vmax*S/(Km+S)
    ctx.beginPath();
    for(let i=0; i<=200; i++){
      const S = (i/200)*xMax;
      const v = Vmax*S/(Km+S);
      const x = padX+(S/xMax)*gW;
      const y = padY+gH-(v/Vmax)*gH + 4;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.strokeStyle=COLOR.electron; ctx.lineWidth=2; ctx.stroke();

    // current point
    const curS = _subConc;
    const curV = Vmax*curS/(Km+curS);
    const curX = padX+(curS/xMax)*gW;
    const curY = padY+gH-(curV/Vmax)*gH+4;
    if(curX <= padX+gW) {
      ctx.beginPath(); ctx.arc(curX,curY,5,0,Math.PI*2);
      ctx.fillStyle=COLOR.reaction; ctx.fill();
      ctx.fillStyle=COLOR.reaction; ctx.font='9px sans-serif'; ctx.textAlign='left';
      ctx.fillText('v='+(curV/Vmax*100).toFixed(0)+'%Vmax', curX+7, curY+4);
    }

    // axis labels
    ctx.fillStyle=COLOR.textMuted; ctx.font='9px sans-serif'; ctx.textAlign='center';
    ctx.fillText('[S] (x Km = '+(Km<1?Km.toFixed(3):Km)+' mM)', padX+gW/2, H-4);
    ctx.save(); ctx.translate(10, padY+gH/2); ctx.rotate(-Math.PI/2);
    ctx.fillText('Velocidade v', 0, 0); ctx.restore();
  });
  _loop.start();
}

function calcMM() {
  const enz = ENZYMES[_enzymeIdx];
  const v = enz.Vmax * _subConc / (enz.Km + _subConc);
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('mm-v',    v.toFixed(3));
  set('mm-vmax', enz.Vmax.toFixed(0));
  set('mm-km',   enz.Km.toFixed(3)+' mM');
  set('mm-pct',  (v/enz.Vmax*100).toFixed(2)+'%');
  set('mm-note', enz.note);
  set('mm-sub',  enz.sub+' → '+enz.prod);
}

const EXERCISE = {
  question: 'Uma enzima tem Km = 2 mM e Vmax = 100 mol/(L·min). Qual a velocidade a [S] = 2 mM?',
  options: ['100 mol/(L·min)','50 mol/(L·min)','25 mol/(L·min)','75 mol/(L·min)'],
  correct: 1,
  explanation: 'v = Vmax × [S]/(Km+[S]) = 100 × 2/(2+2) = 50. Quando [S] = Km, v = Vmax/2 — definicao do Km.',
};

export function render(outlet) {
  if(_loop){_loop.stop();_loop=null;}
  _aaGroupIdx=0; _aaIdx=0; _enzymeIdx=0; _subConc=1.0; _exAttempts=0; _exDone=false;

  const aaGroupBtns = AA_GROUPS.map((g,i) =>
    `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="aag-btn-${i}" data-aagidx="${i}">${g.group.split('(')[0].trim()}</button>`
  ).join('');
  const enzBtns = ENZYMES.map((e,i) =>
    `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="enz-btn-${i}" data-enzidx="${i}">${e.name}</button>`
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
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4"/>
      </svg>
    </div>
    <div><h1 class="module-title">Bioquímica</h1>
    <p class="module-subtitle">Aminoácidos, proteínas, DNA, glicídios, lipídios e enzimas.</p></div>
  </header>

  <section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">Cada célula do seu corpo contém ~2 bilhões de proteínas. O DNA de uma célula humana esticado teria ~2 metros — comprimido em 6 micrômetros pelo enrolamento em histonas. A hemoglobina carrega O₂ com cooperatividade alostérica. A lactase digerindo lactose no intestino. Toda essa maquinaria molecular é bioquímica — química da vida.</p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Aminoácidos — 20 essenciais</h2>
    <p class="module-text">Aminoácidos são monômeros de proteínas: grupo amino (−NH₂), carboxílico (−COOH) e cadeia lateral (R) variável ligados ao carbono alfa. A cadeia lateral define as propriedades — polar, apolar, ácida, básica.</p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem">${aaGroupBtns}</div>
    <div id="aa-grid" class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))"></div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Estrutura proteica</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-electron)">Primária</h3><p style="font-size:var(--text-sm)">Sequência de aminoácidos codificada pelo DNA. Exemplo (proteína mioglobina, início):</p><code style="display:block;font-size:10px;color:var(--accent-electron);overflow-wrap:break-word;word-break:break-all;background:var(--bg-raised);padding:.3rem .4rem;border-radius:4px;margin-top:.3rem;line-height:1.4">MKTAYIAKQR QISFVKSHFS RQLEERL…</code></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-bond)">Secundária</h3><p style="font-size:var(--text-sm)">Dobramento local por pontes de hidrogênio: α-hélice (3,6 resíduos/volta, H-bond i→i+4) e folha-β (H-bonds entre segmentos antiparalelos/paralelos). Previsível por sequência.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Terciária</h3><p style="font-size:var(--text-sm)">Dobramento 3D completo da cadeia: ligações dissulfeto (Cys-Cys), interações hidrofóbicas (núcleo apolar), pontes de H, interações eletrostáticas. Determina a função.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Quaternária</h3><p style="font-size:var(--text-sm)">Associação de múltiplas subunidades. Ex: hemoglobina = 2α + 2β. Cooperatividade: ligação de O₂ em uma subunidade facilita as outras (curva sigmoidal).</p></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">DNA e RNA</h2>
    <div class="module-grid" style="grid-template-columns:1fr 1fr">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">DNA</h3>
        <p style="font-size:var(--text-sm)">Dupla-hélice antiparalela de desoxirribonucleotídeos. Bases: A-T (2 pontes H), G-C (3 pontes H). Fita complementar: 5'-ATGC-3' ↔ 3'-TACG-5'.</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:.4rem">Replicação semi-conservativa: cada filha tem 1 fita parental + 1 nova.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">RNA</h3>
        <p style="font-size:var(--text-sm)">Fita simples, ribose, uracila no lugar da timina. mRNA: cópia do gene. tRNA: adaptor (anticodon → aminoácido). rRNA: componente estrutural do ribossomo.</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:.4rem">Central Dogma: DNA → (transcrição) → mRNA → (tradução) → proteína.</p>
      </div>
    </div>
    <div class="info-card" style="margin-top:.75rem;background:var(--bg-raised)">
      <p style="font-family:monospace;font-size:var(--text-sm);margin:0;color:var(--accent-electron)">
        5'-AUG UUU AAA GGG UAA-3'<br>
        <span style="color:var(--text-muted)">  Met  Phe  Lys  Gly  STOP</span>
      </p>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Glicídios</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      <div class="info-card"><h3 style="margin-top:0">Glicose (C₆H₁₂O₆)</h3><p style="font-size:var(--text-sm)">Monossacarídeo; combustível universal (glicólise → 2 piruvato + 2 ATP). Forma anel em solução (forma α e β).</p></div>
      <div class="info-card"><h3 style="margin-top:0">Sacarose (C₁₂H₂₂O₁₁)</h3><p style="font-size:var(--text-sm)">Dissacarídeo: glicose(α1→β2)frutose. Açúcar de mesa; hidrolisado por sacarase a glucose + frutose.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Amido</h3><p style="font-size:var(--text-sm)">Polissacarídeo: amilose (linear, α1→4) + amilopectina (ramificada, α1→6). Reserva de energia em plantas.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Celulose</h3><p style="font-size:var(--text-sm)">β1→4 glicose; fibras de H horizontais entre cadeias. Indigerível por humanos (sem β-glicosidase); fibra alimentar.</p></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Lipídios</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-bond)">Ácido graxo saturado</h3><p style="font-size:var(--text-sm)">Sem duplas C=C. Palmitico (C16:0), esteárico (C18:0). Sólidos em T ambiente; empacotamento eficiente. Gordura animal.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Ácido graxo insaturado</h3><p style="font-size:var(--text-sm)">Uma ou mais duplas cis C=C. Oleico (C18:1, ω-9), linoleico (C18:2, ω-6), DHA (C22:6, ω-3). Líquidos; membrana fluida.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Triglicerídeo</h3><p style="font-size:var(--text-sm)">Glicerol + 3 ácidos graxos por éster. Reserva energética (9 kcal/g vs 4 kcal/g dos glicídios). Hidrolisado por lipases.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Fosfolipídio</h3><p style="font-size:var(--text-sm)">Glicerol + 2 ác. graxos + fosfato + grupo polar. Anfipático → bicamada lipídica (membrana celular). Cauda hidrofóbica interior.</p></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Cinética enzimática — Michaelis-Menten</h2>
    <p class="module-text">E + S ⇌ ES → E + P. A velocidade de reação: <strong>v = Vmax·[S]/(Km+[S])</strong>. Km é a concentração de substrato para v = Vmax/2 — medida de afinidade inversa (Km menor = maior afinidade). Vmax é a velocidade máxima (enzima saturada).</p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem">${enzBtns}</div>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">[S] (mM):</label>
      <input type="range" id="mm-s" min="0.01" max="50" step="0.01" value="1" style="width:160px;accent-color:var(--accent-electron)">
      <span id="mm-s-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">1,00 mM</span>
    </div>
    <div class="canvas-frame"><canvas id="mm-canvas"></canvas></div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));margin-top:.75rem">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">v atual</p><div id="mm-v" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">% Vmax</p><div id="mm-pct" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Vmax</p><div id="mm-vmax" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Km</p><div id="mm-km" style="font-size:var(--text-xl);font-weight:700;color:var(--text-secondary)">—</div></div>
    </div>
    <p id="mm-sub" style="font-size:var(--text-sm);font-family:monospace;color:var(--accent-electron);margin-top:.4rem"></p>
    <p id="mm-note" style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.2rem"></p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Exercício</h2>
    <p class="module-text">${esc(EXERCISE.question)}</p>
    <div id="exercise-opts" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">${exOpts}</div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
  </section>

  <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">Inibidores de protease (HIV) e estatinas (colesterol) são fármacos que inibem enzimas com alta especificidade. CRISPR-Cas9 usa uma nuclease guiada por RNA para cortar DNA em sequência específica — revolucionou terapia gênica. Fermentação alcoólica: leveduras convertem glicose → etanol + CO₂ via glicólise anaeróbica. Soro de rehidratação oral usa a cotransportação de Na⁺/glicose no intestino para absorção eficiente.</p>
  </div>
</div>
`;

  // Render AA group
  function renderAAGroup(gIdx) {
    const g = AA_GROUPS[gIdx];
    const container = document.getElementById('aa-grid');
    if (!container) return;
    container.innerHTML = g.aas.map(aa =>
      `<div class="info-card">
        <div style="display:flex;align-items:baseline;gap:.5rem;margin-bottom:.3rem">
          <span style="font-family:monospace;font-size:var(--text-lg);font-weight:700;color:${g.color}">${aa.sym}</span>
          <span style="font-size:var(--text-sm);color:var(--text-primary)">${aa.name}</span>
          <span style="font-size:var(--text-xs);color:var(--text-muted)">${aa.abr}</span>
        </div>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.2rem">${aa.mw} g/mol</p>
        <p style="font-size:var(--text-xs);color:var(--text-secondary)">${aa.desc}</p>
      </div>`
    ).join('');
    AA_GROUPS.forEach((_,j)=>{const b=document.getElementById('aag-btn-'+j);if(b) b.className='btn btn-xs '+(j===gIdx?'btn-secondary':'btn-ghost');});
  }
  renderAAGroup(0);
  AA_GROUPS.forEach((_,i) => {
    document.getElementById('aag-btn-'+i)?.addEventListener('click', ()=>renderAAGroup(i));
  });

  const mmCanvas = document.getElementById('mm-canvas');
  if(mmCanvas) drawMMCanvas(mmCanvas);
  calcMM();

  ENZYMES.forEach((_,i) => {
    document.getElementById('enz-btn-'+i)?.addEventListener('click', () => {
      _enzymeIdx=i;
      ENZYMES.forEach((_,j)=>{const b=document.getElementById('enz-btn-'+j);if(b) b.className='btn btn-xs '+(j===i?'btn-secondary':'btn-ghost');});
      const sSlider=document.getElementById('mm-s'); if(sSlider) { _subConc=1; sSlider.value='1'; const v=document.getElementById('mm-s-val'); if(v) v.textContent='1,00 mM'; }
      calcMM();
    });
  });
  document.getElementById('mm-s')?.addEventListener('input', e => {
    _subConc=parseFloat(e.target.value); const v=document.getElementById('mm-s-val'); if(v) v.textContent=_subConc.toFixed(2).replace('.',',')+' mM'; calcMM();
  });

  document.querySelectorAll('[data-exopt]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(_exDone) return; _exAttempts++;
      const choice=parseInt(btn.dataset.exopt,10), fb=document.getElementById('exercise-feedback');
      if(choice===EXERCISE.correct){
        _exDone=true; btn.style.borderColor='var(--accent-organic)'; btn.style.color='var(--accent-organic)';
        if(fb) fb.innerHTML='<p class="feedback-correct">Correto! '+EXERCISE.explanation+'</p>';
        markSectionDone('biochemistry','exercise');
      } else {
        btn.style.borderColor='var(--accent-reaction)'; btn.style.color='var(--accent-reaction)';
        if(fb&&_exAttempts===1) fb.innerHTML='<p class="feedback-hint">Dica: v = Vmax*[S]/(Km+[S]). Quando [S]=Km, o que acontece?</p>';
      }
    });
  });
}

export function destroy() { if(_loop){_loop.stop();_loop=null;} }
