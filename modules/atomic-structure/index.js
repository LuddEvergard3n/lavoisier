/**
 * modules/atomic-structure/index.js — Módulo: Estrutura Atômica
 * Lavoisier — Laboratório Visual de Química
 *
 * Ciclo pedagógico:
 *   1. Fenômeno — o átomo invisível ao redor de nós
 *   2. Visualização — modelo de Bohr interativo (Canvas 2D)
 *   3. Interação — controle de número atômico, visualização de íons
 *   4. Explicação — conceitos curtos
 *   5. Exercício guiado
 *   6. Aplicação no cotidiano
 */

import { SimLoop, ElectronOrbit } from '../../js/engine/simulation.js';
import { clearCanvas, drawOrbit, drawAtom, drawElectron, drawLabel, COLOR } from '../../js/engine/renderer.js';
import { createHiDPICanvas, esc, showToast } from '../../js/ui.js';
import { evaluateAnswer, getHint, renderHintBox } from '../../js/engine/feedback.js';
import { markSectionDone, getState, recordAttempt } from '../../js/state.js';

/* -----------------------------------------------------------------------
   Configuração de camadas eletrônicas (Bohr simplificado)
   Capacidade máxima por camada: 2, 8, 8, 18, 18, 32...
----------------------------------------------------------------------- */
const LAYER_CAPACITY = [2, 8, 8, 18, 18, 32];
const LAYER_RADII    = [45, 80, 115, 150, 185, 220]; // px para canvas 500px

/**
 * Distribui N elétrons nas camadas de acordo com a regra 2,8,8...
 * @param {number} electrons
 * @returns {number[]} quantidade de elétrons por camada
 */
function distributeElectrons(electrons) {
  const layers = [];
  let remaining = electrons;
  for (let i = 0; i < LAYER_CAPACITY.length && remaining > 0; i++) {
    const n = Math.min(remaining, LAYER_CAPACITY[i]);
    layers.push(n);
    remaining -= n;
  }
  return layers;
}

/* -----------------------------------------------------------------------
   Elementos pré-definidos para o seletor interativo
----------------------------------------------------------------------- */
const PRESET_ELEMENTS = [
  { symbol: 'H',  name: 'Hidrogênio', z: 1,  color: COLOR.H },
  { symbol: 'He', name: 'Hélio',      z: 2,  color: COLOR.electron },
  { symbol: 'Li', name: 'Lítio',      z: 3,  color: COLOR.reaction },
  { symbol: 'C',  name: 'Carbono',    z: 6,  color: COLOR.C },
  { symbol: 'N',  name: 'Nitrogênio', z: 7,  color: COLOR.N },
  { symbol: 'O',  name: 'Oxigênio',   z: 8,  color: COLOR.O },
  { symbol: 'Na', name: 'Sódio',      z: 11, color: COLOR.reaction },
  { symbol: 'Mg', name: 'Magnésio',   z: 12, color: COLOR.organic },
  { symbol: 'Cl', name: 'Cloro',      z: 17, color: COLOR.organic },
  { symbol: 'Ar', name: 'Argônio',    z: 18, color: COLOR.electron },
  { symbol: 'Fe', name: 'Ferro',      z: 26, color: COLOR.bond },
  { symbol: 'Cu', name: 'Cobre',      z: 29, color: COLOR.electron },
];

/* -----------------------------------------------------------------------
   Estado local do módulo (não persiste — é recriado a cada visita)
----------------------------------------------------------------------- */
const _state = {
  elementIndex: 4,  // O (oxigênio) como padrão
  ionCharge:    0,
  orbits:       [],
  loop:         null,
  canvas:       null,
  ctx:          null,
  width:        500,
  height:       500,
  exerciseDone: false,
  hintLevel:    0,
};

/* -----------------------------------------------------------------------
   Entrada pública do módulo
----------------------------------------------------------------------- */

/**
 * Renderiza o módulo no elemento #app.
 * @param {HTMLElement} outlet
 */

