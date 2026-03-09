/**
 * modules/quantum/index.js — Módulo: Mecânica Quântica
 * Lavoisier — Laboratório Visual de Química
 *
 * Cobre Graduação 1º/2º ano:
 *  - Postulados e equação de Schrödinger (conceitualmente)
 *  - Números quânticos n, l, mₗ, mₛ — significado e restrições
 *  - Orbitais atômicos reais: formas de s, p, d — canvas interativo
 *  - Função de onda ψ, densidade de probabilidade |ψ|²
 *  - Princípio da incerteza de Heisenberg
 *  - Teoria de Orbitais Moleculares (OM): σ, σ*, π, π*, HOMO/LUMO
 *  - Diagramas de OM para H₂, O₂, N₂, CO
 *  - Regras de preenchimento: Aufbau, Hund, exclusão de Pauli
 */

import { esc }               from '../../js/ui.js';
import { markSectionDone }   from '../../js/state.js';
import { SimLoop }           from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

// ---------------------------------------------------------------------------
// Dados — números quânticos
// ---------------------------------------------------------------------------

const QN_LEVELS = [
  {
    n: 1, shells: [
      { l: 0, ml: [0],          symbol: '1s', degen: 1, e_max: 2 },
    ],
  },
  {
    n: 2, shells: [
      { l: 0, ml: [0],           symbol: '2s', degen: 1, e_max: 2 },
      { l: 1, ml: [-1, 0, 1],    symbol: '2p', degen: 3, e_max: 6 },
    ],
  },
  {
    n: 3, shells: [
      { l: 0, ml: [0],                          symbol: '3s', degen: 1,  e_max: 2 },
      { l: 1, ml: [-1, 0, 1],                   symbol: '3p', degen: 3,  e_max: 6 },
      { l: 2, ml: [-2, -1, 0, 1, 2],            symbol: '3d', degen: 5,  e_max: 10 },
    ],
  },
  {
    n: 4, shells: [
      { l: 0, ml: [0],                           symbol: '4s', degen: 1,  e_max: 2 },
      { l: 1, ml: [-1, 0, 1],                    symbol: '4p', degen: 3,  e_max: 6 },
      { l: 2, ml: [-2, -1, 0, 1, 2],             symbol: '4d', degen: 5,  e_max: 10 },
      { l: 3, ml: [-3, -2, -1, 0, 1, 2, 3],      symbol: '4f', degen: 7,  e_max: 14 },
    ],
  },
];

const L_NAMES = ['s', 'p', 'd', 'f'];

// Orbitais reais — descritivos para cada forma
const ORBITAL_SHAPES = [
  {
    id: 's',
    name: 'Orbital s (l = 0)',
    color: '#4fc3f7',
    desc: 'Simetria esférica. |ψ|² máximo no núcleo para n=1; nó radial para n≥2. Único valor de mₗ = 0.',
    nodes: 'Nós radiais: n − l − 1 = n − 1 (para l=0). Nenhum nó angular.',
    draw: 'sphere',
  },
  {
    id: 'px',
    name: 'Orbital pₓ (l = 1)',
    color: '#ffd166',
    desc: 'Dois lobos ao longo do eixo x. Nó angular no plano yz. Combinação linear de mₗ = +1 e −1.',
    nodes: 'n − 2 nós radiais + 1 nó angular (plano nodal).',
    draw: 'px',
  },
  {
    id: 'dz2',
    name: 'Orbital d_z² (l = 2)',
    color: '#6bcb77',
    desc: 'Dois lobos ao longo do eixo z + um anel equatorial (toro). Característico de mₗ = 0.',
    nodes: '2 nós angulares (cones). Base dos complexos octaédricos (eixo de ligação).',
    draw: 'dz2',
  },
  {
    id: 'dxy',
    name: 'Orbital d_xy (l = 2)',
    color: '#ef476f',
    desc: 'Quatro lobos nos quadrantes do plano xy. mₗ = ±2 (combinação linear). Nos planos entre os eixos.',
    nodes: '2 nós angulares (planos xz e yz). Não aponta para ligantes em octaédrico.',
    draw: 'dxy',
  },
];

