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
            <td style="padding:.4rem .6rem;color:var(--text-muted)">−1</td>
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
        <p style="font-size:var(--text-sm)">Etanol: PE = +78 °C (LH). Éter metílico (dimetil éter): PE = −24 °C (sem LH entre moléculas do éter). Diferença de 102 °C — mesma fórmula molecular!</p>
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
        <br><strong style="color:var(--accent-electron)">Efeito indutivo (−I)</strong> — retirada por eletronegatividade ao longo da cadeia σ: halogênios são desativadores meta-leves apesar de orto/para-orientadores por +M.
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
