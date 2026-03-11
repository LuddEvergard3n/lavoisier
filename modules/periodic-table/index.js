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
const EXERCISES = [
  { q: 'Ao percorrer um período da esquerda para direita, o raio atômico:', opts: ['Aumenta','Diminui','Permanece constante','Varia aleatoriamente'], ans: 1, exp: 'Z aumenta no mesmo período → Z_ef aumenta (mesma blindagem) → atração nuclear contrai os orbitais.', hint: 'Mais prótons, mesmas camadas eletrônicas → raio aumenta ou diminui?' },
  { q: 'Qual família contém os metais mais reativos?', opts: ['Metais alcalinoterrosos (IIA)','Metais alcalinos (IA)','Halogênios (VIIA)','Gases nobres (0)'], ans: 1, exp: 'Metais alcalinos têm 1 e⁻ de valência e baixa energia de ionização. Reagem violentamente com água. Cs > Rb > K > Na > Li.', hint: '1 elétron de valência + baixa IE = muito reativo.' },
  { q: 'A eletronegatividade aumenta na tabela periódica:', opts: ['Da direita para esquerda num período','De cima para baixo num grupo','Da esquerda para direita num período e de baixo para cima num grupo','Não tem tendência definida'], ans: 2, exp: 'Maior Z_ef → maior atração de elétrons de ligação → maior eletronegatividade. F (3,98) é o mais eletronegativo de todos.', hint: 'Maior Z_ef = mais atração sobre elétrons de ligação = maior eletronegatividade.' },
  { q: 'Os lantanídeos são difíceis de separar entre si porque:', opts: ['São radioativos','Têm tamanhos e propriedades químicas muito similares (contração lantanídica)','São muito escassos','Reagem com qualquer reagente'], ans: 1, exp: 'A contração lantanídica: elétrons 4f blindam mal um ao outro → Z_ef cresce gradualmente → raios atômicos similares → propriedades químicas quase idênticas. Separação requer extração seletiva em série.', hint: 'O que torna dois elementos difíceis de separar quimicamente?' },
  { q: 'Por que gases nobres têm energia de ionização muito alta?', opts: ['São muito pesados','Têm camada de valência completa — configuração extremamente estável','São radioativos','Não formam ligações'], ans: 1, exp: 'He (1s²), Ne (2s²2p⁶), Ar ([Ne]3s²3p⁶): configuração de octeto completo. Remoção de qualquer elétron destabiliza muito. IE₁ do He = 2372 kJ/mol.', hint: 'O que caracteriza a configuração eletrônica especialmente estável dos gases nobres?' },,
  { q:'O raio atômico aumenta ao descer num grupo porque:', opts:['A carga nuclear diminui','Há mais camadas eletrônicas (n maior)','A eletronegatividade aumenta','O número de massa aumenta'], ans:1, exp:'Cada período adiciona uma camada (n). Mais camadas → elétrons externos mais distantes do núcleo → raio maior.', hint:'Pense no Li (2 camadas) vs Cs (6 camadas) — ambos no grupo 1.' },
  { q:'A primeira energia de ionização do Mg é menor que a do Na? Isso é:',opts:['Verdadeiro — Mg tem mais elétrons','Falso — Mg (738 kJ/mol) > Na (496 kJ/mol)','Verdadeiro — Mg é mais reativo','Falso — são iguais na mesma linha'], ans:1, exp:'Na mesma linha (período 3), E_ion aumenta da esquerda para a direita. Mg (Z=12) tem E_ion=738 kJ/mol; Na (Z=11) tem 496 kJ/mol. Mg > Na.', hint:'Tendência no período: E_ion aumenta da esquerda para a direita (Z_ef cresce).' },
  { q:'Por que o F é o elemento mais eletronegativo?', opts:['É o maior átomo','Tem o maior Z_efetivo combinado com o menor raio e alta afinidade eletrônica','É um gás nobre modificado','Tem 9 prótons e é instável'], ans:1, exp:'F tem Z_ef alto (elétrons pouco blindados), raio muito pequeno (2ª linha) e altíssima afinidade eletrônica. A combinação desses três fatores maximiza a atração sobre elétrons de ligação.', hint:'Eletronegatividade cresce com Z_ef e diminui com o raio.' },
  { q:'O Z efetivo do cloro (3s²3p⁵) pelo método de Slater para um elétron 3p é:', opts:['17','6,1','8,9','11,9'], ans:2, exp:'Slater: contribuição dos outros 4 elétrons 3p = 4×0,35=1,40; 8 elétrons das camadas 2s2p = 8×0,85=6,80; 2 elétrons 1s = 2×1,00=2,00. Total blindagem = 10,20. Z_ef = 17 - 10,20 = 6,80 ≈ 6,1 (variações dependem do agrupamento).', hint:'Z_ef = Z - S; S = soma das blindagens de Slater por camada.' },
  { q:'Qual propriedade apresenta anomalia entre N e O (O tem valor menor que N)?', opts:['Raio atômico','Energia de ionização','Eletronegatividade','Afinidade eletrônica'], ans:1, exp:'E_ion do O (1314 kJ/mol) < N (1402 kJ/mol) — anomalia. N tem 2p semi-preenchido (3 orbitais, 1 e⁻ cada — muito estável pela regra de Hund). O tem par forçado em 2p, que repele e facilita a ionização.', hint:'N: 2p³ com meio-preenchimento estável. O: 2p⁴ com um emparelhamento que eleva repulsão.' },
  { q:'O He é colocado no grupo 18 (gases nobres) mas sua configuração 1s² é mais parecida com o grupo 2 (metais alcalino-terrosos). Por que fica no grupo 18?', opts:['Por convenção histórica','Porque suas propriedades químicas (inerte, gasoso) são idênticas aos outros gases nobres','Porque tem 2 elétrons como Mg','Porque é o único gás nobre não-radioativo'], ans:1, exp:'A classificação periódica prioriza propriedades químicas sobre configuração eletrônica. He é quimicamente inerte como Ne, Ar, Kr — nunca forma compostos naturais. Sua camada de valência (n=1) está completamente cheia com apenas 2 e⁻.', hint:'Química é comportamento, não apenas configuração eletrônica.' },
  { q:'Os elementos de transição (bloco d) têm propriedades distintas dos metais do bloco s porque:', opts:['Têm massa atômica menor','Possuem orbitais d parcialmente preenchidos que permitem múltiplos estados de oxidação e formação de complexos coloridos','São sólidos em temperatura ambiente','Reagem com água como Na e K'], ans:1, exp:'Orbitais d parcialmente preenchidos permitem: múltiplos estados de oxidação (Fe²⁺/Fe³⁺), formação de complexos coloridos (transições d-d), paramagnetismo e catálise. Isso não ocorre em metais de bloco s que têm d vazio ou cheio.', hint:'O que há de especial nos orbitais d que os metais do grupo 1 e 2 não têm?' },
  { q:'Dentre os halogênios (grupo 17), qual tem maior ponto de ebulição e por quê?', opts:['F₂ — é o mais eletronegativo','I₂ — maior massa e forças de dispersão de London mais intensas','Cl₂ — é gasoso à temperatura ambiente','Br₂ — é líquido à temperatura ambiente'], ans:1, exp:'I₂ (Pb = 184°C) > Br₂ (59°C) > Cl₂ (-34°C) > F₂ (-188°C). Moléculas maiores têm mais elétrons → forças de dispersão de London maiores → ponto de ebulição maior.', hint:'Forças de London aumentam com o número de elétrons (polarizabilidade).' },
  { q:'Por que o raio do Fe²⁺ é maior que o do Fe³⁺, embora ambos sejam do mesmo elemento?', opts:['Fe²⁺ tem mais prótons','Fe³⁺ perdeu mais elétrons — mesma carga nuclear, menos repulsão e-e, orbitais contraem','Fe²⁺ tem configuração [Ar]3d⁴ que é maior','São iguais — apenas o estado de oxidação muda'], ans:1, exp:'Fe²⁺ ([Ar]3d⁶) e Fe³⁺ ([Ar]3d⁵) têm Z=26. Com menos elétrons, a atração do núcleo sobre os restantes é mais efetiva → menor raio. Regra geral: raio iônico diminui com a carga positiva do cátion.', hint:'Mesma carga nuclear, menos elétrons = mais atração por elétron = raio menor.' },
  { q:'A propriedade periódica com variação menos regular é:', opts:['Raio atômico','Ponto de fusão — depende do tipo de estrutura sólida (metálica, covalente, molecular)','Eletronegatividade','Primeira energia de ionização'], ans:1, exp:'Ponto de fusão depende do tipo de ligação no sólido: C (diamante, covalente rede) ≈ 3550°C; W (metálico) = 3422°C; He (van der Waals) = -272°C. Não é apenas função de Z — depende da estrutura cristalina e tipo de interação.', hint:'Pense no grafite vs diamante vs metais vs gases nobres.' }
];
let _exIdx = 0;

