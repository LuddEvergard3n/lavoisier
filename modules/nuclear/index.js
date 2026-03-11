/**
 * modules/nuclear/index.js -- Modulo: Quimica Nuclear
 */
import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';
import { SimLoop }         from '../../js/engine/simulation.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

const ISOTOPES = [
  { name:'Carbono-14',   symbol:'14C',  t12:5730,     unit:'anos',  use:'Datação arqueológica (até ~50.000 anos)' },
  { name:'Iodo-131',     symbol:'131I', t12:8.02,     unit:'dias',  use:'Tratamento de câncer de tireoide e diagnóstico' },
  { name:'Urânio-238',   symbol:'238U', t12:4.468e9,  unit:'anos',  use:'Datação geológica; combustível nuclear' },
  { name:'Tecnécio-99m', symbol:'99mTc',t12:6.01,     unit:'horas', use:'Mais usado em medicina nuclear: cintilografia' },
  { name:'Flúor-18',     symbol:'18F',  t12:109.8,    unit:'min',   use:'PET scan (tomografia por emissão de positrons)' },
  { name:'Trítio-3',     symbol:'3H',   t12:12.32,    unit:'anos',  use:'Marcadores isotópicos, relógios radioluminescentes' },
  { name:'Plutônio-239', symbol:'239Pu',t12:24100,    unit:'anos',  use:'Combustível nuclear e armas' },
  { name:'Rádio-226',    symbol:'226Ra',t12:1600,     unit:'anos',  use:'Histórico; atualmente banido para luminescência' },
];

let _loop = null, _isoIdx = 0, _n0 = 100, _exAttempts = 0, _exDone = false;
let _exIdx     = 0;

function startDecayCanvas(el) {
  const frame = el.parentElement;
  const W = Math.min(frame.clientWidth||520, 520), H = 200;
  const dpr = window.devicePixelRatio||1;
  el.width  = Math.round(W*dpr); el.height = Math.round(H*dpr);
  el.style.width = W+'px'; el.style.height = H+'px';
  const ctx = el.getContext('2d'); ctx.scale(dpr, dpr);
  const simT12 = 4.0; // seconds per half-life in simulation
  const lambda = Math.LN2 / simT12;
  let nuclei = Array.from({length: _n0}, () => ({
    x: 30 + Math.random()*(W/2-50), y: 20 + Math.random()*(H-40),
    decayed: false, flash: 0,
  }));
  let elapsed = 0;
  if (_loop) _loop.stop();
  _loop = new SimLoop(dt => {
    clearCanvas(ctx, W, H);
    elapsed += dt;
    ctx.strokeStyle = COLOR.border; ctx.lineWidth=1.2; ctx.strokeRect(18,18,W/2-28,H-36);
    const cX = W/2+8, cW = W/2-20, cH = H-36, cY = 18;
    ctx.strokeRect(cX, cY, cW, cH);
    nuclei.forEach(n => {
      if (!n.decayed && Math.random() < lambda*dt) { n.decayed=true; n.flash=0.4; }
      if (n.flash > 0) { n.flash -= dt; }
      if (!n.decayed) {
        ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI*2);
        ctx.fillStyle = COLOR.electron+'cc'; ctx.fill();
      } else if (n.flash > 0) {
        ctx.beginPath(); ctx.arc(n.x+W/2, n.y, 5, 0, Math.PI*2);
        ctx.fillStyle = COLOR.reaction+Math.round(n.flash/0.4*200).toString(16).padStart(2,'0');
        ctx.fill();
      }
    });
    const remaining = nuclei.filter(n=>!n.decayed).length;
    ctx.fillStyle = COLOR.textMuted; ctx.font='10px sans-serif'; ctx.textAlign='left';
    ctx.fillText('Ativos: '+remaining+'/'+_n0, 22, H-22);
    ctx.fillText('t = '+elapsed.toFixed(1)+'s', 22, H-8);
    // decay curve
    ctx.beginPath();
    for (let i=0; i<=100; i++) {
      const x = cX+(i/100)*cW, y = cY+cH - Math.exp(-lambda*(i/100)*simT12*6)*cH;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.strokeStyle=COLOR.electron; ctx.lineWidth=1.5; ctx.stroke();
    const curX = cX+Math.min(elapsed/(simT12*6),1)*cW;
    const curN = Math.exp(-lambda*elapsed);
    ctx.beginPath(); ctx.arc(curX, cY+cH-curN*cH, 4, 0, Math.PI*2);
    ctx.fillStyle=COLOR.reaction; ctx.fill();
    if (remaining===0 || elapsed > simT12*8) {
      elapsed=0;
      nuclei = Array.from({length:_n0}, () => ({
        x: 30+Math.random()*(W/2-50), y: 20+Math.random()*(H-40), decayed:false, flash:0
      }));
    }
  });
  _loop.start();
}

