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
const EXERCISE = {
  question: 'O etanol (C₂H₅OH) pertence à função orgânica:',
  options:  ['Éster', 'Ácido carboxílico', 'Álcool', 'Aldeído'],
  correct:  2,
  explanation: 'O grupo funcional —OH (hidroxila) ligado a um carbono saturado caracteriza os álcoois. O etanol tem a estrutura CH₃—CH₂—OH, com a hidroxila no carbono terminal.',
};

/* -----------------------------------------------------------------------
   render()
----------------------------------------------------------------------- */

  const ISOMERS = [
    {
      title: 'Isomeria de cadeia — C₄H₁₀',
      desc: 'Mesma fórmula, diferente arranjo da cadeia carbônica.',
      items: [
        { name:'n-butano', struct:'CH₃–CH₂–CH₂–CH₃', bp:'−1°C', note:'cadeia normal (linear)' },
        { name:'isobutano', struct:'(CH₃)₃CH', bp:'−12°C', note:'cadeia ramificada; ponto de ebulição menor' },
      ]
    },
    {
      title: 'Isomeria de posição — C₄H₈ (alcenos)',
      desc: 'Mesma fórmula, posição diferente da dupla ligação.',
      items: [
        { name:'but-1-eno', struct:'CH₂=CH–CH₂–CH₃', bp:'−6°C', note:'dupla no C1' },
        { name:'but-2-eno', struct:'CH₃–CH=CH–CH₃',  bp:'+1°C', note:'dupla no C2' },
      ]
    },
    {
      title: 'Isomeria de função — C₂H₆O',
      desc: 'Mesma fórmula, grupos funcionais diferentes.',
      items: [
        { name:'etanol',         struct:'CH₃–CH₂–OH',   bp:'+78°C', note:'álcool; faz ligação de H' },
        { name:'éter metílico',  struct:'CH₃–O–CH₃',    bp:'−24°C', note:'éter; ponto de ebulição muito menor' },
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
        <p style="font-size:var(--text-sm)">Imagens especulares não-sobreponíveis. Propriedades físicas idênticas, mas rotação do plano de luz polarizada oposta: (+) dextrogiro, (−) levogiro. Farmacologia: talidomida R é sedativo, S é teratogênico.</p>
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
    <div id="isomer-tabs" style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
      <button class="btn btn-sm btn-secondary" id="iso-btn-0" data-iso="0">Cadeia (C₄H₁₀)</button>
      <button class="btn btn-sm btn-ghost"     id="iso-btn-1" data-iso="1">Posição (C₄H₈)</button>
      <button class="btn btn-sm btn-ghost"     id="iso-btn-2" data-iso="2">Função (C₂H₆O)</button>
      <button class="btn btn-sm btn-ghost"     id="iso-btn-3" data-iso="3">Geométrica (C₄H₈)</button>
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

  <!-- Exercício -->
  <section class="module-section">
    <h2 class="module-section-title">Exercício</h2>
    <p class="module-text">${esc(EXERCISE.question)}</p>
    <div id="exercise-opts" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">
      ${EXERCISE.options.map((opt, i) => `
        <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
                id="ex-opt-${i}" data-exopt="${i}">${esc(opt)}</button>
      `).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
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
export function destroy() {}
