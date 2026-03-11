/**
 * modules/reactions/index.js — Módulo: Reações Químicas
 * Lavoisier — Laboratório Visual de Química
 *
 * Implementa:
 *  - Balanceador visual de equações com contagem atômica em tempo real
 *  - 4 reações: formação da água, ferrugem, fotossíntese, combustão do metano
 *  - Simulação de partículas Canvas para visualização cinética
 *  - Exercício guiado
 */

import { esc, createHiDPICanvas }  from '../../js/ui.js';
import { markSectionDone }         from '../../js/state.js';
import { SimLoop, Particle, spawnParticles } from '../../js/engine/simulation.js';
import { clearCanvas, drawParticle, drawLabel, COLOR } from '../../js/engine/renderer.js';

/* -----------------------------------------------------------------------
   Reações disponíveis
----------------------------------------------------------------------- */
const REACTIONS = {
  water: {
    label: 'Formação da água',
    info:  'Dois volumes de H₂ reagem com um volume de O₂ formando dois de H₂O. A reação libera 572 kJ/mol — é altamente exotérmica. Representa a combustão completa do hidrogênio.',
    reagents: [
      { formula:'H₂', coeff:2, atoms:{ H:2 }, color:'#e6edf3' },
      { formula:'O₂', coeff:1, atoms:{ O:2 }, color:'#ef476f' },
    ],
    products: [
      { formula:'H₂O', coeff:2, atoms:{ H:2, O:1 }, color:'#4fc3f7' },
    ],
    answer: { reagents:[2,1], products:[2] },
  },
  rust: {
    label: 'Ferrugem (oxidação do ferro)',
    info:  'O ferro reage com oxigênio formando óxido de ferro(III) — Fe₂O₃. Esta reação lenta é responsável pela degradação de estruturas metálicas. A presença de água (umidade) acelera o processo.',
    reagents: [
      { formula:'Fe',  coeff:4, atoms:{ Fe:1 }, color:'#ffd166' },
      { formula:'O₂',  coeff:3, atoms:{ O:2 },  color:'#ef476f' },
    ],
    products: [
      { formula:'Fe₂O₃', coeff:2, atoms:{ Fe:2, O:3 }, color:'#ffa726' },
    ],
    answer: { reagents:[4,3], products:[2] },
  },
  photo: {
    label: 'Fotossíntese (simplificada)',
    info:  'Plantas usam luz solar para converter CO₂ e H₂O em glicose (C₆H₁₂O₆) e liberam O₂. Este processo captura ~2800 kJ/mol de energia luminosa e é a base de toda a cadeia alimentar.',
    reagents: [
      { formula:'CO₂', coeff:6, atoms:{ C:1, O:2 }, color:'#8b949e' },
      { formula:'H₂O', coeff:6, atoms:{ H:2, O:1 }, color:'#4fc3f7' },
    ],
    products: [
      { formula:'C₆H₁₂O₆', coeff:1, atoms:{ C:6, H:12, O:6 }, color:'#6bcb77' },
      { formula:'O₂',       coeff:6, atoms:{ O:2 },             color:'#ef476f' },
    ],
    answer: { reagents:[6,6], products:[1,6] },
  },
  methane: {
    label: 'Combustão do metano',
    info:  'O metano (gás natural) reage com oxigênio formando CO₂ e H₂O. Libera 890 kJ/mol — é a reação que acontece em fogões e aquecedores. A combustão incompleta (pouco O₂) forma CO (monóxido de carbono), gás tóxico.',
    reagents: [
      { formula:'CH₄', coeff:1, atoms:{ C:1, H:4 }, color:'#b39ddb' },
      { formula:'O₂',  coeff:2, atoms:{ O:2 },       color:'#ef476f' },
    ],
    products: [
      { formula:'CO₂', coeff:1, atoms:{ C:1, O:2 }, color:'#8b949e' },
      { formula:'H₂O', coeff:2, atoms:{ H:2, O:1 }, color:'#4fc3f7' },
    ],
    answer: { reagents:[1,2], products:[1,2] },
  },
};

/* Estado local — resetado a cada render() */
let _rxKey   = 'water';
let _coeffs  = null;   // { reagents: number[], products: number[] }
let _loop    = null;
let _W       = 0;
let _H       = 160;
let _particles = [];
let _exAttempts = 0;
let _exDone     = false;

