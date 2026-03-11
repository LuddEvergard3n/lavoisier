/**
 * modules/chemical-bonds/index.js — Módulo: Ligações Químicas
 * Lavoisier — Laboratório Visual de Química
 *
 * Implementa:
 *  - Visualização Canvas de moléculas com ligações
 *  - 5 presets: H₂O, CO₂, NH₃, CH₄, NaCl
 *  - Arraste de átomos (DragManager)
 *  - Indicador de polaridade e tipo de ligação
 *  - Exercício guiado
 */

import { esc, createHiDPICanvas }  from '../../js/ui.js';
import { markSectionDone }         from '../../js/state.js';
import { SimLoop }                 from '../../js/engine/simulation.js';
import { DragManager, hitCircle }  from '../../js/engine/interaction.js';
import {
  clearCanvas, drawAtom, drawBond, drawDipole,
  elementColor, COLOR
} from '../../js/engine/renderer.js';

/* -----------------------------------------------------------------------
   Definição das moléculas-preset
----------------------------------------------------------------------- */
const MOLECULES = {
  H2O: {
    label: 'H₂O — Água',
    type:  'covalente polar',
    info:  'Dois átomos de H compartilham elétrons com o O. O oxigênio é mais eletronegativo (3,44) — puxa os elétrons para si, criando dipolos. A geometria angular gera um dipolo resultante permanente: o O fica parcialmente negativo (δ-) e os H ficam positivos (δ+).',
    atoms: [
      { s:'O', x:0.50, y:0.45, r:22 },
      { s:'H', x:0.28, y:0.65, r:14 },
      { s:'H', x:0.72, y:0.65, r:14 },
    ],
    bonds: [[0,1,1],[0,2,1]],
    dipole: true,
    polar: true,
  },
  CO2: {
    label: 'CO₂ — Dióxido de Carbono',
    type:  'covalente apolar',
    info:  'Cada oxigênio faz dupla ligação com o carbono e puxa os elétrons (O é mais eletronegativo). Porém a geometria é linear e simétrica — os dois dipolos se cancelam. Resultado: molécula apolar mesmo com ligações polares.',
    atoms: [
      { s:'C', x:0.50, y:0.50, r:20 },
      { s:'O', x:0.22, y:0.50, r:20 },
      { s:'O', x:0.78, y:0.50, r:20 },
    ],
    bonds: [[0,1,2],[0,2,2]],
    dipole: false,
    polar: false,
  },
  NH3: {
    label: 'NH₃ — Amônia',
    type:  'covalente polar',
    info:  'Três hidrogênios ligados ao nitrogênio, que possui um par de elétrons não-ligante (par solitário). A geometria piramidal + maior eletronegatividade do N cria um dipolo resultante apontando para o N. Isso torna a amônia polar e solúvel em água.',
    atoms: [
      { s:'N', x:0.50, y:0.38, r:21 },
      { s:'H', x:0.28, y:0.60, r:14 },
      { s:'H', x:0.50, y:0.68, r:14 },
      { s:'H', x:0.72, y:0.60, r:14 },
    ],
    bonds: [[0,1,1],[0,2,1],[0,3,1]],
    dipole: true,
    polar: true,
  },
  CH4: {
    label: 'CH₄ — Metano',
    type:  'covalente apolar',
    info:  'Quatro hidrogênios ligados ao carbono em geometria tetraédrica perfeita. C e H têm eletronegatividades parecidas (C:2,55; H:2,20) e a simetria cancela qualquer dipolo. Metano é apolar — não se mistura com água.',
    atoms: [
      { s:'C', x:0.50, y:0.50, r:20 },
      { s:'H', x:0.28, y:0.30, r:14 },
      { s:'H', x:0.72, y:0.30, r:14 },
      { s:'H', x:0.28, y:0.70, r:14 },
      { s:'H', x:0.72, y:0.70, r:14 },
    ],
    bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1]],
    dipole: false,
    polar: false,
  },
  NaCl: {
    label: 'NaCl — Cloreto de Sódio',
    type:  'iônica',
    info:  'O Na (metal alcalino, baixa energia de ionização) cede seu elétron ao Cl (halogênio, alta eletronegatividade). Formam-se íons: Na⁺ e Cl⁻. A atração eletrostática entre cargas opostas é a ligação iônica — muito mais forte que covalente polar.',
    atoms: [
      { s:'Na', x:0.32, y:0.50, r:24, charge:'+' },
      { s:'Cl', x:0.68, y:0.50, r:24, charge:'-' },
    ],
    bonds: [[0,1,1]],
    dipole: true,
    polar: true,
    ionic: true,
  },
};

/* Estado local — resetado a cada render() */
let _loop    = null;
let _drag    = null;
let _molKey  = 'H2O';
let _atoms   = [];    // cópias mutáveis com posições canvas
let _W       = 0;
let _H       = 0;
let _exAttempts = 0;
let _exDone     = false;

/* -----------------------------------------------------------------------
   Exports
----------------------------------------------------------------------- */

