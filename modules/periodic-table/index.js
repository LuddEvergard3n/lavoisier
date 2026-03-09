/**
 * modules/periodic-table/index.js — Módulo: Tabela Periódica
 * Lavoisier — Laboratório Visual de Química
 *
 * Implementa:
 *  - Grade SVG interativa
 *  - Painel de detalhes do elemento selecionado
 *  - Filtro por categoria
 *  - Tendências periódicas
 *  - Exercício guiado com dicas progressivas
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';

/* -----------------------------------------------------------------------
   Dados dos elementos
----------------------------------------------------------------------- */
const ELEMENTS = [
  { z:1,  s:'H',  n:'Hidrogênio',    m:1.008,   p:1, g:1,  c:'nonmetal',        en:2.20, ie:1312, r:53  },
  { z:2,  s:'He', n:'Hélio',         m:4.003,   p:1, g:18, c:'noble-gas',       en:null, ie:2372, r:31  },
  { z:3,  s:'Li', n:'Lítio',         m:6.941,   p:2, g:1,  c:'alkali-metal',    en:0.98, ie:520,  r:167 },
  { z:4,  s:'Be', n:'Berílio',       m:9.012,   p:2, g:2,  c:'alkaline-earth',  en:1.57, ie:900,  r:112 },
  { z:5,  s:'B',  n:'Boro',          m:10.811,  p:2, g:13, c:'metalloid',       en:2.04, ie:801,  r:87  },
  { z:6,  s:'C',  n:'Carbono',       m:12.011,  p:2, g:14, c:'nonmetal',        en:2.55, ie:1086, r:77  },
  { z:7,  s:'N',  n:'Nitrogênio',    m:14.007,  p:2, g:15, c:'nonmetal',        en:3.04, ie:1402, r:75  },
  { z:8,  s:'O',  n:'Oxigênio',      m:15.999,  p:2, g:16, c:'nonmetal',        en:3.44, ie:1314, r:73  },
  { z:9,  s:'F',  n:'Flúor',         m:18.998,  p:2, g:17, c:'halogen',         en:3.98, ie:1681, r:71  },
  { z:10, s:'Ne', n:'Neônio',        m:20.180,  p:2, g:18, c:'noble-gas',       en:null, ie:2081, r:69  },
  { z:11, s:'Na', n:'Sódio',         m:22.990,  p:3, g:1,  c:'alkali-metal',    en:0.93, ie:496,  r:186 },
  { z:12, s:'Mg', n:'Magnésio',      m:24.305,  p:3, g:2,  c:'alkaline-earth',  en:1.31, ie:738,  r:160 },
  { z:13, s:'Al', n:'Alumínio',      m:26.982,  p:3, g:13, c:'post-transition', en:1.61, ie:578,  r:143 },
  { z:14, s:'Si', n:'Silício',       m:28.086,  p:3, g:14, c:'metalloid',       en:1.90, ie:786,  r:117 },
  { z:15, s:'P',  n:'Fósforo',       m:30.974,  p:3, g:15, c:'nonmetal',        en:2.19, ie:1012, r:115 },
  { z:16, s:'S',  n:'Enxofre',       m:32.060,  p:3, g:16, c:'nonmetal',        en:2.58, ie:1000, r:103 },
  { z:17, s:'Cl', n:'Cloro',         m:35.453,  p:3, g:17, c:'halogen',         en:3.16, ie:1251, r:99  },
  { z:18, s:'Ar', n:'Argônio',       m:39.948,  p:3, g:18, c:'noble-gas',       en:null, ie:1521, r:97  },
  { z:19, s:'K',  n:'Potássio',      m:39.098,  p:4, g:1,  c:'alkali-metal',    en:0.82, ie:419,  r:227 },
  { z:20, s:'Ca', n:'Cálcio',        m:40.078,  p:4, g:2,  c:'alkaline-earth',  en:1.00, ie:590,  r:197 },
  { z:21, s:'Sc', n:'Escândio',      m:44.956,  p:4, g:3,  c:'transition-metal',en:1.36, ie:633,  r:162 },
  { z:22, s:'Ti', n:'Titânio',       m:47.867,  p:4, g:4,  c:'transition-metal',en:1.54, ie:659,  r:147 },
  { z:23, s:'V',  n:'Vanádio',       m:50.942,  p:4, g:5,  c:'transition-metal',en:1.63, ie:651,  r:134 },
  { z:24, s:'Cr', n:'Cromo',         m:51.996,  p:4, g:6,  c:'transition-metal',en:1.66, ie:653,  r:128 },
  { z:25, s:'Mn', n:'Manganês',      m:54.938,  p:4, g:7,  c:'transition-metal',en:1.55, ie:717,  r:127 },
  { z:26, s:'Fe', n:'Ferro',         m:55.845,  p:4, g:8,  c:'transition-metal',en:1.83, ie:762,  r:126 },
  { z:27, s:'Co', n:'Cobalto',       m:58.933,  p:4, g:9,  c:'transition-metal',en:1.88, ie:760,  r:125 },
  { z:28, s:'Ni', n:'Níquel',        m:58.693,  p:4, g:10, c:'transition-metal',en:1.91, ie:737,  r:124 },
  { z:29, s:'Cu', n:'Cobre',         m:63.546,  p:4, g:11, c:'transition-metal',en:1.90, ie:745,  r:128 },
  { z:30, s:'Zn', n:'Zinco',         m:65.380,  p:4, g:12, c:'transition-metal',en:1.65, ie:906,  r:134 },
  { z:31, s:'Ga', n:'Gálio',         m:69.723,  p:4, g:13, c:'post-transition', en:1.81, ie:579,  r:135 },
  { z:32, s:'Ge', n:'Germânio',      m:72.630,  p:4, g:14, c:'metalloid',       en:2.01, ie:762,  r:122 },
  { z:33, s:'As', n:'Arsênio',       m:74.922,  p:4, g:15, c:'metalloid',       en:2.18, ie:947,  r:121 },
  { z:34, s:'Se', n:'Selênio',       m:78.971,  p:4, g:16, c:'nonmetal',        en:2.55, ie:941,  r:119 },
  { z:35, s:'Br', n:'Bromo',         m:79.904,  p:4, g:17, c:'halogen',         en:2.96, ie:1140, r:120 },
  { z:36, s:'Kr', n:'Criptônio',     m:83.798,  p:4, g:18, c:'noble-gas',       en:null, ie:1351, r:116 },
  { z:37, s:'Rb', n:'Rubídio',       m:85.468,  p:5, g:1,  c:'alkali-metal',    en:0.82, ie:403,  r:248 },
  { z:38, s:'Sr', n:'Estrôncio',     m:87.620,  p:5, g:2,  c:'alkaline-earth',  en:0.95, ie:549,  r:215 },
  { z:47, s:'Ag', n:'Prata',         m:107.868, p:5, g:11, c:'transition-metal',en:1.93, ie:731,  r:144 },
  { z:50, s:'Sn', n:'Estanho',       m:118.710, p:5, g:14, c:'post-transition', en:1.96, ie:709,  r:140 },
  { z:53, s:'I',  n:'Iodo',          m:126.904, p:5, g:17, c:'halogen',         en:2.66, ie:1008, r:140 },
  { z:54, s:'Xe', n:'Xenônio',       m:131.293, p:5, g:18, c:'noble-gas',       en:null, ie:1170, r:131 },
  { z:55, s:'Cs', n:'Césio',         m:132.905, p:6, g:1,  c:'alkali-metal',    en:0.79, ie:376,  r:265 },
  { z:56, s:'Ba', n:'Bário',         m:137.327, p:6, g:2,  c:'alkaline-earth',  en:0.89, ie:503,  r:222 },
  { z:74, s:'W',  n:'Tungstênio',    m:183.840, p:6, g:6,  c:'transition-metal',en:2.36, ie:770,  r:139 },
  { z:79, s:'Au', n:'Ouro',          m:196.967, p:6, g:11, c:'transition-metal',en:2.54, ie:890,  r:144 },
  { z:80, s:'Hg', n:'Mercúrio',      m:200.592, p:6, g:12, c:'transition-metal',en:2.00, ie:1007, r:151 },
  { z:82, s:'Pb', n:'Chumbo',        m:207.200, p:6, g:14, c:'post-transition', en:2.33, ie:716,  r:175 },
  { z:86, s:'Rn', n:'Radônio',       m:222.000, p:6, g:18, c:'noble-gas',       en:null, ie:1037, r:146 },
  { z:88, s:'Ra', n:'Rádio',         m:226.000, p:7, g:2,  c:'alkaline-earth',  en:0.90, ie:509,  r:215 },
  { z:92, s:'U',  n:'Urânio',        m:238.029, p:7, g:null,c:'actinide',       en:1.38, ie:598,  r:196 },
];