// Configuração eletrônica — tabela dos primeiros 36 elementos
const EC_TABLE = [
  '',
  '1s¹',             // H
  '1s²',             // He
  '[He] 2s¹',        // Li
  '[He] 2s²',        // Be
  '[He] 2s² 2p¹',   // B
  '[He] 2s² 2p²',   // C
  '[He] 2s² 2p³',   // N
  '[He] 2s² 2p⁴',   // O
  '[He] 2s² 2p⁵',   // F
  '[He] 2s² 2p⁶',   // Ne
  '[Ne] 3s¹',        // Na
  '[Ne] 3s²',        // Mg
  '[Ne] 3s² 3p¹',   // Al
  '[Ne] 3s² 3p²',   // Si
  '[Ne] 3s² 3p³',   // P
  '[Ne] 3s² 3p⁴',   // S
  '[Ne] 3s² 3p⁵',   // Cl
  '[Ne] 3s² 3p⁶',   // Ar
  '[Ar] 4s¹',        // K
  '[Ar] 4s²',        // Ca
  '[Ar] 3d¹ 4s²',   // Sc
  '[Ar] 3d² 4s²',   // Ti
  '[Ar] 3d³ 4s²',   // V
  '[Ar] 3d⁵ 4s¹',   // Cr (exceção)
  '[Ar] 3d⁵ 4s²',   // Mn
  '[Ar] 3d⁶ 4s²',   // Fe
  '[Ar] 3d⁷ 4s²',   // Co
  '[Ar] 3d⁸ 4s²',   // Ni
  '[Ar] 3d¹⁰ 4s¹',  // Cu (exceção)
  '[Ar] 3d¹⁰ 4s²',  // Zn
  '[Ar] 3d¹⁰ 4s² 4p¹', // Ga
  '[Ar] 3d¹⁰ 4s² 4p²', // Ge
  '[Ar] 3d¹⁰ 4s² 4p³', // As
  '[Ar] 3d¹⁰ 4s² 4p⁴', // Se
  '[Ar] 3d¹⁰ 4s² 4p⁵', // Br
  '[Ar] 3d¹⁰ 4s² 4p⁶', // Kr
];

const EC_NAMES = [
  '','H','He','Li','Be','B','C','N','O','F','Ne',
  'Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca',
  'Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn',
  'Ga','Ge','As','Se','Br','Kr'
];

const EC_VALENCE = [
  '','1s¹','1s²','2s¹','2s²','2s² 2p¹','2s² 2p²','2s² 2p³','2s² 2p⁴','2s² 2p⁵','2s² 2p⁶',
  '3s¹','3s²','3s² 3p¹','3s² 3p²','3s² 3p³','3s² 3p⁴','3s² 3p⁵','3s² 3p⁶',
  '4s¹','4s²','3d¹ 4s²','3d² 4s²','3d³ 4s²','3d⁵ 4s¹','3d⁵ 4s²','3d⁶ 4s²','3d⁷ 4s²','3d⁸ 4s²','3d¹⁰ 4s¹','3d¹⁰ 4s²',
  '4p¹','4p²','4p³','4p⁴','4p⁵','4p⁶'
];

export function render(outlet) {
  outlet.innerHTML = _buildHTML();
  _initSimulation();
  _bindControls();
  _initEC();
  _initSpec();
  markSectionDone('atomic-structure', 'visited');
}

/* -----------------------------------------------------------------------
   Construção do HTML
----------------------------------------------------------------------- */

