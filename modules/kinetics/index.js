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
const EXERCISE = {
  question: 'Ao aumentar a temperatura de uma reação, a velocidade aumenta principalmente porque:',
  options: [
    'A concentração dos reagentes aumenta',
    'A energia de ativação diminui permanentemente',
    'Mais moléculas possuem energia cinética suficiente para superar a barreira (Ea)',
    'O catalisador é ativado pelo calor',
  ],
  correct: 2,
  explanation: 'A distribuição de velocidades de Maxwell-Boltzmann mostra que ao aumentar T, a fração de moléculas com energia ≥ Ea cresce exponencialmente — relação de Arrhenius: k = A·e^(-Ea/RT). A Ea em si não muda.',
};

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
        <p style="font-family:monospace;font-size:var(--text-sm)">[A] = [A]₀ − kt</p>
        <p style="font-family:monospace;font-size:var(--text-sm)">t½ = [A]₀ / 2k</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:.4rem">Velocidade constante; independe de [A]. Gráfico [A]×t: linha reta. Ex: dissolução de comprimido de liberação controlada.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Ordem 1</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">ln[A] = ln[A]₀ − kt</p>
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
      <strong>k = A · e^(−Ea/RT)</strong>. Um catalisador aumenta A (fator pré-exponencial) ou
      diminui Ea, acelerando k sem alterar ΔH da reação.
    </p>
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

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
}