/* -----------------------------------------------------------------------
   Exports
----------------------------------------------------------------------- */
// ---------------------------------------------------------------------------
// Semirreações padrão (E° em V vs SHE, 25°C)
// ---------------------------------------------------------------------------
const HALF_CELLS = [
  { label: 'F₂ + 2e⁻ → 2F⁻',             E:  2.87 },
  { label: 'MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺',   E:  1.51 },
  { label: 'Cl₂ + 2e⁻ → 2Cl⁻',            E:  1.36 },
  { label: 'O₂ + 4H⁺ + 4e⁻ → 2H₂O',       E:  1.23 },
  { label: 'Br₂ + 2e⁻ → 2Br⁻',            E:  1.07 },
  { label: 'Ag⁺ + e⁻ → Ag',               E:  0.80 },
  { label: 'Fe³⁺ + e⁻ → Fe²⁺',            E:  0.77 },
  { label: 'I₂ + 2e⁻ → 2I⁻',              E:  0.54 },
  { label: 'Cu²⁺ + 2e⁻ → Cu',             E:  0.34 },
  { label: '2H⁺ + 2e⁻ → H₂ (SHE)',        E:  0.00 },
  { label: 'Pb²⁺ + 2e⁻ → Pb',             E: -0.13 },
  { label: 'Ni²⁺ + 2e⁻ → Ni',             E: -0.26 },
  { label: 'Fe²⁺ + 2e⁻ → Fe',             E: -0.44 },
  { label: 'Zn²⁺ + 2e⁻ → Zn',             E: -0.76 },
  { label: 'Al³⁺ + 3e⁻ → Al',             E: -1.66 },
  { label: 'Mg²⁺ + 2e⁻ → Mg',             E: -2.37 },
  { label: 'Na⁺ + e⁻ → Na',               E: -2.71 },
  { label: 'Li⁺ + e⁻ → Li',               E: -3.05 },
];

// ---------------------------------------------------------------------------
// Calculadora de E°célula
// ---------------------------------------------------------------------------
function _initRedoxCell() {
  const F   = 96485;   // C/mol
  const R   = 8.314;   // J/(mol·K)
  const T   = 298.15;  // K

  function update() {
    const Ec = parseFloat(document.getElementById('redox-cathode')?.value ?? 1.23);
    const Ea = parseFloat(document.getElementById('redox-anode')?.value ?? 0.00);
    const n  = parseInt(document.getElementById('redox-n')?.value ?? 2, 10);

    const Ecell = Ec - Ea;
    const dG    = -n * F * Ecell / 1000;  // kJ/mol
    const lnK   = n * F * Ecell / (R * T);
    const K     = Math.exp(Math.min(lnK, 700));  // evitar overflow

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const setColor = (id, c) => { const el = document.getElementById(id); if (el) el.style.color = c; };

    const ecStr = (Ecell >= 0 ? '+' : '') + Ecell.toFixed(3) + ' V';
    const dgStr = (dG >= 0 ? '+' : '') + dG.toFixed(1) + ' kJ/mol';

    set('redox-ecell', ecStr);
    set('redox-dg',    dgStr);
    set('redox-n-val', n);

    const color = Ecell > 0 ? 'var(--accent-organic)' : Ecell < 0 ? 'var(--accent-reaction)' : 'var(--text-muted)';
    setColor('redox-ecell', color);
    setColor('redox-dg',    Ecell > 0 ? 'var(--accent-organic)' : 'var(--accent-reaction)');

    const spont = Ecell > 0.001 ? 'Sim (espontânea)' : Ecell < -0.001 ? 'Não (forçar)' : 'Equilíbrio';
    set('redox-spont', spont);
    setColor('redox-spont', color);

    let kStr;
    if (lnK > 300)      kStr = '10^' + (lnK / Math.LN10).toFixed(0);
    else if (lnK < -300) kStr = '≈ 0';
    else                 kStr = K.toExponential(2);
    set('redox-K', kStr);
  }

  document.getElementById('redox-cathode')?.addEventListener('change', update);
  document.getElementById('redox-anode')?.addEventListener('change', update);
  document.getElementById('redox-n')?.addEventListener('input', update);
  if (document.getElementById('redox-cathode')) update();
}

