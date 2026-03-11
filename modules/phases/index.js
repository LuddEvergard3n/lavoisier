/**
 * modules/phases/index.js — Módulo: Equilíbrio de Fases
 * Lavoisier — Laboratório Visual de Química
 *
 * Cobre Graduação 1º/2º ano:
 *  - Diagrama de fases P×T: linhas de equilíbrio, ponto triplo, ponto crítico
 *  - Cláusio-Clapeyron: ln(P₂/P₁) = -ΔHvap/R × (1/T₂ - 1/T₁)
 *  - Diagrama de fases da água (anomalia: inclinação negativa s/l)
 *  - Diagrama de fases do CO₂ (ponto crítico acessível)
 *  - Soluções binárias: diagrama P×x (Raoult), diagrama T×x ebulição
 *  - Lei de Raoult: Pᵢ = xᵢ × Pᵢ*, desvios positivos/negativos
 *  - Canvas interativo: diagrama P×T com cursor de temperatura e pressão
 */

import { esc }               from '../../js/ui.js';
import { markSectionDone }   from '../../js/state.js';
import { SimLoop }           from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

// ---------------------------------------------------------------------------
// Dados de substâncias
// ---------------------------------------------------------------------------

const SUBSTANCES = {
  water: {
    name: 'Água (H₂O)',
    Ttp: 273.16, Ptp: 611.7,   // K, Pa
    Tc:  647.1,  Pc: 22.064e6, // K, Pa
    Tnbp: 373.15,
    dHvap: 40700,               // J/mol
    anomaly: true,              // gelo menos denso que água
    solid_label: 'Gelo',
    liquid_label: 'Água',
    gas_label: 'Vapor',
    notes: 'Anomalia: linha sólido-líquido tem inclinação NEGATIVA (pressão aumenta → ponto de fusão cai). Explica por que o gelo patina e o fundo dos oceanos é líquido.',
    color: '#4fc3f7',
  },
  co2: {
    name: 'CO₂ (dióxido de carbono)',
    Ttp: 216.6, Ptp: 518e3,
    Tc:  304.2, Pc: 7.38e6,
    Tnbp: 194.7,               // sublimação a 1 atm
    dHvap: 25200,
    anomaly: false,
    solid_label: 'Gelo seco',
    liquid_label: 'Líquido',
    gas_label: 'Gás',
    notes: 'A 1 atm, o CO₂ SUBLIMA (não tem fase líquida). O CO₂ supercrítico (T > 304 K, P > 73 atm) é usado como solvente na extração de cafeína.',
    color: '#ffd166',
  },
};