const VSEPR_GEOMETRIES = [
  {
    name: 'Linear', angle: '180°', example: 'CO₂, BeH₂, C₂H₂',
    pairs: 2, lone: 0,
    desc: '2 pares ligantes, 0 pares livres. Repulsão simétrica — ângulo máximo 180°.',
    polar: 'Apolar (se grupos iguais)',
    svg: `<svg viewBox="0 0 160 60" width="160" height="60" aria-hidden="true">
      <circle cx="20" cy="30" r="12" fill="#ef476f" opacity=".8"/>
      <text x="20" y="34" text-anchor="middle" font-size="10" fill="white">O</text>
      <line x1="32" y1="30" x2="68" y2="30" stroke="#4fc3f7" stroke-width="3"/>
      <circle cx="80" cy="30" r="12" fill="#8b949e" opacity=".8"/>
      <text x="80" y="34" text-anchor="middle" font-size="10" fill="white">C</text>
      <line x1="92" y1="30" x2="128" y2="30" stroke="#4fc3f7" stroke-width="3"/>
      <circle cx="140" cy="30" r="12" fill="#ef476f" opacity=".8"/>
      <text x="140" y="34" text-anchor="middle" font-size="10" fill="white">O</text>
      <text x="80" y="56" text-anchor="middle" font-size="9" fill="#6e7681">180°</text>
    </svg>`,
  },
  {
    name: 'Angular', angle: '~104,5°', example: 'H₂O, SO₂, H₂S',
    pairs: 2, lone: 2,
    desc: '2 pares ligantes + 2 pares livres. Pares livres comprimem o ângulo abaixo de 109,5°.',
    polar: 'Polar (dipolos não se cancelam)',
    svg: `<svg viewBox="0 0 160 80" width="160" height="80" aria-hidden="true">
      <circle cx="80" cy="50" r="12" fill="#ef476f" opacity=".8"/>
      <text x="80" y="54" text-anchor="middle" font-size="10" fill="white">O</text>
      <line x1="72" y1="42" x2="44" y2="22" stroke="#e6edf3" stroke-width="2.5"/>
      <circle cx="36" cy="16" r="10" fill="#e6edf3" opacity=".8"/>
      <text x="36" y="20" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <line x1="88" y1="42" x2="116" y2="22" stroke="#e6edf3" stroke-width="2.5"/>
      <circle cx="124" cy="16" r="10" fill="#e6edf3" opacity=".8"/>
      <text x="124" y="20" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <text x="80" y="72" text-anchor="middle" font-size="9" fill="#6e7681">104,5°</text>
    </svg>`,
  },
  {
    name: 'Trigonal plana', angle: '120°', example: 'BF₃, SO₃, NO₃⁻',
    pairs: 3, lone: 0,
    desc: '3 pares ligantes, 0 livres. Ângulos iguais de 120° no plano.',
    polar: 'Apolar (se grupos iguais)',
    svg: `<svg viewBox="0 0 160 100" width="160" height="100" aria-hidden="true">
      <circle cx="80" cy="50" r="12" fill="#8b949e" opacity=".8"/>
      <text x="80" y="54" text-anchor="middle" font-size="9" fill="white">B</text>
      <line x1="80" y1="38" x2="80" y2="14" stroke="#6bcb77" stroke-width="2.5"/>
      <circle cx="80" cy="10" r="9" fill="#6bcb77" opacity=".9"/>
      <text x="80" y="14" text-anchor="middle" font-size="8" fill="#0d1117">F</text>
      <line x1="69" y1="56" x2="46" y2="80" stroke="#6bcb77" stroke-width="2.5"/>
      <circle cx="40" cy="86" r="9" fill="#6bcb77" opacity=".9"/>
      <text x="40" y="90" text-anchor="middle" font-size="8" fill="#0d1117">F</text>
      <line x1="91" y1="56" x2="114" y2="80" stroke="#6bcb77" stroke-width="2.5"/>
      <circle cx="120" cy="86" r="9" fill="#6bcb77" opacity=".9"/>
      <text x="120" y="90" text-anchor="middle" font-size="8" fill="#0d1117">F</text>
      <text x="80" y="96" text-anchor="middle" font-size="9" fill="#6e7681">120°</text>
    </svg>`,
  },
  {
    name: 'Piramidal', angle: '~107°', example: 'NH₃, PCl₃, NF₃',
    pairs: 3, lone: 1,
    desc: '3 pares ligantes + 1 par livre. O par livre empurra os ligantes para baixo.',
    polar: 'Polar (par livre cria assimetria)',
    svg: `<svg viewBox="0 0 160 100" width="160" height="100" aria-hidden="true">
      <circle cx="80" cy="30" r="12" fill="#4fc3f7" opacity=".8"/>
      <text x="80" y="34" text-anchor="middle" font-size="10" fill="#0d1117">N</text>
      <line x1="80" y1="42" x2="80" y2="68" stroke="#e6edf3" stroke-width="2.5"/>
      <circle cx="80" cy="74" r="10" fill="#e6edf3" opacity=".8"/>
      <text x="80" y="78" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <line x1="70" y1="38" x2="46" y2="65" stroke="#e6edf3" stroke-width="2.5"/>
      <circle cx="40" cy="72" r="10" fill="#e6edf3" opacity=".8"/>
      <text x="40" y="76" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <line x1="90" y1="38" x2="114" y2="65" stroke="#e6edf3" stroke-width="2.5"/>
      <circle cx="120" cy="72" r="10" fill="#e6edf3" opacity=".8"/>
      <text x="120" y="76" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <text x="80" y="96" text-anchor="middle" font-size="9" fill="#6e7681">107°</text>
    </svg>`,
  },
  {
    name: 'Tetraédrica', angle: '109,5°', example: 'CH₄, CCl₄, SiH₄',
    pairs: 4, lone: 0,
    desc: '4 pares ligantes, 0 livres. Ângulo máximo de separação no espaço 3D.',
    polar: 'Apolar (se grupos iguais)',
    svg: `<svg viewBox="0 0 160 100" width="160" height="100" aria-hidden="true">
      <circle cx="80" cy="50" r="12" fill="#8b949e" opacity=".8"/>
      <text x="80" y="54" text-anchor="middle" font-size="10" fill="white">C</text>
      <line x1="80" y1="38" x2="80" y2="12" stroke="#e6edf3" stroke-width="2"/>
      <circle cx="80" cy="8"  r="9" fill="#e6edf3" opacity=".8"/>
      <text x="80" y="12" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <line x1="70" y1="58" x2="42" y2="78" stroke="#e6edf3" stroke-width="2"/>
      <circle cx="36" cy="84" r="9" fill="#e6edf3" opacity=".8"/>
      <text x="36" y="88" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <line x1="90" y1="58" x2="118" y2="78" stroke="#e6edf3" stroke-width="2"/>
      <circle cx="124" cy="84" r="9" fill="#e6edf3" opacity=".8"/>
      <text x="124" y="88" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <line x1="68" y1="50" x2="36" y2="44" stroke="#e6edf3" stroke-width="2" stroke-dasharray="4,3"/>
      <circle cx="30" cy="42" r="9" fill="#e6edf3" opacity=".8"/>
      <text x="30" y="46" text-anchor="middle" font-size="9" fill="#0d1117">H</text>
      <text x="80" y="98" text-anchor="middle" font-size="9" fill="#6e7681">109,5°</text>
    </svg>`,
  },
];