const CAT_COLOR = {
  'alkali-metal':    '#ef5350',
  'alkaline-earth':  '#ffa726',
  'transition-metal':'#ffd166',
  'post-transition': '#a5d6a7',
  'metalloid':       '#80cbc4',
  'nonmetal':        '#4fc3f7',
  'halogen':         '#b39ddb',
  'noble-gas':       '#f48fb1',
  'lanthanide':      '#ffcc02',
  'actinide':        '#ff7043',
};

const CAT_LABEL = {
  'alkali-metal':    'Metal Alcalino',
  'alkaline-earth':  'Metal Alcalinoterroso',
  'transition-metal':'Metal de Transição',
  'post-transition': 'Metal Pós-transição',
  'metalloid':       'Semimetal',
  'nonmetal':        'Não-metal',
  'halogen':         'Halogênio',
  'noble-gas':       'Gás Nobre',
  'lanthanide':      'Lantanídeo',
  'actinide':        'Actinídeo',
};

const CELL = 48;
const GAP  = 2;

/* Estado local — resetado em cada render() */
let _filterCat  = null;
let _exAttempts = 0;
let _exDone     = false;

/* -----------------------------------------------------------------------
   Exports
----------------------------------------------------------------------- */
export function render(outlet) {
  _filterCat  = null;
  _exAttempts = 0;
  _exDone     = false;

  outlet.innerHTML = _buildHTML();
  _bindEvents();
  _selectElement(ELEMENTS.find(e => e.z === 8));
  _initComplexes();
  markSectionDone('periodic-table', 'visited');
}


