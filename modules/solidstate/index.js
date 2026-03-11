/**
 * modules/solidstate/index.js — Módulo: Estado Sólido
 * Lavoisier — Laboratório Visual de Química
 *
 * Cobre Graduação 2º ano+:
 *  - Tipos de sólidos: iônico, covalente, metálico, molecular
 *  - Sistemas cristalinos e redes de Bravais
 *  - Células unitárias cúbicas: SC, BCC, FCC — átomos por célula, raio vs a
 *  - Empacotamento: eficiência de ocupação de espaço
 *  - Sólidos iônicos: estruturas NaCl, CsCl, ZnS (blenda), fluorita
 *  - Semicondutores intrínsecos vs extrínsecos (dopagem n e p)
 *  - Defeitos de Schottky e Frenkel
 *  - Canvas: visualização interativa de células unitárias cúbicas
 */

import { esc }                from '../../js/ui.js';
import { markSectionDone }    from '../../js/state.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

// ---------------------------------------------------------------------------
// Dados — células unitárias cúbicas
// ---------------------------------------------------------------------------

const CUBIC_CELLS = [
  {
    id:   'sc',
    name: 'Cúbico Simples (SC)',
    color: '#4fc3f7',
    atoms_per_cell: 1,
    coordination:   6,
    packing_eff:    0.524,
    radius_a:       '0,500',
    formula: 'Átomos: 8 cantos × ⅛ = 1. r = a/2.',
    examples: 'Po (polônio) — único metal SC à T amb. Estrutura rara (baixo empacotamento).',
    positions: [
      [0,0,0],[1,0,0],[0,1,0],[1,1,0],
      [0,0,1],[1,0,1],[0,1,1],[1,1,1],
    ],
  },
  {
    id:   'bcc',
    name: 'Cúbico de Corpo Centrado (BCC)',
    color: '#ffd166',
    atoms_per_cell: 2,
    coordination:   8,
    packing_eff:    0.680,
    radius_a:       '0,433',
    formula: 'Átomos: 8 cantos × ⅛ + 1 centro = 2. r = a√3/4.',
    examples: 'Fe (α), Na, K, W, Cr, Mo. Metais alcalinos e muitos metais de transição.',
    positions: [
      [0,0,0],[1,0,0],[0,1,0],[1,1,0],
      [0,0,1],[1,0,1],[0,1,1],[1,1,1],
      [0.5,0.5,0.5],
    ],
  },
  {
    id:   'fcc',
    name: 'Cúbico de Face Centrada (FCC)',
    color: '#6bcb77',
    atoms_per_cell: 4,
    coordination:   12,
    packing_eff:    0.741,
    radius_a:       '0,354',
    formula: 'Átomos: 8 cantos × ⅛ + 6 faces × ½ = 4. r = a√2/4.',
    examples: 'Cu, Ag, Au, Al, Ni, Pt. Empacotamento ABCABC. Máximo para esferas duras (juntamente com HCP).',
    positions: [
      [0,0,0],[1,0,0],[0,1,0],[1,1,0],
      [0,0,1],[1,0,1],[0,1,1],[1,1,1],
      [0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],
      [0.5,0.5,1],[0.5,1,0.5],[1,0.5,0.5],
    ],
  },
];

// ---------------------------------------------------------------------------
// Estruturas iônicas
// ---------------------------------------------------------------------------

const IONIC_STRUCTURES = [
  {
    name: 'NaCl (halita)',
    formula: 'NaCl',
    color_a: '#4fc3f7', color_b: '#ef476f',
    label_a: 'Cl⁻', label_b: 'Na⁺',
    cn_a: 6, cn_b: 6,
    desc: 'Dois FCC interpenetrados. Cada Na⁺ coordenado por 6 Cl⁻ e vice-versa (CN = 6:6). Empacotamento de Cl⁻ (maior) FCC; Na⁺ ocupa interstícios octaédricos.',
    examples: 'NaCl, KCl, MgO, NiO, FeO.',
  },
  {
    name: 'CsCl',
    formula: 'CsCl',
    color_a: '#ffd166', color_b: '#a78bfa',
    label_a: 'Cl⁻', label_b: 'Cs⁺',
    cn_a: 8, cn_b: 8,
    desc: 'SC de Cl⁻ com Cs⁺ no centro do cubo (CN = 8:8). Não é BCC — dois íons diferentes. Favorecida quando r⁺/r⁻ > 0,732.',
    examples: 'CsCl, CsBr, CsI, TlCl.',
  },
  {
    name: 'ZnS — Blenda de zinco',
    formula: 'ZnS',
    color_a: '#ffd166', color_b: '#6bcb77',
    label_a: 'S²⁻', label_b: 'Zn²⁺',
    cn_a: 4, cn_b: 4,
    desc: 'FCC de S²⁻; Zn²⁺ em metade dos interstícios tetraédricos (alternados). CN = 4:4. Estrutura com caráter covalente marcado.',
    examples: 'ZnS, GaAs, InP, ZnSe — semicondutores importantes.',
  },
  {
    name: 'Fluorita (CaF₂)',
    formula: 'CaF₂',
    color_a: '#4fc3f7', color_b: '#ef476f',
    label_a: 'Ca²⁺', label_b: 'F⁻',
    cn_a: 8, cn_b: 4,
    desc: 'FCC de Ca²⁺; F⁻ ocupa TODOS os interstícios tetraédricos. Razão estequiométrica 1:2 → CN(Ca)=8, CN(F)=4. Antifluorita: posições trocadas (Li₂O, Na₂O).',
    examples: 'CaF₂, BaF₂, UO₂, CeO₂, ThO₂.',
  },
];