const EXERCISES = [
  { q: 'NaCl é uma ligação iônica porque:', opts: ['Na é metal','Diferença de eletronegatividade Δχ > 1,7 — há transferência de e⁻','Cl é não-metal','O sal é sólido'], ans: 1, exp: 'Δχ(Cl-Na) = 3,16 - 0,93 = 2,23 > 1,7. Na doa e⁻ → Na⁺; Cl aceita e⁻ → Cl⁻. Atração eletrostática.', hint: 'O critério de ligação iônica é Δχ > 1,7 (escala de Pauling).' },
  { q: 'H₂O é polar e CO₂ é apolar porque:', opts: ['H₂O tem O mais eletronegativo','CO₂ tem simetria linear que cancela os dipolos; H₂O é angular e os dipolos não se cancelam','H₂O tem duas ligações','CO₂ é gás'], ans: 1, exp: 'CO₂ (D∞h): dois dipolos C=O opostos se cancelam. H₂O (C₂ᵥ, ângulo 104,5°): dipolos O-H não se cancelam → μ ≠ 0.', hint: 'Geometria linear com ligações polares → dipolos se cancelam ou não?' },
  { q: 'Qual substância tem o maior ponto de ebulição?', opts: ['CH₄ (M=16)','NH₃ (M=17)','HF (M=20)','H₂O (M=18)'], ans: 3, exp: 'H₂O tem as ligações de hidrogênio mais fortes (O-H…O). Dois pares doadores e dois aceptores. μ = 1,85 D.', hint: 'Qual molécula tem maior número de pontes H e dipolo maior?' },
  { q: 'Na TOM, a ordem de ligação do N₂ é:', opts: ['1','2','3','4'], ans: 2, exp: 'N₂: (σ1s)²(σ*1s)²(σ2s)²(σ*2s)²(π2p)⁴(σ2p)². OL = (8-2)/2 = 3. Tripla ligação, mais forte de todas as moléculas diatômicas.', hint: 'OL = (e⁻ ligantes - e⁻ antiligantes)/2. Conte os elétrons nos OMs de N₂.' },
  { q: 'sp³ descreve hibridização do carbono em:', opts: ['Benzeno','Etileno (C₂H₄)','Metano (CH₄)','Etino (C₂H₂)'], ans: 2, exp: 'CH₄: C tem 4 ligações σ → sp³ (4 orbitais híbridos). C₂H₄: sp² (3 σ + 1 π). Benzeno: sp² (deslocalizado). C₂H₂: sp.', hint: 'sp³ = 4 σ. sp² = 3 σ + 1 π. sp = 2 σ + 2 π.' },,
  { q:'Qual molécula tem geometria angular e momento dipolar diferente de zero?', opts:['CO₂','BF₃','H₂O','CCl₄'], ans:2, exp:'H₂O: geometria angular (2 pares ligantes + 2 não-ligantes no O). Os dipolos O-H não se cancelam → momento dipolar resultante ≠ 0. CO₂, BF₃ e CCl₄ têm geometrias simétricas com dipolos que se cancelam.', hint:'A simetria da molécula cancela ou não os vetores dipolo.' },
  { q:'Numa ligação iônica NaCl, o que ocorre com os elétrons de valência do Na?', opts:['São compartilhados igualmente','O Na doa 1 e⁻ ao Cl; ambos ficam com configuração de gás nobre','O Cl doa 1 e⁻ ao Na','Os elétrons são deslocalizados em banda metálica'], ans:1, exp:'Na (3s¹) doa 1 e⁻ → Na⁺ ([Ne]). Cl (3s²3p⁵) ganha 1 e⁻ → Cl⁻ ([Ar]). A força eletrostática Na⁺···Cl⁻ é a ligação iônica. Sem compartilhamento — transferência completa.', hint:'Iônica = transferência; covalente = compartilhamento.' },
  { q:'O SF₆ tem 6 ligações S-F com geometria octaédrica e momento dipolar zero. Por quê?', opts:['S e F têm a mesma eletronegatividade','Os 6 vetores dipolo S-F são iguais e se cancelam pela simetria Oh','A ligação S-F é apolar','SF₆ é uma molécula linear'], ans:1, exp:'Cada ligação S-F é polar (F muito mais eletronegativo). Mas com simetria octaédrica (Oh), os 6 vetores se cancelam completamente → μ = 0. Geometria simétrica com ligações polares idênticas = molécula apolar.', hint:'Mesmo com ligações polares, simetria perfeita cancela os dipolos.' },
  { q:'A hibridização do carbono no etileno (C₂H₄) é:', opts:['sp³','sp²','sp','sp³d'], ans:1, exp:'Cada C em C₂H₄ faz 3 ligações sigma (2 C-H + 1 C=C parte sigma) → 3 grupos → sp². O p não-hibridizado forma a ligação π da dupla. Ângulo H-C-H ≈ 120°, molécula plana.', hint:'Conta os grupos ao redor do C (ligações sigma + pares não-ligantes). 3 grupos = sp².' },
  { q:'Por que o ponto de ebulição da água (100°C) é muito maior que o do H₂S (-60°C)?', opts:['H₂O é mais pesada','H₂O forma ligações de hidrogênio (O-H···O) muito mais fortes que as forças de dispersão do H₂S','H₂S tem ligações iônicas','O oxigênio é mais eletronegativo que o S e forma ligações covalentes mais curtas'], ans:1, exp:'O (alta EN, átomo pequeno) forma ligações de H O-H···O fortes (20-25 kJ/mol). S (menor EN, átomo maior) não forma ligações de H significativas com H₂S. As forças de dispersão do H₂S são fracas. Resultado: água precisa de muito mais energia para ferver.', hint:'Ligações de hidrogênio só ocorrem com N-H, O-H e F-H.' },
  { q:'A energia de ligação da tripla C≡C (835 kJ/mol) é maior que 3× a energia da ligação simples C-C (346 kJ/mol). Isso indica:', opts:['A ligação tripla é 2,4× mais forte que a simples, não 3×','O cálculo está errado','Ligações simples e duplas têm a mesma energia','Ligações π são mais fortes que ligações sigma'], ans:0, exp:'C-C simples: 346 kJ/mol. 3× = 1038. Mas C≡C real = 835 kJ/mol. Razão: as ligações π são mais fracas que a ligação sigma (menor sobreposição lateral dos orbitais p). A tripla ligação é mais forte, mas não linearmente.', hint:'Sigma (sobreposição frontal) > Pi (sobreposição lateral). Por isso π < σ em energia.' },
  { q:'Qual das seguintes espécies tem estrutura com par de elétrons não-ligantes que causa geometria diferente da molecular?', opts:['CH₄ (tetrahedral)','BH₃ (trigonal plana)','NH₃ (piramidal triangular — par não-ligante no N)','BeCl₂ (linear)'], ans:2, exp:'NH₃: N tem 4 grupos (3 ligantes H + 1 par não-ligante) → geometria eletrônica tetraédrica. Mas a geometria molecular ignora o par não-ligante → piramidal triangular. O par não-ligante comprime o ângulo H-N-H para ~107° (< 109,5°).', hint:'Geometria eletrônica conta pares não-ligantes; geometria molecular, não.' },
  { q:'Na TOM (teoria dos orbitais moleculares) do O₂, a ordem de ligação é 2 e ele é paramagnético porque:', opts:['Tem dois elétrons desemparelhados nos orbitais π* antiligantes','Tem 4 ligações sigma','Os orbitais d do O participam da ligação','Os elétrons de O₂ estão todos emparelhados'], ans:0, exp:'Diagrama TOM do O₂: (σ1s)²(σ*1s)²(σ2s)²(σ*2s)²(σ2p)²(π2p)⁴(π*2p)². Os 2 e⁻ nos dois π* degenerados ficam um em cada (Hund) → 2 e⁻ desemparelhados → paramagnetismo. Ordem ligação = (8-4)/2 = 2.', hint:'Ordem de ligação = (e⁻ ligantes - e⁻ antiligantes) / 2.' },
  { q:'Qual é a força intermolecular predominante entre moléculas de I₂?', opts:['Ligação de hidrogênio','Dipolo permanente','Forças de dispersão de London','Ligação iônica'], ans:2, exp:'I₂ é apolar (mesma eletronegatividade em ambos os átomos). Sem dipolo permanente e sem H ligado a F/O/N. A única força é dipolo instantâneo-induzido (dispersão de London). I₂ é sólido à temperatura ambiente porque I é grande e muito polarizável → forças de London intensas.', hint:'Moléculas apolares só têm forças de dispersão de London.' },
  { q:'A ligação metálica explica a ductilidade dos metais porque:', opts:['Os elétrons formam ligações direcionais fortes','Os cátions metálicos podem deslizar sem romper o "mar de elétrons"','Os metais têm estrutura covalente em rede','Os prótons do núcleo repelem uns aos outros permitindo deformação'], ans:1, exp:'Na ligação metálica, cátions positivos estão imersos em "mar de elétrons" deslocalizados. Ao aplicar força, os planos de cátions deslizam — os elétrons se redistribuem sem romper a ligação. Em iônico, o deslizamento aproximaria cargas iguais → repulsão → fratura.', hint:'Compara com sólido iônico: por que NaCl quebra ao ser martelado enquanto Cu achata?' }
];
let _exIdx = 0;

