/**
 * modules/environmental/index.js — Módulo: Química Ambiental
 * Lavoisier — Laboratório Visual de Química
 *
 * Cobre EM completo:
 *  - Efeito estufa: mecanismo, gases, consequências, carbono
 *  - Chuva ácida: NOx, SOx, pH, impactos, equações
 *  - Camada de ozônio: formação, CFC, destruição, "buraco"
 *  - Poluição da água: DBO, eutrofização, metais pesados
 *  - Agrotóxicos e poluição do solo
 *  - Energias renováveis vs combustíveis fósseis
 *  - Canvas: simulação do efeito estufa (fótons IR vs CO₂)
 */

import { esc }               from '../../js/ui.js';
import { markSectionDone }   from '../../js/state.js';
import { SimLoop }           from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

const GREENHOUSE_GASES = [
  { gas:'CO₂',   name:'Dióxido de carbono', conc:'421 ppm (2024)', gwp100:1,     src:'Combustão de fósseis (75%), desmatamento (10%), cimento (4%)' },
  { gas:'CH₄',   name:'Metano',             conc:'1,9 ppm',        gwp100:27,    src:'Pecuária (32%), aterros sanitários (18%), extração de gás (24%)' },
  { gas:'N₂O',   name:'Óxido nitroso',      conc:'335 ppb',        gwp100:273,   src:'Fertilizantes nitrogenados (60%), queima de biomassa' },
  { gas:'O₃',    name:'Ozônio troposférico', conc:'variável',       gwp100:null,  src:'Formado por reação de NOx + COV sob luz UV. Smog fotoquímico.' },
  { gas:'H₂O',   name:'Vapor d\'água',      conc:'0–4%',           gwp100:null,  src:'Amplificador: aquece → mais evaporação → aquece mais. Feedback positivo.' },
  { gas:'HFCs',  name:'Hidrofluorcarbonos',  conc:'ppb',            gwp100:14800, src:'Substitutos dos CFCs em refrigeração. GWP altíssimo.' },
];

const ACID_RAIN_EQS = [
  { step:'1. Emissão', eq:'SO₂ + ½O₂ → SO₃',                    note:'Oxidação do SO₂ emitido por termoelétricas e vulcões' },
  { step:'2. Dissolução', eq:'SO₃ + H₂O → H₂SO₄',              note:'Ácido sulfúrico na atmosfera — pH 2–3 em casos graves' },
  { step:'3. NOx', eq:'NO + ½O₂ → NO₂\nNO₂ + H₂O → HNO₃',    note:'Óxidos de nitrogênio de motores e indústrias formam HNO₃' },
  { step:'4. Impacto', eq:'CaCO₃ + H₂SO₄ → CaSO₄ + H₂O + CO₂',note:'Corrói calcário (monumentos, conchas, exoesqueletos)' },
  { step:'5. Solo', eq:'Al³⁺ + 3H₂O → Al(OH)₃ + 3H⁺',         note:'Acidificação do solo mobiliza alumínio tóxico para plantas' },
];

const OZONE_STEPS = [
  { label:'Formação natural',  color:'#4fc3f7', eq:'O₂ + hν(UV) → 2O•\nO• + O₂ → O₃',     note:'Radiação UV-C (λ < 240 nm) quebra O₂. Oxigênio atômico reage com O₂.' },
  { label:'Equilíbrio normal', color:'#6bcb77', eq:'O₃ + hν(UV) → O₂ + O•\nO• + O₃ → 2O₂', note:'Absorção de UV-B (240–320 nm) — protege a vida. Ciclo de Chapman.' },
  { label:'CFC — liberação',   color:'#ffd166', eq:'CFCl₃ + hν(UV) → CFCl₂• + Cl•',         note:'CFCs (freons) são estáveis até a estratosfera; UV os fotolisa.' },
  { label:'Destruição catalítica',color:'#ef476f', eq:'Cl• + O₃ → ClO• + O₂\nClO• + O → Cl• + O₂', note:'1 átomo de Cl destrói até 100.000 moléculas de O₃. Catálise!' },
  { label:'Protocolo de Montreal',color:'#a78bfa', eq:'CFCs → HFCs → HFOs',                  note:'1987: banimento global dos CFCs. Buraco do Antártico em recuperação (2065 est.)' },
];

