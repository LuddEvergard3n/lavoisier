/**
 * modules/organic/index.js — Módulo: Química Orgânica
 * Lavoisier — Laboratório Visual de Química
 *
 * Implementa:
 *  - Visualizador SVG de cadeias carbônicas (alcanos C1–C6)
 *  - Funções orgânicas interativas com exemplos
 *  - Representação estrutural e molecular
 *  - Exercício guiado
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';

/* -----------------------------------------------------------------------
   Alcanos C1–C6 com fórmulas e propriedades
----------------------------------------------------------------------- */
const ALKANES = [
  { n:1, name:'Metano',  formula:'CH₄',      molar:16.04,  bp:-161, use:'Gás natural, combustível' },
  { n:2, name:'Etano',   formula:'C₂H₆',     molar:30.07,  bp:-89,  use:'Gás liquefeito, petroquímica' },
  { n:3, name:'Propano', formula:'C₃H₈',     molar:44.10,  bp:-42,  use:'Botijão de gás (GLP)' },
  { n:4, name:'Butano',  formula:'C₄H₁₀',    molar:58.12,  bp:-1,   use:'Isqueiros, GLP' },
  { n:5, name:'Pentano', formula:'C₅H₁₂',    molar:72.15,  bp:36,   use:'Solvente, gasolina' },
  { n:6, name:'Hexano',  formula:'C₆H₁₄',    molar:86.18,  bp:69,   use:'Solvente industrial, gasolina' },
];

/* -----------------------------------------------------------------------
   Funções orgânicas
----------------------------------------------------------------------- */
const FUNCTIONS = [
  {
    name:    'Álcool',
    group:   '—OH',
    example: 'Etanol (C₂H₅OH)',
    use:     'Bebidas, combustível (etanol veicular), antisséptico',
    color:   '#4fc3f7',
    smiles:  'CCO',
  },
  {
    name:    'Ácido carboxílico',
    group:   '—COOH',
    example: 'Ácido acético (CH₃COOH)',
    use:     'Vinagre, conservantes alimentares, síntese de polímeros',
    color:   '#ef476f',
    smiles:  'CC(=O)O',
  },
  {
    name:    'Éster',
    group:   '—COO—',
    example: 'Acetato de etila (CH₃COOC₂H₅)',
    use:     'Aroma de frutas artificiais, solvente de tintas e esmaltes',
    color:   '#6bcb77',
    smiles:  'CCOC(=O)C',
  },
  {
    name:    'Amina',
    group:   '—NH₂',
    example: 'Metilamina (CH₃NH₂)',
    use:     'Síntese de medicamentos, corantes, borracha',
    color:   '#ffd166',
    smiles:  'CN',
  },
  {
    name:    'Aldeído',
    group:   '—CHO',
    example: 'Formaldeído (HCHO)',
    use:     'Conservação (formalina), síntese de plásticos (baquelite)',
    color:   '#ffa726',
    smiles:  'C=O',
  },
  {
    name:    'Cetona',
    group:   'C=O (interno)',
    example: 'Propanona / Acetona (CH₃COCH₃)',
    use:     'Solvente universal, removedor de esmalte, síntese química',
    color:   '#b39ddb',
    smiles:  'CC(=O)C',
  },
];

/* -----------------------------------------------------------------------
   Estado do módulo — resetado em render()
----------------------------------------------------------------------- */
let _alkaneN     = 1;
let _funcIndex   = 0;
let _exAttempts  = 0;
let _exDone      = false;

/* -----------------------------------------------------------------------
   Gerar SVG da cadeia carbônica (estrutural em zigue-zague)
----------------------------------------------------------------------- */
function alkaneSVG(n) {
  const W   = 480;
  const H   = 120;
  const cx  = (W - (n - 1) * 70) / 2;
  const cy  = H / 2;
  const dx  = 70;
  const dy  = 28;

  let paths = '';
  let atoms = '';
  let hLabels = '';

  const positions = [];
  for (let i = 0; i < n; i++) {
    const x = cx + i * dx;
    const y = cy + (i % 2 === 0 ? 0 : dy);
    positions.push({ x, y });
  }

  // ligações C—C
  for (let i = 0; i < n - 1; i++) {
    const a = positions[i];
    const b = positions[i + 1];
    paths += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"
               stroke="#4fc3f7" stroke-width="2"/>`;
  }

  // hidrogênios e carbono
  positions.forEach(({ x, y }, i) => {
    const hCount = i === 0 || i === n - 1 ? 3 : 2;
    const isTop  = i % 2 === 0;

    // hidrogênios
    if (hCount === 3) {
      // terminal: H acima, H abaixo, H lateral
      const hDirs = i === 0
        ? [{ dx:-28, dy:0 }, { dx:0, dy:-22 }, { dx:0, dy:22 }]
        : [{ dx:28, dy:0 },  { dx:0, dy:-22 }, { dx:0, dy:22 }];
      hDirs.forEach(d => {
        paths += `<line x1="${x}" y1="${y}" x2="${x+d.dx}" y2="${y+d.dy}"
                  stroke="#8b949e" stroke-width="1.5"/>`;
        hLabels += `<text x="${x+d.dx}" y="${y+d.dy+4}" text-anchor="middle"
                    font-size="11" fill="#8b949e">H</text>`;
      });
    } else {
      // interno: H perpendicular
      const perpY = isTop ? -22 : 22;
      paths += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+perpY}"
                stroke="#8b949e" stroke-width="1.5"/>`;
      hLabels += `<text x="${x}" y="${y+perpY+(perpY>0?12:-4)}" text-anchor="middle"
                  font-size="11" fill="#8b949e">H</text>`;
    }

    // átomo de carbono
    atoms += `<circle cx="${x}" cy="${y}" r="14" fill="#1c2128" stroke="#4fc3f7" stroke-width="1.5"/>
              <text x="${x}" y="${y+4}" text-anchor="middle" font-size="11" fill="#e6edf3" font-weight="600">C</text>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-height:120px" aria-hidden="true">
    ${paths}${hLabels}${atoms}
  </svg>`;
}