export function render(outlet) {
  // Limpar loop anterior se existir
  if (_loop) { _loop.stop(); _loop = null; }
  _drag    = null;
  _molKey  = 'H2O';
  _atoms   = [];
  _exIdx = 0;
  _exAttempts = 0;
  _exDone     = false;

  outlet.innerHTML = _buildHTML();
  _initCanvas();
  _bindEvents();
  _initMO();
  _initPolarity();
  _initExercises();
  markSectionDone('chemical-bonds', 'visited');
}


function _initMO() {
  // MO Theory tabs
    const MO_DATA = {'H2': {'config': '(σ1s)²', 'elig': 2, 'eanti': 0, 'bond': 1, 'mag': 'Diamagnético', 'note': 'Mais simples: 2e⁻ no OM ligante σ1s.'}, 'He2': {'config': '(σ1s)²(σ*1s)²', 'elig': 2, 'eanti': 2, 'bond': 0, 'mag': 'Diamagnético', 'note': 'OL=0: He₂ não existe estável em condições normais.'}, 'N2': {'config': '(σ2s)²(σ*2s)²(π2p)⁴(σ2p)²', 'elig': 8, 'eanti': 2, 'bond': 3, 'mag': 'Diamagnético', 'note': 'Ligação tripla: a mais forte e curta entre elementos 2p (945 kJ/mol).'}, 'O2': {'config': '(σ2s)²(σ*2s)²(σ2p)²(π2p)⁴(π*2p)²', 'elig': 8, 'eanti': 4, 'bond': 2, 'mag': 'Paramagnético (2e⁻)', 'note': '2e⁻ desemparelhados nos π*2p — paramagnético! Lewis prevê ligação dupla mas não o paramagnetismo.'}, 'F2': {'config': '(σ2s)²(σ*2s)²(σ2p)²(π2p)⁴(π*2p)⁴', 'elig': 8, 'eanti': 6, 'bond': 1, 'mag': 'Diamagnético', 'note': 'OL=1 apesar de muitos e⁻ antiligantes. Ligação F-F fraca (155 kJ/mol) — π* cheio.'}, 'NO': {'config': '(σ2s)²(σ*2s)²(σ2p)²(π2p)⁴(π*2p)¹', 'elig': 8, 'eanti': 3, 'bond': 2.5, 'mag': 'Paramagnético (1e⁻)', 'note': 'OL=2,5 — semi-ligação extra. Radical estável. Neurotransmissor e vasodilatador (Viagra e nitroglicerina liberam NO).'}};
    function renderMO(key) {
      const m = MO_DATA[key];
      const container = document.getElementById('mo-content');
      if(!container || !m) return;
      container.innerHTML = `
        <div style="display:flex;align-items:baseline;gap:1rem;flex-wrap:wrap;margin-bottom:.5rem">
          <span style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron)">${m.config}</span>
        </div>
        <div style="display:flex;gap:1.5rem;flex-wrap:wrap;margin-bottom:.5rem">
          <span style="font-size:var(--text-sm)">e⁻ ligantes: <strong style="color:var(--accent-organic)">${m.elig}</strong></span>
          <span style="font-size:var(--text-sm)">e⁻ antiligantes: <strong style="color:var(--accent-reaction)">${m.eanti}</strong></span>
          <span style="font-size:var(--text-sm)">Ordem de ligação: <strong style="color:var(--accent-electron)">${m.bond}</strong></span>
        </div>
        <p style="font-size:var(--text-sm);color:var(--accent-bond);margin:.2rem 0">${m.mag}</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.4rem 0 0">${m.note}</p>
      `;
      Object.keys(MO_DATA).forEach(k => {
        const btn = document.getElementById('mo-tab-'+k);
        if(btn) btn.className='btn btn-xs '+(k===key?'btn-secondary':'btn-ghost');
      });
    }
    renderMO('H2');
    Object.keys(MO_DATA).forEach(k => {
      document.getElementById('mo-tab-'+k)?.addEventListener('click', ()=>renderMO(k));
    });
}

// ---------------------------------------------------------------------------
// Polaridade interativa
// ---------------------------------------------------------------------------
let _polLastField = 'b';  // próximo preset vai para b