function _buildHTML() {
  const module = PRESET_ELEMENTS[_state.elementIndex];

  return `
<div class="module-page" id="module-atomic">

  <!-- Voltar -->
  <button class="module-back btn-ghost" data-nav="/modules">
    &#8592; Módulos
  </button>

  <!-- Cabeçalho -->
  <header class="module-header">
    <h1 class="module-title">Estrutura Atômica</h1>
    <p class="module-concept">
      Todo objeto ao seu redor — o ar, a água, seu próprio corpo — é feito de átomos.
      Cada átomo tem um núcleo central e elétrons em movimento ao redor dele.
      Compreender essa estrutura é compreender por que os elementos se comportam como se comportam.
    </p>
    <div class="progress-strip">
      <div class="progress-step done"  title="Fenômeno"></div>
      <div class="progress-step done"  title="Visualização"></div>
      <div class="progress-step current" title="Interação"></div>
      <div class="progress-step" title="Exercício"></div>
      <div class="progress-step" title="Cotidiano"></div>
    </div>
  </header>

  <!-- SEÇÃO 1: Fenômeno -->
    <!-- Espectroscopia -->
  <section class="module-section">
    <h2 class="module-section-title">Espectroscopia e o modelo de Bohr</h2>
    <p class="module-text">Quando um elétron salta de nível superior (n₂) para inferior (n₁), emite um fóton com energia <strong>ΔE = hf = hc/λ</strong>. A equação de Rydberg prevê os comprimentos de onda exatos do hidrogênio:</p>
    <div class="info-card" style="background:var(--bg-raised);margin:.5rem 0 1rem;max-width:420px">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin:0">1/λ = R_H × (1/n₁² − 1/n₂²)<br><span style="color:var(--text-muted)">R_H = 1,097×10⁷ m⁻¹ (constante de Rydberg)</span></p>
    </div>

    <div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:120px;font-size:var(--text-sm);color:var(--text-secondary)">n₁ (nível inferior):</label>
        <input type="range" id="spec-n1" min="1" max="5" step="1" value="2" style="width:120px;accent-color:var(--accent-electron)">
        <span id="spec-n1-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:30px">2</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:120px;font-size:var(--text-sm);color:var(--text-secondary)">n₂ (nível superior):</label>
        <input type="range" id="spec-n2" min="2" max="10" step="1" value="4" style="width:120px;accent-color:var(--accent-bond)">
        <span id="spec-n2-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:30px">4</span>
      </div>
    </div>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Comprimento de onda λ</p><div id="spec-lambda" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Energia do fóton</p><div id="spec-energy" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Região do espectro</p><div id="spec-region" style="font-size:var(--text-lg);font-weight:600;color:var(--accent-organic)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Série</p><div id="spec-series" style="font-size:var(--text-base);font-weight:600;color:var(--text-secondary)">—</div></div>
    </div>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-top:.75rem">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-electron)">Lyman (UV)</h3><p style="font-size:var(--text-sm)">n → 1. Série no ultravioleta. Primeiros estudos do hidrogênio ionosférico.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Balmer (visível)</h3><p style="font-size:var(--text-sm)">n → 2. 4 linhas no visível: 656 nm (vermelho Hα), 486 nm (azul-verde), 434 nm (violeta), 410 nm. Dá a cor avermelhada de nebulosas.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Paschen/Bracket/Pfund</h3><p style="font-size:var(--text-sm)">n → 3, 4, 5. Infravermelho. Usadas em astrofísica e telecomunicações ópticas.</p></div>
    </div>
  </section>

  <!-- Efeito fotoelétrico -->
  <section class="module-section">
    <h2 class="module-section-title">Efeito fotoelétrico e dualidade onda-partícula</h2>
    <p class="module-text">Einstein (1905, Nobel 1921) explicou que luz vem em pacotes (fótons) de energia E = hf. Elétrons só são ejetados de um metal quando E_fóton &gt; φ (função de trabalho). Energia cinética do elétron ejetado: <strong>Ec = hf − φ</strong>.</p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Função de trabalho φ de metais comuns</p>
        <p style="font-family:monospace;font-size:var(--text-xs)">Cs: 2,0 eV | Na: 2,3 eV<br>Al: 4,3 eV | Cu: 4,7 eV<br>Au: 5,1 eV | Pt: 5,7 eV</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-bond)">De Broglie</h3><p style="font-size:var(--text-sm)">Partículas têm comprimento de onda: λ = h/mv. Elétron com v = 10⁶ m/s: λ ≈ 0,7 nm — escala atômica. Base da microscopia eletrônica (TEM, SEM).</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Princípio de Heisenberg</h3><p style="font-size:var(--text-sm)">Δx · Δp ≥ ℏ/2. Impossível conhecer posição e momento com precisão simultânea. Por isso orbitais são distribuições de probabilidade — não órbitas definidas.</p></div>
    </div>
  </section>

<section class="module-section" id="sec-phenomenon">
    <h2 class="module-section-title">Fenômeno</h2>
    <div class="info-card phenomenon-card">
      <h3>O que é um átomo?</h3>
      <p>
        Pegue um copo de água. Divida-o ao meio. Divida novamente. Continue dividindo.
        Em algum momento você chegaria a algo que não pode mais ser dividido sem perder
        a identidade da substância: o <strong>átomo</strong>.
      </p>
      <p style="margin-top:0.75rem">
        O átomo de oxigênio sempre será oxigênio — com 8 prótons em seu núcleo.
        Se você remover um próton, ele deixa de ser oxigênio e se torna nitrogênio.
        O <strong>número de prótons</strong> é a identidade do elemento.
      </p>
    </div>
  </section>

  <!-- SEÇÃO 2: Visualização — Modelo de Bohr -->
  <section class="module-section" id="sec-visualization">
    <h2 class="module-section-title">Visualização — Modelo de Bohr</h2>

    <div class="sim-panel">
      <!-- Seletor de elemento -->
      <div class="molecule-toolbar" id="element-selector" role="group" aria-label="Selecione o elemento">
        ${PRESET_ELEMENTS.map((el, i) => `
          <button class="atom-btn ${i === _state.elementIndex ? 'active' : ''}"
                  data-el-index="${i}"
                  aria-pressed="${i === _state.elementIndex}"
                  title="${esc(el.name)} (Z=${el.z})">${esc(el.symbol)}</button>
        `).join('')}
      </div>

      <!-- Controles -->
      <div class="sim-controls">
        <div class="sim-control-group">
          <span class="sim-control-label">Carga iônica</span>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <button class="btn btn-sm btn-secondary" id="btn-ion-minus" aria-label="Remover elétron">−</button>
            <span class="sim-value" id="ion-charge-display">0</span>
            <button class="btn btn-sm btn-secondary" id="btn-ion-plus"  aria-label="Adicionar elétron">+</button>
          </div>
        </div>
        <button class="btn btn-sm btn-ghost" id="btn-reset-ion">Resetar</button>
      </div>

      <!-- Canvas -->
      <div class="canvas-frame" id="atom-canvas-frame">
        <div class="canvas-label">Modelo de Bohr (simplificado)</div>
      </div>

      <!-- Info do elemento -->
      <div class="info-card" id="atom-info">
        ${_buildAtomInfo(module, 0)}
      </div>
    </div>
  </section>

  <!-- SEÇÃO 3: Explicação -->
  <section class="module-section" id="sec-explanation">
    <h2 class="module-section-title">Explicação</h2>

    <div class="info-card">
      <h3>Partículas subatômicas</h3>
      <p>
        O <strong>núcleo</strong> contém prótons (carga +1) e nêutrons (carga 0).
        O <strong>número atômico (Z)</strong> é o número de prótons e define o elemento.
        Os <strong>elétrons</strong> (carga -1) orbitam o núcleo em camadas de energia.
      </p>
    </div>

    <div class="info-card" style="margin-top:1rem">
      <h3>Distribuição eletrônica</h3>
      <p>
        A primeira camada comporta até 2 elétrons. A segunda e a terceira, até 8.
        Essa distribuição determina as propriedades químicas do elemento —
        especialmente os elétrons da última camada (camada de valência).
      </p>
    </div>

    <div class="info-card" style="margin-top:1rem">
      <h3>Íons</h3>
      <p>
        Quando um átomo perde elétrons, fica com carga positiva: <strong>cátion</strong> (ex: Na⁺).
        Quando ganha elétrons, fica negativo: <strong>ânion</strong> (ex: Cl⁻).
        Use os controles de carga acima para visualizar a formação de íons.
      </p>
    </div>
  </section>

  <!-- SEÇÃO 4: Exercício -->

  <!-- Modelo quântico -->
  <section class="module-section">
    <h2 class="module-section-title">Modelo quântico — Orbitais</h2>
    <p class="module-text">
      O modelo de Bohr (órbitas circulares) foi superado pelo modelo quântico de Schrödinger.
      Elétrons não têm trajetórias definidas — existem em <strong>orbitais</strong>, regiões
      de maior probabilidade de encontrar o elétron. Cada orbital é descrito por 4 números
      quânticos (n, l, mₗ, mₛ).
    </p>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin:.75rem 0">
      <div class="info-card">
        <h3 style="margin-top:0">n — Principal</h3>
        <p style="font-size:var(--text-sm)">Nível de energia e tamanho do orbital.<br>n = 1, 2, 3…<br>Maior n = maior energia e distância.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0">l — Azimutal</h3>
        <p style="font-size:var(--text-sm)">Forma do orbital.<br>l=0: s (esférico)<br>l=1: p (2 lobos)<br>l=2: d (4 lobos)</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0">mₗ — Magnético</h3>
        <p style="font-size:var(--text-sm)">Orientação no espaço.<br>s: 1 orbital<br>p: 3 orbitais<br>d: 5 orbitais</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0">mₛ — Spin</h3>
        <p style="font-size:var(--text-sm)">Direção do giro intrínseco.<br>+½ (seta para cima ↑)<br>−½ (seta para baixo ↓)</p>
      </div>
    </div>

    <p class="module-text">
      <strong>Princípio de Pauli</strong>: dois elétrons no mesmo orbital devem ter spins opostos
      (não podem ter os 4 números quânticos iguais).
      <strong>Regra de Hund</strong>: orbitais de mesma energia são preenchidos um a um antes de emparelhar.
    </p>
  </section>

  <!-- Configuração eletrônica -->
  <section class="module-section">
    <h2 class="module-section-title">Configuração eletrônica</h2>
    <p class="module-text">
      A configuração eletrônica descreve como os elétrons estão distribuídos pelos orbitais,
      seguindo a ordem de preenchimento de Aufbau (de menor para maior energia).
    </p>
    <p class="module-text" style="font-family:monospace;font-size:var(--text-sm)">
      Ordem: 1s → 2s → 2p → 3s → 3p → 4s → 3d → 4p → 5s → 4d → 5p…
    </p>

    <div style="margin-top:.75rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
        <label style="font-size:var(--text-sm);color:var(--text-secondary)">Número atômico (Z):</label>
        <input type="range" id="ec-z" min="1" max="36" step="1" value="6"
               style="width:180px;accent-color:var(--accent-electron)">
        <span id="ec-z-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">Z = 6 (C)</span>
      </div>
      <div class="info-card" style="max-width:480px;background:var(--bg-raised)">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.5rem">Configuração eletrônica</p>
        <div id="ec-config" style="font-family:monospace;font-size:var(--text-lg);color:var(--accent-electron)"></div>
        <div id="ec-valence" style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.5rem"></div>
      </div>

      <!-- Diagrama de caixas orbital -->
      <div id="ec-boxes" style="margin-top:1rem;display:flex;flex-direction:column;gap:.4rem"></div>
    </div>
  </section>

  <section class="module-section" id="sec-exercise">
    <h2 class="module-section-title">Exercício Guiado</h2>

    <div class="exercise-card" id="exercise-container">
      <p class="exercise-question" id="ex-question">
        Um átomo de cloro (Cl, Z=17) neutro tem quantos elétrons?
      </p>
      <div class="exercise-options" id="ex-options" role="group" aria-label="Opções de resposta">
        ${['16','17','18','35'].map(opt => `
          <button class="exercise-option" data-answer="${esc(opt)}" aria-pressed="false">
            ${esc(opt)} elétrons
          </button>
        `).join('')}
      </div>
      <div class="hint-box" id="ex-hint" role="note" aria-label="Dica"></div>
      <div class="exercise-feedback" id="ex-feedback"></div>
      <div class="exercise-actions">
        <button class="btn btn-secondary btn-sm" id="btn-hint">Usar dica</button>
        <button class="btn btn-primary btn-sm"   id="btn-check" style="display:none">Verificar</button>
        <button class="btn btn-ghost btn-sm"     id="btn-next"  style="display:none">Próximo exercício</button>
      </div>
    </div>
  </section>

  <!-- SEÇÃO 5: Cotidiano -->
  <section class="module-section" id="sec-reallife">
    <h2 class="module-section-title">Onde isso aparece na vida real?</h2>

    <div class="real-life-card">
      <div class="real-life-label">Medicina</div>
      <p>
        Na <strong>radioterapia</strong>, isótopos radioativos (mesmos prótons, nêutrons diferentes)
        emitem radiação que destrói células tumorais com precisão. Isso é possível porque
        entendemos como o núcleo atômico se comporta.
      </p>
    </div>

    <div class="real-life-card">
      <div class="real-life-label">Eletrônica</div>
      <p>
        O silício (Z=14) tem 4 elétrons de valência — metade do octeto.
        Isso o torna um <strong>semicondutor</strong> natural, a base de todo chip de computador,
        smartphone e painel solar.
      </p>
    </div>

    <div class="real-life-card">
      <div class="real-life-label">Alimentação</div>
      <p>
        O sal de cozinha (NaCl) se dissolve em água porque o Na perde 1 elétron
        e vira Na⁺, e o Cl ganha esse elétron virando Cl⁻. Esses íons opostos são
        atraídos pelas moléculas polares da água — por isso o sal "desaparece".
      </p>
    </div>

    <div style="margin-top:2rem; text-align:center">
      <button class="btn btn-primary" data-nav="/module/periodic-table">
        Próximo módulo: Tabela Periódica &#8594;
      </button>
    </div>
  </section>

</div>
`;
}