function _initComplexes() {
  // Coordination complexes
    const COMPLEX_DATA = [{'formula': '[Fe(CN)₆]³⁻', 'metal': 'Fe³⁺', 'nc': 6, 'ligant': 'CN⁻ (monodentado, campo forte)', 'geom': 'Octaédrico', 'spin': 'Baixo spin', 'color': 'Amarelo', 'use': 'Ferricianeto: reagente analítico, detecção de Fe²⁺'}, {'formula': '[Cu(NH₃)₄]²⁺', 'metal': 'Cu²⁺', 'nc': 4, 'ligant': 'NH₃ (monodentado)', 'geom': 'Quadrado planar', 'spin': '—', 'color': 'Azul intenso', 'use': 'Formado quando NH₃ em excesso é adicionado ao Cu²⁺; indicador visual de Cu²⁺'}, {'formula': '[Cr(H₂O)₆]³⁺', 'metal': 'Cr³⁺', 'nc': 6, 'ligant': 'H₂O (campo fraco)', 'geom': 'Octaédrico', 'spin': 'Alto spin', 'color': 'Violeta', 'use': 'Íon aquo do cromo trivalente; comum em soluções de Cr³⁺'}, {'formula': '[Pt(en)₂]²⁺', 'metal': 'Pt²⁺', 'nc': 4, 'ligant': 'en = etilenodiamina (bidentado)', 'geom': 'Quadrado planar', 'spin': '—', 'color': 'Incolor/amarelo pálido', 'use': 'Análogo ao cisplatina (cis-[PtCl₂(NH₃)₂]) — antineoplásico'}, {'formula': '[Co(en)₃]³⁺', 'metal': 'Co³⁺', 'nc': 6, 'ligant': 'en bidentado (× 3 = hexadentado efetivo)', 'geom': 'Octaédrico', 'spin': 'Baixo spin', 'color': 'Laranja', 'use': 'Primeiro complexo resolvido em enantiômeros por Werner (Nobel 1913)'}];
    function renderComplex(idx) {
      const d = COMPLEX_DATA[idx];
      const container = document.getElementById('complex-content');
      if(!container||!d) return;
      container.innerHTML = `
        <div style="display:flex;align-items:baseline;gap:1rem;flex-wrap:wrap;margin-bottom:.5rem">
          <span style="font-family:monospace;font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">${d.formula}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:.4rem;margin-bottom:.5rem">
          <span style="font-size:var(--text-xs)">Metal: <b>${d.metal}</b></span>
          <span style="font-size:var(--text-xs)">NC: <b>${d.nc}</b></span>
          <span style="font-size:var(--text-xs)">Geometria: <b>${d.geom}</b></span>
          <span style="font-size:var(--text-xs)">Spin: <b>${d.spin}</b></span>
          <span style="font-size:var(--text-xs)">Cor: <b>${d.color}</b></span>
        </div>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin:.2rem 0">Ligante: ${d.ligant}</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.4rem">${d.use}</p>
      `;
      COMPLEX_DATA.forEach((_,j)=>{const b=document.getElementById('cpx-'+j);if(b) b.className='btn btn-xs '+(j===idx?'btn-secondary':'btn-ghost');});
    }
    renderComplex(0);
    COMPLEX_DATA.forEach((_,i)=>{ document.getElementById('cpx-'+i)?.addEventListener('click',()=>renderComplex(i)); });
}