function _initPolarity() {
  const frame  = document.getElementById('pol-frame');
  const canvas = document.getElementById('pol-canvas');
  if (!canvas || !frame) return;

  const W   = Math.min(frame.clientWidth || 480, 480);
  const H   = 110;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  function draw(xa, xb) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    const delta = Math.abs(xa - xb);
    // Fração de carga no átomo B (mais eletronegativo): 0 = apolar, 1 = iônico
    const frac  = Math.min(1, delta / 3.5);  // normaliza 0-3.5
    const cx    = W / 2, cy = H / 2;
    const rBond = W * 0.32;

    // Nuvem eletrônica (gradiente deslocado)
    const offset = frac * rBond * 0.5;  // deslocamento em direção ao mais eletronegativo
    const moreElec = xa >= xb ? -1 : 1; // direção do átomo mais eletronegativo
    const cloudCx  = cx + moreElec * offset;

    const grad = ctx.createRadialGradient(cloudCx, cy, 2, cloudCx, cy, rBond * 0.9);
    grad.addColorStop(0,   `rgba(79,195,247,${0.15 + frac * 0.25})`);
    grad.addColorStop(0.5, `rgba(79,195,247,${0.08 + frac * 0.12})`);
    grad.addColorStop(1,   'rgba(79,195,247,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cloudCx, cy, rBond * 0.9, H * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ligação
    const ax = cx - rBond * 0.7, bx = cx + rBond * 0.7;
    const bondType = delta < 0.4 ? 'apolar' : delta < 1.7 ? 'polar' : 'iônica';
    ctx.strokeStyle = bondType === 'iônica' ? '#ef476f99' : 'rgba(200,200,200,0.4)';
    ctx.lineWidth   = 2.5;
    ctx.setLineDash(bondType === 'iônica' ? [6,4] : []);
    ctx.beginPath(); ctx.moveTo(ax, cy); ctx.lineTo(bx, cy); ctx.stroke();
    ctx.setLineDash([]);

    // Átomos
    const rA = 16 + xa * 3, rB = 16 + xb * 3;
    [[ax, xa, '#ffd166', 'A'], [bx, xb, '#4fc3f7', 'B']].forEach(([x, chi, col, lbl]) => {
      ctx.beginPath();
      ctx.arc(x, cy, 16 + chi * 3, 0, Math.PI * 2);
      ctx.fillStyle = col + 'cc';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lbl, x, cy);
      ctx.textBaseline = 'alphabetic';
      // chi label
      ctx.fillStyle = col;
      ctx.font = '9px sans-serif';
      ctx.fillText('χ=' + chi.toFixed(2), x, cy - 22 - chi * 3);
    });

    // Dipole arrow (if polar)
    if (delta >= 0.4) {
      const arrowDir = xa >= xb ? -1 : 1;  // aponta para mais eletroneg.
      const arrowLen = Math.min(rBond * 0.5, delta * 18);
      const arrowX   = cx + arrowDir * arrowLen / 2;
      ctx.strokeStyle = '#6bcb77bb';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(cx - arrowDir * arrowLen / 2, cy + 24);
      ctx.lineTo(arrowX, cy + 24);
      ctx.stroke();
      // arrowhead
      ctx.fillStyle = '#6bcb77bb';
      ctx.beginPath();
      ctx.moveTo(arrowX, cy + 20);
      ctx.lineTo(arrowX + arrowDir * 8, cy + 24);
      ctx.lineTo(arrowX, cy + 28);
      ctx.fill();
      ctx.fillStyle = '#6bcb77';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('μ', cx, cy + 36);
    }
  }

  function update() {
    const xa    = parseFloat(document.getElementById('pol-xa')?.value ?? 2.5);
    const xb    = parseFloat(document.getElementById('pol-xb')?.value ?? 0.9);
    const delta = Math.abs(xa - xb);
    let type, color;
    if      (delta < 0.4)  { type = 'Apolar covalente'; color = 'var(--accent-organic)'; }
    else if (delta < 1.7)  { type = 'Polar covalente';  color = 'var(--accent-electron)'; }
    else                   { type = 'Iônica';            color = 'var(--accent-reaction)'; }

    const mu = delta < 0.4 ? '≈ 0' : (delta * 0.95).toFixed(2);  // estimativa grosseira

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    document.getElementById('pol-xa-val').textContent = xa.toFixed(2);
    document.getElementById('pol-xb-val').textContent = xb.toFixed(2);
    set('pol-delta', delta.toFixed(2));
    const typeEl = document.getElementById('pol-type');
    if (typeEl) { typeEl.textContent = type; typeEl.style.color = color; }
    set('pol-mu', mu);
    draw(xa, xb);
  }

  document.getElementById('pol-xa')?.addEventListener('input', update);
  document.getElementById('pol-xb')?.addEventListener('input', update);

  // Presets de elementos
  document.querySelectorAll('[data-chi]').forEach(btn => {
    btn.addEventListener('click', () => {
      const chi = btn.dataset.chi;
      const target = _polLastField === 'a' ? 'pol-xb' : 'pol-xa';
      const targetOut = _polLastField === 'a' ? 'pol-xb-val' : 'pol-xa-val';
      _polLastField = _polLastField === 'a' ? 'b' : 'a';
      const sl = document.getElementById(target);
      if (sl) { sl.value = chi; }
      update();
    });
  });

  update();
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
          markSectionDone('chemical-bonds', 'exercise');
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

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
  _drag = null;
}