const EXERCISES = [
  { q: '2H₂ + O₂ → 2H₂O — qual equação está balanceada?', opts: ['H₂ + O₂ → H₂O','2H₂ + O₂ → 2H₂O','H₂ + 2O₂ → H₂O','2H₂ + 2O₂ → H₂O'], ans: 1, exp: '2H₂ (4H) + O₂ (2O) → 2H₂O (4H + 2O). Massa conservada.', hint: 'Conte os átomos de H e O nos dois lados.' },
  { q: 'Na reação redox: Zn + CuSO₄ → ZnSO₄ + Cu, o Zn:', opts: ['Se reduz','Se oxida (Zn → Zn²⁺)','Não muda de NOx','É o agente redutor e se oxida'], ans: 3, exp: 'Zn perde 2 e⁻: Zn⁰ → Zn²⁺ (oxidação). Zn atua como agente redutor (doa elétrons para Cu²⁺).', hint: 'Oxidação = perda de elétrons. Zn vai de 0 para +2.' },
  { q: 'E°(Cu²⁺/Cu) = +0,34 V; E°(Zn²⁺/Zn) = -0,76 V. E°célula Zn/Cu?', opts: ['+0,42 V','-0,42 V','+1,10 V','-1,10 V'], ans: 2, exp: 'E°célula = E°cátodo - E°ânodo = 0,34 - (-0,76) = 1,10 V. Positivo → espontânea.', hint: 'E°célula = E°cátodo - E°ânodo. Cátodo tem E° maior.' },
  { q: 'Na combustão de propano C₃H₈ + 5O₂ → 3CO₂ + 4H₂O, qual é o produto formado em maior quantidade molar?', opts: ['CO₂','H₂O','O₂ sobra','Todos iguais'], ans: 1, exp: 'Coeficientes: 3 mol CO₂ e 4 mol H₂O. H₂O é produzida em maior quantidade (4 > 3).', hint: 'Compare os coeficientes de CO₂ e H₂O na equação balanceada.' },
  { q: 'Qual tipo de reação é: 2KClO₃ → 2KCl + 3O₂ ?', opts: ['Síntese','Decomposição','Simples troca','Dupla troca'], ans: 1, exp: 'Um composto se divide em dois ou mais produtos → reação de decomposição. KClO₃ → KCl + O₂.', hint: 'Quantos reagentes e produtos existem? Síntese: A+B→AB. Decomposição: AB→A+B.' },,
  { q:'Balanceie: Fe + O₂ → Fe₂O₃. Os coeficientes corretos são:', opts:['1,1,1','4,3,2','2,1,1','1,3,2'], ans:1, exp:'4Fe + 3O₂ → 2Fe₂O₃. Fe: 4 dos dois lados. O: 6 dos dois lados (3×2=6 e 2×3=6). Use método algébrico ou tentativa com coeficientes.', hint:'Comece pelo elemento que aparece em menos substâncias. Fe aparece em Fe e Fe₂O₃.' },
  { q:'Na reação 2Al + 6HCl → 2AlCl₃ + 3H₂, qual é o agente oxidante?', opts:['Al','H⁺ do HCl','Cl⁻','AlCl₃'], ans:1, exp:'Al se oxida (Al⁰ → Al³⁺, perde 3e⁻). H⁺ se reduz (H⁺ → H₂, ganha 1e⁻). O agente oxidante é a espécie que se reduz = H⁺.', hint:'Agente oxidante = o que se reduz (recebe elétrons).' },
  { q:'Qual reação é de síntese (ou combinação)?', opts:['CaCO₃ → CaO + CO₂','Na + Cl₂ → NaCl (a partir dos elementos)','2NaCl → 2Na + Cl₂','Fe + CuSO₄ → FeSO₄ + Cu'], ans:1, exp:'Síntese: dois ou mais reagentes formam UM produto. Na + ½Cl₂ → NaCl (ajustando coeficientes). As demais são decomposição, eletrólise e simples troca.', hint:'Síntese: A + B → AB. Decomposição: AB → A + B.' },
  { q:'Na eletrólise da água: 2H₂O → 2H₂ + O₂, qual gás é produzido no cátodo?', opts:['O₂ — oxidação','H₂ — redução (cátodo recebe elétrons)','HO⁻','H₂O₂'], ans:1, exp:'Cátodo = redução. 2H₂O + 2e⁻ → H₂ + 2OH⁻. O H⁺ é reduzido a H₂ no cátodo. No ânodo, 2H₂O → O₂ + 4H⁺ + 4e⁻ (oxidação). Volume de H₂ produzido é o dobro do O₂.', hint:'Cátodo = redução = ganha elétrons. Ânodo = oxidação = perde elétrons.' },
  { q:'Determine o número de oxidação (NOx) do Cr em K₂Cr₂O₇:', opts:['+3','+6','+7','+4'], ans:1, exp:'K₂Cr₂O₇: 2(+1) + 2x + 7(-2) = 0 → 2 + 2x - 14 = 0 → 2x = 12 → x = +6. Cr está no estado de oxidação +6 (dicromato, forte oxidante).', hint:'Soma de NOx = carga total. K=+1, O=-2. Resolva para Cr.' },
  { q:'Na reação de neutralização: HNO₃ + KOH → KNO₃ + H₂O, qual é a reação iônica líquida?', opts:['H⁺ + NO₃⁻ + K⁺ + OH⁻ → K⁺ + NO₃⁻ + H₂O','H⁺ + OH⁻ → H₂O','HNO₃ → H⁺ + NO₃⁻','KOH → K⁺ + OH⁻'], ans:1, exp:'K⁺ e NO₃⁻ são íons espectadores (aparecem igual nos dois lados). A reação iônica líquida é H⁺ + OH⁻ → H₂O — válida para toda neutralização de ácido forte + base forte.', hint:'Cancele os íons que aparecem igual em ambos os lados (espectadores).' },
  { q:'0,5 mol de C₃H₈ queima completamente. Quantos mol de CO₂ são produzidos? (C₃H₈+5O₂→3CO₂+4H₂O)', opts:['1,5 mol','3 mol','0,5 mol','2 mol'], ans:0, exp:'1 mol C₃H₈ → 3 mol CO₂. Para 0,5 mol: 0,5 × 3 = 1,5 mol CO₂. Regra: multiplicar os coeficientes pela quantidade em mol do reagente.', hint:'Proporção estequiométrica: 1 mol C₃H₈ : 3 mol CO₂.' },
  { q:'Qual afirmação sobre catalisadores é correta?', opts:['Aumentam ΔG da reação','Diminuem a energia de ativação e são consumidos','Diminuem a energia de ativação sem serem consumidos','Alteram o ΔH da reação'], ans:2, exp:'Catalisadores fornecem um caminho alternativo de menor energia de ativação (Ea). Não são consumidos (são regenerados). Não alteram ΔG, ΔH, Keq — só a velocidade de atingir o equilíbrio.', hint:'Catalisador: mais rápido, mesmo produto final, não consumido.' },
  { q:'A disproportionação é uma reação em que o mesmo elemento:', opts:['Reage com dois produtos diferentes','Se oxida e se reduz simultaneamente','Mantém o NOx constante','Reage com água para dar ácido e base'], ans:1, exp:'Disproportionação (autooxidação): um mesmo elemento muda de NOx em direções opostas. Ex: 2H₂O₂ → 2H₂O + O₂. O²⁻¹ → O²⁻ (redução) e O²⁻¹ → O₂⁰ (oxidação). Cl₂ + NaOH → NaCl + NaClO também é disproportionação do Cl.', hint:'Um elemento serve como agente oxidante e redutor ao mesmo tempo.' },
  { q:'Na reação de simples troca: Zn + 2AgNO₃ → Zn(NO₃)₂ + 2Ag, qual previsão da série de atividade é confirmada?', opts:['Zn é menos reativo que Ag','Zn desloca Ag porque é mais ativo (reduz Ag⁺)','Ag oxida Zn²⁺','A reação não é espontânea'], ans:1, exp:'Na série de atividade, Zn está acima de Ag. Metais mais ativos reduzem íons de metais menos ativos. Zn⁰ → Zn²⁺ (oxidação); 2Ag⁺ → 2Ag⁰ (redução). E° > 0 → espontânea.', hint:'Metal mais ativo desloca o menos ativo de seus sais em solução.' }
];
let _exIdx = 0;