const EXERCISES = [
  {
    q: 'Segundo a equação de Clausius-Clapeyron, se a pressão de vapor de uma substância é 1 atm a 100°C e ΔHvap = 40,7 kJ/mol, qual a pressão de vapor a 120°C?',
    opts: ['≈ 1,5 atm', '≈ 2,0 atm', '≈ 0,5 atm', '≈ 3,0 atm'],
    ans: 1,
    exp: 'ln(P₂/P₁) = -(ΔHvap/R)·(1/T₂ - 1/T₁) = -(40700/8.314)·(1/393 - 1/373) ≈ -4893·(-0,000137) ≈ +0,670. P₂/P₁ = e^0,670 ≈ 1,95 ≈ 2,0 atm.',
    hint: 'Aplique ln(P₂/P₁) = -(ΔHvap/R)·(1/T₂ - 1/T₁). Converta T para Kelvin.',
  },
  {
    q: 'O ponto triplo da água está em 273,16 K e 611,7 Pa. O que ocorre com um sistema de água pura nessas condições exatas?',
    opts: [
      'Apenas sólido e gás coexistem',
      'Sólido, líquido e gás coexistem em equilíbrio termodinâmico',
      'A água ferve',
      'O sistema é monofásico',
    ],
    ans: 1,
    exp: 'O ponto triplo é a única combinação de T e P onde três fases coexistem em equilíbrio. É invariante (grau de liberdade = 0, pela regra das fases de Gibbs: F = C - P + 2 = 1 - 3 + 2 = 0).',
    hint: 'Regra de Gibbs: F = C - P + 2. Com 1 componente e 3 fases, quantos graus de liberdade?',
  },
  {
    q: 'Uma mistura ideal de benzeno (P* = 100 mmHg) e tolueno (P* = 30 mmHg) tem x_benzeno = 0,6. Qual a pressão total de vapor (Lei de Raoult)?',
    opts: ['72 mmHg', '65 mmHg', '130 mmHg', '78 mmHg'],
    ans: 0,
    exp: 'P_total = x_benz · P*_benz + x_tol · P*_tol = 0,6·100 + 0,4·30 = 60 + 12 = 72 mmHg. Lei de Raoult para mistura ideal.',
    hint: 'P_total = Σ xᵢ · P*ᵢ. Calcule x_tolueno = 1 - x_benzeno.',
  },

  { q: 'No ponto triplo da água (273,16 K, 611 Pa), coexistem:', opts: ['Só sólido e líquido','Só líquido e vapor','Sólido, líquido e vapor simultaneamente','Só sólido e vapor'], ans: 2, exp: 'Ponto triplo: F = C - P + 2 = 1 - 3 + 2 = 0. T e P são fixos; as três fases coexistem em equilíbrio.', hint: 'Regra das fases: F=0 significa que não há grau de liberdade — T e P são fixos.' },
  { q: 'A inclinação negativa da curva de fusão da água significa que:', opts: ['Água congela mais fácil com pressão','Pressão aumenta abaixa o ponto de fusão — gelo funde sob pressão','Temperatura de ebulição cai','O ponto triplo sobe'], ans: 1, exp: 'Gelo é menos denso que água (0,917 vs 1,000 g/cm³). Pressão favorece a fase mais densa → favorece fusão. Inclinação dP/dT < 0.', hint: 'Clausius-Clapeyron: dP/dT = ΔS/ΔV. Se ΔV_fusão < 0 (gelo → água), qual o sinal de dP/dT?' },,
  { q:'No diagrama de fases da água, a curva de fusão tem inclinação negativa (dP/dT < 0). Isso implica que:', opts:['O gelo flutua na água porque tem menor densidade que a água líquida','O gelo derrete sob pressão — pressão extra favorece a fase menos densa (líquida)','A água solidifica mais fácil que outros líquidos','O ponto triplo está acima de 1 atm'], ans:1, exp:'Clapeyron: dP/dT = ΔHfus/(TΔV). Para água, ΔVfus < 0 (gelo menos denso que água) → dP/dT < 0. Pressão extra força a transição para o líquido (mais denso). Por isso patinação no gelo é possível: a pressão do gume funde uma fina camada. É exceção — quase todos os sólidos são mais densos que seus líquidos.', hint:'Água: gelo menos denso que líquido → curva fusão com inclinação negativa → pressão desfaz o sólido.' },
  { q:'A regra de fases de Gibbs: F = C - P + 2. Para 1 componente (C=1) com 2 fases (P=2) coexistindo:', opts:['F=2 — temperatura e pressão livres','F=1 — apenas T ou P pode variar (a outra é determinada)','F=0 — ponto triplo','F=3'], ans:1, exp:'F = 1 - 2 + 2 = 1. Uma variável intensiva (T ou P) é livre; a outra é determinada pela curva de coexistência. Por isso ao ferver água a 1 atm, T fica em 100°C — não pode variar enquanto há coexistência líquido-vapor a pressão fixada.', hint:'F = C - P + 2. Mais fases coexistentes = menos graus de liberdade.' },
  { q:'A destilação azeotrópica é necessária para separar etanol de água acima de ~96% porque:', opts:['Acima de 96% o etanol fica sólido','Etanol-água forma azeótropo a 95,6%: a mistura ferve como se fosse componente puro, sem enriquecimento','A água boila primeiro que o etanol a 1 atm','O etanol puro não tem ponto de ebulição definido'], ans:1, exp:'Azeótropo: mistura com composição em que líquido e vapor têm a mesma composição → não há enriquecimento por destilação. EtOH/água a 95,6% en massa = azeótropo mínimo (Pb = 78,1°C). Para obter etanol anidro, usa-se dessecante (CaO), destilação com benzeno, ou membranas.', hint:'Azeótropo: líquido e vapor têm mesma composição → destilação não funciona mais.' },
  { q:'O fenômeno de super-resfriamento ocorre quando:', opts:['Um gás é comprimido abaixo do ponto de orvalho','Líquido é resfriado abaixo de seu ponto de fusão sem solidificar (estado metaestável)','Sólido sublima diretamente sem fundir','Gás se condensa abruptamente'], ans:1, exp:'Super-resfriamento: líquido muito puro e livre de nucleadores pode ser resfriado abaixo de Tf sem cristalizar. Estado metaestável. Ao adicionar cristal-semente ou sacudir, cristaliza instantaneamente com liberação de calor (calor latente). Usado em bolsas de calor reutilizáveis (acetato de sódio).', hint:'Nucleação é necessária para cristalizar. Sem nucleadores: super-resfriamento possível.' },
  { q:'Na solidificação de misturas (diagrama binário), o ponto eutético é:', opts:['O ponto de ebulição mais alto','A composição e temperatura em que líquido e dois sólidos coexistem com F=0','O ponto de fusão mais alto possível','Onde os dois sólidos têm a mesma composição'], ans:1, exp:'Eutético: F = C - P + 1 = 2 - 3 + 1 = 0 (a pressão costante, +1). Dois componentes (C=2), três fases (líquido + 2 sólidos): F=0, ponto invariante. Exemplo: Au-Si eutético a 363°C/19% Si (usado em eletrônica). Liga de solda 63Sn-37Pb: eutético a 183°C.', hint:'Eutético: C=2, P=3, F=0. Ponto invariante — T e composição fixas.' },
  { q:'A variação de entalpia de vaporização da água (ΔHvap = 44 kJ/mol a 25°C) é maior que a de fusão (6 kJ/mol) porque:', opts:['A água ferve em temperatura maior','Vaporização remove todas as ligações intermoleculares (leva ao gás); fusão só desfaz parte das LH do gelo','O vapor é mais pesado que o líquido','A pressão externa faz mais trabalho na vaporização'], ans:1, exp:'No gelo, ~90% das LH do cristal se mantêm na fusão (líquido ainda tem LH). Na vaporização (líquido → vapor), todas as interações intermoleculares são rompidas → muito mais energia necessária. ΔHvap >> ΔHfus é geral para líquidos associados.', hint:'Fusão: parcialmente desfaz a estrutura. Vaporização: rompe todas as interações.' },
  { q:'O fenômeno de "ebulição nucleada" e "ebulição de filme" diferem em eficiência de transferência de calor porque:', opts:['Ebulição de filme é sempre mais eficiente','Na ebulição nucleada, bolhas formam e saem rapidamente, renovando o contato liquido-superfície; no filme, uma camada de vapor isola a superfície','São equivalentes acima de 100°C','Apenas a nucleada ocorre em laboratório'], ans:1, exp:'Abaixo da temperatura de Leidenfrost: ebulição nucleada. Acima: forma-se camada de vapor (ebulição de filme) que isola termicamente a superfície — paradoxalmente transfere menos calor. Efeito Leidenfrost: gota de água sobre superfície >200°C flutua sobre vapor → não ferve rapidamente.', hint:'Efeito Leidenfrost: camada de vapor isola. Gota flutua e demora para evaporar.' },
  { q:'O CO₂ supercrítico (acima de 31°C e 73 atm) é usado industrialmente porque:', opts:['É radioativo e esteriliza o produto','Tem propriedades de solvente ajustáveis com pressão e nenhum resíduo ao despressurizar','Reage com todos os polares','É mais barato que todos os solventes orgânicos'], ans:1, exp:'CO₂ supercrítico: densiadade e capacidade de solvente ajustáveis por T e P. Ao despressurizar → CO₂ vira gás → sem resíduo de solvente. Aplicações: descafeinação, extração de lúpulo, cromatografia SFC, limpeza a seco ecológica.', hint:'Fluido supercrítico: acima de Tc e Pc. Propriedades intermediárias entre gás e líquido. CO₂: "verde", sem resíduo.' },
  { q:'Na lei de Clausius-Clapeyron: ln(P₂/P₁) = -ΔHvap/R × (1/T₂ - 1/T₁), se a 100°C (373K) P=1 atm e ΔHvap = 40,7 kJ/mol, qual é a P a 120°C (393K)?', opts:['~1,5 atm','~2,0 atm','~3,0 atm','~0,5 atm'], ans:1, exp:'ln(P₂/1) = -40700/8,314 × (1/393 - 1/373) = -4895 × (-1,36×10⁻⁴) = 0,666. P₂ = e^0,666 ≈ 1,95 ≈ 2,0 atm. Usar autoclave a 120°C necessita ~2 atm de pressão.', hint:'Clausius-Clapeyron: ln(P₂/P₁) = (ΔHvap/R)(1/T₁ - 1/T₂). R=8,314.' },
  { q:'A transição vidro (glass transition) do polímero difere da fusão porque:', opts:['A temperatura de vidro é sempre maior que a de fusão','Tg é transição de 2ª ordem (sem descontinuidade em entalpia); Tf é transição de 1ª ordem (entalpia descontinua, calor latente)','Vidro é exclusivo de sílica (SiO₂)','Acima de Tg, o polímero vira gás'], ans:1, exp:'Fusão (1ª ordem): descontinuidade em H, V, S — há calor latente. Tg (vidro, 2ª ordem): sem descontinuidade em H — apenas mudança na Cp, α, etc. Abaixo de Tg: vidro rígido (movimento segmental bloqueado). Acima: borracha ou fundido. PET: Tg ≈ 80°C, Tf ≈ 265°C.', hint:'1ª ordem: calor latente, V muda abruptamente. 2ª ordem: sem calor latente, Cp muda.' }
];

