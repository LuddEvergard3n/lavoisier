/**
 * modules/kinetics/index.js — Módulo: Cinética e Equilíbrio
 * Lavoisier — Laboratório Visual de Química
 *
 * Implementa:
 *  - Simulação canvas: partículas colidindo com barreira de energia de ativação
 *  - Controles de temperatura e concentração
 *  - Visualização de equilíbrio dinâmico (Le Chatelier)
 *  - Exercício guiado
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';
import { SimLoop }         from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

/* -----------------------------------------------------------------------
   Parâmetros de simulação
----------------------------------------------------------------------- */
const BASE_TEMP  = 300;  // K
const BASE_CONC  = 1.0;  // mol/L
const EA         = 60;   // kJ/mol (arbitrário para visual)
const R          = 8.314e-3; // kJ/(mol·K)

/** Frequência de colisão bem-sucedida: Arrhenius simplificado */
function reactionRate(temp, conc) {
  return conc * Math.exp(-EA / (R * temp));
}

/* -----------------------------------------------------------------------
   Estado do módulo — resetado em render()
----------------------------------------------------------------------- */
let _temp        = BASE_TEMP;
let _conc        = BASE_CONC;
let _particles   = [];
let _products    = 0;    // contador visual
let _loop        = null;
let _exIdx     = 0;
let _exAttempts  = 0;
let _exDone      = false;

/* -----------------------------------------------------------------------
   Partícula de cinética
----------------------------------------------------------------------- */
class KineticParticle {
  constructor(W, H) {
    this.x   = Math.random() * W * 0.45 + 10;
    this.y   = Math.random() * (H - 20) + 10;
    const spd = 30 + Math.random() * 60;
    const ang = Math.random() * Math.PI * 2;
    this.vx  = Math.cos(ang) * spd;
    this.vy  = Math.sin(ang) * spd;
    this.r   = 5;
    this.reacted = false;
    this.alpha   = 1;
    this.color   = COLOR.electron;
    this.productX = 0;
    this.productY = 0;
  }

  update(dt, W, H, temp) {
    if (this.reacted) {
      this.alpha -= dt * 1.5;
      return;
    }
    // velocidade proporcional à temperatura
    const tempFactor = temp / BASE_TEMP;
    this.x += this.vx * dt * tempFactor;
    this.y += this.vy * dt * tempFactor;

    // paredes
    if (this.x - this.r < 0)        { this.x  = this.r;      this.vx *= -1; }
    if (this.x + this.r > W * 0.45) { this.x  = W*0.45-this.r; this.vx *= -1; }
    if (this.y - this.r < 0)        { this.y  = this.r;      this.vy *= -1; }
    if (this.y + this.r > H - 10)   { this.y  = H-10-this.r; this.vy *= -1; }
  }
}

function initParticles(W, H, conc) {
  const count = Math.round(conc * 12);
  _particles = Array.from({ length: count }, () => new KineticParticle(W, H));
  _products  = 0;
}

/* -----------------------------------------------------------------------
   Canvas: simulação de colisões
----------------------------------------------------------------------- */
function startCanvas(canvasEl) {
  const frame = canvasEl.parentElement;
  const W     = Math.min(frame.clientWidth || 520, 520);
  const H     = 240;
  const dpr   = window.devicePixelRatio || 1;
  canvasEl.width  = Math.round(W * dpr);
  canvasEl.height = Math.round(H * dpr);
  canvasEl.style.width  = W + 'px';
  canvasEl.style.height = H + 'px';
  const ctx = canvasEl.getContext('2d');
  ctx.scale(dpr, dpr);

  initParticles(W, H, _conc);

  const barrierX = W * 0.48;
  let reactionTimer = 0;

  if (_loop) _loop.stop();

  _loop = new SimLoop((dt, t) => {
    clearCanvas(ctx, W, H);

    // atualizar partículas
    _particles.forEach(p => p.update(dt, W, H, _temp));
    _particles = _particles.filter(p => p.alpha > 0);

    // repor partículas (ciclo)
    while (_particles.length < Math.round(_conc * 12)) {
      _particles.push(new KineticParticle(W, H));
    }

    // tentativas de reação
    const rate = reactionRate(_temp, _conc);
    reactionTimer += dt;
    const interval = Math.max(0.3, 2.5 - rate * 15);
    if (reactionTimer >= interval && _particles.filter(p => !p.reacted).length > 0) {
      reactionTimer = 0;
      // escolhe partícula aleatória próxima à barreira
      const candidates = _particles.filter(p => !p.reacted && p.x > W * 0.3);
      if (candidates.length > 0) {
        const p = candidates[Math.floor(Math.random() * candidates.length)];
        p.reacted    = true;
        p.color      = COLOR.organic;
        _products++;
      }
    }

    // barreira de energia de ativação
    ctx.strokeStyle = COLOR.bond;
    ctx.lineWidth   = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(barrierX, 10);
    ctx.lineTo(barrierX, H - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle  = COLOR.bond;
    ctx.font       = '10px sans-serif';
    ctx.textAlign  = 'center';
    ctx.fillText('barreira (Ea)', barrierX, 8);

    // zona reagentes / produtos
    ctx.fillStyle = COLOR.textMuted;
    ctx.font      = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Reagentes', 8, 20);
    ctx.textAlign = 'left';
    ctx.fillText('Produtos', barrierX + 10, 20);

    // desenhar partículas reagentes
    _particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // produtos (lado direito, estáticos)
    const productCols = Math.min(_products, 30);
    for (let i = 0; i < productCols; i++) {
      const px = barrierX + 20 + (i % 5) * 16;
      const py = 30 + Math.floor(i / 5) * 16;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLOR.organic;
      ctx.fill();
    }

    // temperatura visual (termômetro)
    const thX   = W - 20;
    const thH   = H - 40;
    const thY   = 20;
    const fill  = (((_temp - 200) / 600) * thH);
    ctx.fillStyle   = COLOR.border;
    ctx.fillRect(thX - 5, thY, 10, thH);
    ctx.fillStyle   = COLOR.reaction;
    ctx.fillRect(thX - 5, thY + thH - fill, 10, fill);
    ctx.fillStyle   = COLOR.textMuted;
    ctx.font        = '9px sans-serif';
    ctx.textAlign   = 'center';
    ctx.fillText(`${_temp}K`, thX, thY + thH + 12);

    // taxa
    const rate2 = reactionRate(_temp, _conc);
    ctx.fillStyle = COLOR.textMuted;
    ctx.font      = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`v ∝ ${rate2.toFixed(4)}`, 8, H - 8);
  });

  _loop.start();
}

