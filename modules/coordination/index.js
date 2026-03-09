/**
 * modules/coordination/index.js — Módulo: Química de Coordenação
 * Lavoisier — Laboratório Visual de Química
 *
 * Cobre Graduação 2º ano+:
 *  - Nomenclatura de complexos: IUPAC, ligantes, íon central
 *  - Números de coordenação e geometrias: 4 (quadrado plano/tetrahedral), 6 (octaédrico)
 *  - Teoria do Campo Cristalino (TCC): divisão dos orbitais d, Δₒ
 *  - Complexos de campo forte vs fraco (alto vs baixo spin)
 *  - Série espectroquímica dos ligantes
 *  - Cor, absorção e energia de transição d-d
 *  - Magnetismo: diamagnético vs paramagnético — elétrons desemparelhados
 *  - Quelantes, EDTA, importância biológica (hemoglobina, clorofila, vitamina B₁₂)
 *  - Canvas: diagrama de divisão dos orbitais d em campo octaédrico, animação de spin
 */

import { esc }                from '../../js/ui.js';
import { markSectionDone }    from '../../js/state.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

const GEOMETRIES = [
  {
    cn: 2, name: 'Linear',
    color: '#4fc3f7',
    examples: '[Ag(NH₃)₂]⁺, [AuCl₂]⁻, [CuCl₂]⁻',
    desc: 'Típico de d¹⁰: Ag⁺, Au⁺, Hg²⁺. Ligantes em ângulo 180°.',
    angles: [[0, 0], [180, 0]],
  },
  {
    cn: 4, name: 'Quadrado plano',
    color: '#ffd166',
    examples: '[PtCl₄]²⁻, [Ni(CN)₄]²⁻, cisplatina',
    desc: 'Típico de d⁸: Pt²⁺, Pd²⁺, Ni²⁺ (campo forte), Au³⁺. Ligantes no plano xy a 90°.',
    angles: [[0,0],[90,0],[180,0],[270,0]],
  },
  {
    cn: 4, name: 'Tetraédrico',
    color: '#6bcb77',
    examples: '[ZnCl₄]²⁻, [FeCl₄]²⁻, [CoCl₄]²⁻',
    desc: 'd⁰, d⁵ alto spin, d¹⁰. Sem estabilização por efeito Jahn-Teller. Δₜₑₜ ≈ 4/9 Δₒ.',
    angles: [[54.7,45],[54.7,225],[125.3,135],[125.3,315]],
  },
  {
    cn: 6, name: 'Octaédrico',
    color: '#ef476f',
    examples: '[Fe(H₂O)₆]³⁺, [Co(NH₃)₆]³⁺, [Cr(CN)₆]³⁻',
    desc: 'Mais comum em metais de transição. Seis ligantes a 90°. Divisão d em t₂g (3) + eₘ (2) com Δₒ.',
    angles: [[0,0],[90,0],[90,90],[90,180],[90,270],[180,0]],
  },
];

// Série espectroquímica (ligantes ordenados por força de campo)
const SPECTROCHEMICAL = [
  { ligand: 'I⁻',         strength: 0.05, color: '#555',    type: 'σ apenas' },
  { ligand: 'Br⁻',        strength: 0.12, color: '#6b5a3e', type: 'σ apenas' },
  { ligand: 'Cl⁻',        strength: 0.20, color: '#8b6914', type: 'σ apenas' },
  { ligand: 'F⁻',         strength: 0.30, color: '#4fc3f7', type: 'σ + π doador' },
  { ligand: 'OH⁻',        strength: 0.35, color: '#4fc3f7', type: 'σ + π doador' },
  { ligand: 'H₂O',        strength: 0.45, color: '#4fc3f7', type: 'σ apenas (referência)' },
  { ligand: 'NCS⁻ (N)',   strength: 0.52, color: '#b0b8c1', type: 'σ + π fraco' },
  { ligand: 'NH₃',        strength: 0.60, color: '#6bcb77', type: 'σ apenas' },
  { ligand: 'en (etilenodiamina)', strength: 0.65, color: '#6bcb77', type: 'σ, quelante' },
  { ligand: 'bpy (bipiridina)',    strength: 0.72, color: '#a78bfa', type: 'σ + π retrodoador' },
  { ligand: 'CN⁻',        strength: 0.88, color: '#ffd166', type: 'σ forte + π retrodoador' },
  { ligand: 'CO',         strength: 1.00, color: '#ef476f', type: 'σ + π retrodoador (máx)' },
];

