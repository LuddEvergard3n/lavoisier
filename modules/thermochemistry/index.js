/**
 * modules/thermochemistry/index.js — Módulo: Termoquímica
 * Lavoisier — Laboratório Visual de Química
 *
 * Implementa:
 *  - Diagrama de entalpia canvas: curva de coordenada de reação
 *  - Seleção de reações exo/endotérmicas
 *  - Visualização animada de liberação/absorção de energia
 *  - Exercício guiado
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';
import { SimLoop }         from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

/* -----------------------------------------------------------------------
   Reações com dados de entalpia
----------------------------------------------------------------------- */
const REACTIONS = {
  combustion: {
    label:    'Combustão do metano',
    equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    dH:       -890,   // kJ/mol
    Ea:        85,    // kJ/mol (energia de ativação)
    type:     'exo',
    info:     'Libera 890 kJ/mol. A energia liberada aquece e é usada em fogões e aquecedores.',
  },
  photosynthesis: {
    label:    'Fotossíntese (simplificada)',
    equation: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
    dH:      +2803,
    Ea:       2900,
    type:    'endo',
    info:    'Absorve ~2803 kJ/mol de luz solar para sintetizar glicose.',
  },
  neutralization: {
    label:    'Neutralização ácido-base',
    equation: 'HCl + NaOH → NaCl + H₂O',
    dH:       -57,
    Ea:        20,
    type:     'exo',
    info:     'Libera 57 kJ/mol. Por isso soluções de ácidos fortes e bases fortes aquecem ao misturar.',
  },
  dissolution: {
    label:    'Dissolução do NH₄NO₃',
    equation: 'NH₄NO₃(s) → NH₄⁺(aq) + NO₃⁻(aq)',
    dH:       +25,
    Ea:        35,
    type:    'endo',
    info:    'Absorve 25 kJ/mol do ambiente. Base dos bolsões de gelo instantâneo.',
  },
};

/* -----------------------------------------------------------------------
   Estado do módulo — resetado em render()
----------------------------------------------------------------------- */
let _rxKey      = 'combustion';
let _progress   = 0;   // 0 a 1, animado
let _animating  = false;
let _loop       = null;
let _exAttempts = 0;
let _exDone     = false;