const WATER_POLLUTANTS = [
  { name:'DBO',           full:'Demanda Bioquímica de Oxigênio',    src:'Esgotos domésticos, dejetos animais',          effect:'Consome O₂ dissolvido → peixes morrem. DBO < 2 mg/L = água limpa.' },
  { name:'Eutrofização',  full:'Excesso de N e P',                   src:'Fertilizantes, detergentes fosfatados',        effect:'Proliferação de algas → decomposição → anoxia. Mata organismos aquáticos.' },
  { name:'Pb²⁺',          full:'Chumbo',                             src:'Canos velhos, tinta, mineração, baterias',     effect:'Neurotoxina. Afeta desenvolvimento infantil. Acumula-se nos ossos.' },
  { name:'Hg²⁺',          full:'Mercúrio',                           src:'Garimpo de ouro (amálgama), termômetros, carvão',effect:'Metilação bacteriana → metilmercúrio bioacumula na cadeia trófica (tuna).' },
  { name:'Cd²⁺',          full:'Cádmio',                             src:'Baterias Ni-Cd, galvanização, fertilizantes',  effect:'Nefrotóxico, cancerígeno. Doença itai-itai (Japão, 1950s).' },
  { name:'Nitratos NO₃⁻', full:'Nitratos',                           src:'Fertilizantes nitrogenados, efluentes bovinos', effect:'Metemoglobinemia em bebês ("síndrome do bebê azul"). Eutrofização.' },
  { name:'Microp.',       full:'Microplásticos',                      src:'Degradação de plásticos, tecidos sintéticos',  effect:'< 5 mm. Ingestão por peixes → bioacumulação. Detectados em sangue humano.' },
];

const ENERGY_SOURCES = [
  { name:'Carvão',        type:'fossil',  co2:'820 gCO₂/kWh', pros:'Abundante, infraestrutura existente',            cons:'Maior emissor de CO₂ e SO₂; poluição do ar; resíduos de cinzas' },
  { name:'Petróleo',      type:'fossil',  co2:'650 gCO₂/kWh', pros:'Alta densidade energética, fácil transporte',    cons:'Poluição, derramamentos, geopolítica, finito' },
  { name:'Gás natural',   type:'fossil',  co2:'490 gCO₂/kWh', pros:'Menos CO₂ que carvão; fácil queima',            cons:'Metano (vazamentos), não renovável, fracking' },
  { name:'Nuclear',       type:'low',     co2:'12 gCO₂/kWh',  pros:'Alta potência, pouco CO₂, small land use',      cons:'Resíduos radioativos (10.000 anos), acidente raro mas grave' },
  { name:'Hidrelétrica',  type:'renew',   co2:'24 gCO₂/kWh',  pros:'Renovável, regulável, Brasil: 60% da eletricidade', cons:'Alagamento, impacto ecológico (peixes), seca afeta produção' },
  { name:'Eólica',        type:'renew',   co2:'11 gCO₂/kWh',  pros:'Limpa, custo crescentemente baixo, offshore',   cons:'Intermitente, ruído, impacto visual, aves' },
  { name:'Solar FV',      type:'renew',   co2:'48 gCO₂/kWh',  pros:'Escalável, silenciosa, descentralizada',         cons:'Intermitente, área, fabricação de painéis (Si)' },
  { name:'Etanol',        type:'renew',   co2:'~90 gCO₂/kWh', pros:'Carbono ciclo curto, setor sucroalcooleiro BR',   cons:'Uso de terra agrícola, monocultura, vinhaça' },
];