export function render(outlet) {
  if (_loop) { _loop.stop(); _loop = null; }
  _rxKey      = 'water';
  _exIdx = 0;
  _exAttempts = 0;
  _exDone     = false;
  _particles  = [];

  outlet.innerHTML = _buildHTML();
  _resetCoeffs('water');
  _renderEquation();
  _updateBalance();
  _initCanvas();
  _bindEvents();
  _initRedox();
  _initRedoxCell();
  _initExercises();
  markSectionDone('reactions', 'visited');
}


function _initRedox() {
  // Redox examples
    const REDOX_DATA = [{'title': 'Permanganato + Fe²⁺ (ácido)', 'anodo': '5Fe²⁺ → 5Fe³⁺ + 5e⁻', 'catodo': 'MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O', 'global': 'MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O', 'note': 'Usado em titulação de permanganato (auto-indicador: vira rosa permanente no PE).'}, {'title': 'Dicromato + I⁻ (ácido)', 'anodo': '6I⁻ → 3I₂ + 6e⁻', 'catodo': 'Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O', 'global': 'Cr₂O₇²⁻ + 6I⁻ + 14H⁺ → 2Cr³⁺ + 3I₂ + 7H₂O', 'note': 'I₂ formado detectado por titulação com tiossulfato (iodometria).'}, {'title': 'Desproportionamento do H₂O₂', 'anodo': 'H₂O₂ → O₂ + 2H⁺ + 2e⁻', 'catodo': 'H₂O₂ + 2H⁺ + 2e⁻ → 2H₂O', 'global': '2H₂O₂ → 2H₂O + O₂', 'note': 'Catalisado por MnO₂ ou catalase. O mesmo reagente é oxidante e redutor simultaneamente.'}, {'title': 'Cobre em HNO₃ concentrado', 'anodo': 'Cu → Cu²⁺ + 2e⁻', 'catodo': 'NO₃⁻ + 2H⁺ + e⁻ → NO₂ + H₂O (×2)', 'global': 'Cu + 4HNO₃(conc) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O', 'note': 'Produz gás marrom-alaranjado NO₂. HNO₃ diluído produz NO incolor.'}];
    function renderRedox(idx) {
      const d = REDOX_DATA[idx];
      const container = document.getElementById('redox-content');
      if(!container||!d) return;
      container.innerHTML = `
        <h3 style="margin-top:0;color:var(--accent-electron)">${d.title}</h3>
        <p style="font-size:var(--text-xs);color:var(--accent-reaction);margin:.2rem 0">Oxidação: <span style="font-family:monospace">${d.anodo}</span></p>
        <p style="font-size:var(--text-xs);color:var(--accent-organic);margin:.2rem 0">Redução: <span style="font-family:monospace">${d.catodo}</span></p>
        <p style="font-size:var(--text-sm);font-family:monospace;color:var(--accent-bond);margin:.5rem 0;font-weight:600">${d.global}</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary)">${d.note}</p>
      `;
      REDOX_DATA.forEach((_,j)=>{const b=document.getElementById('rdx-'+j);if(b) b.className='btn btn-xs '+(j===idx?'btn-secondary':'btn-ghost');});
    }
    renderRedox(0);
    REDOX_DATA.forEach((_,i)=>{ document.getElementById('rdx-'+i)?.addEventListener('click',()=>renderRedox(i)); });
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
          markSectionDone('reactions', 'exercise');
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
}

