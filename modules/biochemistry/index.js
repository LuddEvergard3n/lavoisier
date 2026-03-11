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
let _exIdx     = 0;
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

const EXERCISES = [
  { q: 'Enzima com Km = 2 mM e Vmax = 100 μmol/(L·min). Velocidade a [S] = 2 mM?', opts: ['25','50','100','75'], ans: 1, exp: 'v = Vmax×[S]/(Km+[S]) = 100×2/4 = 50 μmol/(L·min). Quando [S]=Km, v=Vmax/2.', hint: 'Michaelis-Menten: v = Vmax×[S]/(Km+[S]).' },
  { q: 'Qual etapa gera a maior quantidade de ATP por mol de glicose?', opts: ['Glicólise','Ciclo de Krebs','Cadeia transportadora de elétrons','Piruvato desidrogenase'], ans: 2, exp: 'CTE reoxida NADH (2,5 ATP) e FADH₂ (1,5 ATP). ~28 dos ~32 ATP/glicose vêm da CTE.', hint: 'A maior produção vem da reoxidação de NADH e FADH₂. Onde isso ocorre?' },
  { q: 'O acoplamento quimiosmótico descreve síntese de ATP impulsionada por:', opts: ['Conversão direta de NADH','Gradiente eletroquímico de H⁺ pela membrana mitocondrial interna','Calor da cadeia','Fosforilação ao nível do substrato'], ans: 1, exp: 'Complexos I, III, IV bombeiam H⁺. Retorno pela ATP sintase (~3 H⁺/ATP) sintetiza ATP. Nobel Mitchell, 1978.', hint: 'O gradiente de prótons armazena energia potencial eletroquímica.' },
  { q: 'A PFK-1 (reação 3 da glicólise) é inibida por:', opts: ['AMP','ADP','ATP (alta energia)','NADH (baixo)'], ans: 2, exp: 'ATP alto = energia suficiente → inibe PFK-1. AMP/ADP = depleção → ativa PFK-1.', hint: 'Quando a célula tem energia suficiente (ATP alto), a glicólise deve acelerar ou desacelerar?' },
  { q: 'A oxidação da água no PSII ocorre porque:', opts: ['PSII é redutor forte','P680* é oxidante extremamente forte (E°≈+1,2 V)','O₂ catalisa a reação','ATP fornece energia'], ans: 1, exp: 'P680 absorve fóton → P680* doa e⁻ → P680⁺ (E°≈+1,2 V). Forte o suficiente para oxidar H₂O (E°=+0,82 V). Cluster Mn₄CaO₅ catalisa.', hint: 'P680⁺ precisa de elétrons. De onde eles vêm?' },,
  { q:'A glicose (6 carbonos) produz quantos mol de ATP por glicólise + ciclo de Krebs + cadeia respiratória (aeróbico)?', opts:['2 ATP','10 ATP','30-32 ATP','38 ATP'], ans:2, exp:'Cálculo moderno: glicólise (2 ATP líquido + 2 NADH), piruvato → acetil-CoA (2 NADH), Krebs (2 GTP + 6 NADH + 2 FADH₂). Cadeia respiratória: NADH→2,5 ATP; FADH₂→1,5 ATP. Total: ~30-32 ATP (valor antigo "38" não considerava eficiência real da ATP sintase).', hint:'Aeróbico muito mais eficiente que anaeróbico (2 ATP). Glicólise isolada: 2 ATP.' },
  { q:'A reação de Michaelis-Menten: E + S ⇌ ES → E + P. Km é:', opts:['A velocidade máxima da enzima','A concentração de substrato em que v = Vmax/2 (constante de Michaelis)','A constante de equilíbrio E+S⇌ES','O número de moles de substrato por mol de enzima por segundo'], ans:1, exp:'Km = (k₋₁ + k₂)/k₁. Operacionalmente: concentração de substrato [S] em que v = Vmax/2. Km baixo = alta afinidade (meia saturação com pouco S). Km alto = baixa afinidade. Km ≈ [ES]/([E][S]) quando k₂ << k₋₁.', hint:'Km: [S] quando v = Vmax/2. Baixo Km = alta afinidade enzima-substrato.' },
  { q:'O DNA tem estrutura de dupla-hélice com emparelhamento A-T e G-C porque:', opts:['Adenina e Timina têm o mesmo tamanho','A-T forma 2 ligações de H; G-C forma 3 — a complementaridade garante replicação fiel','As bases se pareiam por ligações iônicas','A-G e T-C seriam mais estáveis por terem bases similares'], ans:1, exp:'Regras de Chargaff: %A = %T; %G = %C. Watson-Crick: A-T (2 ligações de H) e G-C (3 ligações de H). A complementaridade estrita garante que cada fita serve como molde para replicar a outra com fidelidade. G-C mais estável energeticamente.', hint:'A-T: 2 ligações H. G-C: 3 ligações H. Complementaridade → replicação fiel.' },
  { q:'Na regulação alostérica de enzimas, o inibidor alostérico:', opts:['Bloqueia o sítio ativo diretamente','Liga-se a sítio diferente do ativo, alterando a conformação e reduzindo a atividade','Compete com o substrato','Destrói a enzima permanentemente'], ans:1, exp:'Regulação alostérica: ligante (ativador ou inibidor) liga-se a sítio alostérico (≠ sítio ativo) → muda conformação da enzima → altera afinidade pelo substrato (Km) ou Vmax. Ex: ATP inibe fosfofrutoquinase-1 (sinaliza que há energia suficiente). AMP ativa a mesma enzima.', hint:'Alostérico: sítio diferente do ativo. Muda forma da enzima.' },
  { q:'A β-oxidação de ácidos graxos ocorre na mitocôndria e produz principalmente:', opts:['Glicose diretamente','Acetil-CoA (que entra no ciclo de Krebs) + NADH + FADH₂','Lactato','Piruvato'], ans:1, exp:'Cada ciclo de β-oxidação de um ácido graxo retira 2 carbonos como acetil-CoA, produzindo 1 FADH₂ e 1 NADH. Um ácido graxo de 16C (palmitato) gera 8 acetil-CoA + 7 NADH + 7 FADH₂ = ~106 ATP. Muito mais eficiente por grama que glicídios.', hint:'β-oxidação: carbono a carbono → acetil-CoA → Krebs. Gorduras: mais ATP/g que carboidratos.' },
  { q:'A ligação peptídica que une aminoácidos tem caráter de dupla ligação parcial porque:', opts:['O carbono do carbonila tem 4 ligações covalentes','Ressonância do par de elétrons do N com C=O → C-N não pode rotacionar livremente','O hidrogênio do N migra para o O','O nitrogênio é sp³ e piramidal'], ans:1, exp:'A ressonância C=O ↔ C⁻-O⁺ envolve deslocalização do par do N: -CO-NH- tem caráter parcial de dupla ligação C-N (planar, não rotaciona). Isso torna a ligação peptídica planar → restringe graus de liberdade e contribui para a estrutura secundária (ângulos φ e ψ do Ramachandran).', hint:'C(=O)-N tem ressonância: par do N se deslocaliza → ligação parcialmente dupla → plana.' },
  { q:'O ponto isoelétrico (pI) de um aminoácido é o pH em que:', opts:['Ele está 100% protonado','A carga líquida é zero (forma zwitteriônica predomina)','Ele precipita','A solubilidade é máxima'], ans:1, exp:'No pI, a forma zwitteriônica (NH₃⁺-CHR-COO⁻) predomina e a carga líquida é zero. Abaixo do pI: carga positiva. Acima: carga negativa. Para Gly: pI = (pKa1+pKa2)/2 = (2,34+9,60)/2 = 5,97. Proteínas precipitam no pI (mínima solubilidade, sem repulsão eletrostática).', hint:'pI = pH de carga líquida zero. Precipita no pI.' },
  { q:'A fotossíntese divide-se em fase clara (tilacoides) e fase escura (estroma). A fase clara produz:', opts:['Glicose diretamente','ATP + NADPH + O₂ (pela oxidação da água)','CO₂ + H₂O','Amido'], ans:1, exp:'Fase clara: luz excita clorofila → eletrões fluem pela cadeia (PS II → plastoquinona → citocromo → PS I → ferredoxina → NADP⁺-redutase) → NADPH. Fotofosforilação → ATP. Oxidação da água: 2H₂O → 4H⁺ + 4e⁻ + O₂. Fase escura (Calvin): CO₂ + ATP + NADPH → G3P → glicose.', hint:'Fase clara: gera ATP, NADPH, libera O₂. Fase escura (Calvin): usa ATP+NADPH para fixar CO₂.' },
  { q:'A enzima ribonuclease A (RNAse A) é inativada por desnaturação a 95°C mas redobra espontaneamente ao resfriar. Isso demonstra:', opts:['A sequência primária não contém a informação da estrutura terciária','A estrutura terciária está completamente determinada pela sequência de aminoácidos (Anfinsen)','A desnaturação é sempre irreversível','Os dissulfetos são necessários para dobramento'], ans:1, exp:'Experiência de Anfinsen (Nobel 1972): RNAse A desnaturada (8M uréia + mercaptoetanol) recupera atividade ao remover desnaturantes → dobramento espontâneo. Conclusão: a sequência primária contém toda a informação para o dobramento. Prêmio Nobel de Química 1972.', hint:'Anfinsen: desnaturação reversível prova que a sequência determina a estrutura.' },
  { q:'A diferença entre DNA e RNA inclui:', opts:['RNA tem timina; DNA tem uracila','DNA tem desoxirribose e timina; RNA tem ribose e uracila','DNA é de fita simples; RNA de dupla fita','RNA não contém informação genética'], ans:1, exp:'DNA: desoxirribose (sem OH em 2'), timina (T), dupla fita, mais estável. RNA: ribose (OH em 2'), uracila (U) no lugar de timina, geralmente fita simples (mRNA, tRNA, rRNA). O OH do RNA o torna mais reativo → menor estabilidade → RNA mensageiro é transitório.', hint:'DNA: desoxirribose + T. RNA: ribose + U. DNA dupla fita; RNA fita simples.' }
];