/* -----------------------------------------------------------------------
   Exercício
----------------------------------------------------------------------- */
const EXERCISES = [
  { q: 'Ao aumentar T, a velocidade aumenta principalmente porque:', opts: ['A pressão aumenta','Mais moléculas têm E ≥ Ea','O volume diminui','A entropia aumenta'], ans: 1, exp: 'Equação de Arrhenius: k = Ae^(-Ea/RT). Ao subir T, a fração com E ≥ Ea cresce exponencialmente.', hint: 'Distribuição de Maxwell-Boltzmann: o que muda na cauda de alta energia ao aumentar T?' },
  { q: 'Uma reação de 1ª ordem tem k = 0,0693 min⁻¹. Qual é o t₁/₂?', opts: ['10 min','14,4 min','1 min','100 min'], ans: 0, exp: 't₁/₂ = ln2/k = 0,693/0,0693 = 10 min.', hint: 't₁/₂ = ln(2)/k para ordem 1. ln(2) ≈ 0,693.' },
  { q: 'Se [A] é dobrada e a velocidade quadruplica, a ordem em A é:', opts: ['0','1','2','3'], ans: 2, exp: 'v ∝ [A]^n. 4 = 2^n → n = 2.', hint: 'Ao dobrar [A], v multiplica por 2^n. Resolva para n.' },
  { q: 'Um catalisador acelera a reação porque:', opts: ['Aumenta ΔG','Oferece caminho com Ea menor','Consome-se na etapa lenta','Aumenta a temperatura'], ans: 1, exp: 'O catalisador oferece mecanismo alternativo com Ea menor. ΔG e K_eq não mudam.', hint: 'O catalisador altera cinética, não o equilíbrio termodinâmico.' },
  { q: 'v = k[A][B]² — qual a ordem global?', opts: ['1','2','3','4'], ans: 2, exp: 'Ordem global = 1 + 2 = 3.', hint: 'Some os expoentes de todas as concentrações na lei de velocidade.' },,
  { q:'A constante de velocidade k dobra de 300 K para 310 K. A energia de ativação é aproximadamente:', opts:['10 kJ/mol','53 kJ/mol','120 kJ/mol','200 kJ/mol'], ans:1, exp:'Arrhenius: k2/k1 = exp(-Ea/R × (1/T2 - 1/T1)). ln(2) = -Ea/8,314 × (1/310 - 1/300) = Ea/8,314 × 1,075×10⁻⁴. Ea = 0,693/1,075×10⁻⁴ × 8,314 ≈ 53.600 J/mol ≈ 53 kJ/mol.', hint:'ln(k2/k1) = -Ea/R × (1/T2 - 1/T1). R = 8,314 J/(mol·K).' },
  { q:'Para a reação A → B com lei de velocidade v = k[A]², se [A] dobrar, a velocidade:', opts:['Dobra','Triplica','Quadruplica','Não muda'], ans:2, exp:'v = k[A]². Se [A] → 2[A]: v_nova = k(2[A])² = 4k[A]² = 4v. Ordem 2: quadruplica ao dobrar a concentração.', hint:'v = k[A]^n. Dobrar A: v_nova = k(2)^n × [A]^n = 2^n × v.' },
  { q:'A meia-vida de uma reação de primeira ordem é independente da concentração inicial. Isso ocorre porque:', opts:['A lei de velocidade é linear','t½ = ln2/k — depende apenas de k, não de [A]₀','A reação é isotérmica','k é constante com a temperatura'], ans:1, exp:'Para 1ª ordem: [A] = [A]₀ × e^(-kt). Quando [A] = [A]₀/2: e^(-kt½) = 0,5 → kt½ = ln2 → t½ = 0,693/k. Não depende de [A]₀ — característica única da 1ª ordem.', hint:'t½(1ª ordem) = ln2/k. Compare com 2ª ordem: t½ = 1/(k[A]₀) — depende de [A]₀.' },
  { q:'A distribuição de Maxwell-Boltzmann explica por que elevar a temperatura acelera muito as reações porque:', opts:['Aumenta [A] das moléculas','A fração de moléculas com energia > Ea cresce exponencialmente com T','A energia de ativação diminui com T','Moléculas ficam maiores e colidem mais'], ans:1, exp:'A cauda da distribuição M-B (moléculas com E > Ea) cresce exponencialmente com T. Um aumento de 10°C pode dobrar ou triplicar a velocidade porque a fração de moléculas "ativadas" cresce desproporcionalmente.', hint:'Pense no gráfico: a área além de Ea cresce muito mais que linearmente com T.' },
  { q:'Kc = [NH₃]²/[N₂][H₂]³ para N₂ + 3H₂ ⇌ 2NH₃. Se a 400°C, Kc = 0,5 mol⁻² L², isso indica:', opts:['Equilíbrio favorece os produtos (NH₃)','Equilíbrio favorece os reagentes (N₂ e H₂) — Kc << 1','Reação vai só para a esquerda','Concentrações iguais de reagentes e produtos'], ans:1, exp:'Kc << 1 indica que no equilíbrio há muito mais reagentes que produtos. Para N₂ + 3H₂ ⇌ 2NH₃, Kc = 0,5 é relativamente pequeno — o rendimento é baixo a 400°C (por isso usa-se alta pressão e catalisador de Fe na síntese Haber-Bosch).', hint:'Kc >> 1: produtos dominam. Kc << 1: reagentes dominam. Kc ≈ 1: equilíbrio.' },
  { q:'O princípio de Le Chatelier prevê: ao aumentar a pressão no equilíbrio N₂ + 3H₂ ⇌ 2NH₃, o equilíbrio:', opts:['Desloca para esquerda (mais mol de gás)','Desloca para direita (menor número de mol de gás: 4→2)','Não se desloca — pressão não afeta equilíbrio gasoso','Desloca para esquerda porque NH₃ é mais denso'], ans:1, exp:'Aumentar pressão favorece o lado com MENOS mol de gás. Reagentes: 1+3=4 mol; produto: 2 mol. Pressão alta → desloca para NH₃ (2 mol). Esse é o motivo do uso de alta pressão na síntese de amônia (150-300 atm).', hint:'Pressão → menos mol de gás. Conte os coeficientes de gases nos dois lados.' },
  { q:'Um inibidor enzimático competitivo:', opts:['Destrói permanentemente a enzima','Liga-se ao sítio ativo, competindo com o substrato (reversível, aumentando Km)','Liga-se fora do sítio ativo alterando a conformação','Diminui Vmax sem alterar Km'], ans:1, exp:'Inibidor competitivo liga-se ao sítio ativo (mesma posição do substrato). Aumenta o Km aparente (menor afinidade aparente pelo substrato) mas não altera Vmax — com substrato em excesso, a inibição é superada. Ex: metotrexato inibe dihidrofolato redutase competitivamente.', hint:'Competitivo: sítio ativo. Não-competitivo: sítio alostérico. Competitivo altera Km; não-competitivo altera Vmax.' },
  { q:'A lei de velocidade não pode ser determinada apenas a partir da equação química balanceada porque:', opts:['A equação mostra a estequiometria dos produtos','As ordens dependem do mecanismo (etapa determinante), não dos coeficientes globais','A lei de velocidade é sempre de 1ª ordem','Os coeficientes globais são usados diretamente nas ordens'], ans:1, exp:'Uma reação A + B → C pode ter v = k[A][B], v = k[A]², ou v = k[A]⁰[B] — depende do mecanismo. As ordens experimentais refletem a etapa mais lenta (determinante). Coeficientes estequiométricos globais só são iguais às ordens em reações elementares (mecanismo de uma etapa).', hint:'Reação global ≠ mecanismo. Só para reação elementar a ordem = coeficiente.' },
  { q:'O Kc de N₂O₄ ⇌ 2NO₂ é 0,14 a 25°C. Se Kc para 2NO₂ ⇌ N₂O₄ é:', opts:['0,14','7,14','0,07','0,28'], ans:1, exp:'Inverter a reação inverte o Kc. Kc(inversa) = 1/Kc(direta) = 1/0,14 ≈ 7,14.', hint:'Inverte a reação → Kc_novo = 1/Kc_original.' },
  { q:'A catálise heterogênea (ex: Pt em superfície) age principalmente por:', opts:['Aumentar a temperatura de ativação','Adsorção dos reagentes na superfície, enfraquecendo ligações e reduzindo Ea','Aumentar a concentração dos reagentes','Fornecer energia extra via campo elétrico'], ans:1, exp:'Catálise heterogênea: reagentes adsorvem na superfície do catalisador. Ligações se enfraquecem (energia de ativação diminui) e a proximidade aumenta a frequência de colisões efetivas. Pd/Pt em conversores catalíticos, Fe em síntese de NH₃, Ni em hidrogenação.', hint:'Superfície do catalisador adsorve reagentes → ligações enfraquecem → Ea menor.' }
];

