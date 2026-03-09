/**
 * modules/mixtures/index.js — Módulo: Separação de Misturas
 * Lavoisier — Laboratório Visual de Química
 *
 * Cobre EM completo:
 *  - Misturas homogêneas vs heterogêneas
 *  - Filtração (sólido-líquido)
 *  - Decantação / separação por densidade
 *  - Destilação simples e fracionada
 *  - Cristalização / evaporação
 *  - Cromatografia (Rf)
 *  - Centrifugação
 *  - Calculadora de Rf cromatográfico
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';
import { SimLoop }         from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

// ---------------------------------------------------------------------------
// Dados das técnicas
// ---------------------------------------------------------------------------

const TECHNIQUES = [
  {
    id:      'filtration',
    name:    'Filtração',
    icon:    '▽',
    mixture: 'Heterogênea sólido-líquido',
    principle: 'O filtro retém partículas sólidas maiores que seus poros e deixa o líquido (filtrado) passar por gravidade ou pressão.',
    when:    'Separar sólidos em suspensão de líquidos: areia da água, café do pó, precipitados analíticos.',
    types:   ['Filtração simples (papel filtro + funil)', 'Filtração a vácuo (kitassato + Büchner)', 'Ultrafiltração por membrana (hemodiálise)'],
    examples:['Tratamento de água: grades e filtros de areia retêm partículas', 'Café coado: papel retém o pó', 'Análise química: precipitação e filtragem do BaSO₄'],
  },
  {
    id:      'decantation',
    name:    'Decantação',
    icon:    '⧖',
    mixture: 'Heterogênea (líquido-sólido ou líquido-líquido imiscíveis)',
    principle: 'Partículas mais densas sedimentam sob gravidade. Líquidos imiscíveis separam-se em camadas por densidade — o menos denso fica acima.',
    when:    'Areia no fundo da água; óleo sobre água; separação de fases em extração orgânica.',
    types:   ['Decantação simples (repouso + transferência)', 'Funil de separação (líquidos imiscíveis)', 'Centrífuga (acelera a sedimentação)'],
    examples:['Separação óleo/água em vazamentos marinhos', 'Extração de cafeína do café com solvente orgânico', 'Sedimentação do vinho (tartaratos)'],
  },
  {
    id:      'distillation',
    name:    'Destilação',
    icon:    '♨',
    mixture: 'Homogênea líquido-líquido miscíveis ou sólido dissolvido',
    principle: 'Aquecimento vaporiza o componente mais volátil (menor PE). O vapor é resfriado no condensador e recolhido como destilado puro.',
    when:    'Obter água pura de solução salina (destilação simples); separar etanol da água (fracionada); refinar petróleo.',
    types:   ['Simples: diferença de PE > 25 °C', 'Fracionada: coluna de fracionamento, PE próximos', 'A vácuo: substâncias termolábeis', 'Por arraste de vapor: óleos essenciais'],
    examples:['Refinaria de petróleo: GLP (−40°C), gasolina (40–200°C), diesel (250–350°C)', 'Produção de cachaça e whisky', 'Dessalinização de água do mar', 'Purificação de solventes em laboratório'],
  },
  {
    id:      'crystallization',
    name:    'Cristalização',
    icon:    '❋',
    mixture: 'Homogênea sólido dissolvido em líquido',
    principle: 'A solubilidade de sólidos em geral diminui com a temperatura. Resfriando a solução saturada, o excesso de soluto precipita em cristais puros.',
    when:    'Purificar sal, açúcar, compostos orgânicos, metais. Quando a destilação degradaria o soluto.',
    types:   ['Evaporação simples: só remove o solvente (sal de cozinha)', 'Recristalização: dissolução a quente + resfriamento (purificação)'],
    examples:['Produção de sal marinho: evaporação solar nas salinas', 'Refinação de açúcar: recristalização', 'Purificação de ácido acetilsalicílico (aspirina) em laboratório', 'Formação de geodos e estalactites na natureza'],
  },
  {
    id:      'chromatography',
    name:    'Cromatografia',
    icon:    '≡',
    mixture: 'Homogênea (múltiplos solutos)',
    principle: 'Componentes migram em velocidades diferentes por diferença de afinidade entre fase estacionária e fase móvel. Quantificado pelo fator de retenção Rf = d_substância / d_frente.',
    when:    'Identificar e separar pigmentos, aminoácidos, fármacos, DNA. Técnica analítica e preparativa.',
    types:   ['CCD (camada delgada)', 'Papel', 'Coluna', 'HPLC (alta pressão)', 'GC (fase gasosa)'],
    examples:['Identificação de corantes em alimentos (vigilância sanitária)', 'Exame antidoping — GC-MS detecta traços de substâncias', 'Sequenciamento de DNA (eletroforese em gel)', 'Purificação de anticorpos monoclonais'],
  },
  {
    id:      'centrifugation',
    name:    'Centrifugação',
    icon:    '⟳',
    mixture: 'Heterogênea (coloides, suspensões finas)',
    principle: 'Rotação em alta velocidade gera força centrífuga que acelera a sedimentação — partículas mais densas migram para a periferia.',
    when:    'Separar células do plasma, vírus de culturas, creme do leite, precipitados finos que não sedimentam por gravidade.',
    types:   ['Microcentrífuga (até 16.000 rpm): DNA, proteínas', 'Ultracentrífuga (até 100.000 rpm): vírus, ribossomos', 'Centrífuga industrial: processamento de leite, suco'],
    examples:['Separação do creme no leite (manteiga)', 'Coleta de células sanguíneas (hemocentros)', 'Enriquecimento de urânio-235 (centrífuga de gás)'],
  },
];

// ---------------------------------------------------------------------------
// Exercícios
// ---------------------------------------------------------------------------
const EXERCISES = [
  {
    q:    'Para separar a mistura de água e areia, a técnica mais indicada é:',
    opts: ['Destilação', 'Filtração simples', 'Cromatografia', 'Cristalização'],
    ans:  1,
    exp:  'Areia e água formam mistura heterogênea sólido-líquido. A filtração retém o sólido no filtro e deixa a água passar. Destilação e cristalização seriam usadas se o sólido estivesse dissolvido.',
    hint: 'A areia não está dissolvida — está em suspensão. Qual técnica usa um filtro físico?',
  },
  {
    q:    'O petróleo bruto é separado em frações (gasolina, diesel, querosene) por:',
    opts: ['Filtração a vácuo', 'Cristalização', 'Destilação fracionada', 'Decantação'],
    ans:  2,
    exp:  'O petróleo é uma mistura homogênea de hidrocarbonetos com pontos de ebulição próximos. A destilação fracionada, com coluna de fracionamento, separa as frações por volatilidade diferencial.',
    hint: 'Os componentes estão dissolvidos uns nos outros (mistura homogênea) com PEs próximos.',
  },
  {
    q:    'Numa cromatografia em papel, uma substância percorreu 4 cm enquanto o solvente percorreu 8 cm. O Rf é:',
    opts: ['0,25', '0,5', '2,0', '4,0'],
    ans:  1,
    exp:  'Rf = distância da substância ÷ distância do solvente = 4 ÷ 8 = 0,5. Rf é adimensional e varia de 0 (não migra) a 1 (migra com o solvente). Serve para identificar substâncias.',
    hint: 'Rf = d_substância / d_solvente. Divida os dois valores fornecidos.',
  },
];

let _loop        = null;
let _techIdx     = 0;
let _exIdx       = 0;
let _exAttempts  = 0;
let _exDone      = false;

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
export function render(outlet) {
  if (_loop) { _loop.stop(); _loop = null; }
  _techIdx    = 0;
  _exIdx      = 0;
  _exAttempts = 0;
  _exDone     = false;

  outlet.innerHTML = _buildHTML();
  _initMixtures();
  markSectionDone('mixtures', 'visited');
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------
function _buildHTML() {
  return `
<div class="module-page" id="module-mixtures">

  <button class="module-back btn-ghost" data-nav="/modules">&#8592; Módulos</button>

  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
           stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M8 3l4 8 5-5v10H3V6z"/><circle cx="17" cy="17" r="3"/>
        <line x1="3" y1="17" x2="14" y2="17"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Separação de Misturas</h1>
      <p class="module-subtitle">Filtração, decantação, destilação, cristalização, cromatografia e centrifugação.</p>
    </div>
  </header>

  <!-- Tipos de mistura -->
  <section class="module-section">
    <h2 class="module-section-title">Misturas: homogêneas vs heterogêneas</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));margin-bottom:1rem">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Homogênea (1 fase)</h3>
        <p style="font-size:var(--text-sm)">
          Componentes indistinguíveis a olho nu. Uma única fase.
          Ex: água + sal, ar, ligas metálicas (latão = Cu + Zn), vinho.
          <br><strong>Separação</strong>: destilação, cristalização, cromatografia.
        </p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Heterogênea (2+ fases)</h3>
        <p style="font-size:var(--text-sm)">
          Fases visíveis ou distinguíveis. Pode ser sólido-líquido, líquido-líquido imiscível ou sólido-sólido.
          Ex: areia + água, óleo + água, granito (quartzo + feldspato + mica).
          <br><strong>Separação</strong>: filtração, decantação, centrifugação.
        </p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Coloide (dispersão)</h3>
        <p style="font-size:var(--text-sm)">
          Partículas entre 1 nm e 1 µm. Aparentemente homogêneo, mas dispersa luz (efeito Tyndall).
          Ex: leite, névoa, maionese, sangue, gelatina.
          <br><strong>Separação</strong>: centrifugação, ultrafiltração.
        </p>
      </div>
    </div>
  </section>

  <!-- Técnicas -->
  <section class="module-section">
    <h2 class="module-section-title">Técnicas de separação</h2>
    <div id="tech-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.75rem">
      ${TECHNIQUES.map((t, i) => `
        <button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="tech-tab-${i}" data-tech="${i}">
          ${esc(t.icon)} ${esc(t.name)}
        </button>`).join('')}
    </div>
    <div id="tech-content" style="display:grid;gap:1rem"></div>
  </section>

  <!-- Canvas: visualização da destilação -->
  <section class="module-section">
    <h2 class="module-section-title">Visualização: destilação</h2>
    <p class="module-text">
      Cada ponto representa uma molécula. As mais voláteis (azul claro = componente A,
      PE mais baixo) escapam primeiro para a fase vapor e se condensam no destilado.
      As menos voláteis (amarelo = componente B) ficam no balão.
    </p>
    <div class="canvas-frame" id="distill-frame" style="min-height:200px">
      <canvas id="distill-canvas" aria-label="Simulação de destilação"></canvas>
    </div>
    <div style="margin-top:.5rem;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap">
      <label style="font-size:var(--text-sm);color:var(--text-secondary)">
        Temperatura:
        <input type="range" id="distill-temp" min="20" max="120" value="20" step="1"
               style="width:120px;accent-color:var(--accent-reaction);vertical-align:middle;margin-left:.4rem">
        <span id="distill-temp-val" style="color:var(--accent-reaction);min-width:50px;display:inline-block">20 °C</span>
      </label>
      <div style="font-size:var(--text-xs);color:var(--text-muted)">
        <span style="color:var(--accent-electron)">■</span> Volátil (PE=65°C) &nbsp;
        <span style="color:var(--accent-bond)">■</span> Pouco volátil (PE=100°C) &nbsp;
        <span style="color:var(--accent-reaction)">↑</span> Evaporando
      </div>
    </div>
  </section>

  <!-- Calculadora de Rf -->
  <section class="module-section">
    <h2 class="module-section-title">Calculadora de Rf (cromatografia)</h2>
    <p class="module-text">
      O fator de retenção <strong>Rf = distância percorrida pela substância ÷ distância percorrida pelo solvente</strong>.
      Rf é característico de cada substância num dado solvente e temperatura — usado para identificação.
    </p>
    <div style="display:flex;flex-direction:column;gap:.6rem;margin:.75rem 0 1rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">Distância substância (cm):</span>
        <input type="range" id="rf-sub" min="0.5" max="10" step="0.1" value="4.0"
               style="width:140px;accent-color:var(--accent-organic)">
        <span id="rf-sub-val" style="color:var(--accent-organic);min-width:50px">4,0 cm</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">Distância solvente (cm):</span>
        <input type="range" id="rf-sol" min="1" max="12" step="0.1" value="8.0"
               style="width:140px;accent-color:var(--accent-electron)">
        <span id="rf-sol-val" style="color:var(--accent-electron);min-width:50px">8,0 cm</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Rf</p>
        <div id="rf-val" style="font-size:var(--text-2xl);font-weight:700;color:var(--accent-organic)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Interpretação</p>
        <div id="rf-interp" style="font-size:var(--text-sm);color:var(--text-secondary)">—</div>
      </div>
    </div>
  </section>

  <!-- Exercícios -->
  <section class="module-section" id="exercise-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/${EXERCISES.length})</h2>
    <p class="module-text" id="ex-question">${esc(EXERCISES[0].q)}</p>
    <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;max-width:440px;margin-top:.75rem">
      ${EXERCISES[0].opts.map((opt, i) => `
        <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
                data-exopt="${i}">${esc(opt)}</button>`).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next"
            style="margin-top:1rem;display:none">Próximo exercício →</button>
  </section>

</div>`;
}

// ---------------------------------------------------------------------------
// Interações — chamadas de render()
// ---------------------------------------------------------------------------
function _initMixtures() {
  // --- Technique tabs ---
  function renderTech(idx) {
    const t  = TECHNIQUES[idx];
    const el = document.getElementById('tech-content');
    if (!el || !t) return;
    el.innerHTML = `
      <div class="info-card" style="background:var(--bg-raised)">
        <div style="display:flex;align-items:baseline;gap:.75rem;flex-wrap:wrap;margin-bottom:.5rem">
          <span style="font-size:1.4rem">${esc(t.icon)}</span>
          <span style="font-size:var(--text-lg);font-weight:700;color:var(--accent-electron)">${esc(t.name)}</span>
          <span style="font-size:var(--text-xs);padding:2px 8px;border-radius:99px;
                border:1px solid var(--border-default);color:var(--text-muted)">${esc(t.mixture)}</span>
        </div>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.2rem 0 .6rem">${esc(t.principle)}</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">
          <strong style="color:var(--text-secondary)">Quando usar:</strong> ${esc(t.when)}
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:.5rem">
          <div>
            <p style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;
               letter-spacing:.05em;margin-bottom:.3rem">Variantes</p>
            <ul style="list-style:none;padding:0;margin:0">
              ${t.types.map(tp => `<li style="font-size:var(--text-xs);color:var(--text-secondary);
                padding:.15rem 0;border-bottom:1px solid var(--border-subtle)">▪ ${esc(tp)}</li>`).join('')}
            </ul>
          </div>
          <div>
            <p style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;
               letter-spacing:.05em;margin-bottom:.3rem">Exemplos</p>
            <ul style="list-style:none;padding:0;margin:0">
              ${t.examples.map(ex => `<li style="font-size:var(--text-xs);color:var(--text-secondary);
                padding:.15rem 0;border-bottom:1px solid var(--border-subtle)">▪ ${esc(ex)}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>`;
    TECHNIQUES.forEach((_, j) => {
      const b = document.getElementById('tech-tab-' + j);
      if (b) b.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
    });
  }
  renderTech(0);
  TECHNIQUES.forEach((_, i) => document.getElementById('tech-tab-' + i)
    ?.addEventListener('click', () => renderTech(i)));

  // --- Distillation canvas ---
  const canvas = document.getElementById('distill-canvas');
  const frame  = document.getElementById('distill-frame');
  if (canvas && frame) {
    const W   = Math.min(frame.clientWidth || 520, 520);
    const H   = 200;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Simple particle system: 40 molecules
    const N       = 40;
    const PE_A    = 65;   // °C — volatile component
    const PE_B    = 100;  // °C — less volatile
    let   tempC   = 20;
    let   escaped = 0;

    const particles = Array.from({ length: N }, (_, i) => ({
      x:   Math.random() * W * 0.45 + 10,  // start in flask (left)
      y:   Math.random() * (H * 0.7) + H * 0.15,
      vx:  (Math.random() - 0.5) * 0.8,
      vy:  (Math.random() - 0.5) * 0.8,
      isA: i < N / 2,      // first half = volatile A
      evaporated: false,
      condensed:  false,
      cx: 0, cy: 0,        // condensed position
    }));

    _loop = new SimLoop(() => {
      clearCanvas(ctx, W, H);

      // Background: flask + condenser sketch
      ctx.strokeStyle = 'rgba(110,118,129,0.3)';
      ctx.lineWidth = 1;
      // Flask outline
      ctx.beginPath();
      ctx.ellipse(W * 0.22, H * 0.72, W * 0.18, H * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Neck
      ctx.beginPath();
      ctx.moveTo(W * 0.17, H * 0.52); ctx.lineTo(W * 0.15, H * 0.15);
      ctx.moveTo(W * 0.27, H * 0.52); ctx.lineTo(W * 0.29, H * 0.15);
      ctx.stroke();
      // Condenser tube
      ctx.beginPath();
      ctx.moveTo(W * 0.3, H * 0.15); ctx.lineTo(W * 0.75, H * 0.15);
      ctx.moveTo(W * 0.3, H * 0.25); ctx.lineTo(W * 0.75, H * 0.25);
      ctx.stroke();
      // Collecting flask
      ctx.beginPath();
      ctx.ellipse(W * 0.85, H * 0.65, W * 0.08, H * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Labels
      ctx.fillStyle = COLOR.textMuted; ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Balão', W * 0.22, H * 0.97);
      ctx.fillText('Condensador', W * 0.52, H * 0.36);
      ctx.fillText('Destilado', W * 0.85, H * 0.97);
      ctx.textAlign = 'left';

      // Temperature coloring of flask
      const heatFrac = Math.max(0, (tempC - 20) / 100);
      ctx.fillStyle = `rgba(239,71,111,${heatFrac * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(W * 0.22, H * 0.72, W * 0.18, H * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Update & draw particles
      escaped = 0;
      particles.forEach(p => {
        if (p.condensed) {
          escaped++;
          // Draw in collecting flask
          ctx.beginPath();
          ctx.arc(p.cx, p.cy, 3, 0, Math.PI * 2);
          ctx.fillStyle = p.isA ? COLOR.electron : COLOR.energy;
          ctx.fill();
          return;
        }

        if (p.evaporated) {
          // Travel along condenser to collecting flask
          p.x += 0.6;
          p.y  = H * 0.20;
          if (p.x > W * 0.78) {
            p.condensed = true;
            p.cx = W * 0.82 + Math.random() * 0.06 * W;
            p.cy = H * 0.55 + Math.random() * 0.18 * H;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = COLOR.reaction;
          ctx.fill();
          return;
        }

        // Check if particle evaporates
        const pe = p.isA ? PE_A : PE_B;
        const evapProb = tempC >= pe ? 0.003 : tempC > pe - 20 ? 0.0005 : 0;
        if (Math.random() < evapProb) {
          p.evaporated = true;
          p.x = W * 0.23;
          p.y = H * 0.15;
          return;
        }

        // Brownian motion inside flask bounds
        p.vx += (Math.random() - 0.5) * 0.15;
        p.vy += (Math.random() - 0.5) * 0.15;
        p.vx *= 0.96; p.vy *= 0.96;
        p.x += p.vx; p.y += p.vy;

        // Keep inside flask ellipse (approx)
        const dx = (p.x - W * 0.22) / (W * 0.17);
        const dy = (p.y - H * 0.72) / (H * 0.21);
        if (dx * dx + dy * dy > 1) { p.vx *= -0.8; p.vy *= -0.8; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = p.isA ? COLOR.electron : COLOR.energy;
        ctx.fill();
      });

      // Counter
      ctx.fillStyle = COLOR.textMuted; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`Destilado: ${escaped}/${N}`, 6, 14);
    });
    _loop.start();

    document.getElementById('distill-temp')?.addEventListener('input', e => {
      tempC = parseInt(e.target.value, 10);
      const tv = document.getElementById('distill-temp-val');
      if (tv) tv.textContent = tempC + ' °C';
    });
  }

  // --- Rf calculator ---
  function updateRf() {
    const sub = parseFloat(document.getElementById('rf-sub')?.value ?? 4);
    const sol = parseFloat(document.getElementById('rf-sol')?.value ?? 8);
    const sv  = document.getElementById('rf-sub-val');
    const lv  = document.getElementById('rf-sol-val');
    if (sv) sv.textContent = sub.toFixed(1).replace('.', ',') + ' cm';
    if (lv) lv.textContent = sol.toFixed(1).replace('.', ',') + ' cm';

    if (sol < sub) {
      const rv = document.getElementById('rf-val');
      const ri = document.getElementById('rf-interp');
      if (rv) rv.textContent = '—';
      if (ri) ri.textContent = 'Distância do solvente deve ser ≥ substância';
      return;
    }
    const rf = sub / sol;
    const rv = document.getElementById('rf-val');
    const ri = document.getElementById('rf-interp');
    if (rv) rv.textContent = rf.toFixed(3);
    if (ri) ri.textContent = rf < 0.2 ? 'Alta retenção (fase estacionária retém muito)'
                           : rf < 0.5 ? 'Retenção intermediária'
                           : rf < 0.8 ? 'Baixa retenção (maior afinidade pela fase móvel)'
                           : 'Rf ≈ 1 — migra com o solvente (pouca retenção)';
  }
  updateRf();
  document.getElementById('rf-sub')?.addEventListener('input', updateRf);
  document.getElementById('rf-sol')?.addEventListener('input', updateRf);

  // --- Exercises ---
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
    optsEl.innerHTML = ex.opts.map((opt, i) => `
      <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
              data-exopt="${i}">${esc(opt)}</button>`).join('');
    optsEl.querySelectorAll('[data-exopt]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (_exDone) return;
        _exAttempts++;
        const choice = parseInt(btn.dataset.exopt, 10);
        const fb2    = document.getElementById('exercise-feedback');
        if (choice === ex.ans) {
          _exDone = true;
          btn.style.borderColor = 'var(--accent-organic)';
          btn.style.color       = 'var(--accent-organic)';
          if (fb2) fb2.innerHTML = `<p class="feedback-correct">Correto! ${esc(ex.exp)}</p>`;
          markSectionDone('mixtures', 'exercise');
          const nxBtn = document.getElementById('ex-next');
          if (nxBtn && idx < EXERCISES.length - 1) nxBtn.style.display = 'inline-flex';
        } else {
          btn.style.borderColor = 'var(--accent-reaction)';
          btn.style.color       = 'var(--accent-reaction)';
          if (fb2 && _exAttempts === 1)
            fb2.innerHTML = `<p class="feedback-hint">Dica: ${esc(ex.hint)}</p>`;
        }
      });
    });
  }
  loadExercise(0);
  document.getElementById('ex-next')?.addEventListener('click', () => {
    _exIdx = Math.min(_exIdx + 1, EXERCISES.length - 1);
    loadExercise(_exIdx);
  });
}

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
}