function _buildAtomInfo(el, charge) {
  const electrons = el.z - charge;
  const layers    = distributeElectrons(Math.max(0, electrons));
  const ionLabel  = charge === 0 ? 'neutro'
    : charge > 0 ? `${el.symbol}${charge > 1 ? charge : ''}⁺`
    : `${el.symbol}${Math.abs(charge) > 1 ? Math.abs(charge) : ''}⁻`;

  return `
    <h3>${esc(el.name)} — ${esc(ionLabel)}</h3>
    <div class="element-props">
      <div class="element-prop">
        <span class="element-prop-label">Número atômico (Z)</span>
        <span class="element-prop-value">${el.z}</span>
      </div>
      <div class="element-prop">
        <span class="element-prop-label">Prótons</span>
        <span class="element-prop-value">${el.z}</span>
      </div>
      <div class="element-prop">
        <span class="element-prop-label">Elétrons</span>
        <span class="element-prop-value">${Math.max(0, electrons)}</span>
      </div>
      <div class="element-prop">
        <span class="element-prop-label">Distribuição eletrônica</span>
        <span class="element-prop-value">${layers.join(', ')}</span>
      </div>
      <div class="element-prop">
        <span class="element-prop-label">Elétrons de valência</span>
        <span class="element-prop-value">${layers[layers.length - 1] ?? 0}</span>
      </div>
    </div>
  `;
}

