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
      ${Object.entries(REACTIONS).map(_r => { const [k, rx]=_r; return `
        <button class="btn btn-sm ${k === 'combustion' ? 'btn-secondary' : 'btn-ghost'}"
                id="rx-btn-${k}" data-rxkey="${k}">${esc(rx.label)}</button>
      `; }).join('')}
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

  <!-- As três leis -->
  <section class="module-section">
    <h2 class="module-section-title">As três leis da termodinâmica</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">1ª Lei — Conservação de energia</h3>
        <p style="font-size:var(--text-sm)"><strong>ΔU = q + w</strong> (convenção IUPAC: w = −PΔV para expansão). Energia interna é função de estado. q_p = ΔH a pressão constante; q_v = ΔU em bomba calorimétrica (volume constante).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">2ª Lei — Entropia e espontaneidade</h3>
        <p style="font-size:var(--text-sm)"><strong>ΔS_universo ≥ 0</strong> para qualquer processo real. dS = δq_rev / T. A entropia do universo nunca diminui — define a seta do tempo e o porquê os processos têm direção preferida.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">3ª Lei — Entropia absoluta</h3>
        <p style="font-size:var(--text-sm)"><strong>S = 0</strong> para cristal perfeito a T = 0 K (Nernst-Planck). Permite calcular S° absoluta por integração de Cₚ/T de 0 K a 298 K. Ao contrário de ΔfH°, S° de elementos puros não é zero.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Relação entre as leis</h3>
        <p style="font-size:var(--text-sm)">ΔG = ΔH − TΔS combina 1ª e 2ª lei. ΔG &lt; 0 → espontâneo a T e P const. ΔG° = −RT ln K → liga espontaneidade ao equilíbrio. ΔG = ΔG° + RT ln Q → reação progride enquanto Q ≠ K.</p>
      </div>
    </div>
  </section>

  <!-- Ciclo de Carnot -->
  <section class="module-section">
    <h2 class="module-section-title">Ciclo de Carnot — eficiência máxima</h2>
    <p class="module-text">
      O ciclo de Carnot define o limite superior de eficiência de qualquer máquina térmica
      que opera entre T_q (fonte quente) e T_f (fonte fria). Todos os processos são reversíveis —
      ΔS_universo = 0 no ciclo completo, o que é impossível na prática.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-base);color:var(--accent-electron);margin-bottom:.5rem">
        η = 1 − T_f / T_q &nbsp;&nbsp;(T em Kelvin)
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Usina a vapor típica: T_q ≈ 800 K, T_f ≈ 300 K → η_max = 62,5%. Real &lt; teórico por irreversibilidades.<br>
        Motor de combustão interna: η_max ≈ 55–65%. Eficiência real ≈ 25–40%.
      </p>
    </div>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">T quente (K):</span>
        <input type="range" id="carnot-tq" min="400" max="1500" step="10" value="800"
               style="width:130px;accent-color:var(--accent-reaction)">
        <span id="carnot-tq-val" style="font-size:var(--text-sm);color:var(--accent-reaction);min-width:60px">800 K</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">T fria (K):</span>
        <input type="range" id="carnot-tf" min="200" max="600" step="10" value="300"
               style="width:130px;accent-color:var(--accent-electron)">
        <span id="carnot-tf-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">300 K</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">η_max (Carnot)</p>
        <div id="carnot-eta" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">W_max por 100 J absorvidos</p>
        <div id="carnot-work" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">ΔS_universo (ciclo ideal)</p>
        <div style="font-size:var(--text-base);font-weight:600;color:var(--accent-bond)">= 0 (reversível)</div>
      </div>
    </div>
  </section>

  <!-- Cotidiano -->
  <!-- Termodinâmica estatística -->
  <section class="module-section">
    <h2 class="module-section-title">Termodinâmica estatística</h2>
    <p class="module-text">
      A termodinâmica estatística conecta propriedades macroscópicas (T, P, S, U) com o
      comportamento de moléculas individuais. Boltzmann mostrou que a entropia é uma medida
      do número de microestados acessíveis W: <strong>S = k_B · ln W</strong>.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        S = k_B · ln W &nbsp;&nbsp;&nbsp; k_B = 1,381 × 10⁻²³ J/K = R/N_A
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        W = número de microestados compatíveis com o macroestado (energia, volume, n fixos).<br>
        Sistema puro na T=0 K: W=1 → S=0 (3ª lei, consistente). Ao expandir: W↑ → S↑.<br>
        Mistura de 2 gases ideais: ΔS_mix = −R(x₁ ln x₁ + x₂ ln x₂) &gt; 0 sempre.
      </p>
    </div>

    <!-- Função de partição -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Função de partição e propriedades termodinâmicas
    </h3>
    <p class="module-text">
      A <strong>função de partição</strong> q = Σᵢ gᵢ · exp(−εᵢ/k_BT) codifica toda a
      informação termodinâmica de uma molécula. Para N moléculas: Q = q^N/N! (indistinguíveis).
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr));margin-bottom:var(--space-5)">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">q_trans (translação)</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">q_t = (2πmk_BT/h²)^(3/2) · V</p>
        <p style="font-size:var(--text-sm)">Contribuição dominante a T ambiente. Separação entre níveis ≪ k_BT → contínuo. Provê a maior parte de U e toda PV = Nk_BT (gás ideal).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">q_rot (rotação)</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">q_r = T/σΘ_rot &nbsp; (T ≫ Θ_rot)</p>
        <p style="font-size:var(--text-sm)">Θ_rot = h²/(8π²Ik_B). Para H₂: Θ_rot ≈ 85 K (rotação quantizada até baixa T). Para moléculas pesadas: Θ_rot ≈ 0,5–5 K → clássico. σ = número de simetria.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">q_vib (vibração)</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">q_v = 1/(1−e^(−Θ_vib/T))</p>
        <p style="font-size:var(--text-sm)">Θ_vib = hν/k_B. Para H₂: Θ_vib ≈ 6330 K (vibração quase não excitada a 298 K). Para modos "flácidos" (Θ_vib ~ 500 K): significativo. Einstein: Cv ∝ (Θ_vib/T)² para cristais.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Equipartição clássica</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">⟨εᵢ⟩ = ½k_BT por grau de liberdade quadrático</p>
        <p style="font-size:var(--text-sm)">Monoatômico: 3 trans → Cv = 3/2·R = 12,5 J/(mol·K). Diatômico a T mod.: 3t + 2r → Cv = 5/2·R = 20,8. Com vibração: +R por modo (k e p). H₂O (não-linear): 3+3+3 modos = Cv até 6R (alta T).</p>
      </div>
    </div>

    <!-- Calculadora de capacidade calorífica por equipartição -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Capacidade calorífica Cv por equipartição — moléculas diatômicas
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;gap:.4rem;flex-wrap:wrap" id="equip-type-btns">
        <button class="btn btn-xs btn-secondary" data-equip="monoat">Monoatômico (He, Ar)</button>
        <button class="btn btn-xs btn-ghost" data-equip="diat-nv">Diatômico sem vibração (N₂ 25°C)</button>
        <button class="btn btn-xs btn-ghost" data-equip="diat-v">Diatômico com vibração (alta T)</button>
        <button class="btn btn-xs btn-ghost" data-equip="nonlin">Não-linear (H₂O, SO₂)</button>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Graus de liberdade ativos</p><div id="equip-dof" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Cv (J/mol·K)</p><div id="equip-cv" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Cp (J/mol·K)</p><div id="equip-cp" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-organic)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">γ = Cp/Cv</p><div id="equip-gamma" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-reaction)">—</div></div>
    </div>

    <!-- ΔS de mistura -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:var(--space-6);margin-bottom:var(--space-3)">
      Entropia de mistura ideal — ΔS_mix
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">Fração molar x₁:</span>
        <input type="range" id="smix-x1" min="0.01" max="0.99" step="0.01" value="0.5"
               style="width:130px;accent-color:var(--accent-electron)">
        <span id="smix-x1-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:50px">0,50</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">ΔS_mix (J/mol·K)</p><div id="smix-S" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">ΔG_mix (kJ/mol) a 298K</p><div id="smix-G" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">x₂ = 1 − x₁</p><div id="smix-x2" style="font-size:var(--text-base);font-weight:600;color:var(--text-secondary)">—</div></div>
    </div>
  </section>

    <!-- Ensemble canônico -->
  <section class="module-section">
    <h2 class="module-section-title">Ensemble canônico e distribuição de Boltzmann</h2>
    <p class="module-text">
      O <strong>ensemble canônico</strong> (NVT) descreve um sistema com N, V e T fixos
      em contato térmico com um reservatório. A probabilidade de o sistema estar no
      microestado <em>i</em> com energia ε_i é dada pela
      <strong>distribuição de Boltzmann</strong>: p_i = e^(−ε_i/k_BT) / q.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        p_i = g_i · e^(−ε_i/k_BT) / q &nbsp;&nbsp;|&nbsp;&nbsp; q = Σᵢ gᵢ · e^(−ε_i/k_BT)
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        g_i = degenerescência do nível i (número de microestados com a mesma energia).<br>
        q = função de partição canônica: normaliza a distribuição; qua todas as propriedades termodinâmicas.<br>
        Propriedades: U = −(∂ ln q/∂β)_N,V &nbsp;|&nbsp; S = k_B(ln q + βU) &nbsp;|&nbsp; F = −k_BT ln q &nbsp;(β = 1/k_BT)
      </p>
    </div>

    <!-- Calculadora de população de Boltzmann -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Razão de populações de dois níveis
    </h3>
    <p class="module-text">
      Para dois níveis com energias ε₁ &lt; ε₂ e degenerescências g₁, g₂:
      <span style="font-family:monospace">N₂/N₁ = (g₂/g₁)·exp(−Δε/k_BT)</span>.
      Demonstra como T controla as populações e como lasers exploram inversão de população.
    </p>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">Δε (cm⁻¹):</span>
        <input type="range" id="boltz-de" min="10" max="5000" step="10" value="500"
               style="width:130px;accent-color:var(--accent-electron)">
        <span id="boltz-de-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:80px">500 cm⁻¹</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">T (K):</span>
        <input type="range" id="boltz-T" min="50" max="5000" step="10" value="298"
               style="width:130px;accent-color:var(--accent-bond)">
        <span id="boltz-T-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:60px">298 K</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">g₂/g₁ (razão deg.):</span>
        <input type="range" id="boltz-g" min="1" max="5" step="1" value="1"
               style="width:130px;accent-color:var(--accent-organic)">
        <span id="boltz-g-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:30px">1</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">N₂/N₁</p><div id="boltz-ratio" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">% nível superior</p><div id="boltz-pct" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Δε (kJ/mol)</p><div id="boltz-kJ" style="font-size:var(--text-base);font-weight:600;color:var(--accent-organic)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">k_BT (cm⁻¹)</p><div id="boltz-kbT" style="font-size:var(--text-base);font-weight:600;color:var(--text-muted)">—</div></div>
    </div>

    <!-- Tabela de ensembles -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:var(--space-6);margin-bottom:var(--space-3)">
      Ensembles estatísticos
    </h3>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Ensemble</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Variáveis fixas</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Pot. termodinâmico</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Função de partição</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Uso típico</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['Microcanônico','N, V, E','Entropia S = k_B ln Ω','Ω(N,V,E) = nº microestados','Sistemas isolados; fundamentos'],
            ['Canônico (NVT)','N, V, T','Energia livre de Helmholtz F = −k_BT ln Q','Q = Σ e^(−βEᵢ)','Simulações MD/MC; gases ideais'],
            ['Gran-canônico','μ, V, T','Potencial gran-canônico Ω = −k_BT ln Z_gc','Z_gc = Σ e^(−β(Eᵢ−μNᵢ))','Fluidos abertos; sorção'],
            ['Isobárico-isotérmico (NPT)','N, P, T','Energia livre de Gibbs G = −k_BT ln Δ','Δ = Σ e^(−β(Eᵢ+PVᵢ))','Simulações a pressão constante'],
          ].map(_r => { const [e,v,pot,q,uso]=_r; return `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-weight:600;color:var(--accent-electron)">${e}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs);color:var(--accent-bond)">${v}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs)">${pot}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;font-size:var(--text-xs);color:var(--accent-organic)">${q}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${uso}</td>
          </tr>`; }).join('')}
        </tbody>
      </table>
    </div>
  </section>

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

  // Carnot calculator
  function updateCarnot() {
    const Tq = parseFloat(document.getElementById('carnot-tq')?.value ?? 800);
    const Tf = parseFloat(document.getElementById('carnot-tf')?.value ?? 300);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('carnot-tq-val', Tq + ' K');
    set('carnot-tf-val', Tf + ' K');
    const eta  = Tq > Tf ? (1 - Tf / Tq) : 0;
    set('carnot-eta',  (eta * 100).toFixed(1) + ' %');
    set('carnot-work', (eta * 100).toFixed(1) + ' J');
  }
  if (document.getElementById('carnot-tq')) {
    updateCarnot();
    ['carnot-tq', 'carnot-tf'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updateCarnot));
  }
}