export function destroy() {
  _filterCat = null;
}

/* -----------------------------------------------------------------------
   HTML principal
----------------------------------------------------------------------- */
function _buildHTML() {
  return `
<div class="module-page" id="module-pt">
  <button class="module-back btn-ghost" data-nav="/modules">
    &#8592; Módulos
  </button>

  <header class="module-header">
    <h1 class="module-title">Tabela Periódica</h1>
    <p class="module-concept">
      A tabela periódica é um mapa organizado por propriedades: cada coluna agrupa elementos
      com comportamento químico semelhante, e cada linha representa um nível de energia eletrônica.
      Clique em qualquer elemento para explorar suas propriedades.
    </p>
  </header>

    <!-- Química de coordenação -->
  <section class="module-section">
    <h2 class="module-section-title">Química de coordenação — Complexos de metais de transição</h2>
    <p class="module-text">Íons de metais de transição formam complexos com ligantes (doadores de pares de elétrons). A teoria do campo cristalino explica as cores e o magnetismo dos complexos pela quebra da degenerescência dos orbitais d.</p>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-bottom:1rem">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-electron)">Geometria e NC</h3>
        <p style="font-size:var(--text-sm)">NC=2: linear [Ag(NH₃)₂]⁺. NC=4: quadrado planar [PtCl₄]²⁻ ou tetraédrico [CoCl₄]²⁻. NC=6: octaédrico [Fe(CN)₆]³⁻. NC determina geometria; metal + carga + ligante.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Série espectroquímica</h3>
        <p style="font-size:var(--text-sm)">Força do campo: I⁻ &lt; Br⁻ &lt; Cl⁻ &lt; F⁻ &lt; OH⁻ &lt; H₂O &lt; NH₃ &lt; en &lt; NO₂⁻ &lt; CN⁻ &lt; CO. Campo forte (CN⁻, CO) → desdobramento grande → baixo spin. Campo fraco (Cl⁻, H₂O) → alto spin.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-bond)">Cor dos complexos</h3>
        <p style="font-size:var(--text-sm)">A cor observada é complementar à absorvida. [Ti(H₂O)₆]³⁺ absorve verde (500 nm) → aparece roxo. [Cu(H₂O)₆]²⁺ absorve vermelho → azul. Anel porfirino da hemoglobina: Fe²⁺ no centro.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">EDTA</h3>
        <p style="font-size:var(--text-sm)">Ácido etilenodiaminotetracético: hexadentado. Forma complexos 1:1 com praticamente todo cátion metálico. Usado em titulação complexométrica para determinar dureza da água (Ca²⁺, Mg²⁺).</p></div>
    </div>

    <div id="complex-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.75rem">
      <button class="btn btn-xs btn-secondary" id="cpx-0" data-cpx="0">[Fe(CN)₆]³⁻</button>
      <button class="btn btn-xs btn-ghost" id="cpx-1" data-cpx="1">[Cu(NH₃)₄]²⁺</button>
      <button class="btn btn-xs btn-ghost" id="cpx-2" data-cpx="2">[Cr(H₂O)₆]³⁺</button>
      <button class="btn btn-xs btn-ghost" id="cpx-3" data-cpx="3">[Pt(en)₂]²⁺</button>
      <button class="btn btn-xs btn-ghost" id="cpx-4" data-cpx="4">[Co(en)₃]³⁺</button>
    </div>
    <div id="complex-content" class="info-card" style="background:var(--bg-raised)"></div>
  </section>

  <!-- Metais de transição: estados de oxidação -->
  <section class="module-section">
    <h2 class="module-section-title">Metais de transição — estados de oxidação</h2>
    <p class="module-text">Metais de transição têm múltiplos estados de oxidação estáveis (preenchimento parcial dos orbitais d). Isso os torna cataliticamente versáteis: Fe²⁺/Fe³⁺, Mn²⁺/Mn⁴⁺/Mn⁷⁺, Cu⁺/Cu²⁺, V²⁺→V⁵⁺.</p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      <div class="info-card"><h3 style="margin-top:0">Ferro (Fe)</h3><p style="font-size:var(--text-sm)">+2: Fe²⁺ (hemoglobina, ion ferroso, cor verde). +3: Fe³⁺ (ferrugem, cor marrom-alaranjado). Fe⁰: metal (estrutural). Catalisador Haber-Bosch.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Manganês (Mn)</h3><p style="font-size:var(--text-sm)">+2: Mn²⁺ (rosa). +4: MnO₂ (preto, pilhas). +7: MnO₄⁻ (roxo intenso, titulação). Largos estado de oxidação: +2 a +7.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Cromo (Cr)</h3><p style="font-size:var(--text-sm)">+3: Cr³⁺ (verde, couro). +6: Cr₂O₇²⁻ (laranja, oxidante forte, cancerígeno). CrO₃ em galvanoplastia.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Cobre (Cu)</h3><p style="font-size:var(--text-sm)">+1: Cu⁺ (incolor, CuCl). +2: Cu²⁺ (azul, CuSO₄, complexos de amônia: azul intenso). Enzimas de cobre em respiração celular.</p></div>
    </div>
  </section>

<section class="module-section">
    <h2 class="module-section-title">Filtrar por categoria</h2>
    <div class="molecule-toolbar" id="cat-filter" role="group" aria-label="Filtrar por categoria">
      <button class="atom-btn active" data-cat="" aria-pressed="true">Todos</button>
      ${Object.entries(CAT_LABEL).map(([cat, label]) =>
        `<button class="atom-btn" data-cat="${esc(cat)}" aria-pressed="false"
                 style="border-left:3px solid ${CAT_COLOR[cat]}">${esc(label)}</button>`
      ).join('')}
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Tabela Periódica — clique para selecionar</h2>
    <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-2)">
      Role para a direita para ver todos os grupos &rarr;
    </p>
    <div class="periodic-table-wrapper" id="pt-wrapper">
      ${_buildSVG()}
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Elemento Selecionado</h2>
    <div id="element-detail-panel">
      <p style="color:var(--text-muted);font-size:var(--text-sm)">
        Clique em um elemento na tabela acima.
      </p>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Tendências Periódicas</h2>
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:var(--space-4)">
      <button class="btn btn-sm btn-secondary active" data-trend="r">Raio atômico</button>
      <button class="btn btn-sm btn-secondary"        data-trend="en">Eletronegatividade</button>
      <button class="btn btn-sm btn-secondary"        data-trend="ie">Energia de ionização</button>
    </div>
    <div class="info-card" id="trend-panel">${_trendText('r')}</div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Exercício Guiado</h2>
    <div class="exercise-card">
      <p class="exercise-question">
        Ao percorrer o <strong>Período 3</strong> da esquerda para a direita (Na → Ar),
        o que acontece com a <strong>eletronegatividade</strong>?
      </p>
      <div class="exercise-options" id="pt-ex-options" role="group">
        ${['Diminui progressivamente','Aumenta progressivamente','Permanece constante','Varia sem padrão'].map(o =>
          `<button class="exercise-option" data-answer="${esc(o)}">${esc(o)}</button>`
        ).join('')}
      </div>
      <div class="hint-box" id="pt-ex-hint"></div>
      <div class="exercise-feedback" id="pt-ex-feedback"></div>
      <div class="exercise-actions">
        <button class="btn btn-secondary btn-sm" id="pt-btn-hint">Usar dica</button>
        <button class="btn btn-primary btn-sm"   id="pt-btn-check" style="display:none">Verificar</button>
      </div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Onde isso aparece na vida real?</h2>
    <div class="real-life-card">
      <div class="real-life-label">Saúde</div>
      <p>O iodo (Z=53) é essencial para a tireoide. O sal iodado previne o bócio — doença
         por deficiência desse halogênio.</p>
    </div>
    <div class="real-life-card">
      <div class="real-life-label">Tecnologia</div>
      <p>Os lantanídeos (terras raras) estão em ímãs de turbinas eólicas, telas de smartphones
         e sistemas de guiamento. São difíceis de separar, não raros.</p>
    </div>
    <div class="real-life-card">
      <div class="real-life-label">Indústria</div>
      <p>O argônio (Z=18, gás nobre) é usado como gás inerte na soldagem — protege o metal
         fundido de oxidação por não reagir com nada.</p>
    </div>
    <div style="margin-top:2rem;text-align:center">
      <button class="btn btn-primary" data-nav="/module/chemical-bonds">
        Próximo: Ligações Químicas &#8594;
      </button>
    </div>
  </section>
</div>`;
}