/* -----------------------------------------------------------------------
   Inicialização da simulação Canvas
----------------------------------------------------------------------- */

function _initSimulation() {
  const frame = document.getElementById('atom-canvas-frame');
  if (!frame) return;

  const W = Math.min(frame.clientWidth || 400, 400);
  const H = W; // quadrado
  frame.style.minHeight = H + 'px';
  _state.width  = W;
  _state.height = H;

  const { canvas, ctx } = createHiDPICanvas(W, H);
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Modelo de Bohr animado do átomo selecionado');
  frame.insertBefore(canvas, frame.firstChild);

  _state.canvas = canvas;
  _state.ctx    = ctx;

  _rebuildOrbits();

  if (_state.loop) _state.loop.stop();
  _state.loop = new SimLoop((dt, t) => _renderFrame(dt, t));
  _state.loop.start();
}

/**
 * Reconstrói as órbitas com base no elemento e carga atuais.
 */
function _rebuildOrbits() {
  const el        = PRESET_ELEMENTS[_state.elementIndex];
  const electrons = Math.max(0, el.z - _state.ionCharge);
  const layers    = distributeElectrons(electrons);
  const cx        = _state.width  / 2;
  const cy        = _state.height / 2;

  _state.orbits = layers.map((count, layerIdx) => {
    const r   = LAYER_RADII[layerIdx] * (_state.width / 500);
    const ry  = r * 0.38; // elipse flatten para perspectiva
    const tilt = layerIdx * (Math.PI / (layers.length + 1));

    const electrons = [];
    for (let i = 0; i < count; i++) {
      const initialAngle = (i / count) * Math.PI * 2;
      const speed        = 1.2 - layerIdx * 0.15; // camadas externas mais lentas
      electrons.push(new ElectronOrbit(cx, cy, r, ry, speed, initialAngle, tilt));
    }
    return { r, ry, tilt, electrons };
  });
}

