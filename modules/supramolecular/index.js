/**
 * modules/supramolecular/index.js — Módulo: Química Supramolecular e Polímeros Avançados
 * Lavoisier — Laboratório Visual de Química
 *
 * Cobre Graduação 2º ano+:
 *  - Química supramolecular: forças fracas, reconhecimento molecular
 *  - Complementaridade: lock-and-key, induced fit
 *  - Macrociclos: éteres-coroa, criptandos, ciclodextrinas
 *  - Self-assembly: micelas, vesículas, DNA duplex
 *  - Polímeros: Mn/Mw/PDI, Tg/Tm, cristalinidade
 *  - Máquinas moleculares: catenanos, rotaxanos, motor de Feringa
 *  - Click chemistry e bioortogonal
 */

import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';
import { SimLoop }         from '../../js/engine/simulation.js';
import { clearCanvas }     from '../../js/engine/renderer.js';

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

const MACROCYCLES = [
  {
    name: '18-coroa-6',
    type: 'Éter-coroa',
    guest: 'K⁺ (r = 1,38 Å)',
    Ka_log: 6.1,
    desc: 'Anel de 6 O e 18 átomos. Cavidade ótima para K⁺. Usado em química fase-transferência e como ionóforo sintético. Pedersen (Nobel 1987) sintetizou os primeiros éteres-coroa em 1967.',
  },
  {
    name: '12-coroa-4',
    type: 'Éter-coroa',
    guest: 'Li⁺ (r = 0,76 Å)',
    Ka_log: 3.9,
    desc: 'Anel menor, seletivo para Li⁺ e Na⁺. Cavidade ~1,2 Å. Aplicação em baterias de Li-polímero e sensores eletroquímicos de lítio.',
  },
  {
    name: 'Criptando [2.2.2]',
    type: 'Criptando',
    guest: 'K⁺ / Ba²⁺',
    Ka_log: 10.4,
    desc: 'Estrutura 3D bicíclica: dois N-bridges conectados por três -OCH₂CH₂O-. Encapsula o cátion em todas as direções. log Ka = 10,4 para K⁺ >> 18-coroa-6 (6,1): efeito criptando por encapsulamento tridimensional. Lehn (Nobel 1987).',
  },
  {
    name: 'α-Ciclodextrina',
    type: 'Ciclodextrina',
    guest: 'Moléculas apolares pequenas',
    Ka_log: 3.5,
    desc: '6 glicoses ligadas α-1,4. Cavidade ~0,5 nm Ø, interior apolar, exterior hidrofílico. Encapsula aromas (propano, butano) para encapsulamento em pó. Gosto amargo mascarado em fármacos.',
  },
  {
    name: 'β-Ciclodextrina',
    type: 'Ciclodextrina',
    guest: 'Fármacos (ibuprofeno, piroxicam)',
    Ka_log: 4.2,
    desc: '7 glicoses. Cavidade ~0,6 nm Ø. Aumenta solubilidade de fármacos apolares 10–1000×. Hydroxypropil-β-CD (Captisol®) é excipiente FDA-aprovado. Estrutura mais usada em fármacos e alimentos.',
  },
  {
    name: 'γ-Ciclodextrina',
    type: 'Ciclodextrina',
    guest: 'Moléculas grandes (esteróis, vitaminas)',
    Ka_log: 3.8,
    desc: '8 glicoses. Cavidade ~0,8 nm Ø, maior e mais flexível. Solubiliza colesterol, vitaminas lipossolúveis A/D/E/K, oligonucleotídeos. Menor constante por menor complementaridade com moléculas pequenas.',
  },
];