export function render(outlet) {
  _filterCat  = null;
  _exIdx = 0;
  _exAttempts = 0;
  _exDone     = false;

  outlet.innerHTML = _buildHTML();
  _bindEvents();
  _selectElement(ELEMENTS.find(e => e.z === 8));
  _initComplexes();
  _initZef();
  _initExercises();
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

// ---------------------------------------------------------------------------
// Calculadora de Z efetivo — Regras de Slater
// ---------------------------------------------------------------------------

const ZEF_DATA = [
  null, // índice 0 não usado
  { sym:'H',  cfg:'1s¹',              shells:[[1,0]], name:'Hidrogênio'   },
  { sym:'He', cfg:'1s²',              shells:[[2,0]], name:'Hélio'        },
  { sym:'Li', cfg:'[He] 2s¹',         shells:[[2,0],[1,0]], name:'Lítio'  },
  { sym:'Be', cfg:'[He] 2s²',         shells:[[2,0],[2,0]], name:'Berílio'},
  { sym:'B',  cfg:'[He] 2s² 2p¹',     shells:[[2,0],[2,1]], name:'Boro'  },
  { sym:'C',  cfg:'[He] 2s² 2p²',     shells:[[2,0],[2,2]], name:'Carbono'},
  { sym:'N',  cfg:'[He] 2s² 2p³',     shells:[[2,0],[2,3]], name:'Nitrogênio'},
  { sym:'O',  cfg:'[He] 2s² 2p⁴',     shells:[[2,0],[2,4]], name:'Oxigênio'},
  { sym:'F',  cfg:'[He] 2s² 2p⁵',     shells:[[2,0],[2,5]], name:'Flúor'  },
  { sym:'Ne', cfg:'[He] 2s² 2p⁶',     shells:[[2,0],[2,6]], name:'Neônio' },
  { sym:'Na', cfg:'[Ne] 3s¹',          shells:[[2,0],[8,0],[1,0]], name:'Sódio'},
  { sym:'Mg', cfg:'[Ne] 3s²',          shells:[[2,0],[8,0],[2,0]], name:'Magnésio'},
  { sym:'Al', cfg:'[Ne] 3s² 3p¹',      shells:[[2,0],[8,0],[2,1]], name:'Alumínio'},
  { sym:'Si', cfg:'[Ne] 3s² 3p²',      shells:[[2,0],[8,0],[2,2]], name:'Silício'},
  { sym:'P',  cfg:'[Ne] 3s² 3p³',      shells:[[2,0],[8,0],[2,3]], name:'Fósforo'},
  { sym:'S',  cfg:'[Ne] 3s² 3p⁴',      shells:[[2,0],[8,0],[2,4]], name:'Enxofre'},
  { sym:'Cl', cfg:'[Ne] 3s² 3p⁵',      shells:[[2,0],[8,0],[2,5]], name:'Cloro'},
  { sym:'Ar', cfg:'[Ne] 3s² 3p⁶',      shells:[[2,0],[8,0],[2,6]], name:'Argônio'},
  { sym:'K',  cfg:'[Ar] 4s¹',           shells:[[2,0],[8,0],[8,0],[1,0]], name:'Potássio'},
  { sym:'Ca', cfg:'[Ar] 4s²',           shells:[[2,0],[8,0],[8,0],[2,0]], name:'Cálcio'},
  { sym:'Sc', cfg:'[Ar] 3d¹ 4s²',       shells:[[2,0],[8,0],[9,0],[2,0]], name:'Escândio'},
  { sym:'Ti', cfg:'[Ar] 3d² 4s²',       shells:[[2,0],[8,0],[10,0],[2,0]], name:'Titânio'},
  { sym:'V',  cfg:'[Ar] 3d³ 4s²',       shells:[[2,0],[8,0],[11,0],[2,0]], name:'Vanádio'},
  { sym:'Cr', cfg:'[Ar] 3d⁵ 4s¹',       shells:[[2,0],[8,0],[13,0],[1,0]], name:'Cromo'},
  { sym:'Mn', cfg:'[Ar] 3d⁵ 4s²',       shells:[[2,0],[8,0],[13,0],[2,0]], name:'Manganês'},
  { sym:'Fe', cfg:'[Ar] 3d⁶ 4s²',       shells:[[2,0],[8,0],[14,0],[2,0]], name:'Ferro'},
  { sym:'Co', cfg:'[Ar] 3d⁷ 4s²',       shells:[[2,0],[8,0],[15,0],[2,0]], name:'Cobalto'},
  { sym:'Ni', cfg:'[Ar] 3d⁸ 4s²',       shells:[[2,0],[8,0],[16,0],[2,0]], name:'Níquel'},
  { sym:'Cu', cfg:'[Ar] 3d¹⁰ 4s¹',      shells:[[2,0],[8,0],[18,0],[1,0]], name:'Cobre'},
  { sym:'Zn', cfg:'[Ar] 3d¹⁰ 4s²',      shells:[[2,0],[8,0],[18,0],[2,0]], name:'Zinco'},
  { sym:'Ga', cfg:'[Ar] 3d¹⁰ 4s² 4p¹',  shells:[[2,0],[8,0],[18,0],[2,1]], name:'Gálio'},
  { sym:'Ge', cfg:'[Ar] 3d¹⁰ 4s² 4p²',  shells:[[2,0],[8,0],[18,0],[2,2]], name:'Germânio'},
  { sym:'As', cfg:'[Ar] 3d¹⁰ 4s² 4p³',  shells:[[2,0],[8,0],[18,0],[2,3]], name:'Arsênio'},
  { sym:'Se', cfg:'[Ar] 3d¹⁰ 4s² 4p⁴',  shells:[[2,0],[8,0],[18,0],[2,4]], name:'Selênio'},
  { sym:'Br', cfg:'[Ar] 3d¹⁰ 4s² 4p⁵',  shells:[[2,0],[8,0],[18,0],[2,5]], name:'Bromo'},
  { sym:'Kr', cfg:'[Ar] 3d¹⁰ 4s² 4p⁶',  shells:[[2,0],[8,0],[18,0],[2,6]], name:'Criptônio'},
];

function _slater(Z) {
  // Regra de Slater simplificada para o elétron mais externo
  // shells: array de [elétrons na camada, elétrons p na última camada se misturada]
  // Implementação: usar n de valência e contar contribuições
  if (Z < 1 || Z > 36) return null;
  const d = ZEF_DATA[Z];
  if (!d) return null;

  // Contagem direta de sigma baseada em regras de Slater
  // Para simplicidade: camada de valência = última camada; camadas internas
  const shells = d.shells; // [[n_eletrons_antes_valência, ...], ..., [n_valência, 0]]
  const nShells = shells.length;
  const valElecs = shells[nShells - 1][0] + shells[nShells - 1][1] - 1; // mesma camada - self
  let sigma = valElecs * 0.35; // mesma camada (exceto self)

  if (nShells >= 2) {
    sigma += (shells[nShells - 2][0] + shells[nShells - 2][1]) * 0.85;
  }
  for (let i = 0; i < nShells - 2; i++) {
    sigma += (shells[i][0] + shells[i][1]) * 1.00;
  }

  return { sigma: +sigma.toFixed(2), zef: +(Z - sigma).toFixed(2) };
}

function _initZef() {
  function update() {
    const Z = parseInt(document.getElementById('zef-z')?.value ?? 11, 10);
    const d = ZEF_DATA[Z];
    const s = _slater(Z);
    if (!d || !s) return;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v; };
    set('zef-z-val',  Z);
    set('zef-elem',   `${d.sym} (${d.name})`);
    set('zef-config', d.cfg);
    set('zef-sigma',  s.sigma);
    set('zef-zef',    s.zef);
  }

  document.getElementById('zef-z')?.addEventListener('input', update);
  if (document.getElementById('zef-z')) update();
}