let _subKey   = 'water';
let _T        = 300;   // K — cursor do diagrama
let _P        = 1e5;   // Pa
let _loop     = null;
let _exIdx    = 0;
let _exAttempts = 0;
let _exDone   = false;

// ---------------------------------------------------------------------------
export function render(outlet) {
  if (_loop) { _loop.stop(); _loop = null; }
  _subKey = 'water'; _T = 300; _P = 1e5;
  _exIdx = 0; _exAttempts = 0; _exDone = false;

  outlet.innerHTML = _buildHTML();
  _initPhases();
  markSectionDone('phases', 'visited');
}

// ---------------------------------------------------------------------------
function _buildHTML() {
  return `
<div class="module-page" id="module-phases">
  <button class="module-back btn-ghost" data-nav="/modules">&#8592; Módulos</button>

  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
           stroke-width="1.8" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M9 3v18"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Equilíbrio de Fases</h1>
      <p class="module-subtitle">Diagramas P×T, ponto triplo, ponto crítico, Clausius-Clapeyron e Lei de Raoult.</p>
    </div>
  </header>

  <!-- ============================================================
       CONCEITOS FUNDAMENTAIS
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Conceitos fundamentais</h2>
    <p class="module-text">
      Um diagrama de fases é um mapa das condições (T, P) em que cada fase de uma substância
      pura é termodinamicamente estável. As <strong>linhas de equilíbrio</strong> separam as
      regiões e indicam coexistência de duas fases. Dois pontos especiais definem a topologia:
    </p>
    <p class="module-text">
      As três fases da matéria diferem essencialmente na relação entre energia cinética
      molecular (kT) e a energia das forças intermoleculares (ε). Em sólidos, kT &lt;&lt; ε:
      moléculas vibram em posições fixas. Em líquidos, kT ~ ε: moléculas se movem mas
      permanecem próximas (coesão mantida). Em gases, kT &gt;&gt; ε: moléculas se movem
      independentemente. As transições de fase ocorrem quando a temperatura (ou pressão)
      altera essa relação — não abruptamente no nível molecular, mas com nucleação e
      crescimento de nova fase.
    </p>
    <p class="module-text">
      A <strong>regra das fases de Gibbs</strong> descreve o número de variáveis independentes
      (graus de liberdade F) de um sistema em equilíbrio:
      <strong>F = C - P + 2</strong>, onde C = número de componentes e P = número de fases.
      Para a água pura (C=1): ao longo de uma curva de equilíbrio líquido-vapor (P=2),
      F = 1-2+2 = 1 — apenas T <em>ou</em> p podem ser variados independentemente.
      No ponto triplo (P=3), F = 0 — temperatura e pressão são fixas (273,16 K; 611,7 Pa).
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Ponto triplo</h3>
        <p style="font-size:var(--text-sm)">Única T e P onde sólido, líquido e gás coexistem. Invariante: F = C - P + 2 = 1 - 3 + 2 = <strong>0</strong> graus de liberdade.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Ponto crítico</h3>
        <p style="font-size:var(--text-sm)">Acima de T꜀ e P꜀, a distinção líquido/gás desaparece — fluido supercrítico. Propriedades intermediárias: alta densidade (como líquido), baixa viscosidade (como gás).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Regra das fases de Gibbs</h3>
        <p style="font-size:var(--text-sm)">F = C - P + 2. F = graus de liberdade, C = componentes, P = fases. Numa fase (P=1): F=2 (T e P livres). Na coexistência de duas fases: F=1. No ponto triplo: F=0.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Linhas de equilíbrio</h3>
        <p style="font-size:var(--text-sm)"><strong>Fusão:</strong> sólido-líquido. <strong>Vaporização:</strong> líquido-gás (curva de pressão de vapor). <strong>Sublimação:</strong> sólido-gás. A inclinação dP/dT segue a equação de Clapeyron: dP/dT = ΔH/(TΔV).</p>
      </div>
    </div>
  </section>

  <!-- ============================================================
       CLAUSIUS-CLAPEYRON
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Equação de Clausius-Clapeyron</h2>
    <p class="module-text">
      Para a curva de vaporização (onde ΔV ≈ RT/P para gás ideal), integrar a equação de Clapeyron fornece:
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-base);color:var(--accent-electron);margin-bottom:.5rem">
        ln(P₂/P₁) = -(ΔH<sub>vap</sub>/R) × (1/T₂ - 1/T₁)
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        P₁, P₂ = pressões de vapor em T₁ e T₂ (mesmas unidades)<br>
        ΔH<sub>vap</sub> = entalpia de vaporização (J/mol)<br>
        R = 8,314 J/(mol·K) &nbsp;|&nbsp; T em Kelvin<br>
        <em>Plot de ln P vs 1/T gera reta com inclinação -ΔH<sub>vap</sub>/R</em>
      </p>
    </div>

    <!-- Calculadora Clausius-Clapeyron -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Calculadora — pressão de vapor
    </h3>
    <div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:var(--space-5)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">ΔH<sub>vap</sub> (J/mol):</span>
        <input type="range" id="cc-dh" min="10000" max="60000" step="500" value="40700"
               style="width:140px;accent-color:var(--accent-electron)">
        <span id="cc-dh-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:80px">40700</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">T₁ (°C) — ponto referência:</span>
        <input type="range" id="cc-t1" min="0" max="200" step="5" value="100"
               style="width:140px;accent-color:var(--accent-bond)">
        <span id="cc-t1-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:50px">100 °C</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">T₂ (°C) — ponto calculado:</span>
        <input type="range" id="cc-t2" min="0" max="300" step="5" value="120"
               style="width:140px;accent-color:var(--accent-organic)">
        <span id="cc-t2-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:50px">120 °C</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">P₁ (referência)</p>
        <div style="font-size:var(--text-lg);font-weight:700;color:var(--accent-electron)">1,00 atm</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">ln(P₂/P₁)</p>
        <div id="cc-ln" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">P₂</p>
        <div id="cc-p2" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">P₂ (kPa)</p>
        <div id="cc-p2-kpa" style="font-size:var(--text-base);font-weight:600;color:var(--text-secondary)">—</div>
      </div>
    </div>
  </section>

  <!-- ============================================================
       DIAGRAMA P×T INTERATIVO
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Diagrama de fases — interativo</h2>
    <p class="module-text">
      O diagrama de fases mapeia o estado termodinâmico estável de uma substância em
      função de temperatura e pressão. As curvas de equilíbrio delimitam regiões de fase:
      a <strong>curva de sublimação</strong> (sólido-vapor), a <strong>curva de fusão</strong>
      (sólido-líquido) e a <strong>curva de vaporização</strong> (líquido-vapor).
      A inclinação da curva de fusão é positiva para a maioria das substâncias (pressão aumenta
      o ponto de fusão), mas <em>negativa para a água</em> — o gelo é menos denso que a
      água líquida (densidade 0,917 vs 1,000 g/cm³), então compressão favorece a fusão.
      Isso permite a patinação no gelo e é crucial para a geologia glacial.
    </p>
    <p class="module-text">
      Selecione a substância e mova os sliders para explorar regiões do diagrama de fases.
      O ponto vermelho indica as condições escolhidas e a fase termodinamicamente estável.
    </p>
    <div style="display:flex;gap:.4rem;margin-bottom:var(--space-4)">
      <button class="btn btn-xs btn-secondary" id="phase-water">Água</button>
      <button class="btn btn-xs btn-ghost"     id="phase-co2">CO₂</button>
    </div>
    <div class="canvas-frame" id="phase-frame" style="min-height:300px">
      <canvas id="phase-canvas" aria-label="Diagrama de fases"></canvas>
    </div>
    <div style="margin-top:var(--space-4);display:flex;flex-direction:column;gap:.5rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:100px">Temperatura:</span>
        <input type="range" id="phase-T" min="200" max="700" step="2" value="300"
               style="width:160px;accent-color:var(--accent-reaction)">
        <span id="phase-T-val" style="font-size:var(--text-sm);color:var(--accent-reaction);min-width:80px">300 K</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:100px">Pressão:</span>
        <input type="range" id="phase-P" min="0" max="100" step="1" value="50"
               style="width:160px;accent-color:var(--accent-electron)">
        <span id="phase-P-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:80px">50%</span>
      </div>
    </div>
    <div id="phase-info" class="info-card"
         style="background:var(--bg-raised);margin-top:var(--space-4)"></div>
    <p class="module-text" id="phase-note" style="margin-top:var(--space-3);font-size:var(--text-xs);color:var(--text-muted)"></p>
  </section>

  <!-- ============================================================
       LEI DE RAOULT
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Lei de Raoult — soluções ideais</h2>
    <p class="module-text">
      A Lei de Raoult expressa que a pressão de vapor parcial de um componente volátil
      em uma solução ideal é proporcional à sua fração molar: P_A = x_A · P°_A.
      A solução é <em>ideal</em> quando as interações A–B são iguais às interações A–A e B–B
      — caso típico de moléculas muito semelhantes (benzeno + tolueno, hexano + heptano).
      Desvios positivos (P_total &gt; P_Raoult) ocorrem quando A–B é mais fraca que A–A e B–B
      (exemplo: etanol + água), podendo levar a azeótropos de mínimo. Desvios negativos
      (P_total &lt; P_Raoult) ocorrem quando A–B é mais forte — clorofórmio + acetona
      (ligação H entre Cl e C=O). Azeótropos impossibilitam separação por destilação simples.
    </p>
    <p class="module-text">
      Para soluções <strong>ideais</strong> (interações A-A ≈ A-B ≈ B-B):
      a pressão parcial de vapor de cada componente é proporcional à sua fração molar e
      à sua pressão de vapor pura. A pressão total segue a Lei de Dalton.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-base);color:var(--accent-electron);margin-bottom:.4rem">
        P<sub>A</sub> = x<sub>A</sub> × P*<sub>A</sub>
      </p>
      <p style="font-family:monospace;font-size:var(--text-base);color:var(--accent-bond);margin-bottom:.5rem">
        P<sub>total</sub> = x<sub>A</sub>·P*<sub>A</sub> + x<sub>B</sub>·P*<sub>B</sub>
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Desvio positivo (A-B &lt; A-A): P<sub>obs</sub> &gt; P<sub>Raoult</sub>. Ex: acetona/CS₂.<br>
        Desvio negativo (A-B &gt; A-A): P<sub>obs</sub> &lt; P<sub>Raoult</sub>. Ex: CHCl₃/acetona (H-bond A-B).
      </p>
    </div>

    <!-- Calculadora Raoult -->
    <div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">P* componente A (mmHg):</span>
        <input type="range" id="ra-pA" min="10" max="300" step="5" value="100"
               style="width:120px;accent-color:var(--accent-electron)">
        <span id="ra-pA-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">100 mmHg</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">P* componente B (mmHg):</span>
        <input type="range" id="ra-pB" min="10" max="300" step="5" value="30"
               style="width:120px;accent-color:var(--accent-bond)">
        <span id="ra-pB-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:60px">30 mmHg</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">x<sub>A</sub> (fração molar A):</span>
        <input type="range" id="ra-xA" min="0" max="1" step="0.05" value="0.6"
               style="width:120px;accent-color:var(--accent-organic)">
        <span id="ra-xA-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:50px">0,60</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">P<sub>A</sub> parcial</p>
        <div id="ra-PA" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">P<sub>B</sub> parcial</p>
        <div id="ra-PB" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">P<sub>total</sub></p>
        <div id="ra-PT" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">y<sub>A</sub> no vapor</p>
        <div id="ra-yA" style="font-size:var(--text-base);font-weight:600;color:var(--text-secondary)">—</div>
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
// Interações
// ---------------------------------------------------------------------------
function _initPhases() {
  _initClausius();
  _initPhaseDiagram();
  _initRaoult();
  _initExercises();
}

function _initClausius() {
  const R = 8.314;
  function updateCC() {
    const dH = parseFloat(document.getElementById('cc-dh')?.value ?? 40700);
    const T1C = parseFloat(document.getElementById('cc-t1')?.value ?? 100);
    const T2C = parseFloat(document.getElementById('cc-t2')?.value ?? 120);
    const T1 = T1C + 273.15, T2 = T2C + 273.15;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('cc-dh-val', dH.toFixed(0));
    set('cc-t1-val', T1C + ' °C');
    set('cc-t2-val', T2C + ' °C');
    const lnR = -(dH / R) * (1 / T2 - 1 / T1);
    const P2  = Math.exp(lnR);  // atm (P1 = 1 atm)
    set('cc-ln',    lnR.toFixed(3));
    set('cc-p2',    P2.toFixed(3) + ' atm');
    set('cc-p2-kpa', (P2 * 101.325).toFixed(1) + ' kPa');
  }
  updateCC();
  ['cc-dh', 'cc-t1', 'cc-t2'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', updateCC));
}

function _initPhaseDiagram() {
  const canvas = document.getElementById('phase-canvas');
  const frame  = document.getElementById('phase-frame');
  if (!canvas || !frame) return;
  const W   = Math.min(frame.clientWidth || 520, 520);
  const H   = 300;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Margins for axes
  const MX = 55, MY = 20, PW = W - MX - 15, PH = H - MY - 35;

  function getSub()  { return SUBSTANCES[_subKey]; }
  function getTRange() {
    const s = getSub();
    return { Tmin: s.Ttp * 0.7, Tmax: Math.max(s.Tc * 1.3, 750) };
  }
  function getPRange() {
    const s = getSub();
    return { Pmin: s.Ptp * 0.01, Pmax: s.Pc * 1.5 };
  }
  function toCanvas(T, P) {
    const { Tmin, Tmax } = getTRange();
    const { Pmin, Pmax } = getPRange();
    const x = MX + ((T - Tmin) / (Tmax - Tmin)) * PW;
    const y = MY + PH - ((Math.log(P) - Math.log(Pmin)) / (Math.log(Pmax) - Math.log(Pmin))) * PH;
    return { x, y };
  }

  function vaporPressure(T) {
    // Clausius-Clapeyron from triple point
    const s = getSub();
    return s.Ptp * Math.exp(-(s.dHvap / 8.314) * (1 / T - 1 / s.Ttp));
  }

  function drawDiagram(cursorT, cursorP) {
    clearCanvas(ctx, W, H);
    const s = getSub();
    const { Tmin, Tmax } = getTRange();
    const { Pmin, Pmax } = getPRange();

    // Axes
    ctx.strokeStyle = 'rgba(200,200,200,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(MX, MY); ctx.lineTo(MX, MY + PH); ctx.lineTo(MX + PW, MY + PH); ctx.stroke();

    // Axis labels
    ctx.fillStyle = COLOR.textMuted; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Temperatura (K)', MX + PW / 2, H - 4);
    ctx.save(); ctx.translate(12, MY + PH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('Pressão (log)', 0, 0); ctx.restore();

    // T tick marks
    const tTicks = 6;
    for (let i = 0; i <= tTicks; i++) {
      const T = Tmin + (Tmax - Tmin) * i / tTicks;
      const x = MX + (T - Tmin) / (Tmax - Tmin) * PW;
      ctx.fillStyle = COLOR.textMuted; ctx.textAlign = 'center';
      ctx.fillText(T.toFixed(0), x, MY + PH + 14);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath();
      ctx.moveTo(x, MY); ctx.lineTo(x, MY + PH); ctx.stroke();
    }

    // Phase regions (background color)
    // Solid region: left of fusion line and below sublimation
    // Liquid: above vaporization and right of fusion
    // Gas: right of sublimation / below vaporization
    // Simplified: fill with light tints
    ctx.save();
    // Liquid region
    ctx.beginPath();
    const p1 = toCanvas(s.Ttp, s.Ptp);
    const pc  = toCanvas(s.Tc, s.Pc);
    ctx.moveTo(p1.x, p1.y);
    // Draw vaporization curve to critical point
    for (let T = s.Ttp; T <= s.Tc; T += (s.Tc - s.Ttp) / 60) {
      const P = vaporPressure(T);
      const p = toCanvas(T, Math.max(Pmin * 1.1, P));
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(pc.x, MY); ctx.lineTo(p1.x, MY); ctx.closePath();
    ctx.fillStyle = 'rgba(79,195,247,0.10)'; ctx.fill();

    // Gas region
    ctx.beginPath();
    ctx.moveTo(p1.x, MY + PH);
    for (let T = s.Ttp; T <= s.Tc; T += (s.Tc - s.Ttp) / 60) {
      const P = vaporPressure(T);
      const p = toCanvas(T, Math.max(Pmin * 1.1, P));
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(pc.x, MY + PH); ctx.closePath();
    ctx.fillStyle = 'rgba(107,203,119,0.08)'; ctx.fill();

    // Solid region
    ctx.beginPath();
    ctx.moveTo(MX, MY); ctx.lineTo(p1.x, MY); ctx.lineTo(p1.x, MY + PH); ctx.lineTo(MX, MY + PH); ctx.closePath();
    ctx.fillStyle = 'rgba(255,209,102,0.08)'; ctx.fill();
    ctx.restore();

    // Sublimation curve (solid-gas): use simplified ΔHsub ≈ ΔHvap * 1.1
    ctx.strokeStyle = s.color; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
    ctx.beginPath();
    let first = true;
    for (let T = Tmin; T <= s.Ttp; T += (s.Ttp - Tmin) / 40) {
      const P = s.Ptp * Math.exp(-(s.dHvap * 1.1 / 8.314) * (1 / T - 1 / s.Ttp));
      if (P < Pmin || P > Pmax) continue;
      const p = toCanvas(T, P);
      first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      first = false;
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Vaporization curve (liquid-gas)
    ctx.strokeStyle = s.color; ctx.lineWidth = 2;
    ctx.beginPath(); first = true;
    for (let T = s.Ttp; T <= s.Tc; T += (s.Tc - s.Ttp) / 80) {
      const P = vaporPressure(T);
      if (P < Pmin || P > Pmax) continue;
      const p = toCanvas(T, P);
      first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      first = false;
    }
    ctx.stroke();

    // Fusion curve (solid-liquid)
    ctx.strokeStyle = s.color; ctx.lineWidth = 2;
    const fusSlope = s.anomaly ? -1e7 : 1.2e7; // Pa/K
    ctx.beginPath();
    const pFusStart = toCanvas(s.Ttp, s.Ptp);
    ctx.moveTo(pFusStart.x, pFusStart.y);
    const TfusEnd = s.Ttp + (Pmax - s.Ptp) / fusSlope;
    const pFusEnd = toCanvas(TfusEnd, Pmax);
    ctx.lineTo(pFusEnd.x, pFusEnd.y);
    ctx.stroke();

    // Labels
    ctx.fillStyle = COLOR.textMuted; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(s.solid_label,  MX + PW * 0.1, MY + PH * 0.4);
    ctx.fillText(s.liquid_label, MX + PW * 0.45, MY + PH * 0.25);
    ctx.fillText(s.gas_label,    MX + PW * 0.75, MY + PH * 0.75);

    // Triple point
    const ptp = toCanvas(s.Ttp, s.Ptp);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(ptp.x, ptp.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLOR.textMuted; ctx.textAlign = 'left';
    ctx.fillText('PT', ptp.x + 6, ptp.y + 3);

    // Critical point
    const pcp = toCanvas(s.Tc, s.Pc);
    ctx.fillStyle = '#ef476f';
    ctx.beginPath(); ctx.arc(pcp.x, pcp.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillText('PC', pcp.x + 6, pcp.y + 3);

    // Cursor point
    if (cursorT && cursorP) {
      const pp = toCanvas(cursorT, cursorP);
      if (pp.x >= MX && pp.x <= MX + PW && pp.y >= MY && pp.y <= MY + PH) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(pp.x, MY); ctx.lineTo(pp.x, MY + PH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(MX, pp.y); ctx.lineTo(MX + PW, pp.y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef476f';
        ctx.beginPath(); ctx.arc(pp.x, pp.y, 6, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function getPhase(T, P) {
    const s = getSub();
    const Pvap = vaporPressure(Math.min(T, s.Tc - 1));
    const fusSlope = s.anomaly ? -1e7 : 1.2e7;
    const Pfus = s.Ptp + fusSlope * (T - s.Ttp);
    if (T > s.Tc && P > s.Pc) return { phase: 'Fluido supercrítico', color: '#a78bfa' };
    if (T > s.Tc) return { phase: 'Gás (acima de Tc)', color: COLOR.organic };
    if (T < s.Ttp) {
      return { phase: s.solid_label, color: COLOR.energy };
    }
    if (P > Pfus) return { phase: s.solid_label, color: COLOR.energy };
    if (P > Pvap) return { phase: s.liquid_label, color: COLOR.electron };
    return { phase: s.gas_label, color: COLOR.organic };
  }

  function updateDiagram() {
    const { Tmin, Tmax } = getTRange();
    const { Pmin, Pmax } = getPRange();
    const Tslider = parseFloat(document.getElementById('phase-T')?.value ?? 300);
    const Pnorm   = parseFloat(document.getElementById('phase-P')?.value ?? 50) / 100;
    _T = Tmin + Tslider / 700 * (Tmax - Tmin);
    const logPcur = Math.log(Pmin) + Pnorm * (Math.log(Pmax) - Math.log(Pmin));
    _P = Math.exp(logPcur);

    const tv = document.getElementById('phase-T-val');
    const pv = document.getElementById('phase-P-val');
    if (tv) tv.textContent = Tslider + ' K';
    if (pv) pv.textContent = (_P / 1e5).toFixed(2) + ' bar';

    drawDiagram(_T, _P);

    const { phase, color } = getPhase(_T, _P);
    const info = document.getElementById('phase-info');
    const s    = getSub();
    if (info) info.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:.75rem;flex-wrap:wrap">
        <span style="font-size:var(--text-lg);font-weight:700;color:${color}">${esc(phase)}</span>
        <span style="font-size:var(--text-xs);color:var(--text-muted)">T = ${Tslider} K | P = ${(_P/1e5).toFixed(2)} bar</span>
      </div>`;
    const note = document.getElementById('phase-note');
    if (note) note.textContent = s.notes;
  }
  updateDiagram();

  document.getElementById('phase-T')?.addEventListener('input', updateDiagram);
  document.getElementById('phase-P')?.addEventListener('input', updateDiagram);
  document.getElementById('phase-water')?.addEventListener('click', () => {
    _subKey = 'water';
    document.getElementById('phase-water').className = 'btn btn-xs btn-secondary';
    document.getElementById('phase-co2').className   = 'btn btn-xs btn-ghost';
    updateDiagram();
  });
  document.getElementById('phase-co2')?.addEventListener('click', () => {
    _subKey = 'co2';
    document.getElementById('phase-water').className = 'btn btn-xs btn-ghost';
    document.getElementById('phase-co2').className   = 'btn btn-xs btn-secondary';
    updateDiagram();
  });
}