// Complexos com configuração d e propriedades
const COMPLEXES = [
  {
    formula: '[Ti(H₂O)₆]³⁺',
    metal: 'Ti³⁺', d_config: 'd¹',
    field: 'fraco', spin: 'baixo',
    color_abs: '~500 nm (verde)', color_obs: 'violeta/roxo',
    t2g: 1, eg: 0,
    unpaired: 1, magnetic: 'paramagnético',
    delta_o: 20300, // cm⁻¹
    desc: 'Um elétron d em t₂g. Transição t₂g→eₘ absorve ~500 nm. Primeiro complexo compreendido quantitativamente pela TCC.',
  },
  {
    formula: '[Cr(NH₃)₆]³⁺',
    metal: 'Cr³⁺', d_config: 'd³',
    field: 'forte', spin: 'baixo',
    color_abs: '~420 nm + 530 nm', color_obs: 'amarelo-laranja',
    t2g: 3, eg: 0,
    unpaired: 3, magnetic: 'paramagnético (3 e⁻)',
    delta_o: 21600,
    desc: 'd³: t₂g³ em campo forte ou fraco — igual (t₂g é metade cheia simetricamente). Muito estável (EACC alta). Complexos de Cr³⁺ com aminas são azuis-violetas a amarelos.',
  },
  {
    formula: '[Fe(H₂O)₆]²⁺',
    metal: 'Fe²⁺', d_config: 'd⁶',
    field: 'fraco', spin: 'alto',
    color_abs: '~970 nm (IV próximo)', color_obs: 'verde pálido',
    t2g: 4, eg: 2,
    unpaired: 4, magnetic: 'paramagnético (4 e⁻)',
    delta_o: 10400,
    desc: 'Campo fraco (H₂O): Δₒ < P (energia de emparelhamento). Alto spin: t₂g⁴eₘ². Absorção fraca no infravermelho próximo explica cor verde pálida.',
  },
  {
    formula: '[Fe(CN)₆]⁴⁻',
    metal: 'Fe²⁺', d_config: 'd⁶',
    field: 'forte', spin: 'baixo',
    color_abs: '~420 nm (UV-Vis)', color_obs: 'amarelo',
    t2g: 6, eg: 0,
    unpaired: 0, magnetic: 'diamagnético',
    delta_o: 33000,
    desc: 'Campo forte (CN⁻): Δₒ >> P. Baixo spin: t₂g⁶. Diamagnético! Mesmo d⁶ que [Fe(H₂O)₆]²⁺ mas propriedade magnética completamente diferente.',
  },
  {
    formula: '[CoF₆]³⁻',
    metal: 'Co³⁺', d_config: 'd⁶',
    field: 'fraco', spin: 'alto',
    color_abs: '~700 nm', color_obs: 'azul',
    t2g: 4, eg: 2,
    unpaired: 4, magnetic: 'paramagnético (4 e⁻)',
    delta_o: 13100,
    desc: 'Co³⁺ com F⁻ (campo fraco): alto spin. Paramagnético, reativo. Contraste com [Co(NH₃)₆]³⁺ (campo forte): baixo spin, diamagnético, inerte cinéticamente.',
  },
  {
    formula: '[Co(NH₃)₆]³⁺',
    metal: 'Co³⁺', d_config: 'd⁶',
    field: 'forte', spin: 'baixo',
    color_abs: '~470 nm', color_obs: 'laranja-amarelo',
    t2g: 6, eg: 0,
    unpaired: 0, magnetic: 'diamagnético',
    delta_o: 22900,
    desc: 'Co³⁺ com NH₃ (campo forte): baixo spin, t₂g⁶. Diamagnético. Inerte cinéticamente — Werner estudou isômeros deste complexo para provar a teoria dos complexos (Nobel 1913).',
  },
];