/* -----------------------------------------------------------------------
   render()
----------------------------------------------------------------------- */
export function render(outlet) {
  _temp       = BASE_TEMP;
  _conc       = BASE_CONC;
  _particles  = [];
  _products   = 0;
  if (_loop) { _loop.stop(); _loop = null; }
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
        <path d="M2 12h4l3-8 4 16 3-8h6"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Cinética e Equilíbrio</h1>
      <p class="module-subtitle">Velocidade de reação, colisões e equilíbrio dinâmico.</p>
    </div>
  </header>

  <!-- Fenômeno -->
    <!-- Leis de velocidade integradas -->
  <section class="module-section">
    <h2 class="module-section-title">Leis de velocidade integradas e meia-vida</h2>
    <p class="module-text">A integração da lei diferencial de velocidade fornece [A] em função do tempo — essencial para prever quando uma reação termina, dimensionar reatores e determinar a vida útil de fármacos.</p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr));margin-bottom:1rem">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Ordem 0</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">[A] = [A]₀ - kt</p>
        <p style="font-family:monospace;font-size:var(--text-sm)">t½ = [A]₀ / 2k</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:.4rem">Velocidade constante; independe de [A]. Gráfico [A]×t: linha reta. Ex: dissolução de comprimido de liberação controlada.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Ordem 1</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">ln[A] = ln[A]₀ - kt</p>
        <p style="font-family:monospace;font-size:var(--text-sm)">t½ = ln2 / k = 0,693/k</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:.4rem">Meia-vida constante (independe de [A]₀). Gráfico ln[A]×t: reta. Decaimento radioativo, reações enzimáticas saturadas, farmacocinética.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Ordem 2</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">1/[A] = 1/[A]₀ + kt</p>
        <p style="font-family:monospace;font-size:var(--text-sm)">t½ = 1 / (k[A]₀)</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:.4rem">Meia-vida aumenta com o tempo. Gráfico 1/[A]×t: reta. Ex: decomposição de NO₂, reação de Diels-Alder.</p>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:.6rem;margin:.75rem 0 1rem">
      <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
        <label style="min-width:140px;font-size:var(--text-sm);color:var(--text-secondary)">Ordem:</label>
        <button class="btn btn-xs btn-secondary" id="irl-ord-0" data-irl="0">Ordem 0</button>
        <button class="btn btn-xs btn-ghost"     id="irl-ord-1" data-irl="1">Ordem 1</button>
        <button class="btn btn-xs btn-ghost"     id="irl-ord-2" data-irl="2">Ordem 2</button>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:140px;font-size:var(--text-sm);color:var(--text-secondary)">[A]₀ (mol/L):</label>
        <input type="range" id="irl-a0" min="0.1" max="5" step="0.1" value="1" style="width:140px;accent-color:var(--accent-electron)">
        <span id="irl-a0-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">1,0 M</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:140px;font-size:var(--text-sm);color:var(--text-secondary)">k (unid. adequada):</label>
        <input type="range" id="irl-k" min="0.01" max="2" step="0.01" value="0.1" style="width:140px;accent-color:var(--accent-bond)">
        <span id="irl-k-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:60px">0,10</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:140px;font-size:var(--text-sm);color:var(--text-secondary)">t (s):</label>
        <input type="range" id="irl-t" min="0" max="50" step="0.5" value="5" style="width:140px;accent-color:var(--accent-organic)">
        <span id="irl-t-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:40px">5,0 s</span>
      </div>
    </div>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">[A] em t</p><div id="irl-at" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">t½</p><div id="irl-t12" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">% reagido</p><div id="irl-pct" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div></div>
    </div>
  </section>