const POLYMERS = [
  { name: 'Polietileno (PE)',         type: 'Adição (radical/Ziegler)', Tg: -100, Tm: 130, cristal: 50, uso: 'Embalagens, sacolas, tubos de gás' },
  { name: 'Polipropileno (PP)',        type: 'Adição (Ziegler-Natta)',   Tg:    0, Tm: 165, cristal: 60, uso: 'Fibras têxteis, tampas, peças automotivas' },
  { name: 'PVC',                       type: 'Adição (radical)',         Tg:   80, Tm: 212, cristal: 10, uso: 'Tubulações, revestimentos, cabos elétricos' },
  { name: 'Poliestireno (PS)',          type: 'Adição (radical)',         Tg:  100, Tm:   0, cristal:  0, uso: 'Isopor, copos descartáveis (amorfo)' },
  { name: 'PET',                        type: 'Condensação (éster)',      Tg:   75, Tm: 265, cristal: 45, uso: 'Garrafas, fibras Dacron, filmes Mylar' },
  { name: 'Nylon-6,6',                 type: 'Condensação (amida)',      Tg:   50, Tm: 265, cristal: 50, uso: 'Cordas, meias, engrenagens, pára-quedas' },
  { name: 'PDMS (silicone)',           type: 'Condensação (Si-O)',       Tg: -125, Tm:   0, cristal:  0, uso: 'Implantes médicos, moldes PDMS, lubrificantes' },
  { name: 'PLA (poli-ácido lático)',   type: 'Condensação (éster)',      Tg:   60, Tm: 175, cristal: 40, uso: 'Biodegradável: suturas, impressão 3D, embalagens' },
];

const EXERCISE = {
  question: 'O complexo [K⊂18-coroa-6]⁺ é mais estável que [Na⊂18-coroa-6]⁺ principalmente porque:',
  options: [
    'A) Na⁺ tem carga maior e se liga mais fortemente ao oxigênio',
    'B) O raio iônico de K⁺ (1,38 Å) é complementar à cavidade da coroa-6',
    'C) Na⁺ não pode coordenar éteres por ser ácido de Lewis muito fraco',
    'D) K⁺ tem mais elétrons de valência para interação doador-aceitador',
  ],
  correct: 1,
  explanation: 'Complementaridade geométrica é o princípio central: a cavidade da 18-coroa-6 (r ≈ 1,3–1,6 Å) encaixa perfeitamente K⁺ (r = 1,38 Å). Na⁺ (r = 1,02 Å) é menor → a coroa não envolve todos os O ao redor → complexo menos estável (log Ka ≈ 4,4 vs 6,1 para K⁺).',
};

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

let _loop = null;
let _exAttempts = 0, _exDone = false;

// ---------------------------------------------------------------------------
// Canvas de self-assembly (anfifílicos browniano)
// ---------------------------------------------------------------------------

