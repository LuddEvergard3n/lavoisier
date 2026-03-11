/**
 * modules/symmetry/index.js — Módulo: Simetria Molecular e Teoria de Grupos
 * Lavoisier — Laboratório Visual de Química
 *
 * Cobre Química Inorgânica 3º-4º semestre:
 *  - Elementos de simetria: E, Cn, σ, i, Sn
 *  - Operações de simetria e sua aplicação
 *  - Grupos pontuais: C1, Cs, Ci, Cnv, Cnh, Dn, Dnh, Dnd, Td, Oh, Ih
 *  - Identificação sistemática de grupo pontual (fluxograma)
 *  - Tabelas de caracteres: representações irredutíveis, funções de base
 *  - Produto direto e regras de seleção (IV e Raman)
 *  - Simetria de orbitais e TOM: combinação de orbitais por simetria
 *  - Canvas: visualização de elementos de simetria em moléculas 2D
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

const POINT_GROUPS = [
  {
    id: 'C1',
    name: 'C₁',
    elements: 'E',
    order: 1,
    examples: ['CHFClBr', 'proteína quiralgenérica'],
    desc: 'Sem simetria. Apenas identidade. Moléculas sem nenhum elemento de simetria. Todas as representações são A (não-degeneradas).',
    IRaman: 'IV e Raman ativos para todos os modos.',
  },
  {
    id: 'Cs',
    name: 'Cₛ',
    elements: 'E, σ',
    order: 2,
    examples: ['H₂O₂ (planar)', 'SOCl₂', 'CHFCl₂ plano'],
    desc: 'Apenas um plano de simetria σ. Representações: A\' (simétrica em σ) e A\'\' (antissimétrica).',
    IRaman: 'A\': IV e Raman ativos. A\'\': IV e Raman ativos.',
  },
  {
    id: 'Ci',
    name: 'Cᵢ',
    elements: 'E, i',
    order: 2,
    examples: ['anti-1,2-dicloroetano', 'ácido meso-tartárico'],
    desc: 'Apenas centro de inversão i. Ag: apenas Raman; Au: apenas IV. Regra de exclusão mútua.',
    IRaman: 'Ag: apenas Raman. Au: apenas IV. Exclusão mútua total.',
  },
  {
    id: 'C2v',
    name: 'C₂ᵥ',
    elements: 'E, C₂, σᵥ, σᵥ\'',
    order: 4,
    examples: ['H₂O', 'SO₂', 'H₂CO', 'NO₂', 'cis-CHCl=CHCl'],
    desc: 'Eixo C₂ + dois planos verticais. O mais comum em moléculas simples não-lineares. 4 representações irredutíveis: A₁, A₂, B₁, B₂.',
    IRaman: 'A₁, B₁, B₂: IV e Raman ativos. A₂: apenas Raman.',
  },
  {
    id: 'C3v',
    name: 'C₃ᵥ',
    elements: 'E, 2C₃, 3σᵥ',
    order: 6,
    examples: ['NH₃', 'PCl₃', 'CHCl₃', 'POCl₃'],
    desc: 'Eixo C₃ + três planos verticais. 3 representações: A₁, A₂, E (duplamente degenerada).',
    IRaman: 'A₁ e E: IV e Raman ativos. A₂: inativo em ambos.',
  },
  {
    id: 'D2h',
    name: 'D₂h',
    elements: 'E, C₂(z), C₂(y), C₂(x), i, σ(xy), σ(xz), σ(yz)',
    order: 8,
    examples: ['C₂H₄ (etileno)', 'N₂O₄', 'C₆H₆? Não — é D₆h', 'naftaleno'],
    desc: 'Três eixos C₂ perpendiculares + três planos + centro de inversão. Regra de exclusão mútua: nenhum modo é IV e Raman ativo simultaneamente.',
    IRaman: 'Exclusão mútua: modos IV-ativos (B₁u, B₂u, B₃u) ≠ modos Raman-ativos (Ag, B₁g, B₂g, B₃g).',
  },
  {
    id: 'C2h',
    name: 'C₂h',
    elements: 'E, C₂, i, σh',
    order: 4,
    examples: ['trans-but-2-eno', 'trans-N₂H₂', 'ácido trans-2-butenodioico (fumárico)'],
    desc: 'Eixo C₂ + plano horizontal + centro de inversão. Exclusão mútua. Ag/Bg: Raman. Au/Bu: IV.',
    IRaman: 'Ag e Bg: apenas Raman. Au e Bu: apenas IV. Exclusão mútua.',
  },
  {
    id: 'Td',
    name: 'Td',
    elements: 'E, 8C₃, 3C₂, 6S₄, 6σd',
    order: 24,
    examples: ['CH₄', 'CCl₄', 'SiH₄', 'NH₄⁺', 'P₄'],
    desc: 'Tetraedro regular. 5 representações: A₁, A₂, E, T₁, T₂. Alta degenerescência. Sem centro de inversão: IV e Raman podem coincidir.',
    IRaman: 'T₂: IV e Raman ativos. A₁ e E: apenas Raman. A₂ e T₁: inativos.',
  },
  {
    id: 'Oh',
    name: 'Oh',
    elements: 'E, 8C₃, 6C₂, 6C₄, 3C₂, i, 6S₄, 8S₆, 3σh, 6σd',
    order: 48,
    examples: ['SF₆', '[Co(NH₃)₆]³⁺', 'Fe(CO)₆', 'UF₆', 'cristal de NaCl'],
    desc: 'Octaedro regular — grupo de maior ordem em inorgânica. Centro de inversão: exclusão mútua total. 10 representações: A₁g, A₂g, Eg, T₁g, T₂g, A₁u, A₂u, Eu, T₁u, T₂u.',
    IRaman: 'T₁u: apenas IV. A₁g, Eg, T₂g: apenas Raman. Exclusão mútua rigorosa.',
  },
  {
    id: 'D3h',
    name: 'D₃h',
    elements: 'E, 2C₃, 3C₂, σh, 2S₃, 3σᵥ',
    order: 12,
    examples: ['BF₃', 'PCl₅', 'CO₃²⁻', 'NO₃⁻', 'SO₃'],
    desc: 'Plano trigonal com C₃ perpendicular. Sem centro de inversão (diferente de D₃d). 6 representações: A₁\', A₂\', E\', A₁\'\', A₂\'\', E\'\'.',
    IRaman: 'A₁\' e E\': apenas Raman. A₂\'\' e E\'\': apenas IV.',
  },
  {
    id: 'D4h',
    name: 'D₄h',
    elements: 'E, 2C₄, C₂, 2C₂\', 2C₂\'\', i, 2S₄, σh, 2σᵥ, 2σd',
    order: 16,
    examples: ['XeF₄', '[PtCl₄]²⁻', 'ciclobutano (D₄h)', 'benzeno? Não — D₆h'],
    desc: 'Quadrado plano. Centro de inversão: exclusão mútua. Importante em complexos de Pt(II), Pd(II). A₁g "respiração": somente Raman.',
    IRaman: 'A₂u e Eu: IV ativos. A₁g, B₁g, B₂g, Eg: Raman ativos. Exclusão mútua.',
  },
  {
    id: 'D6h',
    name: 'D₆h',
    elements: 'E, 2C₆, 2C₃, C₂, 3C₂\', 3C₂\'\', i, 2S₃, 2S₆, σh, 3σd, 3σᵥ',
    order: 24,
    examples: ['benzeno (C₆H₆)', 'grafeno (camada)', 'ciclohexano cadeira? Não — D₃d'],
    desc: 'Hexágono plano. O grupo do benzeno. Centro de inversão: exclusão mútua total. 12 representações irredutíveis.',
    IRaman: 'A₂u e E₁u: IV. A₁g e E₂g: Raman. Modo de respiração (A₁g) somente Raman — diagnóstico para aromaticidade.',
  },
];

// Tabela de caracteres simplificada para C2v (exemplo canônico)
const C2V_TABLE = {
  name: 'C₂ᵥ',
  ops:  ['E', 'C₂', 'σᵥ(xz)', 'σᵥ\'(yz)'],
  reps: [
    { sym: 'A₁', chars: [1, 1, 1, 1],  basis: 'z, z²',              active: 'IV+R' },
    { sym: 'A₂', chars: [1, 1,-1,-1],  basis: 'Rz, xy',             active: 'R' },
    { sym: 'B₁', chars: [1,-1, 1,-1],  basis: 'x, Ry, xz',          active: 'IV+R' },
    { sym: 'B₂', chars: [1,-1,-1, 1],  basis: 'y, Rx, yz',          active: 'IV+R' },
  ],
};

const TD_TABLE = {
  name: 'Td',
  ops:  ['E', '8C₃', '3C₂', '6S₄', '6σd'],
  reps: [
    { sym: 'A₁', chars: [1, 1, 1, 1, 1],  basis: 'x²+y²+z²',   active: 'R' },
    { sym: 'A₂', chars: [1, 1, 1,-1,-1],  basis: '—',            active: 'inativo' },
    { sym: 'E',  chars: [2,-1, 2, 0, 0],  basis: '(2z²-x²-y², x²-y²)', active: 'R' },
    { sym: 'T₁', chars: [3, 0,-1, 1,-1],  basis: '(Rx,Ry,Rz)',  active: 'inativo' },
    { sym: 'T₂', chars: [3, 0,-1,-1, 1],  basis: '(x,y,z); (xy,xz,yz)', active: 'IV+R' },
  ],
};

const OH_TABLE = {
  name: 'Oh',
  ops:  ['E', '8C₃', '6C₂', '6C₄', '3C₂', 'i', '6S₄', '8S₆', '3σh', '6σd'],
  reps: [
    { sym: 'A₁g', chars: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  basis: 'x²+y²+z²',  active: 'R' },
    { sym: 'Eg',  chars: [2,-1, 0, 0, 2, 2, 0,-1, 2, 0],  basis: '(2z²-x²-y², x²-y²)', active: 'R' },
    { sym: 'T₂g', chars: [3, 0,-1, 1,-1, 3, 1, 0,-1,-1], basis: '(xz,yz,xy)', active: 'R' },
    { sym: 'T₁u', chars: [3, 0,-1,-1,-1,-3,-1, 0, 1, 1], basis: '(x,y,z)',    active: 'IV' },
    { sym: 'A₁u', chars: [1, 1, 1, 1, 1,-1,-1,-1,-1,-1], basis: '—',           active: 'inativo' },
    { sym: 'A₂g', chars: [1, 1,-1,-1, 1, 1,-1, 1, 1,-1], basis: '—',           active: 'inativo' },
  ],
};

const CHAR_TABLES = { C2v: C2V_TABLE, Td: TD_TABLE, Oh: OH_TABLE };

// Fluxograma de identificação de grupo
const FLOWCHART = [
  { q: 'A molécula tem pelo menos um eixo de rotação Cₙ (n ≥ 2)?', yes: 1, no: 'CsCi' },
  { q: 'O eixo de maior ordem é único (apenas um Cₙ principal)?', yes: 2, no: 'cubic' },
  { q: 'Há n eixos C₂ ⊥ ao eixo Cₙ principal?', yes: 'Dn', no: 'Cn' },
];

const EXERCISES = [
  { q: 'H₂O (C₂ᵥ) — quais modos vibracionais são IV-ativos?', opts: ['Apenas A₁ (1 modo)','2A₁ + B₁ — todos os 3 modos são IV-ativos','Apenas B₁','Nenhum — C₂ᵥ não tem modos IV-ativos'], ans: 1, exp: 'C₂ᵥ sem centro de inversão: todos os modos podem ser simultaneamente IV e Raman-ativos. 2A₁ + B₁ transformam como z,z,x → IV-ativos.', hint: 'Em C₂ᵥ não há centro de inversão — a regra de exclusão mútua não se aplica.' },
  { q: 'Qual elemento de simetria identifica C₂ᵥ?', opts: ['2 eixos C₂','Eixo C₂ + 2 planos σᵥ','2 centros de inversão','2 eixos S₄'], ans: 1, exp: 'C₂ᵥ: 1 eixo C₂ + 2 planos σᵥ perpendiculares. "v" = verticais (contendo o eixo principal).', hint: 'C₂=eixo de 2ª ordem; v=planos verticais.' },
  { q: 'CO₂ (D∞h) — o modo ν₁ (Σg⁺) é:', opts: ['IV e Raman ativos','IV-inativo e Raman-ativo (exclusão mútua)','IV-ativo e Raman-inativo','Inativo em ambos'], ans: 1, exp: 'D∞h tem i. Regra de exclusão mútua: ν₁ (Σg⁺) é par (g) → Raman-ativo, IV-inativo. ν₃ (Σu⁺) é ímpar → IV-ativo, Raman-inativo.', hint: 'g = gerade (par) → Raman. u = ungerade (ímpar) → IV.' },
  { q: 'SF₆ (Oh) tem quantas operações de simetria?', opts: ['24','48','12','6'], ans: 1, exp: 'Oh = O × {E,i} = 24 × 2 = 48 operações. O grupo O tem 24 rotações próprias do octaedro.', hint: 'Oh = grupo O mais inversão. Quantas rotações tem O?' },
  { q: 'BF₃ (D₃h) é apolar e NH₃ (C₃ᵥ) é polar. Por quê?', opts: ['BF₃ tem F mais eletronegativo','NH₃ não tem plano σh — par isolado do N gera dipolo resultante','Ambas são apolares','BF₃ tem mais ligações'], ans: 1, exp: 'BF₃: σh zera dipolo perpendicular; 3 vetores B-F se cancelam. NH₃: sem σh → par isolado do N aponta para baixo → μ ≠ 0.', hint: 'σh cancela o dipolo fora do plano. Sem σh, o que acontece com o dipolo do par isolado?' },,
  { q:'O grupo pontual do BF₃ (trigonal plana) contém os seguintes elementos de simetria:', opts:['E, C₃, 3C₂, σh, 3σv, S₃ — grupo D₃h','E, C₃, 3σv — grupo C₃v','E, C₂, σh — grupo C₂h','E, i — grupo Ci'], ans:0, exp:'BF₃ plana: eixo C₃ (principal), 3 eixos C₂ (passando pelos B-F), plano σh (o plano molecular), 3 planos σv, eixo impróprio S₃. Grupo D₃h — mesmo do ciclopropano, PCl₃ (quando plano), grafeno.', hint:'Plano molecular + eixo principal + n eixos C₂ perpendiculares → grupo D_nh.' },
  { q:'O H₂O tem grupo pontual C₂v. Quais são seus elementos de simetria?', opts:['E, C₂, σv, σv' (4 operações)','E, C₂, 2σv — apenas os eixos C₂ e dois planos verticais','E, C₂, σh','E, i, C₂'], ans:0, exp:'H₂O: E (identidade), C₂ (eixo passando pelo O bissetando HÔH), σv (plano da molécula), σv' (plano perpendicular ao anterior, contendo C₂). 4 elementos = grupo C₂v. Ordem do grupo = 4.', hint:'C₂v: C₂ + 2 planos verticais (um contendo a molécula). Ordem = 4.' },
  { q:'A teoria dos grupos é útil em espectroscopia porque:', opts:['Calcula a massa dos grupos funcionais','Determina quais modos de vibração são IV-ativos, Raman-ativos ou inativos pela representação irredutível (regra de seleção por simetria)','Define a geometria molecular apenas visualmente','Calcula ΔH das vibrações moleculares'], ans:1, exp:'Modos de vibração são classificados por representações irredutíveis do grupo pontual. Modo IV-ativo: pertence a representação com simetria x, y ou z. Modo Raman-ativo: representação com simetria xy, xz, yz, x², y², z². A tabela de caracteres diz imediatamente quais modos são ativos em cada técnica.', hint:'Tabela de caracteres: x,y,z → IV. Quadrático (xy,xz,...) → Raman.' },
  { q:'O CH₄ pertence ao grupo T_d. Uma consequência é que:', opts:['Tem momento dipolar diferente de zero','Todos os 4 ligantes são equivalentes por simetria — o CH₄ é apolar e seus vínculos C-H têm o mesmo comprimento e energia','Tem plano de inversão i','É planar'], ans:1, exp:'T_d (tetraedro): E, 8C₃, 3C₂, 6S₄, 6σd (ordem = 24). Alta simetria equivale os 4 hidrogênios. Sem dipolo (simetria → cancelamento). Sem centro de inversão i (T_d ≠ O_h). As vibrações T₂ são IV e Raman ativas ao mesmo tempo (sem regra de exclusão mútua, pois T_d não tem i).', hint:'T_d: tetraedro. Alta simetria → equivalência dos ligantes → apolar. Sem inversão.' },
  { q:'O grupo pontual de uma molécula com apenas um plano de simetria (σ) e nenhum eixo de rotação próprio além de E é:', opts:['C₁','Cs','Ci','C∞v'], ans:1, exp:'Cs: E + σ. Apenas o plano. Exemplos: CH₂ClBr (quando planares), bifenila com um anel substituído assimetricamente. Ci: E + i (centro de inversão apenas). C₁: sem simetria alguma (só identidade E). C∞v: eixo de infinita ordem (moléculas lineares como CO, HF).', hint:'Cs = apenas plano. Ci = apenas centro de inversão. C₁ = sem simetria.' },
  { q:'A representação irredutível A₁ no grupo C₂v tem caracteres (1,1,1,1). Isso indica que o modo:', opts:['Inverte de sinal em todas as operações','É totalmente simétrico — não muda de sinal em nenhuma operação do grupo','É degenerado','É apenas IV-ativo'], ans:1, exp:'Caractere +1 em todas as operações = modo totalmente simétrico (A₁ em C₂v). Qualquer propriedade ou orbital com A₁ é invariante sob todas as operações do grupo. O modo A₁ do H₂O (estiramento simétrico O-H) é totalmente simétrico e aparece tanto no IV quanto no Raman.', hint:'Todos os caracteres = +1: totalmente simétrico. Qualquer sinal -1: assimétrico.' },
  { q:'O número de vibrações normais de uma molécula não-linear com N átomos é:', opts:['3N','3N-3','3N-5','3N-6'], ans:3, exp:'Graus de liberdade totais: 3N. Subtrair: 3 translação + 3 rotação = 6. Vibrações = 3N-6. Para molécula linear: 3N-5 (apenas 2 rotações independentes). H₂O (N=3, não-linear): 3×3-6 = 3 modos. CO₂ (N=3, linear): 3×3-5 = 4 modos (1 duplamente degenerado → 3 frequências distintas).', hint:'Não-linear: 3N-6. Linear: 3N-5. H₂O: 3×3-6 = 3. CO₂: 3×3-5 = 4.' }
];
let _exIdx = 0;

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

let _exAttempts = 0, _exDone = false;
let _activeGroup = 'C2v';
let _activeTable = 'C2v';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _renderCharTable(key) {
  const t = CHAR_TABLES[key];
  if (!t) return '';
  const headerCells = t.ops.map(op =>
    `<th style="text-align:center;padding:.3rem .5rem;border-bottom:1px solid var(--border-default);font-family:monospace;font-size:var(--text-xs)">${op}</th>`
  ).join('');
  const rows = t.reps.map(r => {
    const charCells = r.chars.map(c =>
      `<td style="text-align:center;padding:.3rem .5rem;font-family:monospace;font-size:var(--text-xs);color:${c<0?'var(--accent-reaction)':'var(--accent-electron)'}">${c}</td>`
    ).join('');
    const activeColor = r.active === 'IV+R' ? 'var(--accent-organic)'
                       : r.active === 'R'   ? 'var(--accent-bond)'
                       : r.active === 'IV'  ? 'var(--accent-electron)'
                       : 'var(--text-muted)';
    return `<tr style="border-bottom:1px solid var(--border-subtle)">
      <td style="padding:.3rem .5rem;font-family:monospace;font-weight:700;color:var(--accent-electron)">${r.sym}</td>
      ${charCells}
      <td style="padding:.3rem .5rem;font-size:var(--text-xs);color:var(--text-muted)">${r.basis}</td>
      <td style="padding:.3rem .5rem;font-size:var(--text-xs);font-weight:600;color:${activeColor}">${r.active}</td>
    </tr>`;
  }).join('');
  return `
    <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm);margin-bottom:var(--space-3)">
      <thead>
        <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
          <th style="text-align:left;padding:.3rem .5rem;border-bottom:1px solid var(--border-default)">Rep.</th>
          ${headerCells}
          <th style="text-align:left;padding:.3rem .5rem;border-bottom:1px solid var(--border-default)">Funções de base</th>
          <th style="text-align:left;padding:.3rem .5rem;border-bottom:1px solid var(--border-default)">IV/Raman</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function render(outlet) {
  _exIdx = 0; _exAttempts = 0; _exDone = false;

  const groupBtns = POINT_GROUPS.map(g =>
    `<button class="btn btn-xs ${g.id === 'C2v' ? 'btn-secondary' : 'btn-ghost'}" data-gid="${g.id}">${g.name}</button>`
  ).join('');

  const tableBtns = Object.keys(CHAR_TABLES).map(k =>
    `<button class="btn btn-xs ${k === 'C2v' ? 'btn-secondary' : 'btn-ghost'}" data-tbl="${k}">${CHAR_TABLES[k].name}</button>`
  ).join('');

    `<button class="btn btn-ghost" style="text-align:left;justify-content:flex-start" data-exopt="${i}">${esc(opt)}</button>`
  ).join('');

  outlet.innerHTML = `
<div class="page module-page">
  <button class="module-back btn-ghost" data-nav="/modules">&larr; Módulos</button>
  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/>
        <line x1="12" y1="2" x2="12" y2="22"/>
        <line x1="2" y1="8.5" x2="22" y2="8.5"/>
        <line x1="2" y1="15.5" x2="22" y2="15.5"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Simetria Molecular</h1>
      <p class="module-subtitle">Elementos de simetria, grupos pontuais, tabelas de caracteres e regras de seleção espectroscópica.</p>
    </div>
  </header>

  <!-- Fenômeno -->
  <section class="module-section">
    <h2 class="module-section-title">Por que simetria importa em química?</h2>
    <p class="module-text">
      A simetria de uma molécula determina quais transições espectroscópicas são permitidas,
      como orbitais se combinam para formar ligações, e quais propriedades físicas são possíveis.
      A teoria de grupos é a linguagem matemática formal da simetria — transforma análises
      qualitativas em previsões quantitativas rigorosas.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Regras de seleção IV/Raman</h3>
        <p style="font-size:var(--text-sm)">Um modo vibracional é IV-ativo se e somente se pertencer à mesma representação irredutível que x, y ou z. É Raman-ativo se pertencer à representação de x², y², z², xy, xz ou yz. Em moléculas com centro de inversão: exclusão mútua total.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Simetria de orbitais e TOM</h3>
        <p style="font-size:var(--text-sm)">Orbitais só combinam para formar ligações se pertencerem à mesma representação irredutível. Em Oh: t₂g e eg (orbitais d de metais de transição). Em D₆h: os orbitais π do benzeno formam as representações a₂u e e₁g/e₂u.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Quiralidade e simetria</h3>
        <p style="font-size:var(--text-sm)">Uma molécula é quiral se e somente se não pertencer a um grupo pontual com plano de simetria σ, eixo impróprio Sₙ ou centro de inversão i. Os grupos quirais são: C₁, Cₙ, Dₙ. Meso compostos perdem quiralidade por σ interno.</p>
      </div>
    </div>
  </section>

  <!-- Elementos de simetria -->
  <section class="module-section">
    <h2 class="module-section-title">Elementos e operações de simetria</h2>
    <p class="module-text">
      Um <strong>elemento de simetria</strong> é um ponto, linha ou plano geométrico em
      relação ao qual se realiza uma <strong>operação de simetria</strong>. Após a operação,
      a molécula é indistinguível da configuração original.
    </p>
    <div style="overflow-x:auto;margin-bottom:var(--space-5)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Símbolo</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Elemento</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Operação</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Efeito</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Exemplos</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['E',   'Identidade',              'Não faz nada',                                      'Molécula invariante',               'Toda molécula'],
            ['Cₙ',  'Eixo de rotação própria', 'Rotação de 360°/n em torno do eixo',               'Permuta átomos equivalentes',        'C₂ em H₂O; C₃ em NH₃; C₆ em benzeno'],
            ['σ',   'Plano de simetria',        'Reflexão no plano (σh, σᵥ, σd)',                   'Mapeia átomo ao seu espelho',        'σ em H₂O (plano mol.); σh em BF₃'],
            ['i',   'Centro de inversão',       'Inversão de (x,y,z) → (-x,-y,-z)',                 'Mapeia átomo ao centrossimétrico',   'SF₆, benzeno, trans-CHCl=CHCl'],
            ['Sₙ',  'Eixo de rotação imprópria','Cₙ seguido de σh (mesmo eixo)',                   'Combinação rotação + reflexão',     'S₄ em CH₄ (Td); S₆ em ciclohexano-D₃d'],
          ].map(([s,e,op,ef,ex]) => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;font-weight:700;font-size:var(--text-base);color:var(--accent-electron)">${s}</td>
            <td style="padding:.4rem .6rem;font-weight:600">${e}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">${op}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--accent-bond)">${ef}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${ex}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="info-card" style="background:var(--bg-raised)">
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        <strong style="color:var(--accent-bond)">Relações importantes:</strong>
        C₂ = S₂? Não. S₁ = σ. S₂ = i. Sₙ com n par → i implícito se n/2 é ímpar.
        O conjunto de todas as operações de simetria de uma molécula forma um <em>grupo matemático</em>: fechado, associativo, tem identidade e inversas.
      </p>
    </div>
  </section>

  <!-- Grupos pontuais -->
  <section class="module-section">
    <h2 class="module-section-title">Grupos pontuais — catálogo interativo</h2>
    <p class="module-text">
      O <strong>grupo pontual</strong> de uma molécula é o conjunto completo de suas operações
      de simetria. A ordem do grupo h = número total de operações. Grupos mais comuns
      em inorgânica: C₂ᵥ, C₃ᵥ, D₂h, D₃h, D₄h, D₆h, Td, Oh.
    </p>
    <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:var(--space-4)">${groupBtns}</div>
    <div id="group-card" class="info-card" style="background:var(--bg-raised);min-height:80px"></div>
  </section>

  <!-- Fluxograma de identificação -->
  <section class="module-section">
    <h2 class="module-section-title">Fluxograma de identificação de grupo pontual</h2>
    <p class="module-text">
      Sequência sistemática para determinar o grupo pontual de qualquer molécula:
    </p>
    <div class="info-card" style="background:var(--bg-raised);font-size:var(--text-sm);line-height:1.9">
      <p style="margin:0;color:var(--text-secondary)">
        <strong style="color:var(--accent-electron)">1.</strong> Grupos lineares? (C∞ᵥ ou D∞h)<br>
        &nbsp;&nbsp;&nbsp;→ Sim + i: <strong style="color:var(--accent-organic)">D∞h</strong> (H₂, CO₂, HCl? Não)
        &nbsp;→ Sim, sem i: <strong style="color:var(--accent-organic)">C∞ᵥ</strong> (HCl, CO, HCN)<br>
        <strong style="color:var(--accent-electron)">2.</strong> Grupos cúbicos (alta simetria)? Muitos eixos C₃ e C₄?<br>
        &nbsp;&nbsp;&nbsp;→ I/Ih (icosaedro: C₆₀, B₁₂H₁₂²⁻) | O/Oh (SF₆, cubano) | T/Td (CH₄, CCl₄)<br>
        <strong style="color:var(--accent-electron)">3.</strong> Eixo Cₙ de maior ordem (n ≥ 2)?<br>
        &nbsp;&nbsp;&nbsp;→ Não: sem σ → <strong style="color:var(--accent-organic)">C₁</strong>; com σ → <strong style="color:var(--accent-organic)">Cₛ</strong>; com i → <strong style="color:var(--accent-organic)">Cᵢ</strong><br>
        <strong style="color:var(--accent-electron)">4.</strong> n eixos C₂ ⊥ ao eixo principal?<br>
        &nbsp;&nbsp;&nbsp;→ Sim → grupo D: com σh → <strong style="color:var(--accent-organic)">Dₙh</strong>; com σd → <strong style="color:var(--accent-organic)">Dₙd</strong>; sem σ → <strong style="color:var(--accent-organic)">Dₙ</strong><br>
        <strong style="color:var(--accent-electron)">5.</strong> Sem C₂ ⊥ → grupo C: com σh → <strong style="color:var(--accent-organic)">Cₙh</strong>; com σᵥ → <strong style="color:var(--accent-organic)">Cₙᵥ</strong>; sem σ → <strong style="color:var(--accent-organic)">Cₙ</strong>
      </p>
    </div>

    <!-- Exemplos rápidos -->
    <div style="overflow-x:auto;margin-top:var(--space-4)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Molécula</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Grupo</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Elementos-chave</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Quiral?</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['HCl',          'C∞ᵥ',  'eixo C∞, ∞σᵥ',             'Não'],
            ['H₂O',          'C₂ᵥ',  'C₂, 2σᵥ',                   'Não'],
            ['NH₃',          'C₃ᵥ',  'C₃, 3σᵥ',                   'Não'],
            ['BF₃',          'D₃h',  'C₃, 3C₂⊥, σh',             'Não'],
            ['CH₄',          'Td',   '4C₃, 3C₂, 6σd',             'Não'],
            ['SF₆',          'Oh',   '4C₃, 3C₄, i',               'Não'],
            ['H₂O₂ (gauche)','C₂',   'apenas C₂',                 'Sim'],
            ['CHFCO',        'Cₛ',   'apenas σ (plano mol.)',      'Não'],
            ['C₆H₆',         'D₆h',  'C₆, 6C₂⊥, σh, i',          'Não'],
            ['ferrocene ecl.','D₅h', 'C₅, 5C₂⊥, σh',             'Não'],
            ['ciclohexano',  'D₃d',  'C₃, 3C₂⊥, 3σd, S₆',        'Não'],
            ['BINAP (livre)', 'D₂',   '3C₂ perpendiculares',       'Sim'],
          ].map(([mol,gp,el,ch]) => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-electron)">${mol}</td>
            <td style="padding:.4rem .6rem;font-weight:700;color:var(--accent-bond)">${gp}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">${el}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:${ch==='Sim'?'var(--accent-organic)':'var(--text-muted)'}">${ch}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- Tabelas de caracteres -->
  <section class="module-section">
    <h2 class="module-section-title">Tabelas de caracteres</h2>
    <p class="module-text">
      A <strong>tabela de caracteres</strong> lista, para cada representação irredutível Γ,
      os caracteres χ (traço da matriz de representação) para cada classe de operações.
      Funções de base informam quais grandezas físicas transformam como aquela representação.
    </p>
    <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:var(--space-4)">${tableBtns}</div>
    <div id="char-table-container" style="overflow-x:auto"></div>
    <div class="info-card" style="background:var(--bg-raised);margin-top:var(--space-4)">
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        <strong style="color:var(--accent-bond)">Regras de seleção por simetria:</strong><br>
        Uma transição A → B é <em>permitida</em> se o produto Γ_A × Γ_operador × Γ_B contém a representação totalmente simétrica A₁ (ou A₁g).<br>
        IV: operador = dipolo (x, y, z). Raman: operador = polarizabilidade (x², y², z², xy, xz, yz).<br>
        <strong style="color:var(--accent-reaction)">Regra da exclusão mútua:</strong> em moléculas com centro de inversão i, modos "g" são Raman-ativos (mas IV-inativos) e modos "u" são IV-ativos (mas Raman-inativos). Nenhum modo é simultaneamente ativo em ambos.
      </p>
    </div>
  </section>

  <!-- Aplicações -->
  <section class="module-section">
    <h2 class="module-section-title">Aplicações da teoria de grupos</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Previsão de espectro IV/Raman</h3>
        <p style="font-size:var(--text-sm)">Número de bandas ativas = número de modos que transformam como x/y/z (IV) ou como quadráticos (Raman). Ex: CO₂ (D∞h) tem 4 modos normais — apenas ν₃ (antisimétrico, Σu⁺) é IV-ativo; ν₁ (Σg⁺) e 2ν₂ (Πg) são Raman-ativos.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Orbitais moleculares por simetria</h3>
        <p style="font-size:var(--text-sm)">Em [ML₆] (Oh): orbitais d do metal são t₂g e eg. Ligandos σ formam a₁g, eg, t₁u. Somente orbitais da mesma representação se combinam. Resultado: t₂g não-ligantes; eg anti-ligantes — base da TCC e do diagrama de TOM para complexos octaédricos.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Benzeno (D₆h)</h3>
        <p style="font-size:var(--text-sm)">6 orbitais p formam: a₂u (ligante, 2e), e₁g (ligante, 4e), e₂u (anti-ligante), b₂g (anti-ligante). Previsão de estabilidade aromática e espectro UV-Vis. Modo A₁g (respiração) somente Raman — diagnóstico de aromaticidade (1580 cm⁻¹).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Produto direto Γ × Γ</h3>
        <p style="font-size:var(--text-sm)">O produto de duas representações dá novas representações. Regra: Γ_i × Γ_i sempre contém A₁. Uso: verificar se integral ⟨ψ_i|O|ψ_j⟩ ≠ 0 — fundamental para regras de seleção em espectroscopia eletrônica e Raman.</p>
      </div>
    </div>
  </section>

  <!-- Visualização de simetria -->
  <section class="module-section">
    <h2 class="module-section-title">Visualização — elementos de simetria</h2>
    <p class="module-text">
      Selecione uma molécula para ver seus elementos de simetria desenhados sobre a
      estrutura 2D. Planos σ são mostrados como linhas tracejadas coloridas; o eixo
      Cₙ principal como seta central; o centro de inversão como ponto.
    </p>
    <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:var(--space-3)" id="sym-mol-btns">
      ${['H₂O','NH₃','BF₃','CH₄','CO₂','benzeno','SF₆'].map((m,i)=>
        `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" data-symmol="${m}">${m}</button>`
      ).join('')}
    </div>
    <div style="display:flex;gap:var(--space-4);flex-wrap:wrap;align-items:flex-start">
      <div class="canvas-frame" id="sym-frame" style="min-height:200px;flex:0 0 220px">
        <canvas id="sym-canvas" aria-label="Elementos de simetria"></canvas>
      </div>
      <div id="sym-info" style="flex:1;min-width:180px"></div>
    </div>
  </section>


  <!-- Exercício -->
  <section class="module-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/5)</h2>
    <p class="module-text">${esc(EXERCISES[0].q)}</p>
    <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem"></div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next" style="margin-top:1rem;display:none">Próximo &#8594;</button>
  </section>

  <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">
      A teoria de grupos explica por que o CO₂ absorve IV (aquecimento global) mas O₂ e N₂ não
      (são Σg⁺ — IV-inativos). O espectro Raman do diamante tem uma única banda (1332 cm⁻¹)
      porque é IV-inativo (Oh) — diagnóstico rápido de autenticidade.
      Em fármacos: moléculas quirais (C₁ ou Cₙ/Dₙ) são analisadas por dicroísmo circular (CD)
      — técnica baseada em regras de seleção por simetria.
    </p>
  </div>
</div>
`;

  // Grupos pontuais interativos
  function showGroup(id) {
    const g    = POINT_GROUPS.find(x => x.id === id);
    const card = document.getElementById('group-card');
    if (!g || !card) return;
    card.innerHTML = `
      <div style="display:flex;gap:var(--space-5);flex-wrap:wrap;align-items:flex-start">
        <div style="flex:1;min-width:200px">
          <h3 style="margin-top:0;color:var(--accent-electron)">${g.name} &nbsp;<span style="font-size:var(--text-xs);color:var(--text-muted);font-weight:400">ordem ${g.order}</span></h3>
          <p style="font-size:var(--text-sm);margin-bottom:.4rem"><strong>Elementos:</strong> <span style="font-family:monospace;color:var(--accent-bond)">${g.elements}</span></p>
          <p style="font-size:var(--text-sm);margin-bottom:.4rem"><strong>Exemplos:</strong> ${g.examples.join(', ')}</p>
          <p style="font-size:var(--text-sm);margin-bottom:.4rem">${g.desc}</p>
          <p style="font-size:var(--text-sm);color:${g.IRaman.includes('Exclusão')? 'var(--accent-reaction)':'var(--accent-organic)'}">
            <strong>IV/Raman:</strong> ${g.IRaman}
          </p>
        </div>
      </div>`;
  }
  showGroup('C2v');
  document.querySelectorAll('[data-gid]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-gid]').forEach(b =>
        b.className = 'btn btn-xs ' + (b.dataset.gid === btn.dataset.gid ? 'btn-secondary' : 'btn-ghost'));
      showGroup(btn.dataset.gid);
    });
  });

  // Tabelas de caracteres
  function showTable(key) {
    const el = document.getElementById('char-table-container');
    if (el) el.innerHTML = _renderCharTable(key);
  }
  showTable('C2v');
  document.querySelectorAll('[data-tbl]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tbl]').forEach(b =>
        b.className = 'btn btn-xs ' + (b.dataset.tbl === btn.dataset.tbl ? 'btn-secondary' : 'btn-ghost'));
      showTable(btn.dataset.tbl);
    });
  });

  // Exercício
  document.querySelectorAll('[data-exopt]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_exDone) return; _exAttempts++;
      const choice = parseInt(btn.dataset.exopt, 10);
      const fb     = document.getElementById('exercise-feedback');
      if (choice === EXERCISE.correct) {
        _exDone = true;
        btn.style.borderColor = 'var(--accent-organic)';
        btn.style.color       = 'var(--accent-organic)';
        if (fb) fb.innerHTML  = '<p class="feedback-correct">Correto! ' + EXERCISE.explanation + '</p>';
        markSectionDone('symmetry', 'exercise');
      } else {
        btn.style.borderColor = 'var(--accent-reaction)';
        btn.style.color       = 'var(--accent-reaction)';
        if (fb && _exAttempts === 1)
          fb.innerHTML = '<p class="feedback-hint">Dica: conte as representações irredutíveis de C₂ᵥ e verifique quais transformam como x, y ou z.</p>';
      }
    });
  });

  _initSymCanvas();
  _initExercises();
  markSectionDone('symmetry', 'visited');
}

// ---------------------------------------------------------------------------
// Symmetry element visualizer — 2D molecule diagrams
// ---------------------------------------------------------------------------

const SYM_MOLECULES = {
  'H₂O': {
    group: 'C₂ᵥ',
    atoms: [
      { label: 'O', x: 0,     y: 0,    r: 14, color: '#ef476f' },
      { label: 'H', x: -45,   y: 45,   r: 8,  color: '#aaa' },
      { label: 'H', x:  45,   y: 45,   r: 8,  color: '#aaa' },
    ],
    bonds: [[0,1],[0,2]],
    symElements: [
      { type: 'axis', label: 'C₂', x1: 0, y1: -70, x2: 0, y2: 70, color: '#4fc3f7' },
      { type: 'plane', label: 'σᵥ(xz)', x1: 0, y1: -70, x2: 0, y2: 70, color: '#4fc3f7', dash: true },
      { type: 'plane', label: "σᵥ'(yz)", x1: -80, y1: 0, x2: 80, y2: 0, color: '#ffd166', dash: true },
    ],
    desc: 'C₂ᵥ: 1 eixo C₂, 2 planos σᵥ perpendiculares. Sem centro de inversão → IV e Raman ativos.',
  },
  'NH₃': {
    group: 'C₃ᵥ',
    atoms: [
      { label: 'N', x: 0,    y: -10,  r: 13, color: '#4fc3f7' },
      { label: 'H', x: -50,  y:  45,  r: 8,  color: '#aaa' },
      { label: 'H', x:  50,  y:  45,  r: 8,  color: '#aaa' },
      { label: 'H', x:   0,  y:  60,  r: 8,  color: '#aaa' },
    ],
    bonds: [[0,1],[0,2],[0,3]],
    symElements: [
      { type: 'axis', label: 'C₃', x1: 0, y1: -75, x2: 0, y2: 75, color: '#4fc3f7' },
      { type: 'plane', label: 'σᵥ¹', x1: 0, y1: -75, x2: 0, y2: 75, color: '#6bcb77', dash: true },
      { type: 'plane', label: 'σᵥ²', x1: -65, y1: -38, x2: 65, y2: 38, color: '#ffd166', dash: true },
      { type: 'plane', label: 'σᵥ³', x1: -65, y1: 38, x2: 65, y2: -38, color: '#ef476f', dash: true },
    ],
    desc: 'C₃ᵥ: 1 eixo C₃, 3 planos σᵥ. Pirâmide trigonal. Sem centro de inversão. Dipolo permanente.',
  },
  'BF₃': {
    group: 'D₃h',
    atoms: [
      { label: 'B', x: 0,    y: 0,    r: 12, color: '#ffd166' },
      { label: 'F', x: 0,    y: -65,  r: 11, color: '#6bcb77' },
      { label: 'F', x: 56,   y:  32,  r: 11, color: '#6bcb77' },
      { label: 'F', x: -56,  y:  32,  r: 11, color: '#6bcb77' },
    ],
    bonds: [[0,1],[0,2],[0,3]],
    symElements: [
      { type: 'axis', label: 'C₃', x1: 0, y1: -75, x2: 0, y2: 75, color: '#4fc3f7' },
      { type: 'plane', label: 'σh', x1: -80, y1: 0, x2: 80, y2: 0, color: '#ef476f', dash: true },
      { type: 'plane', label: 'σᵥ¹', x1: 0, y1: -75, x2: 0, y2: 75, color: '#6bcb77', dash: true },
    ],
    desc: 'D₃h: C₃, 3 C₂ ⊥, σh, 3 σᵥ. Planar trigonal. A₂\'\' (IV) e E\' (IV e Raman).',
  },
  'CH₄': {
    group: 'Td',
    atoms: [
      { label: 'C', x: 0,   y: 0,   r: 13, color: '#888' },
      { label: 'H', x: 0,   y: -60, r: 8,  color: '#aaa' },
      { label: 'H', x: 60,  y: 25,  r: 8,  color: '#aaa' },
      { label: 'H', x: -60, y: 25,  r: 8,  color: '#aaa' },
      { label: 'H', x: 0,   y: 55,  r: 8,  color: '#aaa' },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4]],
    symElements: [
      { type: 'axis', label: 'C₃', x1: -10, y1: -75, x2: 10, y2: 75, color: '#4fc3f7' },
      { type: 'plane', label: 'σd¹', x1: -75, y1: -30, x2: 75, y2: 30, color: '#ffd166', dash: true },
      { type: 'plane', label: 'σd²', x1: -40, y1: -70, x2: 40, y2: 70, color: '#ef476f', dash: true },
    ],
    desc: 'Td: 4 C₃, 3 C₂, 6 σd. Sem centro de inversão → T₂ é IV e Raman ativo. A₁: apenas Raman.',
  },
  'CO₂': {
    group: 'D∞h',
    atoms: [
      { label: 'O', x: -65, y: 0, r: 12, color: '#ef476f' },
      { label: 'C', x:   0, y: 0, r: 11, color: '#888' },
      { label: 'O', x:  65, y: 0, r: 12, color: '#ef476f' },
    ],
    bonds: [[0,1],[1,2]],
    symElements: [
      { type: 'axis', label: 'C∞', x1: -80, y1: 0, x2: 80, y2: 0, color: '#4fc3f7' },
      { type: 'center', label: 'i', x: 0, y: 0, color: '#ef476f' },
      { type: 'plane', label: 'σh', x1: -80, y1: 0, x2: 80, y2: 0, color: '#ffd166', dash: true },
    ],
    desc: 'D∞h: eixo C∞, centro de inversão i. Exclusão mútua rigorosa. ν₃ (Σu⁺) apenas IV. ν₁ (Σg⁺) apenas Raman.',
  },
  'benzeno': {
    group: 'D₆h',
    atoms: (() => {
      const a = [];
      a.push({ label: 'C', x: 0, y: 0, r: 12, color: '#888', center: true });
      for (let i = 0; i < 6; i++) {
        const ang = i * 60 * Math.PI / 180;
        a.push({ label: 'C', x: Math.round(52 * Math.cos(ang)), y: Math.round(52 * Math.sin(ang)), r: 10, color: '#888' });
        a.push({ label: 'H', x: Math.round(78 * Math.cos(ang)), y: Math.round(78 * Math.sin(ang)), r: 6,  color: '#aaa' });
      }
      return a.filter(a => !a.center);
    })(),
    bonds: [[0,1],[2,3],[4,5],[6,7],[8,9],[10,11],[0,2],[2,4],[4,6],[6,8],[8,10],[10,0]],
    symElements: [
      { type: 'axis', label: 'C₆', x1: 0, y1: -75, x2: 0, y2: 75, color: '#4fc3f7' },
      { type: 'center', label: 'i', x: 0, y: 0, color: '#ef476f' },
      { type: 'plane', label: 'σh', x1: -80, y1: 0, x2: 80, y2: 0, color: '#ffd166', dash: true },
    ],
    desc: 'D₆h: C₆, 6 C₂, σh, i. Exclusão mútua. Modo A₁g (respiração) apenas Raman ~992 cm⁻¹.',
  },
  'SF₆': {
    group: 'Oh',
    atoms: [
      { label: 'S', x: 0,   y: 0,   r: 14, color: '#ffd166' },
      { label: 'F', x: 0,   y: -65, r: 10, color: '#6bcb77' },
      { label: 'F', x: 0,   y:  65, r: 10, color: '#6bcb77' },
      { label: 'F', x: -65, y: 0,   r: 10, color: '#6bcb77' },
      { label: 'F', x:  65, y: 0,   r: 10, color: '#6bcb77' },
      { label: 'F', x: -46, y: -46, r: 10, color: '#6bcb77' },
      { label: 'F', x:  46, y:  46, r: 10, color: '#6bcb77' },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]],
    symElements: [
      { type: 'axis', label: 'C₄', x1: 0, y1: -75, x2: 0, y2: 75, color: '#4fc3f7' },
      { type: 'center', label: 'i', x: 0, y: 0, color: '#ef476f' },
      { type: 'plane', label: 'σh', x1: -80, y1: 0, x2: 80, y2: 0, color: '#ffd166', dash: true },
    ],
    desc: 'Oh: 4 C₃, 3 C₄, i. Exclusão mútua rigorosa. T₁u apenas IV. A₁g, Eg, T₂g apenas Raman.',
  },
};

function _initSymCanvas() {
  const frame  = document.getElementById('sym-frame');
  const canvas = document.getElementById('sym-canvas');
  if (!canvas || !frame) return;

  const SIZE = 220;
  const dpr  = window.devicePixelRatio || 1;
  canvas.width  = Math.round(SIZE * dpr);
  canvas.height = Math.round(SIZE * dpr);
  canvas.style.width  = SIZE + 'px';
  canvas.style.height = SIZE + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const cx = SIZE / 2, cy = SIZE / 2;

  let _symAnimId = null;
  let _symPulse  = 0;

  function drawMolFrame(mol, t, pulse) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Symmetry elements first (behind atoms)
    mol.symElements.forEach((el, ei) => {
      ctx.save();
      // Pulsação por elemento com offset de fase
      const glow = 0.55 + 0.45 * Math.sin(pulse + ei * 1.1);
      ctx.strokeStyle = el.color;
      ctx.lineWidth   = el.type === 'axis' ? 2 : 1.5;
      if (el.dash) ctx.setLineDash([5, 4]);

      if (el.type === 'axis' || el.type === 'plane') {
        ctx.globalAlpha = (el.type === 'axis' ? 0.7 : 0.45) * glow * Math.min(1, t * 1.5);
        ctx.shadowColor = el.color;
        ctx.shadowBlur  = el.type === 'axis' ? 8 * glow : 0;
        ctx.beginPath();
        ctx.moveTo(cx + el.x1, cy + el.y1);
        ctx.lineTo(cx + el.x2, cy + el.y2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.8 * Math.min(1, t * 2);
        ctx.font = '9px monospace';
        ctx.fillStyle = el.color;
        ctx.textAlign = 'center';
        ctx.fillText(el.label, cx + el.x2 + 10, cy + el.y2 - 4);
      } else if (el.type === 'center') {
        ctx.globalAlpha = 0.9 * Math.min(1, t * 2);
        ctx.shadowColor = el.color;
        ctx.shadowBlur  = 6 * glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = el.color;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(el.label, cx + 9, cy - 6);
      }
      ctx.restore();
    });

    // Bonds
    mol.bonds.forEach(([a, b]) => {
      if (!mol.atoms[a] || !mol.atoms[b]) return;
      ctx.globalAlpha = Math.min(1, t * 2);
      ctx.strokeStyle = 'rgba(200,200,200,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + mol.atoms[a].x, cy + mol.atoms[a].y);
      ctx.lineTo(cx + mol.atoms[b].x, cy + mol.atoms[b].y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Atoms
    ctx.globalAlpha = Math.min(1, t * 1.8);
    mol.atoms.forEach(at => {
      ctx.beginPath();
      ctx.arc(cx + at.x, cy + at.y, at.r, 0, Math.PI * 2);
      ctx.fillStyle = at.color;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${at.r > 10 ? 10 : 8}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(at.label, cx + at.x, cy + at.y);
      ctx.textBaseline = 'alphabetic';
    });
    ctx.globalAlpha = 1;

    // Group label top-left
    ctx.globalAlpha = Math.min(1, t * 3);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(mol.group, 8, 16);
    ctx.globalAlpha = 1;
  }

  function updateInfo(mol) {
    const info = document.getElementById('sym-info');
    if (info) {
      info.innerHTML = `
        <div style="padding:.5rem">
          <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Grupo pontual</p>
          <p style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">${mol.group}</p>
          <p style="font-size:var(--text-sm);margin-top:.5rem">${mol.desc}</p>
          <div style="margin-top:.5rem;display:flex;flex-wrap:wrap;gap:.3rem">
            ${mol.symElements.map(e =>
              `<span style="font-family:monospace;font-size:var(--text-xs);padding:.15rem .4rem;border-radius:3px;background:var(--bg-raised);color:${e.color}">${e.label}</span>`
            ).join('')}
          </div>
        </div>`;
    }
  }

  function drawMol(key) {
    const mol = SYM_MOLECULES[key];
    if (!mol) return;
    updateInfo(mol);
    if (_symAnimId) cancelAnimationFrame(_symAnimId);
    let t = 0;
    function loop() {
      t = Math.min(1, t + 0.06);
      _symPulse += 0.04;
      drawMolFrame(mol, t, _symPulse);
      _symAnimId = requestAnimationFrame(loop);
    }
    _symAnimId = requestAnimationFrame(loop);
  }

  document.querySelectorAll('[data-symmol]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-symmol]').forEach(b =>
        b.className = 'btn btn-xs ' + (b.dataset.symmol === btn.dataset.symmol ? 'btn-secondary' : 'btn-ghost'));
      drawMol(btn.dataset.symmol);
    });
  });

  drawMol('H₂O');
}

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
          btn.style.color = 'var(--accent-organic)';
          if (fb2) fb2.innerHTML = `<p class="feedback-correct">Correto! ${esc(ex.exp)}</p>`;
          markSectionDone('symmetry', 'exercise');
          const nxBtn = document.getElementById('ex-next');
          if (nxBtn && idx < EXERCISES.length - 1) nxBtn.style.display = 'inline-flex';
        } else {
          btn.style.borderColor = 'var(--accent-reaction)';
          btn.style.color = 'var(--accent-reaction)';
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

export function destroy() {
  if (typeof _symAnimId !== 'undefined' && _symAnimId) { cancelAnimationFrame(_symAnimId); }}