function _renderFrame(dt) {
  const { ctx, width: W, height: H } = _state;
  const el = PRESET_ELEMENTS[_state.elementIndex];
  const cx = W / 2;
  const cy = H / 2;

  clearCanvas(ctx, W, H);

  // Órbitas (fundo)
  _state.orbits.forEach(layer => {
    drawOrbit(ctx, cx, cy, layer.r, layer.ry, layer.tilt, 0.2);
  });

  // Núcleo
  const nucleusR = Math.max(16, 10 + el.z * 0.5) * (W / 500);
  drawAtom(ctx, cx, cy, Math.min(nucleusR, 36), el.symbol, { glow: true });

  // Elétrons em movimento
  _state.orbits.forEach(layer => {
    layer.electrons.forEach(e => {
      e.update(dt);
      const { x, y } = e.position();
      ctx.save();
      ctx.shadowColor = COLOR.electron;
      ctx.shadowBlur  = 8;
      ctx.beginPath();
      ctx.arc(x, y, 4 * (W / 500), 0, Math.PI * 2);
      ctx.fillStyle = COLOR.electron;
      ctx.fill();
      ctx.restore();
    });
  });

  // Rótulo de carga se for íon
  if (_state.ionCharge !== 0) {
    const chargeLabel = _state.ionCharge > 0
      ? `+${_state.ionCharge}`
      : String(_state.ionCharge);
    drawLabel(ctx, `${el.symbol}${chargeLabel}`, cx, cy + Math.min(nucleusR, 36) + 16,
      _state.ionCharge > 0 ? COLOR.reaction : COLOR.electron,
      `bold 14px "Segoe UI", sans-serif`
    );
  }
}

/* -----------------------------------------------------------------------
   Binding de controles
----------------------------------------------------------------------- */

function _bindControls() {
  // Seletor de elemento
  document.getElementById('element-selector')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-el-index]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.elIndex, 10);
    _setElement(idx);
  });

  // Controle de íon
  document.getElementById('btn-ion-minus')?.addEventListener('click', () => _adjustCharge(1));
  document.getElementById('btn-ion-plus') ?.addEventListener('click', () => _adjustCharge(-1));
  document.getElementById('btn-reset-ion')?.addEventListener('click', () => {
    _state.ionCharge = 0;
    _updateIonDisplay();
    _rebuildOrbits();
  });

  // Exercício
  document.getElementById('ex-options')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-answer]');
    if (!btn || _state.exerciseDone) return;
    document.querySelectorAll('#ex-options .exercise-option').forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('selected');
    btn.setAttribute('aria-pressed', 'true');
    document.getElementById('btn-check').style.display = 'inline-flex';
  });

  document.getElementById('btn-check')?.addEventListener('click', _checkAnswer);
  document.getElementById('btn-hint') ?.addEventListener('click', _showHint);
  document.getElementById('btn-next') ?.addEventListener('click', _nextExercise);
}

function _setElement(idx) {
  _state.elementIndex = idx;
  _state.ionCharge    = 0;

  // Atualiza botões
  document.querySelectorAll('[data-el-index]').forEach(b => {
    const active = parseInt(b.dataset.elIndex, 10) === idx;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });

  _updateIonDisplay();
  _rebuildOrbits();

  const el = PRESET_ELEMENTS[idx];
  const info = document.getElementById('atom-info');
  if (info) info.innerHTML = _buildAtomInfo(el, 0);

  markSectionDone('atomic-structure', 'visualization');
}

function _adjustCharge(delta) {
  const el          = PRESET_ELEMENTS[_state.elementIndex];
  const newCharge   = _state.ionCharge + delta;
  const newElectrons = el.z - newCharge;

  if (newElectrons < 0 || newElectrons > el.z + 6) return; // limites razoáveis

  _state.ionCharge = newCharge;
  _updateIonDisplay();
  _rebuildOrbits();

  const info = document.getElementById('atom-info');
  if (info) info.innerHTML = _buildAtomInfo(el, newCharge);
}

function _updateIonDisplay() {
  const el = document.getElementById('ion-charge-display');
  if (!el) return;
  const c = _state.ionCharge;
  el.textContent = c === 0 ? '0' : c > 0 ? `+${c}` : String(c);
  el.style.color = c > 0 ? COLOR.reaction : c < 0 ? COLOR.electron : COLOR.textPrimary;
}

