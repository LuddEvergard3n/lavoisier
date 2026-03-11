/**
 * modules/catalysis/index.js — Módulo: Catálise Avançada
 * Lavoisier — Laboratório Visual de Química
 *
 * Cobre Graduação 2º ano+ / Pós:
 *  - Cross-coupling catalisado por Pd: Suzuki, Heck, Negishi, Buchwald-Hartwig
 *  - Ciclo catalítico: adição oxidativa, transmetalação, eliminação redutiva
 *  - Canvas animado do ciclo catalítico de Suzuki
 *  - Organocatálise: catálise por enamine (MacMillan/List, Nobel 2021)
 *  - Catálise enzimática vs catálise química: comparação de parâmetros
 *  - Eficiência atômica e E-fator (química verde)
 *  - 5 exercícios com dica progressiva
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';

let _cycleAnimId  = null;
let _cycleAngle   = 0;
let _cycleStep    = 0;   // etapa destacada no ciclo (0=OA, 1=TM, 2=ER)
let _exIdx        = 0;
let _exAttempts   = 0;
let _exDone       = false;

// -------------------------------------------------------------------------
// Exercícios
// -------------------------------------------------------------------------
const EXERCISES = [
  {
    q: 'No ciclo catalítico do acoplamento de Suzuki, qual é a ordem correta das etapas?',
    opts: [
      'Transmetalação → Adição oxidativa → Eliminação redutiva',
      'Adição oxidativa → Transmetalação → Eliminação redutiva',
      'Eliminação redutiva → Adição oxidativa → Transmetalação',
      'Adição oxidativa → Eliminação redutiva → Transmetalação',
    ],
    ans: 1,
    exp: 'O ciclo é: (1) Adição oxidativa — Pd(0) + R-X → R-Pd(II)-X; (2) Transmetalação — R-Pd-X + ArB(OH)₂ → R-Pd-Ar; (3) Eliminação redutiva — R-Pd-Ar → R-Ar + Pd(0). O Pd(0) é regenerado.',
    hint: 'Pd(0) começa o ciclo com a ligação C-X do haleto arílico.',
  },
  {
    q: 'Qual característica do acoplamento de Heck o distingue do Suzuki?',
    opts: [
      'Heck usa ácido borônico como parceiro de acoplamento',
      'Heck forma ligação C-C com alcenos (inserção de migratory), sem organometálico',
      'Heck opera sem catalisador de paládio',
      'Heck requer condições de crio (-78°C)',
    ],
    ans: 1,
    exp: 'No Heck, o parceiro não é um organometálico mas sim um alceno. Após adição oxidativa, ocorre inserção 1,2 do alceno no Pd-R seguida de beta-eliminação de hidreto — formando um alceno substituído com alta estereosseletividade E.',
    hint: 'Heck não passa por transmetalação — outro mecanismo após adição oxidativa.',
  },
  {
    q: 'Por que o Pd(0) é tão superior a outros metais como catalisador de cross-coupling?',
    opts: [
      'É o único metal que dissolve em solventes orgânicos',
      'Combina facilidade de adição oxidativa (Pd0→PdII) com eliminação redutiva rápida (PdII→Pd0)',
      'Pd(0) não precisa de ligantes fosfínicos',
      'Pd tem o maior número de oxidação dentre metais de transição',
    ],
    ans: 1,
    exp: 'Pd equilibra as duas etapas chave: adição oxidativa (ativação de C-X, favorecida por Pd(0) d¹⁰ eletron-rico) e eliminação redutiva (formação C-C, termodinamicamente favorável para Pd(II)). Metais como Ni são muito reativos em OA mas lentos em ER; Cu é lento em OA.',
    hint: 'O metal precisa ser bom tanto em "ativar" o haleto quanto em "liberar" o produto.',
  },
  {
    q: 'A organocatálise por enamina (List/MacMillan, Nobel 2021) ativa cetonas e aldeídos via:',
    opts: [
      'Formação de complexo de transferência de carga com o substrato',
      'Condensação reversível da amina do catalisador com a carbonila formando enamina',
      'Deprotonação do alfa-carbono pelo catalisador básico',
      'Coordenação do oxigênio da carbonila ao N do catalisador',
    ],
    ans: 1,
    exp: 'A amina secundária do catalisador condensa com a carbonila (R₂NH + RCHO → enamine + H₂O, reversível). A enamina tem densidade eletrônica aumentada no alfa-carbono, tornando-o nucleofílico. Após a reação, a enamina hidrolisa regenerando o catalisador e o produto.',
    hint: 'Pense no intermediário: amina + carbonila → ?',
  },
  {
    q: 'O E-fator (fator de resíduo ambiental) de um processo é calculado como:',
    opts: [
      'massa de produto / massa de reagentes',
      'massa de resíduos / massa de produto desejado',
      'número de etapas / rendimento total',
      'energia consumida / mol de produto',
    ],
    ans: 1,
    exp: 'E-fator = kg de resíduo / kg de produto. Indústria farmacêutica tem E-fator tipicamente 25–100; fármacos de síntese complexa podem atingir >200. Reações catalisadas reduzem o E-fator ao eliminar reagentes estequiométricos (ex: MnO₂ substituído por Pd/O₂ na oxidação de álcoois).',
    hint: 'Quanto resíduo se gera para cada kg de produto útil?',
  },,
  { q:'O TON (turnover number) de um catalisador é 10⁶. Isso significa:', opts:['O catalisador tem 10⁶ átomos metálicos','Cada átomo do sítio ativo converteu 10⁶ moléculas de substrato ao longo de sua vida útil','A reação ocorre 10⁶ vezes mais rápido que sem catalisador','O catalisador foi usado 10⁶ vezes no total'], ans:1, exp:'TON = mol produto / mol catalisador (por vida útil). TOF = TON/tempo (por hora). TON = 10⁶ indica catalisador altamente eficiente e estável. Catalisadores industriais: TON tipicamente 10⁴-10⁷. Alta TON = pouco catalisador para muito produto = menor custo e menos resíduo metálico.', hint:'TON: eficiência total. TOF: eficiência por tempo. Altos valores = catalisador excelente.' },
  { q:'O mecanismo de Langmuir-Hinshelwood na catálise heterogênea envolve:', opts:['Reação entre molécula gasosa e espécie adsorvida','Adsorção de ambos os reagentes na superfície e reação entre as espécies adsorvidas','Apenas dessorção do produto','A molécula reagindo diretamente na fase gasosa'], ans:1, exp:'Mecanismo L-H: A(g)→A* e B(g)→B* (ambos adsorvem). Reação: A*+B*→P* na superfície. Dessorção: P*→P(g). É o mais comum em catálise heterogênea. Mecanismo Eley-Rideal: apenas 1 espécie adsorve, a outra reage da fase gasosa. Mecanismo Mars-van Krevelen: o reticulado do catalisador participa diretamente.', hint:'L-H: ambos adsorvem, reagem na superfície. ER: um adsorve, outro reage do gás.' },
  { q:'A catálise por ácido de Brønsted no mecanismo de Fischer para síntese de éster:', opts:['Apenas agiliza o passo de dessorção','Protona o grupo C=O da carbonila tornando o carbono mais eletrofílico para ataque do álcool — depois remove H⁺','Remove os elétrons do álcool','Oxida o ácido carboxílico a anidrido'], ans:1, exp:'Mecanismo Fischer: H⁺ protona C=O do ácido → C eletrofílico → álcool ataca → tetraédrico intermediário → eliminação de H₂O assistida por H⁺ → éster. H⁺ é catalisador (regenerado ao final). Equilíbrio favorecido por excesso de álcool ou remoção de H₂O.', hint:'Ácido de Brønsted: doa H⁺ ao substrato → ativa para ataque nucleofílico → H⁺ regenerado.' },
  { q:'A catálise por organocatalisadores (ex: prolina) na reação aldol assimétrica funciona por:', opts:['Coordenação ao metal no sítio ativo','Formação de enamina transitória que ataca o aldeído com indução quiral do catalisador amino-ácido','Radicais livres gerados pela prolina','Ligações covalentes irreversíveis'], ans:1, exp:'Prolina (aminoácido quiral) forma enamina com cetona → o HOMO da enamina é ativado para ataque nucleofílico a aldeídos via estado de transição Zimmermann-Traxler de 6 membros. A quiralidade da prolina induz enantioseletividade (ee > 90%). Catálise sem metal — List, Nobel 2021.', hint:'Organocatálise: enamina/iminium. Prolina: ciclo de 6 membros → quiralidade transferida ao produto.' },
  { q:'O catalisador de Grubbs é usado em metátese de olefinas. O metal no núcleo ativo é:', opts:['Ferro (Fe)','Rutênio (Ru) com carbeno N-heterocíclico como ligante','Paládio (Pd)','Rodio (Rh)'], ans:1, exp:'Grubbs 1ª e 2ª geração: Ru=CHR com ligantes PCy₃ (1ª) ou NHC (2ª). O carbeno no Ru é o sítio ativo. Mecanismo: [2+2] → metalaciclobutano → [2+2] reverso. Alta atividade, tolerância a grupos funcionais. Nobel 2005 (Grubbs, Schrock, Chauvin).', hint:'Grubbs: Ru-carbeno. Metátese: troca de grupos alquilideno entre alquenos.' },
  { q:'O E-fator de um processo farmacêutico é tipicamente 25-100. Isso significa:', opts:['O medicamento tem 25% de principio ativo','São gerados 25-100 kg de resíduo para cada kg de produto final','O rendimento é de 25-100%','O custo de 25 a 100 euros por mol'], ans:1, exp:'E-fator = kg resíduo / kg produto. Fármacos: E = 25-100 (muito resíduo). Refinaria de petróleo: E ≈ 0,1. Plásticos: E ≈ 1-5. Alta E = processo não-sustentável. Química verde busca minimizar E combinando menor número de etapas, catálise eficiente e solventes verdes.', hint:'E-fator = resíduo/produto. Alto E = processo sujo. Química verde: minimizar E.' },
  { q:'A catálise de transferência de fase (PTC) usando sal de amônio quaternário:', opts:['Funciona apenas em fase gasosa','Carrega o reagente aniônico da fase aquosa para a fase orgânica, permitindo reações entre espécies em fases imiscíveis','Catalisa por mecanismo de radicais','Aumenta a temperatura de ebulição do solvente orgânico'], ans:1, exp:'PTC: cátion quaternário R₄N⁺ se associa ao ânion reativo (ex: OH⁻, CN⁻) na fase aquosa, "carrega" o par iônico para a fase orgânica onde a reação ocorre. O cátion retorna à fase aquosa para novo ciclo. Elimina solventes polares aprósticos (DMSO, DMF) caros e tóxicos.', hint:'PTC: shuttle molecular entre fases. Cátion quaternário carrega ânion para fase orgânica.' },
  { q:'Na síntese assimétrica, a enantioseletividade do catalisador é expressa como ee (excesso enantiomérico). ee = 99% significa:', opts:['Apenas 1% do produto é o enantiômero desejado','99,5% de um enantiômero e 0,5% do outro (ee = |R-S|/(R+S) × 100)','50% de cada enantiômero','Rendimento de 99%'], ans:1, exp:'ee = (|[R] - [S]|/([R]+[S])) × 100. ee = 99%: se R é o majoritário, [R]/[S] = 99,5/0,5 = 199:1. Em termos de razão enantiomérica (er): 99,5:0,5. Alta ee é essencial em fármacos (muitos têm apenas 1 enantiômero ativo).', hint:'ee = 99%: 99,5:0,5 er. ee = 0%: racemato 50:50. ee = 100%: produto enantiopuro.' },
  { q:'A catálise ácida de Lewis pelo AlCl₃ na alquilação de Friedel-Crafts:', opts:['Doa H⁺ ao substrato','Aceita par de elétrons do Cl do haleto de alquila → gera carbocátion (ou complexo ativado) que ataca o anel aroático','Reduz o haleto a alcano','Oxida o anel benzênico'], ans:1, exp:'AlCl₃ (ácido de Lewis forte) coordena ao Cl de RCl: R-Cl + AlCl₃ → R⁺[AlCl₄]⁻ (ou complexo ativado). R⁺ eletrófilo ataca o anel em SEAr. AlCl₃ é regenerado após hidrólise. Limitação: poliaquilação; produtos com rearranjo para carbocátions mais estáveis.', hint:'Lewis: aceita par de elétrons. AlCl₃ + RCl → gera eletrófilo R⁺. SEAr no anel.' },
  { q:'A catálise enzimática é geralmente mais eficiente que catalisadores sintéticos porque:', opts:['Enzimas são mais baratas','Múltiplos mecanismos cooperam: proximidade e orientação dos reagentes, estabilização do estado de transição por ligações específicas, efeitos ácido-base geral e catálise covalente no sítio ativo','Enzimas operam a temperaturas mais altas','A atividade de enzimas não depende do pH'], ans:1, exp:'Sítio ativo enzimático: (1) aproxima e orienta substratos; (2) estabiliza o estado de transição por complementaridade (Pauling: enzima se liga ao ET mais fortemente que ao substrato); (3) resíduos de aminoácidos fazem catálise ácido-base, nucleofílica e covalente em cooperação. Aceleração típica: 10⁶-10¹⁷× vs. não-catalítico.', hint:'Enzimas: sítio ativo orientado + estabilização do ET + múltiplos mecanismos cooperativos = maior eficiência.' }
];

// -------------------------------------------------------------------------
// Canvas: ciclo catalítico de Suzuki (roda animada)
// -------------------------------------------------------------------------

const CYCLE_STEPS = [
  { label: 'Adição\noxidativa',    color: '#4fc3f7', desc: 'Pd(0) + Ar-X → Ar-Pd(II)-X\nPd(0) d¹⁰ → Pd(II) d⁸; ativação da ligação C-X' },
  { label: 'Transme-\ntalação',    color: '#ffd166', desc: 'Ar-Pd-X + Ar\'B(OH)₂ → Ar-Pd-Ar\'\nBase ativa o boronato; troca do ligante X por Ar\'' },
  { label: 'Eliminação\nredutiva', color: '#6bcb77', desc: 'Ar-Pd-Ar\' → Ar-Ar\' + Pd(0)\nFormação da ligação C-C; regenera Pd(0) d¹⁰' },
];

function _drawCycle(canvas, angle, step) {
  const frame = canvas.parentElement;
  const W = Math.min(frame.clientWidth || 480, 480);
  const H = 280;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(W * dpr)) {
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    canvas.getContext('2d').scale(dpr, dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  const cx = W * 0.42;
  const cy = H * 0.50;
  const R  = Math.min(W, H) * 0.32;

  // Anel externo tracejado
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 5]);
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);

  // Centro: Pd
  const pdPulse = 0.5 + 0.5 * Math.sin(angle * 0.05);
  ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = 8 + pdPulse * 8;
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0d1117';
  ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Pd', cx, cy);

  // Estado do Pd (0 ou II) baseado na posição do ângulo no ciclo
  const pdState = (step === 0 || step === 2) ? '(0)' : '(II)';
  ctx.fillStyle = 'rgba(200,200,200,0.5)';
  ctx.font = '9px monospace';
  ctx.fillText(pdState, cx, cy + 15);

  // Nós do ciclo (3 etapas a 120° cada)
  CYCLE_STEPS.forEach((s, i) => {
    const nodeAngle = -Math.PI / 2 + (i / 3) * Math.PI * 2;
    const nx = cx + R * Math.cos(nodeAngle);
    const ny = cy + R * Math.sin(nodeAngle);

    const isActive = i === step;
    const glow = isActive ? (0.5 + 0.5 * Math.sin(angle * 0.12)) : 0;

    // Nó
    ctx.shadowColor = s.color;
    ctx.shadowBlur  = isActive ? 12 + glow * 12 : 4;
    ctx.fillStyle   = isActive ? s.color : s.color + '66';
    ctx.beginPath(); ctx.arc(nx, ny, isActive ? 16 : 12, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur  = 0;

    // Label multi-linha
    ctx.fillStyle = isActive ? '#0d1117' : 'rgba(200,200,200,0.55)';
    ctx.font = `${isActive ? 'bold ' : ''}8px monospace`;
    ctx.textBaseline = 'middle';
    const lines = s.label.split('\n');
    lines.forEach((ln, li) => {
      ctx.fillText(ln, nx, ny + (li - (lines.length - 1) / 2) * 10);
    });

    // Seta entre nós (arco)
    const nextAngle = -Math.PI / 2 + ((i + 1) / 3) * Math.PI * 2;
    const startA = nodeAngle + 0.45;
    const endA   = nextAngle - 0.45;

    ctx.strokeStyle = s.color + (isActive ? 'cc' : '44');
    ctx.lineWidth   = isActive ? 2 : 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, startA, endA);
    ctx.stroke();

    // Ponta da seta
    const arrowA = endA;
    const ax = cx + R * Math.cos(arrowA);
    const ay = cy + R * Math.sin(arrowA);
    const perpA = arrowA + Math.PI / 2;
    ctx.fillStyle = s.color + (isActive ? 'cc' : '44');
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - 7 * Math.cos(perpA - 0.4), ay - 7 * Math.sin(perpA - 0.4));
    ctx.lineTo(ax - 7 * Math.cos(perpA + 0.4), ay - 7 * Math.sin(perpA + 0.4));
    ctx.closePath(); ctx.fill();
  });

  // Painel descrição da etapa ativa (lado direito)
  const activeStep = CYCLE_STEPS[step];
  const panelX = cx + R + 20;
  const panelW = W - panelX - 8;
  if (panelW > 60) {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    const pH = 100, pY = cy - pH / 2;
    ctx.roundRect(panelX, pY, panelW, pH, 6);
    ctx.fill();

    ctx.strokeStyle = activeStep.color + '55';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(panelX, pY, panelW, pH, 6); ctx.stroke();

    ctx.fillStyle = activeStep.color;
    ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(activeStep.label.replace('\n', ' '), panelX + 8, pY + 8);

    ctx.fillStyle = 'rgba(200,200,200,0.65)';
    ctx.font = '8px monospace';
    const descLines = activeStep.desc.split('\n');
    descLines.forEach((ln, i) => ctx.fillText(ln, panelX + 8, pY + 26 + i * 14));
  }

  // Legenda no rodapé
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(200,200,200,0.25)';
  ctx.font = '8px monospace';
  ctx.fillText('Ciclo catalítico de Suzuki — Pd(0)/Pd(II)', cx, H - 8);
}

function _startCycleAnimation() {
  if (_cycleAnimId) cancelAnimationFrame(_cycleAnimId);

  const STEP_FRAMES = 80;  // frames por etapa
  let frame = 0;

  function step() {
    const canvas = document.getElementById('cycle-canvas');
    if (!canvas) return;

    _cycleAngle = frame;
    _cycleStep  = Math.floor((frame % (STEP_FRAMES * 3)) / STEP_FRAMES);
    _drawCycle(canvas, frame, _cycleStep);
    frame++;
    _cycleAnimId = requestAnimationFrame(step);
  }
  _cycleAnimId = requestAnimationFrame(step);
}

// -------------------------------------------------------------------------
// Exercícios — padrão loadExercise
// -------------------------------------------------------------------------
function loadExercise(idx) {
  const ex = EXERCISES[idx];
  if (!ex) return;
  _exAttempts = 0;
  _exDone     = false;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('cat-ex-counter', idx + 1);
  set('cat-ex-question', ex.q);

  const fb = document.getElementById('cat-ex-feedback');
  if (fb) fb.innerHTML = '';
  const nx = document.getElementById('cat-ex-next');
  if (nx) nx.style.display = 'none';

  const op = document.getElementById('cat-ex-options');
  if (op) {
    op.innerHTML = ex.opts.map((o, i) =>
      `<button class="btn btn-ghost"
               style="text-align:left;justify-content:flex-start;padding:.5rem .75rem"
               data-exopt="${i}">${esc(o)}</button>`
    ).join('');
  }
}

function _initExercises() {
  loadExercise(0);

  document.getElementById('cat-ex-options')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-exopt]');
    if (!btn || _exDone) return;
    const chosen = parseInt(btn.dataset.exopt, 10);
    const ex     = EXERCISES[_exIdx];
    const fb     = document.getElementById('cat-ex-feedback');
    if (chosen === ex.ans) {
      _exDone = true;
      if (fb) fb.innerHTML = `<div style="color:var(--accent-organic);padding:.5rem;
        border-left:3px solid var(--accent-organic);background:var(--bg-raised);
        margin-top:.5rem;border-radius:4px">&#10003; Correto! ${esc(ex.exp)}</div>`;
      markSectionDone('catalysis', 'exercise');
      const nx = document.getElementById('cat-ex-next');
      if (nx && _exIdx < EXERCISES.length - 1) nx.style.display = 'inline-block';
    } else {
      _exAttempts++;
      if (fb) fb.innerHTML = `<div style="color:var(--accent-reaction);padding:.5rem;
        border-left:3px solid var(--accent-reaction);background:var(--bg-raised);
        margin-top:.5rem;border-radius:4px">
        &#10007; Tente novamente.${_exAttempts >= 1 ? ' ' + esc(ex.hint) : ''}</div>`;
    }
  });

  document.getElementById('cat-ex-next')?.addEventListener('click', () => {
    _exIdx++;
    if (_exIdx < EXERCISES.length) loadExercise(_exIdx);
  });
}

// -------------------------------------------------------------------------
// render / destroy
// -------------------------------------------------------------------------
export function render(outlet) {
  if (_cycleAnimId) { cancelAnimationFrame(_cycleAnimId); _cycleAnimId = null; }
  _exIdx = 0; _exAttempts = 0; _exDone = false;

  outlet.innerHTML = `
<div class="module-page">
  <button class="module-back btn-ghost" data-nav="/modules">&#8592; Módulos</button>
  <header class="module-header">
    <h1 class="module-title">Catálise Avançada</h1>
    <p class="module-concept">
      Catalisadores não alteram a termodinâmica de uma reação — alteram o caminho.
      Da escala de laboratório à indústria farmacêutica, catálise por metais de transição
      e organocatálise definem como se constroem moléculas complexas com seletividade e eficiência.
    </p>
  </header>

  <!-- Fenômeno -->
  <section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">
      O ibuprofeno pode ser sintetizado em 6 etapas (rota clássica, E-fator ~26) ou
      em 3 etapas com catálise por Pd e Rh (rota da Hoechst, E-fator &lt;1).
      Cada prêmio Nobel em química de 2001, 2010 e 2021 foi em catálise seletiva —
      o campo que decide como se constroem as moléculas do futuro.
    </p>
  </section>

  <!-- Cross-coupling -->
  <section class="module-section">
    <h2 class="module-section-title">Reações de cross-coupling catalisadas por Pd</h2>
    <p class="module-text">
      Acoplamentos de cross-coupling formam ligações C–C entre um haleto orgânico e um
      organometálico via ciclo catalítico de Pd(0)/Pd(II). Nobel 2010: Heck, Negishi, Suzuki.
    </p>
    <div style="overflow-x:auto;margin-bottom:var(--space-4)">
      <table style="border-collapse:collapse;width:100%;font-size:var(--text-xs)">
        <thead>
          <tr style="color:var(--text-muted);border-bottom:1px solid var(--border-default)">
            <th style="text-align:left;padding:.4rem .6rem">Reação</th>
            <th style="text-align:left;padding:.4rem .6rem">Parceiro organometálico</th>
            <th style="text-align:left;padding:.4rem .6rem">Ligação formada</th>
            <th style="text-align:left;padding:.4rem .6rem">Característica</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['Suzuki-Miyaura', 'ArB(OH)₂ (ácido borônico)', 'C(sp²)–C(sp²)', 'Tolerante a água e ar; amplo escopo; baixa toxicidade'],
            ['Heck-Mizoroki',  'Alceno R-CH=CH₂',           'C(sp²)–C(sp²)', 'Sem organometálico; estereosseletividade E; β-H eliminação'],
            ['Negishi',        'Organozinco R-ZnX',          'C–C (sp/sp²/sp³)', 'Alta funcionalidade; tolera grupos sensíveis'],
            ['Buchwald-Hartwig','Amina R₂NH',                'C(sp²)–N',      'Síntese de anilinas; farmacêutico; base necessária'],
            ['Sonogashira',    'Alcino terminal R-C≡C-H',   'C(sp²)–C(sp)',  'Cu co-catalisador; materiais pi-conjugados'],
          ].map(([r, p, l, c]) => `
            <tr style="border-bottom:1px solid var(--border-subtle)">
              <td style="padding:.4rem .6rem;color:var(--accent-electron);font-weight:600">${esc(r)}</td>
              <td style="padding:.4rem .6rem;font-family:monospace;color:var(--text-primary)">${esc(p)}</td>
              <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-bond)">${esc(l)}</td>
              <td style="padding:.4rem .6rem;color:var(--text-secondary)">${esc(c)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- Ciclo catalítico animado -->
    <h3 style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-3)">
      Ciclo catalítico — Suzuki-Miyaura
    </h3>
    <div class="canvas-frame" id="cycle-frame">
      <canvas id="cycle-canvas" aria-label="Ciclo catalítico de Suzuki animado"></canvas>
    </div>

    <!-- Detalhes das etapas -->
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-top:var(--space-4)">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron);font-size:var(--text-sm)">
          1. Adição Oxidativa
        </h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.4rem">
          Pd(0) + Ar-X → Ar-Pd(II)-X
        </p>
        <p style="font-size:var(--text-sm)">
          Pd(0) d¹⁰ insere-se na ligação C-X. Velocidade: I &gt; Br &gt; OTf &gt;&gt; Cl.
          Ligantes fosfínicos volumosos (PPh₃, dppf) estabilizam Pd(0) e controlam a velocidade.
        </p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond);font-size:var(--text-sm)">
          2. Transmetalação
        </h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.4rem">
          Ar-Pd-X + Ar'B(OH)₂ → Ar-Pd-Ar'
        </p>
        <p style="font-size:var(--text-sm)">
          Base (K₂CO₃, CsF) ativa o boronato formando [Ar'B(OH)₃]⁻, que reage com Pd.
          É a etapa determinante em muitos substratos.
        </p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic);font-size:var(--text-sm)">
          3. Eliminação Redutiva
        </h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.4rem">
          Ar-Pd(II)-Ar' → Ar-Ar' + Pd(0)
        </p>
        <p style="font-size:var(--text-sm)">
          Formação da ligação C-C com retenção de configuração e regeneração do Pd(0).
          Muito rápida para acoplamentos C(sp²)-C(sp²). Termina o ciclo.
        </p>
      </div>
    </div>
  </section>

  <!-- Organocatálise -->
  <section class="module-section">
    <h2 class="module-section-title">Organocatálise — Nobel 2021</h2>
    <p class="module-text">
      Benjamin List e David MacMillan demonstraram que moléculas orgânicas simples
      (aminas, tioureiras, ácidos fosfóricos BINAP) catalisam reações assimétricas
      com seletividades comparáveis às enzimas — sem metais de transição.
    </p>
    <div class="module-grid" style="grid-template-columns:1fr 1fr">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Catálise por enamina</h3>
        <p style="font-size:var(--text-sm)">
          Uma amina secundária condensa com aldeídos/cetonas formando enamina
          (nucleofílica no alfa-C). A reação ocorre na esfera do catalisador quiral;
          após a etapa-chave, hidrólise regenera o catalisador e libera o produto enantioenriquecido.
        </p>
        <p style="font-family:monospace;font-size:var(--text-xs);color:var(--accent-bond);margin-top:.4rem">
          R₂NH + RCHO ⇌ Enamina (ativa)<br>
          Enamina + E → Iminium + E<br>
          Iminium + H₂O → Produto + R₂NH
        </p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Catálise por iminium</h3>
        <p style="font-size:var(--text-sm)">
          A amina condensa com aldeídos formando sal de iminium (LUMO baixado → eletrófilo
          ativado). Nucleófilos atacam o alpha-C do iminium com alto ee controlado pela
          geometria do catalisador quiral.
        </p>
        <p style="font-family:monospace;font-size:var(--text-xs);color:var(--accent-electron);margin-top:.4rem">
          R₂NH + RCHO → [R₂N=CHR]⁺ (iminium)<br>
          Nu⁻ + iminium → alfa-aduto<br>
          Hidrólise → Produto enantioenriquecido
        </p>
      </div>
    </div>

    <!-- Comparação catalisadores -->
    <h3 style="font-size:var(--text-sm);color:var(--text-secondary);
               margin-top:var(--space-5);margin-bottom:var(--space-3)">
      Comparação de plataformas catalíticas
    </h3>
    <div style="overflow-x:auto">
      <table style="border-collapse:collapse;width:100%;font-size:var(--text-xs)">
        <thead>
          <tr style="color:var(--text-muted);border-bottom:1px solid var(--border-default)">
            <th style="text-align:left;padding:.4rem .6rem">Tipo</th>
            <th style="text-align:right;padding:.4rem .6rem">TON típico</th>
            <th style="text-align:right;padding:.4rem .6rem">TOF (h⁻¹)</th>
            <th style="text-align:left;padding:.4rem .6rem">ee máx.</th>
            <th style="text-align:left;padding:.4rem .6rem">Vantagem</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['Pd cross-coupling',    '10³–10⁶', '10²–10⁴', 'Aquiral', 'Amplo escopo C-C/C-N'],
            ['Organocatálise',       '10–10³',   '1–100',   '90–99%', 'Sem metal; robusto; barato'],
            ['Enzima (natural)',     '10⁶–10⁷', '10³–10⁷', '>99%',   'Perfeita seletividade; água'],
            ['Ru/Os assimétrico',   '10²–10⁴', '10²–10³', '95–99%', 'Hidrogenação assimétrica'],
            ['Catálise por fase-transfer','10²','10–10²',  '80–98%', 'Barato; fácil scale-up'],
          ].map(([t, ton, tof, ee, adv]) => `
            <tr style="border-bottom:1px solid var(--border-subtle)">
              <td style="padding:.4rem .6rem;color:var(--text-primary);font-weight:600">${esc(t)}</td>
              <td style="padding:.4rem .6rem;text-align:right;color:var(--accent-electron)">${esc(ton)}</td>
              <td style="padding:.4rem .6rem;text-align:right;color:var(--accent-bond)">${esc(tof)}</td>
              <td style="padding:.4rem .6rem;color:var(--accent-organic)">${esc(ee)}</td>
              <td style="padding:.4rem .6rem;color:var(--text-secondary)">${esc(adv)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- Química verde e E-fator -->
  <section class="module-section">
    <h2 class="module-section-title">Eficiência atômica e E-fator</h2>
    <p class="module-text">
      Catálise transforma o E-fator porque substitui reagentes estequiométricos
      (que viram resíduo) por catalisadores que se regeneram.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;font-size:var(--text-sm)">Eficiência atômica</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.4rem">EA = M_produto / ΣM_reagentes × 100%</p>
        <p style="font-size:var(--text-sm)">Mede a fração dos átomos dos reagentes que aparece no produto. Reação de adição: 100%. Substituição com subproduto: &lt;100%.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;font-size:var(--text-sm)">E-fator (Sheldon)</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.4rem">E = kg resíduo / kg produto</p>
        <p style="font-size:var(--text-sm)">
          Refinaria: 0,1 · Química fina: 5–50 · Fármaco: 25–100+.
          Catálise reduz E porque elimina oxidantes estequiométricos (MnO₄⁻, CrO₃).
        </p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;font-size:var(--text-sm)">TON e TOF</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.4rem">TON = mol produto / mol cat.<br>TOF = TON / tempo</p>
        <p style="font-size:var(--text-sm)">A enzima anidrase carbônica tem TOF ~ 10⁶ s⁻¹ — o catalisador mais rápido conhecido. Catalisadores industriais de Pd operam com TON &gt; 10⁶.</p>
      </div>
    </div>
  </section>

  <!-- Exercícios -->
  <section class="module-section">
    <h2 class="module-section-title">Exercícios (<span id="cat-ex-counter">1</span>/${EXERCISES.length})</h2>
    <div class="exercise-card" style="background:var(--bg-raised);padding:var(--space-4);border-radius:8px">
      <p id="cat-ex-question" class="exercise-question"
         style="font-size:var(--text-base);margin-bottom:var(--space-3)"></p>
      <div id="cat-ex-options"
           style="display:flex;flex-direction:column;gap:.4rem;max-width:520px"></div>
      <div id="cat-ex-feedback"></div>
      <button class="btn btn-ghost btn-sm" id="cat-ex-next"
              style="margin-top:var(--space-3);display:none">
        Próximo exercício &#8594;
      </button>
    </div>
  </section>

  <!-- Cotidiano -->
  <section class="module-section">
    <h2 class="module-section-title">No cotidiano</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      <div class="real-life-card info-card">
        <h3 style="margin-top:0">Síntese de fármacos</h3>
        <p style="font-size:var(--text-sm)">Losartana (anti-hipertensivo), Gleevec (anticancerígeno) e Valsartana usam acoplamentos de Suzuki ou Buchwald-Hartwig em escala industrial.</p>
      </div>
      <div class="real-life-card info-card">
        <h3 style="margin-top:0">Polímeros pi-conjugados</h3>
        <p style="font-size:var(--text-sm)">OLEDs, células solares de perovskita e transistores orgânicos são feitos por acoplamento de Suzuki e Sonogashira em sequências iterativas.</p>
      </div>
      <div class="real-life-card info-card">
        <h3 style="margin-top:0">Aromas e sabores</h3>
        <p style="font-size:var(--text-sm)">Mais de 80% dos compostos de perfumaria são sintetizados por rotas catalíticas (Rh-BINAP para mentol, Pd para ionona). 35 000 t/ano de mentol.</p>
      </div>
      <div class="real-life-card info-card">
        <h3 style="margin-top:0">Catalisador de automóvel</h3>
        <p style="font-size:var(--text-sm)">Pt e Pd catalisam a oxidação de CO e hidrocarbonetos e a redução de NOₓ no catalisador três-vias, operando a &gt;600°C com TON &gt; 10⁸.</p>
      </div>
    </div>
  </section>
</div>`;

  _startCycleAnimation();
  _initExercises();
  markSectionDone('catalysis', 'visited');
}

export function destroy() {
  if (_cycleAnimId) { cancelAnimationFrame(_cycleAnimId); _cycleAnimId = null; }
}