export function render(outlet) {
  if(_loop){_loop.stop();_loop=null;}
  _aaGroupIdx=0; _aaIdx=0; _enzymeIdx=0; _subConc=1.0; _exAttempts=0; _exDone=false;

  const aaGroupBtns = AA_GROUPS.map((g,i) =>
    `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="aag-btn-${i}" data-aagidx="${i}">${g.group.split('(')[0].trim()}</button>`
  ).join('');
  const enzBtns = ENZYMES.map((e,i) =>
    `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="enz-btn-${i}" data-enzidx="${i}">${e.name}</button>`
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
    <p class="module-text">Aminoácidos são monômeros de proteínas: grupo amino (-NH₂), carboxílico (-COOH) e cadeia lateral (R) variável ligados ao carbono alfa. A cadeia lateral define as propriedades — polar, apolar, ácida, básica.</p>
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

  <!-- Glicólise -->
  <section class="module-section">
    <h2 class="module-section-title">Metabolismo energético — glicólise, ciclo de Krebs e cadeia respiratória</h2>
    <p class="module-text">
      O metabolismo energético oxida substratos orgânicos (glicose, ácidos graxos, aminoácidos)
      para produzir ATP. Três etapas sequenciais: <strong>glicólise</strong> (citosol),
      <strong>ciclo de Krebs</strong> (mitocôndria, matriz) e <strong>cadeia respiratória</strong>
      (membrana interna mitocondrial).
    </p>

    <!-- Balanço global -->
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O &nbsp;&nbsp;|&nbsp;&nbsp; ΔG° = -2870 kJ/mol
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Rendimento teórico: ~30–32 ATP/glicose (eucariotos). Real: ~25–28 ATP (perdas de H⁺).<br>
        ATP: ΔG° de hidrólise = -30,5 kJ/mol. A célula converte ~40% da energia em ATP (resto: calor).
      </p>
    </div>

    <!-- Glicólise -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Glicólise (citosol) — 10 reações
    </h3>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr));margin-bottom:var(--space-4)">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Fase de investimento (1–5)</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">Glicose → 2 DHAP / G3P</p>
        <p style="font-size:var(--text-sm)">Consome 2 ATP. Fosforilações por hexoquinase (irrev.), fosfoglicose isomerase, fosfofrutoquinase-1 (PFK-1, passo regulatório chave), aldolase, triose fosfato isomerase. PFK-1 inibida por ATP e citrato; ativada por AMP, ADP e frutose-2,6-bisfosfato.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Fase de retorno (6–10)</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">2 G3P → 2 piruvato</p>
        <p style="font-size:var(--text-sm)">Gera 4 ATP (net: +2 ATP), 2 NADH, 2 piruvato. Etapas notáveis: G3P desidrogenase (gera NADH + 1,3-BPG), fosfoglicerato quinase (+2 ATP), piruvato quinase (irrev., +2 ATP). Enolase inibida por F⁻ (uso histórico em anticoagulação).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Piruvato desidrogenase</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">Piruvato + CoA + NAD⁺ → Acetil-CoA + CO₂ + NADH</p>
        <p style="font-size:var(--text-sm)">Complexo multienzimático (PDH): 3 enzimas, 5 cofatores (TPP, lipoato, CoA, FAD, NAD⁺). Irreversível: conecta glicólise ao ciclo de Krebs. Inibido por NADH, Acetil-CoA e ATP; ativado por NAD⁺, CoA, AMP. Regulação por fosforilação/defosforilação.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Balanço da glicólise</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">Glicose + 2NAD⁺ + 2ADP + 2Pi → 2 Piruvato + 2NADH + 2ATP + 2H₂O</p>
        <p style="font-size:var(--text-sm)">Net: +2 ATP, +2 NADH (valem ~5 ATP cada na cadeia resp.). Fermentação lática: regenera NAD⁺ sem O₂ → lactato (lactato desidrogenase). Fermentação alcoólica: piruvato → acetaldeído → etanol (leveduras). ΔG°' = -85 kJ/mol (glicose → 2 piruvato).</p>
      </div>
    </div>

    <!-- Ciclo de Krebs -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Ciclo de Krebs / Ciclo do ácido cítrico (mitocôndria)
    </h3>
    <div style="overflow-x:auto;margin-bottom:var(--space-4)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.3rem .5rem;border-bottom:1px solid var(--border-default)">Etapa</th>
            <th style="text-align:left;padding:.3rem .5rem;border-bottom:1px solid var(--border-default)">Reação</th>
            <th style="text-align:left;padding:.3rem .5rem;border-bottom:1px solid var(--border-default)">Enzima</th>
            <th style="text-align:left;padding:.3rem .5rem;border-bottom:1px solid var(--border-default)">Produto energético</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['1','Acetil-CoA + OAA → Citrato','Citrato sintase (irrev.)','—'],
            ['2','Citrato → Isocitrato','Aconitase','—'],
            ['3','Isocitrato → α-cetoglutarato + CO₂','Isocitrato desidrogenase (irrev.)','NADH'],
            ['4','α-Cetoglutarato → Succinil-CoA + CO₂','α-Cetoglutarato DH (irrev.)','NADH'],
            ['5','Succinil-CoA → Succinato','Succinil-CoA sintetase','GTP (ou ATP)'],
            ['6','Succinato → Fumarato','Succinato desidrogenase (FAD)','FADH₂'],
            ['7','Fumarato → Malato','Fumarase','—'],
            ['8','Malato → OAA','Malato desidrogenase','NADH'],
          ].map(([n,rxn,enz,prod]) => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.3rem .5rem;font-weight:700;color:var(--accent-electron)">${n}</td>
            <td style="padding:.3rem .5rem;font-family:monospace;font-size:var(--text-xs)">${rxn}</td>
            <td style="padding:.3rem .5rem;font-size:var(--text-xs);color:var(--text-muted)">${enz}</td>
            <td style="padding:.3rem .5rem;font-weight:600;color:${prod==='NADH'?'var(--accent-organic)':prod==='FADH₂'?'var(--accent-bond)':prod.startsWith('GTP')?'var(--accent-electron)':'var(--text-muted)'}">${prod||'—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        <strong>Por volta do ciclo (por Acetil-CoA):</strong> 3 NADH + 1 FADH₂ + 1 GTP + 2 CO₂.<br>
        Por glicose (2 voltas): 6 NADH + 2 FADH₂ + 2 GTP.<br>
        Regulação: citrato sintase, isocitrato DH e α-cetoglutarato DH — inibidas por NADH, ATP, succinil-CoA.
      </p>
    </div>

    <!-- Cadeia respiratória -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Cadeia respiratória e fosforilação oxidativa
    </h3>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr));margin-bottom:var(--space-4)">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Complexo I (NADH-Q oxidorredutase)</h3>
        <p style="font-size:var(--text-sm)">NADH → NAD⁺ + 2e⁻ → ubiquinona (Q). Bombeia 4 H⁺ para o espaço intermembranar. Inibido por rotenona (insecticida), barbitúricos.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Complexo II (Succinato-Q)</h3>
        <p style="font-size:var(--text-sm)">FADH₂ → FAD + 2e⁻ → ubiquinona. Não bombeia H⁺. Gera menos ATP que NADH (FADH₂ → ~1,5 ATP vs NADH → ~2,5 ATP). A succinato DH é também a etapa 6 do ciclo de Krebs — enzima bifuncional.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Complexo III (Q-citocromo c)</h3>
        <p style="font-size:var(--text-sm)">Ubiquinol (QH₂) → citocromo c (Fe²⁺→Fe³⁺). Bombeia 4 H⁺ (via ciclo Q). Inibido por antimicina A. O citocromo c é um portador solúvel na membrana externa — alvo de apoptose (liberação → ativa caspases).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Complexo IV (citocromo c oxidase) e ATP sintase</h3>
        <p style="font-size:var(--text-sm)">4 cit.c + O₂ + 4H⁺ → 2H₂O. Bombeia 2 H⁺. Inibido por CN⁻, CO, N₃⁻ (ligam ao Fe³⁺ do heme a₃). ATP sintase: gradiente H⁺ (força próton-motriz) → rotação do rotor → síntese de ATP. ~3 H⁺ por ATP. Acoplamento quimiosmótico (Mitchell, Nobel 1978).</p>
      </div>
    </div>

    <!-- Calculadora de ATP -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Calculadora de rendimento em ATP
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;gap:.5rem;flex-wrap:wrap" id="substrate-btns">
        <button class="btn btn-xs btn-secondary" data-substrate="glucose">Glicose</button>
        <button class="btn btn-xs btn-ghost" data-substrate="palmitate">Palmitato (C16)</button>
        <button class="btn btn-xs btn-ghost" data-substrate="alanine">Alanina</button>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-top:.5rem">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">P/O ratio (H⁺/ATP):</span>
        <select id="po-ratio" style="background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-default);border-radius:var(--radius-sm);padding:.25rem .5rem;font-size:var(--text-sm)">
          <option value="2.5">Teórico (2,5 NADH)</option>
          <option value="2.0">Empírico (2,0 NADH)</option>
        </select>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">NADH total</p><div id="atp-nadh" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">FADH₂ total</p><div id="atp-fadh2" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">ATP total</p><div id="atp-total" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Eficiência (kJ ATP/kJ)</p><div id="atp-eff" style="font-size:var(--text-base);font-weight:600;color:var(--text-secondary)">—</div></div>
    </div>
  </section>

  <!-- Fotossíntese -->
  <section class="module-section">
    <h2 class="module-section-title">Fotossíntese</h2>
    <p class="module-text">
      A fotossíntese converte energia luminosa em energia química, produzindo glicose e O₂.
      Ocorre nos cloroplastos: reações de luz (tilacóides) e ciclo de Calvin (estroma).
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-organic);margin-bottom:.3rem">
        6CO₂ + 6H₂O + energia luminosa → C₆H₁₂O₆ + 6O₂ &nbsp;&nbsp;|&nbsp;&nbsp; ΔG° = +2870 kJ/mol
      </p>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Fotossistema II (PSII)</h3>
        <p style="font-size:var(--text-sm)">Absorve luz λ = 680 nm. Cloro P680 excitado → transfere e⁻ à plastoquinona. Complexo Mn₄CaO₅ oxida H₂O → O₂ + 4H⁺ + 4e⁻ (reação de Hill, liberação de O₂). Bombeamento de H⁺ pelo ciclo Q → ATP sintase do cloroplasto.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Fotossistema I (PSI)</h3>
        <p style="font-size:var(--text-sm)">Absorve λ = 700 nm. Cloro P700 excitado → reduz ferredoxina → NADP⁺ redutase → NADPH. O NADPH é o redutor para o ciclo de Calvin. Inibido por paraquat (herbicida): aceita e⁻ e reduz O₂ → superóxido radical (toxicidade).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Ciclo de Calvin (ciclo C3)</h3>
        <p style="font-size:var(--text-sm)">3 etapas: fixação (CO₂ + RuBP → 2× 3-fosfoglicerato, enzima RuBisCO), redução (3-PG + NADPH + ATP → G3P) e regeneração de RuBP (ATP). Por 1 CO₂ fixado: 3 ATP + 2 NADPH. Por glicose (6 CO₂): 18 ATP + 12 NADPH.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Plantas C4 e CAM</h3>
        <p style="font-size:var(--text-sm)">C4 (milho, cana): fixação prévia de CO₂ como oxaloacetato (PEP carboxilase, mesófilo) → descarboxilação no feixe (concentra CO₂ para RuBisCO, minimiza fotorrespiração). CAM (cactos, abacaxi): abertura estomatal noturna → fixação como malato → liberação diurna. Adaptações a calor e seca.</p>
      </div>
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
          markSectionDone('biochemistry', 'exercise');
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
}