// ---------------------------------------------------------------------------
// Semicondutores
// ---------------------------------------------------------------------------

const SEMICONDUCTOR_DATA = [
  { material: 'Si', Eg: 1.12, type: 'intrínseco', color: '#4fc3f7', app: 'Transistores MOSFET, painéis fotovoltaicos' },
  { material: 'Ge', Eg: 0.67, type: 'intrínseco', color: '#4fc3f7', app: 'Primeiros transistores; diodos de alta freq.' },
  { material: 'GaAs', Eg: 1.43, type: 'intrínseco', color: '#6bcb77', app: 'LEDs, laser, células solares de alta eficiência' },
  { material: 'Si:P (n)', Eg: 1.12, type: 'tipo n', color: '#ffd166', app: 'Dopagem com fósforo (grupo 15) — elétrons extras' },
  { material: 'Si:B (p)', Eg: 1.12, type: 'tipo p', color: '#ef476f', app: 'Dopagem com boro (grupo 13) — lacunas (holes)' },
  { material: 'ZnO', Eg: 3.37, type: 'banda larga', color: '#a78bfa', app: 'LEDs UV, protetor solar (nanopartículas), piezo' },
];

const EXERCISES = [
  {
    q: 'Quantos átomos por célula unitária tem uma estrutura FCC (cúbico de face centrada)?',
    opts: ['1', '2', '4', '6'],
    ans: 2,
    exp: 'FCC: 8 cantos × ⅛ = 1, mais 6 faces × ½ = 3. Total = 1 + 3 = 4 átomos/célula. Isso determina a densidade e os parâmetros de rede.',
    hint: 'Cada átomo de canto é compartilhado por 8 células; cada átomo de face por 2 células.',
  },
  {
    q: 'Na estrutura do NaCl, qual é o número de coordenação de cada íon?',
    opts: ['4:4 (tetraédrico)', '6:6 (octaédrico)', '8:8 (cúbico)', '12:6'],
    ans: 1,
    exp: 'NaCl: dois FCC interpenetrados. Cada Na⁺ é circundado por 6 Cl⁻ (octaédrico) e vice-versa. CN = 6:6. Isso maximiza as atrações eletrostáticas para a razão de raios r⁺/r⁻ ≈ 0,564 do NaCl.',
    hint: 'Visualize o cubo: um íon no centro de uma face tem quantos vizinhos do tipo oposto ao redor?',
  },
  {
    q: 'Um semicondutor do tipo p é obtido dopando silício com:',
    opts: [
      'Fósforo (grupo 15) — doa elétrons',
      'Boro (grupo 13) — cria lacunas (holes)',
      'Arsênio (grupo 15) — doa elétrons',
      'Germânio (grupo 14) — isoestrutura',
    ],
    ans: 1,
    exp: 'Boro (grupo 13, 3 elétrons de valência) em substituição ao Si (4 e.v.) cria uma "lacuna" (ausência de elétron) na banda de valência. As lacunas são portadores positivos → tipo p. Fósforo e arsênio (grupo 15, 5 e.v.) doam elétrons → tipo n.',
    hint: 'Tipo p = lacunas positivas. Qual elemento tem menos elétrons de valência que o Si (4)?',
  },

  { q: 'Quantos átomos por célula unitária tem o arranjo FCC (cúbico de face centrada)?', opts: ['2','4','6','8'], ans: 1, exp: 'FCC: 8 átomos nos vértices (×1/8 cada) + 6 faces (×1/2 cada) = 1 + 3 = 4 átomos/célula.', hint: 'Átomo em vértice compartilha 8 células; em face compartilha 2.' },
  { q: 'A dopagem tipo p em Si introduz:', opts: ['Elétrons livres extras','Lacunas (holes) por átomos do grupo 13','Níveis doadores acima da banda de valência','Aumento da condutividade pelo excesso de e⁻'], ans: 1, exp: 'Grupo 13 (B, Al, Ga) tem 3 e⁻ de valência; falta 1 para o Si (4 e⁻). A lacuna criada age como portador de carga positivo.', hint: 'Tipo p: portadores são positivos (lacunas). Que grupo fornece átomos com menos elétrons que Si?' },,
  { q:'A distância interplanar d(200) do NaCl (a=5,64 Å) pela equação de Bragg com λ=1,54 Å e 2θ=31,7° é verificada por:', opts:['Bragg: nλ=2d·sinθ → d=nλ/(2sinθ)=1×1,54/(2×0,263)=2,82 Å = a/2','d = a = 5,64 Å','d = 2a = 11,28 Å','d = a/4 = 1,41 Å'], ans:0, exp:'d(hkl) = a/√(h²+k²+l²). Para (200): d = 5,64/√4 = 2,82 Å. Verificação por Bragg: 2θ=31,7° → θ=15,85°. nλ=2d·sinθ = 2×2,82×0,273 = 1,54 Å = λ. ✓', hint:'d(hkl) = a/√(h²+k²+l²). Bragg: nλ = 2d·sinθ.' },
  { q:'O empacotamento CFC (cúbico de faces centradas) tem fator de empacotamento de ~74% porque:', opts:['As esferas são muito pequenas','Esferas rígidas empacotadas em arranjo hexagonal atingem o máximo teórico de 74% do volume preenchido','As células unitárias são muito grandes','O FCC tem apenas 4 átomos por célula unitária — menos que HCP'], ans:1, exp:'FCC e HCP têm o mesmo fator de empacotamento máximo de π/(3√2) ≈ 74,05% (teorema de Kepler, provado por Hales em 2005). SC: 52%. BCC: 68%. FCC/HCP: 74%. No FCC, os átomos se tocam ao longo da diagonal das faces: 4r = a√2.', hint:'FCC e HCP têm empacotamento máximo de 74%. SC: 52%. BCC: 68%.' },
  { q:'A condutividade de semicondutores aumenta com a temperatura porque:', opts:['Os elétrons se movem mais rápido no calor','Mais elétrons são excitados através do gap (Eg) para a banda de condução — concentração de portadores cresce exponencialmente','Os átomos vibram menos e não dispersam os elétrons','O gap de energia diminui linearmente com T'], ans:1, exp:'n ∝ exp(-Eg/2kT) (lei de Arrhenius para portadores intrínsicos). Maior T → mais elétrons com E suficiente para cruzar o gap → maior condutividade. Oposto dos metais (maior T → mais vibração → mais espalhamento → menor condutividade).', hint:'Semicondutor: T↑ → n de portadores ↑ exponencialmente (Arrhenius). Metal: T↑ → resistência ↑.' },
  { q:'Na estrutura do diamante, cada átomo de C está em geometria:', opts:['Octaédrica (6 vizinhos)','Tetraédrica (4 vizinhos, sp³, ângulos 109,5°)','Planar quadrada','Trigonal plana'], ans:1, exp:'Diamante: C em hibridização sp³, 4 ligações C-C tetraédricas (109,5°). Rede covalente 3D extremamente rígida → material mais duro da natureza. Grafite: C sp² com camadas aromáticas planas (ligações fortes intracamada) e interações de van der Waals fracas entre camadas.', hint:'Diamante: sp³, tetrahedral. Grafite: sp², hexagonal planar.' },
  { q:'O defeito de Schottky em um cristal iônico é:', opts:['Um átomo estranho intersticial','Par de lacunas (vacância de cátion + vacância de ânion) mantendo a eletroneutralidade','Deslocamento de íon para posição intersticial (Frenkel)','Impureza substituindo o íon'], ans:1, exp:'Schottky: remoção de par íon⁺ + íon⁻ para a superfície, criando par de vacâncias. Mantém eletroneutralidade. Aumenta com temperatura (mais energia para remover íons). Aumenta a condutividade iônica (vacâncias permitem migração). Frenkel: íon se desloca para posição intersticial (não há vacância dupla, sem perda de íons).', hint:'Schottky: par de vacâncias. Frenkel: íon intersticial + vacância. Ambos preservam eletroneutralidade.' },
  { q:'A dopagem tipo n de Si com fósforo (P, grupo 15) cria:', opts:['Lacunas na banda de valência (portadores positivos)','Elétrons extras próximo da banda de condução (doadores) — portadores negativos majoritários','Dupla camada de depleção','Nenhuma mudança na condutividade'], ans:1, exp:'P tem 5 elétrons de valência; Si precisa de 4. O 5° elétron do P fica frouxamente ligado (nível doador logo abaixo da banda de condução). Com pouca energia térmica, esse elétron vai para a banda de condução → portador negativo (n). Boron (grupo 13): 3 e⁻ → nível aceptor → lacunas → tipo p.', hint:'Grupo 15 em Si: elétron extra → tipo n (doador). Grupo 13: lacuna → tipo p (aceptor).' },
  { q:'Qual a relação entre o parâmetro de rede a e o raio atômico r no empacotamento BCC?', opts:['a = 2r','a = 2√2 r','a = 4r/√3','a = 4r/√2'], ans:2, exp:'BCC: átomos se tocam ao longo da diagonal do corpo (de canto a canto passando pelo centro). Diagonal do cubo = 4r = a√3. Logo a = 4r/√3.', hint:'BCC: diagonal do cubo (a√3) = 4r. Logo a = 4r/√3.' },
  { q:'A birrefringência em cristais é causada por:', opts:['Alta condutividade elétrica','Índices de refração diferentes ao longo de eixos cristalinos distintos — divide a luz em raios ordinário e extraordinário','Absorção de luz UV','Alta dureza na escala de Mohs'], ans:1, exp:'Em cristais anisotrópicos (não-cúbicos), a velocidade da luz e o índice de refração dependem da direção de propagação e polarização → birrefringência (dupla refração). Calcita: no = 1,658, ne = 1,486. Usado em polarizadores ópticos (Nicol, Wollaston) e em mineralogia por microscopia petrográfica.', hint:'Birrefringência: cristal com n diferente por direção → divide o raio de luz em dois.' },
  { q:'A dureza de Mohs do diamante (10) é maior que a do quartzo (7) porque:', opts:['Diamante tem maior densidade','Diamante tem rede covalente 3D de C-C (ligações fortes em todas as direções); quartzo tem estrutura mista Si-O com caráter iônico/covalente','Diamante é mais pesado','Quartzo tem defeitos que o enfraquecem'], ans:1, exp:'Dureza de Mohs = resistência ao risco. Diamante: rede covalente 3D pura (apenas C-C sp³). Para riscar, é necessário romper ligações C-C. Quartzo (SiO₂): rede Si-O parcialmente iônica, menos resistente. Correlação: energia de ligação e densidade de ligações por volume.', hint:'Dureza ≈ resistência a rompimento de ligações. C-C no diamante: máxima energia de ligação.' },
  { q:'O modelo de bandas de energia explica por que metais são condutores, isolantes são não-condutores e semicondutores são intermediários, baseado em:', opts:['Diferença de densidade entre os sólidos','A largura do gap (Eg) entre a banda de valência (preenchida) e a de condução (vazia): metal Eg=0, semicondutor Eg≈1 eV, isolante Eg>5 eV','O número de elétrons por átomo','A temperatura de fusão do material'], ans:1, exp:'Metal: banda de condução parcialmente preenchida (ou valência e condução se sobrepõem) → Eg=0 → conduz. Semicondutor (Si, Ge, GaAs): Eg≈1 eV → a 300K, kT≈0,026 eV → pequena fração cruza → semicondutor. Isolante (diamante, SiO₂): Eg>5 eV → kT insuficiente → sem portadores.', hint:'kT a 300K ≈ 0,026 eV. Se Eg >> kT: isolante. Se Eg ≈ kT a 1 eV: semicondutor. Eg=0: metal.' }
];