/* -----------------------------------------------------------------------
   Exercício
----------------------------------------------------------------------- */
const EXERCISES = [
  { q: 'O etanol (C₂H₅OH) pertence à função orgânica:', opts: ['Éster','Ácido carboxílico','Álcool','Aldeído'], ans: 2, exp: 'Álcoois têm -OH ligado a C sp³. Etanol: CH₃CH₂OH. Diferente de fenol (C sp²) e ácidos (-COOH).', hint: 'O grupo -OH ligado a carbono saturado (sp³) caracteriza qual função?' },
  { q: 'Na SN2 de (R)-2-bromobutano com OH⁻, o produto principal é:', opts: ['(R)-2-butanol (retenção)','(S)-2-butanol (inversão de Walden)','Racemato 50:50','Alceno por eliminação'], ans: 1, exp: 'SN2 é concertada com ataque traseiro (180°) → inversão de configuração: R → S.', hint: 'SN2 sempre inverte a configuração no centro quiral.' },
  { q: 'Qual reagente dá adição Markovnikov a alcenos?', opts: ['HBr','Br₂/CCl₄','H₂/Ni','NaOH'], ans: 0, exp: 'HBr adiciona H ao C mais hidrogenado (Markovnikov). Br₂/CCl₄ dá adição anti sem Markovnikov.', hint: 'Markovnikov descreve adição de HX. Qual tem H e halogênio?' },
  { q: 'Ordem crescente de acidez: CH₄, C₂H₄, C₂H₂, CH₃COOH?', opts: ['CH₄<C₂H₂<C₂H₄<CH₃COOH','CH₃COOH<C₂H₂<C₂H₄<CH₄','C₂H₂<C₂H₄<CH₄<CH₃COOH','CH₄<C₂H₄<C₂H₂<CH₃COOH'], ans: 3, exp: 'Acidez ∝ caráter s do C-H. sp³(CH₄,pKa≈50) < sp²(C₂H₄,pKa≈44) < sp(C₂H₂,pKa≈25) < ácido carboxílico(pKa≈5).', hint: 'Maior caráter s do orbital → melhor estabilização do ânion → maior acidez.' },
  { q: 'O benzeno não descolore KMnO₄ aquoso porque:', opts: ['É saturado','Aromaticidade estabiliza o anel — prefere substituição a adição','É alcano cíclico','Tem apenas ligações simples'], ans: 1, exp: '6 elétrons π deslocalizados (Hückel, 4n+2, n=1) estabilizam ~150 kJ/mol. Reage por SEAr, não adição.', hint: 'O que seria perdido na adição ao benzeno?' },,
  { q:'O nome IUPAC do CH₃-CH₂-CH₂-OH é:', opts:['Propanol-1','1-propanol','n-propil álcool','Propan-1-ol (IUPAC 2013)'], ans:3, exp:'IUPAC 2013: sufixo da função + locante: propan-1-ol. A numeração deve dar o menor locante ao grupo funcional. Propan-1-ol = 3 carbonos (propano) + OH na posição 1.', hint:'IUPAC: nome da cadeia + sufixo da função + locante mínimo.' },
  { q:'Qual par é de isômeros constitucionais (mesma fórmula molecular, conectividade diferente)?', opts:['Enantiômeros do ácido lático','Etanol (C₂H₅OH) e éter dimetílico (CH₃OCH₃)','Isômeros cis-trans do 2-buteno','Conformações do ciclohexano'], ans:1, exp:'Etanol e éter dimetílico têm mesma fórmula C₂H₆O, mas conectividades diferentes: CH₃CH₂OH vs CH₃OCH₃. São isômeros constitucionais (estruturais). Enantiômeros têm mesma conectividade mas imagem especular.', hint:'Isômeros constitucionais: mesma fórmula molecular, diferente conectividade.' },
  { q:'No mecanismo SN2, o nucleófilo ataca pelo lado posterior (back-attack) causando:', opts:['Retenção de configuração','Inversão de Walden (configuração invertida no carbono central)','Racemização completa','Formação de carbocátion'], ans:1, exp:'SN2: nucleófilo ataca pelo lado oposto ao grupo abandonador em estado de transição trigonal bipiramidal. Resultado: inversão total de configuração (R→S ou S→R). Favorecida por substratos primários e nucleófilos fortes.', hint:'SN2 = inversão de Walden. SN1 = racemização.' },
  { q:'A saponificação do triglicerídeo com NaOH produz:', opts:['Éster + água','Glicerol + 3 sais de ácidos graxos (sabão)','Ácido graxo + glicerol','Glicerol + 3 ácidos graxos livres'], ans:1, exp:'Saponificação = hidrólise alcalina de éster. Triglicerídeo + 3NaOH → glicerol + 3 RCOONa (sabão). O sabão é o sal do ácido graxo. A hidrólise ácida daria os ácidos graxos livres, não o sal.', hint:'NaOH + éster = saponificação → sal (sabão) + álcool. Hidrólise ácida → ácido livre.' },
  { q:'Qual reação transforma alqueno em álcool em uma etapa via hidratação com Markovnikov?', opts:['Halogenação','Hidratação (H₂SO₄/H₂O) — H se adiciona ao carbono com mais H','Hidrogenação','Ozonólise'], ans:1, exp:'Hidratação de alqueno: H₂C=CH₂ + H₂O/H⁺ → CH₃CH₂OH. Markovnikov: H vai ao C mais hidrogenado (forma carbocátion mais estável). Ex: CH₃CH=CH₂ → CH₃CH(OH)CH₃ (isopropanol, não propanol).', hint:'Markovnikov: H no carbono com mais H já ligados (carbocátion mais estável).' },
  { q:'Qual grupo funcional reage com NaHCO₃ (base fraca) liberando CO₂?', opts:['Álcool','Ácido carboxílico (pKa ≈ 4-5, forte o suficiente para reagir com HCO₃⁻)','Cetona','Amina'], ans:1, exp:'RCOOH + NaHCO₃ → RCOONa + H₂O + CO₂. Ácidos carboxílicos (pKa ≈ 4-5) são suficientemente ácidos para protonar HCO₃⁻ (pKa do H₂CO₃ ≈ 6,4). Álcoois (pKa ≈ 16) e fenóis simples não reagem com NaHCO₃.', hint:'NaHCO₃ reage com ácidos de pKa < ~6. RCOOH sim. ArOH não. ROH não.' },
  { q:'O ácido acético (CH₃COOH) tem pKa = 4,76 e o fenol (C₆H₅OH) tem pKa = 9,9. Por que ácidos carboxílicos são mais ácidos que fenóis?', opts:['Carbono é mais eletronegativo que oxigênio','A carga negativa em CH₃COO⁻ é deslocalizada em dois oxigênios equivalentes (ressonância maior estabilização)','Fenol tem anel aromático que diminui acidez','CH₃COOH tem ligação mais curta'], ans:1, exp:'CH₃COO⁻: dois ressonâncias equivalentes com carga em cada O. PhO⁻: carga deslocalizada no anel, mas não equivalentemente. A estabilização do carboxilato por ressonância simétrica é muito maior que a do fenolato → ácido carboxílico mais estável → mais ácido.', hint:'Maior estabilidade do ânion conjugado = ácido mais forte.' },
  { q:'Na adição de HBr a CH₂=CH₂, qual é o mecanismo?', opts:['Radical livre','Eletrofílico (AdE): H⁺ ataca π → carbocátion → Br⁻ ataca cátion','Nucleofílico','Sigmatrópico'], ans:1, exp:'Alquenos são ricos em elétrons π → reagem com eletrófilo H⁺. Etapa 1: H⁺ ataca π, forma carbocátion (CH₃CH₂⁺ ou similar). Etapa 2: Br⁻ ataca o carbocátion. Mecanismo de adição eletrofílica (AdE).', hint:'Alquenos = ricos em e⁻. Reagem com eletrófilo. AdE = adição eletrofílica.' },
  { q:'A separação de enantiômeros (resolução) é necessária na farmácia porque:', opts:['Enantiômeros têm pontos de fusão diferentes','Um enantiômero pode ser eficaz e o outro inativo ou tóxico (ex: talidomida)','São facilmente separáveis por destilação','Têm solubilidades muito diferentes em água'], ans:1, exp:'Enantiômeros têm propriedades físicas idênticas em meio aquiral, mas diferentes atividades biológicas (interagem de forma distinta com sítios ativos quirais). Talidomida: (+) antiemético; (-) teratogênico. Ibuprofeno: (S)-(+) ativo; (R)-(-) quase inativo.', hint:'Sítios ativos enzimáticos são quirais → distinguem enantiômeros.' },
  { q:'O produto majoritário da nitração do benzeno com HNO₃/H₂SO₄ é:', opts:['1,2-dinitrobenzeno','Nitrobenzeno (monosubstituição preferencial)','Cicloexano (perda de aromaticidade)','Ácido benzóico'], ans:1, exp:'SEAr (substituição eletrofílica aromática): NO₂⁺ (gerado por HNO₃ + H₂SO₄) ataca o anel. Em condições normais (T amb, proporção 1:1), a monosubstituição é preferencial. Nitrobenzeno desativa o anel para segunda nitração.', hint:'SEAr: anel ataca eletrófilo (NO₂⁺), restaura aromaticidade. Monosubstituição é cinética.' }
];