function _initRaoult() {
  function updateRa() {
    const pA  = parseFloat(document.getElementById('ra-pA')?.value ?? 100);
    const pB  = parseFloat(document.getElementById('ra-pB')?.value ?? 30);
    const xA  = parseFloat(document.getElementById('ra-xA')?.value ?? 0.6);
    const xB  = 1 - xA;
    const PA  = xA * pA;
    const PB  = xB * pB;
    const PT  = PA + PB;
    const yA  = PA / PT;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('ra-pA-val', pA.toFixed(0) + ' mmHg');
    set('ra-pB-val', pB.toFixed(0) + ' mmHg');
    set('ra-xA-val', xA.toFixed(2));
    set('ra-PA',  PA.toFixed(1) + ' mmHg');
    set('ra-PB',  PB.toFixed(1) + ' mmHg');
    set('ra-PT',  PT.toFixed(1) + ' mmHg');
    set('ra-yA',  yA.toFixed(3) + ' (fração A no vapor)');
  }
  updateRa();
  ['ra-pA', 'ra-pB', 'ra-xA'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', updateRa));
}

function _initExercises() {
  function loadEx(idx) {
    const ex = EXERCISES[idx];
    if (!ex) return;
    _exAttempts = 0; _exDone = false;
    const set = (id, v) => { const el = document.getElementById(id); if (el && typeof v === 'string') el.textContent = v; else if (el) el.innerHTML = v; };
    set('ex-question', ex.q);
    set('ex-counter', String(idx + 1));
    const fb = document.getElementById('exercise-feedback');
    const nx = document.getElementById('ex-next');
    if (fb) fb.innerHTML = '';
    if (nx) nx.style.display = 'none';
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
          markSectionDone('phases', 'exercise');
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

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
}