let _cellIdx  = 0;
let _ionIdx   = 0;
let _exIdx    = 0;
let _exAttempts = 0;
let _exDone   = false;
let _angle    = 0;
let _loop     = null;

// ---------------------------------------------------------------------------
export function render(outlet) {
  if (_loop) { _loop.stop(); _loop = null; }
  _cellIdx = 0; _ionIdx = 0;
  _exIdx = 0; _exAttempts = 0; _exDone = false; _angle = 0;

  outlet.innerHTML = _buildHTML();
  _initSolidState();
  _initBragg();
  markSectionDone('solidstate', 'visited');
}

// ---------------------------------------------------------------------------
function _buildHTML() {
  return `
<div class="module-page" id="module-solidstate">
  <button class="module-back btn-ghost" data-nav="/modules">&#8592; Módulos</button>

  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
           stroke-width="1.8" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M2 7l10-5 10 5"/><line x1="12" y1="2" x2="12" y2="21"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Estado Sólido</h1>
      <p class="module-subtitle">Redes cristalinas, células unitárias, estruturas iônicas e semicondutores.</p>
    </div>
  </header>

  <!-- ============================================================
       TIPOS DE SÓLIDOS
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Tipos de sólidos cristalinos</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Iônico</h3>
        <p style="font-size:var(--text-sm)">Cátions e ânions em rede. Forças eletrostáticas fortes. Alto PE, alta dureza, frágeis. Isolantes no estado sólido; condutores em fusão ou solução. Ex: NaCl, MgO, CaF₂.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Covalente (rede)</h3>
        <p style="font-size:var(--text-sm)">Ligações covalentes estendidas em toda a rede. Dureza extrema, altíssimo PE. Isolantes (diamante) ou semicondutores (Si, Ge). Ex: diamante, grafite, SiO₂, SiC.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Metálico</h3>
        <p style="font-size:var(--text-sm)">Cátions metálicos em "mar de elétrons". Boa condutividade elétrica e térmica. Maleável e dúctil (camadas deslizam sem quebrar ligações). Ex: Fe, Cu, Al.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Molecular</h3>
        <p style="font-size:var(--text-sm)">Moléculas mantidas por forças de Van der Waals ou LH. Baixo PE, macios. Isolantes. Ex: gelo, naftaleno, CO₂ sólido, sacarose.</p>
      </div>
    </div>
  </section>

  <!-- ============================================================
       CÉLULAS UNITÁRIAS CÚBICAS — CANVAS
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Células unitárias cúbicas</h2>
    <p class="module-text">
      A célula unitária é o menor bloco que, repetido em 3D, gera todo o cristal.
      Nos sistemas cúbicos há três variantes com eficiências de empacotamento crescentes.
    </p>
    <div id="cell-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:var(--space-4)">
      ${CUBIC_CELLS.map((c, i) => `
        <button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="cell-tab-${i}" data-cell="${i}">
          ${esc(c.id.toUpperCase())}</button>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:var(--space-5);align-items:start">
      <div class="canvas-frame" id="cell-frame" style="min-height:200px;min-width:200px">
        <canvas id="cell-canvas" width="200" height="200" aria-label="Célula unitária"></canvas>
      </div>
      <div id="cell-info" class="info-card" style="background:var(--bg-raised)"></div>
    </div>

    <div style="overflow-x:auto;margin-top:var(--space-5)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Estrutura</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Átomos/célula</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">CN</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">r/a</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Empac. (%)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Exemplos</th>
          </tr>
        </thead>
        <tbody>
          ${CUBIC_CELLS.map(c => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-weight:600;color:${c.color}">${esc(c.name.split(' ').slice(0,3).join(' '))}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-electron)">${c.atoms_per_cell}</td>
            <td style="padding:.4rem .6rem;font-family:monospace">${c.coordination}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs)">${c.radius_a}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-organic)">${(c.packing_eff*100).toFixed(1)}%</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-secondary)">${esc(c.examples.split('.')[0])}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- ============================================================
       ESTRUTURAS IÔNICAS
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Estruturas iônicas clássicas</h2>
    <p class="module-text">
      A estrutura adotada depende da razão de raios r⁺/r⁻ e da estequiometria.
      Regra empírica: r⁺/r⁻ &lt; 0,414 → tetraédrico (CN=4); 0,414–0,732 → octaédrico (CN=6); &gt; 0,732 → cúbico (CN=8).
    </p>
    <div id="ion-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:var(--space-4)">
      ${IONIC_STRUCTURES.map((s, i) => `
        <button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="ion-tab-${i}" data-ion="${i}">
          ${esc(s.formula)}</button>`).join('')}
    </div>
    <div id="ion-info" class="info-card" style="background:var(--bg-raised)"></div>
  </section>

  <!-- ============================================================
       SEMICONDUTORES
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Semicondutores e teoria de bandas</h2>
    <p class="module-text">
      Em sólidos, os orbitais atômicos combinam em <strong>bandas de energia</strong>: banda de
      valência (preenchida) e banda de condução (vazia). O <strong>gap de banda (E<sub>g</sub>)</strong>
      separa as duas. Condutores: sem gap ou bandas sobrepostas. Isolantes: E<sub>g</sub> &gt; 5 eV.
      Semicondutores: 0 &lt; E<sub>g</sub> &lt; ~3 eV — condução por ativação térmica ou
      dopagem.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Semicondutor intrínseco</h3>
        <p style="font-size:var(--text-sm)">Material puro. Elétrons promovidos termicamente por cima do gap. n<sub>e</sub> = n<sub>h</sub>. Condutividade aumenta com T (oposto a metais). Ex: Si puro, Ge puro.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Tipo n (donor)</h3>
        <p style="font-size:var(--text-sm)">Dopagem com átomo do grupo 15 (P, As, Sb). Elétron extra ocupa nível raso abaixo da banda de condução → facilmente ionizado. Maioria: elétrons.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Tipo p (acceptor)</h3>
        <p style="font-size:var(--text-sm)">Dopagem com átomo do grupo 13 (B, Al, Ga). Nível de aceitador acima da banda de valência → lacunas (holes). Maioria: lacunas positivas.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Junção p-n</h3>
        <p style="font-size:var(--text-sm)">Interface p-n cria campo elétrico interno. Diodo: condutor em polarização direta, bloqueio em reverso. LED: recombinação e⁻/lacuna emite fóton (E = hν = E<sub>g</sub>). Solar: fóton cria par e⁻/lacuna.</p>
      </div>
    </div>

    <div style="overflow-x:auto;margin-top:var(--space-5)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Material</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Eₘ (eV)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Tipo</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Aplicações</th>
          </tr>
        </thead>
        <tbody>
          ${SEMICONDUCTOR_DATA.map(s => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;font-weight:600;color:${s.color}">${esc(s.material)}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-electron)">${s.Eg.toFixed(2)}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${esc(s.type)}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-secondary)">${esc(s.app)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- ============================================================
       DEFEITOS
  ============================================================ -->
  <!-- Cristalografia de raios-X -->
  <section class="module-section">
    <h2 class="module-section-title">Cristalografia de raios-X — lei de Bragg e índices de Miller</h2>
    <p class="module-text">
      Raios-X têm comprimento de onda comparável ao espaçamento interplanar dos cristais
      (1–3 Å). A difração ocorre quando a diferença de caminho entre raios refletidos em
      planos paralelos é um número inteiro de λ — condição de Bragg.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        2 d_hkl · sin θ = n·λ &nbsp;&nbsp;&nbsp; Lei de Bragg (1913, Nobel 1915)
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        d_hkl = espaçamento entre planos {hkl}. θ = ângulo de Bragg (ângulo de incidência = reflexão).<br>
        n = ordem da difração (inteiro). λ tipicamente Kα de Cu = 1,5406 Å ou Mo = 0,7107 Å.<br>
        Medindo 2θ → d_hkl → identifica a estrutura cristalina (fingerprint) e parâmetro de rede a.
      </p>
    </div>

    <!-- Índices de Miller -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Índices de Miller {hkl}
    </h3>
    <p class="module-text">
      Os índices de Miller (h, k, l) descrevem planos cristalinos: são os recíprocos das
      interseções do plano com os eixos cristalográficos, reduzidos ao menor inteiro.
      Plano (100): corta a em 1, paralelo b e c. Plano (110): corta a e b em 1, paralelo c.
      Plano (111): corta todos os eixos em 1.
    </p>
    <div style="overflow-x:auto;margin-bottom:var(--space-5)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Plano</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">d_hkl cúbico</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">d (Å) para Fe (a=2,87 Å)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">2θ para Cu Kα</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Observação</th>
          </tr>
        </thead>
        <tbody>
          ${(()=>{
            const planes = [
              [[1,1,0],'Mais intenso em BCC (Fe)'],
              [[2,0,0],'Permitido em BCC'],
              [[2,1,1],'Mais intenso em BCC'],
              [[1,1,1],'Mais intenso em FCC (Cu, Al)'],
              [[2,0,0],'2° pico FCC'],
              [[2,2,0],'3° pico FCC'],
              [[3,1,1],'Pico diagnóstico FCC'],
            ];
            const a_Fe = 2.87; // Å
            const lambda = 1.5406; // Cu Kα em Å
            return planes.map(_entry => { const [[h,k,l],note]=_entry;
              const d = a_Fe / Math.sqrt(h*h+k*k+l*l);
              const sinT = lambda / (2*d);
              const theta2 = sinT <= 1 ? (2*Math.asin(sinT)*180/Math.PI).toFixed(2)+'°' : '—';
              const dFml = `a/√(h²+k²+l²)`;
              return `<tr style="border-bottom:1px solid var(--border-subtle)">
                <td style="padding:.4rem .6rem;font-family:monospace;font-weight:700;color:var(--accent-electron)">(${h}${k}${l})</td>
                <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs);color:var(--text-muted)">a/√${h*h+k*k+l*l}</td>
                <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-bond)">${d.toFixed(3)} Å</td>
                <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-organic)">${theta2}</td>
                <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${note}</td>
              </tr>`;
            }).join('');
          })()}
        </tbody>
      </table>
    </div>

    <!-- Calculadora de Bragg -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Calculadora de Lei de Bragg
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">λ (Å):</span>
        <select id="bragg-lambda" style="background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-default);border-radius:var(--radius-sm);padding:.25rem .5rem;font-size:var(--text-sm)">
          <option value="1.5406">Cu Kα (1,5406 Å)</option>
          <option value="0.7107">Mo Kα (0,7107 Å)</option>
          <option value="1.7902">Co Kα (1,7902 Å)</option>
          <option value="2.2897">Cr Kα (2,2897 Å)</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">Parâmetro de rede a (Å):</span>
        <input type="range" id="bragg-a" min="2.0" max="10.0" step="0.01" value="3.62"
               style="width:130px;accent-color:var(--accent-electron)">
        <span id="bragg-a-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">3,62 Å</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">Plano (h k l):</span>
        <select id="bragg-hkl" style="background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-default);border-radius:var(--radius-sm);padding:.25rem .5rem;font-size:var(--text-sm)">
          ${['100','110','111','200','210','211','220','221','300','311'].map(v=>`<option value="${v}">(${v[0]} ${v[1]} ${v[2]})</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">d_hkl (Å)</p><div id="bragg-d" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">θ (graus)</p><div id="bragg-theta" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">2θ (graus)</p><div id="bragg-2theta" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Status</p><div id="bragg-status" style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary)">—</div></div>
    </div>

    <!-- Extinções sistemáticas -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:var(--space-6);margin-bottom:var(--space-3)">
      Extinções sistemáticas — regras de seleção de planos
    </h3>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Rede</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Condição de reflexão (planos permitidos)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Extintos quando</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Exemplo</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['SC (cúbica simples)','Todos os {hkl}','—','Po (único metal SC a T amb.)'],
            ['BCC (cúbica de corpo centrado)','h+k+l = par','h+k+l = ímpar','Fe, W, Mo, Cr'],
            ['FCC (cúbica de face centrada)','h,k,l todos pares OU todos ímpares','mistos (ex: 100, 110)','Cu, Al, Ni, Au'],
            ['Diamante (FCC + base)','FCC + h+k+l ≠ 4n+2 quando todos ímpares','Adicionais','Si, Ge, diamante'],
          ].map(_r => { const [r,per,ext,ex]=_r; return `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-weight:600;color:var(--accent-electron)">${r}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs);color:var(--accent-organic)">${per}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs);color:var(--accent-reaction)">${ext}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${ex}</td>
          </tr>`; }).join('')}
        </tbody>
      </table>
    </div>
  </section>


  <section class="module-section">
    <h2 class="module-section-title">Defeitos cristalinos</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Defeito de Schottky</h3>
        <p style="font-size:var(--text-sm)">Par de vacâncias (cátion + ânion removidos para a superfície). Mantém eletroneutralidade. Favorecido quando íons são de tamanho similar. Predominante em NaCl, KCl, MgO.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Defeito de Frenkel</h3>
        <p style="font-size:var(--text-sm)">Íon deslocado para interstício (vacância + íon intersticial). Mantém eletroneutralidade. Favorecido quando cátion é muito menor que ânion. Ex: AgCl (Ag⁺ intersticial).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Defeitos de linha (deslocamentos)</h3>
        <p style="font-size:var(--text-sm)">Planos de átomos parcialmente extras (deslocamento de borda) ou hélice atômica (deslocamento de parafuso). Controlam propriedades mecânicas dos metais — deformação plástica ocorre por movimento de deslocamentos.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Importância tecnológica</h3>
        <p style="font-size:var(--text-sm)">Defeitos controlam: condutividade iônica (baterias de estado sólido), cor de gemas (impurezas em Al₂O₃ → rubi/safira), resistência mecânica (forjamento cria e bloqueia deslocamentos) e catálise (sítios ativos em superfície).</p>
      </div>
    </div>
  </section>

  <!-- ============================================================
       EXERCÍCIOS
  ============================================================ -->
  <section class="module-section" id="exercise-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/${EXERCISES.length})</h2>
    <p class="module-text" id="ex-question">${esc(EXERCISES[0].q)}</p>
    <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;max-width:480px;margin-top:var(--space-4)">
      ${EXERCISES[0].opts.map((o, i) => `
        <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
                data-exopt="${i}">${esc(o)}</button>`).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:var(--space-4)"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next" style="margin-top:var(--space-4);display:none">
      Próximo &#8594;</button>
  </section>
</div>`;
}

// ---------------------------------------------------------------------------
// Canvas — célula unitária (projeção ortográfica oblíqua)
// ---------------------------------------------------------------------------
function _drawCell(ctx, W, H, cell, angle) {
  clearCanvas(ctx, W, H);
  const cx = W * 0.45, cy = H * 0.5;
  const a = Math.min(W, H) * 0.3;
  const ISO = 0.4; // fator isométrico

  // 3D → 2D oblíquo
  function to2D(x, y, z) {
    const ox = x - 0.5, oy = y - 0.5, oz = z - 0.5;
    const rx = ox * Math.cos(angle) - oz * Math.sin(angle);
    const rz = ox * Math.sin(angle) + oz * Math.cos(angle);
    return {
      sx: cx + (rx + rz * ISO) * a,
      sy: cy + (-oy + rz * ISO * 0.5) * a,
    };
  }

  // Cube edges
  const edges = [
    [[0,0,0],[1,0,0]],[[0,1,0],[1,1,0]],[[0,0,1],[1,0,1]],[[0,1,1],[1,1,1]],
    [[0,0,0],[0,1,0]],[[1,0,0],[1,1,0]],[[0,0,1],[0,1,1]],[[1,0,1],[1,1,1]],
    [[0,0,0],[0,0,1]],[[1,0,0],[1,0,1]],[[0,1,0],[0,1,1]],[[1,1,0],[1,1,1]],
  ];
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
  edges.forEach(([a0, a1]) => {
    const p0 = to2D(...a0), p1 = to2D(...a1);
    ctx.beginPath(); ctx.moveTo(p0.sx, p0.sy); ctx.lineTo(p1.sx, p1.sy); ctx.stroke();
  });

  // Atoms
  cell.positions.forEach(([x, y, z]) => {
    const isCorner = (x === 0 || x === 1) && (y === 0 || y === 1) && (z === 0 || z === 1);
    const isFace   = !isCorner && (x === 0.5 && (y === 0 || y === 1 || y === 0.5)) ||
                     (y === 0.5 && (x === 0 || x === 1 || x === 0.5)) ||
                     (z === 0.5 && (x === 0 || x === 1) && (y === 0 || y === 1));
    const r = isCorner ? 5 : (x === 0.5 && y === 0.5 && z === 0.5) ? 8 : 6;
    const p = to2D(x, y, z);
    ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
    ctx.fillStyle = cell.color + (isCorner ? '99' : 'cc');
    ctx.fill();
    ctx.strokeStyle = cell.color; ctx.lineWidth = 1.2; ctx.stroke();
  });

  // Label
  ctx.fillStyle = cell.color; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(cell.name.split('(')[0].trim(), cx, H - 8);
}

// ---------------------------------------------------------------------------
function _initSolidState() {
  // Cell canvas
  const canvas = document.getElementById('cell-canvas');
  if (canvas) {
    const W = 200, H = 200;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);

    function renderCell(idx) {
      const cell = CUBIC_CELLS[idx];
      document.getElementById('cell-info').innerHTML = `
        <div style="font-size:var(--text-base);font-weight:700;color:${cell.color};margin-bottom:.4rem">${esc(cell.name)}</div>
        <p style="font-size:var(--text-xs);font-family:monospace;color:var(--accent-electron);margin:.2rem 0">${esc(cell.formula)}</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.4rem 0">${esc(cell.examples)}</p>`;
      CUBIC_CELLS.forEach((_, j) => {
        const b = document.getElementById('cell-tab-' + j);
        if (b) b.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
      });
    }
    renderCell(0);
    CUBIC_CELLS.forEach((_, i) =>
      document.getElementById('cell-tab-' + i)?.addEventListener('click', () => {
        _cellIdx = i; renderCell(i);
      }));

    const { SimLoop } = { SimLoop: null }; // reuse vanilla rAF instead
    let rafId = null;
    function animate() {
      _angle += 0.008;
      _drawCell(ctx, W, H, CUBIC_CELLS[_cellIdx], _angle);
      rafId = requestAnimationFrame(animate);
    }
    animate();
    // Store cancel handle for destroy
    canvas._stopAnim = () => { if (rafId) cancelAnimationFrame(rafId); };
  }

  // Ionic structures
  function renderIon(idx) {
    const s = IONIC_STRUCTURES[idx];
    document.getElementById('ion-info').innerHTML = `
      <div style="display:flex;gap:.75rem;align-items:baseline;flex-wrap:wrap;margin-bottom:.5rem">
        <span style="font-size:var(--text-base);font-weight:700;color:var(--accent-electron)">${esc(s.name)}</span>
        <span style="font-size:var(--text-xs);background:var(--bg-base);padding:2px 8px;border-radius:99px;
              border:1px solid var(--border-default);color:var(--text-muted)">CN ${s.cn_a}:${s.cn_b}</span>
      </div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:.4rem">${esc(s.desc)}</p>
      <p style="font-size:var(--text-xs);color:var(--text-muted)"><strong>Exemplos:</strong> ${esc(s.examples)}</p>`;
    IONIC_STRUCTURES.forEach((_, j) => {
      const b = document.getElementById('ion-tab-' + j);
      if (b) b.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
    });
  }
  renderIon(0);
  IONIC_STRUCTURES.forEach((_, i) =>
    document.getElementById('ion-tab-' + i)?.addEventListener('click', () => { _ionIdx = i; renderIon(i); }));

  // Exercises
  function loadEx(idx) {
    const ex = EXERCISES[idx];
    if (!ex) return;
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
    optsEl.innerHTML = ex.opts.map((o, i) => `
      <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
              data-exopt="${i}">${esc(o)}</button>`).join('');
    optsEl.querySelectorAll('[data-exopt]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (_exDone) return;
        _exAttempts++;
        const choice = parseInt(btn.dataset.exopt, 10);
        const fb2 = document.getElementById('exercise-feedback');
        if (choice === ex.ans) {
          _exDone = true;
          btn.style.borderColor = 'var(--accent-organic)';
          btn.style.color = 'var(--accent-organic)';
          if (fb2) fb2.innerHTML = `<p class="feedback-correct">Correto! ${esc(ex.exp)}</p>`;
          markSectionDone('solidstate', 'exercise');
          const nxBtn = document.getElementById('ex-next');
          if (nxBtn && idx < EXERCISES.length - 1) nxBtn.style.display = 'inline-flex';
        } else {
          btn.style.borderColor = 'var(--accent-reaction)';
          btn.style.color = 'var(--accent-reaction)';
          if (fb2 && _exAttempts === 1)
            fb2.innerHTML = `<p class="feedback-hint">Dica: ${esc(ex.hint)}</p>`;
        }
      });
    });
  }
  loadEx(0);
  document.getElementById('ex-next')?.addEventListener('click', () => {
    _exIdx = Math.min(_exIdx + 1, EXERCISES.length - 1);
    loadEx(_exIdx);
  });
}