/* -----------------------------------------------------------------------
   render()
----------------------------------------------------------------------- */

  const ISOMERS = [
    {
      title: 'Isomeria de cadeia — C₄H₁₀',
      desc: 'Mesma fórmula, diferente arranjo da cadeia carbônica.',
      items: [
        { name:'n-butano', struct:'CH₃–CH₂–CH₂–CH₃', bp:'-1°C', note:'cadeia normal (linear)' },
        { name:'isobutano', struct:'(CH₃)₃CH', bp:'-12°C', note:'cadeia ramificada; ponto de ebulição menor' },
      ]
    },
    {
      title: 'Isomeria de posição — C₄H₈ (alcenos)',
      desc: 'Mesma fórmula, posição diferente da dupla ligação.',
      items: [
        { name:'but-1-eno', struct:'CH₂=CH–CH₂–CH₃', bp:'-6°C', note:'dupla no C1' },
        { name:'but-2-eno', struct:'CH₃–CH=CH–CH₃',  bp:'+1°C', note:'dupla no C2' },
      ]
    },
    {
      title: 'Isomeria de função — C₂H₆O',
      desc: 'Mesma fórmula, grupos funcionais diferentes.',
      items: [
        { name:'etanol',         struct:'CH₃–CH₂–OH',   bp:'+78°C', note:'álcool; faz ligação de H' },
        { name:'éter metílico',  struct:'CH₃–O–CH₃',    bp:'-24°C', note:'éter; ponto de ebulição muito menor' },
      ]
    },
    {
      title: 'Isomeria de metameria — C₅H₁₂O (éteres)',
      desc: 'Mesma função orgânica, diferente distribuição da cadeia carbônica em torno do heteroátomo.',
      items: [
        { name:'metil butil éter',  struct:'CH₃–O–C₄H₉',       bp:'+71°C', note:'cadeia de 1C + 4C em torno do O' },
        { name:'etil propil éter',  struct:'C₂H₅–O–C₃H₇',      bp:'+63°C', note:'cadeia de 2C + 3C em torno do O' },
        { name:'dipropil éter',     struct:'C₃H₇–O–C₃H₇',      bp:'+91°C', note:'cadeias iguais de 3C; isômero de função com 1-pentanol C₅H₁₁OH' },
      ]
    },
    {
      title: 'Tautomeria cetona-enol — C₃H₆O',
      desc: 'Equilíbrio dinâmico entre dois isômeros interconvertíveis. Não é isomeria estática — a estrutura muda em solução.',
      items: [
        { name:'propanona (cetona)', struct:'CH₃–CO–CH₃',         bp:'+56°C', note:'Forma predominante (>99%). Grupo carbonila C=O.' },
        { name:'prop-1-en-2-ol (enol)', struct:'CH₂=C(OH)–CH₃',  bp:'?',     note:'Forma minoritária (<1%). Grupo enol C=C–OH. Mais reativo.' },
      ]
    },
    {
      title: 'Isomeria geométrica — cis/trans C₄H₈',
      desc: 'Grupos no mesmo lado (cis) ou lados opostos (trans) da dupla.',
      items: [
        { name:'cis-but-2-eno', struct:'H₃C   CH₃\n   C=C\nH     H', bp:'+4°C', note:'grupos iguais no mesmo lado' },
        { name:'trans-but-2-eno', struct:'H₃C   H\n   C=C\nH     CH₃', bp:'+1°C', note:'grupos iguais em lados opostos' },
      ]
    },
  ];