// ---------------------------------------------------------------------------
// Multi-exercise system
// ---------------------------------------------------------------------------
function _initExercises() {
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
          markSectionDone('periodic-table', 'exercise');
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
  loadExercise(_exIdx);
  document.getElementById('ex-next')?.addEventListener('click', () => {
    _exIdx = Math.min(_exIdx + 1, EXERCISES.length - 1);
    loadExercise(_exIdx);
  });
}

// ---------------------------------------------------------------------------
// Canvas de gráfico de barras das tendências periódicas (Z = 1..18)
// ---------------------------------------------------------------------------

// Dados para Z = 1..18 (período 1, 2 e 3)
const TREND_DATA = {
  r: {   // Raio atômico (pm) — Slater/Cordero estimativas
    label: 'Raio atômico (pm)',
    color: '#4fc3f7',
    values: [31,28,167,112,87,77,75,73,64,58,190,160,143,118,110,103,99,97],
  },
  ie: {  // 1ª energia de ionização (kJ/mol)
    label: 'E. ionização (kJ/mol)',
    color: '#ef476f',
    values: [1312,2372,520,900,800,1086,1402,1314,1681,2081,496,738,577,786,1012,1000,1251,1521],
  },
  en: {  // Eletronegatividade Pauling ×100 (para inteiro)
    label: 'Eletronegatividade (×10)',
    color: '#ffd166',
    values: [22,0,10,15,20,25,30,34,38,0,9,12,16,19,21,25,32,0].map(v=>v),
    // H=2.2, He=0, Li=1.0, Be=1.5, B=2.0, C=2.5, N=3.0, O=3.4, F=3.8, Ne=0
    // Na=0.9, Mg=1.2, Al=1.6, Si=1.9, P=2.1, S=2.5, Cl=3.2, Ar=0
  },
  af: {  // Afinidade eletrônica (kJ/mol) — abs value; negativo = exotérmico
    label: 'Af. eletrônica (kJ/mol)',
    color: '#6bcb77',
    values: [73,0,60,0,27,122,0,141,328,0,53,0,42,134,72,200,349,0],
  },
};