/* -----------------------------------------------------------------------
   Canvas: diagrama de coordenada de reação
----------------------------------------------------------------------- */
function startCanvas(canvasEl) {
  const frame = canvasEl.parentElement;
  const W     = Math.min(frame.clientWidth || 520, 520);
  const H     = 260;
  const dpr   = window.devicePixelRatio || 1;
  canvasEl.width  = Math.round(W * dpr);
  canvasEl.height = Math.round(H * dpr);
  canvasEl.style.width  = W + 'px';
  canvasEl.style.height = H + 'px';
  const ctx = canvasEl.getContext('2d');
  ctx.scale(dpr, dpr);

  if (_loop) _loop.stop();

  _loop = new SimLoop((dt, t) => {
    const rx = REACTIONS[_rxKey];
    clearCanvas(ctx, W, H);

    // avançar progresso se animando
    if (_animating) {
      _progress += dt * 0.4;
      if (_progress >= 1) { _progress = 1; _animating = false; }
    }

    const padX = 48;
    const padY = 24;
    const gW   = W - padX * 2;
    const gH   = H - padY * 2 - 20;

    // eixos
    ctx.strokeStyle = COLOR.border;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(padX, padY);
    ctx.lineTo(padX, padY + gH);
    ctx.lineTo(padX + gW, padY + gH);
    ctx.stroke();

    // rótulos eixos
    ctx.fillStyle  = COLOR.textMuted;
    ctx.font       = '10px sans-serif';
    ctx.textAlign  = 'center';
    ctx.fillText('Coordenada de reação', padX + gW / 2, H - 4);
    ctx.save();
    ctx.translate(12, padY + gH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Entalpia (H)', 0, 0);
    ctx.restore();

    // normalizar energias para o canvas
    const isExo    = rx.type === 'exo';
    const absMax   = Math.max(Math.abs(rx.dH), rx.Ea) * 1.3;
    const reactH   = 0;
    const tsH      = rx.Ea;
    const prodH    = rx.dH;

    const toY = h => padY + gH - ((h - Math.min(reactH, prodH, 0) + absMax * 0.1) / (absMax * 1.2)) * gH;

    const y0 = toY(reactH);
    const yTS = toY(tsH);
    const yP = toY(prodH);

    const x0 = padX;
    const xTS = padX + gW * 0.45;
    const xP = padX + gW;

    // curva de reação
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(
      padX + gW * 0.2, y0,
      xTS - gW * 0.1, yTS,
      xTS, yTS
    );
    ctx.bezierCurveTo(
      xTS + gW * 0.1, yTS,
      xP - gW * 0.2, yP,
      xP, yP
    );
    ctx.strokeStyle = COLOR.border;
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // curva colorida até _progress
    if (_progress > 0) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);

      // subdivide em pontos ao longo da bezier dupla
      const steps = 80;
      const half  = Math.floor(steps * 0.45);

      for (let i = 1; i <= steps; i++) {
        const frac = i / steps;
        if (frac > _progress) break;

        const u = frac / 0.45;
        let px, py;
        if (frac <= 0.45) {
          const uu = frac / 0.45;
          px = cubicBezier(x0, padX + gW*0.2, xTS - gW*0.1, xTS, uu);
          py = cubicBezier(y0, y0, yTS, yTS, uu);
        } else {
          const uu = (frac - 0.45) / 0.55;
          px = cubicBezier(xTS, xTS + gW*0.1, xP - gW*0.2, xP, uu);
          py = cubicBezier(yTS, yTS, yP, yP, uu);
        }
        ctx.lineTo(px, py);
      }

      ctx.strokeStyle = isExo ? COLOR.reaction : COLOR.electron;
      ctx.lineWidth   = 2.5;
      ctx.stroke();
    }

    // linhas de nível (reagentes / produtos)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = COLOR.textMuted;
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(x0, y0);   ctx.lineTo(xTS - 30, y0);   ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xP, yP);   ctx.lineTo(xTS + 30, yP);   ctx.stroke();
    ctx.setLineDash([]);

    // seta ΔH
    const arrowX = padX + gW + 12;
    ctx.strokeStyle = isExo ? COLOR.reaction : COLOR.electron;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(arrowX, y0);
    ctx.lineTo(arrowX, yP);
    ctx.stroke();
    const arrowDir = isExo ? 6 : -6;
    ctx.beginPath();
    ctx.moveTo(arrowX - 4, yP + arrowDir);
    ctx.lineTo(arrowX, yP);
    ctx.lineTo(arrowX + 4, yP + arrowDir);
    ctx.stroke();

    ctx.fillStyle  = isExo ? COLOR.reaction : COLOR.electron;
    ctx.font       = 'bold 10px sans-serif';
    ctx.textAlign  = 'left';
    ctx.fillText(`ΔH = ${rx.dH > 0 ? '+' : ''}${rx.dH} kJ/mol`, arrowX + 8, (y0 + yP) / 2 + 4);

    // energia de ativação
    ctx.strokeStyle = COLOR.bond;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(xTS + 8, y0);
    ctx.lineTo(xTS + 8, yTS);
    ctx.stroke();
    ctx.fillStyle = COLOR.bond;
    ctx.font      = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Ea = ${rx.Ea} kJ`, xTS + 12, (y0 + yTS) / 2 + 4);

    // rótulos
    ctx.fillStyle = COLOR.textPrimary;
    ctx.font      = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Reagentes', x0 + 24, y0 - 6);
    ctx.fillText('Produtos', xP - 24, yP - 6);

    // partículas de energia (apenas na fase descendente para exo)
    if (_progress > 0.5 && isExo) {
      const n = Math.floor((_progress - 0.5) * 12);
      for (let i = 0; i < n; i++) {
        const angle = t * 2 + i * 0.8;
        const dist  = 12 + (i % 3) * 8;
        const px    = xTS + Math.cos(angle) * dist;
        const py    = yTS + Math.sin(angle) * dist - (_progress - 0.5) * gH * 0.6;
        const alpha = Math.max(0, 1 - (_progress - 0.5) * 2);
        ctx.fillStyle = `rgba(255,160,70,${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  _loop.start();
}

/* spline cúbica de Bézier em t */
function cubicBezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
}

/* -----------------------------------------------------------------------
   Exercício
----------------------------------------------------------------------- */
const EXERCISE = {
  question: 'Bolsões de gelo instantâneo ficam frios quando ativados. Isso indica que a dissolução do sal dentro é:',
  options: [
    'Exotérmica — libera calor para o ambiente',
    'Endotérmica — absorve calor do ambiente',
    'Neutra — sem variação de entalpia',
    'Exotérmica — mas o empacotamento isola',
  ],
  correct: 1,
  explanation: 'A dissolução do NH₄NO₃ é endotérmica (ΔH = +25 kJ/mol): o processo absorve energia térmica do entorno, resfriando o ambiente em contato. Por isso o bolsão fica frio.',
};

/* -----------------------------------------------------------------------
   render()
----------------------------------------------------------------------- */
export function render(outlet) {
  _rxKey     = 'combustion';
  _progress  = 0;
  _animating = false;
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
        <path d="M12 2C8 6 6 10 8 14c1 2 3 3 4 5 1-2 3-3 4-5 2-4 0-8-4-12z"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Termoquímica</h1>
      <p class="module-subtitle">Energia em reações químicas: calor, entalpia e diagrama energético.</p>
    </div>
  </header>

  <!-- Fenômeno -->
  <section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">
      Ao queimar madeira, energia é liberada como calor e luz. Para fundir o ferro, energia precisa
      ser fornecida continuamente. Reações químicas sempre envolvem troca de energia com o ambiente —
      seja liberando (exotérmicas) ou absorvendo (endotérmicas).
    </p>
    <p class="module-text">
      A variação de entalpia <strong>ΔH = H(produtos) − H(reagentes)</strong>. Negativo = exotérmica;
      positivo = endotérmica. Mas toda reação também precisa de energia de ativação (Ea) para começar.
    </p>
  </section>

  <!-- Diagrama de entalpia -->
  <section class="module-section">
    <h2 class="module-section-title">Diagrama de entalpia</h2>

    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
      ${Object.entries(REACTIONS).map(([k, rx]) => `
        <button class="btn btn-sm ${k === 'combustion' ? 'btn-secondary' : 'btn-ghost'}"
                id="rx-btn-${k}" data-rxkey="${k}">${esc(rx.label)}</button>
      `).join('')}
    </div>

    <div class="canvas-frame">
      <canvas id="thermo-canvas"></canvas>
    </div>

    <div id="rx-info" style="margin-top:.75rem;font-size:var(--text-sm);color:var(--text-secondary)">
      ${esc(REACTIONS['combustion'].info)}
    </div>

    <button class="btn btn-secondary" id="btn-animate" style="margin-top:1rem">
      Simular reação
    </button>
  </section>

  <!-- Exercício -->

  <!-- Energia de Gibbs -->
  <section class="module-section">
    <h2 class="module-section-title">Energia de Gibbs e espontaneidade</h2>
    <p class="module-text">
      Uma reação é espontânea se a variação de energia de Gibbs for negativa:
      <strong>ΔG = ΔH − TΔS</strong>. ΔH é a variação de entalpia, T a temperatura absoluta e
      ΔS a variação de entropia. A espontaneidade depende do balanço entre entalpia e entropia.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin:.5rem 0 1rem">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">ΔG &lt; 0</h3><p style="font-size:var(--text-sm)">Espontânea. Processo ocorre sem energia externa. Ex: combustão, ferrugem, dissolução de NaCl.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">ΔG &gt; 0</h3><p style="font-size:var(--text-sm)">Não espontânea. Requer energia. Ex: eletrólise, síntese de ATP, fotossíntese.</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--text-muted)">ΔG = 0</h3><p style="font-size:var(--text-sm)">Equilíbrio dinâmico. Taxa forward = taxa reverse. Ex: gelo/água a 0°C e 1 atm.</p></div>
    </div>

    <p class="module-text"><strong>Relação com equilíbrio</strong>: ΔG° = −RT·lnK. Se K &gt; 1, ΔG° &lt; 0 (produtos favorecidos). Se K &lt; 1, ΔG° &gt; 0.</p>

    <div style="display:flex;flex-direction:column;gap:.6rem;margin:.75rem 0 1rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">ΔH (kJ/mol):</label>
        <input type="range" id="gibbs-dh" min="-400" max="400" step="5" value="-100" style="width:160px;accent-color:var(--accent-electron)">
        <span id="gibbs-dh-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:80px">−100 kJ/mol</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">ΔS (J/mol·K):</label>
        <input type="range" id="gibbs-ds" min="-300" max="300" step="5" value="100" style="width:160px;accent-color:var(--accent-bond)">
        <span id="gibbs-ds-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:80px">+100 J/mol·K</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">T (K):</label>
        <input type="range" id="gibbs-t" min="100" max="2000" step="10" value="298" style="width:160px;accent-color:var(--accent-organic)">
        <span id="gibbs-t-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:80px">298 K (25°C)</span>
      </div>
    </div>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">ΔG (kJ/mol)</p><div id="gibbs-dg" style="font-size:var(--text-2xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Espontaneidade</p><div id="gibbs-spont" style="font-size:var(--text-lg);font-weight:700">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">TΔS (kJ/mol)</p><div id="gibbs-tds" style="font-size:var(--text-xl);font-weight:600;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">T de inversão</p><div id="gibbs-tinv" style="font-size:var(--text-base);font-weight:600;color:var(--text-secondary)">—</div></div>
    </div>
  </section>

  <!-- Entropia -->
  <section class="module-section">
    <h2 class="module-section-title">Entropia — 2ª Lei da Termodinâmica</h2>
    <p class="module-text">
      Entropia (S) mede a desordem ou número de microestados acessíveis: <strong>S = k·lnW</strong>
      (equação de Boltzmann). A 2ª Lei afirma que a entropia total do universo sempre aumenta em
      processos espontâneos: ΔS_universo = ΔS_sistema + ΔS_arredores ≥ 0.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">ΔS &gt; 0 (aumenta)</h3><p style="font-size:var(--text-sm)">Sólido → líquido → gás; mistura de gases; dissolução; reações que aumentam número de moles de gás (ex: N₂O₄ → 2NO₂).</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">ΔS &lt; 0 (diminui)</h3><p style="font-size:var(--text-sm)">Gás → líquido → sólido; polimerização; formação de precipitado; reações que reduzem moles de gás.</p></div>
      <div class="info-card"><h3 style="margin-top:0">3ª Lei</h3><p style="font-size:var(--text-sm)">S = 0 para cristal perfeito a 0 K. Permite tabular entropias absolutas S° e calcular ΔS°_rxn = ΣS°_prod − ΣS°_react.</p></div>
    </div>
  </section>

  <section class="module-section" id="exercise-section">
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


  <!-- Lei de Hess -->
  <section class="module-section">
    <h2 class="module-section-title">Lei de Hess</h2>
    <p class="module-text">
      A variação de entalpia de uma reação é a soma das variações de entalpias de reações intermediárias,
      independente do caminho percorrido. Isso permite calcular ΔH de reações que não podemos medir
      diretamente, combinando reações conhecidas.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin:.5rem 0 1rem;max-width:480px">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin:0">
        ΔH_reação = Σ ΔH_produtos − Σ ΔH_reagentes<br>
        (usando entalpias de formação padrão ΔHf°)
      </p>
    </div>
    <p class="module-text"><strong>Exemplo — Formação do CO₂ pelo caminho indireto (via CO):</strong></p>
    <div class="module-grid" style="grid-template-columns:1fr;max-width:520px;gap:.5rem">
      <div class="info-card" style="font-family:monospace;font-size:var(--text-sm)">
        <span style="color:var(--accent-electron)">(1)</span> C(s) + ½O₂ → CO(g)&nbsp;&nbsp;&nbsp;ΔH₁ = −110 kJ
      </div>
      <div class="info-card" style="font-family:monospace;font-size:var(--text-sm)">
        <span style="color:var(--accent-electron)">(2)</span> CO(g) + ½O₂ → CO₂(g)&nbsp;ΔH₂ = −283 kJ
      </div>
      <div class="info-card" style="background:var(--bg-raised);font-family:monospace;font-size:var(--text-sm)">
        <span style="color:var(--accent-bond)">Total:</span> C(s) + O₂ → CO₂(g)&nbsp;&nbsp;ΔH = −393 kJ
      </div>
    </div>
    <p class="module-text" style="margin-top:.75rem">
      O mesmo valor é obtido pela combustão direta do carbono — validando a lei. Isso é útil
      para calcular ΔH de reações como a síntese de moléculas orgânicas complexas.
    </p>
  </section>

  <!-- Calorimetria -->
  <section class="module-section">
    <h2 class="module-section-title">Calorimetria</h2>
    <p class="module-text">
      Calorimetria mede o calor trocado em reações. A equação fundamental é:
      <strong>Q = m · c · ΔT</strong>, onde m é a massa, c é o calor específico e ΔT a
      variação de temperatura. Em um calorímetro de pressão constante, Q_rxn = −Q_agua.
    </p>
    <div id="calor-calc" style="margin-top:.75rem">
      <div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
          <label style="min-width:200px;font-size:var(--text-sm);color:var(--text-secondary)">Massa da solução m (g):</label>
          <input type="range" id="cal-mass" min="50" max="500" step="10" value="200" style="width:140px;accent-color:var(--accent-electron)">
          <span id="cal-mass-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">200 g</span>
        </div>
        <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
          <label style="min-width:200px;font-size:var(--text-sm);color:var(--text-secondary)">Variação de temperatura ΔT (°C):</label>
          <input type="range" id="cal-dt" min="-30" max="60" step="1" value="5" style="width:140px;accent-color:var(--accent-reaction)">
          <span id="cal-dt-val" style="font-size:var(--text-sm);color:var(--accent-reaction);min-width:60px">+5 °C</span>
        </div>
      </div>
      <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
        <div class="info-card">
          <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Calor absorvido Q</p>
          <div id="cal-q" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">4.184 kJ</div>
        </div>
        <div class="info-card">
          <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">ΔH reação (sinal inverso)</p>
          <div id="cal-dh" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-reaction)">−4.184 kJ</div>
        </div>
        <div class="info-card">
          <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Tipo</p>
          <div id="cal-type" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-organic)">Exotérmica</div>
        </div>
      </div>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:.5rem">c(água) = 4,184 J/(g·°C)</p>
    </div>
  </section>

  <!-- Cotidiano -->
  <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">
      Catalisadores (como os conversores catalíticos dos carros e as enzimas do corpo humano)
      reduzem a energia de ativação sem alterar o ΔH — a reação chega ao mesmo produto final
      por um caminho energeticamente mais acessível. O corpo humano usa catalisadores
      (enzimas) para milhares de reações que, sem elas, levariam anos para ocorrer a 37°C.
    </p>
  </div>

</div>
`;

  const canvas = document.getElementById('thermo-canvas');
  if (canvas) startCanvas(canvas);

  // botões de reação
  Object.keys(REACTIONS).forEach(k => {
    document.getElementById(`rx-btn-${k}`)?.addEventListener('click', () => {
      _rxKey     = k;
      _progress  = 0;
      _animating = false;
      Object.keys(REACTIONS).forEach(k2 => {
        const btn = document.getElementById(`rx-btn-${k2}`);
        if (btn) btn.className = `btn btn-sm ${k2 === k ? 'btn-secondary' : 'btn-ghost'}`;
      });
      const info = document.getElementById('rx-info');
      if (info) info.textContent = REACTIONS[k].info;
    });
  });

  document.getElementById('btn-animate')?.addEventListener('click', () => {
    _progress  = 0;
    _animating = true;
  });

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
        markSectionDone('thermochemistry', 'exercise');
      } else {
        btn.style.borderColor = 'var(--accent-reaction)';
        btn.style.color       = 'var(--accent-reaction)';
        if (fb && _exAttempts === 1) {
          fb.innerHTML = `<p class="feedback-hint">Dica: o que acontece com a temperatura do objeto ao redor quando algo absorve calor?</p>`;
        }
      }
    });
  });

// Calorimetria
  function updateCalorimetry() {
    const m  = parseInt(document.getElementById('cal-mass')?.value || 200, 10);
    const dt = parseInt(document.getElementById('cal-dt')?.value || 5, 10);
    const c  = 4.184; // J/(g·°C)
    const Q  = m * c * dt / 1000; // kJ
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('cal-mass-val', m + ' g');
    set('cal-dt-val',   (dt >= 0 ? '+' : '') + dt + ' °C');
    set('cal-q',  (Q >= 0 ? '+' : '') + Q.toFixed(3) + ' kJ');
    set('cal-dh', (Q >= 0 ? '-' : '+') + Math.abs(Q).toFixed(3) + ' kJ');
    set('cal-type', dt > 0 ? 'Exotérmica' : dt < 0 ? 'Endotérmica' : 'Neutra');
    const calDH = document.getElementById('cal-dh');
    if (calDH) calDH.style.color = dt > 0 ? 'var(--accent-reaction)' : 'var(--accent-electron)';
    const calType = document.getElementById('cal-type');
    if (calType) calType.style.color = dt > 0 ? 'var(--accent-reaction)' : 'var(--accent-electron)';
  }
  updateCalorimetry();
  document.getElementById('cal-mass')?.addEventListener('input', updateCalorimetry);
  document.getElementById('cal-dt')?.addEventListener('input', updateCalorimetry);


  // Gibbs free energy calculator
  function updateGibbs() {
    const dH = parseInt(document.getElementById('gibbs-dh')?.value || -100, 10);
    const dS = parseInt(document.getElementById('gibbs-ds')?.value || 100, 10);
    const T  = parseInt(document.getElementById('gibbs-t')?.value  || 298, 10);
    const TdS = T * dS / 1000; // kJ/mol
    const dG  = dH - TdS;
    const set = (id, v, color) => { const el=document.getElementById(id); if(el){el.textContent=v; if(color) el.style.color=color;} };
    set('gibbs-dh-val', (dH>=0?'+':'')+dH+' kJ/mol');
    set('gibbs-ds-val', (dS>=0?'+':'')+dS+' J/mol·K');
    set('gibbs-t-val',  T+' K ('+(T-273)+' °C)');
    set('gibbs-dg',  (dG>=0?'+':'')+dG.toFixed(1)+' kJ/mol', dG<0?'var(--accent-organic)':dG>0?'var(--accent-reaction)':'var(--text-muted)');
    const spont = dG < -1 ? 'Espontânea' : dG > 1 ? 'Não espontânea' : 'Equilíbrio';
    set('gibbs-spont', spont, dG<0?'var(--accent-organic)':dG>0?'var(--accent-reaction)':'var(--text-muted)');
    set('gibbs-tds', (TdS>=0?'+':'')+TdS.toFixed(1)+' kJ/mol');
    // Temperatura de inversão (ΔG=0): T_inv = ΔH/ΔS (only if ΔH and ΔS have same sign issue)
    if (dS !== 0) {
      const Tinv = (dH * 1000) / dS;
      set('gibbs-tinv', Tinv > 0 ? Tinv.toFixed(0)+' K ('+Math.round(Tinv-273)+' °C)' : 'Sem inversão');
    } else {
      set('gibbs-tinv', 'ΔS=0 — sem inversão');
    }
  }
  updateGibbs();
  document.getElementById('gibbs-dh')?.addEventListener('input', updateGibbs);
  document.getElementById('gibbs-ds')?.addEventListener('input', updateGibbs);
  document.getElementById('gibbs-t')?.addEventListener('input', updateGibbs);
}

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
}