// Dados de substrato para calculadora de ATP
const SUBSTRATES = {
  glucose: {
    label: 'Glicose',
    nadh: 10, fadh2: 2, subLevel: 2,   // 10 NADH, 2 FADH2, 2 GTP/ATP nível substrato
    deltaG: 2870,  // kJ/mol
  },
  palmitate: {
    label: 'Palmitato (C16)',
    // β-oxidação: 7 ciclos → 7 FADH2 + 7 NADH + 8 Acetil-CoA
    // 8 Acetil-CoA × ciclo Krebs (3 NADH + 1 FADH2 + 1 GTP)
    nadh: 7 + 24, fadh2: 7 + 8, subLevel: 8,
    deltaG: 9781,
  },
  alanine: {
    label: 'Alanina',
    // Alanina → piruvato (transaminação) → Acetil-CoA via PDH → 1 volta Krebs
    nadh: 1 + 3, fadh2: 1, subLevel: 1,
    deltaG: 1628,
  },
};

function _initATPCalc() {
  let _active = 'glucose';

  function calc() {
    const po    = parseFloat(document.getElementById('po-ratio')?.value ?? 2.5);
    const sub   = SUBSTRATES[_active];
    if (!sub) return;

    const fadh_factor = po * 0.6;  // FADH2 → ~1.5 ATP quando po=2.5
    const atp = sub.nadh * po + sub.fadh2 * fadh_factor + sub.subLevel;
    const atp_kJ = atp * 30.5;
    const eff = (atp_kJ / sub.deltaG * 100).toFixed(1);

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('atp-nadh',  sub.nadh);
    set('atp-fadh2', sub.fadh2);
    set('atp-total', atp.toFixed(1));
    set('atp-eff',   eff + '%');
  }

  document.querySelectorAll('[data-substrate]').forEach(btn => {
    btn.addEventListener('click', () => {
      _active = btn.dataset.substrate;
      document.querySelectorAll('[data-substrate]').forEach(b =>
        b.className = 'btn btn-xs ' + (b.dataset.substrate === _active ? 'btn-secondary' : 'btn-ghost'));
      calc();
    });
  });

  document.getElementById('po-ratio')?.addEventListener('change', calc);
  if (document.getElementById('atp-total')) calc();
}

export function destroy() { if(_loop){_loop.stop();_loop=null;} }