let _exIdx     = 0;
export function render(outlet) {
  _alkaneN    = 1;
  _funcIndex  = 0;
  _exAttempts = 0;
  _exDone     = false;

  outlet.innerHTML = `
<div class="page module-page">

  <button class="module-back btn-ghost" data-nav="/modules">
    &larr; Módulos
  </button>

  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="6" cy="12" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="12" cy="18" r="2"/>
        <line x1="8" y1="12" x2="10" y2="12"/><line x1="14" y1="12" x2="16" y2="12"/>
        <line x1="12" y1="8" x2="12" y2="10"/><line x1="12" y1="14" x2="12" y2="16"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Química Orgânica</h1>
      <p class="module-subtitle">Carbono, cadeias carbônicas, funções orgânicas e compostos do cotidiano.</p>
    </div>
  </header>

  <!-- Fenômeno -->
    <!-- Estereoquímica -->
  <section class="module-section">
    <h2 class="module-section-title">Estereoquímica</h2>
    <p class="module-text">Moléculas com a mesma conectividade mas arranjo espacial diferente são esteroisômeros. Um carbono com 4 substituintes diferentes é um <strong>centro estereogênico (quiral)</strong>. Os dois enantiômeros são imagem especular não-sobreponível — como as mãos.</p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Sistema R/S (CIP)</h3>
        <p style="font-size:var(--text-sm)">Regra de Cahn-Ingold-Prelog: prioridade por número atômico. Com substituinte de menor prioridade apontando para trás: R (rectus) = horário; S (sinister) = anti-horário.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Enantiômeros</h3>
        <p style="font-size:var(--text-sm)">Imagens especulares não-sobreponíveis. Propriedades físicas idênticas, mas rotação do plano de luz polarizada oposta: (+) dextrogiro, (-) levogiro. Farmacologia: talidomida R é sedativo, S é teratogênico.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Diastereômeros</h3>
        <p style="font-size:var(--text-sm)">Esteroisômeros que não são imagens especulares. 2 centros quirais → 4 esteroisômeros max. Ex: tartarato (meso = aquirale com 2 centros). Propriedades físicas diferentes.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Isomeria cis/trans E/Z</h3>
        <p style="font-size:var(--text-sm)">Em alcenos: impedimento de rotação na dupla C=C. E (entgegen) = grupos de maior prioridade em lados opostos; Z (zusammen) = mesmo lado. Ex: ácido maleico (Z) vs fumárico (E).</p>
      </div>
    </div>
  </section>

  <!-- Mecanismos de reação -->
  <section class="module-section">
    <h2 class="module-section-title">Mecanismos de reação orgânica</h2>
    <p class="module-text">Mecanismos descrevem o caminho passo a passo — quebra e formação de ligações, intermediários, estado de transição. Quatro mecanismos fundamentais em química orgânica:</p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">SN2 — Substituição bimolecular</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">Nu⁻ + R-X → R-Nu + X⁻</p>
        <p style="font-size:var(--text-sm);margin-top:.4rem">Concertado: Nu ataca por trás, X sai simultaneamente. Estado de transição trigonal bipiramidal. Inversão de configuração (inversão de Walden). Favorecido em C primário, Nu forte, solvente aprótico polar (DMSO, DMF).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">SN1 — Substituição unimolecular</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">R-X → R⁺ + X⁻ → R-Nu</p>
        <p style="font-size:var(--text-sm);margin-top:.4rem">Dois passos: formação de carbocátion (etapa lenta) + ataque do nucleófilo (etapa rápida). Racemização. Favorecido em C terciário, Nu fraco, solvente prótico polar (água, álcoois).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">E2 — Eliminação bimolecular</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">Base + R-CHX-CH₂ → R-CH=CH₂ + HX</p>
        <p style="font-size:var(--text-sm);margin-top:.4rem">Concertado: base remove H-β, X⁻ sai, dupla liga forma. Anti-periplanar obrigatório. Regra de Zaitsev: alceno mais substituído. Base volumosa → Hofmann (menos substituído).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Adição eletrofílica (EA)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">R-CH=CH₂ + HX → R-CHX-CH₃</p>
        <p style="font-size:var(--text-sm);margin-top:.4rem">Alcenos: π reage com eletrofílico. Regra de Markovnikov: H vai ao C mais hidrogenado; X ao menos. Intermediário carbocátion: estabilidade 3° &gt; 2° &gt; 1°. Rearranjos possíveis (Wagner-Meerwein).</p>
      </div>
    </div>
  </section>

  <!-- Simulação SN2 + Newman -->
  <section class="module-section">
    <h2 class="module-section-title">Simulação interativa — SN2 e projeção de Newman</h2>
    <p class="module-text">
      Na SN2 o nucleófilo ataca <em>exatamente 180°</em> em relação ao grupo de saída
      (ataque traseiro). O estado de transição tem geometria trigonal bipiramidal com
      carbono central pentacoordinado. O resultado é a <strong>inversão de Walden</strong>:
      se o carbono é quiral, a configuração inverte de R para S ou vice-versa.
    </p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:var(--space-3)" id="sn2-ctrl">
      <button class="btn btn-xs btn-secondary" id="sn2-play">Iniciar SN2</button>
      <button class="btn btn-xs btn-ghost"     id="sn2-reset">Reiniciar</button>
      <span id="sn2-phase" style="font-size:var(--text-xs);color:var(--text-muted);align-self:center;margin-left:.5rem"></span>
    </div>
    <div class="canvas-frame" id="sn2-frame" style="min-height:200px">
      <canvas id="sn2-canvas" aria-label="Animação SN2"></canvas>
    </div>
    <p class="module-text" style="margin-top:var(--space-4)">
      A <strong>projeção de Newman</strong> mostra a molécula ao longo de uma ligação C–C,
      com o carbono frontal no centro e o traseiro no círculo. Rotacione para ver como
      as conformações (antiperiplanar, gauche, eclipsada) afetam a estabilidade.
    </p>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:var(--space-3)">
      <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">Ângulo de torção φ:</span>
      <input type="range" id="newman-phi" min="0" max="360" step="1" value="60"
             style="width:160px;accent-color:var(--accent-electron)">
      <span id="newman-phi-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">60°</span>
      <span id="newman-conf" style="font-size:var(--text-xs);font-weight:600;padding:.2rem .5rem;border-radius:var(--radius-sm);background:var(--bg-raised);color:var(--accent-bond)"></span>
    </div>
    <div style="display:flex;gap:var(--space-4);flex-wrap:wrap;align-items:flex-start">
      <div class="canvas-frame" id="newman-frame" style="min-height:180px;flex:0 0 200px">
        <canvas id="newman-canvas" aria-label="Projeção de Newman"></canvas>
      </div>
      <div id="newman-energy" style="flex:1;min-width:180px"></div>
    </div>
  </section>


  <!-- Polímeros -->
  <section class="module-section">
    <h2 class="module-section-title">Polímeros</h2>
    <p class="module-text">Polímeros são macromoléculas formadas pela repetição de unidades monoméricas. Massa molar: 10³ a 10⁷ g/mol. Dois mecanismos de polimerização principais:</p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-electron)">Adição (cadeia)</h3><p style="font-size:var(--text-sm)">Monômero com insaturação. Radical/aniônico/catiônico/Ziegler-Natta. Exemplos: polietileno (PE, embalagens), PVC (tubulações), polipropileno (PP, fibras têxteis), PTFE (Teflon, antiaderente).</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-bond)">Condensação (passo)</h3><p style="font-size:var(--text-sm)">Reação entre grupos funcionais com liberação de pequena molécula (H₂O, HCl). Nylon-6,6: diaminohexano + ácido adípico → poliamida + H₂O. Poliéster PET: tereftalato + etilenoglicol.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Biopolímeros</h3><p style="font-size:var(--text-sm)">Proteínas (poli-aminoácidos, ligação peptídica), DNA/RNA (poli-nucleotídeos, fosfodiéster), celulose/amido (poli-glicose, glicosídica). Todos por condensação biológica.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Propriedades</h3><p style="font-size:var(--text-sm)">Termoplástico: amolece com calor (PE, PVC) — reciclável. Termofixo: reticulado (baquelite, borracha vulcanizada) — não amolece. Elastômero: alta extensibilidade elástica (borracha natural, silicone).</p></div>
    </div>
  </section>

<section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">
      O plástico da garrafa, o álcool do perfume, o açúcar do café, a gordura do alimento, o nylon
      da roupa e a aspirina no remédio têm algo em comum: são compostos orgânicos — moléculas
      baseadas em carbono. O carbono forma cadeias longas e ramificadas porque faz 4 ligações
      covalentes estáveis, gerando uma diversidade de mais de 10 milhões de compostos conhecidos.
    </p>
  </section>

  <!-- Cadeia carbônica -->
  <section class="module-section">
    <h2 class="module-section-title">Cadeias carbônicas — Alcanos</h2>
    <p class="module-text">Selecione o número de carbonos e veja a estrutura do alcano correspondente.</p>

    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
      ${ALKANES.map(a => `
        <button class="btn btn-sm ${a.n === 1 ? 'btn-secondary' : 'btn-ghost'}"
                id="alkane-btn-${a.n}" data-alkane="${a.n}">${a.n}C — ${a.name}</button>
      `).join('')}
    </div>

    <div id="alkane-svg" style="background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:1rem;margin-bottom:1rem">
      ${alkaneSVG(1)}
    </div>

    <div id="alkane-info" class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.25rem">Fórmula molecular</p>
        <strong id="info-formula" style="color:var(--accent-electron)">${ALKANES[0].formula}</strong>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.25rem">Massa molar</p>
        <strong id="info-molar" style="color:var(--accent-bond)">${ALKANES[0].molar} g/mol</strong>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.25rem">Ponto de ebulição</p>
        <strong id="info-bp" style="color:var(--accent-organic)">${ALKANES[0].bp}°C</strong>
      </div>
      <div class="info-card" style="grid-column:1/-1">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.25rem">Uso</p>
        <span id="info-use" style="font-size:var(--text-sm);color:var(--text-secondary)">${ALKANES[0].use}</span>
      </div>
    </div>
  </section>

  <!-- Funções orgânicas -->
  <section class="module-section">
    <h2 class="module-section-title">Funções orgânicas</h2>
    <p class="module-text">Cada função é definida por um grupo funcional característico.</p>

    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
      ${FUNCTIONS.map((f, i) => `
        <button class="btn btn-sm ${i === 0 ? 'btn-secondary' : 'btn-ghost'}"
                id="func-btn-${i}" data-func="${i}">${esc(f.name)}</button>
      `).join('')}
    </div>

    <div id="func-card" class="info-card" style="gap:.5rem">
      <div style="display:flex;align-items:baseline;gap:1rem">
        <span id="func-group" style="font-size:var(--text-xl);font-weight:700;font-family:monospace;color:${FUNCTIONS[0].color}">${FUNCTIONS[0].group}</span>
        <span id="func-name"  style="font-size:var(--text-sm);color:var(--text-muted)">${FUNCTIONS[0].name}</span>
      </div>
      <p id="func-example" style="font-size:var(--text-sm);color:var(--text-secondary)"><strong>Exemplo:</strong> ${FUNCTIONS[0].example}</p>
      <p id="func-use"     style="font-size:var(--text-sm);color:var(--text-secondary)">${FUNCTIONS[0].use}</p>
    </div>
  </section>


  <!-- Alcenos e Alcinos -->
  <section class="module-section">
    <h2 class="module-section-title">Cadeias insaturadas — Alcenos e Alcinos</h2>
    <p class="module-text">
      Alcanos têm apenas ligações simples C–C (saturados). <strong>Alcenos</strong> têm ao menos
      uma ligação dupla C=C; <strong>alcinos</strong> têm ao menos uma tripla C≡C. Cada grau de
      insaturação adicional representa um par de hidrogênios a menos que a fórmula saturada.
    </p>
    <p class="module-text">
      Fórmula geral: alcanos CₙH₂ₙ₊₂ | alcenos CₙH₂ₙ | alcinos CₙH₂ₙ₋₂
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-top:.75rem">
      <div class="info-card">
        <h3 style="margin-top:0;font-family:monospace">Eteno (C₂H₄)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">H₂C=CH₂<br>1 ligação dupla</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.4rem">Matéria-prima do polietileno (sacolas, tubos)</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;font-family:monospace">Propeno (C₃H₆)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">CH₂=CH–CH₃</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.4rem">Polipropileno (embalagens, peças automotivas)</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;font-family:monospace">Etino (C₂H₂)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">HC≡CH<br>1 ligação tripla</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.4rem">Acetileno: solda oxiacetilénica (3500°C)</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;font-family:monospace">Benzeno (C₆H₆)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">Anel aromático<br>3 duplas alternadas</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.4rem">Solvente industrial, síntese de fármacos</p>
      </div>
    </div>
  </section>

  <!-- Isomeria -->
  <section class="module-section">
    <h2 class="module-section-title">Isomeria</h2>
    <p class="module-text">
      Isômeros têm a mesma fórmula molecular, mas estrutura ou arranjo diferente,
      resultando em propriedades físicas e químicas distintas.
    </p>
    <p class="module-text" style="margin-bottom:.75rem">
      Isomeria <strong>plana (constitucional)</strong>: mesma fórmula molecular, conectividade diferente.
      Isomeria <strong>espacial (estereoisomeria)</strong>: mesma conectividade, arranjo 3D diferente.
    </p>
    <div id="isomer-tabs" style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
      <button class="btn btn-sm btn-secondary" id="iso-btn-0" data-iso="0">Cadeia (C₄H₁₀)</button>
      <button class="btn btn-sm btn-ghost"     id="iso-btn-1" data-iso="1">Posição (C₄H₈)</button>
      <button class="btn btn-sm btn-ghost"     id="iso-btn-2" data-iso="2">Função (C₂H₆O)</button>
      <button class="btn btn-sm btn-ghost"     id="iso-btn-3" data-iso="3">Metameria (C₅H₁₂O)</button>
      <button class="btn btn-sm btn-ghost"     id="iso-btn-4" data-iso="4">Tautomeria (cetona-enol)</button>
      <button class="btn btn-sm btn-ghost"     id="iso-btn-5" data-iso="5">Geométrica (C₄H₈)</button>
    </div>
    <div id="isomer-content" class="module-grid" style="grid-template-columns:1fr 1fr"></div>
  </section>

  <!-- Nomenclatura IUPAC -->
  <section class="module-section">
    <h2 class="module-section-title">Nomenclatura IUPAC</h2>
    <p class="module-text">
      A nomenclatura sistemática segue: <strong>[prefixo de cadeia] + [grau de insaturação] + [sufixo de função]</strong>
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0">Prefixos de cadeia</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">1C: met- | 2C: et-<br>3C: prop- | 4C: but-<br>5C: pent- | 6C: hex-</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0">Sufixos de saturação</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">C–C: -ano<br>C=C: -eno<br>C≡C: -ino</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0">Sufixos de função</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">-ol (álcool)<br>-al (aldeído)<br>-ona (cetona)<br>-oico (ác. carboxílico)</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0">Exemplo completo</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">CH₃CH₂CH₂OH<br>prop + an + ol<br>= <strong>propan-1-ol</strong></p>
      </div>
    </div>
  </section>

  <!-- Propriedades físicas -->
  <section class="module-section">
    <h2 class="module-section-title">Propriedades físicas — forças intermoleculares</h2>
    <p class="module-text">
      O ponto de ebulição (PE) e a solubilidade dependem das forças intermoleculares (FIM):
      <strong>ligação de hidrogênio</strong> (LH: X–H···Y, onde X,Y = N, O, F) &gt;
      <strong>dipolo-dipolo</strong> &gt; <strong>dispersão de London</strong> (Van der Waals).
      Maior FIM → maior PE; "semelhante dissolve semelhante".
    </p>
    <div style="overflow-x:auto;margin:.75rem 0">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Função</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Exemplo</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">PE (°C)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">FIM dominante</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Solubilidade em H₂O</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;color:var(--accent-organic);font-weight:600">Ácido carboxílico</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs)">CH₃COOH (C₂)</td>
            <td style="padding:.4rem .6rem;color:var(--accent-reaction)">+118</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">LH forte (dímeros)</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">Miscível (C₁–C₄)</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;color:var(--accent-organic);font-weight:600">Álcool</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs)">C₂H₅OH (C₂)</td>
            <td style="padding:.4rem .6rem;color:var(--accent-reaction)">+78</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">LH (O–H···O)</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">Miscível (C₁–C₃); ↓ com C</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;color:var(--accent-organic);font-weight:600">Amina (1ária)</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs)">C₂H₅NH₂ (C₂)</td>
            <td style="padding:.4rem .6rem;color:var(--accent-bond)">+17</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">LH (N–H···N); mais fraco que O</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">Solúvel (C₁–C₆)</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;color:var(--accent-organic);font-weight:600">Aldeído</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs)">CH₃CHO (C₂)</td>
            <td style="padding:.4rem .6rem;color:var(--accent-bond)">+20</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">Dipolo C=O; sem LH entre si</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">Miscível (C₁–C₂)</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;color:var(--accent-organic);font-weight:600">Cetona</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs)">(CH₃)₂CO (C₃)</td>
            <td style="padding:.4rem .6rem;color:var(--accent-bond)">+56</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">Dipolo C=O; sem LH entre si</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">Miscível (C₁–C₅); solvente</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;color:var(--accent-organic);font-weight:600">Éster</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs)">CH₃COOC₂H₅ (C₄)</td>
            <td style="padding:.4rem .6rem;color:var(--accent-bond)">+77</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">Dipolo fraco; sem LH entre si</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">Pouco solúvel; aromas frutados</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;color:var(--accent-organic);font-weight:600">Éter</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs)">C₂H₅OC₂H₅ (C₄)</td>
            <td style="padding:.4rem .6rem;color:var(--text-secondary)">+35</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">Dipolo fraco (O polarizado)</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">Levemente solúvel; inflamável</td>
          </tr>
          <tr>
            <td style="padding:.4rem .6rem;color:var(--accent-organic);font-weight:600">Alcano</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs)">C₄H₁₀ (C₄)</td>
            <td style="padding:.4rem .6rem;color:var(--text-muted)">-1</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">London (apolar); cresce com M</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">Insolúvel em água</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr));margin-top:.5rem">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Regra geral de PE</h3>
        <p style="font-size:var(--text-sm)">Mesma massa molar, maior PE quem tem LH. Mesma função, PE sobe com o número de carbono (~20–30 °C por CH₂). Ramificação reduz PE (menos contato entre moléculas).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Álcool vs éter (C₂H₆O)</h3>
        <p style="font-size:var(--text-sm)">Etanol: PE = +78 °C (LH). Éter metílico (dimetil éter): PE = -24 °C (sem LH entre moléculas do éter). Diferença de 102 °C — mesma fórmula molecular!</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Solubilidade</h3>
        <p style="font-size:var(--text-sm)">"Semelhante dissolve semelhante": polares dissolvem em polares (água, etanol); apolares dissolvem em apolares (hexano, éter). Grupo OH torna a molécula mais hidrófila, cadeia carbônica a torna mais hidrófoba.</p>
      </div>
    </div>
  </section>

  <!-- E1 e comparação SN1/SN2/E1/E2 -->
  <section class="module-section">
    <h2 class="module-section-title">E1 — Eliminação unimolecular e diagrama de competição</h2>
    <p class="module-text">
      E1 é o análogo de SN1 para eliminação: carbocátion intermediário, depois proton
      transferido para a base. Competição com SN1 depende da nucleofilicidade vs basicidade
      do reagente e da temperatura (calor favorece eliminação por ΔS).
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        E1: R-X → R⁺ + X⁻ (lento) → Base remove H-β → alceno (rápido)
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Taxa = k[R-X] — depende apenas do substrato (unimolecular).<br>
        Zaitsev: alceno mais substituído (termodinamicamente estável).<br>
        Carbocátion pode sofrer rearranjo antes de eliminar (Wagner-Meerwein).
      </p>
    </div>
    <div style="overflow-x:auto;margin-bottom:var(--space-4)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Mecanismo</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Etapas</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Substrato</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Nucleófilo/Base</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Solvente</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Estereoquímica</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['SN2','1 (concertado)','C primário','Nu forte, base fraca','Aprótico polar (DMSO)','Inversão de Walden'],
            ['SN1','2 (carbocátion)','C terciário','Nu fraco, base fraca','Prótico polar (H₂O)','Racemização'],
            ['E2','1 (concertado)','C 2°/3°','Base forte volumosa','Aprótico polar','Anti-periplanar, Zaitsev/Hofmann'],
            ['E1','2 (carbocátion)','C terciário','Base fraca, T alta','Prótico polar','Zaitsev, possível rearranjo'],
          ].map(_r => { const [m,e,s,n,sol,st]=_r; return `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;font-weight:700;color:var(--accent-electron)">${m}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">${e}</td>
            <td style="padding:.4rem .6rem;color:var(--accent-bond)">${s}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">${n}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${sol}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--accent-organic)">${st}</td>
          </tr>`; }).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- SEAr -->
  <section class="module-section">
    <h2 class="module-section-title">Substituição eletrofílica aromática (SEAr)</h2>
    <p class="module-text">
      O anel aromático ataca eletrófilos ativados para manter a aromaticidade.
      Mecanismo geral: formação de aducto σ (Wheland) → perda de H⁺ → restaura aromaticidade.
      Grupos na posição <em>orto/para-ativadores</em> (doadores: –OH, –NH₂, –CH₃) vs
      <em>meta-desativadores</em> (retiradores: –NO₂, –CF₃, –SO₃H).
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr));margin-bottom:var(--space-5)">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Halogenação</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">C₆H₆ + Br₂ → C₆H₅Br + HBr &nbsp;(cat: FeBr₃)</p>
        <p style="font-size:var(--text-sm)">FeBr₃ ativa Br₂: gera Br⁺ (eletrofílico). Monobromação controlada; dibromação possível em excesso.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Nitração</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">C₆H₆ + HNO₃ → C₆H₅NO₂ + H₂O &nbsp;(cat: H₂SO₄)</p>
        <p style="font-size:var(--text-sm)">H₂SO₄ gera o íon nitrônio NO₂⁺ (forte eletrofílico). Base industrial do TNT, anilina, corantes azo.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Friedel-Crafts — Alquilação</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">C₆H₆ + RCl → C₆H₅R + HCl &nbsp;(cat: AlCl₃)</p>
        <p style="font-size:var(--text-sm)">AlCl₃ gera carbocátion R⁺. Problema: polialquilação e rearranjos de carbocátion. Limitada a C primário sem rearranjo por Scholl.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Friedel-Crafts — Acilação</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">C₆H₆ + RCOCl → C₆H₅COR + HCl &nbsp;(cat: AlCl₃)</p>
        <p style="font-size:var(--text-sm)">Gera cátion acílio RCO⁺ (estável). Sem rearranjo, sem poliacilação (C=O desativador). Usado em síntese de fármacos (ibuprofeno, naproxeno).</p>
      </div>
    </div>
    <div class="info-card" style="background:var(--bg-raised)">
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        <strong style="color:var(--accent-bond)">Efeito mesomérico (+M)</strong> — grupo doa elétrons por ressonância ao anel (–OH, –OR, –NH₂, –NR₂): ativação orto/para.
        <br><strong style="color:var(--accent-reaction)">Efeito mesomérico (–M)</strong> — grupo retira elétrons por ressonância (–NO₂, –C=O, –C≡N): desativação meta.
        <br><strong style="color:var(--accent-electron)">Efeito indutivo (-I)</strong> — retirada por eletronegatividade ao longo da cadeia σ: halogênios são desativadores meta-leves apesar de orto/para-orientadores por +M.
      </p>
    </div>
  </section>

  <!-- Química de Carbonila -->
  <section class="module-section">
    <h2 class="module-section-title">Química de carbonila — adição nucleofílica e condensação aldólica</h2>
    <p class="module-text">
      O grupo carbonila C=O é o centro reativo mais importante da síntese orgânica.
      O carbono carbonílico é eletrofílico (δ+) — alvo de nucleófilos. O oxigênio é
      nucleofílico e básico.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr));margin-bottom:var(--space-5)">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Adição nucleofílica 1,2</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">R₂C=O + Nu⁻ → R₂C(Nu)(O⁻) → produto</p>
        <p style="font-size:var(--text-sm)">Aldeídos &gt; cetonas (menos impedimento + mais δ+). Nu típicos: H⁻ (NaBH₄ → álcool), R⁻Li/RMgX (Grignard → álcool), CN⁻ (cianoidrina), RNH₂ (imina/enamine).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Condensação aldólica</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">2 CH₃CHO → CH₃CH(OH)CH₂CHO (aldol)</p>
        <p style="font-size:var(--text-sm)">Base abstrai H-α (C adjacente à C=O) → enolato (nucleofílico no Cα) ataca outra carbonila. Produto: β-hidroxi carbonila. Desidratação: enona conjugada (α,β-insaturada). Essencial em síntese de C–C.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Reações de acilação</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">RCOCl + Nu → RCONU + Cl⁻</p>
        <p style="font-size:var(--text-sm)">Derivados: cloreto de acila, anidrido, éster, amida — por ordem decrescente de reatividade. Hidrólise de éster (Fischer) e amida. Transesterificação (biodiesel). Acilação de Schotten-Baumann.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Reações de oxidação/redução</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">RCHO → RCOOH (KMnO₄) | R₂C=O → R₂CHOH (NaBH₄)</p>
        <p style="font-size:var(--text-sm)">Aldeídos oxidam facilmente (Tollens, Fehling, KMnO₄). Cetonas resistem à oxidação sem ruptura de cadeia. NaBH₄ reduz C=O sem reduzir C=C. LiAlH₄ mais forte: reduz ésteres, amidas.</p>
      </div>
    </div>
    <!-- Reatividade relativa -->
    <div class="info-card" style="background:var(--bg-raised)">
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        <strong style="color:var(--accent-electron)">Reatividade de derivados de carbonila (nucleofílica):</strong><br>
        Cloreto de acila &gt; Anidrido &gt; Éster ≈ Ácido carboxílico &gt; Amida<br>
        <em>Cada reação converte um derivado mais reativo em outro menos reativo — regra geral de substituição nucleofílica acílica.</em>
      </p>
    </div>
  </section>

  <!-- Reações pericíclicas -->
  <section class="module-section">
    <h2 class="module-section-title">Reações pericíclicas — Diels-Alder e Woodward-Hoffmann</h2>
    <p class="module-text">
      Reações pericíclicas ocorrem via estado de transição cíclico concertado — sem
      intermediários iônicos ou radicais. Controladas pela simetria dos orbitais de fronteira
      (HOMO/LUMO). Três classes: cicloadição, eletrocíclica, sigmatrópica.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr));margin-bottom:var(--space-5)">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Diels-Alder [4+2]</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">Dieno (4π) + dienófilo (2π) → cicloexeno</p>
        <p style="font-size:var(--text-sm)">O dieno deve estar em conformação s-cis. Dienófilo ativado com grupos –C=O, –CN, –NO₂ (abaixam LUMO). Regioquímica: regra orto/para. Estereoquímica: sin (supra-supra). Produto: anel de 6 membros com dois novos centros estereogênicos — controlados (endo/exo).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Regras de Woodward-Hoffmann</h3>
        <p style="font-size:var(--text-sm)">Baseadas na simetria do HOMO do nucleófilo + LUMO do eletrófilo. Para cicloadição [4+2]: HOMO₄π + LUMO₂π → fase compatível (suprafacial em ambos) → permitida termicamente. [2+2] térmico = proibido (fases opostas) → requer fotoquímica. Regra: (4n+2)π térmico = permitido; (4n)π = proibido térmico.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Reações eletrocíclicas</h3>
        <p style="font-size:var(--text-sm)">Abertura/fechamento de anel por rotação de orbitais terminais. Polienio fecha ciclicamente. Sistema 4n (butadieno→ciclobuteno): térmico = disrotatório; fotoquímico = conrotatório. Sistema 4n+2 (hexatrieno→cicloexadieno): térmico = conrotatório; fotoquímico = disrotatório. Estereoquímica prevista rigorosamente.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Retrossíntese</h3>
        <p style="font-size:var(--text-sm)">Estratégia de síntese trabalhando para trás: partir do produto e identificar desconexões (→ precursores) até chegar a materiais disponíveis. Diels-Alder é uma desconexão chave: retro-DA divide o anel em dieno + dienófilo. Notação Corey: ⟹ = passo sintético inverso.</p>
      </div>
    </div>
    <div style="overflow-x:auto;margin-bottom:var(--space-3)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Classe</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Tipo</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Condição térmica</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Condição fotoquímica</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['Cicloadição','[4+2] Diels-Alder','Permitida (supra-supra)','Proibida'],
            ['Cicloadição','[2+2]','Proibida','Permitida'],
            ['Eletrocíclica','4n (butadieno)','Disrotatória','Conrotatória'],
            ['Eletrocíclica','4n+2 (hexatrieno)','Conrotatória','Disrotatória'],
            ['Sigmatrópica','[1,3]-H shift','Proibida','Permitida'],
            ['Sigmatrópica','[1,5]-H shift','Permitida','Proibida'],
            ['Sigmatrópica','[3,3] Cope/Claisen','Permitida','—'],
          ].map(_r => { const [cl,tp,th,ph]=_r; return `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;color:var(--accent-electron)">${cl}</td>
            <td style="padding:.4rem .6rem;font-family:monospace">${tp}</td>
            <td style="padding:.4rem .6rem;color:var(--accent-organic)">${th}</td>
            <td style="padding:.4rem .6rem;color:var(--accent-bond)">${ph}</td>
          </tr>`; }).join('')}
        </tbody>
      </table>
    </div>
  </section>


  <!-- Exercício -->
  <section class="module-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/5)</h2>
    <p class="module-text">${esc(EXERCISES[0].q)}</p>
    <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">
      ${EXERCISES[0].opts.map((opt, i) => `
        <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
                id="ex-opt-${i}" data-exopt="${i}">${esc(opt)}</button>
      `).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next" style="margin-top:1rem;display:none">Próximo exercício &#8594;</button>
  </section>

  <!-- Cotidiano -->
  <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">
      O PET das garrafas plásticas é um poliéster (ésteres encadeados). A Aspirina é ácido
      acetilsalicílico (éster de ácido carboxílico). O nylon é uma poliamida (aminas). A queima
      de combustíveis fósseis libera CO₂ de cadeias carbônicas que ficaram armazenadas por
      milhões de anos — desequilibrando ciclos que levaram eons para se formar.
    </p>
  </div>

</div>
`;

  // botões de alcano
  ALKANES.forEach(a => {
    document.getElementById(`alkane-btn-${a.n}`)?.addEventListener('click', () => {
      _alkaneN = a.n;
      ALKANES.forEach(a2 => {
        const btn = document.getElementById(`alkane-btn-${a2.n}`);
        if (btn) btn.className = `btn btn-sm ${a2.n === a.n ? 'btn-secondary' : 'btn-ghost'}`;
      });
      const svgEl = document.getElementById('alkane-svg');
      if (svgEl) svgEl.innerHTML = alkaneSVG(a.n);
      const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setTxt('info-formula', a.formula);
      setTxt('info-molar',   a.molar + ' g/mol');
      setTxt('info-bp',      a.bp + '°C');
      setTxt('info-use',     a.use);
    });
  });

  // botões de função orgânica
  FUNCTIONS.forEach((f, i) => {
    document.getElementById(`func-btn-${i}`)?.addEventListener('click', () => {
      _funcIndex = i;
      FUNCTIONS.forEach((_, j) => {
        const btn = document.getElementById(`func-btn-${j}`);
        if (btn) btn.className = `btn btn-sm ${j === i ? 'btn-secondary' : 'btn-ghost'}`;
      });
      const setTxt = (id, val, style) => {
        const el = document.getElementById(id);
        if (el) { el.textContent = val; if (style) Object.assign(el.style, style); }
      };
      setTxt('func-group',   f.group, { color: f.color });
      setTxt('func-name',    f.name);
      setTxt('func-example', 'Exemplo: ' + f.example);
      const useEl = document.getElementById('func-use');
      if (useEl) useEl.textContent = f.use;
    });
  });


  function renderIsomers(idx) {
    const iso = ISOMERS[idx];
    const container = document.getElementById('isomer-content');
    if (!container) return;
    container.innerHTML = iso.items.map(item => `
      <div class="info-card">
        <h3 style="margin-top:0;font-family:monospace;color:var(--accent-electron)">${item.name}</h3>
        <pre style="font-family:monospace;font-size:var(--text-sm);color:var(--text-primary);white-space:pre-wrap;background:var(--bg-raised);padding:.5rem;border-radius:var(--radius-sm);margin:.4rem 0">${item.struct}</pre>
        <p style="font-size:var(--text-xs);color:var(--accent-bond)">PE: ${item.bp}</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted)">${item.note}</p>
      </div>
    `).join('');
    document.querySelectorAll('[data-iso]').forEach(btn => {
      btn.className = `btn btn-sm ${parseInt(btn.dataset.iso,10) === idx ? 'btn-secondary' : 'btn-ghost'}`;
    });
  }
  renderIsomers(0);
  document.querySelectorAll('[data-iso]').forEach(btn => {
    btn.addEventListener('click', () => renderIsomers(parseInt(btn.dataset.iso, 10)));
  });


  // exercício
  document.querySelectorAll('[data-exopt]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_exDone) return;
      _exAttempts++;
      const choice = parseInt(btn.dataset.exopt, 10);
      const fb     = document.getElementById('exercise-feedback');
      if (choice === EXERCISE.correct) {
        _exDone = true;
        btn.style.borderColor = 'var(--accent-organic)';
        btn.style.color       = 'var(--accent-organic)';
        if (fb) fb.innerHTML = `<p class="feedback-correct">Correto! ${esc(EXERCISE.explanation)}</p>`;
        markSectionDone('organic', 'exercise');
      } else {
        btn.style.borderColor = 'var(--accent-reaction)';
        btn.style.color       = 'var(--accent-reaction)';
        if (fb && _exAttempts === 1) {
          fb.innerHTML = `<p class="feedback-hint">Dica: identifique o grupo funcional no final da fórmula C₂H₅OH. Que grupo —? é esse?</p>`;
        }
      }
    });
  });
}