/* -----------------------------------------------------------------------
   HTML
----------------------------------------------------------------------- */
function _buildHTML() {
  const molButtons = Object.entries(MOLECULES).map(([k, m]) =>
    `<button class="atom-btn ${k === _molKey ? 'active' : ''}"
             data-mol="${esc(k)}">${esc(m.label)}</button>`
  ).join('');

  return `
<div class="module-page" id="module-cb">
  <button class="module-back btn-ghost" data-nav="/modules">
    &#8592; Módulos
  </button>

  <header class="module-header">
    <h1 class="module-title">Ligações Químicas</h1>
    <p class="module-concept">
      Os átomos se unem para atingir configuração eletrônica estável.
      O tipo de ligação depende da diferença de eletronegatividade entre os átomos:
      covalente (compartilham elétrons), iônica (transferem elétrons) ou metálica.
      Arraste os átomos para explorar a geometria molecular.
    </p>
  </header>

    <!-- Teoria de Orbitais Moleculares (TOM) -->
  <section class="module-section">
    <h2 class="module-section-title">Teoria dos Orbitais Moleculares (TOM)</h2>
    <p class="module-text">
      Enquanto a Teoria de Lewis descreve ligações como pares de elétrons localizados,
      a TOM trata os elétrons como ondas que se estendem por toda a molécula. Orbitais
      atômicos se combinam por combinação linear (LCAO) quando têm <em>energia compatível</em>
      e <em>simetria compatível</em>, formando dois orbitais moleculares: um
      <strong>ligante</strong> (combinação construtiva — menor energia, elétron entre os
      núcleos, estabiliza a ligação) e um <strong>antiligante</strong> (combinação destrutiva,
      indicado com *, maior energia, desestabiliza). A ordem de ligação é
      (e⁻ ligantes - e⁻ antiligantes)/2.
    </p>
    <p class="module-text">
      O poder preditivo da TOM vai além da Lewis: explica o paramagnetismo do O₂
      (dois elétrons desemparelhados nos orbitais π* degenrados — imprevisível pela Lewis),
      a existência de He₂⁺ (ordem de ligação 0,5) e a extrema estabilidade do N₂
      (tripla ligação, ordem 3, HOMO-LUMO gap de 10,8 eV). O HOMO (Highest Occupied MO)
      e o LUMO (Lowest Unoccupied MO) determinam a reatividade: o HOMO doa elétrons
      (base de Lewis/nucleófilo) e o LUMO os aceita (ácido de Lewis/eletrófilo).
      A diferença HOMO-LUMO determina a cor: benzeno absorve UV (~270 nm); β-caroteno
      absorve azul (~450 nm, HOMO-LUMO pequeno por cadeia conjugada longa).
    </p>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));margin-bottom:1rem">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Ordem de ligação</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">OL = (e⁻ lig - e⁻ antilig) / 2</p>
        <p style="font-size:var(--text-sm);margin-top:.4rem">OL = 0: molécula não existe (He₂). OL = 1: ligação simples (H₂). OL = 2: dupla (O₂). OL = 3: tripla (N₂). Maior OL = ligação mais curta e forte.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Paramagnetismo</h3>
        <p style="font-size:var(--text-sm)">Elétrons desemparelhados → paramagnético (atraído por campo magnético). O₂ tem 2 e⁻ desemparelhados (πg*) — paramagnético. N₂: todos emparelhados — diamagnético. Lewis não prevê o paramagnetismo do O₂; a TOM prevê.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Hibridização</h3>
        <p style="font-size:var(--text-sm)">Orbitais atômicos se misturam antes de formar ligações: sp (linear, 180°), sp² (trigonal, 120°), sp³ (tetraédrico, 109,5°), sp³d (bipiramidal), sp³d² (octaédrico). O número de grupos ligantes + pares livres = hibridização.</p>
      </div>
    </div>

    <div id="mo-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.75rem">
      <button class="btn btn-xs btn-secondary" id="mo-tab-H2" data-mo="H2">H₂</button>
      <button class="btn btn-xs btn-ghost" id="mo-tab-He2" data-mo="He2">He₂</button>
      <button class="btn btn-xs btn-ghost" id="mo-tab-N2" data-mo="N2">N₂</button>
      <button class="btn btn-xs btn-ghost" id="mo-tab-O2" data-mo="O2">O₂</button>
      <button class="btn btn-xs btn-ghost" id="mo-tab-F2" data-mo="F2">F₂</button>
      <button class="btn btn-xs btn-ghost" id="mo-tab-NO" data-mo="NO">NO</button>
    </div>
    <div id="mo-content" class="info-card" style="background:var(--bg-raised)"></div>
  </section>

<section class="module-section">
    <h2 class="module-section-title">Visualização interativa</h2>
    <div class="sim-panel">
      <div class="molecule-toolbar" id="mol-selector" role="group" aria-label="Selecionar molécula">
        ${molButtons}
      </div>
      <div class="canvas-frame" id="bond-canvas-frame">
        <canvas id="bond-canvas" aria-label="Visualização da molécula"></canvas>
        <span class="canvas-label">Arraste os átomos</span>
      </div>
      <div id="bond-info" class="info-card"></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Polaridade e dipolos</h2>
    <p class="module-text">
      Uma ligação covalente é polar quando os dois átomos têm eletronegatividades diferentes:
      o mais eletronegativo atrai a densidade eletrônica, criando uma distribuição assimétrica
      de carga. A polaridade da <em>ligação</em> não implica polaridade da <em>molécula</em>:
      o CO₂ tem duas ligações C=O polares, mas os dipolos são antiparalelos e se cancelam —
      a molécula é apolar (D∞h). O H₂O tem duas ligações O–H polares e dipolos que
      <em>não</em> se cancelam (ângulo H-O-H ≈ 104,5°) — molécula polar (μ = 1,85 D).
      Critério: molécula apolar se tem centro de inversão i OU todos os dipolos de ligação
      se cancelam por simetria.
    </p>
    <div class="info-card">
      <h3>O que determina a polaridade de uma molécula?</h3>
      <p>Dois fatores em conjunto: a <strong>polaridade das ligações</strong> (diferença de
      eletronegatividade) e a <strong>geometria molecular</strong>. Uma molécula pode ter ligações
      polares e ainda ser apolar se a simetria cancelar os dipolos (CO₂, CH₄).</p>
    </div>
    <div class="info-card" style="margin-top:var(--space-4)">
      <h3>Ligação metálica</h3>
      <p>Em metais, os elétrons de valência não pertencem a átomos individuais — formam um
      "mar de elétrons" que percorre o cristal. Isso explica condutividade elétrica, maleabilidade
      e brilho metálico.</p>
    </div>
  </section>

  <!-- HIBRIDIZAÇÃO FORMAL -->
  <section class="module-section">
    <h2 class="module-section-title">Hibridização de orbitais</h2>
    <p class="module-text">
      Antes de formar ligações, orbitais atômicos do átomo central se combinam
      (hibridizam) originando um conjunto de orbitais equivalentes.
      O tipo de hibridização determina a <strong>geometria eletrônica</strong> e os
      <strong>ângulos de ligação</strong>. Regra: nº de grupos (ligantes + pares livres) =
      nº de orbitais híbridos.
    </p>
    <div style="overflow-x:auto;margin-bottom:var(--space-4)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Hibridização</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Orbitais misturados</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Geometria eletrônica</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Ângulo</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Exemplos</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['sp',    '1s + 1p',         'linear',              '180°',     'CO₂, C₂H₂, BeCl₂'],
            ['sp²',   '1s + 2p',         'trigonal plana',      '120°',     'C₂H₄, BF₃, CO₃²⁻, benzeno'],
            ['sp³',   '1s + 3p',         'tetraédrica',         '109,5°',   'CH₄, NH₃, H₂O, CCl₄'],
            ['sp³d',  '1s + 3p + 1d',    'bipiramidal trig.',   '90°/120°', 'PCl₅, SF₄, ClF₃'],
            ['sp³d²', '1s + 3p + 2d',    'octaédrica',          '90°',      'SF₆, XeF₄, PF₆⁻'],
          ].map(([h,orb,geo,ang,ex]) => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;font-weight:700;font-size:var(--text-base);color:var(--accent-electron)">${h}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${orb}</td>
            <td style="padding:.4rem .6rem;color:var(--accent-organic)">${geo}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-bond)">${ang}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-secondary)">${ex}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Ligações σ e π</h3>
        <p style="font-size:var(--text-sm)">Ligações simples = 1σ. Duplas = 1σ + 1π. Triplas = 1σ + 2π. Orbitais híbridos formam σ (cabeça a cabeça). Orbitais p não-híbridos restantes formam π (sobreposição lateral). Por isso C₂H₄ é plana: 3 grupos → sp², 1 orbital p disponível para π.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Pares livres e geometria</h3>
        <p style="font-size:var(--text-sm)">Pares livres ocupam orbitais híbridos mas não aparecem na geometria molecular. NH₃: sp³ (4 grupos = 3 H + 1 par) → piramidal trigonal, ângulo 107° (par livre comprime). H₂O: sp³ (2 H + 2 pares) → angular, ângulo 104,5°.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Ressonância e deslocalização</h3>
        <p style="font-size:var(--text-sm)">Quando há mais de uma estrutura de Lewis válida, os elétrons π são delocalizados. Benzeno: 6 orbitais p formam 3 OM π deslocalizados → anéis π acima e abaixo do plano. Estabilização extra (energia de ressonância ≈ 150 kJ/mol).</p>
      </div>
    </div>
  </section>

  <!-- FORÇAS INTERMOLECULARES -->
  <section class="module-section">
    <h2 class="module-section-title">Forças intermoleculares</h2>
    <p class="module-text">
      As forças intermoleculares (FIM) são fundamentalmente interações eletrostáticas entre
      distribuições de carga permanentes ou induzidas. Elas determinam pontos de fusão,
      ebulição, solubilidade, viscosidade e tensão superficial. Em ordem crescente de energia:
      dispersão de London (0,5–40 kJ/mol) &lt; Debye/indução (1–10 kJ/mol) &lt;
      dipolo-dipolo Keesom (3–25 kJ/mol) &lt; ligação de hidrogênio (10–40 kJ/mol) &lt;
      interações íon-dipolo (40–600 kJ/mol) &lt; iônicas (150–1000 kJ/mol).
      Ligações de H são mais fortes que outras FIM pelo tamanho diminuto do H (alta densidade
      de carga), distância curta N/O/F–H e orientação direcional.
    </p>
    <p class="module-text">
      As propriedades físicas de substâncias (PE, PF, viscosidade, solubilidade) dependem
      das <strong>forças intermoleculares</strong> — interações entre moléculas distintas,
      sempre mais fracas que ligações covalentes internas. Moléculas polares e com LH
      têm maiores PE/PF.
    </p>
    <div style="overflow-x:auto;margin-bottom:var(--space-5)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Tipo</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Condição</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Energia típica</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Exemplos</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['London (dispersão)', 'Toda molécula (dipolo instantâneo/induzido)', '0,1–40 kJ/mol', 'N₂, noble gases, CH₄, I₂'],
            ['Dipolo-dipolo (Keesom)', 'Moléculas polares (μ ≠ 0)', '3–25 kJ/mol', 'HCl, SO₂, acetona, ésteres'],
            ['Dipolo-dipolo induzido (Debye)', 'Polar + apolar polarizável', '1–10 kJ/mol', 'O₂ em H₂O, I₂ em etanol'],
            ['Ligação de hidrogênio (LH)', 'H ligado a N, O ou F; outro N/O/F aceita', '10–40 kJ/mol', 'H₂O, HF, NH₃, DNA, proteínas'],
            ['Íon-dipolo', 'Íon + molécula polar', '40–600 kJ/mol', 'NaCl em H₂O (hidratação)'],
            ['Íon-íon (não FIM)', 'Íons opostos', '100–1000 kJ/mol', 'NaCl, MgO (rede iônica)'],
          ].map(([t,c,e,ex]) => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-weight:600;color:var(--accent-electron)">${t}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-secondary)">${c}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-bond)">${e}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${ex}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- Comparador de PE via FIM -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Comparador de ponto de ebulição — efeito das FIM
    </h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:var(--space-3);margin-bottom:var(--space-4)">
      ${[
        {name:'He',      bp: -269, fim:'London (fraca)',   mm: 4,  color:'#555'},
        {name:'Ne',      bp: -246, fim:'London',           mm:20,  color:'#555'},
        {name:'CH₄',     bp: -161, fim:'London',           mm:16,  color:'#b0b8c1'},
        {name:'HCl',     bp:  -85, fim:'Dipolo-dipolo',   mm:36.5,color:'#ffd166'},
        {name:'NH₃',     bp:  -33, fim:'LH (N–H⋯N)',      mm:17,  color:'#6bcb77'},
        {name:'HF',      bp:   19, fim:'LH forte (F–H⋯F)',mm:20,  color:'#a78bfa'},
        {name:'H₂O',     bp:  100, fim:'LH rede 3D',      mm:18,  color:'#4fc3f7'},
        {name:'Etanol',  bp:   78, fim:'LH + dipolo',     mm:46,  color:'#ef476f'},
      ].map(m => `
      <div class="info-card" style="padding:var(--space-3)">
        <div style="font-family:monospace;font-size:var(--text-base);font-weight:700;color:${m.color}">${m.name}</div>
        <div style="font-size:var(--text-xs);color:var(--text-muted);margin:.2rem 0">PE: <strong style="color:var(--accent-bond)">${m.bp}°C</strong></div>
        <div style="font-size:var(--text-xs);color:var(--text-secondary)">${m.fim}</div>
      </div>`).join('')}
    </div>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Anomalia da água</h3>
        <p style="font-size:var(--text-sm)">H₂O tem PE de 100°C — muito acima do esperado para Mm=18 (compare: H₂S Mm=34, PE=-60°C). A rede tridimensional de LH, com cada molécula podendo fazer até 4 LH (2 como doadora, 2 como aceitadora), eleva dramaticamente a energia coesiva.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">London cresce com Mm</h3>
        <p style="font-size:var(--text-sm)">Moléculas maiores têm mais elétrons → polarizabilidade maior → dipolo instantâneo maior → London mais forte. Ex: noble gases: He(-269°C) &lt; Ne(-246°C) &lt; Ar(-186°C) &lt; Kr(-153°C) &lt; Xe(-108°C). Halogênios: F₂(-188°C) → I₂(+184°C).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Solubilidade: "like dissolves like"</h3>
        <p style="font-size:var(--text-sm)">Polar dissolve polar (água dissolve sal/açúcar: interações íon-dipolo e LH superam a rede). Apolar dissolve apolar (hexano dissolve gordura: London-London). Etanol é miscível em água (tem –OH) e em hexano (tem cadeia C₂).</p>
      </div>
    </div>
  </section>


  <section class="module-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/5)</h2>
    <div class="exercise-card">
      <p class="exercise-question" id="ex-question">
        O <strong>CO₂</strong> possui ligações covalentes polares (C–O).
        Por que a molécula como um todo é classificada como <strong>apolar</strong>?
      </p>
      <div class="exercise-options" id="cb-ex-options" role="group">
        ${[
          'Porque C e O têm a mesma eletronegatividade',
          'Porque a geometria linear cancela os dipolos das ligações',
          'Porque a ligação dupla anula a polaridade',
          'Porque CO₂ é um óxido — óxidos são sempre apolares',
        ].map(o => `<button class="exercise-option" data-answer="${esc(o)}">${esc(o)}</button>`).join('')}
      </div>
      <div class="hint-box" id="cb-ex-hint"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next" style="margin-top:1rem;display:none">Próximo exercício &#8594;</button>
      <div class="exercise-feedback" id="cb-ex-feedback"></div>
      <div class="exercise-actions">
        <button class="btn btn-secondary btn-sm" id="cb-btn-hint">Usar dica</button>
        <button class="btn btn-primary btn-sm"   id="cb-btn-check" style="display:none">Verificar</button>
      </div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Onde isso aparece na vida real?</h2>
    <div class="real-life-card">
      <div class="real-life-label">Culinária</div>
      <p>A água (H₂O, polar) dissolve sal (NaCl, iônico) e açúcar (polar), mas não dissolve
         óleo (apolar). "Semelhante dissolve semelhante" é consequência direta da polaridade.</p>
    </div>
    <div class="real-life-card">
      <div class="real-life-label">Medicina</div>
      <p>Medicamentos lipofílicos (apolares) atravessam membranas celulares com facilidade.
         Medicamentos hidrofílicos (polares) ficam no sangue. Isso determina como fármacos
         são distribuídos e eliminados.</p>
    </div>
    <div style="margin-top:2rem;text-align:center">
      <button class="btn btn-primary" data-nav="/module/reactions">
        Próximo: Reações Químicas &#8594;
      </button>
    </div>
  </section>
</div>`;
}