function calcHalflife() {
  const iso = ISOTOPES[_isoIdx];
  const nHL = parseInt(document.getElementById('hl-n')?.value||1, 10);
  const frac = Math.pow(0.5, nHL);
  const elapsed = nHL * iso.t12;
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set('hl-remaining', (_n0*frac).toFixed(2)+' nucl.');
  set('hl-percent', (frac*100).toFixed(4)+'%');
  set('hl-elapsed', elapsed<1e6 ? elapsed.toFixed(2)+' '+iso.unit : elapsed.toExponential(3)+' '+iso.unit);
  const bar=document.getElementById('hl-bar'); if(bar) bar.style.width=Math.round(frac*220)+'px';
}

const EXERCISES = [
  { q: 't₁/₂ = 10 anos, atividade inicial = 1000 Bq. Atividade após 30 anos?', opts: ['500 Bq','250 Bq','125 Bq','333 Bq'], ans: 2, exp: '30 anos = 3 meias-vidas. A = 1000 × (½)³ = 125 Bq.', hint: 'Quantas meias-vidas em 30 anos? Cada uma divide A por 2.' },
  { q: 'No decaimento β⁻, o núcleo emite:', opts: ['Um próton','Um nêutron','Um elétron e um antineutrino','Uma partícula alfa'], ans: 2, exp: 'β⁻: n → p + e⁻ + ν̄_e. Z +1, A inalterado. Ex: ¹⁴C → ¹⁴N + e⁻ + ν̄_e.', hint: 'No β⁻ um nêutron vira próton. O que mais é emitido para conservar o número leptônico?' },
  { q: 'A datação por ¹⁴C funciona porque:', opts: ['¹⁴C é estável em seres vivos','¹⁴C é incorporado enquanto vivo e decai após a morte','t₁/₂ é infinito','O ¹⁴C se forma no solo'], ans: 1, exp: '¹⁴C (t₁/₂ = 5730 a) é formado na atmosfera e incorporado via CO₂. Após a morte, sem renovação, a razão ¹⁴C/¹²C decai — indicando a idade.', hint: 'O que acontece com a incorporação de carbono quando o organismo morre?' },
  { q: '²³⁵U + n → ¹⁴¹Ba + ⁹²Kr + ?n. Quantos nêutrons?', opts: ['1','2','3','4'], ans: 2, exp: 'Conservação de A: 235+1 = 141+92+x → x = 3.', hint: 'Some os números de massa dos reagentes e produtos. A diferença são os nêutrons emitidos.' },
  { q: 'Por que a fusão nuclear libera energia apesar da repulsão coulombiana?', opts: ['Força forte tem alcance longo','Produtos (He-4) têm maior energia de ligação/nucleon','Temperatura resfria a barreira','Elétrons blindam a repulsão'], ans: 1, exp: 'Após superar a barreira, a força forte une os núcleos. He-4 tem ~7 MeV/nucleon vs ~1 MeV/nucleon do D+T. A diferença é liberada.', hint: 'Compare energia de ligação/nucleon do He-4 vs D e T.' },,
  { q:'O ¹⁴C tem meia-vida de 5730 anos. Após 3 meias-vidas, qual a fração restante?', opts:['1/2','1/4','1/8','1/16'], ans:2, exp:'Após cada meia-vida, a quantidade cai pela metade: (1/2)³ = 1/8. Portanto 12,5% do ¹⁴C original permanece após 3 × 5730 = 17190 anos.', hint:'Após n meias-vidas: fração = (1/2)^n.' },
  { q:'A diferença entre fissão e fusão nuclear é:', opts:['Fissão libera energia; fusão não','Fissão: núcleo pesado se divide; fusão: núcleos leves se unem — ambas liberam energia','Fusão usa urânio; fissão usa hidrogênio','Fissão é a reação do sol; fusão é a das usinas nucleares'], ans:1, exp:'Fissão: U-235 + nêutron → Ba + Kr + 3n + ~200 MeV. Fusão: D + T → He + n + 17,6 MeV. O sol usa fusão (H → He). Usinas atuais usam fissão. Fusão: mais energia por kg, sem resíduos de longa vida, mas ainda não controlada para geração de energia em escala.', hint:'Fissão: divide. Fusão: une. Sol = fusão. Usinas atuais = fissão.' },
  { q:'A blindagem mais eficaz contra raios gama (γ) é:', opts:['Papel (pára partículas α)','Alumínio (pára partículas β)','Chumbo ou concreto denso (atenua γ por comprimento de atenuação)','Água apenas'], ans:2, exp:'α: pára no ar ou na pele (muito ionizante, baixa penetração). β: pára em alumínio mm. γ: raios-X/gama de alta energia → requerem chumbo (ρ = 11,3 g/cm³) ou concreto espesso. Nêutrons: água ou parafina (moderação).', hint:'α: papel. β: Al. γ: Pb/concreto. n: água/parafina.' },
  { q:'A energia de ligação por nucleon é máxima para o Fe-56, o que implica:', opts:['Fe-56 é o mais radioativo','Fe-56 é o mais estável — fissão de núcleos mais pesados e fusão de núcleos mais leves liberam energia em direção ao Fe','Fe-56 tem mais prótons que qualquer outro elemento','Fe-56 não existe na natureza'], ans:1, exp:'A curva de energia de ligação por nucleon tem máximo no Fe-56 (~8,8 MeV/nucleon). Núcleos mais pesados (U-235) liberam energia ao fissionar em direção ao Fe. Núcleos mais leves (H, D) liberam energia ao fundir em direção ao Fe. Fe-56 é o "fundo do poço" energético nuclear.', hint:'Fe-56: máximo da curva de energia de ligação → mais estável. Ambos os lados (fissão e fusão) liberam energia em direção ao Fe.' },
  { q:'O princípio da PET (tomografia por emissão de pósitrons) baseia-se em:', opts:['Absorção de raios gama externos','Emissão β⁺ de ¹⁸F-FDG: pósitron aniquila com elétron gerando 2 fótons γ de 511 keV em direções opostas','Desintegração alfa de Tc-99m','Fissão de U dentro do corpo'], ans:1, exp:'¹⁸F-FDG (fludesoxiglicose) é captada por tecidos com alto metabolismo (tumores). ¹⁸F → β⁺ + ν → positrón aniquila com e⁻ → 2γ de 511 keV em 180°. Detectar esses pares em coincidência localiza a fonte com resolução < 1 mm.', hint:'PET: β⁺ → aniquilação → 2 fótons de 511 keV em sentidos opostos → localização.' },
  { q:'A série de decaimento do U-238 termina no Pb-206 após múltiplos decaimentos. O número de partículas α emitidas é:', opts:['4','6','8','10'], ans:2, exp:'U-238 → Pb-206. ΔA = 238-206 = 32. Cada α remove 4 de A → 32/4 = 8 partículas α. (ΔZ = 92-82 = 10; cada α remove 2 de Z, 8α removem 16 de Z; diferença de β⁻: 10-16+6=0 → 6 decaimentos β⁻). Série: U-238 → Pb-206 com 8α e 6β⁻.', hint:'Cada α: ΔA=-4. ΔA(total)=238-206=32. Número de α = 32/4 = 8.' },
  { q:'A datação por Rb-87/Sr-87 (t½=48,8 Ga) é usada em geologia para:', opts:['Datar amostras de até 50.000 anos (como ¹⁴C)','Datar rochas antigas (>100 Ma) — a meia-vida longa permite medir tempos geológicos','Medir atividade de vulcões','Datar materiais orgânicos'], ans:1, exp:'¹⁴C: t½ = 5730 anos → útil até ~50.000 anos (10 meias-vidas). Para rochas com bilhões de anos, usa-se ⁸⁷Rb→⁸⁷Sr (t½=48,8 Ga) ou U-Pb (t½=4,47 Ga). A Terra tem ~4,54 Ga, compatível com U-Pb.', hint:'Método de datação: t½ deve ser comparável à idade a medir. Curta t½ → amostras jovens. Longa t½ → amostras antigas.' },
  { q:'A fissão do U-235 é uma reação em cadeia quando:', opts:['Cada evento de fissão produz exatamente 1 nêutron','Os nêutrons emitidos (média 2,5) podem causar novas fissões antes de escapar (massa crítica)','Os nêutrons se combinam com os elétrons','O urânio está enriquecido acima de 90%'], ans:1, exp:'Fissão do U-235 libera 2-3 nêutrons. Se ao menos 1 nêutron por fissão causar nova fissão (k≥1), inicia-se cadeia. k<1: subcrítico. k=1: crítico (reator). k>1: supercrítico (bomba). Moderador (água leve/pesada) desacelera nêutrons para que U-235 os absorva eficientemente.', hint:'k>1: supercrítico = explosão. k=1: crítico = reator controlado. k<1: subcrítico = apaga.' },
  { q:'A dose eficaz em radioproteção é medida em Sievert (Sv) porque:', opts:['Sv = Gy (dose absorvida) × fator de qualidade Q — considera o dano biológico diferente de cada radiação','Sv mede apenas a energia depositada','Sv é igual ao Gray para todos os tipos de radiação','Sv mede a atividade da fonte'], ans:0, exp:'Gy (Gray) = energia absorvida (J/kg). Sv = Gy × Q × fator tecido. Q(α)=20; Q(β,γ)=1; Q(nêutron)=5-20. Α causa 20× mais dano biológico que γ para a mesma dose absorvida. Dose máxima ocupacional: 20 mSv/ano (IAEA).', hint:'Sv = Gy × fator de qualidade. α causa mais dano → Q=20.' },
  { q:'O decaimento beta-menos (β⁻) transforma:', opts:['Próton em nêutron + e⁺ + neutrino','Nêutron em próton + e⁻ + antineutrino (Z aumenta 1, A constante)','Nêutron em próton + fóton','Núcleo em dois fragmentos'], ans:1, exp:'β⁻: n → p + e⁻ + ν̄_e. Z aumenta 1; A não muda. Ex: ¹⁴C → ¹⁴N + β⁻ + ν̄. β⁺ (pósitron): p → n + e⁺ + ν_e (Z diminui 1). Captura eletrônica: p + e⁻ → n + ν (Z diminui 1).', hint:'β⁻: n→p. Z+1. β⁺: p→n. Z-1. A constante nos dois casos.' }
];