/* Sem SimLoop neste módulo — nada para parar */
// ---------------------------------------------------------------------------
// SN2 animation
// ---------------------------------------------------------------------------
const SN2_PHASES = [
  { label: 'Reagente: Nu⁻ se aproxima do C',       t: 0.00, desc: 'Nucleófilo (Nu⁻) inicia ataque traseiro a 180° do grupo de saída X.' },
  { label: 'Estado de transição [Nu…C…X]⁻',        t: 0.50, desc: 'C pentacoordinado. Geometria trigonal bipiramidal. Maior energia.' },
  { label: 'Produto: inversão de Walden completa',  t: 1.00, desc: 'X⁻ sai. Configuração invertida (R→S ou S→R). Nu ligado.' },
];

let _sn2Anim = null;
let _sn2T    = 0;   // 0..1
let _sn2Running = false;

function _initSN2Canvas() {
  const frame  = document.getElementById('sn2-frame');
  const canvas = document.getElementById('sn2-canvas');
  if (!canvas || !frame) return;

  const W   = Math.min(frame.clientWidth || 500, 500);
  const H   = 200;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const cx = W / 2, cy = H / 2;

  // Substitutents on C (3 equatorial groups that invert)
  const GROUPS = ['H', 'CH₃', 'Br'];

  function drawFrame(t) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // t: 0 = reagente, 0.5 = TS, 1 = produto
    // Nu distance: starts far left, ends bonded
    const nuX   = cx - (1 - t) * 140 - 30;  // Nu x
    const xX    = cx + t * 140 + 30;          // X x (leaving)
    const C_X   = cx;
    const opacity_bond_nu = Math.min(1, t * 2);
    const opacity_bond_x  = Math.max(0, 1 - (t - 0.5) * 2);

    // Equatorial groups invert: above → below at t=0.5→1
    const invert = t > 0.5 ? (t - 0.5) * 2 : 0;
    const groupOffsets = [
      { dx: -30, dy: -50 + invert * 100 },
      { dx:  55, dy: -40 + invert * 80  },
      { dx: -10, dy:  55 - invert * 110 },
    ];

    // Draw bond to X (fading)
    ctx.globalAlpha = opacity_bond_x;
    ctx.strokeStyle = '#ef476f';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(C_X, cy); ctx.lineTo(xX, cy); ctx.stroke();
    ctx.setLineDash([]);

    // Draw bond to Nu (appearing)
    ctx.globalAlpha = opacity_bond_nu;
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(C_X, cy); ctx.lineTo(nuX, cy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Equatorial bonds
    groupOffsets.forEach(({ dx, dy }, i) => {
      ctx.strokeStyle = 'rgba(255,209,102,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(C_X, cy);
      ctx.lineTo(C_X + dx, cy + dy);
      ctx.stroke();
      ctx.fillStyle = 'rgba(107,203,119,0.9)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(GROUPS[i], C_X + dx, cy + dy + (dy < 0 ? -4 : 12));
    });

    // Carbon
    ctx.beginPath();
    ctx.arc(C_X, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = t > 0.3 && t < 0.7 ? 'rgba(239,71,111,0.9)' : 'rgba(79,195,247,0.9)';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', C_X, cy);
    ctx.textBaseline = 'alphabetic';

    // Nu atom
    ctx.beginPath();
    ctx.arc(nuX, cy, 11, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(79,195,247,0.85)';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Nu', nuX, cy);
    ctx.textBaseline = 'alphabetic';

    // X atom (leaving)
    ctx.globalAlpha = opacity_bond_x + 0.1;
    ctx.beginPath();
    ctx.arc(xX, cy, 11, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239,71,111,0.85)';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', xX, cy);
    ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = 1;

    // Phase label
    const phaseIdx = t < 0.3 ? 0 : t < 0.7 ? 1 : 2;
    const ph = SN2_PHASES[phaseIdx];
    const el = document.getElementById('sn2-phase');
    if (el) el.textContent = ph.label;

    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ph.desc, W / 2, H - 8);
  }

  drawFrame(0);

  document.getElementById('sn2-play')?.addEventListener('click', () => {
    if (_sn2Running) return;
    _sn2Running = true;
    _sn2T = 0;
    const btn = document.getElementById('sn2-play');
    if (btn) btn.disabled = true;

    function step() {
      _sn2T = Math.min(1, _sn2T + 0.008);
      drawFrame(_sn2T);
      if (_sn2T < 1) {
        _sn2Anim = requestAnimationFrame(step);
      } else {
        _sn2Running = false;
        if (btn) btn.disabled = false;
      }
    }
    _sn2Anim = requestAnimationFrame(step);
  });

  document.getElementById('sn2-reset')?.addEventListener('click', () => {
    _sn2Running = false;
    if (_sn2Anim) cancelAnimationFrame(_sn2Anim);
    _sn2T = 0;
    drawFrame(0);
    const btn = document.getElementById('sn2-play');
    if (btn) btn.disabled = false;
    const ph = document.getElementById('sn2-phase');
    if (ph) ph.textContent = '';
  });
}