/* -----------------------------------------------------------------------
   Exercício
----------------------------------------------------------------------- */

const EXERCISES = [
  {
    id: 'as-ex-01',
    question: 'Um átomo de cloro (Cl, Z=17) neutro tem quantos elétrons?',
    options: ['16 elétrons', '17 elétrons', '18 elétrons', '35 elétrons'],
    answer: '17 elétrons',
    hints: [
      'No átomo neutro, as cargas se equilibram.',
      'Z = 17 significa 17 prótons (+). Para carga total zero, quantos elétrons (-) são necessários?',
      'Número de elétrons = Z = 17 no átomo neutro.'
    ],
    explanation: 'No átomo neutro: carga total = 0. Com 17 prótons (+17), são necessários 17 elétrons (−17). A soma é zero.'
  },
  {
    id: 'as-ex-02',
    question: 'O íon O²⁻ (oxigênio com carga -2) tem quantos elétrons? (Z do O = 8)',
    options: ['6 elétrons', '8 elétrons', '10 elétrons', '16 elétrons'],
    answer: '10 elétrons',
    hints: [
      'A carga -2 indica que o oxigênio ganhou 2 elétrons a mais que prótons.',
      'O átomo neutro de O tem 8 elétrons. Ele ganhou 2 elétrons para virar O²⁻.',
      '8 elétrons + 2 = 10 elétrons.'
    ],
    explanation: 'O²⁻ ganhou 2 elétrons. O átomo neutro tem 8 (= Z). Com 2 a mais: 8 + 2 = 10 elétrons. A carga resultante: +8 (prótons) −10 (elétrons) = −2.'
  },
  {
    id: 'as-ex-03',
    question: 'Qual modelo atômico introduziu as órbitas eletrônicas com raios definidos?',
    options: ['Thomson (pudim de ameixa)', 'Dalton (bola sólida)', 'Bohr (órbitas definidas)', 'Rutherford (núcleo + nuvem)'],
    answer: 'Bohr (órbitas definidas)',
    hints: [
      'Thomson descobriu o elétron mas não definiu órbitas.',
      'Rutherford descobriu o núcleo, mas os elétrons "flutuavam" ao redor sem posição definida.',
      'Quem calculou raios precisos para as órbitas eletrônicas do hidrogênio?'
    ],
    explanation: 'Niels Bohr (1913) propôs que os elétrons orbitam o núcleo em camadas de energia definida. Elétrons só emitem ou absorvem energia ao mudar de camada, explicando os espectros atômicos.'
  }
];

let _currentExIdx = 0;

function _loadExercise(idx) {
  _state.exerciseDone = false;
  _state.hintLevel    = 0;
  _currentExIdx       = idx;
  const ex = EXERCISES[idx];

  const q = document.getElementById('ex-question');
  const o = document.getElementById('ex-options');
  const h = document.getElementById('ex-hint');
  const f = document.getElementById('ex-feedback');
  const btnCheck = document.getElementById('btn-check');
  const btnNext  = document.getElementById('btn-next');

  if (!q || !o) return;

  q.textContent = ex.question;
  o.innerHTML = ex.options.map(opt => `
    <button class="exercise-option" data-answer="${esc(opt)}" aria-pressed="false">${esc(opt)}</button>
  `).join('');
  if (h) { h.textContent = ''; h.classList.remove('visible'); }
  if (f) { f.textContent = ''; f.className = 'exercise-feedback'; }
  if (btnCheck) btnCheck.style.display = 'none';
  if (btnNext)  btnNext.style.display  = 'none';
}

function _checkAnswer() {
  if (_state.exerciseDone) return;
  const ex       = EXERCISES[_currentExIdx];
  const selected = document.querySelector('#ex-options .exercise-option.selected');
  if (!selected) return;

  const given     = selected.dataset.answer;
  const { correct, attempts, message } = evaluateAnswer(ex.id, given, ex.answer);

  const feedback = document.getElementById('ex-feedback');
  const opts     = document.querySelectorAll('#ex-options .exercise-option');

  opts.forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.answer === ex.answer) btn.classList.add('correct');
    else if (btn.classList.contains('selected')) btn.classList.add('wrong');
  });

  if (feedback) {
    feedback.textContent  = ex.explanation;
    feedback.className    = `exercise-feedback ${correct ? 'bg-correct' : 'bg-error'}`;
  }

  if (correct) {
    _state.exerciseDone = true;
    document.getElementById('btn-check').style.display = 'none';
    document.getElementById('btn-hint') .style.display = 'none';
    if (_currentExIdx < EXERCISES.length - 1) {
      document.getElementById('btn-next').style.display = 'inline-flex';
    }
    markSectionDone('atomic-structure', 'exercise');
  }
}