/* -----------------------------------------------------------------------
   HTML
----------------------------------------------------------------------- */
function _buildHTML() {
  const rxButtons = Object.entries(REACTIONS).map(([k, r]) =>
    `<button class="atom-btn ${k === _rxKey ? 'active' : ''}"
             data-rx="${esc(k)}">${esc(r.label)}</button>`
  ).join('');

  return `
<div class="module-page" id="module-rx">
  <button class="module-back btn-ghost" data-nav="/modules">
    &#8592; Módulos
  </button>

  <header class="module-header">
    <h1 class="module-title">Reações Químicas</h1>
    <p class="module-concept">
      Uma reação química reorganiza átomos, mas nunca os cria nem os destrói (Lei de Lavoisier:
      conservação da massa). Balancear uma equação é garantir que o número de átomos de cada
      elemento seja igual nos dois lados. Ajuste os coeficientes abaixo.
    </p>
  </header>

    <!-- Redox e números de oxidação -->
  <section class="module-section">
    <h2 class="module-section-title">Reações redox — oxidação e redução</h2>
    <p class="module-text">
      Reações de oxidação-redução (redox) envolvem transferência de elétrons entre espécies.
      <strong>Oxidação</strong>: perda de elétrons (número de oxidação aumenta).
      <strong>Redução</strong>: ganho de elétrons (NOx diminui). As duas meias-reações
      ocorrem simultaneamente e de forma acoplada — não existe oxidação sem redução correspondente.
      Mnemônica: <em>OIL RIG</em> (Oxidation Is Loss, Reduction Is Gain).
    </p>
    <p class="module-text">
      O <strong>agente oxidante</strong> é a espécie que aceita elétrons e se reduz.
      O <strong>agente redutor</strong> doa elétrons e se oxida. A força relativa desses agentes
      é quantificada pelo potencial padrão de redução E° (medido em relação ao eletrodo
      padrão de hidrogênio, E° = 0,00 V). Quanto maior E°, maior a tendência de ser reduzido.
      A espontaneidade de uma reação redox é determinada pela diferença:
      E°célula = E°cátodo - E°ânodo. Se E°célula &gt; 0 → ΔG &lt; 0 → reação espontânea.
    </p>
    <p class="module-text">
      <strong>Regras de NOx</strong> em ordem de prioridade: (1) elemento puro = 0;
      (2) íon monoatômico = carga do íon; (3) F sempre -1; (4) O geralmente -2
      (exceto peróxidos -1, OF₂ +2); (5) H geralmente +1 (exceto hidretos metálicos -1);
      (6) soma dos NOx em composto neutro = 0; em íon = carga do íon.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-bottom:1rem">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Regras de NOx</h3>
        <p style="font-size:var(--text-xs)">Elemento livre = 0 | H: +1 (exceto hidretos: -1) | O: -2 (exceto peróxidos: -1; OF₂: +2) | Metais alcalinos: +1 | Alcalinoterrosos: +2 | F: sempre -1 | Soma = carga total da espécie</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-electron)">Meia-reação anódica</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">Zn → Zn²⁺ + 2e⁻</p>
        <p style="font-size:var(--text-sm)">Anodo: oxidação (perde e⁻). NOx de Zn: 0 → +2.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Meia-reação catódica</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">Cu²⁺ + 2e⁻ → Cu</p>
        <p style="font-size:var(--text-sm)">Catodo: redução (ganha e⁻). NOx de Cu: +2 → 0.</p></div>
    </div>

    <p class="module-text">
      <strong>Balanceamento redox pelo método de meia-reação:</strong>
      (1) identificar as espécies oxidadas e reduzidas;
      (2) escrever as duas meias-reações separadas;
      (3) balancear todos os átomos exceto H e O;
      (4) balancear O adicionando H₂O; balancear H adicionando H⁺;
      (5) balancear cargas adicionando e⁻;
      (6) multiplicar as meias-reações pelo mmc dos elétrons trocados;
      (7) somar e simplificar. Em meio básico: ao final, adicionar OH⁻ para neutralizar
      cada H⁺, formando H₂O nos dois lados. Este método garante conservação de massa
      e de carga simultaneamente — o único algoritmo rigoroso para qualquer reação redox.
    </p>
    <p class="module-text">
      Tipos principais de reações químicas: (1) <strong>síntese</strong> A + B → AB;
      (2) <strong>decomposição</strong> AB → A + B; (3) <strong>simples troca</strong>
      A + BC → AC + B (deslocamento); (4) <strong>dupla troca</strong>
      AB + CD → AD + CB (metátese — precipitação, neutralização, formação de gás);
      (5) <strong>combustão</strong> hidrocarboneto + O₂ → CO₂ + H₂O.
      As reações redox podem ser de qualquer tipo — o critério é a variação de NOx,
      não a forma estrutural da equação.
    </p> (1) separar meia-reações; (2) balancear átomos (H₂O para O; H⁺ para H); (3) balancear cargas com e⁻; (4) igualar e⁻ e somar; (5) em meio básico: adicionar OH⁻ para neutralizar H⁺.</p>

    <div id="redox-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.75rem">
      <button class="btn btn-xs btn-secondary" id="rdx-0" data-rdx="0">MnO₄⁻/Fe²⁺</button>
      <button class="btn btn-xs btn-ghost" id="rdx-1" data-rdx="1">Cr₂O₇²⁻/I⁻</button>
      <button class="btn btn-xs btn-ghost" id="rdx-2" data-rdx="2">H₂O₂ (disproportioning)</button>
      <button class="btn btn-xs btn-ghost" id="rdx-3" data-rdx="3">Cu/HNO₃</button>
    </div>
    <div id="redox-content" class="info-card" style="background:var(--bg-raised)"></div>
  </section>

<section class="module-section">
    <h2 class="module-section-title">Balanceador visual</h2>
    <div class="molecule-toolbar" id="rx-selector" role="group" aria-label="Selecionar reação">
      ${rxButtons}
    </div>

    <div id="rx-info-card" class="info-card" style="margin:var(--space-4) 0"></div>

    <div id="rx-equation" class="reaction-equation" role="region" aria-label="Equação química"></div>

    <div id="rx-balance" class="mass-balance"></div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Simulação cinética</h2>
    <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-3)">
      Partículas dos reagentes colidem e formam produtos. A taxa de colisão aumenta com temperatura
      e concentração (teoria das colisões efetivas).
    </p>
    <div class="canvas-frame">
      <canvas id="rx-canvas" aria-label="Simulação de partículas"></canvas>
      <span class="canvas-label">Cinética de reação</span>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Célula eletroquímica — E° e espontaneidade</h2>
    <p class="module-text">
      Selecione o par de semirreações para calcular E°célula = E°cátodo - E°ânodo.
      E°célula &gt; 0 → ΔG &lt; 0 → espontânea. A relação exata é ΔG° = -nFE°,
      onde n é o número de elétrons transferidos e F = 96485 C/mol.
    </p>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:80px">Cátodo (+):</span>
        <select id="redox-cathode" style="flex:1;max-width:320px;background:var(--bg-raised);color:var(--text-primary);border:1px solid var(--border-default);border-radius:var(--radius-sm);padding:.3rem .5rem;font-size:var(--text-sm)">
          ${HALF_CELLS.map(h => `<option value="${esc(String(h.E))}">${esc(h.label)} (${h.E >= 0 ? '+' : ''}${h.E.toFixed(2)} V)</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:80px">Ânodo (-):</span>
        <select id="redox-anode" style="flex:1;max-width:320px;background:var(--bg-raised);color:var(--text-primary);border:1px solid var(--border-default);border-radius:var(--radius-sm);padding:.3rem .5rem;font-size:var(--text-sm)">
          ${HALF_CELLS.map((h,i) => `<option value="${esc(String(h.E))}" ${i===3?'selected':''}>${esc(h.label)} (${h.E >= 0 ? '+' : ''}${h.E.toFixed(2)} V)</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:80px">n (e⁻):</span>
        <input type="range" id="redox-n" min="1" max="6" step="1" value="2"
               style="width:120px;accent-color:var(--accent-electron)">
        <span id="redox-n-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:20px">2</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">E°célula (V)</p><div id="redox-ecell" style="font-size:var(--text-xl);font-weight:700">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">ΔG° (kJ/mol)</p><div id="redox-dg" style="font-size:var(--text-xl);font-weight:700">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Espontânea?</p><div id="redox-spont" style="font-size:var(--text-sm);font-weight:700">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">K (25°C)</p><div id="redox-K" style="font-size:var(--text-sm);font-weight:700;color:var(--text-muted)">—</div></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/5)</h2>
    <div class="exercise-card">
      <p class="exercise-question" id="ex-question">
        Na reação de combustão do metano:
        <strong>CH₄ + O₂ → CO₂ + H₂O</strong>.
        Quais coeficientes balanceiam esta equação?
      </p>
      <div class="exercise-options" id="rx-ex-options" role="group">
        ${[
          'CH₄ + 2O₂ → CO₂ + 2H₂O',
          'CH₄ + O₂ → CO₂ + H₂O',
          '2CH₄ + O₂ → CO₂ + 2H₂O',
          'CH₄ + 3O₂ → CO₂ + 2H₂O',
        ].map(o => `<button class="exercise-option" data-answer="${esc(o)}">${esc(o)}</button>`).join('')}
      </div>
      <div class="hint-box" id="rx-ex-hint"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next" style="margin-top:1rem;display:none">Próximo exercício &#8594;</button>
      <div class="exercise-feedback" id="rx-ex-feedback"></div>
      <div class="exercise-actions">
        <button class="btn btn-secondary btn-sm" id="rx-btn-hint">Usar dica</button>
        <button class="btn btn-primary btn-sm"   id="rx-btn-check" style="display:none">Verificar</button>
      </div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Onde isso aparece na vida real?</h2>
    <p class="module-text">
      Reações redox são a base de praticamente toda a tecnologia energética moderna.
      Em pilhas e baterias, energia química é convertida em energia elétrica via reações redox
      espontâneas. Em eletrólise, o processo reverso usa energia elétrica para forçar reações
      não-espontâneas — como a produção de alumínio metálico (Hall-Héroult, 1886) e a
      cloração de água. A fotossíntese é uma sequência de reações redox onde a água é oxidada
      (doa e⁻) e o CO₂ é reduzido (aceita e⁻ para formar glicose).
      A corrosão do ferro é uma reação redox espontânea: Fe → Fe²⁺ (ânodo) e O₂ + H₂O → OH⁻ (cátodo).
    </p>
    <div class="real-life-card">
      <div class="real-life-label">Energia</div>
      <p>Combustíveis fósseis (gás natural, gasolina, carvão) liberam energia via reações de
         combustão. A eficiência energética depende de balancear corretamente os reagentes —
         mistura rica desperdiça combustível; mistura pobre gera CO.</p>
    </div>
    <div class="real-life-card">
      <div class="real-life-label">Medicina</div>
      <p>A respiração celular é uma reação de oxidação da glicose: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O
         + energia. Cada mol de glicose gera ~30 ATP — a moeda energética das células.</p>
    </div>
    <div style="margin-top:2rem;text-align:center">
      <button class="btn btn-secondary" data-nav="/modules">
        &#8592; Ver todos os módulos
      </button>
    </div>
  </section>
</div>`;
}

/* -----------------------------------------------------------------------
   Lógica de balanceamento
----------------------------------------------------------------------- */

/** Inicializa coeficientes como 1 para todos os compostos da reação. */
function _resetCoeffs(rxKey) {
  const rx = REACTIONS[rxKey];
  _coeffs = {
    reagents: rx.reagents.map(() => 1),
    products: rx.products.map(() => 1),
  };
}

/** Conta átomos de um lado (reagentes ou produtos) com coeficientes aplicados. */
function _countAtoms(compounds, coeffs) {
  const count = {};
  compounds.forEach((c, i) => {
    const cf = coeffs[i] || 1;
    Object.entries(c.atoms).forEach(([el, n]) => {
      count[el] = (count[el] || 0) + n * cf;
    });
  });
  return count;
}

/** Verifica se os dois lados estão balanceados. */
function _isBalanced(rx, coeffs) {
  const left  = _countAtoms(rx.reagents, coeffs.reagents);
  const right = _countAtoms(rx.products, coeffs.products);
  const allEl = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const el of allEl) {
    if ((left[el] || 0) !== (right[el] || 0)) return false;
  }
  return true;
}

/* -----------------------------------------------------------------------
   Render da equação
----------------------------------------------------------------------- */
function _renderEquation() {
  const rx     = REACTIONS[_rxKey];
  const eqEl   = document.getElementById('rx-equation');
  const infoEl = document.getElementById('rx-info-card');
  if (!eqEl) return;

  if (infoEl) {
    infoEl.innerHTML = `<h3>${esc(rx.label)}</h3>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.5rem">
        ${esc(rx.info)}
      </p>`;
  }

  const makeCompound = (c, idx, side) => {
    const coeff = _coeffs[side][idx];
    return `<div class="reaction-compound">
      <button class="reaction-coeff" data-side="${side}" data-idx="${idx}" data-dir="-1"
              aria-label="Diminuir coeficiente">-</button>
      <span class="reaction-coeff" style="cursor:default;min-width:24px;text-align:center">
        ${coeff}
      </span>
      <button class="reaction-coeff" data-side="${side}" data-idx="${idx}" data-dir="1"
              aria-label="Aumentar coeficiente">+</button>
      <span style="color:${esc(c.color)};font-family:var(--font-mono);font-size:var(--text-lg)">
        ${esc(c.formula)}
      </span>
    </div>`;
  };

  const reagentHTML = rx.reagents.map((c, i) =>
    (i > 0 ? '<span class="reaction-plus">+</span>' : '') + makeCompound(c, i, 'reagents')
  ).join('');

  const productHTML = rx.products.map((c, i) =>
    (i > 0 ? '<span class="reaction-plus">+</span>' : '') + makeCompound(c, i, 'products')
  ).join('');

  eqEl.innerHTML = reagentHTML +
    `<span class="reaction-arrow" aria-label="reage formando">&#8594;</span>` +
    productHTML;
}

/** Atualiza o painel de balanço de massa. */
function _updateBalance() {
  const rx      = REACTIONS[_rxKey];
  const balEl   = document.getElementById('rx-balance');
  if (!balEl) return;

  const left  = _countAtoms(rx.reagents, _coeffs.reagents);
  const right = _countAtoms(rx.products, _coeffs.products);
  const allEl = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
  const ok    = _isBalanced(rx, _coeffs);

  const makeRow = (el) => {
    const l = left[el]  || 0;
    const r = right[el] || 0;
    const match = l === r;
    return `<div style="display:flex;justify-content:space-between;align-items:center;
                        font-family:var(--font-mono);font-size:var(--text-sm);
                        padding:2px 0;color:${match ? 'var(--state-correct)' : 'var(--state-error)'}">
      <span>${esc(el)}: ${l}</span>
      <span>${match ? '=' : '≠'}</span>
      <span>${r}</span>
    </div>`;
  };

  balEl.innerHTML = `
    <div class="mass-side">
      <div class="mass-side-label">Reagentes</div>
      ${allEl.map(el => makeRow(el)).join('')}
    </div>
    <div class="mass-balanced ${ok ? 'ok' : 'fail'}" aria-live="polite">
      ${ok ? '✓' : '✗'}
    </div>
    <div class="mass-side">
      <div class="mass-side-label">Produtos</div>
      ${allEl.map(el => {
        const l = left[el] || 0;
        const r = right[el] || 0;
        const match = l === r;
        return `<div style="display:flex;justify-content:space-between;align-items:center;
                             font-family:var(--font-mono);font-size:var(--text-sm);
                             padding:2px 0;color:${match ? 'var(--state-correct)' : 'var(--state-error)'}">
          <span>${esc(el)}: ${r}</span>
          <span>${match ? '=' : '≠'}</span>
          <span>${l}</span>
        </div>`;
      }).join('')}
    </div>`;

  if (ok) markSectionDone('reactions', 'balanced');
  _respawnParticles();
}

/* -----------------------------------------------------------------------
   Canvas de partículas
----------------------------------------------------------------------- */
function _initCanvas() {
  const canvas = document.getElementById('rx-canvas');
  if (!canvas) return;

  const frame = canvas.parentElement;
  _W = Math.min(frame?.clientWidth || 520, 520);

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(_W * dpr);
  canvas.height = Math.round(_H * dpr);
  canvas.style.width  = _W + 'px';
  canvas.style.height = _H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  _respawnParticles();

  _loop = new SimLoop((dt) => {
    _particles.forEach(p => p.update(dt, _W, _H));
    clearCanvas(ctx, _W, _H);
    _particles.forEach(p => {
      drawParticle(ctx, p.x, p.y, p.r, p.color, 0.85);
      if (p.label) drawLabel(ctx, p.label, p.x, p.y, p.color, `bold 11px "Segoe UI",sans-serif`);
    });
  });
  _loop.start();
}

/** Recria partículas baseado nos coeficientes atuais. */
function _respawnParticles() {
  const rx = REACTIONS[_rxKey];
  _particles = [];
  let seed = 1;

  const spawn = (formula, coeff, color) => {
    const n = Math.min(coeff * 4, 24);
    spawnParticles(n, _W || 520, _H, 9, 60 + Math.random() * 30, color, formula, seed++).forEach(p => {
      _particles.push(p);
    });
  };

  rx.reagents.forEach((c, i) => spawn(c.formula, _coeffs.reagents[i], c.color));
}

/* -----------------------------------------------------------------------
   Eventos
----------------------------------------------------------------------- */
function _bindEvents() {
  // Seleção de reação
  document.getElementById('rx-selector')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-rx]');
    if (!btn) return;
    _rxKey = btn.dataset.rx;
    document.querySelectorAll('#rx-selector .atom-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.rx === _rxKey);
    });
    _resetCoeffs(_rxKey);
    _renderEquation();
    _updateBalance();
    markSectionDone('reactions', 'interaction');
  });

  // Coeficientes (delegado ao elemento da equação)
  document.getElementById('rx-equation')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-dir]');
    if (!btn) return;
    const side = btn.dataset.side;   // 'reagents' | 'products'
    const idx  = parseInt(btn.dataset.idx, 10);
    const dir  = parseInt(btn.dataset.dir, 10);
    if (!_coeffs[side]) return;
    const next = (_coeffs[side][idx] || 1) + dir;
    if (next < 1 || next > 9) return;
    _coeffs[side][idx] = next;
    _renderEquation();
    _updateBalance();
  });

  // Exercício
  const CORRECT = 'CH₄ + 2O₂ → CO₂ + 2H₂O';
  const HINTS   = [
    'Selecione "Combustão do metano" no balanceador e tente ajustar os coeficientes até equilibrar.',
    'Conte os átomos: CH₄ tem 1C e 4H. CO₂ tem 1C — ok. Para 4H, precisamos de 2H₂O (cada tem 2H).',
    'Com 2H₂O nos produtos, temos 2O. Mais 1O do CO₂ = 3O no total. O₂ tem 2 átomos, então precisamos de 2O₂ (= 4O — espera! Confira: 2×2 = 4, mas CO₂+2H₂O = 2+2 = 4O. Bate!)',
  ];

  const optEl   = document.getElementById('rx-ex-options');
  const checkEl = document.getElementById('rx-btn-check');
  const hintEl  = document.getElementById('rx-btn-hint');
  const fbEl    = document.getElementById('rx-ex-feedback');
  const hintBox = document.getElementById('rx-ex-hint');

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
      ? 'Correto! CH₄ + 2O₂ → CO₂ + 2H₂O. Reagentes: 1C, 4H, 4O. Produtos: 1C, 4H, 4O. Balanceado!'
      : 'Não está certo. Tente usar o balanceador acima para a combustão do metano e conte os átomos.';
    fbEl.className = `exercise-feedback ${ok ? 'bg-correct' : 'bg-error'}`;
    if (ok) { _exDone = true; markSectionDone('reactions', 'exercise'); }
  });

  hintEl.addEventListener('click', () => {
    const idx = Math.min(_exAttempts, HINTS.length - 1);
    hintBox.textContent = HINTS[idx];
    hintBox.classList.add('visible');
  });
}