// ---------------------------------------------------------------------------
// Newman projection
// ---------------------------------------------------------------------------
// Ethane-like Newman: front C with 3 substituents, back C inside circle
// Conformations: anti (180°) gauche (60°) eclipsed (0°,120°,240°)
const NEWMAN_CONF = [
  { min: 0,   max: 15,  name: 'Eclipsada',    color: 'var(--accent-reaction)', E: 12.6 },
  { min: 15,  max: 75,  name: 'Gauche',        color: 'var(--accent-bond)',     E: 3.8  },
  { min: 75,  max: 105, name: 'Anti',          color: 'var(--accent-organic)',  E: 0    },
  { min: 105, max: 165, name: 'Gauche',        color: 'var(--accent-bond)',     E: 3.8  },
  { min: 165, max: 195, name: 'Eclipsada',     color: 'var(--accent-reaction)', E: 12.6 },
  { min: 195, max: 255, name: 'Gauche',        color: 'var(--accent-bond)',     E: 3.8  },
  { min: 255, max: 285, name: 'Anti',          color: 'var(--accent-organic)',  E: 0    },
  { min: 285, max: 345, name: 'Gauche',        color: 'var(--accent-bond)',     E: 3.8  },
  { min: 345, max: 360, name: 'Eclipsada',     color: 'var(--accent-reaction)', E: 12.6 },
];

