/**
 * modules/photochemistry/index.js — Módulo: Fotoquímica
 * Lavoisier — Laboratório Visual de Química
 *
 * Cobre Graduação 2º ano+:
 *  - Lei de Stark-Einstein: um fóton absorvido excita uma molécula
 *  - Diagrama de Jablonski: S0, S1, T1, IC, ISC, fluorescência, fosforescência
 *  - Canvas animado do Jablonski com fóton, excitação e emissão
 *  - Fluorescência vs fosforescência: tempo, multiplicidade, shift de Stokes
 *  - Rendimento quântico Φ = k_rad / (k_rad + k_nr)
 *  - Fotossensibilização e geração de oxigênio singlete ¹O₂
 *  - Fotocatálise: TiO₂ + hv → e⁻ (BC) + h⁺ (BV) → ROS → degradação
 *  - Calculadora de energia de fóton E = hc/λ e Φ interativo
 *  - 5 exercícios com dica progressiva
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';

// Estado local — resetado em render()
let _jabAnimId  = null;
let _exIdx      = 0;
let _exAttempts = 0;
let _exDone     = false;

// -------------------------------------------------------------------------
// Exercícios
// -------------------------------------------------------------------------
const EXERCISES = [
  {
    q: 'Qual processo no diagrama de Jablonski ocorre sem emissão de fóton e dissipa energia como calor?',
    opts: ['Fluorescência', 'Fosforescência', 'Conversão interna (IC)', 'Absorção'],
    ans: 2,
    exp: 'A conversão interna (IC) é uma transição radiationless entre estados de mesma multiplicidade (S1→S0). A energia é dissipada como vibração/calor, sem fóton emitido.',
    hint: 'Procure o processo que conecta estados de mesma multiplicidade sem emissão de luz.',
  },
  {
    q: 'A fluorescência ocorre em nanosegundos e a fosforescência em milissegundos a segundos. Qual é a razão fundamental?',
    opts: [
      'A fluorescência usa lasers mais intensos',
      'A fosforescência passa pelo cruzamento intersistemas (T1), que é proibido por spin',
      'O solvente absorve a emissão de fosforescência',
      'A fluorescência tem maior rendimento quântico sempre',
    ],
    ans: 1,
    exp: 'A emissão T1→S0 (fosforescência) viola a regra de conservação de multiplicidade de spin — é uma transição "proibida" que por isso ocorre muito mais lentamente (10⁻³ a 10⁰ s vs 10⁻⁹ s da fluorescência).',
    hint: 'Pense nos números quânticos de spin de T1 e S0.',
  },
  {
    q: 'Um fóton de λ = 400 nm excita uma molécula de corante. A fluorescência emitida tem λ = 520 nm. O deslocamento de Stokes é de:',
    opts: ['120 nm (azul)', '120 nm (para comprimentos maiores)', '-120 nm (para comprimentos menores)', '0 nm — a emissão ocorre no mesmo comprimento de onda'],
    ans: 1,
    exp: 'O deslocamento de Stokes é sempre positivo: a emissão ocorre em comprimento de onda maior (energia menor) que a absorção, pois a molécula relaxa vibracionalmente antes de emitir. Δλ = 520 - 400 = 120 nm.',
    hint: 'Lembre que o relaxamento vibracional no S1 ocorre antes da emissão.',
  },
  {
    q: 'Na fotocatálise com TiO₂, a irradiação UV gera pares elétron-lacuna. Qual espécie é responsável pela oxidação de poluentes orgânicos?',
    opts: ['e⁻ na banda de condução', 'h⁺ na banda de valência (direta) ou radical •OH (via H₂O)', 'O₂ molecular dissolvido', 'Ti⁴⁺ reduzido a Ti³⁺'],
    ans: 1,
    exp: 'O h⁺ na banda de valência (Ev ≈ +2,7 V vs NHE) oxida diretamente substratos orgânicos ou oxida H₂O a •OH. O radical hidroxila (•OH) é o oxidante primário na fase aquosa, responsável pela mineralização completa de poluentes.',
    hint: 'O potencial de oxidação da banda de valência do TiO₂ é muito positivo.',
  },
  {
    q: 'Uma molécula tem k_rad = 2×10⁸ s⁻¹ e k_nr = 8×10⁸ s⁻¹. Qual é o rendimento quântico de fluorescência Φ?',
    opts: ['0,80', '0,20', '0,25', '0,40'],
    ans: 1,
    exp: 'Φ = k_rad / (k_rad + k_nr) = 2×10⁸ / (2×10⁸ + 8×10⁸) = 2/10 = 0,20. O tempo de vida τ = 1/(k_rad + k_nr) = 1 ns.',
    hint: 'Φ = taxa radiativa / (taxa radiativa + todas as taxas não-radiativas).',
  },,
  { q:'A energia de um fóton de luz azul (λ = 450 nm) em kJ/mol é: (h=6,63×10⁻³⁴ J·s, c=3×10⁸ m/s, NA=6,022×10²³)', opts:['132 kJ/mol','265 kJ/mol','532 kJ/mol','66 kJ/mol'], ans:1, exp:'E = hcNA/λ = (6,63×10⁻³⁴ × 3×10⁸ × 6,022×10²³) / 450×10⁻⁹ = 1,197×10⁵/450×10⁻⁹/10³ ... = 265 kJ/mol. Fótons UV têm mais energia que os visíveis — por isso o UV quebra ligações orgânicas (~350 kJ/mol para C-C).', hint:'E = hcNA/λ. λ em metros. Resultado em J/mol; dividir por 1000 para kJ/mol.' },
  { q:'A regra de Kasha diz que a emissão de fluorescência ocorre sempre a partir de:', opts:['O nível S_n mais alto excitado','O nível vibracional mais baixo do primeiro estado eletrônico excitado (S₁, v=0) — após relaxação vibracional rápida','Qualquer nível excitado diretamente após absorção','T₁ se o S₁ for instável'], ans:1, exp:'Regra de Kasha: independentemente do nível excitado pela absorção (S₂, S₃...), a emissão ocorre sempre de S₁,v=0 após relaxação vibracional ultrarrápida (~10⁻¹²s). Consequência: o espectro de emissão é idêntico independentemente do λ de excitação. Exceção: azuleno emite de S₂.', hint:'Kasha: emissão sempre de S₁,v=0. Relaxação vibracional primeiro (ps), depois emissão (ns).' },
  { q:'A reação de cicloadição [2+2] ocorre fotoquimicamente (hν) mas não termicamente porque:', opts:['Requer calor para superar Ea muito alta','As regras de Woodward-Hoffmann: [2+2] é orbitalmente proibido termicamente (concertado suprafacial-suprafacial) mas permitido fotoquimicamente (um reagente excitado)','[2+2] só ocorre em UV de alta energia','A reação é endotérmica no estado fundamental'], ans:1, exp:'Woodward-Hoffmann: reações pericíclicas são orbitalmente permitidas ou proibidas dependendo do número de elétrons e se são suprafaciais/antarafaciais. [2+2] suprafacial: 4 elétrons → HOMO-LUMO de mesma fase → proibido termicamente. Fotoquimicamente: promove 1 e⁻ para LUMO (que vira novo HOMO) → permitido.', hint:'WH: [2+2] térmico: proibido. Fotoquímico: permitido. [4+2] (Diels-Alder): térmico: permitido.' },
  { q:'O rendimento quântico Φ = 0,9 para fluorescência da rodamina B significa:', opts:['90% dos fótons absorvidos são reemitidos como fluorescência','A molécula absorve 90% da luz incidente','90% da energia é convertida em calor','O coeficiente de extinção molar é 0,9'], ans:0, exp:'Φ = fótons emitidos / fótons absorvidos = k_rad / (k_rad + k_nr). Φ = 0,9 para rodamina B: 90% dos fótons absorvidos são reemitidos como fluorescência. Os 10% restantes são dissipados não-radiativamente (calor, conversão interna). Alta Φ = fluoróforo eficiente.', hint:'Φ = emitidos/absorvidos. Φ=1: toda absorção gera emissão. Φ=0: sem emissão.' },
  { q:'A fotossensibilização é o processo em que:', opts:['A molécula absorve luz infravermelha','Um sensitizador absorve luz, atinge T₁ e transfere energia para outra molécula (ex: O₂ → ¹O₂) por transferência de energia triplete-triplete','A molécula emite elétrons por efeito fotoelétrico','O sensitizador é permanentemente destruído'], ans:1, exp:'Sensitizador absorve hν → S₁ → ISC → T₁. T₁ longa vida → transferência de energia para O₂ (triplete no estado fundamental, ³Σg) → ¹O₂ (singleto, altamente reativo). Usado em terapia fotodinâmica (TFD) para destruição de células tumorais e em fotossíntese artificial.', hint:'Sensitizador: absorve luz → T₁ → transfere energia para O₂ → ¹O₂ (oxidante).' },
  { q:'A isomerização cis-trans do retinal (rhodopsina) na visão:', opts:['Ocorre no estado fundamental sem luz','É uma reação fotoquímica ultrarrápida: 11-cis-retinal + hν → all-trans-retinal em ~200 femtossegundos','Requer catálise enzimática no estado excitado','Libera elétrons para um condutor'], ans:1, exp:'O cromóforo 11-cis-retinal absorve fóton → S₁ excitado → isomerização via conical intersection ultrarrápida (~200 fs) → all-trans-retinal. A mudança de forma ativa a proteína opsina → cascata de sinalização → impulso nervoso. Uma das reações fotoquímicas mais estudadas e eficientes (Φ ≈ 0,65).', hint:'Visão: 11-cis-retinal → fóton → all-trans (200 fs). Φ ≈ 0,65. Ativa opsina.' },
  { q:'Qual é a diferença entre conversão interna (CI) e cruzamento intersistemas (ISC)?', opts:['CI: S₁→S₀ com emissão; ISC: S₁→T₁ sem emissão','CI: transição entre estados de mesma multiplicidade (S₁→S₀, sem mudança de spin); ISC: transição entre estados de multiplicidade diferente (S₁→T₁, com mudança de spin)','Ambas emitem fótons','CI é mais lenta que ISC'], ans:1, exp:'CI (S₁→S₀): mesma multiplicidade, sem mudar spin → permitido, rápido (~10⁻¹¹ s). ISC (S₁→T₁): mudança de multiplicidade (singleto→tripleto), requer acoplamento spin-órbita → lento relativo (~10⁻⁸ s), mas muito mais lento que CI em moléculas sem átomos pesados.', hint:'CI: mesmo spin (S→S ou T→T). ISC: muda spin (S→T). ISC: "proibido" por spin → mais lento.' },
  { q:'O efeito de átomo pesado (heavy atom effect) na fosforescência:', opts:['Diminui a emissão de todos os estados','Aumenta o acoplamento spin-órbita → ISC mais eficiente → T₁ mais populado → fosforescência mais intensa','Remove os elétrons do orbital p','Desloca o espectro para o vermelho apenas'], ans:1, exp:'Átomos pesados (I, Br, Pt, Ir) têm grande acoplamento spin-órbita (Z⁴ dependência). Isso mistura estados S e T → ISC mais eficiente → T₁ mais populado → fosforescência mais intensa e/ou τ menor. OLEDs de Ir(ppy)₃ exploram esse efeito para emissão de T₁ (fosforescência) com alta eficiência.', hint:'Átomo pesado → acoplamento SO grande → ISC eficiente → mais fosforescência. OLEDs de Ir(III).' },
  { q:'A reação de Paternò-Büchi ([2+2] fotoquímica de cetona com alqueno) produz:', opts:['Um álcool','Um oxetano (anel de 4 membros contendo O)','Um epóxido','Um aldeído'], ans:1, exp:'Paternò-Büchi: cetona excitada (nπ*, T₁) + alqueno → oxetano via exciplexo ou diradical. É a fotocicloadição [2+2] de cetona carbonílica + alqueno. Produz oxetanos (4 membros, O no anel). Exemplo: acetona + 2-buteno → 2,2-dimetil-3-metiloxetano.', hint:'Paternò-Büchi: cetona* + alqueno → oxetano. [2+2] fotoquímica com C=O.' },
  { q:'A espectroscopia de ação (action spectrum) de uma reação fotoquímica mostra:', opts:['O espectro de absorção do produto','A dependência da eficiência da reação com o comprimento de onda de irradiação — mapeia quais λ causam o efeito biológico ou químico','O espectro de emissão do sensitizador','A taxa de decaimento em função do λ'], ans:1, exp:'Espectro de ação: varia-se λ de irradiação e mede-se o rendimento/resposta (ex: crescimento algal, eritema solar, fotodegradação). Quando coincide com o espectro de absorção de um cromóforo → identifica o sensitizador responsável. Fundamental para determinar o cromóforo ativo in vivo (ex: DNA para UV-B).', hint:'Espectro de ação: qual λ causa o efeito. Coincide com absorção do cromóforo responsável.' }
];

// -------------------------------------------------------------------------
// Canvas: diagrama de Jablonski animado
// -------------------------------------------------------------------------

/*
 * Diagrama de Jablonski simplificado:
 *
 *  Energia (eixo Y)
 *
 *  S1 ─────────────────────  (excitado singlete)
 *       ↑ abs   ↓ IC    ↓ ISC → T1
 *  S0 ─────────────────────  (fundamental)
 *                      T1 ──  (triplete)
 *
 * Processos animados em sequência:
 *   1. Fóton sobe de S0 → S1 (absorção, azul)
 *   2. Relaxamento vibracional (seta ondulada, cinza)
 *   3. Emissão: fluorescência S1→S0 (verde) OU ISC+fosforescência (laranja)
 */

