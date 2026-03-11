/**
 * modules/inorganic/index.js — Módulo: Funções Inorgânicas
 * Lavoisier — Laboratório Visual de Química
 *
 * Cobre EM completo:
 *  - Ácidos: Arrhenius, hidracídeos vs oxiácidos, força, Ka
 *  - Bases: nomenclatura, força, solubilidade
 *  - Sais: formação, classificação (normal/ácido/básico), nomenclatura
 *  - Óxidos: ácidos, básicos, anfóteros, neutros
 *  - Calculadora de pH para ácidos e bases fortes
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

const ACIDS = [
  { formula:'HCl',     name:'Ácido clorídrico',  type:'hidracido', strong:true,  ka:null,    desc:'Suco gástrico, limpeza de metais, síntese de PVC.' },
  { formula:'HBr',     name:'Ácido bromídrico',   type:'hidracido', strong:true,  ka:null,    desc:'Agente redutor, síntese orgânica.' },
  { formula:'HI',      name:'Ácido iodídrico',    type:'hidracido', strong:true,  ka:null,    desc:'Ácido forte; HI aquoso é redutor poderoso.' },
  { formula:'HF',      name:'Ácido fluorídrico',  type:'hidracido', strong:false, ka:6.3e-4,  desc:'Ataca vidro (SiO₂ + 4HF → SiF₄ + 2H₂O). Muito perigoso.' },
  { formula:'HCN',     name:'Ácido cianídrico',   type:'hidracido', strong:false, ka:6.2e-10, desc:'Extremamente tóxico. Odor de amêndoas amargas.' },
  { formula:'H₂SO₄',  name:'Ácido sulfúrico',    type:'oxiacido',  strong:true,  ka:null,    desc:'Mais produzido industrialmente. Baterias chumbo-ácido, fertilizantes.' },
  { formula:'HNO₃',   name:'Ácido nítrico',      type:'oxiacido',  strong:true,  ka:null,    desc:'Explosivos, fertilizantes nitrogenados, síntese orgânica.' },
  { formula:'HClO₄',  name:'Ácido perclórico',   type:'oxiacido',  strong:true,  ka:null,    desc:'Ácido mais forte entre os comuns. Propelentes de foguete.' },
  { formula:'H₃PO₄',  name:'Ácido fosfórico',    type:'oxiacido',  strong:false, ka:7.5e-3,  desc:'Refrigerantes tipo cola, fertilizantes NPK, tratamento de metais.' },
  { formula:'H₂CO₃',  name:'Ácido carbônico',    type:'oxiacido',  strong:false, ka:4.3e-7,  desc:'CO₂ dissolvido na água. Sangue (pH 7,4), refrigerantes.' },
  { formula:'CH₃COOH',name:'Ácido acético',      type:'oxiacido',  strong:false, ka:1.8e-5,  desc:'Vinagre (~5%). Solvente industrial, síntese de ésteres.' },
  { formula:'H₂SO₃',  name:'Ácido sulfuroso',    type:'oxiacido',  strong:false, ka:1.5e-2,  desc:'SO₂ em água. Conservante alimentar (E220), chuva ácida.' },
];

const BASES = [
  { formula:'LiOH',     name:'Hidróxido de lítio',    cation:'Li⁺',  strong:true,  sol:'solúvel',    desc:'Baterias de lítio, lubrificantes para alta temperatura.' },
  { formula:'NaOH',     name:'Hidróxido de sódio',    cation:'Na⁺',  strong:true,  sol:'solúvel',    desc:'Soda cáustica. Fabricação de sabão, papel, desentupidores.' },
  { formula:'KOH',      name:'Hidróxido de potássio', cation:'K⁺',   strong:true,  sol:'solúvel',    desc:'Pilhas alcalinas, sabão mole, eletrólise.' },
  { formula:'Ca(OH)₂', name:'Hidróxido de cálcio',   cation:'Ca²⁺', strong:true,  sol:'pouco sol.', desc:'Cal apagada. Argamassa, tratamento de água, cimento.' },
  { formula:'Ba(OH)₂', name:'Hidróxido de bário',    cation:'Ba²⁺', strong:true,  sol:'solúvel',    desc:'Reativo analítico, precipitação de sulfatos.' },
  { formula:'Mg(OH)₂', name:'Hidróxido de magnésio', cation:'Mg²⁺', strong:false, sol:'insolúvel',  desc:'Leite de magnésia. Antiácido, laxante suave.' },
  { formula:'Al(OH)₃', name:'Hidróxido de alumínio', cation:'Al³⁺', strong:false, sol:'insolúvel',  desc:'Anfótero: reage com HCl e com NaOH. Antiácido.' },
  { formula:'Fe(OH)₂', name:'Hidróxido ferroso',     cation:'Fe²⁺', strong:false, sol:'insolúvel',  desc:'Precursor da ferrugem. Oxidável a Fe(OH)₃ na presença de O₂.' },
  { formula:'Fe(OH)₃', name:'Hidróxido férrico',     cation:'Fe³⁺', strong:false, sol:'insolúvel',  desc:'Ferrugem (cor marrom-alaranjada). Coagulante no tratamento de água.' },
  { formula:'NH₄OH',   name:'Hidróxido de amônio',   cation:'NH₄⁺', strong:false, sol:'solúvel',    desc:'NH₃ dissolvido em água (amônia aquosa). Limpadores domésticos.' },
];

const SALTS = [
  { formula:'NaCl',       name:'Cloreto de sódio',        acid:'HCl',    base:'NaOH',     type:'normal', sol:'solúvel',   desc:'Sal de cozinha. Soro fisiológico (0,9%), preservação de alimentos.' },
  { formula:'CaCO₃',     name:'Carbonato de cálcio',      acid:'H₂CO₃', base:'Ca(OH)₂',  type:'normal', sol:'insolúvel', desc:'Calcário, mármore, conchas. Antiácido, cimento Portland.' },
  { formula:'Na₂SO₄',    name:'Sulfato de sódio',         acid:'H₂SO₄', base:'NaOH',     type:'normal', sol:'solúvel',   desc:'Sal de Glauber. Papel kraft, vidro, detergentes em pó.' },
  { formula:'NH₄Cl',     name:'Cloreto de amônio',        acid:'HCl',    base:'NH₄OH',    type:'normal', sol:'solúvel',   desc:'Sal ácido por hidrólise (NH₄⁺). Baterias secas, fertilizante.' },
  { formula:'NaHCO₃',    name:'Bicarbonato de sódio',     acid:'H₂CO₃', base:'NaOH',     type:'acido',  sol:'solúvel',   desc:'Fermento químico; reage com ácidos liberando CO₂. Antiácido.' },
  { formula:'NaHSO₄',    name:'Bissulfato de sódio',      acid:'H₂SO₄', base:'NaOH',     type:'acido',  sol:'solúvel',   desc:'Sal ácido forte. Limpador de piscinas, reativação de resinas.' },
  { formula:'Ca₃(PO₄)₂',name:'Fosfato de cálcio',        acid:'H₃PO₄', base:'Ca(OH)₂',  type:'normal', sol:'insolúvel', desc:'Principal mineral dos ossos e dentes. Fertilizante superfosfato.' },
  { formula:'CuSO₄',     name:'Sulfato de cobre II',      acid:'H₂SO₄', base:'Cu(OH)₂',  type:'normal', sol:'solúvel',   desc:'Fungicida (calda bordalesa), eletrodeposição de cobre, pigmento.' },
  { formula:'FeSO₄',     name:'Sulfato ferroso',          acid:'H₂SO₄', base:'Fe(OH)₂',  type:'normal', sol:'solúvel',   desc:'Suplemento de ferro, tratamento de água, tinturas.' },
  { formula:'Al₂(SO₄)₃',name:'Sulfato de alumínio',      acid:'H₂SO₄', base:'Al(OH)₃',  type:'normal', sol:'solúvel',   desc:'Coagulante no tratamento de água e de efluentes.' },
];

const OXIDES = [
  { formula:'SO₃',   name:'Trióxido de enxofre',    type:'acido',    nox:'+6', reaction:'SO₃ + H₂O → H₂SO₄',               desc:'Poluente industrial. Chuva ácida. Intermediário no processo de contato (H₂SO₄).' },
  { formula:'SO₂',   name:'Dióxido de enxofre',     type:'acido',    nox:'+4', reaction:'SO₂ + H₂O → H₂SO₃',               desc:'Vulcões e carvão. Conservante E220. Causa chuva ácida e danos à saúde.' },
  { formula:'CO₂',   name:'Dióxido de carbono',     type:'acido',    nox:'+4', reaction:'CO₂ + H₂O → H₂CO₃',               desc:'Fotossíntese, respiração, extintor, efeito estufa. Refrigerante (CO₂ supercrítico).' },
  { formula:'N₂O₅',  name:'Pentóxido de dinitrogênio',type:'acido', nox:'+5', reaction:'N₂O₅ + H₂O → 2 HNO₃',             desc:'Anidrido do HNO₃. Instável; decompõe em NO₂ + O.' },
  { formula:'P₂O₅',  name:'Pentóxido de difósforo', type:'acido',    nox:'+5', reaction:'P₂O₅ + 3 H₂O → 2 H₃PO₄',         desc:'Agente desidratante poderoso. Anidrido do H₃PO₄.' },
  { formula:'Na₂O',  name:'Óxido de sódio',         type:'basico',   nox:'+1', reaction:'Na₂O + H₂O → 2 NaOH',             desc:'Reage vigorosamente com água → NaOH. Obtido por combustão do Na.' },
  { formula:'CaO',   name:'Óxido de cálcio',        type:'basico',   nox:'+2', reaction:'CaO + H₂O → Ca(OH)₂ (+ calor)',    desc:'Cal viva. Produzida na calcinação do calcário. Cimento, tratamento de esgoto.' },
  { formula:'Fe₂O₃', name:'Óxido férrico',          type:'basico',   nox:'+3', reaction:'Fe₂O₃ + 3 H₂SO₄ → Fe₂(SO₄)₃ + 3 H₂O',desc:'Hematita (minério de ferro). Ferrugem. Pigmento (ocre vermelho).' },
  { formula:'Al₂O₃', name:'Óxido de alumínio',      type:'anfotero', nox:'+3', reaction:'Al₂O₃ + 6HCl → 2AlCl₃ + 3H₂O\nAl₂O₃ + 2NaOH + 3H₂O → 2Na[Al(OH)₄]', desc:'Coríndon, rubi, safira. Reage com ácidos E bases. Abrasivo, cerâmica.' },
  { formula:'ZnO',   name:'Óxido de zinco',         type:'anfotero', nox:'+2', reaction:'ZnO + H₂SO₄ → ZnSO₄ + H₂O\nZnO + 2NaOH + H₂O → Na₂[Zn(OH)₄]', desc:'Protetor solar (bloqueador UV físico), pomada cicatrizante, vulcanização.' },
  { formula:'CO',    name:'Monóxido de carbono',    type:'neutro',   nox:'+2', reaction:'Não forma sal por hidrólise',        desc:'Combustão incompleta. Tóxico — bloqueia hemoglobina. Redutor industrial (alto-forno).' },
  { formula:'NO',    name:'Monóxido de nitrogênio', type:'neutro',   nox:'+2', reaction:'Não forma sal por hidrólise direta', desc:'Radical livre. Vasodilatador biológico (sinalização NO). Poluente veicular.' },
];

const OXIDE_COLORS = {
  acido:   'var(--accent-reaction)',
  basico:  'var(--accent-electron)',
  anfotero:'var(--accent-bond)',
  neutro:  'var(--text-muted)',
};
const OXIDE_LABELS = {
  acido:   'Óxido ácido',
  basico:  'Óxido básico',
  anfotero:'Óxido anfótero',
  neutro:  'Óxido neutro',
};

// ---------------------------------------------------------------------------
// Exercícios
// ---------------------------------------------------------------------------
const EXERCISES = [
  {
    q: 'O bicarbonato de sódio (NaHCO₃) é classificado como:',
    opts: ['Óxido básico', 'Sal ácido', 'Base forte', 'Ácido oxiácido'],
    ans: 1,
    exp: 'NaHCO₃ é formado pela neutralização incompleta de H₂CO₃ (diprótico) com NaOH. Como ainda possui um H substituível, é um sal ácido (hidrogênio carbonato de sódio).',
    hint: 'Pense na reação de formação: H₂CO₃ + NaOH → ? Ela é completa ou parcial?',
  },
  {
    q: 'Qual substância é um óxido anfótero?',
    opts: ['CO₂', 'Na₂O', 'Al₂O₃', 'SO₃'],
    ans: 2,
    exp: 'Al₂O₃ reage tanto com HCl (ácido) quanto com NaOH (base). CO₂ e SO₃ são óxidos ácidos; Na₂O é óxido básico.',
    hint: 'Anfótero significa que reage com ácidos E com bases. Qual óxido de metal de transição faz isso?',
  },
  {
    q: 'A nomenclatura correta do HClO₂ é:',
    opts: ['Ácido perclórico', 'Ácido cloroso', 'Ácido hipocloroso', 'Ácido clórico'],
    ans: 1,
    exp: 'A série do cloro: HClO = hipoloroso, HClO₂ = cloroso, HClO₃ = clórico, HClO₄ = perclórico. Com 2 oxigênios o nox do Cl é +3 → sufixo "oso".',
    hint: 'Lembre a sequência: hipo…oso → …oso → …ico → per…ico. Conte os átomos de O.',
  },

  { q: 'O óxido Al₂O₃ é classificado como:', opts: ['Ácido','Básico','Anfótero','Neutro'], ans: 2, exp: 'Al₂O₃ reage com ácidos (Al₂O₃ + 6HCl → 2AlCl₃ + 3H₂O) e com bases (Al₂O₃ + 2NaOH + 3H₂O → 2NaAl(OH)₄). Anfótero.', hint: 'Anfótero significa que reage tanto com ácidos quanto com bases.' },
  { q: 'Qual sal produz solução ácida em água?', opts: ['NaCl','Na₂CO₃','NH₄Cl','CH₃COONa'], ans: 2, exp: 'NH₄Cl: NH₄⁺ (ácido de Brønsted fraco) hidrolisa → pH < 7. NaCl: neutro. Na₂CO₃: básico. CH₃COONa: básico.', hint: 'Sal de ácido forte + base fraca → solução ácida (hidrólise do cátion).' },,
  { q:'Classifique HClO₄ segundo Arrhenius e Brønsted-Lowry:', opts:['Arrhenius: produz OH⁻; BL: aceita H⁺','Arrhenius: produz H⁺; BL: doa H⁺ (próton)','Arrhenius: base; BL: ácido','Não é classificável como ácido'], ans:1, exp:'Arrhenius: ácido = gera H⁺ em água. BL: ácido = doador de próton. HClO₄ → H⁺ + ClO₄⁻. Ambas as definições concordam para ácidos que ionizam em água.', hint:'Arrhenius: H⁺ em água. Brønsted-Lowry: doa próton (mais geral).' },
  { q:'O NaOH é uma base forte: em 0,01 mol/L, qual é o pH?', opts:['2','7','10','12'], ans:3, exp:'NaOH forte: [OH⁻] = 0,01 mol/L = 10⁻² mol/L. pOH = 2. pH = 14 - pOH = 12. A 25°C: pH + pOH = 14.', hint:'pOH = -log[OH⁻]. pH = 14 - pOH.' },
  { q:'Qual óxido, ao reagir com água, forma ácido?', opts:['CaO (óxido básico)','SO₃ (óxido ácido)','CO (óxido neutro)','Na₂O (óxido básico)'], ans:1, exp:'SO₃ + H₂O → H₂SO₄ (ácido sulfúrico). Óxidos ácidos (anidridos) = óxidos de não-metais que reagem com água formando ácido. CaO e Na₂O formam bases. CO não reage com água (neutro).', hint:'Óxido ácido = óxido de não-metal. Forma ácido com H₂O.' },
  { q:'O HCN (Ka = 6×10⁻¹⁰) e o HF (Ka = 6,8×10⁻⁴). Qual é mais forte e por quê?', opts:['HCN — maior massa molar','HF — Ka maior, maior grau de ionização em água','Iguais — ambos são ácidos fracos','HCN — C é mais eletronegativo que F'], ans:1, exp:'Ka maior = mais ionizado = ácido mais forte. HF (Ka = 6,8×10⁻⁴) >> HCN (Ka = 6×10⁻¹⁰). Embora F seja mais eletronegativo, a ligação H-F é muito forte (pKa = 3,17 vs 9,22 do HCN).', hint:'Ka maior = ácido mais forte. Compara diretamente os valores.' },
  { q:'A hidrólise do acetato de sódio (CH₃COONa) em água resulta em solução:', opts:['Ácida — CH₃COOH é ácido fraco','Básica — CH₃COO⁻ aceita H⁺ da água gerando OH⁻','Neutra — NaOH e CH₃COOH se cancelam','Ácida — Na⁺ libera H⁺'], ans:1, exp:'CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻. O acetato (base conjugada de ácido fraco) aceita próton da água gerando OH⁻ → pH > 7. Sal de ácido fraco + base forte = hidrólise básica.', hint:'Sal de ácido fraco + base forte: o ânion hidrolisa → pH > 7.' },
  { q:'Um tampão pH 4,75 é preparado com CH₃COOH/CH₃COONa (pKa = 4,76). Pela equação de Henderson-Hasselbalch, [CH₃COO⁻]/[CH₃COOH] é:', opts:['0,98 ≈ 1:1','10','0,1','2'], ans:0, exp:'pH = pKa + log([A⁻]/[HA]). 4,75 = 4,76 + log([A⁻]/[HA]). log([A⁻]/[HA]) = -0,01. [A⁻]/[HA] = 10⁻⁰·⁰¹ ≈ 0,98 ≈ 1. Tampão com pH ≈ pKa tem proporção ~1:1.', hint:'pH = pKa quando [A⁻] = [HA]. Se pH ≈ pKa, a razão é ≈ 1.' },
  { q:'Qual ácido oxigenado do cloro é o mais forte?', opts:['HClO (hipocloroso)','HClO₂ (cloroso)','HClO₃ (clórico)','HClO₄ (perclórico)'], ans:3, exp:'Força aumenta com o número de oxigênios: mais O = maior estado de oxidação do Cl = elétrons mais atraídos do O-H = H mais ácido. HClO₄ (Cl em +7) é ácido forte; HClO (Cl em +1) é fraco.', hint:'Mais oxigênios no ácido oxigenado = ácido mais forte.' },
  { q:'Na reação de óxido-redução: MnO₄⁻ + Fe²⁺ → Mn²⁺ + Fe³⁺ (meio ácido), qual é o coeficiente do Fe²⁺ balanceado?', opts:['1','3','5','2'], ans:2, exp:'Mn reduz de +7 a +2 (ganha 5e⁻). Fe oxida de +2 a +3 (perde 1e⁻). Para balancear elétrons: 1 MnO₄⁻ × 5e⁻ = 5 Fe²⁺ × 1e⁻. Logo MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O.', hint:'Balance as meias-reações. Elétrons ganhos = perdidos.' },
  { q:'O cloreto de amônio (NH₄Cl) em água forma solução:', opts:['Básica — Cl⁻ é base fraca','Ácida — NH₄⁺ doa H⁺ (ácido conjugado de base fraca)','Neutra — NH₃ e HCl são fortes','Básica — NH₃ é uma base'], ans:1, exp:'NH₄Cl → NH₄⁺ + Cl⁻. NH₄⁺ (ácido conjugado de NH₃, base fraca) doa H⁺: NH₄⁺ ⇌ NH₃ + H⁺. pH < 7. Cl⁻ (base conjugada de HCl forte) não hidrolisa.', hint:'Sal de ácido fraco + base forte → básico. Sal de ácido forte + base fraca → ácido.' },
  { q:'Um ácido de Lewis é:', opts:['Espécie que doa H⁺','Espécie que aceita par de elétrons','Espécie que produz OH⁻','Espécie que doa OH⁻'], ans:1, exp:'Lewis: ácido = aceptor de par de elétrons; base = doador. BF₃ é ácido de Lewis (aceita par do N de NH₃). Inclui casos sem H⁺. É a definição mais geral: Arrhenius ⊂ Brønsted-Lowry ⊂ Lewis.', hint:'Lewis é a definição mais ampla. Sem H⁺ envolvido necessariamente.' }
];

let _exIdx = 0, _exAttempts = 0, _exDone = false;

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
export function render(outlet) {
  _exIdx      = 0;
  _exAttempts = 0;
  _exDone     = false;

  outlet.innerHTML = _buildHTML();
  _initInorganic();
  markSectionDone('inorganic', 'visited');
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------
function _buildHTML() {
  return `
<div class="module-page" id="module-inorganic">

  <button class="module-back btn-ghost" data-nav="/modules">&#8592; Módulos</button>

  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
           stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Funções Inorgânicas</h1>
      <p class="module-subtitle">Ácidos, bases, sais e óxidos — classificação, nomenclatura e reatividade.</p>
    </div>
  </header>

  <!-- ================================================================
       ÁCIDOS
  ================================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Ácidos</h2>
    <p class="module-text">
      Segundo <strong>Arrhenius</strong>: ácido é a substância que, em solução aquosa, ioniza
      liberando <strong>H⁺</strong> como único cátion.
      Ácidos <strong>fortes</strong> ionizam completamente (grau de ionização &gt; 50%);
      ácidos <strong>fracos</strong> ionizam parcialmente — o equilíbrio é descrito pelo Ka.
    </p>
    <p class="module-text">
      As definições evoluíram historicamente em abrangência crescente.
      <strong>Brønsted-Lowry</strong> (1923): ácido é doador de próton (H⁺), base é aceitador.
      Isso permite tratar reações em solventes não-aquosos e explica o conceito de par
      conjugado: CH₃COOH ⇌ CH₃COO⁻ + H⁺ — acético/acetato são par conjugado. Quanto
      mais fraco o ácido, mais forte é sua base conjugada (e vice-versa).
      <strong>Lewis</strong> (1923): ácido aceita par de elétrons, base doa par de elétrons.
      Inclui reações como BF₃ + F⁻ → BF₄⁻ e todas as reações de formação de complexos
      de coordenação (metal = ácido de Lewis, ligante = base de Lewis).
    </p>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr));margin-bottom:1.25rem">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Hidracídeos</h3>
        <p style="font-size:var(--text-sm)">
          Não contêm oxigênio. Nomenclatura:<br>
          <strong>ácido + [raiz] + ídrico</strong><br>
          HCl → clorídrico · HF → fluorídrico<br>
          HCN → cianídrico · H₂S → sulfídrico
        </p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Oxiácidos</h3>
        <p style="font-size:var(--text-sm)">
          Contêm oxigênio. Nomenclatura pelo NOx do elemento central:<br>
          <strong>hipo…oso &lt; …oso &lt; …ico &lt; per…ico</strong><br>
          HClO = hipocloroso · HClO₂ = cloroso<br>
          HClO₃ = clórico · HClO₄ = perclórico
        </p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Polipróticos</h3>
        <p style="font-size:var(--text-sm)">
          Mais de 1 H ionizável: H₂SO₄ (2), H₃PO₄ (3).<br>
          A neutralização pode ser parcial, gerando
          <strong>sais ácidos</strong>:<br>
          H₂CO₃ + NaOH → NaHCO₃ + H₂O
        </p>
      </div>
    </div>

    <div id="acid-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.6rem">
      ${ACIDS.map((a, i) => `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="acid-tab-${i}" data-acid="${i}">${esc(a.formula)}</button>`).join('')}
    </div>
    <div id="acid-content" class="info-card" style="background:var(--bg-raised);min-height:90px"></div>
  </section>

  <!-- ================================================================
       BASES
  ================================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Bases (hidróxidos)</h2>
    <p class="module-text">
      Arrhenius: base libera <strong>OH⁻</strong> como único ânion em água.
      Nomenclatura: <strong>hidróxido de [nome do metal]</strong>.<br>
      Metais com múltipla valência usam sufixos:
      Fe²⁺ → <em>ferroso</em>, Fe³⁺ → <em>férrico</em>;
      Cu⁺ → <em>cuproso</em>, Cu²⁺ → <em>cúprico</em>.
    </p>
    <p class="module-text">
      Regra de solubilidade dos hidróxidos: são <strong>solúveis</strong> os de metais
      alcalinos (Li, Na, K, Rb, Cs) e o Ba(OH)₂; Ca(OH)₂ é pouco solúvel;
      todos os demais são <strong>insolúveis</strong>.
    </p>

    <div id="base-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.6rem">
      ${BASES.map((b, i) => `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="base-tab-${i}" data-base="${i}">${esc(b.formula)}</button>`).join('')}
    </div>
    <div id="base-content" class="info-card" style="background:var(--bg-raised);min-height:90px"></div>
  </section>

  <!-- ================================================================
       SAIS
  ================================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Sais</h2>
    <p class="module-text">
      Sal é produto da neutralização ácido + base → sal + H₂O.
      Nomenclatura: <strong>[nome do ânion] de [nome do cátion]</strong>.
    </p>
    <p class="module-text">
      A hidrólise salina determina se uma solução de sal é ácida, básica ou neutra.
      Sal de ácido forte + base forte (NaCl): pH = 7 — nenhum dos íons reage com água.
      Sal de ácido fraco + base forte (CH₃COONa): ânion aceita H⁺ da água → pH &gt; 7
      (solução básica). Sal de ácido forte + base fraca (NH₄Cl): cátion doa H⁺ à água
      → pH &lt; 7 (solução ácida). Sal de ácido fraco + base fraca (CH₃COONH₄):
      pH ≈ 7 + (pKa - pKb)/2 — depende das constantes relativas.
      Esta análise é essencial para prever o pH de soluções sem calcular explicitamente.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr));margin-bottom:1rem">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Normal</h3><p style="font-size:var(--text-sm)">Todos os H do ácido foram substituídos. NaCl, CaCO₃, Na₂SO₄.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Ácido</h3><p style="font-size:var(--text-sm)">Ainda tem H ionizável. Neutralização parcial de ácido poliprótico. NaHCO₃, NaHSO₄, NaH₂PO₄.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-electron)">Básico</h3><p style="font-size:var(--text-sm)">Ainda tem OH do metal. Neutralização parcial de base polivalente. Al(OH)₂Cl, Fe(OH)Cl₂.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-bond)">Duplo</h3><p style="font-size:var(--text-sm)">Dois cátions diferentes. KNaSO₄, KAl(SO₄)₂ (alúmen).</p></div>
    </div>

    <div id="salt-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.6rem">
      ${SALTS.map((s, i) => `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="salt-tab-${i}" data-salt="${i}">${esc(s.formula)}</button>`).join('')}
    </div>
    <div id="salt-content" class="info-card" style="background:var(--bg-raised);min-height:90px"></div>
  </section>

  <!-- ================================================================
       ÓXIDOS
  ================================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Óxidos</h2>
    <p class="module-text">
      Óxido: composto binário de oxigênio com outro elemento.
      Classificação pelo comportamento frente à água, ácidos e bases.
    </p>
    <p class="module-text">
      Os óxidos ácidos (anidridos) são óxidos de não-metais ou de metais em alto estado de
      oxidação: reagem com água formando ácidos (SO₃ + H₂O → H₂SO₄; CO₂ + H₂O → H₂CO₃)
      e com bases formando sais. Os óxidos básicos são óxidos de metais alcalinos e alcalino-
      terrosos: reagem com água formando hidróxidos (CaO + H₂O → Ca(OH)₂) e com ácidos
      formando sais. Os óxidos anfóteros (Al₂O₃, ZnO, Cr₂O₃, SnO₂) reagem tanto com ácidos
      quanto com bases: Al₂O₃ + 6HCl → 2AlCl₃ + 3H₂O; Al₂O₃ + 2NaOH + 3H₂O → 2NaAl(OH)₄.
      Os óxidos neutros (CO, NO, N₂O) não reagem com água, ácidos nem bases em condições normais.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr));margin-bottom:1rem">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Ácido</h3><p style="font-size:var(--text-sm)">Reage com H₂O → oxiácido; com base → sal + H₂O. Óxidos de não-metais. SO₃, CO₂, NO₂, P₂O₅.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-electron)">Básico</h3><p style="font-size:var(--text-sm)">Reage com H₂O → base; com ácido → sal + H₂O. Óxidos de metais alcalinos/alcalinoterrosos. Na₂O, CaO, Fe₂O₃.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-bond)">Anfótero</h3><p style="font-size:var(--text-sm)">Reage com ácidos E com bases. Metais intermediários: Al₂O₃, ZnO, Cr₂O₃, PbO, SnO.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--text-muted)">Neutro</h3><p style="font-size:var(--text-sm)">Não reage com H₂O, ácidos ou bases em condições normais. CO, NO, N₂O.</p></div>
    </div>

    <div id="oxide-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.6rem">
      ${OXIDES.map((o, i) => `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="oxide-tab-${i}" data-oxide="${i}">${esc(o.formula)}</button>`).join('')}
    </div>
    <div id="oxide-content" class="info-card" style="background:var(--bg-raised);min-height:90px"></div>
  </section>

  <!-- ================================================================
       CALCULADORA DE pH
  ================================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Calculadora de pH — ácido/base forte</h2>
    <p class="module-text">
      Para ácidos e bases <strong>fortes</strong>, a ionização é completa:
      pH = -log[H⁺] e pOH = -log[OH⁻], com pH + pOH = 14 (a 25 °C).
    </p>

    <div style="display:flex;flex-direction:column;gap:.75rem;margin:.75rem 0 1rem">
      <div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:80px">Tipo:</span>
        <button class="btn btn-xs btn-secondary" id="ph-type-acid">Ácido forte</button>
        <button class="btn btn-xs btn-ghost"     id="ph-type-base">Base forte</button>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:80px">C (mol/L):</span>
        <input type="range" id="ph-conc" min="-5" max="0" step="0.1" value="-1"
               style="width:160px;accent-color:var(--accent-electron)">
        <span id="ph-conc-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:90px">0,1 mol/L</span>
      </div>
    </div>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">[H⁺] mol/L</p>
        <div id="ph-h" style="font-size:var(--text-base);font-weight:700;color:var(--accent-reaction)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">[OH⁻] mol/L</p>
        <div id="ph-oh" style="font-size:var(--text-base);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">pH</p>
        <div id="ph-val" style="font-size:var(--text-2xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">pOH</p>
        <div id="ph-poh" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Meio</p>
        <div id="ph-meio" style="font-size:var(--text-base);font-weight:600">—</div>
      </div>
    </div>
    <!-- Escala de pH visual -->
    <div class="canvas-frame" id="ph-canvas-frame" style="min-height:60px;margin-top:var(--space-3)">
      <canvas id="ph-canvas" aria-label="Escala de pH"></canvas>
    </div>
  </section>

  <!-- ================================================================
       EXERCÍCIOS
  ================================================================ -->
  <section class="module-section" id="exercise-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/${EXERCISES.length})</h2>
    <p class="module-text" id="ex-question">${esc(EXERCISES[0].q)}</p>
    <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;max-width:440px;margin-top:.75rem">
      ${EXERCISES[0].opts.map((opt, i) => `
        <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
                data-exopt="${i}">${esc(opt)}</button>`).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next"
            style="margin-top:1rem;display:none">Próximo exercício →</button>
  </section>

</div>`;
}

// ---------------------------------------------------------------------------
// Interações — chamada de render()
// ---------------------------------------------------------------------------
function _initInorganic() {
  // --- Acid tabs ---
  function renderAcid(idx) {
    const a  = ACIDS[idx];
    const el = document.getElementById('acid-content');
    if (!el || !a) return;
    el.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:.8rem;flex-wrap:wrap;margin-bottom:.5rem">
        <span style="font-family:monospace;font-size:var(--text-xl);font-weight:700;
              color:var(--accent-reaction)">${esc(a.formula)}</span>
        <span style="font-size:var(--text-sm);color:var(--text-secondary)">${esc(a.name)}</span>
        <span style="font-size:var(--text-xs);padding:2px 8px;border-radius:99px;
              background:${a.strong?'var(--accent-organic)':'var(--accent-reaction)'};color:#000">
          ${a.strong ? 'Forte' : 'Fraco'}</span>
        <span style="font-size:var(--text-xs);padding:2px 8px;border-radius:99px;
              border:1px solid var(--border-default);color:var(--text-muted)">
          ${a.type === 'hidracido' ? 'Hidracídeo' : 'Oxiácido'}</span>
      </div>
      ${!a.strong && a.ka
        ? `<p style="font-size:var(--text-sm);font-family:monospace;color:var(--accent-bond);margin:.2rem 0">
             Ka = ${a.ka.toExponential(2)} &nbsp;|&nbsp; pKa = ${(-Math.log10(a.ka)).toFixed(2)}
           </p>` : ''}
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.4rem 0 0">${esc(a.desc)}</p>`;
    ACIDS.forEach((_, j) => {
      const b = document.getElementById('acid-tab-' + j);
      if (b) b.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
    });
  }
  renderAcid(0);
  ACIDS.forEach((_, i) => document.getElementById('acid-tab-' + i)
    ?.addEventListener('click', () => renderAcid(i)));

  // --- Base tabs ---
  function renderBase(idx) {
    const b  = BASES[idx];
    const el = document.getElementById('base-content');
    if (!el || !b) return;
    el.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:.8rem;flex-wrap:wrap;margin-bottom:.5rem">
        <span style="font-family:monospace;font-size:var(--text-xl);font-weight:700;
              color:var(--accent-electron)">${esc(b.formula)}</span>
        <span style="font-size:var(--text-sm);color:var(--text-secondary)">${esc(b.name)}</span>
        <span style="font-size:var(--text-xs);padding:2px 8px;border-radius:99px;
              background:${b.strong?'var(--accent-organic)':'var(--accent-reaction)'};color:#000">
          ${b.strong ? 'Forte' : 'Fraca'}</span>
        <span style="font-size:var(--text-xs);padding:2px 8px;border-radius:99px;
              border:1px solid var(--border-default);color:var(--text-muted)">${esc(b.sol)}</span>
      </div>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin:.2rem 0">
        Íon metálico: <span style="font-family:monospace">${esc(b.cation)}</span>
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.4rem 0 0">${esc(b.desc)}</p>`;
    BASES.forEach((_, j) => {
      const btn = document.getElementById('base-tab-' + j);
      if (btn) btn.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
    });
  }
  renderBase(0);
  BASES.forEach((_, i) => document.getElementById('base-tab-' + i)
    ?.addEventListener('click', () => renderBase(i)));

  // --- Salt tabs ---
  function renderSalt(idx) {
    const s  = SALTS[idx];
    const el = document.getElementById('salt-content');
    if (!el || !s) return;
    const typeLabel = s.type === 'normal' ? 'Normal' : s.type === 'acido' ? 'Ácido' : 'Básico';
    const typeColor = s.type === 'normal' ? 'var(--accent-organic)'
                    : s.type === 'acido'  ? 'var(--accent-reaction)'
                    : 'var(--accent-electron)';
    el.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:.8rem;flex-wrap:wrap;margin-bottom:.5rem">
        <span style="font-family:monospace;font-size:var(--text-xl);font-weight:700;
              color:var(--accent-bond)">${esc(s.formula)}</span>
        <span style="font-size:var(--text-sm);color:var(--text-secondary)">${esc(s.name)}</span>
        <span style="font-size:var(--text-xs);padding:2px 8px;border-radius:99px;
              background:${typeColor};color:#000">${typeLabel}</span>
        <span style="font-size:var(--text-xs);padding:2px 8px;border-radius:99px;
              border:1px solid var(--border-default);color:var(--text-muted)">${esc(s.sol)}</span>
      </div>
      <p style="font-size:var(--text-xs);color:var(--text-muted);font-family:monospace;margin:.2rem 0">
        ${esc(s.acid)} + ${esc(s.base)} → ${esc(s.formula)} + H₂O
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.4rem 0 0">${esc(s.desc)}</p>`;
    SALTS.forEach((_, j) => {
      const btn = document.getElementById('salt-tab-' + j);
      if (btn) btn.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
    });
  }
  renderSalt(0);
  SALTS.forEach((_, i) => document.getElementById('salt-tab-' + i)
    ?.addEventListener('click', () => renderSalt(i)));

  // --- Oxide tabs ---
  function renderOxide(idx) {
    const o     = OXIDES[idx];
    const el    = document.getElementById('oxide-content');
    if (!el || !o) return;
    const color = OXIDE_COLORS[o.type] || 'var(--text-secondary)';
    const label = OXIDE_LABELS[o.type] || o.type;
    el.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:.8rem;flex-wrap:wrap;margin-bottom:.5rem">
        <span style="font-family:monospace;font-size:var(--text-xl);font-weight:700;
              color:${color}">${esc(o.formula)}</span>
        <span style="font-size:var(--text-sm);color:var(--text-secondary)">${esc(o.name)}</span>
        <span style="font-size:var(--text-xs);padding:2px 8px;border-radius:99px;
              background:${color};color:#000">${esc(label)}</span>
        <span style="font-size:var(--text-xs);padding:2px 8px;border-radius:99px;
              border:1px solid var(--border-default);color:var(--text-muted)">NOx ${esc(o.nox)}</span>
      </div>
      <p style="font-size:var(--text-xs);font-family:monospace;color:${color};
         margin:.2rem 0;white-space:pre-line">${esc(o.reaction)}</p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.4rem 0 0">${esc(o.desc)}</p>`;
    OXIDES.forEach((_, j) => {
      const btn = document.getElementById('oxide-tab-' + j);
      if (btn) btn.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
    });
  }
  renderOxide(0);
  OXIDES.forEach((_, i) => document.getElementById('oxide-tab-' + i)
    ?.addEventListener('click', () => renderOxide(i)));

  // --- pH calculator ---
  const Kw = 1e-14;
  let _phType = 'acid';
  function updatePH() {
    const logC    = parseFloat(document.getElementById('ph-conc')?.value ?? -1);
    const C       = Math.pow(10, logC);
    const concStr = C < 0.001 ? C.toExponential(1) + ' mol/L'
                               : C.toFixed(Math.max(0, -Math.round(logC))) + ' mol/L';
    const cv = document.getElementById('ph-conc-val');
    if (cv) cv.textContent = concStr;

    const Hp  = _phType === 'acid' ? C : Kw / C;
    const OHm = _phType === 'base' ? C : Kw / C;
    const pH  = -Math.log10(Hp);
    const pOH = -Math.log10(OHm);
    const meio = pH < 6.999 ? 'Ácido' : pH > 7.001 ? 'Básico' : 'Neutro';

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('ph-h',    Hp.toExponential(2));
    set('ph-oh',   OHm.toExponential(2));
    set('ph-val',  pH.toFixed(2));
    set('ph-poh',  pOH.toFixed(2));
    set('ph-meio', meio);
    const meioEl = document.getElementById('ph-meio');
    if (meioEl) meioEl.style.color = pH < 6.999 ? 'var(--accent-reaction)' : 'var(--accent-electron)';
    const phCv = document.getElementById('ph-canvas');
    if (phCv && phCv._drawPH) { phCv._currentPH = phCv._currentPH ?? pH; phCv._drawPH(pH); }
  }
  _initPHCanvas();
  updatePH();
  document.getElementById('ph-conc')?.addEventListener('input', updatePH);
  ['acid', 'base'].forEach(t => {
    document.getElementById('ph-type-' + t)?.addEventListener('click', () => {
      _phType = t;
      document.getElementById('ph-type-acid').className = 'btn btn-xs ' + (t === 'acid' ? 'btn-secondary' : 'btn-ghost');
      document.getElementById('ph-type-base').className = 'btn btn-xs ' + (t === 'base' ? 'btn-secondary' : 'btn-ghost');
      updatePH();
    });
  });

  // --- Exercise ---
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
    if (optsEl) {
      optsEl.innerHTML = ex.opts.map((opt, i) => `
        <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
                data-exopt="${i}">${esc(opt)}</button>`).join('');
      optsEl.querySelectorAll('[data-exopt]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (_exDone) return;
          _exAttempts++;
          const choice = parseInt(btn.dataset.exopt, 10);
          const fb2    = document.getElementById('exercise-feedback');
          if (choice === ex.ans) {
            _exDone = true;
            btn.style.borderColor = 'var(--accent-organic)';
            btn.style.color       = 'var(--accent-organic)';
            if (fb2) fb2.innerHTML = `<p class="feedback-correct">Correto! ${esc(ex.exp)}</p>`;
            markSectionDone('inorganic', 'exercise');
            const nxBtn = document.getElementById('ex-next');
            if (nxBtn && idx < EXERCISES.length - 1) nxBtn.style.display = 'inline-flex';
          } else {
            btn.style.borderColor = 'var(--accent-reaction)';
            btn.style.color       = 'var(--accent-reaction)';
            if (fb2 && _exAttempts === 1)
              fb2.innerHTML = `<p class="feedback-hint">Dica: ${esc(ex.hint)}</p>`;
          }
        });
      });
    }
  }
  loadExercise(0);
  document.getElementById('ex-next')?.addEventListener('click', () => {
    _exIdx = Math.min(_exIdx + 1, EXERCISES.length - 1);
    loadExercise(_exIdx);
  });
}

// ---------------------------------------------------------------------------
// Canvas de escala de pH — gradiente colorimétrico
// ---------------------------------------------------------------------------
function _initPHCanvas() {
  const frame  = document.getElementById('ph-canvas-frame');
  const canvas = document.getElementById('ph-canvas');
  if (!canvas || !frame) return;

  const W   = Math.min(frame.clientWidth || 480, 480);
  const H   = 56;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Cores do indicador universal pH 0-14
  const PH_COLORS = [
    [0,  '#ff0000'], [1,  '#ff2200'], [2,  '#ff6600'], [3,  '#ff9900'],
    [4,  '#ffcc00'], [5,  '#ccff00'], [6,  '#66ff00'], [7,  '#00cc44'],
    [8,  '#00aacc'], [9,  '#0088ff'], [10, '#0044ff'], [11, '#2200cc'],
    [12, '#4400aa'], [13, '#660088'], [14, '#880066'],
  ];

  function hexToRGB(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return [r, g, b];
  }

  function phToColor(ph) {
    const clamped = Math.max(0, Math.min(14, ph));
    const lo = Math.floor(clamped);
    const hi = Math.min(14, lo + 1);
    const t  = clamped - lo;
    const [r1, g1, b1] = hexToRGB(PH_COLORS[lo][1]);
    const [r2, g2, b2] = hexToRGB(PH_COLORS[hi][1]);
    return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
  }

  function draw(currentPH) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Gradiente de fundo 0-14
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    PH_COLORS.forEach(([ph, color]) => grad.addColorStop(ph / 14, color));
    ctx.fillStyle = grad;
    const barY = 8, barH = 24;
    ctx.fillRect(0, barY, W, barH);

    // Ticks e labels
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 14; i++) {
      const x = (i / 14) * W;
      ctx.fillRect(x, barY + barH, 1, 4);
      if (i % 2 === 0) ctx.fillText(i, x, barY + barH + 12);
    }

    // Marcador da posição atual
    const markerX = Math.max(1, Math.min(W - 1, (currentPH / 14) * W));
    const markerColor = phToColor(currentPH);

    // Sombra do marcador
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(markerX - 6, barY - 3);
    ctx.lineTo(markerX + 6, barY - 3);
    ctx.lineTo(markerX,     barY + 3);
    ctx.fill();

    // Marcador colorido
    ctx.fillStyle = markerColor;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(markerX - 5, barY - 2);
    ctx.lineTo(markerX + 5, barY - 2);
    ctx.lineTo(markerX,     barY + barH + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Label pH acima
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('pH ' + currentPH.toFixed(2), markerX, barY - 6);
  }

  // Expor função de redesenho — chamada por updatePH
  canvas._drawPH = (targetPH) => {
    // Animação de entrada suave ao chamar pela primeira vez ou ao mudar
    let anim = 0;
    if (canvas._phAnimId) cancelAnimationFrame(canvas._phAnimId);
    const startPH = canvas._currentPH ?? 7;
    canvas._currentPH = targetPH;
    function step() {
      anim = Math.min(1, anim + 0.08);
      const ph = startPH + (targetPH - startPH) * anim;
      draw(ph);
      if (anim < 1) canvas._phAnimId = requestAnimationFrame(step);
    }
    canvas._phAnimId = requestAnimationFrame(step);
  };
  canvas._drawPH(7);
}

export function destroy() {
  // _phAnimId fica no canvas element; cancelar se ainda em execucao
  const canvas = document.getElementById('ph-canvas');
  if (canvas && canvas._phAnimId) {
    cancelAnimationFrame(canvas._phAnimId);
    canvas._phAnimId = null;
  }
}