function _getConf(phi) {
  const p = ((phi % 360) + 360) % 360;
  return NEWMAN_CONF.find(c => p >= c.min && p < c.max) || NEWMAN_CONF[0];
}

function _initNewman() {
  const frame  = document.getElementById('newman-frame');
  const canvas = document.getElementById('newman-canvas');
  if (!canvas || !frame) return;

  const SIZE = 200;
  const dpr  = window.devicePixelRatio || 1;
  canvas.width  = Math.round(SIZE * dpr);
  canvas.height = Math.round(SIZE * dpr);
  canvas.style.width  = SIZE + 'px';
  canvas.style.height = SIZE + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const cx = SIZE / 2, cy = SIZE / 2, R = 60;

  const FRONT_LABELS = ['H', 'CH₃', 'H'];
  const BACK_LABELS  = ['H', 'H', 'CH₃'];
  const FRONT_BASE   = [90, 210, 330]; // degrees

  function drawNewman(phi) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Back circle
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,200,200,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Back bonds (rotated by phi)
    const BACK_BASE = [90, 210, 330];
    BACK_BASE.forEach((deg, i) => {
      const a = (deg + phi) * Math.PI / 180;
      const ox = cx + R * Math.cos(a);
      const oy = cy + R * Math.sin(a);
      const ex = cx + (R + 28) * Math.cos(a);
      const ey = cy + (R + 28) * Math.sin(a);
      ctx.strokeStyle = 'rgba(79,195,247,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = 'rgba(79,195,247,0.8)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(BACK_LABELS[i], ex + 8 * Math.cos(a), ey + 8 * Math.sin(a));
    });

    // Front bonds (fixed)
    FRONT_BASE.forEach((deg, i) => {
      const a = deg * Math.PI / 180;
      const ex = cx + (R - 10) * Math.cos(a);
      const ey = cy + (R - 10) * Math.sin(a);
      ctx.strokeStyle = 'rgba(255,209,102,0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = '#ffd166';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(FRONT_LABELS[i], cx + (R + 10) * Math.cos(a), cy + (R + 10) * Math.sin(a));
    });

    // Front C dot
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    ctx.fillStyle = '#0d1117';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', cx, cy);
    ctx.textBaseline = 'alphabetic';
  }

  function updateEnergy(phi, conf) {
    const el = document.getElementById('newman-energy');
    if (!el) return;
    // Mini energy diagram text
    el.innerHTML = `
      <div style="padding:.5rem">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Energia de torção (kJ/mol)</p>
        <p style="font-size:var(--text-xl);font-weight:700;color:${conf.color}">${conf.E.toFixed(1)}</p>
        <p style="font-size:var(--text-sm);font-weight:600;color:${conf.color};margin-top:.2rem">${conf.name}</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:.4rem">
          Anti (180°): mínimo absoluto. Gauche (60°): mínimo relativo (+3,8 kJ/mol).
          Eclipsada (0°/120°/240°): máximo (+12,6 kJ/mol).
        </p>
      </div>`;
  }

  function update() {
    const phi  = parseFloat(document.getElementById('newman-phi')?.value ?? 60);
    const conf = _getConf(phi);
    drawNewman(phi);
    const valEl = document.getElementById('newman-phi-val');
    if (valEl) valEl.textContent = phi + '°';
    const confEl = document.getElementById('newman-conf');
    if (confEl) { confEl.textContent = conf.name; confEl.style.color = conf.color; }
    updateEnergy(phi, conf);
  }

  document.getElementById('newman-phi')?.addEventListener('input', update);
  update();
}


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
          markSectionDone('organic', 'exercise');
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
export function destroy() {
  if (_sn2Anim) { cancelAnimationFrame(_sn2Anim); _sn2Anim = null; }
}