const EXERCISES = [
  {
    q: 'A chuva ácida tem pH abaixo de 5,6 (pH da chuva normal com CO₂ dissolvido). O principal ácido formado a partir da queima de carvão com alto teor de enxofre é:',
    opts: ['HNO₃ — ácido nítrico', 'H₂SO₄ — ácido sulfúrico', 'H₂CO₃ — ácido carbônico', 'HCl — ácido clorídrico'],
    ans: 1,
    exp: 'Carvão com enxofre libera SO₂ na queima. Na atmosfera: SO₂ + ½O₂ → SO₃, depois SO₃ + H₂O → H₂SO₄. O HNO₃ vem de motores (NOx). O H₂CO₃ é o ácido da chuva normal, não da chuva ácida.',
    hint: 'Carvão → enxofre → SOx → qual ácido? Siga a cadeia de reações.',
  },
  {
    q: 'A destruição catalítica do ozônio por CFCs é especialmente grave porque:',
    opts: [
      'O CFC é muito pesado e afunda na estratosfera',
      'Cada átomo de Cl pode destruir dezenas de milhares de moléculas de O₃',
      'O CFC reage diretamente com O₂ formando compostos estáveis',
      'O buraco do ozônio libera CO₂ que causa efeito estufa',
    ],
    ans: 1,
    exp: 'O Cl• é regenerado no ciclo: Cl• + O₃ → ClO• + O₂, depois ClO• + O → Cl• + O₂. O cloro atua como catalisador — não é consumido. Um átomo pode destruir ~100.000 moléculas de O₃.',
    hint: 'O que caracteriza um catalisador? O Cl é consumido ou regenerado na reação?',
  },
  {
    q: 'Qual processo explica o acúmulo de mercúrio em peixes de grande porte (atum, tubarão) em concentrações muito acima da água do mar?',
    opts: ['Dissolução preferencial', 'Bioacumulação na cadeia trófica', 'Precipitação eletrolítica', 'Eutrofização por fosfatos'],
    ans: 1,
    exp: 'Bioacumulação: microorganismos absorvem mercúrio → zooplâncton come muitos microorganismos → peixe pequeno come muito zooplâncton → peixe grande come muitos peixes pequenos. Cada nível concentra mais o metal. Metilmercúrio é lipossolúvel e não excretado.',
    hint: 'Pense na cadeia alimentar: se cada ser come muitos do nível abaixo, o que acontece com a concentração de uma substância não excretada?',
  },
];