function _showHint() {
  const ex   = EXERCISES[_currentExIdx];
  const state = getState();
  const attempts = state.attempts[ex.id] || 0;
  const { text } = getHint(ex.id, ex.hints, Math.max(1, attempts));
  const hintEl = document.getElementById('ex-hint');
  if (hintEl) {
    hintEl.textContent = text;
    hintEl.classList.add('visible');
  }
}

function _nextExercise() {
  if (_currentExIdx < EXERCISES.length - 1) {
    _loadExercise(_currentExIdx + 1);
    // Rebind após recriar DOM
    document.getElementById('ex-options')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-answer]');
      if (!btn || _state.exerciseDone) return;
      document.querySelectorAll('#ex-options .exercise-option').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      document.getElementById('btn-check').style.display = 'inline-flex';
    });
  }
}

/* -----------------------------------------------------------------------
   Cleanup — para o loop ao navegar para fora
----------------------------------------------------------------------- */

function _initEC() {
  // Configuração eletrônica
  function updateEC() {
    const z   = parseInt(document.getElementById('ec-z')?.value || 6, 10);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('ec-z-val',  `Z = ${z} (${EC_NAMES[z]})`);
    set('ec-config', EC_TABLE[z] || '—');
    set('ec-valence', z > 0 ? `Camada de valência: ${EC_VALENCE[z]}` : '');

    // Diagrama de caixas
    const boxesEl = document.getElementById('ec-boxes');
    if (!boxesEl) return;

    // Build orbital occupancies by filling Aufbau order
    const aufbau = [
      {label:'1s', cap:2}, {label:'2s', cap:2}, {label:'2p', cap:6},
      {label:'3s', cap:2}, {label:'3p', cap:6}, {label:'4s', cap:2},
      {label:'3d', cap:10},{label:'4p', cap:6},
    ];

    // Special cases (Cr=24, Cu=29)
    const special = { 24: [2,2,6,2,6,1,5,0], 29: [2,2,6,2,6,1,10,0] };
    let fills = special[z] ? [...special[z]] : [];
    if (!special[z]) {
      let rem = z;
      fills = aufbau.map(o => { const f = Math.min(rem, o.cap); rem -= f; return f; });
    }

    boxesEl.innerHTML = aufbau.map((orb, i) => {
      const n = fills[i] || 0;
      if (n === 0) return '';
      const slots = orb.cap / 2; // number of boxes
      let boxHtml = '';
      for (let b = 0; b < slots; b++) {
        const up   = n > b * 2 ? '↑' : '';
        const down = n > b * 2 + 1 ? '↓' : '';
        boxHtml += `<div style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:24px;height:28px;border:1px solid var(--border-strong);border-radius:2px;margin:1px;font-size:11px;color:var(--accent-electron)"><span>${up}</span><span>${down}</span></div>`;
      }
      return `<div style="display:flex;align-items:center;gap:.5rem">
        <span style="min-width:28px;font-family:monospace;font-size:var(--text-xs);color:var(--text-muted)">${orb.label}</span>
        <div>${boxHtml}</div>
        <span style="font-family:monospace;font-size:var(--text-xs);color:var(--accent-electron)">${orb.label}${n > 0 ? toSuperscript(n) : ''}</span>
      </div>`;
    }).join('');
  }

  function toSuperscript(n) {
    return String(n).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹¹⁰'[parseInt(d)]).join('');
  }

  updateEC();
  document.getElementById('ec-z')?.addEventListener('input', updateEC);

}

function _initSpec() {
  const RH = 1.097e7;  // m⁻¹
  const h  = 6.626e-34; // J·s
  const c  = 3e8;        // m/s
  const eV = 1.602e-19;  // J
  function updateSpec() {
    const n1 = parseInt(document.getElementById('spec-n1')?.value||2,10);
    const n2 = parseInt(document.getElementById('spec-n2')?.value||4,10);
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    set('spec-n1-val', n1); set('spec-n2-val', n2);
    if(n2<=n1){set('spec-lambda','n₂ deve ser > n₁');set('spec-energy','—');set('spec-region','—');set('spec-series','—');return;}
    const invLambda = RH*(1/(n1*n1)-1/(n2*n2));
    const lambda = 1/invLambda*1e9; // nm
    const E = h*c*invLambda/eV;    // eV
    const region = lambda<100?'UV extremo':lambda<400?'Ultravioleta':lambda<700?'Visível':lambda<1000?'IV próximo':'Infravermelho';
    const series = n1===1?'Lyman':n1===2?'Balmer':n1===3?'Paschen':n1===4?'Brackett':'Pfund';
    set('spec-lambda', lambda.toFixed(1)+' nm');
    set('spec-energy', E.toFixed(3)+' eV');
    set('spec-region', region);
    set('spec-series', series);
  }
  updateSpec();
  document.getElementById('spec-n1')?.addEventListener('input', updateSpec);
  document.getElementById('spec-n2')?.addEventListener('input', updateSpec);
}

export function destroy() {
  if (_state.loop) {
    _state.loop.stop();
    _state.loop = null;
  }
}