const TREND_LABELS = ['H','He','Li','Be','B','C','N','O','F','Ne',
                      'Na','Mg','Al','Si','P','S','Cl','Ar'];
const TREND_COLORS_BAR = [
  // período 1
  '#4fc3f7','#888',
  // período 2
  '#ef476f','#ef476f','#ffd166','#6bcb77','#6bcb77','#6bcb77','#6bcb77','#888',
  // período 3
  '#ef476f','#ef476f','#ffd166','#6bcb77','#6bcb77','#6bcb77','#6bcb77','#888',
];

let _trendProp    = 'r';
let _trendAnimId  = null;
let _trendCanvas  = null;
let _trendCtx     = null;
let _trendAnimT   = 1;   // 0→1 na animação de entrada

function _drawTrend(t) {
  const canvas = _trendCanvas;
  const ctx    = _trendCtx;
  if (!canvas || !ctx) return;

  const W = canvas.offsetWidth  || 480;
  const H = canvas.offsetHeight || 120;
  const dpr = window.devicePixelRatio || 1;

  // Redimensionar se necessário
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.scale(dpr, dpr);
  }

  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  const dataset = TREND_DATA[_trendProp];
  if (!dataset) return;

  const vals    = dataset.values;
  const maxVal  = Math.max(...vals);
  const n       = vals.length;
  const padL    = 32, padR = 8, padT = 12, padB = 22;
  const barW    = (W - padL - padR) / n;

  // Eixo Y label
  ctx.fillStyle  = 'rgba(200,200,200,0.4)';
  ctx.font       = '8px monospace';
  ctx.textAlign  = 'right';
  ctx.fillText(dataset.label, padL - 2, padT);

  vals.forEach((v, i) => {
    const barH   = ((v / maxVal) * (H - padT - padB)) * Math.min(1, t);
    const x      = padL + i * barW + 1;
    const y      = H - padB - barH;
    const color  = TREND_COLORS_BAR[i];

    // Barra
    ctx.fillStyle = color + 'bb';
    ctx.fillRect(x, y, barW - 2, barH);

    // Valor se barra alta o suficiente
    if (barH > 14) {
      ctx.fillStyle  = '#fff';
      ctx.font       = '7px monospace';
      ctx.textAlign  = 'center';
      ctx.fillText(v > 99 ? (v/1000).toFixed(1)+'k' : v, x + (barW-2)/2, y + 9);
    }

    // Label elemento
    ctx.fillStyle  = 'rgba(200,200,200,0.7)';
    ctx.font       = '7px monospace';
    ctx.textAlign  = 'center';
    ctx.fillText(TREND_LABELS[i], x + (barW-2)/2, H - padB + 10);
  });

  // Linha de zero
  ctx.strokeStyle = 'rgba(200,200,200,0.15)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(padL, H - padB);
  ctx.lineTo(W - padR, H - padB);
  ctx.stroke();
}