// Posições Y normalizadas (0 = topo, 1 = base)
const JAB = {
  S0_Y: 0.82,
  S1_Y: 0.18,
  T1_Y: 0.42,
  S_X:  0.28,   // coluna S (absorção / fluorescência)
  T_X:  0.72,   // coluna T (ISC / fosforescência)
  LEVEL_W: 0.30,
};

let _jabMode = 'fl';  // 'fl' = fluorescência | 'ph' = fosforescência
let _jabT    = 0;     // tempo de animação (0→1 por fase)
let _jabPhase = 0;    // 0=absorção, 1=relaxamento, 2=emissão

function _drawJablonski(canvas, t, phase, mode) {
  const frame = canvas.parentElement;
  const W = Math.min(frame.clientWidth || 520, 520);
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

  const px = f => f * W;
  const py = f => f * H;

  // Fundo
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  // Eixo energia (Y)
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px(0.06), py(0.05)); ctx.lineTo(px(0.06), py(0.95)); ctx.stroke();
  ctx.fillStyle = 'rgba(200,200,200,0.4)';
  ctx.font = '9px monospace'; ctx.textAlign = 'center';
  ctx.save(); ctx.translate(px(0.03), py(0.5)); ctx.rotate(-Math.PI/2);
  ctx.fillText('Energia', 0, 0); ctx.restore();

  // Níveis de energia — linhas horizontais com vibrações (linhas finas acima)
  function drawLevel(xC, y, label, color, nVib = 3) {
    const x0 = px(xC - JAB.LEVEL_W / 2);
    const x1 = px(xC + JAB.LEVEL_W / 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x0, py(y)); ctx.lineTo(x1, py(y)); ctx.stroke();
    // Subnível vibracional (linhas finas acima)
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = color.replace(')', ',0.35)').replace('rgb','rgba');
    for (let i = 1; i <= nVib; i++) {
      const yv = py(y - i * 0.045);
      ctx.beginPath(); ctx.moveTo(x0, yv); ctx.lineTo(x1, yv); ctx.stroke();
    }
    // Label
    ctx.fillStyle = color;
    ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';
    ctx.fillText(label, x1 + 4, py(y) + 4);
  }

  drawLevel(JAB.S_X, JAB.S0_Y, 'S₀', '#4fc3f7');
  drawLevel(JAB.S_X, JAB.S1_Y, 'S₁', '#4fc3f7');
  drawLevel(JAB.T_X, JAB.T1_Y, 'T₁', '#ffd166');

  // Seta genérica com label
  function drawArrow(x1, y1, x2, y2, color, label, dashed = false) {
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.8;
    if (dashed) ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    // Ponta da seta
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const aLen  = 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - aLen * Math.cos(angle - 0.4), y2 - aLen * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - aLen * Math.cos(angle + 0.4), y2 - aLen * Math.sin(angle + 0.4));
    ctx.closePath(); ctx.fill();
    // Label
    if (label) {
      ctx.fillStyle = color;
      ctx.font = '9px monospace'; ctx.textAlign = 'center';
      const mx = (x1 + x2) / 2 - 14;
      const my = (y1 + y2) / 2;
      ctx.fillText(label, mx, my);
    }
  }

  // Seta ondulada (relaxamento vibracional)
  function drawWavy(x, y1, y2, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const yw = y1 + (y2 - y1) * (i / steps);
      const xw = x + Math.sin(i * Math.PI * 0.9) * 5;
      i === 0 ? ctx.moveTo(xw, yw) : ctx.lineTo(xw, yw);
    }
    ctx.stroke();
    ctx.fillStyle = color;
    const a = Math.atan2(y2 - y1, 0);
    ctx.beginPath();
    ctx.moveTo(x, y2);
    ctx.lineTo(x - 5, y2 - 8); ctx.lineTo(x + 5, y2 - 8);
    ctx.closePath(); ctx.fill();
    ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillStyle = color;
    ctx.fillText('IC', x - 8, (y1 + y2) / 2 + 4);
  }

  const sX  = px(JAB.S_X);
  const tX  = px(JAB.T_X);
  const s0Y = py(JAB.S0_Y);
  const s1Y = py(JAB.S1_Y);
  const t1Y = py(JAB.T1_Y);

  // --- Fase 0: Absorção (fóton sobe S0 → S1) ---
  if (phase === 0) {
    const yStart = s0Y;
    const yEnd   = s1Y + (s0Y - s1Y) * 0.08; // levemente acima de S1
    const yCur   = s0Y - (s0Y - yEnd) * t;
    // Círculo fóton
    const r = 7;
    ctx.fillStyle = '#4fc3f7';
    ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(sX, yCur, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Seta de absorção (completa)
    drawArrow(sX + 12, s0Y, sX + 12, s1Y + 10, '#4fc3f7', 'Abs');
    // Label fóton
    ctx.fillStyle = 'rgba(79,195,247,0.7)';
    ctx.font = '9px monospace'; ctx.textAlign = 'left';
    ctx.fillText('hν', sX + r + 2, yCur - r);
  }

  // --- Fase 1: Relaxamento vibracional S1 → v=0 de S1 ---
  if (phase === 1) {
    drawArrow(sX + 12, s0Y, sX + 12, s1Y + 10, '#4fc3f7', 'Abs');
    // Seta ondulada
    const yRelax = s1Y + 40 * t;   // desce lentamente dentro de S1
    drawWavy(sX, s1Y + 10, Math.min(yRelax, s1Y + 38), 'rgba(150,150,150,0.6)');
  }

  // --- Fase 2: Emissão ---
  if (phase === 2) {
    drawArrow(sX + 12, s0Y, sX + 12, s1Y + 10, '#4fc3f7', 'Abs');
    drawWavy(sX, s1Y + 10, s1Y + 38, 'rgba(150,150,150,0.4)');

    if (mode === 'fl') {
      // Fluorescência: S1 → S0 (seta verde)
      const yF = s1Y + 38 + (s0Y - s1Y - 48) * t;
      ctx.shadowColor = '#6bcb77'; ctx.shadowBlur = 10;
      drawArrow(sX - 12, s1Y + 38, sX - 12, s0Y, '#6bcb77', 'Fl');
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#6bcb77';
      ctx.beginPath(); ctx.arc(sX - 12, yF, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(107,203,119,0.7)';
      ctx.font = '9px monospace'; ctx.textAlign = 'right';
      ctx.fillText('hν\'', sX - 22, yF - 8);
    } else {
      // ISC + fosforescência
      // ISC: S1 → T1 (seta horizontal tracejada)
      const xISC = sX + (tX - sX) * t;
      const yISC = s1Y + 38 + (t1Y - s1Y - 38) * t;
      drawArrow(sX, s1Y + 38, tX, t1Y, '#ffd166', 'ISC', true);
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(xISC, yISC, 6, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Fase 3: fosforescência após ISC
  if (phase === 3 && mode === 'ph') {
    drawArrow(sX + 12, s0Y, sX + 12, s1Y + 10, '#4fc3f7', 'Abs');
    drawWavy(sX, s1Y + 10, s1Y + 38, 'rgba(150,150,150,0.4)');
    drawArrow(sX, s1Y + 38, tX, t1Y, '#ffd166', 'ISC', true);
    // Fosforescência T1→S0
    const yPh = t1Y + (s0Y - t1Y) * t;
    ctx.shadowColor = '#ef476f'; ctx.shadowBlur = 10;
    drawArrow(tX, t1Y, tX, s0Y, '#ef476f', 'Fos');
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ef476f';
    ctx.beginPath(); ctx.arc(tX, yPh, 7, 0, Math.PI * 2); ctx.fill();
  }

  // Labels estáticos
  ctx.fillStyle = 'rgba(200,200,200,0.35)';
  ctx.font = '9px monospace'; ctx.textAlign = 'center';
  ctx.fillText('Absorção  IC  Fluorescência', px(0.28), py(0.97));
  ctx.fillText('ISC  Fosforescência', px(0.72), py(0.97));
}

function _startJabAnimation() {
  if (_jabAnimId) cancelAnimationFrame(_jabAnimId);

  const phaseDur = [60, 40, 60, 60]; // frames por fase
  let frame = 0;
  const totalPhases = _jabMode === 'fl' ? 3 : 4;
  const totalFrames = phaseDur.slice(0, totalPhases).reduce((a, b) => a + b, 0);

  function step() {
    const canvas = document.getElementById('jab-canvas');
    if (!canvas) return;

    // Calcular fase e t atual
    let rem = frame % (totalFrames + 30); // +30 frames de pausa no fim
    let ph = 0, localT = 0;
    for (let p = 0; p < totalPhases; p++) {
      if (rem < phaseDur[p]) { ph = p; localT = rem / phaseDur[p]; break; }
      rem -= phaseDur[p];
    }
    if (rem >= 0) { ph = totalPhases - 1; localT = 1; }

    _drawJablonski(canvas, localT, ph, _jabMode);
    frame++;
    _jabAnimId = requestAnimationFrame(step);
  }
  _jabAnimId = requestAnimationFrame(step);
}

// -------------------------------------------------------------------------
// Calculadora de energia de fóton e rendimento quântico
// -------------------------------------------------------------------------
function _initCalculators() {
  function updatePhoton() {
    const lam = parseFloat(document.getElementById('ph-lambda')?.value ?? 500);
    document.getElementById('ph-lam-val').textContent = lam + ' nm';
    const h = 6.626e-34, c = 3e8, eV = 1.602e-19;
    const E_J  = h * c / (lam * 1e-9);
    const E_eV = E_J / eV;
    const E_kJ = E_J * 6.022e23 / 1000;
    const region =
      lam < 280 ? 'UV-C' : lam < 315 ? 'UV-B' : lam < 400 ? 'UV-A' :
      lam < 500 ? 'Violeta/Azul' : lam < 580 ? 'Verde' :
      lam < 620 ? 'Amarelo/Laranja' : lam < 700 ? 'Vermelho' : 'IV próximo';
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('ph-E-eV', E_eV.toFixed(3) + ' eV');
    set('ph-E-kJ', E_kJ.toFixed(1) + ' kJ/mol');
    set('ph-region', region);
  }

  function updateQY() {
    const krad = parseFloat(document.getElementById('qy-krad')?.value ?? 1) * 1e8;
    const knr  = parseFloat(document.getElementById('qy-knr')?.value  ?? 4) * 1e8;
    const phi  = krad / (krad + knr);
    const tau  = 1e9 / (krad + knr); // em ns
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('qy-phi',   phi.toFixed(3));
    set('qy-tau',   tau.toFixed(2) + ' ns');
    set('qy-class', phi > 0.7 ? 'Alta (emissão eficiente)' : phi > 0.3 ? 'Média' : 'Baixa (perdas não-radiativas dominam)');
    // Barra visual de Φ
    const bar = document.getElementById('qy-bar');
    if (bar) bar.style.width = (phi * 100).toFixed(1) + '%';
    document.getElementById('qy-krad-val').textContent = (krad/1e8).toFixed(1) + '×10⁸ s⁻¹';
    document.getElementById('qy-knr-val').textContent  = (knr /1e8).toFixed(1) + '×10⁸ s⁻¹';
  }

  document.getElementById('ph-lambda')?.addEventListener('input', updatePhoton);
  document.getElementById('qy-krad')  ?.addEventListener('input', updateQY);
  document.getElementById('qy-knr')   ?.addEventListener('input', updateQY);
  updatePhoton();
  updateQY();
}

// -------------------------------------------------------------------------
// Exercícios
// -------------------------------------------------------------------------
function loadExercise(idx) {
  const ex = EXERCISES[idx];
  if (!ex) return;
  _exAttempts = 0;
  _exDone     = false;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const setHTML = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v; };

  set('ex-counter', idx + 1);
  set('ex-question', ex.q);
  setHTML('ph-ex-feedback', '');
  const nx = document.getElementById('ph-ex-next');
  if (nx) nx.style.display = 'none';

  const op = document.getElementById('ph-ex-options');
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

  document.getElementById('ph-ex-options')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-exopt]');
    if (!btn || _exDone) return;
    const chosen = parseInt(btn.dataset.exopt, 10);
    const ex     = EXERCISES[_exIdx];
    const fb     = document.getElementById('ph-ex-feedback');
    if (chosen === ex.ans) {
      _exDone = true;
      if (fb) fb.innerHTML = `<div style="color:var(--accent-organic);padding:.5rem;
        border-left:3px solid var(--accent-organic);background:var(--bg-raised);
        margin-top:.5rem;border-radius:4px">&#10003; Correto! ${esc(ex.exp)}</div>`;
      markSectionDone('photochemistry', 'exercise');
      const nx = document.getElementById('ph-ex-next');
      if (nx && _exIdx < EXERCISES.length - 1) nx.style.display = 'inline-block';
    } else {
      _exAttempts++;
      if (fb) fb.innerHTML = `<div style="color:var(--accent-reaction);padding:.5rem;
        border-left:3px solid var(--accent-reaction);background:var(--bg-raised);
        margin-top:.5rem;border-radius:4px">
        &#10007; Tente novamente.${_exAttempts >= 1 ? ' ' + esc(ex.hint) : ''}</div>`;
    }
  });

  document.getElementById('ph-ex-next')?.addEventListener('click', () => {
    _exIdx++;
    if (_exIdx < EXERCISES.length) loadExercise(_exIdx);
  });
}