<section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">
      Carne estraga mais rápido em temperatura ambiente do que na geladeira. Explosivos reagem em
      microssegundos; a ferrugem leva anos. A velocidade de uma reação depende de temperatura,
      concentração, superfície de contato e presença de catalisadores.
    </p>
    <p class="module-text">
      Para que uma reação ocorra, as moléculas precisam colidir com orientação correta
      <em>e</em> com energia suficiente para superar a barreira de energia de ativação (Ea).
    </p>
  </section>

  <!-- Simulação -->
  <section class="module-section">
    <h2 class="module-section-title">Simulação de colisões</h2>
    <p class="module-text">Partículas azuis (reagentes) colidem com a barreira. As que têm energia suficiente viram produtos (verde). Ajuste temperatura e concentração.</p>

    <div style="display:flex;gap:1.5rem;flex-wrap:wrap;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:.75rem">
        <label style="font-size:var(--text-sm);color:var(--text-secondary)">Temperatura:</label>
        <input type="range" id="temp-slider" min="200" max="800" step="20" value="300"
               style="width:130px;accent-color:var(--accent-reaction)">
        <span id="temp-value" style="font-size:var(--text-sm);color:var(--accent-reaction);min-width:50px">300 K</span>
      </div>
      <div style="display:flex;align-items:center;gap:.75rem">
        <label style="font-size:var(--text-sm);color:var(--text-secondary)">Concentração:</label>
        <input type="range" id="conc-slider" min="0.5" max="3" step="0.5" value="1"
               style="width:130px;accent-color:var(--accent-electron)">
        <span id="conc-value" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:50px">1,0 mol/L</span>
      </div>
    </div>

    <div class="canvas-frame">
      <canvas id="kinetics-canvas"></canvas>
    </div>
  </section>

  <!-- Equilíbrio -->
  <section class="module-section">
    <h2 class="module-section-title">Princípio de Le Chatelier</h2>
    <p class="module-text">
      Em sistemas reversíveis, ao atingir o equilíbrio, a velocidade direta = velocidade inversa.
      Ao perturbar o equilíbrio (pressão, concentração, temperatura), o sistema se desloca para
      minimizar a perturbação.
    </p>
    <div class="module-grid" style="grid-template-columns:1fr 1fr">
      <div class="info-card">
        <h3>Aumentar [reagente]</h3>
        <p>Equilíbrio desloca para a direita (mais produtos formados).</p>
      </div>
      <div class="info-card">
        <h3>Aumentar temperatura</h3>
        <p>Favorece a reação endotérmica (absorve o calor adicionado).</p>
      </div>
    </div>
  </section>


  <!-- Simulação de equilíbrio reversível -->
  <section class="module-section">
    <h2 class="module-section-title">Simulação de equilíbrio reversível — A ⇌ B</h2>
    <p class="module-text">
      Na reação reversível A ⇌ B, o equilíbrio é atingido quando
      <strong>v_direta = v_inversa</strong>. O gráfico abaixo mostra as concentrações
      de A e B ao longo do tempo até o equilíbrio, com Kc = k_d / k_i.
    </p>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-3)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">k_direto (s⁻¹):</span>
        <input type="range" id="eq-kd" min="0.01" max="2" step="0.01" value="0.5"
               style="width:120px;accent-color:var(--accent-electron)">
        <span id="eq-kd-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">0,50</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">k_inverso (s⁻¹):</span>
        <input type="range" id="eq-ki" min="0.01" max="2" step="0.01" value="0.25"
               style="width:120px;accent-color:var(--accent-reaction)">
        <span id="eq-ki-val" style="font-size:var(--text-sm);color:var(--accent-reaction);min-width:60px">0,25</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">[A]₀ inicial (mol/L):</span>
        <input type="range" id="eq-a0" min="0.1" max="2" step="0.1" value="1.0"
               style="width:120px;accent-color:var(--accent-bond)">
        <span id="eq-a0-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:60px">1,00</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr));margin-bottom:var(--space-3)">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Kc = k_d/k_i</p>
        <div id="eq-Kc" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">[A]_eq (mol/L)</p>
        <div id="eq-Aeq" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">[B]_eq (mol/L)</p>
        <div id="eq-Beq" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-reaction)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">t½ aprox. (s)</p>
        <div id="eq-thalf" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
    </div>
    <div class="canvas-frame" id="eqsim-frame" style="min-height:160px">
      <canvas id="eqsim-canvas" aria-label="Gráfico de equilíbrio reversível [A] e [B] no tempo"></canvas>
    </div>
  </section>

  <!-- Maxwell-Boltzmann -->
  <section class="module-section">
    <h2 class="module-section-title">Distribuição de Maxwell-Boltzmann</h2>
    <p class="module-text">
      Nem todas as moléculas têm a mesma energia cinética. A distribuição de Maxwell-Boltzmann
      descreve como as energias estão distribuídas a uma dada temperatura. Apenas as moléculas
      com energia acima de Ea reagem. Ao aumentar T, a distribuição se alarga e a área
      à direita de Ea cresce exponencialmente.
    </p>
    <div class="canvas-frame"><canvas id="mb-canvas"></canvas></div>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-top:1rem">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">Temperatura comparativa:</label>
      <input type="range" id="mb-temp" min="200" max="1200" step="50" value="600" style="width:160px;accent-color:var(--accent-bond)">
      <span id="mb-temp-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:50px">600 K</span>
    </div>
    <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:.5rem">
      Azul = T baixa | Laranja = T alta | Linha vermelha = barreira Ea
    </p>
  </section>

  <!-- Leis de velocidade -->
  <section class="module-section">
    <h2 class="module-section-title">Leis de velocidade</h2>
    <p class="module-text">
      A velocidade de reação depende da concentração dos reagentes conforme a lei:
      <strong>v = k · [A]ⁿ · [B]ᵐ</strong>, onde k é a constante de velocidade e
      n, m são as ordens parciais (determinadas experimentalmente, não pelos coeficientes).
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0">Ordem zero</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">v = k<br>v independe de [A]<br>Ex: decomposição catalítica</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0">Ordem 1</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">v = k[A]<br>dobrar [A] dobra v<br>Ex: decaimento radioativo</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0">Ordem 2</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">v = k[A]²<br>dobrar [A] quadruplica v<br>Ex: 2NO₂ → 2NO + O₂</p>
      </div>
    </div>
    <p class="module-text" style="margin-top:.75rem">
      A equação de Arrhenius relaciona k com T:
      <strong>k = A · e^(-Ea/RT)</strong>. Um catalisador aumenta A (fator pré-exponencial) ou
      diminui Ea, acelerando k sem alterar ΔH da reação.
    </p>
  </section>

  <!-- Exercício -->
  <section class="module-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/5)</h2>
    <p class="module-text">${esc(EXERCISES[0].q)}</p>
    <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">
      ${EXERCISES[0].opts.map((opt, i) => `
        <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
                id="ex-opt-${i}" data-exopt="${i}">${esc(opt)}</button>
      `).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next" style="margin-top:1rem;display:none">Próximo exercício &#8594;</button>
  </section>

  <!-- Cotidiano -->
  <!-- Mecanismos de reação -->
  <section class="module-section">
    <h2 class="module-section-title">Mecanismos de reação multi-etapa</h2>
    <p class="module-text">
      A equação global de uma reação é a soma de etapas elementares.
      A <strong>etapa determinante</strong> (mais lenta) controla a lei de velocidade
      observável — o mecanismo completo não está visível na equação global.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Etapa elementar vs global</h3>
        <p style="font-size:var(--text-sm)">Etapa elementar: molecularidade = ordem. Bimolecular → v = k[A][B]. Termolecular: raro. A ordem global NÃO necessariamente reflete a estequiometria (ex: H₂ + Br₂ → 2 HBr tem v = k[H₂][Br₂]^½).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Aproximação do estado estacionário</h3>
        <p style="font-size:var(--text-sm)">Para intermediário I: d[I]/dt ≈ 0. Taxa de formação = taxa de consumo. Reduz sistemas de EDOs a expressão algébrica para v em função de [reagentes] e constantes de velocidade das etapas.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Mecanismo SN1 (exemplo)</h3>
        <p style="font-size:var(--text-sm)">Etapa 1 (lenta): R–X → R⁺ + X⁻ (ionização)<br>Etapa 2 (rápida): R⁺ + Nu⁻ → R–Nu<br>Lei de velocidade: v = k[R–X] (1ª ordem). Etapa 1 é determinante: R⁺ é o intermediário.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Mecanismo de Lindemann</h3>
        <p style="font-size:var(--text-sm)">Reações unimoleculares (isomerização, decomposição) requerem ativação por colisão antes da reação. A⁺ M → A* + M (ativação); A* → P (reação). A baixa P, v ∝ P² (2ª ordem); a alta P, v ∝ P (1ª ordem).</p>
      </div>
    </div>

    <!-- Catálise enzimática — Michaelis-Menten -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:var(--space-6);margin-bottom:var(--space-3)">
      Catálise enzimática — Michaelis-Menten
    </h3>
    <p class="module-text">
      E + S ⇌ ES → E + P &nbsp;&nbsp;|&nbsp;&nbsp; v = V_max [S] / (K_m + [S])
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.4rem">
        v = V_max · [S] / (K_m + [S])
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        K_m = constante de Michaelis ≈ [S] que fornece v = V_max/2. Menor K_m → maior afinidade pelo substrato.<br>
        V_max = k_cat · [E]_total &nbsp;|&nbsp; k_cat = número de rotação (mol_produto / mol_enzima / s).<br>
        Plot de Lineweaver-Burk: 1/v vs 1/[S] → reta com inclinação K_m/V_max.
      </p>
    </div>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">V_max (μmol/L·s):</span>
        <input type="range" id="mm-vmax" min="1" max="100" step="1" value="50"
               style="width:120px;accent-color:var(--accent-organic)">
        <span id="mm-vmax-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:60px">50</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">K_m (mmol/L):</span>
        <input type="range" id="mm-km" min="0.1" max="20" step="0.1" value="2.0"
               style="width:120px;accent-color:var(--accent-bond)">
        <span id="mm-km-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:60px">2.0</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">[S] (mmol/L):</span>
        <input type="range" id="mm-s" min="0.1" max="50" step="0.1" value="5.0"
               style="width:120px;accent-color:var(--accent-electron)">
        <span id="mm-s-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">5.0</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">v atual</p>
        <div id="mm-v" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">v / V_max</p>
        <div id="mm-sat" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Saturação</p>
        <div id="mm-regime" style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary)">—</div>
      </div>
    </div>
  </section>

  <!-- Equilíbrio Kp/Kc formal -->
  <section class="module-section">
    <h2 class="module-section-title">Equilíbrio químico — Kp, Kc e grau de dissociação</h2>
    <p class="module-text">
      O equilíbrio químico é dinâmico: as taxas de reação direta e inversa se igualam.
      A constante de equilíbrio pode ser expressa em concentrações (Kc) ou pressões parciais (Kp).
      A relação entre elas depende da variação do número de moles de gás (Δn_g):
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-base);color:var(--accent-electron);margin-bottom:.4rem">
        Kp = Kc · (RT)^Δn_g
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Δn_g = (moles gasosos de produtos) - (moles gasosos de reagentes)<br>
        R = 0,08206 L·atm/(mol·K) &nbsp;|&nbsp; T em Kelvin<br>
        Se Δn_g = 0 → Kp = Kc (ex: H₂ + I₂ ⇌ 2 HI)<br>
        Kc e Kp são adimensionais quando expressos em razão às concentrações/pressões padrão.
      </p>
    </div>

    <!-- Calculadora Kp ↔ Kc -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Conversão Kp ↔ Kc
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">Kc:</span>
        <input type="range" id="kpkc-kc" min="-8" max="8" step="0.1" value="0"
               style="width:130px;accent-color:var(--accent-electron)">
        <span id="kpkc-kc-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:80px">1,00</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">Δn_g:</span>
        <input type="range" id="kpkc-dn" min="-3" max="3" step="1" value="1"
               style="width:130px;accent-color:var(--accent-bond)">
        <span id="kpkc-dn-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:40px">+1</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">T (K):</span>
        <input type="range" id="kpkc-T" min="200" max="1500" step="10" value="700"
               style="width:130px;accent-color:var(--accent-organic)">
        <span id="kpkc-T-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:60px">700 K</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Kc</p>
        <div id="kpkc-kc-disp" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Kp</p>
        <div id="kpkc-kp-disp" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">(RT)^Δn</p>
        <div id="kpkc-rt-disp" style="font-size:var(--text-base);font-weight:600;color:var(--text-secondary)">—</div>
      </div>
    </div>

    <!-- Grau de dissociação -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:var(--space-6);margin-bottom:var(--space-3)">
      Grau de dissociação α — A(g) ⇌ 2 B(g)
    </h3>
    <p class="module-text">
      Para a reação A ⇌ 2B a pressão constante P_total com n₀ moles iniciais de A:
      α = fração de A dissociada. Tabela de ICE → expressão de Kp em termos de α e P.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        Kp = [4α² / (1 - α²)] · P_total
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Dado Kp e P_total → resolver para α: α = √(Kp / (Kp + 4P_total))<br>
        Maior P_total → menor α (Le Chatelier: reduz lado com mais moles).<br>
        Exemplos: N₂O₄ ⇌ 2 NO₂ (Kp ≈ 0,14 atm a 25°C); PCl₅ ⇌ PCl₃ + Cl₂
      </p>
    </div>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">Kp (atm):</span>
        <input type="range" id="diss-kp" min="-4" max="2" step="0.05" value="-0.85"
               style="width:130px;accent-color:var(--accent-electron)">
        <span id="diss-kp-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:80px">0,14 atm</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">P_total (atm):</span>
        <input type="range" id="diss-P" min="0.01" max="10" step="0.01" value="1.0"
               style="width:130px;accent-color:var(--accent-bond)">
        <span id="diss-P-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:60px">1,00 atm</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">α (grau de dissociação)</p>
        <div id="diss-alpha" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">% dissociado</p>
        <div id="diss-pct" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-reaction)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Efeito de P_total</p>
        <div id="diss-effect" style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary)">—</div>
      </div>
    </div>
  </section>


    <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">
      O processo Haber-Bosch (síntese industrial da amônia) opera a 400–500°C e 150–300 atm com
      catalisador de ferro. Temperature alta acelera a cinética; pressão alta favorece o lado
      com menos moles de gás (Le Chatelier). Esse equilíbrio entre velocidade e rendimento
      alimenta cerca de metade da população mundial via fertilizantes.
    </p>
  </div>