function _animateTrend() {
  if (_trendAnimId) cancelAnimationFrame(_trendAnimId);
  _trendAnimT = 0;
  function step() {
    _trendAnimT = Math.min(1, _trendAnimT + 0.06);
    _drawTrend(_trendAnimT);
    if (_trendAnimT < 1) _trendAnimId = requestAnimationFrame(step);
    else _trendAnimId = null;
  }
  _trendAnimId = requestAnimationFrame(step);
}

function _initTrendCanvas(initialProp) {
  const frame  = document.getElementById('trend-canvas-frame');
  const canvas = document.getElementById('trend-canvas');
  if (!canvas || !frame) return;

  _trendCanvas = canvas;

  const W   = Math.min(frame.clientWidth || 480, 480);
  const H   = 120;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  _trendCtx = canvas.getContext('2d');
  _trendCtx.scale(dpr, dpr);

  _trendProp = initialProp || 'r';
  _animateTrend();
}

// Chamada quando o botão de tendência muda — integramos no listener existente
function _updateTrendCanvas(prop) {
  _trendProp = prop;
  _animateTrend();
}

// ---------------------------------------------------------------------------
// Mapa de calor da tabela periódica por propriedade
// ---------------------------------------------------------------------------

// Dados por Z (1..36) para 4 propriedades: raio, IE, EN, AF
// Índice 0 = Z=1 (H), índice 1 = Z=2 (He), ...
const HEATMAP_DATA = {
  r:  { label: 'Raio atômico (pm)', unit: 'pm',
        // Z 1..36
        vals: [31,28,167,112,87,77,75,73,64,58,190,160,143,118,110,103,99,97,
               235,197,164,147,135,128,126,124,125,125,128,133,122,122,120,119,120,116] },
  ie: { label: '1ª E. ionização (kJ/mol)', unit: 'kJ/mol',
        vals: [1312,2372,520,900,800,1086,1402,1314,1681,2081,496,738,577,786,1012,1000,1251,1521,
               419,590,633,659,650,653,717,759,758,737,745,906,579,762,947,941,1140,1351] },
  en: { label: 'Eletronegatividade (Pauling)', unit: '',
        vals: [2.2,0,1.0,1.5,2.0,2.5,3.0,3.4,3.98,0,0.93,1.31,1.61,1.9,2.19,2.58,3.16,0,
               0.82,1.0,1.36,1.54,1.63,1.66,1.55,1.83,1.88,1.91,1.9,1.65,1.81,2.01,2.18,2.55,2.96,3.0] },
  af: { label: 'Afinidade eletrônica (kJ/mol)', unit: 'kJ/mol',
        vals: [73,0,60,0,27,122,0,141,328,0,53,0,42,134,72,200,349,0,
               48,2,18,8,51,65,0,15,64,112,119,0,29,119,78,195,325,0] },
};