export function render(outlet) {
  if (_loop) { _loop.stop(); _loop=null; }
  _isoIdx=0; _n0=100; _exAttempts=0; _exDone=false;

  const isoCanvasBtns = ISOTOPES.map((iso,i) =>
    `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="iso-btn-${i}" data-isoidx="${i}">${iso.symbol}</button>`
  ).join('');
  const isoHlBtns = ISOTOPES.map((iso,i) =>
    `<button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="hliso-btn-${i}" data-hliso="${i}">${iso.symbol}</button>`
  ).join('');
  const exOpts = EXERCISES[0].opts.map((opt,i) =>
    `<button class="btn btn-ghost" style="text-align:left;justify-content:flex-start" id="ex-opt-${i}" data-exopt="${i}">${esc(opt)}</button>`
  ).join('');

  outlet.innerHTML = `
<div class="page module-page">
  <button class="module-back btn-ghost" data-nav="/modules">&larr; Módulos</button>
  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/>
      </svg>
    </div>
    <div><h1 class="module-title">Química Nuclear</h1>
    <p class="module-subtitle">Radioatividade, meia-vida, fissão, fusão e aplicações.</p></div>
  </header>

  <section class="module-section">
    <h2 class="module-section-title">Fenômeno</h2>
    <p class="module-text">Núcleos instáveis emitem partículas e energia para atingir configurações estáveis — isso é radioatividade. Becquerel descobriu em 1896 ao deixar urânio sobre chapa fotográfica. A meia-vida (t½) é o tempo para metade dos núcleos decair: de 10⁻¹⁷ s (Be-8) a 4,5×10⁹ anos (U-238).</p>
    <p class="module-text"><strong>N(t) = N₀ × e^(-λt) = N₀ × (½)^(t/t½)</strong>, onde λ = ln2/t½ é a constante de decaimento. A atividade A = λN decresce à mesma taxa.</p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Tipos de radiação</h2>
    <p class="module-text">
      A radioatividade é um processo <em>estocástico</em>: não se pode prever qual núcleo individual
      vai decair, mas a taxa macroscópica é perfeitamente determinística — lei de decaimento de
      primeira ordem. Cada tipo de decaimento conserva o número de massa A, o número atômico Z,
      energia, momento e carga de forma diferente, o que determina o produto formado.
    </p>
    <p class="module-text">
      A <strong>energia de ligação nuclear</strong> é a origem de toda a energia nuclear.
      Um núcleo pesa menos que a soma de seus prótons e nêutrons livres — a diferença de massa
      (defeito de massa Δm) é convertida em energia de ligação: E = Δm·c². Para o ²He⁴:
      Δm = 2(1,00728 + 1,00867) - 4,00260 = 0,03038 u → E = 28,3 MeV (7,07 MeV/nucleon).
      Estabilidade: Z/N próximo de 1 para elementos leves; ~0,6 para pesados (banda de estabilidade).
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Alfa (α)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">²²⁶Ra → ²²²Rn + ⁴He</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted)">Carga +2 | 4 u | detida por papel | perigosa se inalada (²²²Rn)</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-electron)">Beta⁻ (β⁻)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">¹⁴C → ¹⁴N + e⁻ + antineutrino</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted)">Carga -1 | nêutron→próton | detida por alumínio | base datação ¹⁴C</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-organic)">Beta⁺ (β⁺)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">¹⁸F → ¹⁸O + e⁺ + neutrino</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted)">Carga +1 | próton→nêutron | aniquila com e⁻ → 2γ 511 keV | PET scan</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-bond)">Gama (γ)</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">⁶⁰Co* → ⁶⁰Co + γ</p>
        <p style="font-size:var(--text-xs);color:var(--text-muted)">Carga 0 | fóton altamente energético | requer chumbo/concreto | radioterapia</p></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Simulação de decaimento</h2>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.75rem">${isoCanvasBtns}</div>
    <div class="canvas-frame"><canvas id="nuclear-canvas"></canvas></div>
    <p id="iso-info" style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.5rem">Carbono-14 | t½ = 5730 anos</p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Calculadora de meia-vida</h2>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem">${isoHlBtns}</div>
    <div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:200px;font-size:var(--text-sm);color:var(--text-secondary)">Núcleos iniciais N₀:</label>
        <input type="range" id="hl-n0" min="10" max="10000" step="10" value="100" style="width:140px;accent-color:var(--accent-electron)">
        <span id="hl-n0-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:60px">100</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <label style="min-width:200px;font-size:var(--text-sm);color:var(--text-secondary)">Número de meias-vidas:</label>
        <input type="range" id="hl-n" min="1" max="20" step="1" value="1" style="width:140px;accent-color:var(--accent-reaction)">
        <span id="hl-n-val" style="font-size:var(--text-sm);color:var(--accent-reaction);min-width:30px">1</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
      <div id="hl-bar" style="height:14px;background:var(--accent-electron);border-radius:3px;transition:width .3s;min-width:2px;width:220px"></div>
      <span style="font-size:var(--text-xs);color:var(--text-muted)">fração restante</span>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Núcleos restantes</p><div id="hl-remaining" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">50,00</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Porcentagem</p><div id="hl-percent" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-organic)">50,0000%</div></div>
      <div class="info-card"><p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.4rem">Tempo decorrido</p><div id="hl-elapsed" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-bond)">5730 anos</div></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Fissão e Fusão</h2>
    <p class="module-text">
      <strong>Fissão nuclear:</strong> um núcleo pesado (U-235, Pu-239) absorve um nêutron
      lento (térmico) e se divide em dois fragmentos médios mais 2–3 nêutrons livres.
      Cada evento libera ~200 MeV. Se cada nêutron liberado induzir nova fissão, tem-se
      uma <em>reação em cadeia autossustentada</em>. A massa crítica é a quantidade mínima
      de material físsil para isso ocorrer. Em reatores, moderadores (água, grafite) freiam
      nêutrons; varetas de controle (Cd, B) absorvem nêutrons para regular a taxa.
    </p>
    <p class="module-text">
      <strong>Fusão nuclear:</strong> dois núcleos leves (D + T → He-4 + n) se fundem,
      liberando ~17,6 MeV por reação — relação energia/massa 4× maior que a fissão.
      A barreira coulombiana exige T &gt; 10⁸ K (temperatura solar). O Sol mantém fusão
      pelo próprio peso gravitacional; em reatores terrestres (tokamak, Z-machine) o
      confinamento é magnético (ITER) ou inercial (laser NIF). A fusão não gera resíduos
      de longa vida e o combustível (deutério da água do mar) é virtualmente ilimitado.
    </p>
    <div class="module-grid" style="grid-template-columns:1fr 1fr">
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-reaction)">Fissão nuclear</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">²³⁵U + n → ⁹²Kr + ¹⁴¹Ba + 3n + E</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.5rem">Núcleo pesado se divide. Déficit de massa Δm → E = Δmc². Reatores e bombas atômicas. Reação em cadeia: 1 fissão → 3 nêutrons → 3 fissões → 9 nêutrons...</p></div>
      <div class="info-card"><h3 style="margin-top:0;color:var(--accent-electron)">Fusão nuclear</h3>
        <p style="font-family:monospace;font-size:var(--text-sm)">²H + ³H → ⁴He + n + 17,6 MeV</p>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:.5rem">Núcleos leves se unem. Fonte do Sol (pp-chain, CNO cycle). Exige T > 10⁷ K. Tokamak ITER (França) em construção para fusão controlada.</p></div>
    </div>
    <p class="module-text" style="margin-top:.75rem">Fe-56 tem a maior energia de ligação por nucleon. Elementos mais pesados liberam energia por fissão; mais leves por fusão.</p>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Dose e unidades</h2>
    <p class="module-text">
      A perigosidade da radiação depende do <em>tipo</em>, da <em>energia</em> e do
      <em>tecido irradiado</em>. A grandeza mais relevante para proteção radiológica é
      a <strong>dose efetiva</strong> em sievert (Sv): produto da dose absorvida (Gy = J/kg)
      pelo fator de qualidade da radiação (wR: fótons e elétrons = 1; prótons = 5;
      partículas α = 20; nêutrons = 5–20 dependendo da energia) e pelo fator de tecido (wT).
      Exposição natural média: ~2,4 mSv/ano (radon residencial: ~1,2 mSv; cósmico: ~0,39 mSv;
      terrestre: ~0,48 mSv). Limite anual para trabalhadores: 20 mSv. TC de tórax: ~7 mSv.
      Limiar de efeito determinístico agudo: ~250 mSv; Síndrome de irradiação aguda: &gt;1 Sv.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      <div class="info-card"><h3 style="margin-top:0">Becquerel (Bq)</h3><p style="font-size:var(--text-sm)">1 desintegração/s. 1 Ci = 3,7×10¹⁰ Bq.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Gray (Gy)</h3><p style="font-size:var(--text-sm)">Dose absorvida: 1 J/kg de tecido.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Sievert (Sv)</h3><p style="font-size:var(--text-sm)">Sv = Gy × Q. Raios γ: Q=1; partículas α: Q=20.</p></div>
      <div class="info-card"><h3 style="margin-top:0">Referências</h3><p style="font-size:var(--text-sm)">Natural: ~2,4 mSv/ano. Limiar risco: ~100 mSv. Dose letal: ~4–5 Sv.</p></div>
    </div>
  </section>

  <section class="module-section">
    <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/5)</h2>
    <p class="module-text">${esc(EXERCISES[0].q)}</p>
    <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.75rem">${exOpts}</div>
    <div id="exercise-feedback" style="margin-top:1rem"></div>
    <button class="btn btn-ghost btn-sm" id="ex-next" style="margin-top:1rem;display:none">Próximo exercício &#8594;</button>
  </section>

  <div class="real-life-card">
    <div class="real-life-label">No cotidiano</div>
    <p class="module-text">⁹⁹ᵐTc é usado em 80% dos exames de medicina nuclear. PET com ¹⁸F-FDG detecta tumores. ¹⁴C datou a Mortalha de Turim e os Manuscritos do Mar Morto. Usinas nucleares geram 10% da eletricidade mundial com emissão de CO₂ quase zero durante operação. Radioterapia com γ trata ~50% dos tumores sólidos.</p>
  </div>
</div>
`;

  const canvas = document.getElementById('nuclear-canvas');
  if (canvas) startDecayCanvas(canvas);
  calcHalflife();

  ISOTOPES.forEach((iso, i) => {
    document.getElementById('iso-btn-'+i)?.addEventListener('click', () => {
      _isoIdx=i;
      ISOTOPES.forEach((_,j) => { const b=document.getElementById('iso-btn-'+j); if(b) b.className='btn btn-xs '+(j===i?'btn-secondary':'btn-ghost'); });
      const info=document.getElementById('iso-info'); if(info) info.textContent=iso.name+' | t½ = '+iso.t12+' '+iso.unit;
      if(_loop){_loop.stop();_loop=null;}
      const c=document.getElementById('nuclear-canvas'); if(c) startDecayCanvas(c);
    });
    document.getElementById('hliso-btn-'+i)?.addEventListener('click', () => {
      _isoIdx=i;
      ISOTOPES.forEach((_,j) => { const b=document.getElementById('hliso-btn-'+j); if(b) b.className='btn btn-xs '+(j===i?'btn-secondary':'btn-ghost'); });
      calcHalflife();
    });
  });
  document.getElementById('hl-n0')?.addEventListener('input', e => {
    _n0=parseInt(e.target.value,10); const v=document.getElementById('hl-n0-val'); if(v) v.textContent=_n0; calcHalflife();
  });
  document.getElementById('hl-n')?.addEventListener('input', e => {
    const v=document.getElementById('hl-n-val'); if(v) v.textContent=e.target.value; calcHalflife();
  });
  
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
          markSectionDone('nuclear', 'exercise');
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
  });
}

export function destroy() { if(_loop){_loop.stop();_loop=null;} }