const EXERCISES = [
  {
    q: 'Na teoria do campo cristalino para um complexo octaédrico, os orbitais d se dividem em dois grupos. Qual é a configuração d⁶ de BAIXO spin (campo forte)?',
    opts: ['t₂g³ eₘ³', 't₂g⁶ eₘ⁰', 't₂g⁴ eₘ²', 't₂g⁵ eₘ¹'],
    ans: 1,
    exp: 'Campo forte (Δₒ > P): elétrons preferem emparelhar em t₂g a subir para eₘ. d⁶ baixo spin → t₂g⁶ eₘ⁰. Zero elétrons desemparelhados → diamagnético. Ex: [Fe(CN)₆]⁴⁻, [Co(NH₃)₆]³⁺.',
    hint: 'Em campo forte, os elétrons enchem t₂g (3 orbitais, máx 6 e⁻) antes de ocupar eₘ.',
  },
  {
    q: 'Um complexo de Co³⁺ (d⁶) absorve luz com λ = 450 nm (azul-violeta). Qual cor será observada?',
    opts: ['Azul-violeta', 'Amarela-laranja (cor complementar)', 'Incolor', 'Vermelha'],
    ans: 1,
    exp: 'A cor observada é a complementar da cor absorvida. Roda de cores: complementar de azul-violeta (~450 nm) é amarela-laranja (~580–600 nm). [Co(NH₃)₆]³⁺ absorve ~470 nm e aparece laranja-amarelo.',
    hint: 'O que vemos é a luz NÃO absorvida. Cores complementares ficam opostas na roda de cores.',
  },
  {
    q: 'Qual ligante, pela série espectroquímica, induz o MAIOR desdobramento de campo cristalino (Δₒ)?',
    opts: ['F⁻ (campo fraco)', 'H₂O (campo médio)', 'NH₃ (campo forte)', 'CO (campo muito forte)'],
    ans: 3,
    exp: 'CO é o ligante de campo mais forte da série espectroquímica. Faz retrodoacão π (back-bonding): aceita elétrons d do metal em seu orbital π*, aumentando muito Δₒ. Ordem crescente: I⁻ < Br⁻ < Cl⁻ < F⁻ < OH⁻ < H₂O < NH₃ < CN⁻ < CO.',
    hint: 'A série espectroquímica vai de ligantes π-doadores (campo fraco) a π-aceitadores (campo forte).',
  },
];

let _geomIdx    = 0;
let _complexIdx = 0;
let _exIdx      = 0;
let _exAttempts = 0;
let _exDone     = false;

// ---------------------------------------------------------------------------
export function render(outlet) {
  _geomIdx = 0; _complexIdx = 0;
  _exIdx = 0; _exAttempts = 0; _exDone = false;

  outlet.innerHTML = _buildHTML();
  _initCoordination();
  markSectionDone('coordination', 'visited');
}