// -------------------------------------------------------------------------
// render / destroy
// -------------------------------------------------------------------------
export function render(outlet) {
  if (_jabAnimId) { cancelAnimationFrame(_jabAnimId); _jabAnimId = null; }
  _jabMode = 'fl';
  _exIdx = 0; _exAttempts = 0; _exDone = false;

  outlet.innerHTML = `
<div class="module-page">
  <button class="module-back btn-ghost" data-nav="/modules">&#8592; Módulos</button>
  <header class="module-header">
    <h1 class="module-title">Fotoquímica</h1>
    <p class="module-concept">
      A fotoquímica estuda reações iniciadas pela absorção de luz. Um fóton excita uma
      molécula a um estado eletrônico de maior energia — o que acontece depois determina
      se haverá emissão de luz, transferência de energia ou uma reação química.
    </p>
  </header>

  <!-- Fenômeno -->
  <section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">
      Por que uma água-viva brilha no escuro? Por que o protetor solar absorve UV e não
      emite luz visível? Por que painéis solares de perovskita são 1000× mais baratos
      que os de silício? A resposta começa no mesmo lugar: um fóton encontra uma molécula.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Lei de Stark-Einstein</h3>
        <p style="font-family:monospace;font-size:var(--text-sm);margin-bottom:.4rem">E = hc/λ</p>
        <p style="font-size:var(--text-sm)">Um fóton absorvido excita exatamente uma molécula. A lei de conservação de energia vale por evento fotoquímico.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Rendimento quântico</h3>
        <p style="font-family:monospace;font-size:var(--text-sm);margin-bottom:.4rem">Φ = n_reação / n_fótons</p>
        <p style="font-size:var(--text-sm)">Φ = 1 significa que cada fóton absorvido leva à reação. Φ &lt; 1 indica competição com processos não-radiativos.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Regra de Kasha</h3>
        <p style="font-size:var(--text-sm)">A emissão ocorre sempre a partir do nível vibracional mais baixo do estado excitado mais baixo (S1 ou T1). Estados superiores relaxam primeiro via IC.</p>
      </div>
    </div>
  </section>

  <!-- Diagrama de Jablonski -->
  <section class="module-section">
    <h2 class="module-section-title">Diagrama de Jablonski</h2>
    <p class="module-text">
      O diagrama de Jablonski mapeia os estados eletrônicos (S₀, S₁, T₁) e os processos
      de transição entre eles. A animação mostra a sequência de eventos após absorção de
      um fóton — selecione o modo de emissão.
    </p>
    <div style="display:flex;gap:.5rem;margin-bottom:var(--space-3)">
      <button class="btn btn-xs btn-secondary" id="jab-fl">Fluorescência</button>
      <button class="btn btn-xs btn-ghost"     id="jab-ph">Fosforescência</button>
    </div>
    <div class="canvas-frame" id="jab-frame">
      <canvas id="jab-canvas" aria-label="Diagrama de Jablonski animado"></canvas>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-top:var(--space-4)">
      <div class="info-card">
        <h3 style="margin-top:0;font-size:var(--text-sm)">Processos radiativos</h3>
        <p style="font-size:var(--text-sm)">
          <strong style="color:var(--accent-electron)">Absorção</strong> S₀→S₁: 10⁻¹⁵ s<br>
          <strong style="color:var(--accent-organic)">Fluorescência</strong> S₁→S₀: 10⁻⁹–10⁻⁶ s<br>
          <strong style="color:var(--accent-reaction)">Fosforescência</strong> T₁→S₀: 10⁻³–10⁰ s
        </p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;font-size:var(--text-sm)">Processos não-radiativos</h3>
        <p style="font-size:var(--text-sm)">
          <strong>IC</strong> (conversão interna): S₁→S₀ sem fóton, 10⁻¹²–10⁻¹¹ s<br>
          <strong>ISC</strong> (cruzamento intersistemas): S₁→T₁, proibido por spin, 10⁻¹⁰–10⁻⁸ s<br>
          <strong>Desativação colisional</strong>: transferência de energia ao solvente
        </p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;font-size:var(--text-sm)">Deslocamento de Stokes</h3>
        <p style="font-size:var(--text-sm)">
          A emissão ocorre sempre em λ maior que a absorção (energia menor).
          O relaxamento vibracional no S₁ dissipa energia antes da emissão.
          Stokes shift = λ_emissão - λ_absorção.
        </p>
      </div>
    </div>
  </section>

  <!-- Calculadora de energia de fóton -->
  <section class="module-section">
    <h2 class="module-section-title">Calculadora de energia de fóton — E = hc/λ</h2>
    <p class="module-text">
      A energia de um fóton depende inversamente do comprimento de onda.
      UV tem energia suficiente para quebrar ligações (300–400 kJ/mol);
      IV apenas causa vibração molecular.
    </p>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">λ (nm):</span>
        <input type="range" id="ph-lambda" min="100" max="800" step="5" value="450"
               style="width:160px;accent-color:var(--accent-electron)">
        <span id="ph-lam-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">450 nm</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Energia (eV)</p>
        <div id="ph-E-eV" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Energia (kJ/mol)</p>
        <div id="ph-E-kJ" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Região espectral</p>
        <div id="ph-region" style="font-size:var(--text-base);font-weight:600;color:var(--accent-organic)">—</div>
      </div>
    </div>
  </section>

  <!-- Rendimento quântico -->
  <section class="module-section">
    <h2 class="module-section-title">Rendimento quântico de fluorescência — Φ</h2>
    <p class="module-text">
      Φ = k<sub>rad</sub> / (k<sub>rad</sub> + k<sub>nr</sub>).
      Uma molécula fluorescente ideal tem k<sub>nr</sub> ≈ 0 (Φ → 1).
      Vibrações, colisões e ISC competem com a emissão.
    </p>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:220px">k<sub>rad</sub> (×10⁸ s⁻¹):</span>
        <input type="range" id="qy-krad" min="0.1" max="10" step="0.1" value="2"
               style="width:120px;accent-color:var(--accent-organic)">
        <span id="qy-krad-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:90px">2,0×10⁸ s⁻¹</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:220px">k<sub>nr</sub> (×10⁸ s⁻¹):</span>
        <input type="range" id="qy-knr" min="0.1" max="20" step="0.1" value="8"
               style="width:120px;accent-color:var(--accent-reaction)">
        <span id="qy-knr-val" style="font-size:var(--text-sm);color:var(--accent-reaction);min-width:90px">8,0×10⁸ s⁻¹</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr));margin-bottom:var(--space-3)">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Φ</p>
        <div id="qy-phi" style="font-size:var(--text-2xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Tempo de vida τ</p>
        <div id="qy-tau" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card" style="grid-column:span 2">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.5rem">Eficiência</p>
        <div style="height:8px;border-radius:4px;background:var(--bg-raised);overflow:hidden;margin-bottom:.3rem">
          <div id="qy-bar" style="height:100%;border-radius:4px;
               background:var(--accent-organic);transition:width .2s;width:20%"></div>
        </div>
        <p id="qy-class" style="font-size:var(--text-xs);color:var(--text-secondary)">—</p>
      </div>
    </div>
  </section>

  <!-- Fotossensibilização e fotocatálise -->
  <section class="module-section">
    <h2 class="module-section-title">Fotossensibilização e fotocatálise</h2>
    <div class="module-grid" style="grid-template-columns:1fr 1fr">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Fotossensibilização</h3>
        <p style="font-size:var(--text-sm)">
          Um sensibilizador (ex: porfirina) absorve luz e popula T₁ via ISC.
          Em seguida transfere energia ao O₂ (triplete ³O₂) gerando oxigênio
          singlete ¹O₂ — espécie altamente reativa usada em terapia fotodinâmica (PDT).
        </p>
        <p style="font-family:monospace;font-size:var(--text-xs);color:var(--accent-bond);margin-top:.5rem">
          Sens* (T₁) + ³O₂ → Sens (S₀) + ¹O₂
        </p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Fotocatálise — TiO₂</h3>
        <p style="font-size:var(--text-sm)">
          TiO₂ (E<sub>g</sub> = 3,2 eV, λ &lt; 387 nm) absorve UV e gera pares e⁻/h⁺.
          O h⁺ (BV) oxida H₂O a •OH. O e⁻ (BC) reduz O₂ a •O₂⁻.
          Os radicais mineralizam poluentes orgânicos a CO₂ + H₂O.
        </p>
        <p style="font-family:monospace;font-size:var(--text-xs);color:var(--accent-electron);margin-top:.5rem">
          TiO₂ + hν → e⁻(BC) + h⁺(BV)<br>
          h⁺ + H₂O → •OH + H⁺<br>
          •OH + RH → CO₂ + H₂O
        </p>
      </div>
    </div>

    <!-- Tabela de fluoróforos comuns -->
    <h3 style="font-size:var(--text-sm);color:var(--text-secondary);
               margin-top:var(--space-5);margin-bottom:var(--space-3)">
      Fluoróforos de referência
    </h3>
    <div style="overflow-x:auto">
      <table style="border-collapse:collapse;width:100%;font-size:var(--text-xs)">
        <thead>
          <tr style="color:var(--text-muted);border-bottom:1px solid var(--border-default)">
            <th style="text-align:left;padding:.4rem .6rem">Fluoróforo</th>
            <th style="text-align:right;padding:.4rem .6rem">λ_abs (nm)</th>
            <th style="text-align:right;padding:.4rem .6rem">λ_em (nm)</th>
            <th style="text-align:right;padding:.4rem .6rem">Φ</th>
            <th style="text-align:left;padding:.4rem .6rem">Uso</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['Fluoresceína',      494, 521, '0,93', 'Bioimagem, rastreamento celular'],
            ['Rodamina B',        543, 565, '0,65', 'Microscopia de fluorescência'],
            ['DAPI',              360, 460, '0,04', 'Marcador de DNA (núcleo)'],
            ['GFP (proteína)',    489, 510, '0,60', 'Biossensor genético'],
            ['Quantum Dot CdSe', 'var.', 'sintonizavel', '0,80+', 'Biodiagnostico, LEDs'],
            ['Porfirina (TPP)',   417, 650, '0,11', 'PDT, sensibilizador'],
          ].map(([f, a, e, phi, uso]) => `
            <tr style="border-bottom:1px solid var(--border-subtle)">
              <td style="padding:.4rem .6rem;color:var(--text-primary)">${esc(String(f))}</td>
              <td style="padding:.4rem .6rem;text-align:right;color:var(--accent-electron)">${esc(String(a))}</td>
              <td style="padding:.4rem .6rem;text-align:right;color:var(--accent-organic)">${esc(String(e))}</td>
              <td style="padding:.4rem .6rem;text-align:right;color:var(--accent-bond)">${esc(String(phi))}</td>
              <td style="padding:.4rem .6rem;color:var(--text-secondary)">${esc(String(uso))}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- Exercícios -->
  <section class="module-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/${EXERCISES.length})</h2>
    <div class="exercise-card" style="background:var(--bg-raised);padding:var(--space-4);border-radius:8px">
      <p id="ex-question" class="exercise-question"
         style="font-size:var(--text-base);margin-bottom:var(--space-3)"></p>
      <div id="ph-ex-options"
           style="display:flex;flex-direction:column;gap:.4rem;max-width:500px"></div>
      <div id="ph-ex-feedback"></div>
      <button class="btn btn-ghost btn-sm" id="ph-ex-next"
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
        <h3 style="margin-top:0">Filtro solar</h3>
        <p style="font-size:var(--text-sm)">Moléculas como avobenzona absorvem UV (320–400 nm) e dissipam a energia como calor via IC, protegendo a pele.</p>
      </div>
      <div class="real-life-card info-card">
        <h3 style="margin-top:0">Terapia fotodinâmica</h3>
        <p style="font-size:var(--text-sm)">Fotossensibilizadores concentram-se em tumores e geram ¹O₂ com irradiação local — matando células cancerígenas sem cirurgia.</p>
      </div>
      <div class="real-life-card info-card">
        <h3 style="margin-top:0">OLEDs e displays</h3>
        <p style="font-size:var(--text-sm)">Materiais eletroluminescentes com alto Φ convertem eletricidade em luz. OLEDs de fósforo (T₁→S₀) atingem Φ &gt; 0,9.</p>
      </div>
      <div class="real-life-card info-card">
        <h3 style="margin-top:0">Fotocatálise ambiental</h3>
        <p style="font-size:var(--text-sm)">TiO₂ em revestimentos de concreto e vidro decompõe poluentes e bactérias sob luz solar — superfícies autopurificantes.</p>
      </div>
    </div>
  </section>
</div>`;

  // Botões Jablonski
  document.getElementById('jab-fl')?.addEventListener('click', () => {
    _jabMode = 'fl';
    document.getElementById('jab-fl').className = 'btn btn-xs btn-secondary';
    document.getElementById('jab-ph').className = 'btn btn-xs btn-ghost';
    _startJabAnimation();
  });
  document.getElementById('jab-ph')?.addEventListener('click', () => {
    _jabMode = 'ph';
    document.getElementById('jab-fl').className = 'btn btn-xs btn-ghost';
    document.getElementById('jab-ph').className = 'btn btn-xs btn-secondary';
    _startJabAnimation();
  });

  _startJabAnimation();
  _initCalculators();
  _initExercises();
  markSectionDone('photochemistry', 'visited');
}

export function destroy() {
  if (_jabAnimId) { cancelAnimationFrame(_jabAnimId); _jabAnimId = null; }
}