function _initBragg() {
  function update() {
    const lambda = parseFloat(document.getElementById('bragg-lambda')?.value ?? 1.5406);
    const a      = parseFloat(document.getElementById('bragg-a')?.value ?? 3.62);
    const hklStr = document.getElementById('bragg-hkl')?.value ?? '111';
    const h = parseInt(hklStr[0], 10);
    const k = parseInt(hklStr[1], 10);
    const l = parseInt(hklStr[2], 10);

    const d     = a / Math.sqrt(h*h + k*k + l*l);
    const sinT  = lambda / (2 * d);
    const set   = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    set('bragg-a-val', a.toFixed(2) + ' Å');
    set('bragg-d',     d.toFixed(4) + ' Å');

    if (sinT > 1) {
      set('bragg-theta',  '—');
      set('bragg-2theta', '—');
      set('bragg-status', 'Não difrata (λ > 2d)');
      const st = document.getElementById('bragg-status');
      if (st) st.style.color = 'var(--accent-reaction)';
    } else {
      const theta  = Math.asin(sinT) * 180 / Math.PI;
      set('bragg-theta',  theta.toFixed(3) + '°');
      set('bragg-2theta', (2*theta).toFixed(3) + '°');
      set('bragg-status', 'Difração permitida');
      const st = document.getElementById('bragg-status');
      if (st) st.style.color = 'var(--accent-organic)';
    }
  }

  if (document.getElementById('bragg-a')) {
    update();
    ['bragg-lambda','bragg-hkl'].forEach(id =>
      document.getElementById(id)?.addEventListener('change', update));
    document.getElementById('bragg-a')?.addEventListener('input', update);
  }
}

export function destroy() {
  const c = document.getElementById('cell-canvas');
  if (c && c._stopAnim) c._stopAnim();
}