/* -----------------------------------------------------------------------
   Canvas
----------------------------------------------------------------------- */
function _initCanvas() {
  const frame  = document.getElementById('bond-canvas-frame');
  const canvas = document.getElementById('bond-canvas');
  if (!frame || !canvas) return;

  // Dimensões fixas — não dependem do layout responsivo para hit detection
  _W = Math.min(frame.clientWidth || 520, 520);
  _H = 320;

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(_W * dpr);
  canvas.height = Math.round(_H * dpr);
  canvas.style.width  = _W + 'px';
  canvas.style.height = _H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  _loadMolecule(_molKey);
  _updateInfo(_molKey);

  _drag = new DragManager(canvas);
  _drag.onDragStart = (x, y) => {
    for (let i = _atoms.length - 1; i >= 0; i--) {
      if (hitCircle(x, y, _atoms[i].x, _atoms[i].y, _atoms[i].r + 6)) return i;
    }
    return null;
  };
  _drag.onDragMove = (x, y, idx) => {
    if (idx === null || idx === undefined) return;
    _atoms[idx].x = Math.max(_atoms[idx].r, Math.min(_W - _atoms[idx].r, x));
    _atoms[idx].y = Math.max(_atoms[idx].r, Math.min(_H - _atoms[idx].r, y));
  };

  _loop = new SimLoop(() => _draw(ctx));
  _loop.start();
}