// Posição na tabela: [Z, período, grupo]
const HEATMAP_POSITIONS = [
  [1,1,1],[2,1,18],
  [3,2,1],[4,2,2],[5,2,13],[6,2,14],[7,2,15],[8,2,16],[9,2,17],[10,2,18],
  [11,3,1],[12,3,2],[13,3,13],[14,3,14],[15,3,15],[16,3,16],[17,3,17],[18,3,18],
  [19,4,1],[20,4,2],[21,4,3],[22,4,4],[23,4,5],[24,4,6],[25,4,7],[26,4,8],[27,4,9],[28,4,10],
  [29,4,11],[30,4,12],[31,4,13],[32,4,14],[33,4,15],[34,4,16],[35,4,17],[36,4,18],
];

const HEATMAP_SYMBOLS = ['H','He','Li','Be','B','C','N','O','F','Ne',
  'Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Sc','Ti','V','Cr','Mn',
  'Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr'];

let _heatmapProp = 'r';

function _lerpColor(t) {
  // azul frio (0) → verde (0.5) → vermelho quente (1)
  let r, g, b;
  if (t < 0.5) {
    const s = t * 2;
    r = Math.round(30 + s * (30));
    g = Math.round(60 + s * (180));
    b = Math.round(180 - s * (60));
  } else {
    const s = (t - 0.5) * 2;
    r = Math.round(60 + s * (180));
    g = Math.round(240 - s * (180));
    b = Math.round(120 - s * (90));
  }
  return `rgb(${r},${g},${b})`;
}

function _buildHeatmapSVG(prop) {
  const dataset = HEATMAP_DATA[prop];
  const vals    = dataset.vals;
  const CELL = 26, GAP = 2;
  const MAX_G = 18, MAX_P = 7;
  const W = MAX_G * (CELL + GAP) + 32;
  const H = (MAX_P - 3) * (CELL + GAP) + 12;  // Z 1..36 = períodos 1..4

  const minVal = Math.min(...vals.filter(v => v > 0));
  const maxVal = Math.max(...vals);

  let cells = '';
  HEATMAP_POSITIONS.forEach(([z, p, g], idx) => {
    const x = 4 + (g - 1) * (CELL + GAP);
    const y = 4 + (p - 1) * (CELL + GAP);
    const v = vals[idx];
    let fill, opacity;
    if (v === 0) {
      fill = '#21262d';
      opacity = '0.4';
    } else {
      const t = (v - minVal) / (maxVal - minVal);
      fill = _lerpColor(t);
      opacity = '0.85';
    }
    const sym   = HEATMAP_SYMBOLS[idx];
    const label = v > 0 ? (v < 10 ? v.toFixed(2) : Math.round(v)) : '—';
    cells += `
      <g class="hm-cell" data-z="${z}" style="cursor:default">
        <rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3"
              fill="${fill}" opacity="${opacity}"/>
        <text x="${x + CELL/2}" y="${y + CELL/2 - 2}" text-anchor="middle"
              font-size="9" font-weight="700" fill="#e6edf3"
              font-family="monospace" pointer-events="none">${sym}</text>
        <text x="${x + CELL/2}" y="${y + CELL - 5}" text-anchor="middle"
              font-size="6" fill="rgba(200,200,200,0.7)"
              font-family="monospace" pointer-events="none">${label}</text>
      </g>`;
  });

  return { svg: `<svg width="${W}" height="${H}" style="display:block">${cells}</svg>`,
           min: minVal, max: maxVal };
}