/* -----------------------------------------------------------------------
   Construção do SVG
----------------------------------------------------------------------- */
function _buildSVG() {
  const MAX_P = 7;
  const MAX_G = 18;
  const W = MAX_G * (CELL + GAP) + 56;
  const H = MAX_P * (CELL + GAP) + 28;

  const map = new Map();
  ELEMENTS.forEach(el => { if (el.g) map.set(`${el.p}-${el.g}`, el); });

  let cells = '';

  for (let g = 1; g <= MAX_G; g++) {
    const x = 52 + (g - 1) * (CELL + GAP);
    cells += `<text x="${x + CELL/2}" y="13" text-anchor="middle"
      font-size="8" fill="#6e7681" font-family="Segoe UI,sans-serif">${g}</text>`;
  }

  for (let p = 1; p <= MAX_P; p++) {
    const y = 18 + (p - 1) * (CELL + GAP);
    cells += `<text x="22" y="${y + CELL/2 + 3}" text-anchor="middle"
      font-size="8" fill="#6e7681" font-family="Segoe UI,sans-serif">${p}</text>`;

    for (let g = 1; g <= MAX_G; g++) {
      const x  = 52 + (g - 1) * (CELL + GAP);
      const el = map.get(`${p}-${g}`);

      if (!el) {
        if (!(p <= 2 && g >= 3 && g <= 12)) {
          cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}"
            rx="3" fill="#161b22" stroke="#21262d" stroke-width="0.5" opacity="0.25"/>`;
        }
        continue;
      }

      const col = CAT_COLOR[el.c] || '#8b949e';
      cells += `
        <g class="pt-cell" data-z="${el.z}" style="cursor:pointer">
          <rect class="pt-bg" x="${x}" y="${y}" width="${CELL}" height="${CELL}"
            rx="3" fill="${col}20" stroke="${col}" stroke-width="1"/>
          <text x="${x+3}" y="${y+10}" font-size="8" fill="#6e7681"
            font-family="Segoe UI,sans-serif" pointer-events="none">${el.z}</text>
          <text x="${x+CELL/2}" y="${y+CELL/2+3}" text-anchor="middle"
            font-size="13" font-weight="700" fill="#e6edf3"
            font-family="Segoe UI,sans-serif" pointer-events="none">${el.s}</text>
          <text x="${x+CELL/2}" y="${y+CELL-5}" text-anchor="middle"
            font-size="7" fill="#8b949e"
            font-family="Segoe UI,sans-serif" pointer-events="none">${
              el.n.length > 8 ? el.n.slice(0, 7) + '.' : el.n
            }</text>
        </g>`;
    }
  }

  return `<svg id="pt-svg" width="${W}" height="${H}" role="img"
    aria-label="Tabela periódica interativa" style="display:block">
    ${cells}
  </svg>`;
}

/* -----------------------------------------------------------------------
   Detalhe do elemento
----------------------------------------------------------------------- */
function _selectElement(el) {
  if (!el) return;
  markSectionDone('periodic-table', 'interaction');

  const panel = document.getElementById('element-detail-panel');
  if (!panel) return;

  const col   = CAT_COLOR[el.c] || '#8b949e';
  const val   = _valence(el);

  panel.innerHTML = `
    <div class="element-detail">
      <div class="element-detail-symbol" style="border-color:${esc(col)};background:${esc(col)}22">
        <span class="num">${el.z}</span>
        <span class="sym" style="color:${esc(col)}">${esc(el.s)}</span>
        <span class="mass">${el.m.toFixed(2)}</span>
      </div>
      <div class="element-detail-info">
        <div class="element-detail-name">${esc(el.n)}</div>
        <span class="badge" style="background:${esc(col)}22;color:${esc(col)};
              border-color:${esc(col)}55;align-self:start">
          ${esc(CAT_LABEL[el.c] || el.c)}
        </span>
        <div class="element-props">
          <div class="element-prop">
            <span class="element-prop-label">Período / Grupo</span>
            <span class="element-prop-value">${el.p} / ${el.g ?? '—'}</span>
          </div>
          <div class="element-prop">
            <span class="element-prop-label">Eletroneg. (Pauling)</span>
            <span class="element-prop-value">${el.en !== null ? el.en.toFixed(2) : '—'}</span>
          </div>
          <div class="element-prop">
            <span class="element-prop-label">E. ionização (kJ/mol)</span>
            <span class="element-prop-value">${el.ie}</span>
          </div>
          <div class="element-prop">
            <span class="element-prop-label">Raio atômico (pm)</span>
            <span class="element-prop-value">${el.r}</span>
          </div>
          <div class="element-prop">
            <span class="element-prop-label">Elétrons de valência</span>
            <span class="element-prop-value">${val}</span>
          </div>
          <div class="element-prop">
            <span class="element-prop-label">Massa atômica (u)</span>
            <span class="element-prop-value">${el.m}</span>
          </div>
        </div>
      </div>
    </div>`;

  // Destacar célula selecionada no SVG
  document.querySelectorAll('.pt-bg').forEach(rect => {
    const z = parseInt(rect.parentElement?.dataset.z, 10);
    rect.setAttribute('stroke-width', z === el.z ? '2.5' : '1');
  });
}

function _valence(el) {
  const g = el.g;
  if (!g) return '—';
  if (g === 1)            return 1;
  if (g === 2)            return 2;
  if (g >= 13 && g <= 18) return g - 10;
  if (g >= 3  && g <= 12) return '(variável)';
  return '—';
}

/* -----------------------------------------------------------------------
   Tendências
----------------------------------------------------------------------- */
function _trendText(key) {
  const t = {
    r:  `<h3>Raio atômico</h3>
         <p><strong>No período (→):</strong> diminui — mais prótons atraem os elétrons sem
         adicionar camadas.</p>
         <p style="margin-top:.5rem"><strong>No grupo (↓):</strong> aumenta — cada período
         adiciona uma nova camada eletrônica.</p>`,
    en: `<h3>Eletronegatividade (Pauling)</h3>
         <p><strong>Aumenta →</strong> no período e <strong>diminui ↓</strong> no grupo.
         O flúor (F, 3,98) é o mais eletronegativo. Metais alcalinos têm os valores
         mais baixos (Li: 0,98; Cs: 0,79).</p>`,
    ie: `<h3>Energia de ionização</h3>
         <p>Energia para remover o elétron mais externo de um átomo isolado.
         <strong>Aumenta →</strong> no período e <strong>diminui ↓</strong> no grupo.
         Por isso metais alcalinos são reativos — perdem elétrons com facilidade.</p>`,
  };
  return t[key] || '';
}

/* -----------------------------------------------------------------------
   Eventos
----------------------------------------------------------------------- */
function _bindEvents() {
  // Clique no SVG — delegado ao wrapper
  document.getElementById('pt-wrapper')?.addEventListener('click', e => {
    const cell = e.target.closest('.pt-cell');
    if (!cell) return;
    const z  = parseInt(cell.dataset.z, 10);
    const el = ELEMENTS.find(x => x.z === z);
    if (el) _selectElement(el);
  });

  // Filtro por categoria
  document.getElementById('cat-filter')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    _filterCat = btn.dataset.cat || null;
    document.querySelectorAll('#cat-filter .atom-btn').forEach(b => {
      const match = b.dataset.cat === btn.dataset.cat;
      b.classList.toggle('active', match);
      b.setAttribute('aria-pressed', String(match));
    });
    document.querySelectorAll('.pt-cell').forEach(g => {
      const el = ELEMENTS.find(x => x.z === parseInt(g.dataset.z, 10));
      if (!el) return;
      g.setAttribute('opacity', _filterCat && el.c !== _filterCat ? '0.12' : '1');
    });
  });

  // Tendências
  document.querySelectorAll('[data-trend]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-trend]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('trend-panel');
      if (panel) panel.innerHTML = _trendText(btn.dataset.trend);
    });
  });

  // Exercício
  const CORRECT = 'Aumenta progressivamente';
  const HINTS   = [
    'Clique em cada elemento do Período 3 e observe a eletronegatividade no painel.',
    'O número de prótons cresce de Na(11) a Ar(18). Mais prótons = maior atração sobre os elétrons.',
    'Na:0,93 → Mg:1,31 → Al:1,61 → Si:1,90 → P:2,19 → S:2,58 → Cl:3,16. Qual a tendência?',
  ];

  const optEl  = document.getElementById('pt-ex-options');
  const checkEl = document.getElementById('pt-btn-check');
  const hintEl  = document.getElementById('pt-btn-hint');
  const fbEl    = document.getElementById('pt-ex-feedback');
  const hintBox = document.getElementById('pt-ex-hint');

  if (!optEl || !checkEl || !hintEl || !fbEl || !hintBox) return;

  optEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-answer]');
    if (!btn || _exDone) return;
    optEl.querySelectorAll('.exercise-option').forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('selected');
    btn.setAttribute('aria-pressed', 'true');
    checkEl.style.display = 'inline-flex';
  });

  checkEl.addEventListener('click', () => {
    if (_exDone) return;
    const sel = optEl.querySelector('.exercise-option.selected');
    if (!sel) return;
    _exAttempts++;
    const ok = sel.dataset.answer === CORRECT;
    optEl.querySelectorAll('.exercise-option').forEach(b => {
      b.disabled = true;
      if (b.dataset.answer === CORRECT) b.classList.add('correct');
      else if (b.classList.contains('selected')) b.classList.add('wrong');
    });
    fbEl.textContent = ok
      ? 'Correto! No Período 3: Na(0,93) → Mg(1,31) → ... → Cl(3,16). Mais prótons = maior atração = maior eletronegatividade.'
      : 'Não está certo. Observe os valores: Na(0,93) → Mg(1,31) → Al(1,61) → Si(1,90) → P(2,19) → S(2,58) → Cl(3,16).';
    fbEl.className = `exercise-feedback ${ok ? 'bg-correct' : 'bg-error'}`;
    if (ok) { _exDone = true; markSectionDone('periodic-table', 'exercise'); }
  });

  hintEl.addEventListener('click', () => {
    const idx = Math.min(_exAttempts, HINTS.length - 1);
    hintBox.textContent = HINTS[idx];
    hintBox.classList.add('visible');
  });
}