function _initBoltzmann() {
  // 1 cm⁻¹ = 11.96 J/mol; k_B = 1.38065e-23 J/K; hc = 1.986e-23 J·cm
  const hc_cm  = 1.98645e-23; // h*c in J·cm
  const kB     = 1.38065e-23; // J/K
  const NA     = 6.02214e23;

  function update() {
    const de_cm = parseFloat(document.getElementById('boltz-de')?.value ?? 500);
    const T     = parseFloat(document.getElementById('boltz-T')?.value ?? 298);
    const g     = parseFloat(document.getElementById('boltz-g')?.value ?? 1);

    const de_J     = de_cm * hc_cm;          // J por molécula
    const kBT_cm   = kB * T / hc_cm;         // k_BT em cm⁻¹
    const ratio    = g * Math.exp(-de_J / (kB * T));
    const pct_up   = ratio / (1 + ratio) * 100;
    const de_kJ    = de_J * NA / 1000;       // kJ/mol

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('boltz-de-val', de_cm.toFixed(0) + ' cm⁻¹');
    set('boltz-T-val',  T.toFixed(0) + ' K');
    set('boltz-g-val',  g.toFixed(0));
    set('boltz-ratio',  ratio.toExponential(3));
    set('boltz-pct',    pct_up.toFixed(4) + '%');
    set('boltz-kJ',     de_kJ.toFixed(3) + ' kJ/mol');
    set('boltz-kbT',    kBT_cm.toFixed(1) + ' cm⁻¹');
  }

  if (document.getElementById('boltz-de')) {
    update();
    ['boltz-de','boltz-T','boltz-g'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', update));
  }
}

function _initEquipartition() {
  const R = 8.314;
  const MODES = {
    'monoat':   { label: 'Monoatômico', dof: 3, desc: '3 translação (½R cada)' },
    'diat-nv':  { label: 'Diatômico (sem vib.)', dof: 5, desc: '3t + 2r (≪ Θ_vib a 25°C)' },
    'diat-v':   { label: 'Diatômico (com vib.)', dof: 7, desc: '3t + 2r + 2v (k+p)' },
    'nonlin':   { label: 'Não-linear (ex: H₂O)', dof: 6, desc: '3t + 3r (sem vib a 25°C)' },
  };

  function update(key) {
    const m = MODES[key] || MODES['monoat'];
    const Cv = (m.dof / 2) * R;
    const Cp = Cv + R;
    const gamma = Cp / Cv;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('equip-dof',   m.dof + ' (' + m.desc + ')');
    set('equip-cv',    Cv.toFixed(2));
    set('equip-cp',    Cp.toFixed(2));
    set('equip-gamma', gamma.toFixed(4));
  }

  let _activeEquip = 'monoat';
  document.querySelectorAll('#equip-type-btns [data-equip]').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeEquip = btn.dataset.equip;
      document.querySelectorAll('#equip-type-btns [data-equip]').forEach(b => {
        b.className = 'btn btn-xs ' + (b.dataset.equip === _activeEquip ? 'btn-secondary' : 'btn-ghost');
      });
      update(_activeEquip);
    });
  });
  if (document.getElementById('equip-cv')) update(_activeEquip);
}

function _initSmix() {
  const R = 8.314;
  function update() {
    const x1 = parseFloat(document.getElementById('smix-x1')?.value ?? 0.5);
    const x2  = 1 - x1;
    const dS  = -R * (x1 * Math.log(x1) + x2 * Math.log(x2));
    const dG  = -298 * dS / 1000; // kJ/mol (ΔH_mix=0 para ideal)

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('smix-x1-val', x1.toFixed(2));
    set('smix-x2',     x2.toFixed(2));
    set('smix-S',      dS.toFixed(3) + ' J/mol·K');
    set('smix-G',      dG.toFixed(4) + ' kJ/mol');
  }
  document.getElementById('smix-x1')?.addEventListener('input', update);
  if (document.getElementById('smix-x1')) update();
}

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
}