function _initMicelleCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const W   = parseInt(canvas.style.width,  10);
  const H   = parseInt(canvas.style.height, 10);
  const N   = 55;

  const parts = Array.from({ length: N }, () => ({
    x:     Math.random() * W,
    y:     Math.random() * H,
    vx:    (Math.random() - 0.5) * 0.6,
    vy:    (Math.random() - 0.5) * 0.6,
    angle: Math.random() * Math.PI * 2,
    va:    (Math.random() - 0.5) * 0.05,
  }));

  _loop = new SimLoop(() => {
    clearCanvas(ctx, W, H);

    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.angle += p.va;
      if (p.x < 0)  p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0)  p.y = H; if (p.y > H) p.y = 0;

      const lx = p.x + Math.cos(p.angle) * 11;
      const ly = p.y + Math.sin(p.angle) * 11;

      // cauda apolar
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(lx, ly);
      ctx.strokeStyle = 'rgba(255,209,102,0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // cabeça polar
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#4fc3f7';
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(180,180,180,0.45)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Azul = cabeça polar (hidrofílica)  |  Amarelo = cauda apolar (hidrofóbica)', 6, H - 7);
  });
  _loop.start();
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function render(outlet) {
  if (_loop) { _loop.stop(); _loop = null; }
  _exAttempts = 0; _exDone = false;

  const macBtns = MACROCYCLES.map((m, i) =>
    `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" data-macidx="${i}">${m.name}</button>`
  ).join('');

  const polyBtns = POLYMERS.map((p, i) =>
    `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" data-polyidx="${i}">${p.name.split(' ')[0]}</button>`
  ).join('');

  const exOpts = EXERCISE.options.map((opt, i) =>
    `<button class="btn btn-ghost" style="text-align:left;justify-content:flex-start" data-exopt="${i}">${esc(opt)}</button>`
  ).join('');

  outlet.innerHTML = `
<div class="page module-page">
  <button class="module-back btn-ghost" data-nav="/modules">&larr; Módulos</button>
  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Química Supramolecular</h1>
      <p class="module-subtitle">Reconhecimento molecular, macrociclos, self-assembly e polímeros avançados.</p>
    </div>
  </header>

  <!-- Fenômeno -->
  <section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">
      Como o DNA se auto-organiza em dupla hélice sem intervenção? Como enzimas reconhecem
      especificamente um substrato entre milhares? Como micelas se formam espontaneamente
      em água? A resposta está em interações não-covalentes cooperativas — o domínio da
      <strong>química supramolecular</strong>, a "química além da molécula" (Jean-Marie Lehn).
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Definição</h3>
        <p style="font-size:var(--text-sm)">Química de sistemas moleculares organizados por interações intermoleculares não-covalentes. Entidades: supermoléculas (hóspede-receptor definido) ou sistemas moleculares supramoleculares (fases organizadas).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Complementaridade</h3>
        <p style="font-size:var(--text-sm)">Lock-and-key (Fischer 1894): encaixe geométrico estrito. Induced-fit (Koshland 1958): receptor adapta-se conformacionalmente. Reconhecimento molecular = forma + dimensão + funcionalidades complementares.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Nobel 1987 e 2016</h3>
        <p style="font-size:var(--text-sm)">1987: Pedersen (coroas), Lehn (criptandos), Cram (moléculas-hóspede). 2016: Sauvage (catenanos), Stoddart (rotaxanos), Feringa (motor molecular). 2022: Sharpless/Meldal/Bertozzi — click chemistry.</p>
      </div>
    </div>
  </section>

  <!-- Forças supramoleculares -->
  <section class="module-section">
    <h2 class="module-section-title">Forças diretoras do reconhecimento molecular</h2>
    <p class="module-text">
      O reconhecimento emerge da cooperação de interações não-covalentes. A ΔG de complexação
      soma contribuições entálpicas (LH, eletrostática, π-π) e entrópicas (efeito hidrofóbico
      +ΔS; penalidade conformacional −TΔS).
    </p>
    <div style="overflow-x:auto;margin-bottom:var(--space-5)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Interação</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Energia (kJ/mol)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Direcionalidade</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Exemplos</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['Efeito hidrofóbico',   '5–40',   'Não-direcional (entrópica)', 'Micelas, dobramento proteico, CD'],
            ['Empilhamento π–π',     '2–10',   'Planar (face/borda)',        'DNA, grafite, porfirinas'],
            ['Ligação de hidrogênio','10–40',  'Direcional (150–180°)',      'DNA, α-hélice, folha β'],
            ['Cátion–π',            '5–20',   'Perpendicular',              'K⁺-coroa, acetilcolina-receptor'],
            ['Íon–dipolo',          '10–50',  'Longo alcance',              'Metal-macrociclo, proteína-ligante'],
            ['Van der Waals',       '0,1–5',  'Não-direcional',             'Encapsulamento em CD e clathratos'],
            ['C–H⋯π',              '2–5',    'Fraca, direcional',          'Cristalografia, proteínas'],
          ].map(_r => { const [t,e,d,ex]=_r; return `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-weight:600;color:var(--accent-electron)">${t}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-bond)">${e}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">${d}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${ex}</td>
          </tr>`; }).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- Macrociclos -->
  <section class="module-section">
    <h2 class="module-section-title">Macrociclos — éteres-coroa, criptandos e ciclodextrinas</h2>
    <p class="module-text">
      Macrociclos são receptores capazes de encapsular hóspedes por complementaridade de
      tamanho, forma e química. A constante de associação Ka mede a estabilidade do complexo:
      Ka = [HG] / ([H][G]).
    </p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:var(--space-4)">${macBtns}</div>
    <div id="mac-card" class="info-card" style="background:var(--bg-raised);min-height:80px"></div>
  </section>

  <!-- Self-assembly -->
  <section class="module-section">
    <h2 class="module-section-title">Self-assembly — micelas, vesículas e DNA</h2>
    <p class="module-text">
      Moléculas anfifílicas organizam-se espontaneamente em água acima da
      <strong>CMC (concentração micelar crítica)</strong>. O driving force é o
      efeito hidrofóbico: expulsão de moléculas de água estruturadas ao redor
      das caudas apolares → ΔS &gt; 0 → ΔG &lt; 0.
    </p>
    <div class="canvas-frame" id="micelle-frame" style="min-height:160px">
      <canvas id="micelle-canvas" aria-label="Simulação browniana de anfifílicos"></canvas>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr));margin-top:var(--space-4)">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Micelas esféricas</h3>
        <p style="font-size:var(--text-sm)">Formadas por surfactantes: SDS (cmc = 8 mM), CTAB, SDBS. Acima da CMC: monômeros livres + micelas em equilíbrio. Interior apolar → solubiliza gorduras. Raio ≈ comprimento da cauda (1–3 nm). Número de agregação: 50–100 monômeros.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Lipossomos</h3>
        <p style="font-size:var(--text-sm)">Bicamada fosfolipídica fechada com interior aquoso. Análogo sintético da membrana celular. Carreadores de fármacos: Doxil® (doxorrubicina), AmBisome® (anfotericina B). Nanopartículas lipídicas (LNP): vacinas mRNA COVID-19.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">DNA e G-quadruplex</h3>
        <p style="font-size:var(--text-sm)">Complementaridade A-T (2 LH, −3 kJ/mol) e G-C (3 LH, −5 kJ/mol) + empilhamento π–π. G-quadruplex: 4 G por plano, cátion K⁺ entre planos. Alvo terapêutico: inibição de telomerase em células cancerígenas (ligante PDS, RHPS4).</p>
      </div>
    </div>
  </section>

  <!-- Polímeros avançados -->
  <section class="module-section">
    <h2 class="module-section-title">Polímeros — Mn, Mw, PDI e propriedades térmicas</h2>
    <p class="module-text">
      Polímeros são polidispersos: cada cadeia tem comprimento diferente. Mn é a média
      numérica (sensível a cadeias curtas); Mw é a média ponderada (sensível a cadeias longas).
      PDI = Mw/Mn ≥ 1 quantifica a largura da distribuição de massa molar.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        Mn = Σ(Nᵢ·Mᵢ)/ΣNᵢ &nbsp;|&nbsp; Mw = Σ(Nᵢ·Mᵢ²)/Σ(Nᵢ·Mᵢ) &nbsp;|&nbsp; PDI = Mw/Mn ≥ 1
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Radical livre: PDI ≈ 2. RAFT/ATRP (controlada): PDI ≈ 1,05–1,2. Policondensação: PDI → 2.<br>
        Tg = transição vítrea: T abaixo → rígido (vítreo/glassy); T acima → borrachoso (rubbery).<br>
        Tm = fusão cristalina: só polímeros semicristalinos. Amorfos: sem Tm, apenas Tg.
      </p>
    </div>

    <!-- PDI calculator -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Calculadora de PDI
    </h3>
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">Mn (g/mol):</span>
        <input type="range" id="pdi-mn" min="1000" max="500000" step="1000" value="50000"
               style="width:130px;accent-color:var(--accent-electron)">
        <span id="pdi-mn-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:80px">50 000</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">PDI:</span>
        <input type="range" id="pdi-pdi" min="1.0" max="5.0" step="0.05" value="2.0"
               style="width:130px;accent-color:var(--accent-bond)">
        <span id="pdi-pdi-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:40px">2,00</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Mn (g/mol)</p><div id="pdi-mn-disp" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Mw (g/mol)</p><div id="pdi-mw-disp" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Tipo de síntese</p><div id="pdi-type" style="font-size:var(--text-sm);font-weight:700;color:var(--accent-organic)">—</div></div>
    </div>

    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-top:var(--space-6);margin-bottom:var(--space-3)">
      Propriedades térmicas
    </h3>
    <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:var(--space-3)">${polyBtns}</div>
    <div id="poly-card" class="info-card" style="background:var(--bg-raised);min-height:60px"></div>
    <div style="overflow-x:auto;margin-top:var(--space-4)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Polímero</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Tipo</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Tg (°C)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Tm (°C)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Cristalinidade</th>
          </tr>
        </thead>
        <tbody>
          ${POLYMERS.map(p => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-weight:600;color:var(--accent-electron)">${p.name}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${p.type}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-bond)">${p.Tg}°C</td>
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-organic)">${p.Tm > 0 ? p.Tm+'°C' : '—'}</td>
            <td style="padding:.4rem .6rem">${p.cristal > 0 ? p.cristal+'%' : 'amorfo'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <!-- Polímeros condutores -->
  <section class="module-section">
    <h2 class="module-section-title">Polímeros condutores</h2>
    <p class="module-text">
      Polímeros com sistema π-conjugado estendido ao longo da cadeia podem conduzir
      eletricidade após dopagem. Shirakawa, MacDiarmid e Heeger descobriram em 1977 que
      poliacetileno dopado com Cl₂ aumenta a condutividade 10⁹× — Nobel 2000.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        Eg (band gap) = LUMO − HOMO &nbsp;&nbsp;|&nbsp;&nbsp; σ (S/cm): isolante &lt; 10⁻¹⁰ &lt; semicond. &lt; 1 &lt; condutor
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Conjugação π: alternância de ligações simples/duplas → bandas π e π* se alargam → Eg diminui.<br>
        Dopagem p (oxidação): polímero perde e⁻ (ex: I₂, FeCl₃) → portadores positivos (pôlarons, bipôlarons).<br>
        Dopagem n (redução): polímero ganha e⁻ (ex: Na, Li) → portadores negativos.
      </p>
    </div>
    <div style="overflow-x:auto;margin-bottom:var(--space-5)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Polímero</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Eg (eV) não dopado</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">σ dopado (S/cm)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Dopante típico</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Aplicações</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['Poliacetileno (PA)',      '1,4–1,8', '~10³–10⁵','I₂, AsF₅',          'Referência histórica; instável ao ar'],
            ['Polipirrol (PPy)',        '~3,1',    '~100–500', 'BF₄⁻, ClO₄⁻',       'Biossensores, corrosão, supercapacitores'],
            ['Politiofeno (PT)',        '~2,0',    '~100–200', 'FeCl₃',              'TFTs, células solares (P3HT)'],
            ['PEDOT',                  '~1,6',    '~1000',    'PSS (in situ)',       'OLED, OSC, eletrônica impressa'],
            ['PEDOT:PSS',              '~1,6',    '~500–1000','PSS (dopante)',       'Eletrodo transparente, wearables'],
            ['Polianilina (PANI)',      '~3,2',    '~100–200', 'HCl (próton)',       'Anticorrosivo, sensores de pH/NH₃'],
            ['Polifluoreno (PFO)',      '~3,0',    'isolante', 'Ca (n)',              'OLEDs azuis (luminescência)'],
          ].map(_r => { const [p,eg,s,d,app]=_r; return `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-weight:600;color:var(--accent-electron)">${p}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-bond)">${eg}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-organic)">${s}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs)">${d}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${app}</td>
          </tr>`; }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Calculadora de band gap -->
    <h3 style="font-size:var(--text-sm);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">
      Relação Eg → λ de absorção/emissão
    </h3>
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:var(--space-4)">
      <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:160px">Eg (eV):</span>
      <input type="range" id="bg-eg" min="0.5" max="4.0" step="0.05" value="1.6"
             style="width:130px;accent-color:var(--accent-electron)">
      <span id="bg-eg-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">1,60 eV</span>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">λ (nm)</p><div id="bg-lambda" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Região</p><div id="bg-region" style="font-size:var(--text-base);font-weight:700;color:var(--accent-organic)">—</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Eg (kJ/mol)</p><div id="bg-kJ" style="font-size:var(--text-base);font-weight:600;color:var(--text-muted)">—</div></div>
    </div>
  </section>


  <!-- Máquinas moleculares -->
  <section class="module-section">
    <h2 class="module-section-title">Máquinas moleculares e química supramolecular funcional</h2>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Catenanos (Sauvage, 1983)</h3>
        <p style="font-size:var(--text-sm)">Dois anéis moleculares mecanicamente entrelaçados sem ligação covalente — como elos de corrente. Síntese via template metálico: Cu⁺ pré-organiza fragmentos → ciclização → remoção do metal. Bases de interruptores moleculares e memórias.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Rotaxanos (Stoddart, 1991)</h3>
        <p style="font-size:var(--text-sm)">Anel ensartado em eixo com tampões (stoppers) nas extremidades. O anel desliza entre "estações" eletronicamente diferentes ao longo do eixo por estímulo (pH, luz, oxidação). Elevador molecular: anel desloca-se 0,7 nm por mudança de pH.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Motor de Feringa (1999)</h3>
        <p style="font-size:var(--text-sm)">Rotação unidirecional (360°) por fotoisomerização E→Z (fóton UV) + relaxação térmica (aquecimento). Taxa: ~10⁶ rotações/s. Inserido em nanotubos e superfícies: materiais que giram sob UV. Carro molecular em superfície Au(111) demonstrado em 2011.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Click Chemistry (Nobel 2022)</h3>
        <p style="font-size:var(--text-sm)">Reações modulares, rápidas, seletivas em água. CuAAC (Huisgen): azida + alquino terminal → triazol (Cu(I), ΔG muito negativo). Bioortogonal (Bertozzi): tetrazina + TCO — reage in vivo sem toxicidade → marcação de glicanos em células cancerígenas.</p>
      </div>
    </div>
  </section>

  <!-- Exercício -->
  <section class="module-section">
    <h2 class="module-section-title">Exercício</h2>
    <p class="module-text">${esc(EXERCISE.question)}</p>
    <div id="exercise-opts" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">${exOpts}</div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
  </section>

  <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">
      Detergentes de louça (SDS) limpam gordura via micelas — a cauda apolar dissolve o óleo,
      a cabeça polar fica em contato com a água. β-Ciclodextrina encapsula o aroma de limão
      em produtos em pó: protege o volátil e o libera ao contato com água.
      Doxil® (lipossoma de doxorrubicina) reduz cardiotoxicidade do quimioterápico 5×.
      As vacinas mRNA COVID-19 usam nanopartículas lipídicas (LNP) para entregar o mRNA
      às células — a maior aplicação clínica de nanotecnologia supramolecular até hoje.
    </p>
  </div>
</div>
`;

  // Canvas
  const canvas = document.getElementById('micelle-canvas');
  const frame  = document.getElementById('micelle-frame');
  if (canvas && frame) {
    const W = Math.min(frame.clientWidth || 560, 560);
    const H = 160;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    canvas.getContext('2d').scale(dpr, dpr);
    _initMicelleCanvas(canvas);
  }

  // Macrociclos
  function showMac(idx) {
    const m    = MACROCYCLES[idx];
    const card = document.getElementById('mac-card');
    if (!card) return;
    card.innerHTML = `
      <h3 style="margin-top:0;color:var(--accent-electron)">${m.name}</h3>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">${m.type}</p>
      <p style="font-size:var(--text-sm);margin-bottom:.3rem"><strong>Hóspede preferencial:</strong> ${m.guest}</p>
      <p style="font-size:var(--text-sm);margin-bottom:.3rem">
        <strong>log Ka:</strong> <span style="color:var(--accent-organic)">${m.Ka_log}</span>
        &nbsp;&rarr;&nbsp; Ka ≈ ${(10**m.Ka_log).toExponential(1)} M⁻¹
      </p>
      <p style="font-size:var(--text-sm)">${m.desc}</p>`;
  }
  showMac(0);
  document.querySelectorAll('[data-macidx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.macidx, 10);
      document.querySelectorAll('[data-macidx]').forEach(b =>
        b.className = 'btn btn-xs ' + (parseInt(b.dataset.macidx,10) === idx ? 'btn-secondary' : 'btn-ghost'));
      showMac(idx);
    });
  });

  // Polímeros
  function showPoly(idx) {
    const p    = POLYMERS[idx];
    const card = document.getElementById('poly-card');
    if (!card) return;
    card.innerHTML = `
      <h3 style="margin-top:0;color:var(--accent-electron)">${p.name}</h3>
      <p style="font-size:var(--text-sm);margin-bottom:.3rem"><strong>Tipo:</strong> ${p.type}</p>
      <p style="font-size:var(--text-sm);margin-bottom:.3rem">
        Tg = <strong style="color:var(--accent-bond)">${p.Tg}°C</strong> &nbsp;|&nbsp;
        Tm = <strong style="color:var(--accent-organic)">${p.Tm > 0 ? p.Tm+'°C' : 'amorfo'}</strong> &nbsp;|&nbsp;
        Cristalinidade: <strong style="color:var(--accent-reaction)">${p.cristal > 0 ? p.cristal+'%' : '—'}</strong>
      </p>
      <p style="font-size:var(--text-sm)"><strong>Uso:</strong> ${p.uso}</p>`;
  }
  showPoly(0);
  document.querySelectorAll('[data-polyidx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.polyidx, 10);
      document.querySelectorAll('[data-polyidx]').forEach(b =>
        b.className = 'btn btn-xs ' + (parseInt(b.dataset.polyidx,10) === idx ? 'btn-secondary' : 'btn-ghost'));
      showPoly(idx);
    });
  });

  // PDI calculator
  function updatePDI() {
    const Mn  = parseFloat(document.getElementById('pdi-mn')?.value  ?? 50000);
    const pdi = parseFloat(document.getElementById('pdi-pdi')?.value ?? 2.0);
    const Mw  = Mn * pdi;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('pdi-mn-val',  Mn.toLocaleString('pt-BR'));
    set('pdi-pdi-val', pdi.toFixed(2));
    set('pdi-mn-disp', Math.round(Mn).toLocaleString('pt-BR'));
    set('pdi-mw-disp', Math.round(Mw).toLocaleString('pt-BR'));

    const typeEl = document.getElementById('pdi-type');
    if (typeEl) {
      typeEl.textContent  = pdi < 1.2  ? 'Estreita — RAFT/ATRP/living'
                          : pdi < 1.5  ? 'Moderada — living com transferência'
                          : pdi < 2.05 ? 'Radical livre (PDI ≈ 2)'
                          :              'Larga — policondensação/bifuncional';
      typeEl.style.color  = pdi < 1.2 ? 'var(--accent-organic)' : pdi < 2.05 ? 'var(--accent-bond)' : 'var(--accent-reaction)';
    }
  }
  updatePDI();
  ['pdi-mn','pdi-pdi'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', updatePDI));

  // Exercício
  document.querySelectorAll('[data-exopt]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_exDone) return; _exAttempts++;
      const choice = parseInt(btn.dataset.exopt, 10);
      const fb     = document.getElementById('exercise-feedback');
      if (choice === EXERCISE.correct) {
        _exDone = true;
        btn.style.borderColor = 'var(--accent-organic)';
        btn.style.color       = 'var(--accent-organic)';
        if (fb) fb.innerHTML  = '<p class="feedback-correct">Correto! ' + EXERCISE.explanation + '</p>';
        markSectionDone('supramolecular', 'exercise');
      } else {
        btn.style.borderColor = 'var(--accent-reaction)';
        btn.style.color       = 'var(--accent-reaction)';
        if (fb && _exAttempts === 1)
          fb.innerHTML = '<p class="feedback-hint">Dica: compare o raio iônico de K⁺ e Na⁺ com a cavidade da 18-coroa-6.</p>';
      }
    });
  });

  _initBandGap();
  markSectionDone('supramolecular', 'visited');
}

function _initBandGap() {
  const h  = 6.626e-34; // J·s
  const c  = 3e8;       // m/s
  const eV = 1.602e-19; // J/eV
  const NA = 6.022e23;

  function update() {
    const Eg = parseFloat(document.getElementById('bg-eg')?.value ?? 1.6);
    const lambda_m = h * c / (Eg * eV);   // metros
    const lambda   = lambda_m * 1e9;       // nm
    const kJ       = Eg * eV * NA / 1000;  // kJ/mol

    let region;
    if (lambda < 380)      region = 'UV';
    else if (lambda < 450) region = 'Violeta';
    else if (lambda < 495) region = 'Azul';
    else if (lambda < 570) region = 'Verde';
    else if (lambda < 620) region = 'Amarelo/Laranja';
    else if (lambda < 750) region = 'Vermelho';
    else                   region = 'IV próximo';

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('bg-eg-val',  Eg.toFixed(2) + ' eV');
    set('bg-lambda',  lambda.toFixed(0) + ' nm');
    set('bg-region',  region);
    set('bg-kJ',      kJ.toFixed(1) + ' kJ/mol');
  }

  document.getElementById('bg-eg')?.addEventListener('input', update);
  if (document.getElementById('bg-eg')) update();
}

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
}