function _loadMolecule(key) {
  const mol = MOLECULES[key];
  if (!mol) return;
  _atoms = mol.atoms.map(a => ({
    ...a,
    x: a.x * _W,
    y: a.y * _H,
  }));
}

function _draw(ctx) {
  const mol = MOLECULES[_molKey];
  if (!mol) return;

  clearCanvas(ctx, _W, _H);

  // Ligações
  for (const [i, j, order] of mol.bonds) {
    const a = _atoms[i];
    const b = _atoms[j];
    const color = mol.ionic ? '#ef5350' : COLOR.bond;
    drawBond(ctx, a.x, a.y, b.x, b.y, order, color);
  }

  // Dipolos (somente covalente polar, não iônico)
  if (mol.dipole && !mol.ionic) {
    for (const [i, j] of mol.bonds) {
      const a   = _atoms[i];
      const b   = _atoms[j];
      const ea  = 0;  // simplificado — seta do menos para o mais eletroneg.
      const col = COLOR.neutral;
      // Seta do H/Na para o átomo mais eletroneg.
      const fromIdx = _moreElectroneg(mol.atoms[i].s, mol.atoms[j].s) ? j : i;
      const toIdx   = fromIdx === i ? j : i;
      const from = _atoms[fromIdx];
      const to   = _atoms[toIdx];
      ctx.save();
      ctx.globalAlpha = 0.4;
      drawDipole(ctx, from.x, from.y, to.x, to.y, col);
      ctx.restore();
    }
  }

  // Átomos
  for (const a of _atoms) {
    drawAtom(ctx, a.x, a.y, a.r, a.s);
    // Carga iônica
    if (a.charge) {
      ctx.save();
      ctx.font = `bold 13px "Segoe UI",sans-serif`;
      ctx.fillStyle = a.charge === '+' ? COLOR.reaction : COLOR.electron;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(a.charge, a.x + a.r * 0.85, a.y - a.r * 0.85);
      ctx.restore();
    }
  }

  // Legenda de tipo
  ctx.save();
  ctx.font      = '12px "Segoe UI",sans-serif';
  ctx.fillStyle = COLOR.textMuted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(mol.type, _W - 12, _H - 10);
  ctx.restore();
}

/** Retorna true se a tem eletronegatividade maior que b */
function _moreElectroneg(a, b) {
  const en = { O:3.44, N:3.04, Cl:3.16, F:3.98, C:2.55, H:2.20, Na:0.93, S:2.58 };
  return (en[a] || 2) > (en[b] || 2);
}

function _updateInfo(key) {
  const mol   = MOLECULES[key];
  const panel = document.getElementById('bond-info');
  if (!mol || !panel) return;

  const typeColor = mol.ionic
    ? '#ef5350'
    : mol.polar ? '#ffd166' : '#6bcb77';

  panel.innerHTML = `
    <h3 style="margin-bottom:var(--space-3)">
      ${esc(mol.label)}
      <span class="badge" style="margin-left:.5rem;background:${typeColor}22;
            color:${typeColor};border-color:${typeColor}55">${esc(mol.type)}</span>
    </h3>
    <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.65">
      ${esc(mol.info)}
    </p>`;
}

/* -----------------------------------------------------------------------
   Eventos
----------------------------------------------------------------------- */
function _bindEvents() {
  // Seleção de molécula
  document.getElementById('mol-selector')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-mol]');
    if (!btn) return;
    _molKey = btn.dataset.mol;
    document.querySelectorAll('#mol-selector .atom-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mol === _molKey);
    });
    _loadMolecule(_molKey);
    _updateInfo(_molKey);
    markSectionDone('chemical-bonds', 'interaction');
  });

  // Exercício
  const CORRECT = 'Porque a geometria linear cancela os dipolos das ligações';
  const HINTS   = [
    'Selecione o CO₂ no simulador e observe a simetria da molécula.',
    'Uma molécula polar precisa ter dipolos que NÃO se cancelam. O que acontece quando dipolos opostos têm igual intensidade?',
    'O₂ puxa os elétrons para os dois lados com a mesma força. Na geometria linear, esses dois vetores apontam em direções opostas e se somam a zero.',
  ];

  const optEl   = document.getElementById('cb-ex-options');
  const checkEl = document.getElementById('cb-btn-check');
  const hintEl  = document.getElementById('cb-btn-hint');
  const fbEl    = document.getElementById('cb-ex-feedback');
  const hintBox = document.getElementById('cb-ex-hint');

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
      ? 'Correto! O CO₂ é linear e simétrico. Os dois dipolos C→O apontam em sentidos opostos e se cancelam — dipolo resultante = zero = molécula apolar.'
      : 'Não está certo. Pense em vetores: dois dipolos iguais em direções opostas se somam a zero.';
    fbEl.className = `exercise-feedback ${ok ? 'bg-correct' : 'bg-error'}`;
    if (ok) { _exDone = true; markSectionDone('chemical-bonds', 'exercise'); }
  });

  hintEl.addEventListener('click', () => {
    const idx = Math.min(_exAttempts, HINTS.length - 1);
    hintBox.textContent = HINTS[idx];
    hintBox.classList.add('visible');
  });
}