let _loop        = null;
let _ghgIdx      = 0;
let _co2Level    = 280; // ppm — pré-industrial
let _exIdx       = 0;
let _exAttempts  = 0;
let _exDone      = false;

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
export function render(outlet) {
  if (_loop) { _loop.stop(); _loop = null; }
  _ghgIdx     = 0;
  _co2Level   = 280;
  _exIdx      = 0;
  _exAttempts = 0;
  _exDone     = false;

  outlet.innerHTML = _buildHTML();
  _initEnvironmental();
  markSectionDone('environmental', 'visited');
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------
function _buildHTML() {
  return `
<div class="module-page" id="module-environmental">

  <button class="module-back btn-ghost" data-nav="/modules">&#8592; Módulos</button>

  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
           stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M2 12h20"/>
        <path d="M4.9 7h14.2M4.9 17h14.2"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Química Ambiental</h1>
      <p class="module-subtitle">Efeito estufa, chuva ácida, ozônio, poluição e energias — a química do planeta.</p>
    </div>
  </header>

  <!-- ================================================================
       EFEITO ESTUFA
  ================================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Efeito estufa</h2>
    <p class="module-text">
      O Sol emite radiação UV e visível que atravessa a atmosfera e aquece a superfície terrestre.
      A Terra reemite energia como radiação <strong>infravermelha (IV)</strong> — comprimento de onda
      maior, fótons menos energéticos. Os <strong>gases de efeito estufa (GEE)</strong> absorvem essa IV
      e reemitem em todas as direções, incluindo de volta à superfície. O processo é análogo a um
      cobertor térmico. <em>Sem ele, a temperatura média seria −18 °C (atual: +15 °C).</em>
    </p>
    <p class="module-text">
      O problema atual é o <strong>aumento acelerado</strong> das concentrações de GEE pela atividade
      humana — principalmente CO₂ (combustíveis fósseis), CH₄ (pecuária, aterros) e N₂O (fertilizantes).
      O GWP100 (Global Warming Potential em 100 anos) compara o potencial de aquecimento relativo ao CO₂.
    </p>

    <div id="ghg-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.75rem">
      ${GREENHOUSE_GASES.map((g, i) => `
        <button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="ghg-tab-${i}" data-ghg="${i}">
          ${esc(g.gas)}</button>`).join('')}
    </div>
    <div id="ghg-content" class="info-card" style="background:var(--bg-raised);min-height:80px"></div>
  </section>

  <!-- Canvas efeito estufa -->
  <section class="module-section">
    <h2 class="module-section-title">Simulação: efeito estufa</h2>
    <p class="module-text">
      Fótons solares (amarelo) cruzam a atmosfera livremente. Fótons infravermelhos (vermelho)
      emitidos pela superfície são capturados por moléculas de CO₂ (azul) e reemitidos em direção
      aleatória. Aumente o CO₂ e observe mais energia retida.
    </p>
    <div class="canvas-frame" id="gh-frame" style="min-height:220px">
      <canvas id="gh-canvas" aria-label="Simulação efeito estufa"></canvas>
    </div>
    <div style="margin-top:.6rem;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">
        CO₂ (ppm):
        <input type="range" id="co2-slider" min="280" max="1200" step="20" value="280"
               style="width:130px;accent-color:var(--accent-reaction);vertical-align:middle;margin-left:.4rem">
        <span id="co2-val" style="color:var(--accent-reaction);min-width:60px;display:inline-block">280 ppm</span>
      </label>
      <div style="font-size:var(--text-xs);color:var(--text-muted)">
        <span style="color:#ffd166">●</span> Solar (vis.)
        <span style="color:#ef476f;margin-left:.6rem">●</span> IV (superfície)
        <span style="color:#4fc3f7;margin-left:.6rem">●</span> CO₂
      </div>
      <div id="gh-temp" style="font-size:var(--text-sm);color:var(--accent-organic);font-weight:600"></div>
    </div>
  </section>

  <!-- ================================================================
       CHUVA ÁCIDA
  ================================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Chuva ácida</h2>
    <p class="module-text">
      Chuva normal tem pH ≈ 5,6 (CO₂ + H₂O ⇌ H₂CO₃). Chuva ácida: pH &lt; 5,6,
      podendo chegar a 2–3. Causa corrosão de monumentos (calcário, mármore),
      acidificação de lagos (mata peixes), e danos à vegetação.
    </p>

    <div style="overflow-x:auto;margin:.75rem 0">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Etapa</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Equação</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Contexto</th>
          </tr>
        </thead>
        <tbody>
          ${ACID_RAIN_EQS.map(r => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;color:var(--accent-reaction);white-space:nowrap">${esc(r.step)}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-electron);
                white-space:pre-line;font-size:var(--text-xs)">${esc(r.eq)}</td>
            <td style="padding:.4rem .6rem;color:var(--text-muted);font-size:var(--text-xs)">${esc(r.note)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr));margin-top:.5rem">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Fontes de SOx</h3><p style="font-size:var(--text-sm)">Termoelétricas a carvão, refinarias de petróleo, fundições de metais sulfetados (pirita: FeS₂ → SO₂), vulcões (natural).</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-bond)">Fontes de NOx</h3><p style="font-size:var(--text-sm)">Motores de combustão interna (N₂ + O₂ → 2NO em alta T), fertilizantes nitrogenados, queimadas, raios.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Soluções</h3><p style="font-size:var(--text-sm)">Dessulfurização de combustíveis (hidrotratamento), catalisadores veiculares (three-way: NOx + CO + HC), cal calcária nos solos acidificados.</p></div>
    </div>
  </section>

  <!-- ================================================================
       CAMADA DE OZÔNIO
  ================================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Camada de ozônio</h2>
    <p class="module-text">
      O ozônio estratosférico (15–35 km de altitude) absorve a maior parte da radiação
      <strong>UV-B</strong> (280–315 nm) e toda a <strong>UV-C</strong> (&lt;280 nm), que causariam
      câncer de pele, catarata e danos ao DNA. A concentração de O₃ é medida em
      <strong>Unidades Dobson</strong> (1 DU = 10 µm de espessura em condições normais).
    </p>

    <div id="ozone-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.75rem">
      ${OZONE_STEPS.map((s, i) => `
        <button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="oz-tab-${i}" data-oz="${i}"
                style="border-color:${s.color}">${esc(s.label)}</button>`).join('')}
    </div>
    <div id="ozone-content" class="info-card" style="background:var(--bg-raised);min-height:80px"></div>

    <p class="module-text" style="margin-top:1rem">
      <strong>Protocolo de Montreal (1987)</strong> — tratado mais bem-sucedido da história ambiental.
      Banimento gradual de CFCs, HCFCs. Resultado: concentração de cloro estratosférico
      está diminuindo e o buraco do Antártico deve se fechar por volta de 2065.
    </p>
  </section>

  <!-- ================================================================
       POLUIÇÃO DA ÁGUA
  ================================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Poluição da água</h2>
    <p class="module-text">
      A água é o solvente universal — por isso acumula poluentes de todas as fontes.
      Os principais agentes e seus efeitos:
    </p>

    <div id="water-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.75rem">
      ${WATER_POLLUTANTS.map((w, i) => `
        <button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="wat-tab-${i}" data-wat="${i}">
          ${esc(w.name)}</button>`).join('')}
    </div>
    <div id="water-content" class="info-card" style="background:var(--bg-raised);min-height:80px"></div>
  </section>

  <!-- ================================================================
       AGROTÓXICOS E SOLO
  ================================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Agrotóxicos e poluição do solo</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Organoclorados</h3>
        <p style="font-size:var(--text-sm)">DDT, lindano, endrin. Lipossolúveis, persistentes (meia-vida anos a décadas), bioacumulam na cadeia trófica. DDT banido na maioria dos países (Convenção de Estocolmo, 2001). Ainda detectado em gordura humana.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Organofosforados</h3>
        <p style="font-size:var(--text-sm)">Glifosato, paration, malation. Mais biodegradáveis que organoclorados. Inibem a acetilcolinesterase (neurológico). Glifosato é o mais usado no mundo — debate sobre carcinogenicidade (IARC: "provável").</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Solo e microrganismos</h3>
        <p style="font-size:var(--text-sm)">Acidificação (chuva ácida, fertilizantes NH₄⁺) mobiliza Al³⁺ e Mn²⁺ tóxicos. Compactação reduz infiltração. Microrganismos do solo degradam matéria orgânica e fixam N₂ — agrotóxicos podem afetar estas populações.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--text-muted)">Resíduos sólidos</h3>
        <p style="font-size:var(--text-sm)">Aterros geram chorume (lixiviado) — líquido escuro com metais pesados, compostos orgânicos e patógenos que contamina lençol freático. Digestão anaeróbia gera CH₄ (biogás) que pode ser captado e usado.</p>
      </div>
    </div>
  </section>

  <!-- ================================================================
       ENERGIAS
  ================================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Fontes de energia e emissões</h2>
    <p class="module-text">
      O CO₂ equivalente por kWh gerado (análise de ciclo de vida) compara o impacto climático
      de cada fonte. Fontes renováveis emitem principalmente na fabricação dos equipamentos.
    </p>
    <div style="overflow-x:auto;margin:.75rem 0">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Fonte</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">CO₂eq/kWh</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Vantagens</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Desvantagens</th>
          </tr>
        </thead>
        <tbody>
          ${ENERGY_SOURCES.map(e => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-weight:600;
                color:${e.type==='fossil'?'var(--accent-reaction)':e.type==='renew'?'var(--accent-organic)':'var(--accent-electron)'}">
              ${esc(e.name)}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs);
                color:${e.type==='fossil'?'var(--accent-reaction)':'var(--accent-organic)'}">
              ${esc(e.co2)}</td>
            <td style="padding:.4rem .6rem;color:var(--text-secondary);font-size:var(--text-xs)">${esc(e.pros)}</td>
            <td style="padding:.4rem .6rem;color:var(--text-muted);font-size:var(--text-xs)">${esc(e.cons)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="module-text" style="margin-top:.5rem">
      O Brasil tem vantagem: ~85% da eletricidade vem de fontes renováveis (hidro, eólica, solar, biomassa).
      O desafio é o setor de transportes — predominantemente fóssil, exceto onde o etanol é usado.
    </p>
  </section>

  <!-- ================================================================
       EXERCÍCIOS
  ================================================================ -->
  <section class="module-section" id="exercise-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/${EXERCISES.length})</h2>
    <p class="module-text" id="ex-question">${esc(EXERCISES[0].q)}</p>
    <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;max-width:520px;margin-top:.75rem">
      ${EXERCISES[0].opts.map((opt, i) => `
        <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
                data-exopt="${i}">${esc(opt)}</button>`).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next"
            style="margin-top:1rem;display:none">Próximo exercício &#8594;</button>
  </section>

</div>`;
}

// ---------------------------------------------------------------------------
// Interações
// ---------------------------------------------------------------------------
function _initEnvironmental() {
  // --- GHG tabs ---
  function renderGHG(idx) {
    const g  = GREENHOUSE_GASES[idx];
    const el = document.getElementById('ghg-content');
    if (!el || !g) return;
    const gwpStr = g.gwp100 === null ? 'Indireto / variável' : g.gwp100 === 1 ? '1 (referência)' : g.gwp100.toLocaleString('pt-BR');
    el.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:.8rem;flex-wrap:wrap;margin-bottom:.5rem">
        <span style="font-family:monospace;font-size:var(--text-xl);font-weight:700;
              color:var(--accent-reaction)">${esc(g.gas)}</span>
        <span style="font-size:var(--text-sm);color:var(--text-secondary)">${esc(g.name)}</span>
        <span style="font-size:var(--text-xs);padding:2px 8px;border-radius:99px;
              border:1px solid var(--border-default);color:var(--text-muted)">${esc(g.conc)}</span>
      </div>
      <p style="font-size:var(--text-xs);font-family:monospace;color:var(--accent-bond);margin:.2rem 0">
        GWP₁₀₀ = ${gwpStr}
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.4rem 0 0">${esc(g.src)}</p>`;
    GREENHOUSE_GASES.forEach((_, j) => {
      const b = document.getElementById('ghg-tab-' + j);
      if (b) b.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
    });
  }
  renderGHG(0);
  GREENHOUSE_GASES.forEach((_, i) => document.getElementById('ghg-tab-' + i)
    ?.addEventListener('click', () => renderGHG(i)));

  // --- Greenhouse canvas ---
  const canvas = document.getElementById('gh-canvas');
  const frame  = document.getElementById('gh-frame');
  if (canvas && frame) {
    const W   = Math.min(frame.clientWidth || 520, 520);
    const H   = 220;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Fixed photon objects — solar going down, IR bouncing around
    const SURFACE_Y = H * 0.80;
    const ATM_TOP   = H * 0.10;
    const ATM_BOT   = H * 0.60;

    // CO₂ molecules (static dots in atm band)
    const CO2_BASE = 20;
    let co2Count   = CO2_BASE;

    let co2Mols = [];
    function rebuildCO2(n) {
      co2Mols = Array.from({ length: n }, () => ({
        x: Math.random() * W,
        y: ATM_TOP + Math.random() * (ATM_BOT - ATM_TOP),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2,
        r: 3 + Math.random() * 2,
      }));
    }
    rebuildCO2(co2Count);

    // Photons
    const photons = [];
    let spawnTimer = 0;
    function spawnPhoton(type) {
      if (type === 'solar') {
        photons.push({ x: Math.random() * W, y: 0, vx: 0, vy: 1.5, type: 'solar', alive: true });
      } else {
        // IR emitted from surface — random direction upward
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
        photons.push({
          x: Math.random() * W, y: SURFACE_Y,
          vx: Math.cos(angle) * 1.2, vy: Math.sin(angle) * 1.2,
          type: 'ir', alive: true, absorbed: false,
        });
      }
    }

    let retained = 0; // IR photons absorbed this second
    const tempBase = 15;

    _loop = new SimLoop(() => {
      clearCanvas(ctx, W, H);

      // Atmosphere band
      ctx.fillStyle = 'rgba(79,195,247,0.05)';
      ctx.fillRect(0, ATM_TOP, W, ATM_BOT - ATM_TOP);

      // Surface
      ctx.fillStyle = 'rgba(107,203,119,0.25)';
      ctx.fillRect(0, SURFACE_Y, W, H - SURFACE_Y);
      ctx.fillStyle = COLOR.organic;
      ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Superfície', 4, SURFACE_Y + 12);

      ctx.fillStyle = COLOR.textMuted;
      ctx.fillText('Atmosfera', 4, ATM_TOP + 14);

      // CO₂ molecules
      co2Mols.forEach(m => {
        m.x += m.vx; m.y += m.vy;
        if (m.x < 0) m.x = W; if (m.x > W) m.x = 0;
        if (m.y < ATM_TOP) m.vy *= -1;
        if (m.y > ATM_BOT) m.vy *= -1;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(79,195,247,0.5)';
        ctx.fill();
      });

      // Spawn photons
      spawnTimer++;
      if (spawnTimer % 18 === 0) spawnPhoton('solar');
      if (spawnTimer % 12 === 0) spawnPhoton('ir');

      retained = 0;
      // Update photons
      for (let i = photons.length - 1; i >= 0; i--) {
        const p = photons[i];
        if (!p.alive) { photons.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy;

        if (p.type === 'solar') {
          if (p.y >= SURFACE_Y) { p.alive = false; continue; } // absorbed by surface → becomes IR
        }

        if (p.type === 'ir') {
          // Check absorption by CO₂
          const hitCO2 = co2Mols.some(m => Math.hypot(p.x - m.x, p.y - m.y) < m.r + 4);
          if (hitCO2 && !p.absorbed) {
            p.absorbed = true;
            // Reemit in random direction
            const angle = Math.random() * Math.PI * 2;
            p.vx = Math.cos(angle) * 1.2; p.vy = Math.sin(angle) * 1.2;
            retained++;
          }
          if (p.x < 0 || p.x > W || p.y > SURFACE_Y) { p.alive = false; continue; }
          if (p.y < 0) { p.alive = false; continue; } // escaped
        }

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.type === 'solar' ? '#ffd166' : '#ef476f';
        ctx.fill();
      }

      // Trim photons array
      if (photons.length > 200) photons.splice(0, photons.length - 200);

      // Temp estimate
      const tempDelta = (co2Count - CO2_BASE) / CO2_BASE * 3.5;
      const tempEl = document.getElementById('gh-temp');
      if (tempEl) tempEl.textContent = `Temp. estimada: +${(tempBase + tempDelta).toFixed(1)} °C`;
    });
    _loop.start();

    // CO₂ slider
    document.getElementById('co2-slider')?.addEventListener('input', e => {
      _co2Level = parseInt(e.target.value, 10);
      const cv = document.getElementById('co2-val');
      if (cv) cv.textContent = _co2Level + ' ppm';
      // Scale CO₂ molecules proportionally
      co2Count = Math.round(CO2_BASE * (_co2Level / 280));
      rebuildCO2(co2Count);
    });
  }

  // --- Ozone tabs ---
  function renderOzone(idx) {
    const s  = OZONE_STEPS[idx];
    const el = document.getElementById('ozone-content');
    if (!el || !s) return;
    el.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:.8rem;flex-wrap:wrap;margin-bottom:.5rem">
        <span style="font-size:var(--text-base);font-weight:700;color:${s.color}">${esc(s.label)}</span>
      </div>
      <p style="font-size:var(--text-xs);font-family:monospace;color:${s.color};
         margin:.2rem 0;white-space:pre-line">${esc(s.eq)}</p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.4rem 0 0">${esc(s.note)}</p>`;
    OZONE_STEPS.forEach((_, j) => {
      const b = document.getElementById('oz-tab-' + j);
      if (b) b.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
    });
  }
  renderOzone(0);
  OZONE_STEPS.forEach((_, i) => document.getElementById('oz-tab-' + i)
    ?.addEventListener('click', () => renderOzone(i)));

  // --- Water tabs ---
  function renderWater(idx) {
    const w  = WATER_POLLUTANTS[idx];
    const el = document.getElementById('water-content');
    if (!el || !w) return;
    el.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:.8rem;flex-wrap:wrap;margin-bottom:.5rem">
        <span style="font-family:monospace;font-size:var(--text-xl);font-weight:700;
              color:var(--accent-electron)">${esc(w.name)}</span>
        <span style="font-size:var(--text-sm);color:var(--text-secondary)">${esc(w.full)}</span>
      </div>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin:.2rem 0">
        <strong style="color:var(--text-secondary)">Fontes:</strong> ${esc(w.src)}
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.4rem 0 0">${esc(w.effect)}</p>`;
    WATER_POLLUTANTS.forEach((_, j) => {
      const b = document.getElementById('wat-tab-' + j);
      if (b) b.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
    });
  }
  renderWater(0);
  WATER_POLLUTANTS.forEach((_, i) => document.getElementById('wat-tab-' + i)
    ?.addEventListener('click', () => renderWater(i)));

  // --- Exercises ---
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
          markSectionDone('environmental', 'exercise');
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
  loadExercise(0);
  document.getElementById('ex-next')?.addEventListener('click', () => {
    _exIdx = Math.min(_exIdx + 1, EXERCISES.length - 1);
    loadExercise(_exIdx);
  });
}

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
}