</div>
`;

  const canvas = document.getElementById('kinetics-canvas');
  if (canvas) startCanvas(canvas);

  document.getElementById('temp-slider')?.addEventListener('input', e => {
    _temp = parseInt(e.target.value, 10);
    const el = document.getElementById('temp-value');
    if (el) el.textContent = `${_temp} K`;
  });

  document.getElementById('conc-slider')?.addEventListener('input', e => {
    _conc = parseFloat(e.target.value);
    const el = document.getElementById('conc-value');
    if (el) el.textContent = `${_conc.toFixed(1).replace('.', ',')} mol/L`;
    const canvas2 = document.getElementById('kinetics-canvas');
    if (canvas2) {
      const W = parseInt(canvas2.style.width, 10);
      const H = parseInt(canvas2.style.height, 10);
      initParticles(W, H, _conc);
    }
  });

  _initCanvasAndIRL();
  _initMM();
  _initKpKc();
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
        markSectionDone('kinetics', 'exercise');
      } else {
        btn.style.borderColor = 'var(--accent-reaction)';
        btn.style.color       = 'var(--accent-reaction)';
        if (fb && _exAttempts === 1) {
          fb.innerHTML = `<p class="feedback-hint">Dica: a Ea é uma propriedade da reação — não muda com T. O que muda é a distribuição de energias das moléculas (Maxwell-Boltzmann).</p>`;
        }
      }
    });
  });
}


function _initCanvasAndIRL() {
  // Canvas Maxwell-Boltzmann
    function startMBCanvas(el) {
      const frame = el.parentElement;
      const W = Math.min(frame.clientWidth || 520, 520), H = 180;
      const dpr = window.devicePixelRatio || 1;
      el.width  = Math.round(W * dpr); el.height = Math.round(H * dpr);
      el.style.width = W + 'px'; el.style.height = H + 'px';
      const ctx = el.getContext('2d');
      ctx.scale(dpr, dpr);

      let mbTemp = 600;
      const simLoop = new SimLoop(() => {
        const T1 = 300, T2 = mbTemp;
        const kB = 1.0;
        const Ea = 60; // kJ arbitrary

        ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

        const padX = 32, padY = 16, gW = W - padX * 2, gH = H - padY * 2 - 20;

        // MB distribution function (simplified: Maxwell speed distribution shape)
        function mbVal(E, T) {
          return Math.sqrt(E) * Math.exp(-E / (kB * T / 40));
        }

        // find max for normalization
        let maxV = 0;
        for (let e = 0; e <= 100; e += 0.5) maxV = Math.max(maxV, mbVal(e, T1), mbVal(e, T2));

        // draw T1 (cold)
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const x = padX + (i / 100) * gW;
          const y = padY + gH - (mbVal(i, T1) / maxV) * gH;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = COLOR.electron; ctx.lineWidth = 1.8; ctx.stroke();

        // draw T2 (hot)
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const x = padX + (i / 100) * gW;
          const y = padY + gH - (mbVal(i, T2) / maxV) * gH;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = COLOR.energy; ctx.lineWidth = 1.8; ctx.stroke();

        // Ea vertical line
        const eaX = padX + (Ea / 100) * gW;
        ctx.strokeStyle = COLOR.reaction; ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(eaX, padY); ctx.lineTo(eaX, padY + gH); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = COLOR.reaction; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Ea', eaX, padY - 3);

        // axis labels
        ctx.fillStyle = COLOR.textMuted; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Energia cinética →', padX + gW / 2, H - 4);
        ctx.fillStyle = COLOR.electron; ctx.fillText('T baixa', padX + 20, padY + 12);
        ctx.fillStyle = COLOR.energy;  ctx.fillText('T alta',  padX + gW - 30, padY + 18);

        // shaded area > Ea for T2
        ctx.beginPath();
        let started = false;
        for (let i = Ea; i <= 100; i++) {
          const x = padX + (i / 100) * gW;
          const y = padY + gH - (mbVal(i, T2) / maxV) * gH;
          if (!started) { ctx.moveTo(x, padY + gH); ctx.lineTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(padX + gW, padY + gH); ctx.closePath();
        ctx.fillStyle = COLOR.energy + '33'; ctx.fill();
      });
      simLoop.start();

      document.getElementById('mb-temp')?.addEventListener('input', e => {
        mbTemp = parseInt(e.target.value, 10);
        const v = document.getElementById('mb-temp-val');
        if (v) v.textContent = mbTemp + ' K';
      });

      return simLoop;
    }

    const mbCanvas = document.getElementById('mb-canvas');
    let _mbLoop = null;
    if (mbCanvas) _mbLoop = startMBCanvas(mbCanvas);

    // patch destroy to stop mb loop too
    const _origDestroy = destroy;

  // Integrated rate law calculator
    let _irlOrder = 0, _irlA0 = 1.0, _irlK = 0.1, _irlT = 5.0;
    function updateIRL() {
      const A0 = _irlA0, k = _irlK, t = _irlT;
      let At, t12;
      if (_irlOrder === 0) {
        At = Math.max(0, A0 - k*t);
        t12 = A0 / (2*k);
      } else if (_irlOrder === 1) {
        At = A0 * Math.exp(-k*t);
        t12 = Math.LN2 / k;
      } else {
        At = 1 / (1/A0 + k*t);
        t12 = 1 / (k*A0);
      }
      const pct = (1 - At/A0)*100;
      const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
      set('irl-at',  At.toFixed(4)+' M');
      set('irl-t12', t12.toFixed(3)+' s');
      set('irl-pct', pct.toFixed(2)+'%');
    }
    updateIRL();
    [0,1,2].forEach(ord => {
      document.getElementById('irl-ord-'+ord)?.addEventListener('click', () => {
        _irlOrder = ord;
        [0,1,2].forEach(o => { const b=document.getElementById('irl-ord-'+o); if(b) b.className='btn btn-xs '+(o===ord?'btn-secondary':'btn-ghost'); });
        updateIRL();
      });
    });
    document.getElementById('irl-a0')?.addEventListener('input', e => { _irlA0=parseFloat(e.target.value); const v=document.getElementById('irl-a0-val'); if(v) v.textContent=_irlA0.toFixed(1).replace('.',',')+' M'; updateIRL(); });
    document.getElementById('irl-k')?.addEventListener('input', e => { _irlK=parseFloat(e.target.value); const v=document.getElementById('irl-k-val'); if(v) v.textContent=_irlK.toFixed(2); updateIRL(); });
    document.getElementById('irl-t')?.addEventListener('input', e => { _irlT=parseFloat(e.target.value); const v=document.getElementById('irl-t-val'); if(v) v.textContent=_irlT.toFixed(1).replace('.',',')+' s'; updateIRL(); });
}

function _initMM() {
  function updateMM() {
    const Vmax = parseFloat(document.getElementById('mm-vmax')?.value ?? 50);
    const Km   = parseFloat(document.getElementById('mm-km')?.value  ?? 2.0);
    const S    = parseFloat(document.getElementById('mm-s')?.value   ?? 5.0);
    const set  = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('mm-vmax-val', Vmax.toFixed(0));
    set('mm-km-val',   Km.toFixed(1));
    set('mm-s-val',    S.toFixed(1));
    const v   = Vmax * S / (Km + S);
    const sat = v / Vmax;
    set('mm-v',      v.toFixed(2) + ' μmol/L·s');
    set('mm-sat',    (sat * 100).toFixed(1) + ' %');
    set('mm-regime', S < Km * 0.1 ? '1ª ordem em [S]' : S > Km * 10 ? 'Ordem zero (saturado)' : 'Mista');
  }
  if (document.getElementById('mm-vmax')) {
    updateMM();
    ['mm-vmax','mm-km','mm-s'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updateMM));
  }
}

function _initKpKc() {
  const R = 0.08206;

  function updateKpKc() {
    const logKc = parseFloat(document.getElementById('kpkc-kc')?.value ?? 0);
    const dn    = parseInt(document.getElementById('kpkc-dn')?.value ?? 1, 10);
    const T     = parseInt(document.getElementById('kpkc-T')?.value ?? 700, 10);
    const Kc    = Math.pow(10, logKc);
    const RT_dn = Math.pow(R * T, dn);
    const Kp    = Kc * RT_dn;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('kpkc-kc-val',   Kc < 0.001 ? Kc.toExponential(3) : Kc.toPrecision(3));
    set('kpkc-dn-val',   (dn >= 0 ? '+' : '') + dn);
    set('kpkc-T-val',    T + ' K');
    set('kpkc-kc-disp',  Kc < 0.001 ? Kc.toExponential(3) : Kc.toPrecision(4));
    set('kpkc-kp-disp',  Kp < 0.001 ? Kp.toExponential(3) : Kp.toPrecision(4));
    set('kpkc-rt-disp',  RT_dn.toFixed(3));
  }

  function updateDiss() {
    const logKp = parseFloat(document.getElementById('diss-kp')?.value ?? -0.85);
    const Ptot  = parseFloat(document.getElementById('diss-P')?.value ?? 1.0);
    const Kp    = Math.pow(10, logKp);
    // Kp = 4α²P/(1-α²) → α² = Kp/(Kp+4P) 
    const alpha2 = Kp / (Kp + 4 * Ptot);
    const alpha  = Math.sqrt(Math.max(0, alpha2));

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('diss-kp-val',  Kp.toPrecision(3) + ' atm');
    set('diss-P-val',   Ptot.toFixed(2) + ' atm');
    set('diss-alpha',   alpha.toFixed(4));
    set('diss-pct',     (alpha * 100).toFixed(2) + ' %');
    set('diss-effect',  Ptot > 1 ? 'Alta P → α menor' : Ptot < 1 ? 'Baixa P → α maior' : 'P = 1 atm (ref)');
  }

  if (document.getElementById('kpkc-kc')) {
    updateKpKc();
    ['kpkc-kc', 'kpkc-dn', 'kpkc-T'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updateKpKc));
  }
  if (document.getElementById('diss-kp')) {
    updateDiss();
    ['diss-kp', 'diss-P'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updateDiss));
  }
}


  // --- Exercises (multi) ---
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
          markSectionDone('kinetics', 'exercise');
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
  loadExercise(0);
  document.getElementById('ex-next')?.addEventListener('click', () => {
    _exIdx = Math.min(_exIdx + 1, EXERCISES.length - 1);
    loadExercise(_exIdx);
  });
// ---------------------------------------------------------------------------
// Simulação de equilíbrio reversível A ⇌ B
// Integração numérica de Euler: d[A]/dt = -kd[A] + ki[B], d[B]/dt = kd[A] - ki[B]
// ---------------------------------------------------------------------------
let _eqAnimId = null;

function _initEqSim() {
  const setV = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  function runAndDraw() {
    const kd  = parseFloat(document.getElementById('eq-kd')?.value  ?? 0.5);
    const ki  = parseFloat(document.getElementById('eq-ki')?.value  ?? 0.25);
    const A0  = parseFloat(document.getElementById('eq-a0')?.value  ?? 1.0);

    setV('eq-kd-val', kd.toFixed(2));
    setV('eq-ki-val', ki.toFixed(2));
    setV('eq-a0-val', A0.toFixed(2));

    // Valores analíticos de equilíbrio
    const Kc   = kd / ki;
    const Aeq  = A0 / (1 + Kc);
    const Beq  = A0 * Kc / (1 + Kc);
    const keff = kd + ki;
    const thalf = Math.LN2 / keff;

    setV('eq-Kc',    Kc.toFixed(3));
    setV('eq-Aeq',   Aeq.toFixed(4));
    setV('eq-Beq',   Beq.toFixed(4));
    setV('eq-thalf', thalf.toFixed(2) + ' s');

    // Gerar trajetória por integração de Euler
    const T_END = 4 * thalf;
    const N = 300;
    const dt = T_END / N;
    const pointsA = [], pointsB = [];
    let A = A0, B = 0;
    for (let i = 0; i <= N; i++) {
      pointsA.push({ t: i * dt, c: A });
      pointsB.push({ t: i * dt, c: B });
      const dA = (-kd * A + ki * B) * dt;
      A += dA;
      B -= dA;
      A = Math.max(0, A);
      B = Math.max(0, B);
    }

    // Canvas
    const canvas = document.getElementById('eqsim-canvas');
    const frame  = document.getElementById('eqsim-frame');
    if (!canvas || !frame) return;

    const W   = Math.min(frame.clientWidth || 520, 520);
    const H   = 160;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const MX = 38, MY = 10, PW = W - MX - 10, PH = H - MY - 24;
    const C_MAX = A0;

    function toX(t)  { return MX + (t / T_END) * PW; }
    function toY(c)  { return MY + PH - (c / C_MAX) * PH; }

    // Fundo
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Eixos
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MX, MY); ctx.lineTo(MX, MY + PH); ctx.lineTo(MX + PW, MY + PH);
    ctx.stroke();

    // Rótulos eixo Y
    ctx.fillStyle = 'rgba(200,200,200,0.55)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'right';
    [0, 0.25, 0.5, 0.75, 1].forEach(f => {
      const y = MY + PH - f * PH;
      ctx.fillText((f * C_MAX).toFixed(2), MX - 3, y + 3);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath(); ctx.moveTo(MX, y); ctx.lineTo(MX + PW, y); ctx.stroke();
    });

    // Rótulos eixo X
    ctx.textAlign = 'center';
    [0, 0.25, 0.5, 0.75, 1].forEach(f => {
      const x = MX + f * PW;
      ctx.fillText((f * T_END).toFixed(1) + 's', x, MY + PH + 12);
    });

    // Labels dos eixos
    ctx.fillStyle = 'rgba(200,200,200,0.35)';
    ctx.textAlign = 'center';
    ctx.fillText('tempo (s)', MX + PW / 2, H - 2);
    ctx.save();
    ctx.translate(8, MY + PH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Conc. (mol/L)', 0, 0);
    ctx.restore();

    // Linhas de equilíbrio (tracejadas)
    ctx.strokeStyle = 'rgba(79,195,247,0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(MX, toY(Aeq)); ctx.lineTo(MX + PW, toY(Aeq));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(239,71,111,0.25)';
    ctx.beginPath();
    ctx.moveTo(MX, toY(Beq)); ctx.lineTo(MX + PW, toY(Beq));
    ctx.stroke();
    ctx.setLineDash([]);

    // Curva [A] — azul
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toX(pointsA[0].t), toY(pointsA[0].c));
    pointsA.slice(1).forEach(p => ctx.lineTo(toX(p.t), toY(p.c)));
    ctx.stroke();

    // Curva [B] — vermelho
    ctx.strokeStyle = '#ef476f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toX(pointsB[0].t), toY(pointsB[0].c));
    pointsB.slice(1).forEach(p => ctx.lineTo(toX(p.t), toY(p.c)));
    ctx.stroke();

    // Legenda
    [[4,'#4fc3f7','[A]'], [14,'#ef476f','[B]']].forEach(([xOff, col, lbl]) => {
      ctx.fillStyle = col;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(lbl, MX + xOff, MY + 9);
    });
  }

  runAndDraw();
  ['eq-kd','eq-ki','eq-a0'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', runAndDraw));
}

export function destroy() {
  if (_eqAnimId) { cancelAnimationFrame(_eqAnimId); _eqAnimId = null; }
  if (_loop) { _loop.stop(); _loop = null; }
}