// ---------------------------------------------------------------------------
function _buildHTML() {
  return `
<div class="module-page" id="module-coordination">
  <button class="module-back btn-ghost" data-nav="/modules">&#8592; Módulos</button>

  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
           stroke-width="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <circle cx="12" cy="3"  r="1.5"/><circle cx="12" cy="21" r="1.5"/>
        <circle cx="3"  cy="12" r="1.5"/><circle cx="21" cy="12" r="1.5"/>
        <circle cx="5"  cy="5"  r="1.5"/><circle cx="19" cy="19" r="1.5"/>
        <line x1="12" y1="9" x2="12" y2="4.5"/>
        <line x1="12" y1="15" x2="12" y2="19.5"/>
        <line x1="9" y1="12" x2="4.5" y2="12"/>
        <line x1="15" y1="12" x2="19.5" y2="12"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Química de Coordenação</h1>
      <p class="module-subtitle">Complexos, teoria do campo cristalino, cor, magnetismo e aplicações biológicas.</p>
    </div>
  </header>

  <!-- ============================================================
       NOMENCLATURA E CONCEITOS
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Complexos — estrutura e nomenclatura</h2>
    <p class="module-text">
      Um complexo de coordenação consiste em um <strong>íon central</strong> (metal de transição)
      rodeado por <strong>ligantes</strong> — íons ou moléculas neutras que doam pares de elétrons
      (ácido de Lewis + base de Lewis). O número de ligantes que se ligam diretamente ao metal é o
      <strong>número de coordenação (CN)</strong>.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Nomenclatura IUPAC</h3>
        <p style="font-size:var(--text-sm)">Ligantes em ordem alfabética, metal no fim com estado de oxidação entre parênteses. Prefixos de número: di-, tri-, tetra-, penta-, hexa-. Ex: [Co(NH₃)₆]Cl₃ = cloreto de hexaamincobalto(III).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Ligantes comuns</h3>
        <p style="font-size:var(--text-sm)">Monodentados: H₂O (aqua), NH₃ (amina), Cl⁻ (cloro), CN⁻ (ciano), CO (carbonil). Bidentados: en (etilenodiamina), ox²⁻ (oxalato). Hexadentado: EDTA⁴⁻. Ligantes quelantes formam anéis de 5–6 átomos → mais estáveis (efeito quelato).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Isomeria</h3>
        <p style="font-size:var(--text-sm)"><strong>Geométrica:</strong> cis/trans em complexos quadrado plano e octaédrico. <strong>Óptica:</strong> Δ e Λ em complexos octaédricos tris-quelato. <strong>Linkage:</strong> SCN⁻ pode ligar por S ou N (tiocianato vs isotiocianato).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Constante de estabilidade</h3>
        <p style="font-size:var(--text-sm)">K_est = [MLₙ] / ([M][L]ⁿ). EDTA forma quelatos extremamente estáveis (logK ≈ 14–25 para metais 2+/3+). Usada em análise complexométrica, quelação terapêutica (intoxicação por Pb²⁺) e detergentes.</p>
      </div>
    </div>
  </section>

  <!-- ============================================================
       GEOMETRIAS
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Geometrias de coordenação</h2>
    <div id="geom-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:var(--space-4)">
      ${GEOMETRIES.map((g, i) => `
        <button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="geom-tab-${i}" data-geom="${i}">
          CN ${g.cn} — ${esc(g.name)}</button>`).join('')}
    </div>
    <div id="geom-info" class="info-card" style="background:var(--bg-raised)"></div>
  </section>

  <!-- ============================================================
       TEORIA DO CAMPO CRISTALINO — CANVAS
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Teoria do Campo Cristalino (TCC)</h2>
    <p class="module-text">
      Em campo octaédrico, os seis ligantes se aproximam ao longo dos eixos ±x, ±y, ±z.
      Orbitais d que apontam para os ligantes (d_z² e d_x²−y² → grupo <strong>eₘ</strong>)
      são mais repelidos e ficam com energia maior.
      Orbitais entre os eixos (d_xy, d_xz, d_yz → grupo <strong>t₂g</strong>) ficam com energia menor.
      A diferença de energia é <strong>Δₒ</strong> (ou 10Dq).
    </p>

    <div id="cx-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:var(--space-4)">
      ${COMPLEXES.map((c, i) => `
        <button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="cx-tab-${i}" data-cx="${i}">
          ${esc(c.d_config)}&nbsp;${c.field === 'forte' ? '↑' : '↓'}</button>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:var(--space-5);align-items:start">
      <canvas id="crystal-canvas" width="180" height="260"
              style="border-radius:var(--radius-md);background:var(--bg-raised)"
              aria-label="Diagrama de campo cristalino"></canvas>
      <div id="cx-info" class="info-card" style="background:var(--bg-raised)"></div>
    </div>
  </section>

  <!-- ============================================================
       SÉRIE ESPECTROQUÍMICA
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Série espectroquímica dos ligantes</h2>
    <p class="module-text">
      Ligantes são ordenados do campo mais fraco ao mais forte.
      Ligantes <strong>π-doadores</strong> (haletos, OH⁻) estabilizam eₘ → campo fraco.
      Ligantes <strong>σ apenas</strong> (H₂O, NH₃) → campo médio.
      Ligantes <strong>π-aceitadores</strong> (CN⁻, CO) aceitam densidade d do metal → campo muito forte.
    </p>
    <div style="overflow-x:auto;margin-bottom:var(--space-4)">
      <div id="spectroch-bar" style="display:flex;align-items:flex-end;gap:2px;height:70px;padding:0 4px">
        ${SPECTROCHEMICAL.map((l, i) => `
          <div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:32px">
            <div style="width:100%;background:${l.color};border-radius:3px 3px 0 0;
                 height:${Math.round(l.strength * 55) + 10}px;transition:height .3s"></div>
            <span style="font-size:7px;color:var(--text-muted);margin-top:3px;text-align:center;
                  writing-mode:vertical-lr;transform:rotate(180deg);max-height:38px;overflow:hidden">${esc(l.ligand)}</span>
          </div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);
                  color:var(--text-muted);margin-top:.3rem;padding:0 4px">
        <span>← Campo fraco (baixo Δₒ)</span>
        <span>Campo forte (alto Δₒ) →</span>
      </div>
    </div>
  </section>

  <!-- ============================================================
       IMPORTÂNCIA BIOLÓGICA
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Complexos em sistemas biológicos</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Hemoglobina (Fe²⁺)</h3>
        <p style="font-size:var(--text-sm)">Porfirina (tetradentada) + His proximal (5º ligante): Fe²⁺ CN=5. Ligação de O₂ (6º ligante): CN=6, baixo spin. CO liga 200× mais forte que O₂ → envenenamento. Fe³⁺ (metemoglobina) não liga O₂.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Clorofila (Mg²⁺)</h3>
        <p style="font-size:var(--text-sm)">Porfirina com Mg²⁺ central. Absorve 430 nm (azul) + 680 nm (vermelho) → transmite verde. A estrutura π extensa da porfirina é responsável pela absorção de energia luminosa.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Vitamina B₁₂ (Co³⁺)</h3>
        <p style="font-size:var(--text-sm)">Cobalamina: corrina (tetraaza macrocíclica) + Co³⁺. Única vitamina com metal. Coenzima em rearranjos de carbono e transferência de grupos metila. Deficiência → anemia megaloblástica.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Cisplatina (Pt²⁺)</h3>
        <p style="font-size:var(--text-sm)">cis-[PtCl₂(NH₃)₂]: quadrado plano, Pt²⁺ d⁸. Fármaco anticancerígeno — reage com N7 da guanina do DNA, formando adutos que distorcem a hélice e bloqueiam a replicação. Nobel 1979 (síntese) →descoberta acidental.</p>
      </div>
    </div>
  </section>

  <!-- ============================================================
       EXERCÍCIOS
  ============================================================ -->
  <section class="module-section" id="exercise-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/${EXERCISES.length})</h2>
    <p class="module-text" id="ex-question">${esc(EXERCISES[0].q)}</p>
    <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;max-width:520px;margin-top:var(--space-4)">
      ${EXERCISES[0].opts.map((o, i) => `
        <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
                data-exopt="${i}">${esc(o)}</button>`).join('')}
    </div>
    <div id="exercise-feedback" style="margin-top:var(--space-4)"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next" style="margin-top:var(--space-4);display:none">
      Próximo &#8594;</button>
  </section>
</div>`;
}

// ---------------------------------------------------------------------------
// Canvas — diagrama de campo cristalino octaédrico
// ---------------------------------------------------------------------------
function _drawCrystalField(ctx, W, H, cx_data) {
  clearCanvas(ctx, W, H);
  const MY = 20, MX = 20;
  const PH = H - MY * 2;
  const mid_y = MY + PH * 0.55; // posição zero de energia (relativa)

  // Seta de energia
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(MX, H - MY); ctx.lineTo(MX, MY); ctx.stroke();
  ctx.fillStyle = COLOR.textMuted; ctx.font = '8px sans-serif';
  ctx.save(); ctx.translate(10, MY + PH/2); ctx.rotate(-Math.PI/2);
  ctx.fillText('Energia', 0, 0); ctx.restore();

  // Nível atômico livre (tracejado)
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(MX + 10, mid_y); ctx.lineTo(W - MX, mid_y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLOR.textMuted; ctx.font = '7px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('d (livre)', W - MX - 2, mid_y - 2);

  const delta_h = PH * 0.28;

  // t2g — 3 orbitais, abaixo do nível zero: −0,4Δₒ
  const t2g_y = mid_y + delta_h * 0.4;
  const eg_y  = mid_y - delta_h * 0.6;

  // Draw orbital levels
  function drawLevel(y, label, x_start, n_orbs, electrons, color) {
    const spacing = 20;
    for (let o = 0; o < n_orbs; o++) {
      const ox = x_start + o * spacing;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + 14, y); ctx.stroke();

      // Electrons on this orbital
      const e_in_orb = electrons[o] || 0;
      if (e_in_orb >= 1) {
        ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('↑', ox + 7, y - 3);
      }
      if (e_in_orb >= 2) {
        ctx.fillText('↓', ox + 7, y - 3 + 11);
      }
    }
    ctx.fillStyle = color; ctx.font = '8px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(label, x_start + n_orbs * spacing + 3, y + 3);
  }

  // Distribute electrons according to configuration
  const t2g_count = cx_data.t2g;
  const eg_count  = cx_data.eg;
  const isLowSpin = cx_data.spin === 'baixo';

  // t2g electrons distribution (3 orbitals)
  let t2g_e = [0,0,0];
  let placed = 0;
  if (isLowSpin) {
    // Fill t2g fully first
    for (let i = 0; i < 3 && placed < t2g_count; i++) { t2g_e[i]++; placed++; }
    for (let i = 0; i < 3 && placed < t2g_count; i++) { t2g_e[i]++; placed++; }
  } else {
    // Hund first
    for (let i = 0; i < 3 && placed < t2g_count; i++) { t2g_e[i]++; placed++; }
    for (let i = 0; i < 3 && placed < t2g_count; i++) { t2g_e[i]++; placed++; }
  }

  let eg_e = [0,0];
  placed = 0;
  for (let i = 0; i < 2 && placed < eg_count; i++) { eg_e[i]++; placed++; }
  for (let i = 0; i < 2 && placed < eg_count; i++) { eg_e[i]++; placed++; }

  const cx0 = MX + 20;
  drawLevel(t2g_y, 't₂g', cx0,     3, t2g_e, '#4fc3f7');
  drawLevel(eg_y,  'eₘ',  cx0 + 5, 2, eg_e,  '#ef476f');

  // Δₒ arrow
  ctx.strokeStyle = COLOR.bond; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(MX + 14, eg_y); ctx.lineTo(MX + 14, t2g_y); ctx.stroke();
  ctx.fillStyle = COLOR.bond; ctx.font = '8px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('Δₒ', MX + 12, (eg_y + t2g_y) / 2 + 3);

  // Labels: campo
  ctx.fillStyle = cx_data.field === 'forte' ? COLOR.organic : COLOR.energy;
  ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Campo ' + cx_data.field, cx0 + 40, H - 6);

  ctx.fillStyle = COLOR.textMuted; ctx.font = '8px sans-serif';
  ctx.fillText(cx_data.formula, cx0 + 40, H - 16);
}

// ---------------------------------------------------------------------------
function _initCoordination() {
  // Geometries
  function renderGeom(idx) {
    const g = GEOMETRIES[idx];
    document.getElementById('geom-info').innerHTML = `
      <div style="display:flex;gap:.75rem;align-items:baseline;flex-wrap:wrap;margin-bottom:.5rem">
        <span style="font-size:var(--text-base);font-weight:700;color:${g.color}">CN ${g.cn} — ${esc(g.name)}</span>
      </div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:.4rem">${esc(g.desc)}</p>
      <p style="font-size:var(--text-xs);color:var(--text-muted)"><strong>Exemplos:</strong> ${esc(g.examples)}</p>`;
    GEOMETRIES.forEach((_, j) => {
      const b = document.getElementById('geom-tab-' + j);
      if (b) b.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
    });
  }
  renderGeom(0);
  GEOMETRIES.forEach((_, i) =>
    document.getElementById('geom-tab-' + i)?.addEventListener('click', () => { _geomIdx = i; renderGeom(i); }));

  // Crystal field canvas
  const canvas = document.getElementById('crystal-canvas');
  if (canvas) {
    const W = 180, H = 260;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);

    function renderComplex(idx) {
      const cx = COMPLEXES[idx];
      _drawCrystalField(ctx, W, H, cx);
      const spinColor = cx.unpaired === 0 ? COLOR.organic : COLOR.reaction;
      document.getElementById('cx-info').innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:baseline;margin-bottom:.5rem">
          <span style="font-family:monospace;font-size:var(--text-base);font-weight:700;
                color:var(--accent-electron)">${esc(cx.formula)}</span>
          <span style="font-size:var(--text-xs);color:var(--text-muted)">${esc(cx.metal)} · ${esc(cx.d_config)}</span>
        </div>
        <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:.5rem">
          <span style="font-size:var(--text-sm)">t₂g: <strong style="color:#4fc3f7">${cx.t2g}</strong></span>
          <span style="font-size:var(--text-sm)">eₘ: <strong style="color:#ef476f">${cx.eg}</strong></span>
          <span style="font-size:var(--text-sm)">Δₒ: <strong style="color:var(--accent-bond)">${cx.delta_o.toLocaleString('pt-BR')} cm⁻¹</strong></span>
        </div>
        <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:.5rem">
          <span style="font-size:var(--text-sm)">Absorve: <strong style="color:var(--text-secondary)">${esc(cx.color_abs)}</strong></span>
          <span style="font-size:var(--text-sm)">Cor: <strong style="color:var(--accent-organic)">${esc(cx.color_obs)}</strong></span>
        </div>
        <span style="font-size:var(--text-sm);color:${spinColor}">${esc(cx.magnetic)} · campo ${esc(cx.field)}</span>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.5rem 0 0">${esc(cx.desc)}</p>`;
      COMPLEXES.forEach((_, j) => {
        const b = document.getElementById('cx-tab-' + j);
        if (b) b.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
      });
    }
    renderComplex(0);
    COMPLEXES.forEach((_, i) =>
      document.getElementById('cx-tab-' + i)?.addEventListener('click', () => { _complexIdx = i; renderComplex(i); }));
  }

  // Exercises
  function loadEx(idx) {
    const ex = EXERCISES[idx];
    if (!ex) return;
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
    optsEl.innerHTML = ex.opts.map((o, i) => `
      <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
              data-exopt="${i}">${esc(o)}</button>`).join('');
    optsEl.querySelectorAll('[data-exopt]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (_exDone) return;
        _exAttempts++;
        const choice = parseInt(btn.dataset.exopt, 10);
        const fb2 = document.getElementById('exercise-feedback');
        if (choice === ex.ans) {
          _exDone = true;
          btn.style.borderColor = 'var(--accent-organic)';
          btn.style.color = 'var(--accent-organic)';
          if (fb2) fb2.innerHTML = `<p class="feedback-correct">Correto! ${esc(ex.exp)}</p>`;
          markSectionDone('coordination', 'exercise');
          const nxBtn = document.getElementById('ex-next');
          if (nxBtn && idx < EXERCISES.length - 1) nxBtn.style.display = 'inline-flex';
        } else {
          btn.style.borderColor = 'var(--accent-reaction)';
          btn.style.color = 'var(--accent-reaction)';
          if (fb2 && _exAttempts === 1)
            fb2.innerHTML = `<p class="feedback-hint">Dica: ${esc(ex.hint)}</p>`;
        }
      });
    });
  }
  loadEx(0);
  document.getElementById('ex-next')?.addEventListener('click', () => {
    _exIdx = Math.min(_exIdx + 1, EXERCISES.length - 1);
    loadEx(_exIdx);
  });
}

export function destroy() {}