// Teoria de OM — diagramas
const MO_MOLECULES = [
  {
    id: 'H2', label: 'H₂',
    config: '(σ1s)²',
    bond_order: 1,
    magnetic: 'diamagnético',
    levels: [
      { label: 'σ*1s', type: 'antibonding', e: 0 },
      { label: 'σ1s',  type: 'bonding',     e: 2, fill: 2 },
    ],
    energy_gain: -458,  // kJ/mol
    desc: 'Ligação σ simples. Ambos elétrons no OM ligante → estabilização. BO = (2−0)/2 = 1.',
  },
  {
    id: 'He2', label: 'He₂',
    config: '(σ1s)²(σ*1s)²',
    bond_order: 0,
    magnetic: 'não existe',
    levels: [
      { label: 'σ*1s', type: 'antibonding', e: 2, fill: 2 },
      { label: 'σ1s',  type: 'bonding',     e: 2, fill: 2 },
    ],
    energy_gain: 0,
    desc: 'BO = (2−2)/2 = 0. Não existe como molécula estável — destabilizado pelo σ*1s preenchido.',
  },
  {
    id: 'O2', label: 'O₂',
    config: '(σ2s)²(σ*2s)²(σ2p)²(π2p)⁴(π*2p)²',
    bond_order: 2,
    magnetic: 'paramagnético (2 e⁻ desemparelhados)',
    levels: [
      { label: 'π*2p', type: 'antibonding', e: 2, fill: 2, degen: 2, singly: true },
      { label: 'π2p',  type: 'bonding',     e: 4, fill: 4, degen: 2 },
      { label: 'σ2p',  type: 'bonding',     e: 2, fill: 2 },
      { label: 'σ*2s', type: 'antibonding', e: 2, fill: 2 },
      { label: 'σ2s',  type: 'bonding',     e: 2, fill: 2 },
    ],
    energy_gain: -498,
    desc: 'DOIS elétrons no π*2p desemparelhados (Hund) → PARAMAGNÉTICO. BO = (8−4)/2 = 2. Explica por que O₂ adere a ímãs.',
  },
  {
    id: 'N2', label: 'N₂',
    config: '(σ2s)²(σ*2s)²(π2p)⁴(σ2p)²',
    bond_order: 3,
    magnetic: 'diamagnético',
    levels: [
      { label: 'π*2p', type: 'antibonding', e: 0, fill: 0, degen: 2 },
      { label: 'σ2p',  type: 'bonding',     e: 2, fill: 2 },
      { label: 'π2p',  type: 'bonding',     e: 4, fill: 4, degen: 2 },
      { label: 'σ*2s', type: 'antibonding', e: 2, fill: 2 },
      { label: 'σ2s',  type: 'bonding',     e: 2, fill: 2 },
    ],
    energy_gain: -945,
    desc: 'Tripla ligação mais forte da química comum (BO=3). Diamagnético. HOMO = σ2p, LUMO = π*2p.',
  },
  {
    id: 'CO', label: 'CO',
    config: '(σ2s)²(σ*2s)²(π2p)⁴(σ2p)²',
    bond_order: 3,
    magnetic: 'diamagnético (isoelectrônico com N₂)',
    levels: [
      { label: 'π*2p', type: 'antibonding', e: 0, fill: 0, degen: 2 },
      { label: 'σ2p (HOMO)', type: 'bonding', e: 2, fill: 2, homo: true },
      { label: 'π2p',  type: 'bonding',     e: 4, fill: 4, degen: 2 },
      { label: 'σ*2s', type: 'antibonding', e: 2, fill: 2 },
      { label: 'σ2s',  type: 'bonding',     e: 2, fill: 2 },
    ],
    energy_gain: -1072,
    desc: 'Isoeletrônico com N₂ (10 e⁻). Ligação tripla. HOMO localizado no C → doa par para metais de transição (carbonil metálico). Extremamente tóxico.',
  },
];

// Exercícios
const EXERCISES = [
  {
    q: 'Qual é o número máximo de elétrons no nível n = 3?',
    opts: ['8', '10', '18', '32'],
    ans: 2,
    exp: 'Para n = 3: subcamadas 3s (2e), 3p (6e), 3d (10e). Total = 2 + 6 + 10 = 18. Fórmula geral: 2n².',
    hint: 'Some as capacidades de todas as subcamadas: 3s + 3p + 3d. Ou use 2n².',
  },
  {
    q: 'O O₂ é paramagnético porque, pela teoria de OM:',
    opts: [
      'Tem ligação dupla instável',
      'Seus orbitais π*2p têm 2 elétrons desemparelhados (Regra de Hund)',
      'O número de OM ligantes é menor que os antibligantes',
      'O HOMO é um orbital σ',
    ],
    ans: 1,
    exp: 'Os dois últimos elétrons ocupam os dois orbitais π*2p degenerados com spins paralelos (Regra de Hund). Elétrons desemparelhados criam momento magnético permanente → paramagnetismo. Isso foi comprovado experimentalmente antes da teoria de OM.',
    hint: 'Lembre que orbitais degenerados são preenchidos individualmente antes de emparelhar (Hund).',
  },
  {
    q: 'Para um elétron com n=3, l=2, quais os valores permitidos de mₗ?',
    opts: [
      '0, 1, 2',
      '−2, −1, 0, +1, +2',
      '−3, −2, −1, 0, +1, +2, +3',
      '−1, 0, +1',
    ],
    ans: 1,
    exp: 'Para l=2 (subcamada d): mₗ varia de −l a +l, portanto −2, −1, 0, +1, +2. São 5 orbitais d com a mesma energia num átomo isolado (degenerescência removida por campos externos ou ligantes).',
    hint: 'mₗ vai de −l até +l em passos de 1. Com l=2, quantos valores isso gera?',
  },
];

