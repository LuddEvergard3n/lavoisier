/**
 * modules/solutions/index.js — Módulo: Soluções e pH
 * Lavoisier — Laboratório Visual de Química
 *
 * Seções: pH interativo, teoria ácido-base, diluição C1V1=C2V2, tampões Henderson-Hasselbalch
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';
import { SimLoop }         from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

const PH_EXAMPLES = [
  { ph: 0.0, label: 'HCl concentrado'  },
  { ph: 2.0, label: 'Suco de limão'    },
  { ph: 3.0, label: 'Vinagre'          },
  { ph: 4.5, label: 'Café'             },
  { ph: 5.5, label: 'Chuva ácida'      },
  { ph: 7.0, label: 'Água pura (25°C)' },
  { ph: 7.4, label: 'Sangue humano'    },
  { ph: 8.3, label: 'Água do mar'      },
  { ph: 9.0, label: 'Bicarbonato'      },
  { ph:11.0, label: 'Amônia doméstica' },
  { ph:13.0, label: 'Soda cáustica'    },
];

const BUFFERS = [
  { name:'Acetato',     pKa:4.76, acid:'CH₃COOH', base:'CH₃COO⁻', use:'Conservantes alimentares, fermentação' },
  { name:'Carbonato',   pKa:6.35, acid:'H₂CO₃',   base:'HCO₃⁻',   use:'Regulação do pH do sangue' },
  { name:'Fosfato',     pKa:7.20, acid:'H₂PO₄⁻',  base:'HPO₄²⁻',  use:'Tampão intracelular, soluções fisiológicas' },
  { name:'Amônia',      pKa:9.25, acid:'NH₄⁺',     base:'NH₃',     use:'Produtos de limpeza, síntese industrial' },
];

function phColor(ph) {
  const t = Math.max(0, Math.min(1, ph / 14));
  if (t < 0.5) {
    const f = t * 2;
    return `rgb(${Math.round(239*(1-f)+107*f)},${Math.round(71*(1-f)+203*f)},${Math.round(111*(1-f)+119*f)})`;
  }
  const f = (t - 0.5) * 2;
  return `rgb(${Math.round(107*(1-f)+79*f)},${Math.round(203*(1-f)+162*f)},${Math.round(119*(1-f)+219*f)})`;
}

let _ph = 7.0, _loop = null, _bufIdx = 1, _bufRatio = 1.0;
let _dilC1 = 1.0, _dilV1 = 100, _dilV2 = 500;
let _exAttempts = 0, _exDone = false;

function startCanvas(canvasEl) {
  const frame = canvasEl.parentElement;
  const W = Math.min(frame.clientWidth || 520, 520), H = 240;
  const dpr = window.devicePixelRatio || 1;
  canvasEl.width  = Math.round(W * dpr);
  canvasEl.height = Math.round(H * dpr);
  canvasEl.style.width  = W + 'px';
  canvasEl.style.height = H + 'px';
  const ctx = canvasEl.getContext('2d');
  ctx.scale(dpr, dpr);
  if (_loop) _loop.stop();

  _loop = new SimLoop((dt, t) => {
    clearCanvas(ctx, W, H);
    const padX = 24, sY = 36, sH = 22, sW = W - padX * 2;
    const grad = ctx.createLinearGradient(padX, 0, padX + sW, 0);
    grad.addColorStop(0,   '#ef476f'); grad.addColorStop(0.35,'#ffd166');
    grad.addColorStop(0.5, '#6bcb77'); grad.addColorStop(0.65,'#4fc3f7');
    grad.addColorStop(1,   '#4163b0');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(padX, sY, sW, sH, 4); ctx.fill();

    for (let i = 0; i <= 14; i++) {
      const x = padX + (i / 14) * sW;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x, sY + sH - 5, 1, 5);
      ctx.fillStyle = COLOR.textMuted; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(i, x, sY + sH + 13);
    }
    ctx.fillStyle = COLOR.textMuted; ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';   ctx.fillText('ácido',  padX,          sY - 7);
    ctx.textAlign = 'center'; ctx.fillText('neutro', padX + sW / 2, sY - 7);
    ctx.textAlign = 'right';  ctx.fillText('base',   padX + sW,     sY - 7);

    const mx = padX + (_ph / 14) * sW, pulse = 1 + 0.07 * Math.sin(t * 3);
    ctx.beginPath(); ctx.arc(mx, sY + sH / 2, 7 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = COLOR.bg; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = COLOR.bg; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(_ph.toFixed(1), mx, sY + sH / 2 + 3);

    const nearby = PH_EXAMPLES.filter(e => Math.abs(e.ph - _ph) < 2).slice(0, 3);
    let dotY = sY + sH + 28;
    nearby.forEach(ex => {
      const x = padX + (ex.ph / 14) * sW;
      ctx.beginPath(); ctx.arc(x, dotY, 4, 0, Math.PI * 2);
      ctx.fillStyle = phColor(ex.ph); ctx.fill();
      ctx.fillStyle = COLOR.textPrimary; ctx.font = '10px sans-serif';
      ctx.textAlign = x > W * 0.8 ? 'right' : x < W * 0.2 ? 'left' : 'center';
      ctx.fillText(ex.label, x, dotY + 14);
      dotY += 30;
    });

    ctx.fillStyle = COLOR.textMuted; ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`[H⁺] = ${Math.pow(10,-_ph).toExponential(2)} mol/L`, padX, H - 8);
    ctx.textAlign = 'right';
    ctx.fillText(`[OH⁻] = ${Math.pow(10,_ph-14).toExponential(2)} mol/L`, W - padX, H - 8);
  });
  _loop.start();
}

function updateDilution() {
  const c2 = (_dilC1 * _dilV1) / _dilV2;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('dil-c2', c2 < 0.001 ? c2.toExponential(3) : c2.toFixed(4));
  const factor = Math.min(_dilV1 / _dilV2, 1);
  const bar = document.getElementById('dil-bar');
  if (bar) bar.style.width = Math.round(factor * 200) + 'px';
  set('dil-factor', `Fator de diluição: 1 : ${(_dilV2 / _dilV1).toFixed(1)}`);
}

function updateBuffer() {
  const buf = BUFFERS[_bufIdx];
  const ph  = buf.pKa + Math.log10(_bufRatio);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('buf-ph',    ph.toFixed(2));
  set('buf-pka',   buf.pKa.toFixed(2));
  set('buf-range', `${(buf.pKa-1).toFixed(1)} – ${(buf.pKa+1).toFixed(1)}`);
  set('buf-ratio-label', `[${buf.base}]/[${buf.acid}] = ${_bufRatio.toFixed(2)}`);
}

const EXERCISES = [
  { q: 'Suco gástrico pH ≈ 1,5. [H⁺] ≈?', opts: ['3,2×10⁻² mol/L','0,15 mol/L','1,5 mol/L','3,2×10⁻⁵ mol/L'], ans: 0, exp: '[H⁺] = 10^(-1,5) ≈ 3,2×10⁻² mol/L.', hint: '[H⁺] = 10^(-pH).' },
  { q: 'Qual tem maior ponto de ebulição?', opts: ['Água pura','1 mol/kg NaCl','1 mol/kg glicose','2 mol/kg NaCl'], ans: 3, exp: 'ΔTb = Kb×m×i. 2 mol/kg NaCl: i≈2, partículas = 4 mol/kg. Maior.', hint: 'Propriedades coligativas dependem de i×m.' },
  { q: 'Pressão osmótica de 0,1 mol/L glicose a 25°C:', opts: ['2,45 atm','0,25 atm','24,5 atm','0,025 atm'], ans: 0, exp: 'π = iMRT = 1×0,1×0,08206×298 ≈ 2,45 atm.', hint: 'π = iMRT. Glicose: i=1.' },
  { q: 'Solubilidade do O₂ em água aumenta quando:', opts: ['T sobe','P(O₂) aumenta (Lei de Henry)','pH cai','NaCl é dissolvido'], ans: 1, exp: 'Lei de Henry: c = k_H×P. Maior P_parcial → maior solubilidade. Temperatura mais alta diminui solubilidade de gases.', hint: 'Para gases, temperatura e pressão têm efeitos opostos na solubilidade.' },
  { q: 'Difusão de água por membrana semipermeável da diluída para a concentrada é:', opts: ['Difusão ativa','Osmose','Diálise','Eletroforese'], ans: 1, exp: 'Osmose: movimento espontâneo do solvente pelo gradiente de potencial químico.', hint: 'Qual é o nome específico para difusão de solvente (não soluto) por membrana?' },,
  { q:'250 mL de HCl 0,4 mol/L são diluídos para 1 L. Qual a nova concentração?', opts:['0,1 mol/L','0,4 mol/L','1,6 mol/L','0,25 mol/L'], ans:0, exp:'C₁V₁ = C₂V₂. 0,4 × 0,25 = C₂ × 1,0. C₂ = 0,1 mol/L. Diluição conserva moles, não concentração.', hint:'C₁V₁ = C₂V₂. Moles de soluto se conservam.' },
  { q:'O pH de uma solução de HCl 0,001 mol/L é:', opts:['1','2','3','11'], ans:2, exp:'HCl é ácido forte: ionização completa. [H⁺] = 0,001 = 10⁻³ mol/L. pH = -log(10⁻³) = 3.', hint:'HCl forte: [H⁺] = [HCl]. pH = -log[H⁺].' },
  { q:'A pressão osmótica de 1 mol/L de glicose a 25°C (π = nRT/V, R=0,082) é:', opts:['2,05 atm','24,5 atm','0,082 atm','1,0 atm'], ans:1, exp:'π = cRT = 1 mol/L × 0,082 L·atm/(mol·K) × 298 K ≈ 24,4 atm. Isso explica por que células animais estouram em água pura (gradiente osmótico enorme).', hint:'π = cRT. c em mol/L, T em K, R = 0,082.' },
  { q:'A crioscopia: dissolver 1 mol de NaCl em 1 kg de água abaixa o ponto de congelamento em:', opts:['-1,86°C','-3,72°C','-0,93°C','-5,58°C'], ans:1, exp:'ΔTf = Kf × m × i. Kf(água)=1,86°C·kg/mol. NaCl se dissocia em 2 partículas (i=2). ΔTf = 1,86 × 1 × 2 = 3,72°C. O ponto de congelamento cai 3,72°C (antigelo).', hint:'NaCl → Na⁺ + Cl⁻: i=2. ΔTf = Kf × m × i.' },
  { q:'Qual equilíbrio descreve a autoionização da água?', opts:['H₂O → H⁺ + OH⁻ (irreversível)','2H₂O ⇌ H₃O⁺ + OH⁻ (Kw = 10⁻¹⁴ a 25°C)','H₂O + H₂O → H₂ + O₂','H₂O ⇌ H₂ + ½O₂'], ans:1, exp:'2H₂O ⇌ H₃O⁺ + OH⁻. Kw = [H₃O⁺][OH⁻] = 10⁻¹⁴ a 25°C. Em água pura: [H⁺] = [OH⁻] = 10⁻⁷ → pH = 7. Kw aumenta com temperatura.', hint:'Kw = [H⁺][OH⁻] = 10⁻¹⁴ a 25°C. Isso define pH neutro = 7.' },
  { q:'Um tampão tem HA (pKa=5,0) e A⁻ na razão [A⁻]/[HA]=10. Qual é o pH?', opts:['4,0','5,0','6,0','10,0'], ans:2, exp:'pH = pKa + log([A⁻]/[HA]) = 5,0 + log(10) = 5,0 + 1 = 6,0.', hint:'Henderson-Hasselbalch: pH = pKa + log([base]/[ácido]).' },
  { q:'A solubilidade do O₂ em água diminui ao aquecer porque:', opts:['O₂ reage com H₂O no calor','A dissolução de gases é exotérmica; aquecimento desloca equilíbrio para fora da solução','O₂ fica mais pesado','A viscosidade aumenta'], ans:1, exp:'Dissolução de gases: gás + H₂O ⇌ gás(aq) + calor (exotérmica). Pelo princípio de Le Chatelier, aumentar T desloca para a esquerda → gás sai da solução. Por isso peixes morrem em rios quentes (hipóxia).', hint:'Le Chatelier: calor é "produto" na dissolução exotérmica. Mais calor → desfaz dissolução.' },
  { q:'A Lei de Henry diz que a solubilidade de um gás é proporcional à sua pressão parcial. Se duplicar a pressão de CO₂ sobre refrigerante:', opts:['A solubilidade cai à metade','A solubilidade dobra','Não muda — a temperatura é o fator dominante','A solubilidade aumenta 4 vezes'], ans:1, exp:'Lei de Henry: S = kH × P. Se P dobra → S dobra. Por isso bebidas carbonatadas são seladas sob pressão de CO₂. Ao abrir (pressão cai), CO₂ escapa.', hint:'S = kH × P. Relação linear com a pressão parcial.' },
  { q:'A ebullioscopia (elevação do ponto de ebulição) é usada para determinar:', opts:['Concentração iônica','Massa molar de solutos não-voláteis (via ΔTb e m)','Pressão de vapor do solvente puro','Solubilidade do soluto'], ans:1, exp:'ΔTb = Kb × m. Se ΔTb e Kb são conhecidos, calcula-se m. Com a massa do soluto e o volume de solvente, determina-se a massa molar. Aplicação histórica em química orgânica para caracterizar novos compostos.', hint:'ΔTb = Kb × m. Com m em mol/kg e a massa do soluto, isola a massa molar.' },
  { q:'Qual afirmação sobre soluções tampão está ERRADA?', opts:['Resistem a variações de pH ao adicionar pequenas quantidades de ácido ou base','Funcionam melhor quando pH ≈ pKa ± 1','Têm capacidade tampão infinita — absorvem qualquer quantidade de ácido','O tampão H₂CO₃/HCO₃⁻ é essencial no controle do pH sanguíneo'], ans:2, exp:'Tampões têm capacidade tamponante finita — ao adicionar ácido ou base além de um limite, o pH varia bruscamente (todo o ácido fraco ou base conjugada é consumido). A capacidade é máxima quando [A⁻] = [HA] (pH = pKa).', hint:'O que acontece se adicionar excesso de ácido forte a um tampão? Eventualmente esgota a base conjugada.' }
];

let _exIdx     = 0;
export function render(outlet) {
  _ph = 7.0; if (_loop) { _loop.stop(); _loop = null; }
  _bufIdx = 1; _bufRatio = 1.0; _dilC1 = 1.0; _dilV1 = 100; _dilV2 = 500;
  _exAttempts = 0; _exDone = false;

  outlet.innerHTML = `
<div class="page module-page">
  <button class="module-back btn-ghost" data-nav="/modules">&larr; Módulos</button>
  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M9 3v11a3 3 0 006 0V3"/><path d="M6 3h12"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Soluções e pH</h1>
      <p class="module-subtitle">Dissolução, concentração, pH, diluição e tampões.</p>
    </div>
  </header>

  <section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">Bicarbonato e vinagre efervescem violentamente ao misturar. Antiácido neutraliza acidez gástrica em segundos. Tudo envolve ácidos, bases e pH — a escala que mede [H⁺] em solução.</p>
    <p class="module-text"><strong>pH = -log[H⁺]</strong>. Em água pura: [H⁺] = 10⁻⁷ → pH = 7. Cada unidade representa fator 10: pH 5 é 100× mais ácido que pH 7.</p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Escala de pH interativa</h2>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">pH:</label>
      <input type="range" id="ph-slider" min="0" max="14" step="0.1" value="7" style="width:200px;accent-color:var(--accent-electron)">
      <span id="ph-value" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron);min-width:36px">7,0</span>
    </div>
    <div class="canvas-frame"><canvas id="ph-canvas"></canvas></div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Ácidos e Bases — Brønsted-Lowry</h2>
    <p class="module-text">Ácido doa H⁺. Base aceita H⁺. Ácidos <strong>fortes</strong> ionizam 100%; ácidos <strong>fracos</strong> estabelecem equilíbrio descrito pelo Ka.</p>
    <div class="module-grid" style="grid-template-columns:1fr 1fr;margin-top:.75rem">
      <div class="info-card">
        <h3 style="color:var(--accent-reaction);margin-top:0">Ácido forte</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">HCl → H⁺ + Cl⁻<br>(100%)</p>
      </div>
      <div class="info-card">
        <h3 style="color:var(--accent-electron);margin-top:0">Ácido fraco</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">CH₃COOH ⇌ H⁺ + CH₃COO⁻<br>Ka = 1,8×10⁻⁵</p>
      </div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Calculadora de diluição — C₁V₁ = C₂V₂</h2>
    <p class="module-text">Ao diluir, os moles de soluto são conservados: C₁V₁ = C₂V₂. Ajuste os parâmetros abaixo.</p>
    <div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">C₁ — concentração inicial (mol/L):</label>
        <input type="range" id="dil-c1" min="0.01" max="10" step="0.01" value="1" style="width:140px;accent-color:var(--accent-electron)">
        <span id="dil-c1-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:70px">1,00 mol/L</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">V₁ — volume inicial (mL):</label>
        <input type="range" id="dil-v1" min="10" max="1000" step="10" value="100" style="width:140px;accent-color:var(--accent-bond)">
        <span id="dil-v1-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:70px">100 mL</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:180px;font-size:var(--text-sm);color:var(--text-secondary)">V₂ — volume final (mL):</label>
        <input type="range" id="dil-v2" min="100" max="5000" step="100" value="500" style="width:140px;accent-color:var(--accent-organic)">
        <span id="dil-v2-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:70px">500 mL</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
      <div id="dil-bar" style="height:14px;background:var(--accent-electron);border-radius:3px;transition:width .3s;width:40px;min-width:4px"></div>
      <span id="dil-factor" style="font-size:var(--text-sm);color:var(--text-secondary)"></span>
    </div>
    <div class="info-card" style="max-width:260px">
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">C₂ — concentração final</p>
      <span id="dil-c2" style="font-size:var(--text-2xl);font-weight:700;color:var(--accent-electron)">0,2000</span>
      <span style="font-size:var(--text-sm);color:var(--text-muted)"> mol/L</span>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Sistemas tampão — Henderson-Hasselbalch</h2>
    <p class="module-text">Um tampão resiste a variações de pH. É formado por um ácido fraco e sua base conjugada. O pH é calculado por:</p>
    <div class="info-card" style="background:var(--bg-raised);margin:.5rem 0 1rem;max-width:320px">
      <p style="font-family:monospace;font-size:var(--text-lg);color:var(--accent-electron);text-align:center;margin:0">pH = pKa + log([A⁻]/[HA])</p>
    </div>
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
      ${BUFFERS.map((b, i) => `<button class="btn btn-sm ${i===1?'btn-secondary':'btn-ghost'}" id="buf-btn-${i}" data-bufidx="${i}">${b.name}</button>`).join('')}
    </div>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">Razão [base]/[ácido]:</label>
      <input type="range" id="buf-ratio" min="0.01" max="100" step="0.01" value="1" style="width:160px;accent-color:var(--accent-electron)">
      <span id="buf-ratio-label" style="font-size:var(--text-sm);color:var(--text-secondary);min-width:160px"></span>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">pH resultante</p>
        <div id="buf-ph" style="font-size:var(--text-2xl);font-weight:700;color:var(--accent-electron)">7,35</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">pKa do par</p>
        <div id="buf-pka" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">6,35</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Faixa eficaz (pKa ± 1)</p>
        <div id="buf-range" style="font-size:var(--text-lg);font-weight:600;color:var(--text-secondary)">5,35 – 7,35</div>
      </div>
    </div>
    <p id="buf-use" style="margin-top:.75rem;font-size:var(--text-sm);color:var(--text-secondary)">${BUFFERS[1].use}</p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/5)</h2>
    <p class="module-text">${EXERCISES[0].q}</p>
    <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">
      ${EXERCISES[0].opts.map((opt, i) => `<button class="btn btn-ghost" style="text-align:left;justify-content:flex-start" id="ex-opt-${i}" data-exopt="${i}">${opt}</button>`).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next" style="margin-top:1rem;display:none">Próximo exercício &#8594;</button>
  </section>

  <!-- Titulação ácido-base: pH no ponto de equivalência -->
  <section class="module-section">
    <h2 class="module-section-title">Titulação ácido-base — ponto de equivalência</h2>
    <p class="module-text">
      No <strong>ponto de equivalência (PE)</strong>, moles de ácido = moles de base
      (n_ácido = n_base). O pH no PE depende do tipo de titulação: forte-forte → pH = 7;
      fraco-forte → pH > 7 (sal básico); forte-fraco → pH &lt; 7 (sal ácido).
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        n_ácido = C_ácido × V_ácido &nbsp;|&nbsp; n_base = C_base × V_base
      </p>
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-bond);margin-bottom:.3rem">
        V_equiv = (C_ácido × V_ácido) / C_base
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        No PE de ácido fraco (Ka) titulado com NaOH → [sal] = n / V_total.<br>
        Ânion A⁻ hidrolisa: A⁻ + H₂O ⇌ HA + OH⁻ (Kh = Kw/Ka)<br>
        pH_PE = 7 + ½(pKa + log C_sal) &nbsp;—&nbsp; fórmula aproximada válida quando Kh &lt;&lt; C
      </p>
    </div>

    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">Tipo de titulação:</span>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap" id="tit-type-btns">
          <button class="btn btn-xs btn-secondary" data-tittype="sfb">Forte–Forte</button>
          <button class="btn btn-xs btn-ghost"     data-tittype="wfb">Fraco–Forte (HA + NaOH)</button>
          <button class="btn btn-xs btn-ghost"     data-tittype="fsb">Forte–Fraco (HCl + NH₃)</button>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">C ácido (mol/L):</span>
        <input type="range" id="tit-Ca" min="0.01" max="2" step="0.01" value="0.1"
               style="width:120px;accent-color:var(--accent-electron)">
        <span id="tit-Ca-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:70px">0,100 M</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">V ácido (mL):</span>
        <input type="range" id="tit-Va" min="1" max="100" step="1" value="25"
               style="width:120px;accent-color:var(--accent-bond)">
        <span id="tit-Va-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:60px">25,0 mL</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">C base (mol/L):</span>
        <input type="range" id="tit-Cb" min="0.01" max="2" step="0.01" value="0.1"
               style="width:120px;accent-color:var(--accent-organic)">
        <span id="tit-Cb-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:70px">0,100 M</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap" id="tit-pka-row">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:200px">pKa do ácido fraco:</span>
        <input type="range" id="tit-pKa" min="2" max="12" step="0.05" value="4.74"
               style="width:120px;accent-color:var(--accent-reaction)">
        <span id="tit-pKa-val" style="font-size:var(--text-sm);color:var(--accent-reaction);min-width:60px">4,74</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">V equivalente (mL)</p>
        <div id="tit-Veq" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">pH no PE</p>
        <div id="tit-pH-PE" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">n_ácido = n_base</p>
        <div id="tit-n" style="font-size:var(--text-base);font-weight:600;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Indicador adequado</p>
        <div id="tit-indicator" style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary)">—</div>
      </div>
    </div>
    <p id="tit-explanation" style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:var(--space-4)"></p>
    <!-- Curva de titulação canvas -->
    <div class="canvas-frame" id="titcurve-frame" style="min-height:200px;margin-top:var(--space-4)">
      <canvas id="titcurve-canvas" aria-label="Curva de titulação pH × volume"></canvas>
    </div>
  </section>

    <!-- Equilíbrio iônico formal -->
  <section class="module-section">
    <h2 class="module-section-title">Equilíbrio iônico — cálculo formal</h2>
    <p class="module-text">
      Para ácidos fracos, a aproximação [H⁺] ≈ √(Ka·C) só é válida quando C/Ka ≥ 100.
      Em concentrações baixas ou Ka alto, é necessário resolver a quadrática exata.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.4rem">
        HA ⇌ H⁺ + A⁻ &nbsp;|&nbsp; Ka = x² / (C - x)
      </p>
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-bond);margin-bottom:.4rem">
        x = [H⁺] = (-Ka + √(Ka² + 4·Ka·C)) / 2
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        A aproximação x &lt;&lt; C é válida apenas se grau de ionização &lt; 5%.
        Abaixo: calculadora que usa a quadrática exata.
      </p>
    </div>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">pKa do ácido:</span>
        <input type="range" id="weak-pka" min="1" max="14" step="0.1" value="4.74"
               style="width:120px;accent-color:var(--accent-electron)">
        <span id="weak-pka-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:70px">4,74 (AcOH)</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">Concentração C (mol/L):</span>
        <input type="range" id="weak-c" min="-4" max="1" step="0.1" value="-1"
               style="width:120px;accent-color:var(--accent-bond)">
        <span id="weak-c-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:80px">0,100 mol/L</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">pH (exato)</p>
        <div id="weak-ph" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">pH (aprox. √)</p>
        <div id="weak-ph-approx" style="font-size:var(--text-lg);font-weight:600;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">α (ionização)</p>
        <div id="weak-alpha" style="font-size:var(--text-lg);font-weight:600;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Aprox. válida?</p>
        <div id="weak-valid" style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary)">—</div>
      </div>
    </div>

    <!-- Hidrólise de sais -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:var(--space-6);margin-bottom:var(--space-3)">
      Hidrólise de sais
    </h3>
    <p class="module-text">
      Um sal de ácido fraco + base forte tem ânion básico (A⁻ + H₂O ⇌ HA + OH⁻ → pH &gt; 7).
      Um sal de base fraca + ácido forte tem cátion ácido (BH⁺ ⇌ B + H⁺ → pH &lt; 7).
      Relação: Kh = Kw / Ka (para ânion) ou Kw / Kb (para cátion).
    </p>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Sal</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Ácido/Base formadores</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">pH da solução</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Equilíbrio de hidrólise</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;font-weight:600;color:var(--accent-electron)">NaCl</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">HCl (forte) + NaOH (forte)</td>
            <td style="padding:.4rem .6rem;color:var(--accent-organic)">= 7 (neutro)</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">Sem hidrólise</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;font-weight:600;color:var(--accent-bond)">CH₃COONa</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">AcOH (fraco, pKa=4,74) + NaOH</td>
            <td style="padding:.4rem .6rem;color:var(--accent-bond)">&gt; 7 (básico)</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-secondary)">AcO⁻ + H₂O ⇌ AcOH + OH⁻ (Kh = Kw/Ka)</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;font-weight:600;color:var(--accent-reaction)">NH₄Cl</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">HCl (forte) + NH₃ (fraca, pKb=4,74)</td>
            <td style="padding:.4rem .6rem;color:var(--accent-reaction)">&lt; 7 (ácido)</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-secondary)">NH₄⁺ ⇌ NH₃ + H⁺ (Ka = Kw/Kb)</td>
          </tr>
          <tr>
            <td style="padding:.4rem .6rem;font-family:monospace;font-weight:600;color:var(--text-muted)">CH₃COONH₄</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">AcOH + NH₃ (ambos fracos, pKa≈pKb)</td>
            <td style="padding:.4rem .6rem;color:var(--accent-organic)">≈ 7 (neutro)</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">pH ≈ 7 + ½(pKa - pKb). Ambos hidrolisam.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

    <!-- Indicadores ácido-base -->
  <section class="module-section">
    <h2 class="module-section-title">Indicadores ácido-base</h2>
    <p class="module-text">
      Um indicador ácido-base é ele próprio um ácido ou base fraca (HIn) cuja forma ácida
      (HIn) e básica (In⁻) têm cores diferentes. A transição de cor ocorre na faixa
      pH = pKa_In ± 1. Por isso, a escolha do indicador deve ser compatível com o
      salto de pH da titulação.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        [In⁻] / [HIn] = 10^(pH - pKa_In)
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        pH &lt; pKa-1 → cor ácida (HIn domina). pH &gt; pKa+1 → cor básica (In⁻ domina).<br>
        Zona de transição: ambas as formas coexistem → cor mista.
      </p>
    </div>
    <div style="overflow-x:auto;margin-bottom:var(--space-4)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Indicador</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Faixa pH</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Cor ácida</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Cor básica</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Uso típico</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['Azul de timol (1ª)',   '1,2–2,8', 'vermelho',   'amarelo',  'Ácidos muito fortes'],
            ['Vermelho de metila',   '4,4–6,2', 'vermelho',   'amarelo',  'Titulação ácido forte–base'],
            ['Azul de bromotimol',   '6,0–7,6', 'amarelo',    'azul',     'Próximo à neutralidade'],
            ['Fenolftaleína',        '8,2–10',  'incolor',    'rosa',     'Clássico HCl–NaOH (salto 4–10)'],
            ['Azul de timol (2ª)',   '8,0–9,6', 'amarelo',    'azul',     'Bases fracas'],
            ['Alizarina amarela',    '10–12',   'amarelo',    'laranja',  'Bases fortes'],
          ].map(([name,range,acid,base,use]) => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-weight:600;color:var(--accent-electron)">${name}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-bond)">${range}</td>
            <td style="padding:.4rem .6rem;color:var(--accent-reaction)">${acid}</td>
            <td style="padding:.4rem .6rem;color:var(--accent-organic)">${base}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${use}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- Simulador de cor do indicador -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Simulador de cor — fração de In⁻
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">pH da solução:</span>
        <input type="range" id="ind-pH" min="0" max="14" step="0.1" value="7.0"
               style="width:140px;accent-color:var(--accent-electron)">
        <span id="ind-pH-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:50px">7,0</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">pKa do indicador:</span>
        <input type="range" id="ind-pKa" min="1" max="13" step="0.1" value="9.0"
               style="width:140px;accent-color:var(--accent-bond)">
        <span id="ind-pKa-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:50px">9,0</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">[In⁻]/[HIn]</p>
        <div id="ind-ratio" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">% forma básica</p>
        <div id="ind-pct" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Cor observada</p>
        <div id="ind-color" style="font-size:var(--text-sm);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
    </div>
  </section>

  <!-- Especiação de ácidos polipróticos -->
  <section class="module-section">
    <h2 class="module-section-title">Especiação de ácidos polipróticos — α(pH)</h2>
    <p class="module-text">
      Para ácidos diprotóticos H₂A, existem três espécies: H₂A, HA⁻ e A²⁻.
      As frações de cada espécie (α₀, α₁, α₂) dependem do pH e das constantes Ka₁ e Ka₂.
      O gráfico de especiação é ferramenta central em química analítica e ambiental.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-xs);color:var(--accent-electron);margin-bottom:.3rem;line-height:1.8">
        D = [H⁺]² + Ka₁[H⁺] + Ka₁Ka₂<br>
        α₀ = [H⁺]²/D &nbsp;&nbsp;|&nbsp;&nbsp; α₁ = Ka₁[H⁺]/D &nbsp;&nbsp;|&nbsp;&nbsp; α₂ = Ka₁Ka₂/D
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Ácido carbônico: pKa₁ = 6,35; pKa₂ = 10,33 (H₂CO₃/HCO₃⁻/CO₃²⁻ — equilíbrio do oceano).<br>
        Ácido fosfórico: pKa₁ = 2,15; pKa₂ = 7,20; pKa₃ = 12,35 (tampão fisiológico HPO₄²⁻/H₂PO₄⁻).
      </p>
    </div>

    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;gap:.4rem;flex-wrap:wrap" id="polyprot-presets">
        <button class="btn btn-xs btn-secondary" data-preset="carbonic">H₂CO₃</button>
        <button class="btn btn-xs btn-ghost" data-preset="phosphoric">H₃PO₄</button>
        <button class="btn btn-xs btn-ghost" data-preset="oxalic">H₂C₂O₄</button>
        <button class="btn btn-xs btn-ghost" data-preset="custom">Custom</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:.5rem;margin-top:.5rem">
        <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
          <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:130px">pKa₁:</span>
          <input type="range" id="pp-pka1" min="0" max="14" step="0.05" value="6.35"
                 style="width:120px;accent-color:var(--accent-electron)">
          <span id="pp-pka1-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:40px">6,35</span>
        </div>
        <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
          <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:130px">pKa₂:</span>
          <input type="range" id="pp-pka2" min="0" max="14" step="0.05" value="10.33"
                 style="width:120px;accent-color:var(--accent-bond)">
          <span id="pp-pka2-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:40px">10,33</span>
        </div>
        <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
          <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:130px">pH atual:</span>
          <input type="range" id="pp-pH" min="0" max="14" step="0.1" value="7.0"
                 style="width:120px;accent-color:var(--accent-organic)">
          <span id="pp-pH-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:40px">7,0</span>
        </div>
      </div>
    </div>
    <div class="canvas-frame" id="pp-frame" style="min-height:160px">
      <canvas id="pp-canvas" aria-label="Diagrama de especiação"></canvas>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(3,1fr);margin-top:var(--space-3)">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">α₀ (H₂A)</p>
        <div id="pp-a0" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-reaction)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">α₁ (HA⁻)</p>
        <div id="pp-a1" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">α₂ (A²⁻)</p>
        <div id="pp-a2" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
    </div>
  </section>

    <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">O sangue humano é mantido a pH 7,35–7,45 pelo sistema H₂CO₃/HCO₃⁻. Piscinas requerem pH 7,2–7,6 para eficácia do cloro. Solos ácidos são corrigidos com calcário. Laboratórios farmacêuticos calculam diluições seriadas para padronizar soluções de referência.</p>
  </div>
</div>
`;

  const canvas = document.getElementById('ph-canvas');
  if (canvas) startCanvas(canvas);
  updateDilution();
  updateBuffer();

  document.getElementById('ph-slider')?.addEventListener('input', e => {
    _ph = parseFloat(e.target.value);
    const v = document.getElementById('ph-value');
    if (v) v.textContent = _ph.toFixed(1).replace('.', ',');
  });
  document.getElementById('dil-c1')?.addEventListener('input', e => {
    _dilC1 = parseFloat(e.target.value);
    const v = document.getElementById('dil-c1-val');
    if (v) v.textContent = _dilC1.toFixed(2).replace('.', ',') + ' mol/L';
    updateDilution();
  });
  document.getElementById('dil-v1')?.addEventListener('input', e => {
    _dilV1 = parseInt(e.target.value, 10);
    const v = document.getElementById('dil-v1-val');
    if (v) v.textContent = _dilV1 + ' mL';
    updateDilution();
  });
  document.getElementById('dil-v2')?.addEventListener('input', e => {
    _dilV2 = parseInt(e.target.value, 10);
    const v = document.getElementById('dil-v2-val');
    if (v) v.textContent = _dilV2 + ' mL';
    updateDilution();
  });
  BUFFERS.forEach((_, i) => {
    document.getElementById(`buf-btn-${i}`)?.addEventListener('click', () => {
      _bufIdx = i; _bufRatio = 1.0;
      const rs = document.getElementById('buf-ratio'); if (rs) rs.value = '1';
      BUFFERS.forEach((_, j) => {
        const btn = document.getElementById(`buf-btn-${j}`);
        if (btn) btn.className = `btn btn-sm ${j===i?'btn-secondary':'btn-ghost'}`;
      });
      const useEl = document.getElementById('buf-use');
      if (useEl) useEl.textContent = BUFFERS[i].use;
      updateBuffer();
    });
  });
  document.getElementById('buf-ratio')?.addEventListener('input', e => {
    _bufRatio = parseFloat(e.target.value);
    updateBuffer();
  });
  document.querySelectorAll('[data-exopt]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_exDone) return;
      _exAttempts++;
      const choice = parseInt(btn.dataset.exopt, 10);
      const fb = document.getElementById('exercise-feedback');
      if (choice === EXERCISE.correct) {
        _exDone = true;
        btn.style.borderColor = 'var(--accent-organic)'; btn.style.color = 'var(--accent-organic)';
        if (fb) fb.innerHTML = `<p class="feedback-correct">Correto! ${EXERCISE.explanation}</p>`;
        markSectionDone('solutions', 'exercise');
      } else {
        btn.style.borderColor = 'var(--accent-reaction)'; btn.style.color = 'var(--accent-reaction)';
        if (fb && _exAttempts === 1) fb.innerHTML = `<p class="feedback-hint">Dica: [H⁺] = 10⁻ᵖᴴ. Substitua pH = 1,5.</p>`;
      }
    });
  });
  _initWeakAcid();
  _initIndicator();
  _initPolyprotic();
  _initTitration();
}

function _initWeakAcid() {
  function updateWeak() {
    const pKa = parseFloat(document.getElementById('weak-pka')?.value ?? 4.74);
    const exp = parseFloat(document.getElementById('weak-c')?.value ?? -1);
    const C   = Math.pow(10, exp);
    const Ka  = Math.pow(10, -pKa);

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('weak-pka-val', pKa.toFixed(2));
    set('weak-c-val',   C.toExponential(2) + ' mol/L');

    // Exact quadratic: x² + Ka*x - Ka*C = 0
    const x_exact = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2;
    const ph_exact = -Math.log10(x_exact);
    const alpha    = x_exact / C;

    // Approximation: x ≈ sqrt(Ka * C)
    const x_approx = Math.sqrt(Ka * C);
    const ph_approx = -Math.log10(x_approx);

    set('weak-ph',       ph_exact.toFixed(3));
    set('weak-ph-approx', ph_approx.toFixed(3));
    set('weak-alpha',    (alpha * 100).toFixed(2) + ' %');
    set('weak-valid',    alpha < 0.05 ? 'Sim (α < 5%)' : 'Não (α = ' + (alpha*100).toFixed(0) + '%)');
  }
  if (document.getElementById('weak-pka')) {
    updateWeak();
    ['weak-pka', 'weak-c'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updateWeak));
  }
}

function _initIndicator() {
  function updateInd() {
    const pH  = parseFloat(document.getElementById('ind-pH')?.value  ?? 7.0);
    const pKa = parseFloat(document.getElementById('ind-pKa')?.value ?? 9.0);
    const ratio = Math.pow(10, pH - pKa);
    const pct   = ratio / (1 + ratio) * 100;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('ind-pH-val',  pH.toFixed(1));
    set('ind-pKa-val', pKa.toFixed(1));
    set('ind-ratio',   ratio < 0.001 ? ratio.toExponential(2) : ratio.toFixed(3));
    set('ind-pct',     pct.toFixed(1) + ' %');

    const colorEl = document.getElementById('ind-color');
    if (colorEl) {
      if (pct < 10)       { colorEl.textContent = 'Cor ácida (HIn)';  colorEl.style.color = 'var(--accent-reaction)'; }
      else if (pct > 90)  { colorEl.textContent = 'Cor básica (In⁻)'; colorEl.style.color = 'var(--accent-organic)'; }
      else                { colorEl.textContent = 'Zona de transição'; colorEl.style.color = 'var(--accent-bond)'; }
    }
  }
  if (document.getElementById('ind-pH')) {
    updateInd();
    ['ind-pH','ind-pKa'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updateInd));
  }
}

function _initPolyprotic() {
  const PRESETS = {
    carbonic:   { pka1: 6.35,  pka2: 10.33, label: 'H₂CO₃' },
    phosphoric: { pka1: 2.15,  pka2: 7.20,  label: 'H₃PO₄ (pKa₁/pKa₂)' },
    oxalic:     { pka1: 1.25,  pka2: 4.27,  label: 'H₂C₂O₄' },
    custom:     { pka1: 4.00,  pka2: 9.00,  label: 'Custom' },
  };

  function alphas(pH, pka1, pka2) {
    const h   = Math.pow(10, -pH);
    const Ka1 = Math.pow(10, -pka1);
    const Ka2 = Math.pow(10, -pka2);
    const D   = h * h + Ka1 * h + Ka1 * Ka2;
    return { a0: h * h / D, a1: Ka1 * h / D, a2: Ka1 * Ka2 / D };
  }

  function drawSpeciation(ctx, W, H, pka1, pka2, pHcur) {
    const { clearCanvas, COLOR } = { clearCanvas: (c,w,h)=>{ c.clearRect(0,0,w,h); c.fillStyle='#161b22'; c.fillRect(0,0,w,h); }, COLOR: {textMuted:'rgba(200,200,200,0.5)'} };
    clearCanvas(ctx, W, H);
    const MX = 35, MY = 10, PW = W - MX - 10, PH = H - MY - 25;

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(MX, MY); ctx.lineTo(MX, MY + PH); ctx.lineTo(MX + PW, MY + PH); ctx.stroke();

    // Grid x
    ctx.fillStyle = 'rgba(200,200,200,0.45)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
    for (let pH = 0; pH <= 14; pH += 2) {
      const x = MX + pH / 14 * PW;
      ctx.fillText(pH, x, MY + PH + 14);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, MY); ctx.lineTo(x, MY + PH); ctx.stroke();
    }
    ctx.fillText('pH', MX + PW / 2, H - 2);

    ctx.save(); ctx.translate(12, MY + PH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('α', 0, 0); ctx.restore();

    // Curves
    const colors = ['#ef476f', '#4fc3f7', '#6bcb77'];
    const labels = ['α₀ H₂A', 'α₁ HA⁻', 'α₂ A²⁻'];
    [0,1,2].forEach(si => {
      ctx.beginPath(); ctx.strokeStyle = colors[si]; ctx.lineWidth = 1.5;
      for (let i = 0; i <= PW; i++) {
        const pH = i / PW * 14;
        const a  = alphas(pH, pka1, pka2);
        const av = [a.a0, a.a1, a.a2][si];
        const x  = MX + i;
        const y  = MY + PH - av * PH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Legend
      const legendX = MX + PW - 60;
      ctx.fillStyle = colors[si]; ctx.font = '8px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(labels[si], legendX, MY + 10 + si * 11);
    });

    // pKa markers
    [pka1, pka2].forEach((pk, i) => {
      const x = MX + pk / 14 * PW;
      ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([2,3]);
      ctx.beginPath(); ctx.moveTo(x, MY); ctx.lineTo(x, MY + PH); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,209,102,0.7)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('pKa' + (i+1), x, MY + 6);
    });

    // Current pH marker
    const cx = MX + pHcur / 14 * PW;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, MY); ctx.lineTo(cx, MY + PH); ctx.stroke();
  }

  let _pka1 = 6.35, _pka2 = 10.33, _ppPH = 7.0;
  let _canvas = null, _ctx = null;

  function initCanvas() {
    _canvas = document.getElementById('pp-canvas');
    const frame  = document.getElementById('pp-frame');
    if (!_canvas || !frame) return;
    const W = Math.min(frame.clientWidth || 560, 560);
    const H = 160;
    const dpr = window.devicePixelRatio || 1;
    _canvas.width  = Math.round(W * dpr);
    _canvas.height = Math.round(H * dpr);
    _canvas.style.width  = W + 'px';
    _canvas.style.height = H + 'px';
    _ctx = _canvas.getContext('2d');
    _ctx.scale(dpr, dpr);
    redraw();
  }

  function redraw() {
    if (!_ctx || !_canvas) return;
    const W = parseInt(_canvas.style.width, 10);
    const H = parseInt(_canvas.style.height, 10);
    drawSpeciation(_ctx, W, H, _pka1, _pka2, _ppPH);

    const a = alphas(_ppPH, _pka1, _pka2);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('pp-a0', (a.a0 * 100).toFixed(2) + '%');
    set('pp-a1', (a.a1 * 100).toFixed(2) + '%');
    set('pp-a2', (a.a2 * 100).toFixed(2) + '%');
  }

  function applyPreset(key) {
    const p = PRESETS[key] || PRESETS.carbonic;
    _pka1 = p.pka1; _pka2 = p.pka2;
    const s1 = document.getElementById('pp-pka1'); if (s1) s1.value = _pka1;
    const s2 = document.getElementById('pp-pka2'); if (s2) s2.value = _pka2;
    document.getElementById('pp-pka1-val').textContent = _pka1.toFixed(2);
    document.getElementById('pp-pka2-val').textContent = _pka2.toFixed(2);
    document.querySelectorAll('#polyprot-presets [data-preset]').forEach(b => {
      b.className = 'btn btn-xs ' + (b.dataset.preset === key ? 'btn-secondary' : 'btn-ghost');
    });
    redraw();
  }

  if (!document.getElementById('pp-canvas')) return;
  initCanvas();

  document.getElementById('pp-pka1')?.addEventListener('input', e => {
    _pka1 = parseFloat(e.target.value);
    document.getElementById('pp-pka1-val').textContent = _pka1.toFixed(2);
    redraw();
  });
  document.getElementById('pp-pka2')?.addEventListener('input', e => {
    _pka2 = parseFloat(e.target.value);
    document.getElementById('pp-pka2-val').textContent = _pka2.toFixed(2);
    redraw();
  });
  document.getElementById('pp-pH')?.addEventListener('input', e => {
    _ppPH = parseFloat(e.target.value);
    document.getElementById('pp-pH-val').textContent = _ppPH.toFixed(1);
    redraw();
  });
  document.querySelectorAll('#polyprot-presets [data-preset]').forEach(btn =>
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset)));
}

function _initTitration() {
  const Kw = 1e-14;
  let _titType = 'sfb';

  function updateTit() {
    const Ca  = parseFloat(document.getElementById('tit-Ca')?.value  ?? 0.1);
    const Va  = parseFloat(document.getElementById('tit-Va')?.value  ?? 25) / 1000; // L
    const Cb  = parseFloat(document.getElementById('tit-Cb')?.value  ?? 0.1);
    const pKa = parseFloat(document.getElementById('tit-pKa')?.value ?? 4.74);
    const Ka  = Math.pow(10, -pKa);
    const Kb  = _titType === 'fsb' ? Math.pow(10, -4.74) : Ka; // NH₃ pKb≈4.74

    const set  = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('tit-Ca-val',  Ca.toFixed(3) + ' M');
    set('tit-Va-val',  (Va * 1000).toFixed(1) + ' mL');
    set('tit-Cb-val',  Cb.toFixed(3) + ' M');
    set('tit-pKa-val', pKa.toFixed(2));

    const na    = Ca * Va;
    const Veq   = na / Cb;             // L
    const Vtotal = Va + Veq;

    set('tit-Veq', (Veq * 1000).toFixed(2) + ' mL');
    set('tit-n',   (na * 1000).toFixed(3) + ' mmol');

    let pH_PE, explanation, indicator;

    if (_titType === 'sfb') {
      // Forte + forte → sal neutro → pH = 7
      pH_PE = 7.0;
      explanation = 'Ácido forte + base forte: o sal formado (ex: NaCl) não hidrolisa. pH = 7,00 exatamente a 25°C.';
      indicator = 'Qualquer (salto 4–10); fenolftaleína ou azul de bromotimol';
    } else if (_titType === 'wfb') {
      // Ácido fraco HA + NaOH forte → sal A⁻Na⁺ (básico)
      // [A⁻] = na / Vtotal; hidrólise: Kh = Kw/Ka
      const Csal = na / Vtotal;
      const Kh   = Kw / Ka;
      // [OH⁻] = sqrt(Kh * Csal) → approx
      const OH   = Math.sqrt(Kh * Csal);
      const pOH  = -Math.log10(OH);
      pH_PE = 14 - pOH;
      explanation = `Ácido fraco (pKa=${pKa.toFixed(2)}) + base forte. O ânion A⁻ hidrolisa (Kh = Kw/Ka = ${Kh.toExponential(2)}). [sal] = ${Csal.toFixed(4)} mol/L. pH = ${pH_PE.toFixed(2)} > 7 (básico). Usar fenolftaleína (faixa 8–10).`;
      indicator = 'Fenolftaleína (pH 8–10)';
    } else {
      // HCl forte + base fraca (NH₃) → NH₄Cl (ácido)
      const pKbBase = pKa; // slider pKa usado como pKb da base
      const KaConj  = Kw / Math.pow(10, -pKbBase); // Ka de BH⁺
      const Csal    = na / Vtotal;
      const H       = Math.sqrt(KaConj * Csal);
      pH_PE = -Math.log10(H);
      explanation = `Ácido forte + base fraca (pKb=${pKbBase.toFixed(2)}). O cátion BH⁺ hidrolisa como ácido fraco. pH = ${pH_PE.toFixed(2)} < 7 (ácido). Usar vermelho de metila ou azul de bromotimol.`;
      indicator = 'Vermelho de metila (pH 4–6) ou azul de bromotimol';
    }

    set('tit-pH-PE', pH_PE.toFixed(2));
    set('tit-indicator', indicator);

    const expEl = document.getElementById('tit-explanation');
    if (expEl) expEl.textContent = explanation;
    _updateTitrationCurve(_titType, Ca, Va * 1000, Cb, pKa);
  }

  if (!document.getElementById('tit-Ca')) return;

  // Mostrar/esconder pKa row
  function togglePKaRow() {
    const row = document.getElementById('tit-pka-row');
    if (row) row.style.display = _titType === 'sfb' ? 'none' : 'flex';
  }

  document.querySelectorAll('#tit-type-btns [data-tittype]').forEach(btn => {
    btn.addEventListener('click', () => {
      _titType = btn.dataset.tittype;
      document.querySelectorAll('#tit-type-btns [data-tittype]').forEach(b => {
        b.className = 'btn btn-xs ' + (b.dataset.tittype === _titType ? 'btn-secondary' : 'btn-ghost');
      });
      togglePKaRow();
      updateTit();
    });
  });

  ['tit-Ca','tit-Va','tit-Cb','tit-pKa'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', updateTit));

  togglePKaRow();
  updateTit();
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
          markSectionDone('solutions', 'exercise');
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
// Curva de titulação — canvas pH × V (mL de base adicionados)
// ---------------------------------------------------------------------------
function _drawTitrationCurve(canvas, titType, Ca, Va, Cb, pKa) {
  const frame = canvas.parentElement;
  if (!frame) return;
  const W   = Math.min(frame.clientWidth || 520, 520);
  const H   = 200;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }
  const ctx = canvas.getContext('2d');
  const Kw  = 1e-14;
  const Ka  = Math.pow(10, -pKa);
  const na  = Ca * Va / 1000;          // mol (Va em mL)
  const Veq = na / Cb * 1000;          // mL

  const MX = 42, MY = 12, PW = W - MX - 12, PH = H - MY - 28;
  const V_MAX = Veq * 1.6;

  // calcular pH para cada ponto de volume de base adicionado (Vb em mL)
  function calcPH(Vb_mL) {
    const Vb = Vb_mL / 1000;
    const Vtotal = Va / 1000 + Vb;
    const nb = Cb * Vb;

    if (titType === 'sfb') {
      // Ácido forte + base forte
      if (Vb_mL < Veq - 0.001) {
        const Cexcess = (na - nb) / Vtotal;
        return -Math.log10(Cexcess);
      } else if (Math.abs(Vb_mL - Veq) < 0.001) {
        return 7.0;
      } else {
        const Cexcess = (nb - na) / Vtotal;
        return 14 + Math.log10(Cexcess);
      }
    } else if (titType === 'wfb') {
      // Ácido fraco + base forte
      if (Vb_mL < 0.001) {
        // Apenas ácido fraco
        const H = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * (na / Vtotal))) / 2;
        return H > 0 ? -Math.log10(H) : 7;
      } else if (Vb_mL < Veq - 0.05) {
        // Região tampão: Henderson-Hasselbalch
        const nHA = na - nb;
        const nA  = nb;
        if (nHA > 0 && nA > 0) return pKa + Math.log10(nA / nHA);
        return pKa;
      } else if (Math.abs(Vb_mL - Veq) < 0.1) {
        // Ponto de equivalência: sal básico
        const Csal = na / Vtotal;
        const Kh   = Kw / Ka;
        const OH   = Math.sqrt(Kh * Csal);
        return 14 + Math.log10(OH);
      } else {
        // Excesso de base forte
        const Cexcess = (nb - na) / Vtotal;
        return 14 + Math.log10(Cexcess);
      }
    } else {
      // Ácido forte + base fraca (invertido: Cb de ácido forte na bureta)
      const Kb  = Math.pow(10, -pKa);
      const KaC = Kw / Kb;
      if (Vb_mL < 0.001) {
        return -Math.log10(Math.sqrt(KaC * (Ca * Va / 1000) / (Va / 1000)));
      } else if (Vb_mL < Veq - 0.05) {
        const nB   = na - nb;
        const nBH  = nb;
        if (nB > 0 && nBH > 0) {
          const pH_B = 14 - pKa + Math.log10(nBH / nB);
          return pH_B;
        }
        return 14 - pKa;
      } else if (Math.abs(Vb_mL - Veq) < 0.1) {
        const Csal = na / Vtotal;
        const H    = Math.sqrt(KaC * Csal);
        return H > 0 ? -Math.log10(H) : 7;
      } else {
        const Cexcess = (nb - na) / Vtotal;
        return -Math.log10(Cexcess);
      }
    }
  }

  // Gerar pontos
  const N_PTS = 200;
  const pts = [];
  for (let i = 0; i <= N_PTS; i++) {
    const Vb = (i / N_PTS) * V_MAX;
    const pH = Math.max(0, Math.min(14, calcPH(Vb)));
    const x = MX + (Vb / V_MAX) * PW;
    const y = MY + PH - (pH / 14) * PH;
    pts.push({ x, y, pH, Vb });
  }

  // Fundo
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  // Grade
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let ph = 0; ph <= 14; ph += 2) {
    const y = MY + PH - (ph / 14) * PH;
    ctx.beginPath(); ctx.moveTo(MX, y); ctx.lineTo(MX + PW, y); ctx.stroke();
  }

  // Eixos
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MX, MY); ctx.lineTo(MX, MY + PH);
  ctx.lineTo(MX + PW, MY + PH); ctx.stroke();

  // Tick Y — pH
  ctx.fillStyle = 'rgba(200,200,200,0.6)';
  ctx.font = '8px monospace';
  ctx.textAlign = 'right';
  [0, 2, 4, 6, 7, 8, 10, 12, 14].forEach(ph => {
    const y = MY + PH - (ph / 14) * PH;
    ctx.fillText(ph, MX - 3, y + 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.moveTo(MX, y); ctx.lineTo(MX + PW, y); ctx.stroke();
  });

  // Tick X — volume
  ctx.fillStyle = 'rgba(200,200,200,0.6)';
  ctx.textAlign = 'center';
  const nTicks = 5;
  for (let i = 0; i <= nTicks; i++) {
    const Vb = (i / nTicks) * V_MAX;
    const x = MX + (Vb / V_MAX) * PW;
    ctx.fillText(Vb.toFixed(1), x, MY + PH + 12);
  }

  // Labels dos eixos
  ctx.fillStyle = 'rgba(200,200,200,0.4)';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('V base (mL)', MX + PW / 2, H - 4);
  ctx.save();
  ctx.translate(9, MY + PH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('pH', 0, 0);
  ctx.restore();

  // Linha pH=7
  ctx.strokeStyle = 'rgba(100,200,100,0.2)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const y7 = MY + PH - (7 / 14) * PH;
  ctx.moveTo(MX, y7); ctx.lineTo(MX + PW, y7);
  ctx.stroke();
  ctx.setLineDash([]);

  // Linha de equivalência (vertical)
  const xEq = MX + (Veq / V_MAX) * PW;
  ctx.strokeStyle = 'rgba(255,209,102,0.4)';
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(xEq, MY); ctx.lineTo(xEq, MY + PH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffd166';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PE', xEq, MY - 2);

  // Curva com gradiente de cor (ácido → neutro → básico)
  for (let i = 1; i < pts.length; i++) {
    const pH = pts[i].pH;
    const r = pH < 7 ? 239 : Math.round(239 - (pH - 7) / 7 * 239);
    const g = Math.round(71 + (pH / 14) * 120);
    const b = pH > 7 ? Math.round((pH - 7) / 7 * 255) : 70;
    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
    ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  // Marcador do ponto de equivalência
  const peIdx = Math.round((Veq / V_MAX) * N_PTS);
  if (peIdx < pts.length) {
    const pe = pts[Math.max(0, Math.min(pts.length - 1, peIdx))];
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(pe.x, pe.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('pH=' + pe.pH.toFixed(1), pe.x + 6, pe.y - 3);
  }
}

let _titCurveAnimId = null;

function _updateTitrationCurve(titType, Ca, Va, Cb, pKa) {
  const canvas = document.getElementById('titcurve-canvas');
  if (!canvas) return;
  if (_titCurveAnimId) { cancelAnimationFrame(_titCurveAnimId); _titCurveAnimId = null; }
  _titCurveAnimId = requestAnimationFrame(() => {
    _drawTitrationCurve(canvas, titType, Ca, Va, Cb, pKa);
    _titCurveAnimId = null;
  });
}

export function destroy() {
  if (_titCurveAnimId) { cancelAnimationFrame(_titCurveAnimId); _titCurveAnimId = null; }
  if (_loop) { _loop.stop(); _loop = null; }
}