function _drawHeatmapLegend(minVal, maxVal) {
  const canvas = document.getElementById('heatmap-legend-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 160, H = 12;
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  for (let i = 0; i <= 20; i++) grad.addColorStop(i / 20, _lerpColor(i / 20));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  const rangeEl = document.getElementById('heatmap-range-label');
  const ds      = HEATMAP_DATA[_heatmapProp];
  if (rangeEl) rangeEl.textContent = `${Math.round(minVal)}–${Math.round(maxVal)} ${ds.unit}`;
}

function _initHeatmap(initialProp) {
  _heatmapProp = initialProp || 'r';

  function render(prop) {
    _heatmapProp = prop;
    const container = document.getElementById('heatmap-container');
    if (!container) return;
    const { svg, min, max } = _buildHeatmapSVG(prop);
    container.innerHTML = svg;
    _drawHeatmapLegend(min, max);

    // Tooltip no hover
    container.querySelectorAll('.hm-cell').forEach(cell => {
      cell.addEventListener('mouseenter', () => {
        const z   = parseInt(cell.dataset.z, 10);
        const idx = z - 1;
        const ds  = HEATMAP_DATA[_heatmapProp];
        const v   = ds.vals[idx];
        cell.querySelector('rect').style.strokeWidth = '1.5';
        cell.querySelector('rect').style.stroke = '#fff';
        const tip = document.createElement('title');
        tip.textContent = `${HEATMAP_SYMBOLS[idx]} (Z=${z}): ${v > 0 ? v + ' ' + ds.unit : 'N/D'}`;
        cell.appendChild(tip);
      });
      cell.addEventListener('mouseleave', () => {
        cell.querySelector('rect').style.stroke = '';
      });
    });

    document.querySelectorAll('#heatmap-btns [data-heatprop]').forEach(b => {
      b.className = 'btn btn-xs ' + (b.dataset.heatprop === prop ? 'btn-secondary' : 'btn-ghost');
    });
  }

  render(_heatmapProp);

  document.querySelectorAll('#heatmap-btns [data-heatprop]').forEach(btn => {
    btn.addEventListener('click', () => render(btn.dataset.heatprop));
  });
}

export function destroy() {
  _filterCat = null;
  if (_trendAnimId) { cancelAnimationFrame(_trendAnimId); _trendAnimId = null; }
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
    <p class="module-text">
      Íons de metais de transição possuem orbitais d parcialmente preenchidos e alta densidade
      de carga — condições ideais para aceitar pares de elétrons de ligantes (base de Lewis).
      O complexo resultante tem propriedades radicalmente diferentes do íon nu: cor intensa,
      magnetismo alterado, solubilidade modificada e reatividade controlada. A
      <strong>teoria do campo cristalino (TCC)</strong> modela os ligantes como cargas pontuais
      negativas que se aproximam do metal e quebram a degenerescência dos cinco orbitais d.
      Em geometria octaédrica, os orbitais se dividem em t₂g (estabilizados: dxy, dxz, dyz)
      e eg (desestabilizados: dx²-y², dz²). A separação energética Δo determina se o complexo
      será de <em>baixo spin</em> (ligantes de campo forte, Δo > P, emparelhamento forçado)
      ou <em>alto spin</em> (campo fraco, elétrons em orbitais de mais alta energia).
    </p>

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
    <p class="module-text">
      As tendências periódicas emergem diretamente da estrutura eletrônica dos átomos.
      Ao longo de um <strong>período</strong> (esquerda → direita), a carga nuclear Z aumenta
      enquanto os elétrons são adicionados ao mesmo nível de energia — o aumento de Z efetivo
      (Z_ef = Z - blindagem) contrai os orbitais. Ao longo de um <strong>grupo</strong>
      (cima → baixo), elétrons são adicionados a níveis cada vez mais externos e a blindagem
      dos elétrons internos reduz a atração do núcleo — os orbitais se expandem.
      Esses dois efeitos opostos explicam todo o comportamento observável.
    </p>
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:var(--space-4)">
      <button class="btn btn-sm btn-secondary active" data-trend="r">Raio atômico</button>
      <button class="btn btn-sm btn-secondary"        data-trend="en">Eletronegatividade</button>
      <button class="btn btn-sm btn-secondary"        data-trend="ie">Energia de ionização</button>
    </div>
    <div class="info-card" id="trend-panel">${_trendText('r')}</div>
    <div class="canvas-frame" id="trend-canvas-frame" style="min-height:120px;margin-top:var(--space-3)">
      <canvas id="trend-canvas" aria-label="Gráfico de tendência periódica"></canvas>
    </div>
    <!-- Calculadora de Z efetivo -->
    <div style="margin-top:var(--space-5)">
      <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
        Calculadora de Z efetivo — Regras de Slater
      </h3>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-3)">
        Z<sub>ef</sub> = Z - σ (blindagem). Elétrons da mesma camada contribuem 0,35 de blindagem;
        camada (n-1) contribui 0,85; camadas mais internas contribuem 1,00.
        O Z<sub>ef</sub> crescente ao longo do período explica a contração do raio e o aumento da eletronegatividade.
      </p>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:var(--space-3)">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:120px">Número atômico Z:</span>
        <input type="range" id="zef-z" min="1" max="36" step="1" value="11"
               style="width:160px;accent-color:var(--accent-electron)">
        <span id="zef-z-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:30px">11</span>
      </div>
      <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
        <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Elemento</p><div id="zef-elem" style="font-size:var(--text-base);font-weight:700;color:var(--accent-electron)">—</div></div>
        <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Config. eletrônica</p><div id="zef-config" style="font-size:var(--text-xs);font-family:monospace;color:var(--accent-bond)">—</div></div>
        <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Blindagem σ</p><div id="zef-sigma" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div></div>
        <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Z<sub>ef</sub> (Slater)</p><div id="zef-zef" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div></div>
      </div>
    </div>
  </section>

  <!-- Mapa de calor -->
  <section class="module-section">
    <h2 class="module-section-title">Mapa de calor — tabela periódica</h2>
    <p class="module-text">
      Cada elemento é colorido pela intensidade da propriedade selecionada.
      Elementos em cinza não possuem dado disponível para essa grandeza.
    </p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:var(--space-3)" id="heatmap-btns">
      <button class="btn btn-xs btn-secondary" data-heatprop="r">Raio atômico</button>
      <button class="btn btn-xs btn-ghost"     data-heatprop="ie">E. ionização</button>
      <button class="btn btn-xs btn-ghost"     data-heatprop="en">Eletronegatividade</button>
      <button class="btn btn-xs btn-ghost"     data-heatprop="af">Af. eletrônica</button>
    </div>
    <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:var(--space-3)">
      <span style="font-size:var(--text-xs);color:var(--text-muted);min-width:34px">Baixo</span>
      <canvas id="heatmap-legend-canvas" width="160" height="12"
              style="border-radius:3px;display:block"></canvas>
      <span style="font-size:var(--text-xs);color:var(--text-muted)">Alto</span>
      <span id="heatmap-range-label"
            style="font-size:var(--text-xs);color:var(--accent-electron);margin-left:.5rem"></span>
    </div>
    <div class="periodic-table-wrapper">
      <div id="heatmap-container"></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/5)</h2>
    <div class="exercise-card">
      <p class="exercise-question" id="ex-question">
        Ao percorrer o <strong>Período 3</strong> da esquerda para a direita (Na → Ar),
        o que acontece com a <strong>eletronegatividade</strong>?
      </p>
      <div class="exercise-options" id="pt-ex-options" role="group">
        ${['Diminui progressivamente','Aumenta progressivamente','Permanece constante','Varia sem padrão'].map(o =>
          `<button class="exercise-option" data-answer="${esc(o)}">${esc(o)}</button>`
        ).join('')}
      </div>
      <div class="hint-box" id="pt-ex-hint"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next" style="margin-top:1rem;display:none">Próximo exercício &#8594;</button>
      <div class="exercise-feedback" id="pt-ex-feedback"></div>
      <div class="exercise-actions">
        <button class="btn btn-secondary btn-sm" id="pt-btn-hint">Usar dica</button>
        <button class="btn btn-primary btn-sm"   id="pt-btn-check" style="display:none">Verificar</button>
      </div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Onde isso aparece na vida real?</h2>
    <p class="module-text">
      A tabela periódica não é apenas um catálogo — é um mapa preditivo. Mendeleev previu
      a existência e as propriedades do germânio (eka-silício) antes de sua descoberta, em 1871.
      Hoje, a posição de um elemento prediz seu estado de oxidação preferencial, tipo de ligação,
      solubilidade de seus compostos, comportamento ácido-base de seus óxidos e reatividade
      química geral. O bloco d (metais de transição) é peculiar: os orbitais 4s e 3d têm
      energias próximas — pequenas variações determinam catálise, magnetismo e cor.
    </p>
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