let _loop       = null;
let _orbIdx     = 0;
let _moIdx      = 0;
let _exIdx      = 0;
let _exAttempts = 0;
let _exDone     = false;
let _animTheta  = 0;

// ---------------------------------------------------------------------------
export function render(outlet) {
  if (_loop) { _loop.stop(); _loop = null; }
  _orbIdx = 0; _moIdx = 0;
  _exIdx = 0; _exAttempts = 0; _exDone = false; _animTheta = 0;

  outlet.innerHTML = _buildHTML();
  _initQuantum();
  _initRadialCanvas();
  markSectionDone('quantum', 'visited');
}

// ---------------------------------------------------------------------------
function _buildHTML() {
  return `
<div class="module-page" id="module-quantum">
  <button class="module-back btn-ghost" data-nav="/modules">&#8592; Módulos</button>

  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
           stroke-width="1.8" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
        <path d="M12 8v4l3 3" stroke-linecap="round"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Mecânica Quântica</h1>
      <p class="module-subtitle">Schrödinger, orbitais atômicos, números quânticos e teoria de orbitais moleculares.</p>
    </div>
  </header>

  <!-- ============================================================
       EQUAÇÃO DE SCHRÖDINGER
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Equação de Schrödinger</h2>
    <p class="module-text">
      Em 1926, Erwin Schrödinger propôs uma equação de onda para o elétron no átomo.
      A solução fornece a <strong>função de onda ψ</strong> — uma entidade matemática cujo
      quadrado, |ψ|², representa a <strong>densidade de probabilidade</strong> de encontrar
      o elétron em cada ponto do espaço.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-base);color:var(--accent-electron);margin-bottom:.5rem;letter-spacing:.02em">
        Ĥψ = Eψ
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Ĥ = operador Hamiltoniano (energia cinética + potencial coulombiana)<br>
        ψ = função de onda (solução — os orbitais)<br>
        E = autovalor de energia (quantizada: E<sub>n</sub> = −13,6/n² eV para H)
      </p>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Interpretação de Born</h3>
        <p style="font-size:var(--text-sm)">|ψ(r)|² dV = probabilidade de encontrar o elétron no volume dV em torno do ponto r. O elétron não tem trajetória definida — apenas distribuição de probabilidade.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Incerteza de Heisenberg</h3>
        <p style="font-size:var(--text-sm)">Δx · Δp ≥ ℏ/2. É impossível conhecer simultaneamente posição e momento com precisão arbitrária. <em>Não é</em> imprecisão do instrumento — é propriedade fundamental da matéria.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Quantização</h3>
        <p style="font-size:var(--text-sm)">As soluções da equação de Schrödinger só existem para valores específicos de E. Por isso a energia é quantizada: E<sub>n</sub> = −13,6/n² eV para o hidrogênio.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Nós</h3>
        <p style="font-size:var(--text-sm)">Regiões onde ψ = 0 (probabilidade nula). Nós <strong>radiais</strong>: esferas onde |ψ|² = 0; quantidade = n − l − 1. Nós <strong>angulares</strong>: planos/cones; quantidade = l.</p>
      </div>
    </div>
  </section>

  <!-- ============================================================
       NÚMEROS QUÂNTICOS
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Números quânticos</h2>
    <p class="module-text">
      Cada orbital é completamente descrito por três números quânticos.
      Um quarto número quântico (spin) descreve o elétron dentro do orbital.
    </p>
    <div style="overflow-x:auto;margin-bottom:var(--space-5)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.5rem .6rem;border-bottom:1px solid var(--border-default)">Símbolo</th>
            <th style="text-align:left;padding:.5rem .6rem;border-bottom:1px solid var(--border-default)">Nome</th>
            <th style="text-align:left;padding:.5rem .6rem;border-bottom:1px solid var(--border-default)">Valores</th>
            <th style="text-align:left;padding:.5rem .6rem;border-bottom:1px solid var(--border-default)">Determina</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.5rem .6rem;font-family:monospace;font-size:var(--text-lg);color:var(--accent-electron)">n</td>
            <td style="padding:.5rem .6rem;font-weight:600">Principal</td>
            <td style="padding:.5rem .6rem;font-family:monospace;font-size:var(--text-xs)">1, 2, 3, 4, …</td>
            <td style="padding:.5rem .6rem;font-size:var(--text-xs);color:var(--text-secondary)">Nível de energia e tamanho do orbital. E<sub>n</sub> ∝ −1/n²</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.5rem .6rem;font-family:monospace;font-size:var(--text-lg);color:var(--accent-bond)">l</td>
            <td style="padding:.5rem .6rem;font-weight:600">Azimutal (angular)</td>
            <td style="padding:.5rem .6rem;font-family:monospace;font-size:var(--text-xs)">0 a n−1<br>0=s, 1=p, 2=d, 3=f</td>
            <td style="padding:.5rem .6rem;font-size:var(--text-xs);color:var(--text-secondary)">Forma do orbital e momento angular (L = ℏ√l(l+1))</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.5rem .6rem;font-family:monospace;font-size:var(--text-lg);color:var(--accent-organic)">m<sub>l</sub></td>
            <td style="padding:.5rem .6rem;font-weight:600">Magnético</td>
            <td style="padding:.5rem .6rem;font-family:monospace;font-size:var(--text-xs)">−l, …, 0, …, +l<br>(2l+1 valores)</td>
            <td style="padding:.5rem .6rem;font-size:var(--text-xs);color:var(--text-secondary)">Orientação espacial do orbital. Degenerado sem campo externo.</td>
          </tr>
          <tr>
            <td style="padding:.5rem .6rem;font-family:monospace;font-size:var(--text-lg);color:var(--accent-reaction)">m<sub>s</sub></td>
            <td style="padding:.5rem .6rem;font-weight:600">Spin</td>
            <td style="padding:.5rem .6rem;font-family:monospace;font-size:var(--text-xs)">+½ (↑) ou −½ (↓)</td>
            <td style="padding:.5rem .6rem;font-size:var(--text-xs);color:var(--text-secondary)">Spin intrínseco do elétron. Exclusão de Pauli: dois e⁻ no mesmo orbital devem ter spins opostos.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Diagrama de subcamadas
    </h3>
    <div style="overflow-x:auto">
      <table style="border-collapse:collapse;font-size:var(--text-xs)">
        <thead>
          <tr style="color:var(--text-muted)">
            <th style="padding:.3rem .6rem;text-align:left;border-bottom:1px solid var(--border-default)">n</th>
            <th style="padding:.3rem .6rem;text-align:left;border-bottom:1px solid var(--border-default)">l</th>
            <th style="padding:.3rem .6rem;text-align:left;border-bottom:1px solid var(--border-default)">Subcamada</th>
            <th style="padding:.3rem .6rem;text-align:left;border-bottom:1px solid var(--border-default)">Orbitais (2l+1)</th>
            <th style="padding:.3rem .6rem;text-align:left;border-bottom:1px solid var(--border-default)">e⁻ max</th>
          </tr>
        </thead>
        <tbody>
          ${QN_LEVELS.flatMap(lv => lv.shells.map(sh => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.3rem .6rem;font-family:monospace;color:var(--accent-electron)">${lv.n}</td>
            <td style="padding:.3rem .6rem;font-family:monospace;color:var(--accent-bond)">${sh.l}</td>
            <td style="padding:.3rem .6rem;font-family:monospace;font-weight:600;color:var(--text-primary)">${esc(sh.symbol)}</td>
            <td style="padding:.3rem .6rem;color:var(--text-secondary)">${sh.ml.join(', ')}</td>
            <td style="padding:.3rem .6rem;color:var(--accent-organic)">${sh.e_max}</td>
          </tr>`)).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- ============================================================
       FORMAS DOS ORBITAIS — CANVAS
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Formas dos orbitais — |ψ|²</h2>
    <p class="module-text">
      A forma do orbital representa a superfície de isoprobabilidade que contém 90% da
      densidade eletrônica. Cada tipo tem geometria distinta que determina a direcionalidade
      das ligações químicas.
    </p>
    <div id="orb-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:var(--space-4)">
      ${ORBITAL_SHAPES.map((o, i) => `
        <button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="orb-tab-${i}" data-orb="${i}">
          ${esc(o.id)}</button>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:var(--space-5);align-items:start;flex-wrap:wrap">
      <div class="canvas-frame" id="orb-frame" style="min-height:200px;min-width:200px">
        <canvas id="orb-canvas" width="200" height="200" aria-label="Forma do orbital"></canvas>
      </div>
      <div id="orb-info" class="info-card" style="background:var(--bg-raised)"></div>
    </div>
  </section>

  <!-- ============================================================
       REGRAS DE PREENCHIMENTO
  ============================================================ -->
  <!-- Funções de onda radiais -->
  <section class="module-section">
    <h2 class="module-section-title">Funções de onda radiais ψ_nlm e densidade de probabilidade</h2>
    <p class="module-text">
      A função de onda completa de um elétron no átomo de H é separável em parte radial e angular:
      <strong>ψ_nlm(r,θ,φ) = R_nl(r) · Y_lm(θ,φ)</strong>.
      A densidade de probabilidade radial P(r) = r²·|R_nl(r)|² dá a probabilidade de
      encontrar o elétron entre r e r+dr em qualquer direção.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        ψ_nlm = R_nl(r) · Y_lm(θ,φ) &nbsp;&nbsp;|&nbsp;&nbsp; P(r) = r² · |R_nl(r)|²
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        n = número quântico principal (n = 1, 2, 3…) — nível de energia.<br>
        l = número quântico angular (0 ≤ l &lt; n) — s(0), p(1), d(2), f(3).<br>
        m_l = número quântico magnético (−l ≤ m_l ≤ +l) — orientação.<br>
        Nós radiais = n − l − 1. Nós angulares = l. Nós totais = n − 1.
      </p>
    </div>

    <!-- Tabela de R_nl -->
    <div style="overflow-x:auto;margin-bottom:var(--space-5)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Orbital</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">n, l</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">R_nl(r) simplificada (a₀ = raio de Bohr)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Nós radiais</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">r_máx P(r) (a₀)</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['1s','n=1, l=0','2·e^(−r/a₀)',                                '0','1,0'],
            ['2s','n=2, l=0','(2 − r/a₀)·e^(−r/2a₀)',                      '1','5,2'],
            ['2p','n=2, l=1','(r/a₀)·e^(−r/2a₀)',                           '0','4,0'],
            ['3s','n=3, l=0','(27 − 18r/a₀ + 2(r/a₀)²)·e^(−r/3a₀)',       '2','13,1'],
            ['3p','n=3, l=1','(6r/a₀ − (r/a₀)²)·e^(−r/3a₀)',               '1','12,0'],
            ['3d','n=3, l=2','(r/a₀)²·e^(−r/3a₀)',                          '0','9,0'],
            ['4s','n=4, l=0','polinômio grau 3 × e^(−r/4a₀)',               '3','~24'],
            ['4f','n=4, l=3','(r/a₀)³·e^(−r/4a₀)',                          '0','~16'],
          ].map(_r => { const [orb,nl,rnl,nos,rm]=_r; return `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;font-weight:700;color:var(--accent-electron)">${orb}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs)">${nl}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs);color:var(--accent-bond)">${rnl}</td>
            <td style="padding:.4rem .6rem;color:var(--accent-reaction);font-weight:700">${nos}</td>
            <td style="padding:.4rem .6rem;color:var(--text-muted)">${rm}</td>
          </tr>`; }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Canvas: P(r) radial para 1s, 2s, 2p, 3s, 3p, 3d -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Distribuição de probabilidade radial P(r) = r²|R_nl|²
    </h3>
    <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:var(--space-3)" id="radial-btns">
      ${['1s','2s','2p','3s','3p','3d'].map((o,i)=>`<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" data-radial="${o}">${o}</button>`).join('')}
    </div>
    <div class="canvas-frame" id="radial-frame" style="min-height:180px">
      <canvas id="radial-canvas" aria-label="Distribuição radial de probabilidade"></canvas>
    </div>
    <p id="radial-desc" class="module-text" style="margin-top:var(--space-3);font-size:var(--text-sm)"></p>
  </section>


  <section class="module-section">
    <h2 class="module-section-title">Regras de preenchimento eletrônico</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Princípio de Aufbau</h3>
        <p style="font-size:var(--text-sm)">Elétrons ocupam os orbitais de menor energia disponível. Ordem: 1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p, 5s, 4d, 5p… O 4s preenche antes do 3d porque sua energia média é menor no átomo multieletrônico.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Princípio de exclusão de Pauli</h3>
        <p style="font-size:var(--text-sm)">Dois elétrons no mesmo átomo não podem ter os quatro números quânticos idênticos. Portanto cada orbital comporta no máximo 2 elétrons com spins opostos (↑↓).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Regra de Hund</h3>
        <p style="font-size:var(--text-sm)">Orbitais degenerados (mesma energia) são preenchidos com um elétron cada antes de emparelhar. O estado de maior multiplicidade de spin é o mais estável (repulsão eletrônica minimizada).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Exceções notáveis</h3>
        <p style="font-size:var(--text-sm)">Cr: [Ar]3d⁵4s¹ (não 3d⁴4s²) — metade preenchida é estável. Cu: [Ar]3d¹⁰4s¹ (não 3d⁹4s²) — d completo é estável. Causado por pequena diferença de energia 3d/4s.</p>
      </div>
    </div>
  </section>

  <!-- ============================================================
       TEORIA DE ORBITAIS MOLECULARES
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Teoria de Orbitais Moleculares (TOM)</h2>
    <p class="module-text">
      Na TOM, orbitais atômicos se combinam (LCAO — combinação linear de orbitais atômicos)
      para formar <strong>orbitais moleculares</strong> que se estendem por toda a molécula.
      A combinação de 2 OA cria 2 OM: um <strong>ligante</strong> (energia menor, acúmulo de
      densidade entre os núcleos) e um <strong>antiligante</strong> (energia maior, nó entre
      os núcleos, denotado com *).
    </p>
    <p class="module-text">
      <strong>Ordem de ligação (OL) = (e⁻ ligantes − e⁻ antiligantes) / 2.</strong>
      OL &gt; 0 → molécula estável. OL = 0 → não existe. OL fracionária → radical.
    </p>

    <div id="mo-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:var(--space-4)">
      ${MO_MOLECULES.map((m, i) => `
        <button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="mo-tab-${i}" data-mo="${i}">
          ${esc(m.label)}</button>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:var(--space-5);align-items:start">
      <canvas id="mo-canvas" width="200" height="300"
              style="border-radius:var(--radius-md);background:var(--bg-raised)"
              aria-label="Diagrama de OM"></canvas>
      <div id="mo-info" class="info-card" style="background:var(--bg-raised)"></div>
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
function _initQuantum() {
  _initOrbitalCanvas();
  _initMODiagram();
  _initExercises();
}

// --- Orbital canvas ---
function _drawOrbital(ctx, W, H, shape, color, t) {
  const cx = W / 2, cy = H / 2;
  ctx.save();
  if (shape === 'sphere') {
    // s orbital — concentric fading circles (radial probability)
    for (let r = W * 0.35; r > 4; r -= 8) {
      const alpha = 0.08 + 0.4 * (1 - r / (W * 0.36));
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
    }
    // Animated electron dot
    const R = W * 0.2;
    const ex = cx + R * Math.cos(t * 0.7);
    const ey = cy + R * Math.sin(t * 0.7) * 0.5;
    ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
  } else if (shape === 'px') {
    // p orbital — two lobes along x
    const lobe = (sign) => {
      ctx.beginPath();
      ctx.ellipse(cx + sign * W * 0.22, cy, W * 0.2, H * 0.1, 0, 0, Math.PI * 2);
      const alpha = 0.6 + 0.2 * Math.abs(Math.cos(t * 0.5));
      ctx.fillStyle = sign > 0 ? color + 'aa' : '#ef476faa';
      ctx.fill();
      ctx.strokeStyle = sign > 0 ? color : '#ef476f';
      ctx.lineWidth = 1; ctx.stroke();
    };
    lobe(1); lobe(-1);
    // Node plane
    ctx.beginPath(); ctx.moveTo(cx, cy - H * 0.4); ctx.lineTo(cx, cy + H * 0.4);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('+', cx + W * 0.22, cy + 4); ctx.fillText('−', cx - W * 0.22, cy + 4);
  } else if (shape === 'dz2') {
    // d_z² — two lobes along z + torus in xy
    ctx.beginPath();
    ctx.ellipse(cx, cy - H * 0.22, W * 0.09, H * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = color + 'aa'; ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + H * 0.22, W * 0.09, H * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = color + 'aa'; ctx.fill();
    // Torus (ring) — approximate as thick ellipse
    ctx.beginPath();
    ctx.ellipse(cx, cy, W * 0.32, H * 0.08, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('+', cx, cy - H * 0.22 + 4); ctx.fillText('+', cx, cy + H * 0.22 + 4);
    ctx.fillStyle = '#ef476f90'; ctx.fillText('−', cx + W * 0.32, cy + 4);
  } else if (shape === 'dxy') {
    // d_xy — four lobes in quadrants
    const positions = [[1,1],[−1,1],[1,−1],[−1,−1]];
    positions.forEach(([sx, sy], i) => {
      ctx.beginPath();
      ctx.ellipse(cx + sx * W * 0.2, cy + sy * H * 0.2, W * 0.15, H * 0.15,
                  Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = (i % 2 === 0) ? color + '99' : '#ef476f99';
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('+', cx + W*0.2, cy - H*0.2 + 4);
    ctx.fillText('−', cx - W*0.2, cy - H*0.2 + 4);
    ctx.fillText('−', cx + W*0.2, cy + H*0.2 + 4);
    ctx.fillText('+', cx - W*0.2, cy + H*0.2 + 4);
  }
  ctx.restore();
}

function _initOrbitalCanvas() {
  function renderOrb(idx) {
    const o  = ORBITAL_SHAPES[idx];
    const el = document.getElementById('orb-info');
    if (el) el.innerHTML = `
      <div style="margin-bottom:.5rem">
        <span style="font-size:var(--text-base);font-weight:700;color:${o.color}">${esc(o.name)}</span>
      </div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:.4rem">${esc(o.desc)}</p>
      <p style="font-size:var(--text-xs);color:var(--text-muted)">${esc(o.nodes)}</p>`;
    ORBITAL_SHAPES.forEach((_, j) => {
      const b = document.getElementById('orb-tab-' + j);
      if (b) b.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
    });
  }
  renderOrb(0);
  ORBITAL_SHAPES.forEach((_, i) => {
    document.getElementById('orb-tab-' + i)?.addEventListener('click', () => {
      _orbIdx = i;
      renderOrb(i);
    });
  });

  const canvas = document.getElementById('orb-canvas');
  if (!canvas) return;
  const W = 200, H = 200;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  _loop = new SimLoop(() => {
    _animTheta += 0.025;
    clearCanvas(ctx, W, H);
    const o = ORBITAL_SHAPES[_orbIdx];
    _drawOrbital(ctx, W, H, o.draw, o.color, _animTheta);
  });
  _loop.start();
}

// --- MO Diagram canvas ---
function _drawMODiagram(ctx, W, H, mol) {
  clearCanvas(ctx, W, H);
  const cx = W / 2;
  // Energy axis label
  ctx.fillStyle = COLOR.textMuted; ctx.font = '9px sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('Energia', cx, 14);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, 20); ctx.lineTo(cx, H - 20); ctx.stroke();

  const levels = mol.levels;
  const N = levels.length;
  const step = (H - 60) / (N + 1);

  levels.forEach((lv, i) => {
    const y = H - 30 - step * (i + 0.8);
    const isAnti = lv.type === 'antibonding';
    const color = isAnti ? COLOR.reaction : COLOR.organic;
    const x1 = cx - 50, x2 = cx + 50;

    // Level line
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.setLineDash(isAnti ? [4, 3] : []);
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = color; ctx.font = '9px monospace'; ctx.textAlign = 'left';
    ctx.fillText(lv.label + (lv.homo ? ' ←HOMO' : ''), x2 + 4, y + 3);

    // Electrons
    const fill = lv.fill || 0;
    if (fill > 0) {
      const singly = lv.singly;
      const degen  = lv.degen || 1;
      let placed = 0;
      for (let d = 0; d < degen && placed < fill; d++) {
        const ox = cx - 18 + d * 18;
        // first electron (always up)
        ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('↑', ox, y - 3);
        placed++;
        // second electron — only if not singly filled
        if (!singly && placed < fill) {
          ctx.fillText('↓', ox + 6, y - 3);
          placed++;
        }
      }
    }
  });
}

function _initMODiagram() {
  const canvas = document.getElementById('mo-canvas');
  const W = 200, H = 300;
  if (canvas) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    function renderMO(idx) {
      const mol = MO_MOLECULES[idx];
      _drawMODiagram(ctx, W, H, mol);
      const info = document.getElementById('mo-info');
      if (info) info.innerHTML = `
        <div style="margin-bottom:.5rem;display:flex;flex-wrap:wrap;gap:.5rem;align-items:baseline">
          <span style="font-size:var(--text-lg);font-weight:700;color:var(--accent-electron)">${esc(mol.label)}</span>
          <span style="font-size:var(--text-xs);font-family:monospace;color:var(--text-muted)">${esc(mol.config)}</span>
        </div>
        <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:.5rem">
          <span style="font-size:var(--text-sm)">OL = <strong style="color:var(--accent-organic)">${mol.bond_order}</strong></span>
          <span style="font-size:var(--text-sm);color:var(--text-muted)">${esc(mol.magnetic)}</span>
          ${mol.energy_gain ? `<span style="font-size:var(--text-xs);color:var(--text-muted)">ΔH = ${mol.energy_gain} kJ/mol</span>` : ''}
        </div>
        <p style="font-size:var(--text-sm);color:var(--text-secondary)">${esc(mol.desc)}</p>`;
      MO_MOLECULES.forEach((_, j) => {
        const b = document.getElementById('mo-tab-' + j);
        if (b) b.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
      });
    }
    renderMO(0);
    MO_MOLECULES.forEach((_, i) => {
      document.getElementById('mo-tab-' + i)?.addEventListener('click', () => renderMO(i));
    });
  }
}

// --- Exercises ---
function _initExercises() {
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
          markSectionDone('quantum', 'exercise');
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

// ---------------------------------------------------------------------------
// Funções de onda radiais: R_nl(ρ) onde ρ = r/a₀
// Normalizadas de forma relativa para exibição; nós corretos.
// ---------------------------------------------------------------------------

const RADIAL_DATA = {
  '1s': {
    fn: rho => Math.exp(-rho),
    nos: 0, rmax: 30,
    desc: '1s: sem nós radiais. Máximo de P(r) em r = 1 a₀ (raio de Bohr). Decai exponencialmente.',
  },
  '2s': {
    fn: rho => (2 - rho) * Math.exp(-rho/2),
    nos: 1, rmax: 25,
    desc: '2s: 1 nó radial em r = 2 a₀ (onde R₂s = 0). Dois máximos de P(r): perto do núcleo e o principal em ~5 a₀.',
  },
  '2p': {
    fn: rho => rho * Math.exp(-rho/2),
    nos: 0, rmax: 25,
    desc: '2p: 0 nós radiais, 1 nó angular (no plano). Máximo de P(r) em ~4 a₀.',
  },
  '3s': {
    fn: rho => (27 - 18*rho + 2*rho*rho) * Math.exp(-rho/3),
    nos: 2, rmax: 40,
    desc: '3s: 2 nós radiais. Três máximos de P(r). Maior extensão radial (~13 a₀ principal).',
  },
  '3p': {
    fn: rho => rho*(6 - rho)*Math.exp(-rho/3),
    nos: 1, rmax: 40,
    desc: '3p: 1 nó radial (em r=6 a₀). Dois máximos. Nó angular: 1 plano.',
  },
  '3d': {
    fn: rho => rho*rho*Math.exp(-rho/3),
    nos: 0, rmax: 35,
    desc: '3d: 0 nós radiais. Um único máximo largo de P(r) em ~9 a₀. 2 nós angulares.',
  },
};

function _initRadialCanvas() {
  const frame  = document.getElementById('radial-frame');
  const canvas = document.getElementById('radial-canvas');
  if (!canvas || !frame) return;

  const W = Math.min(frame.clientWidth || 560, 560);
  const H = 180;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  let _active = '1s';

  function drawRadial(key) {
    const d     = RADIAL_DATA[key];
    if (!d) return;
    const pad   = { l: 40, r: 15, t: 10, b: 30 };
    const iW    = W - pad.l - pad.r;
    const iH    = H - pad.t - pad.b;
    const steps = 400;
    const rmax  = d.rmax;

    // Calcular P(r) = r²·|R|²
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const rho = (i / steps) * rmax;
      const R   = d.fn(rho);
      const P   = rho * rho * R * R;
      pts.push(P);
    }
    const Pmax = Math.max(...pts);

    // Fundo
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Eixos
    ctx.strokeStyle = 'rgba(200,200,200,0.2)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + iH);
    ctx.lineTo(pad.l + iW, pad.t + iH);
    ctx.stroke();

    // Labels eixo x
    ctx.fillStyle = 'rgba(200,200,200,0.45)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    [0, 5, 10, 15, 20, 25, 30].filter(v => v <= rmax).forEach(v => {
      const x = pad.l + (v / rmax) * iW;
      ctx.fillText(v, x, pad.t + iH + 14);
    });
    ctx.fillStyle = 'rgba(200,200,200,0.4)';
    ctx.textAlign = 'left';
    ctx.fillText('r / a₀', pad.l + iW - 10, pad.t + iH + 24);

    // P(r) label
    ctx.save();
    ctx.translate(12, pad.t + iH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(200,200,200,0.4)';
    ctx.font = '9px sans-serif';
    ctx.fillText('P(r)', 0, 0);
    ctx.restore();

    // Linha P(r)
    ctx.beginPath();
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth   = 2;
    for (let i = 0; i <= steps; i++) {
      const x = pad.l + (i / steps) * iW;
      const y = pad.t + iH - (pts[i] / (Pmax || 1)) * iH * 0.9;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Nós: pontos onde R = 0 (muda de sinal) — marca em vermelho
    ctx.strokeStyle = 'rgba(239,71,111,0.6)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4,3]);
    for (let i = 1; i <= steps; i++) {
      const r0 = ((i-1)/steps)*rmax, r1 = (i/steps)*rmax;
      const R0 = d.fn(r0), R1 = d.fn(r1);
      if (R0 * R1 < 0) { // mudança de sinal → nó
        const rNode = r0 - R0 * (r1-r0) / (R1-R0);
        const xN    = pad.l + (rNode / rmax) * iW;
        ctx.beginPath(); ctx.moveTo(xN, pad.t); ctx.lineTo(xN, pad.t+iH); ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // Label orbital
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font      = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(key, pad.l + 6, pad.t + 18);

    // Nós count
    ctx.fillStyle = 'rgba(239,71,111,0.7)';
    ctx.font      = '10px sans-serif';
    ctx.fillText('nós radiais: ' + d.nos, pad.l + 6, pad.t + 32);
  }

  function activate(key) {
    _active = key;
    document.querySelectorAll('#radial-btns [data-radial]').forEach(b => {
      b.className = 'btn btn-xs ' + (b.dataset.radial === key ? 'btn-secondary' : 'btn-ghost');
    });
    drawRadial(key);
    const desc = document.getElementById('radial-desc');
    if (desc) desc.textContent = RADIAL_DATA[key]?.desc || '';
  }

  document.querySelectorAll('#radial-btns [data-radial]').forEach(btn => {
    btn.addEventListener('click', () => activate(btn.dataset.radial));
  });

  activate(_active);
}

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
}
