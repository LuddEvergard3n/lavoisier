/**
 * modules/spectroscopy/index.js — Módulo: Espectroscopia
 * Lavoisier — Laboratório Visual de Química
 *
 * Cobre Graduação 2º ano+:
 *  - Lei de Beer-Lambert (intensidade vs concentração/comprimento)
 *  - Espectroscopia IV: regiões, bandas diagnóstico por função orgânica
 *  - RMN ¹H básico: deslocamento químico δ, multiplicidade, integração
 *  - Espectrometria de massas: íon molecular, fragmentação, razão m/z
 *  - UV-Vis: transições eletrônicas, cromóforos, efeitos auxocrômicos
 *  - Canvas: espectro IV simulado interativo (slider de molécula)
 *  - Canvas: espectro de massas simplificado
 */

import { esc }                from '../../js/ui.js';
import { markSectionDone }    from '../../js/state.js';
import { clearCanvas, COLOR } from '../../js/engine/renderer.js';

// ---------------------------------------------------------------------------
// Dados — IR bands por função
// ---------------------------------------------------------------------------

const IR_GROUPS = [
  {
    name: 'Álcool (R–OH)',
    color: '#4fc3f7',
    bands: [
      { wn: 3300, width: 200, intensity: 0.95, label: 'O–H estiramento (largo, LH)' },
      { wn: 1050, width:  60, intensity: 0.75, label: 'C–O estiramento' },
    ],
    note: 'Banda larga e intensa em 3200–3550 cm⁻¹ é diagnóstica de O–H livre ou associado por H-bond. Em fase líquida, LH alarga muito a banda.',
  },
  {
    name: 'Carbonila C=O (cetona/éster)',
    color: '#ffd166',
    bands: [
      { wn: 1715, width: 40,  intensity: 1.00, label: 'C=O estiramento (cetona)' },
    ],
    note: 'Banda de C=O é a mais intensa e diagnóstica. Cetona ≈ 1715 cm⁻¹, éster ≈ 1735 cm⁻¹ (C=O + C–O enfraquece ligação), ácido carboxílico ≈ 1710 cm⁻¹ (dímero). Aldeído adiciona C–H ≈ 2720/2820 cm⁻¹.',
  },
  {
    name: 'Ácido carboxílico (R–COOH)',
    color: '#ef476f',
    bands: [
      { wn: 3000, width: 500, intensity: 0.70, label: 'O–H estiramento (muito largo, dímero)' },
      { wn: 1710, width:  50, intensity: 1.00, label: 'C=O estiramento' },
      { wn: 1250, width:  60, intensity: 0.60, label: 'C–O estiramento' },
    ],
    note: 'Banda O–H de ácido: larguíssima, centrada em ~3000 cm⁻¹, sobrepõe C–H. Formação de dímero por H-bond explica a largura extrema.',
  },
  {
    name: 'Amina (R–NH₂)',
    color: '#6bcb77',
    bands: [
      { wn: 3350, width: 80,  intensity: 0.70, label: 'N–H estiramento (dois picos, 1ária)' },
      { wn: 3250, width: 80,  intensity: 0.65, label: 'N–H estiramento (segundo pico)' },
      { wn: 1600, width: 50,  intensity: 0.55, label: 'N–H deformação' },
    ],
    note: 'Amina primária: dois picos N–H (simétrico e assimétrico). Amina secundária: um pico. Terciária: ausência de N–H. Bandas mais estreitas que O–H de álcool.',
  },
  {
    name: 'Alcino terminal (R–C≡CH)',
    color: '#a78bfa',
    bands: [
      { wn: 3300, width: 30,  intensity: 0.85, label: 'C≡C–H estiramento (estreito, forte)' },
      { wn: 2120, width: 40,  intensity: 0.55, label: 'C≡C estiramento' },
    ],
    note: 'C≡C–H em 3300 cm⁻¹ é estreito e forte (contraste com O–H largo). A tripla ligação C≡C em ~2100–2260 cm⁻¹ é região diagnóstica; alcinos internos simétricos podem ser fracos ou ausentes (ΔP = 0).',
  },
  {
    name: 'Alcano (C–H sp³)',
    color: '#b0b8c1',
    bands: [
      { wn: 2960, width: 40, intensity: 0.70, label: 'C–H assimétrico' },
      { wn: 2870, width: 30, intensity: 0.55, label: 'C–H simétrico' },
      { wn: 1460, width: 30, intensity: 0.45, label: 'CH₂ tesoura' },
      { wn: 1375, width: 25, intensity: 0.40, label: 'CH₃ guarda-chuva' },
    ],
    note: 'C–H sp³ abaixo de 3000 cm⁻¹ — importante para distinguir de C–H sp² (≈3030 cm⁻¹) e C≡C–H (3300 cm⁻¹). As bandas 1460 e 1375 cm⁻¹ confirmam metila (CH₃).',
  },
];

// ---------------------------------------------------------------------------
// Dados — RMN ¹H ambientes
// ---------------------------------------------------------------------------

const NMR_ENVIRONMENTS = [
  { env: 'TMS (referência)',       delta_min: 0.0,  delta_max: 0.0,  color: '#555', desc: 'Tetrametilsilano — referência zero. Si muito eletrodaor → elétrons blindam H.' },
  { env: 'R–CH₃ (alkyl)',          delta_min: 0.7,  delta_max: 1.3,  color: '#b0b8c1', desc: 'Prótons de metila de cadeia alifática. Alta blindagem eletrônica.' },
  { env: 'R–CH₂–R',               delta_min: 1.2,  delta_max: 1.6,  color: '#b0b8c1', desc: 'Metileno. Ligeiramente mais desblindado que CH₃.' },
  { env: 'R–CH₂–X (X = O, N, hal)', delta_min: 2.2, delta_max: 4.5, color: '#ffd166', desc: 'Efeito indutivo de X retira densidade eletrônica → desblindagem. Mais X ou mais eletronegativo → maior δ.' },
  { env: 'Aromático (Ar–H)',        delta_min: 6.5,  delta_max: 8.5,  color: '#6bcb77', desc: 'Anel aromático: corrente de anel + desblindagem anisotrópica. O campo magnético induzido desblinda H fora do anel.' },
  { env: 'Aldeído (–CHO)',          delta_min: 9.4,  delta_max: 10.5, color: '#ef476f', desc: 'C=O muito desblindante. H ligado a C=O ácido. δ alto e característico.' },
  { env: 'Ácido (–COOH)',          delta_min: 10.5, delta_max: 12.0, color: '#ef476f', desc: 'O–H de ácido carboxílico: mais desblindado. Sinal largo, variável com solvente/concentração.' },
  { env: 'Álcool (R–OH)',          delta_min: 0.5,  delta_max: 5.0,  color: '#4fc3f7', desc: 'O–H de álcool: δ variável (0,5–5 ppm), amplo. Sinal some com D₂O (troca H/D).' },
];

// ---------------------------------------------------------------------------
// Dados — Espectrometria de massas — fragmentos comuns
// ---------------------------------------------------------------------------

const MS_MOLECULES = [
  {
    name: 'Propan-2-ol (M = 60)',
    M: 60,
    peaks: [
      { mz: 60,  rel: 20,  label: 'M⁺• (íon molecular)' },
      { mz: 45,  rel: 100, label: 'M-15 (perde CH₃)' },
      { mz: 43,  rel: 80,  label: 'CH₃CO⁺ / C₃H₇⁺' },
      { mz: 31,  rel: 15,  label: 'CHO⁺ / CH₂OH⁺' },
      { mz: 27,  rel: 30,  label: 'C₂H₃⁺' },
    ],
    note: 'Álcool secundário: perda de CH₃ (15) gera fragmento estabilizado por O. Pico base (100%) em m/z = 45.',
  },
  {
    name: 'Butanona (M = 72)',
    M: 72,
    peaks: [
      { mz: 72,  rel: 30,  label: 'M⁺•' },
      { mz: 57,  rel: 100, label: 'M-15 (perde CH₃) → RC≡O⁺' },
      { mz: 43,  rel: 90,  label: 'CH₃C≡O⁺ (acílio)' },
      { mz: 29,  rel: 40,  label: 'C₂H₅⁺' },
    ],
    note: 'Cetona: dois tipos de clivagem α-carbonílica (homólise do C–C adjacente à C=O). Fragmentos acílio R–C≡O⁺ são estáveis.',
  },
  {
    name: 'Bromobenzeno (M = 156/158)',
    M: 156,
    peaks: [
      { mz: 158, rel: 95,  label: 'M+2 (¹⁸¹Br, 50%)' },
      { mz: 156, rel: 100, label: 'M⁺• (⁷⁹Br, 50%)' },
      { mz: 77,  rel: 70,  label: 'C₆H₅⁺ (fenila)' },
      { mz: 51,  rel: 35,  label: 'C₄H₃⁺' },
    ],
    note: 'Clássico padrão isotópico de bromo: dois picos M:M+2 com razão ≈ 1:1. Fragmento m/z = 77 confirma anel benzênico.',
  },
];

// ---------------------------------------------------------------------------
// UV-Vis transitions
// ---------------------------------------------------------------------------

const UV_TRANSITIONS = [
  { type: 'σ → σ*', range: '< 150 nm', color: '#a78bfa', desc: 'Apenas em vácuo-UV. Ligações C–C, C–H. Não acessível em espectrômetro convencional.' },
  { type: 'n → σ*', range: '150–250 nm', color: '#4fc3f7', desc: 'Par solitário de heteroátomo (O, N, S, X) para σ*. Εmax baixo (~100 L/mol·cm). Aminas, álcoois.' },
  { type: 'π → π*', range: '160–250 nm', color: '#ffd166', desc: 'Sistema π conjugado (alcenos, aromáticos). Εmax alto (10³–10⁵). Cromóforo principal em orgânica. Conjugação estende absorção para comprimentos maiores (batocrômico).' },
  { type: 'n → π*', range: '250–400 nm', color: '#6bcb77', desc: 'Par solitário → π* de C=O, C=N. Εmax baixo (~10–100). Proibida por simetria em muitos casos. Responsável pela cor de cetonas, nitro, azo.' },
  { type: 'transferência de carga', range: '200–700 nm', color: '#ef476f', desc: 'Complexos de metais de transição, moléculas D-A. Alta ε, cor intensa. Ex: violeta de cristal, permanganato (MnO₄⁻).' },
];

const EXERCISES = [
  {
    q: 'Uma cetona alifática (R–CO–R) sem outros grupos funcionais exibe, no espectro IV, uma banda intensa em qual região?',
    opts: ['3200–3550 cm⁻¹ (O–H largo)', '1710–1720 cm⁻¹ (C=O)', '2100–2260 cm⁻¹ (C≡C)', '3300 cm⁻¹ (C≡C–H estreito)'],
    ans: 1,
    exp: 'A banda de estiramento C=O de cetona aparece em ~1715 cm⁻¹ — a mais intensa do espectro. Éster: ~1735 cm⁻¹ (mais alto por efeito de mesomeria). Aldeído: ~1720 cm⁻¹ + C–H ≈ 2720/2820 cm⁻¹.',
    hint: 'A região 1680–1750 cm⁻¹ é exclusiva de ligações duplas C=O. Qual é a função do composto?',
  },
  {
    q: 'No RMN ¹H do etanol (CH₃CH₂OH), os prótons do CH₃ (tripleto) aparecem em δ ≈ 1,2 ppm. Por que os prótons do CH₂ aparecem em δ ≈ 3,7 ppm?',
    opts: [
      'Acoplamento com O–H aumenta o sinal',
      'O oxigênio retira densidade eletrônica por efeito indutivo, desblindando os H do CH₂',
      'CH₂ tem mais prótons que CH₃',
      'O CH₂ fica mais próximo do TMS',
    ],
    ans: 1,
    exp: 'O oxigênio (eletronegativo) retira elétrons do C adjacente por efeito indutivo, reduzindo a blindagem dos prótons do CH₂. Menos blindagem → campo externo maior necessário → δ maior. Isso é efeito indutivo-anisotrópico: O–CH₂ vs CH₃ sem heteroátomo vizinho.',
    hint: 'δ maior = mais desblindado. Qual grupo está mais próximo do O em cada caso?',
  },
  {
    q: 'O espectro de massas de um composto orgânico mostra dois picos de mesma intensidade em m/z = 78 e 80. Isso é diagnóstico de:',
    opts: [
      'Presença de dois isótopos de carbono (¹²C/¹³C)',
      'Presença de um átomo de bromo (⁷⁹Br/⁸¹Br, 1:1)',
      'Fragmentação α de um álcool',
      'Transição n → π* no UV',
    ],
    ans: 1,
    exp: 'Bromo tem dois isótopos estáveis: ⁷⁹Br (50,5%) e ⁸¹Br (49,5%) — proporção quase 1:1. Isso gera dois picos M e M+2 de intensidades iguais, padrão isotópico diagnóstico. Cloro tem padrão M:M+2 ≈ 3:1 (⁳⁵Cl 75%, ³⁷Cl 25%).',
    hint: 'Dois picos separados por 2 unidades de massa com intensidades iguais — qual elemento tem dois isótopos em proporção 1:1?',
  },

  { q: 'Um CH₂ ao lado de C=O aparece em RMN ¹H a δ ≈ 2,5 ppm. Por quê é desblindado?', opts: ['Efeito de anel benzênico','Efeito indutivo do C=O — retira densidade eletrônica do CH₂','Campo magnético interno mais forte','Presença de halogênio'], ans: 1, exp: 'O grupo C=O é fortemente retirador de elétrons por indução. Menos densidade eletrônica no CH₂ → campo externo necessário menor → δ maior (desblindado).', hint: 'Grupos retiradores de elétrons próximos aumentam ou diminuem o deslocamento químico δ?' },
  { q: 'Na espectrometria de massa, o pico do íon molecular M⁺ representa:', opts: ['O fragmento mais abundante','A molécula que perdeu um elétron mas permanece intacta','O fragmento mais leve','O produto de recombinação'], ans: 1, exp: 'M⁺ (ou M•⁺): molécula original ionizada por perda de um elétron. m/z = M_molecular. A abundância relativa depende da estabilidade do radical cátion.', hint: 'M⁺ é a molécula inteira menos um elétron. O que isso diz sobre m/z?' },,
  { q:'No espectro IV, a banda em ~1715 cm⁻¹ é característica de:', opts:['O-H livre de álcool','C=O de cetona (estiramento carbonílico)','C-H sp³','N-H de amina primária'], ans:1, exp:'A banda do estiramento C=O é a mais intensa e diagnóstica no IV. Cetona: ~1715 cm⁻¹. Aldeído: ~1725. Éster: ~1735. Ácido: ~1710. Amida: ~1680. Arilcetona: ~1680 (conjugação abaixa a frequência).', hint:'C=O cetona: ~1715 cm⁻¹. Mais conjugação = frequência mais baixa.' },
  { q:'Um espectro de RMN ¹H mostra um tripleto a δ 1,2 ppm (3H) e um quarteto a δ 3,5 ppm (2H). Qual o fragmento mais provável?', opts:['-CH₂-CH₃ como em éster etílico (EtO-)','Dois CH₃ isolados','Anel aromático','Aldeído'], ans:0, exp:'Tripleto (n+1=3 → n=2 vizinhos) para 3H = CH₃ com 2H vizinhos. Quarteto (n+1=4 → n=3 vizinhos) para 2H = CH₂ com 3H vizinhos. O fragmento -CH₂CH₃ (etil) dá exatamente quarteto+tripleto. Em etanol ou ésteres etílicos, δ(CH₂) ≈ 3-4 ppm.', hint:'Multiplicidade = n+1 onde n = n° de H vizinhos. Tripleto → 2 vizinhos.' },
  { q:'Na espectroscopia UV-Vis, uma solução com absorbância A=0,30 transmite que porcentagem de luz?', opts:['30%','70%','50%','~50%'], ans:2, exp:'A = -log(T). T = 10^(-A) = 10^(-0,30) = 0,501 ≈ 50%. Absorbância 0,30 = transmitância 50%. A escala log de absorbância comprime valores: A=1 → T=10%; A=2 → T=1%.', hint:'T = 10^(-A). A = -log(T). A=0,3: T = 10^(-0,3) ≈ 0,5 = 50%.' },
  { q:'O deslocamento químico δ no RMN ¹H de um H em anel aromático (~7-8 ppm) é maior que de H alifático (~1 ppm) porque:', opts:['Carbonos sp² são maiores','A corrente de anel diamagnética dos elétrons π desblinda os H externos ao anel','H aromático tem mais ligações de H','O anel absorve campos mais fortes'], ans:1, exp:'Corrente de anel: o campo magnético externo induz circulação dos elétrons π do benzeno, gerando campo secundário. Fora do anel (onde estão os H): campo secundário somado ao externo → desblindagem → δ maior. Dentro do anel ou acima/abaixo: blindagem → δ menor (ex: [18]anuleno interno: δ=-3 ppm).', hint:'Corrente de anel: H fora do anel = desblindado (δ alto). H dentro = blindado (δ baixo).' },
  { q:'A espectroscopia de massa determina a fórmula molecular de compostos orgânicos porque:', opts:['Fragmenta apenas ligações C-C','O pico do íon molecular M⁺ dá a massa molar exata; com alta resolução, a fórmula molecular exata é determinada','Absorve UV proporcionalmente ao peso molecular','Mede a carga dos elétrons do composto'], ans:1, exp:'MS de alta resolução mede a massa exata do M⁺ com precisão de mDa. Como ¹²C, ¹H, ¹⁴N, ¹⁶O têm massas exatas não-inteiras (ex: ¹H=1,00783 Da), combinações diferentes de C,H,N,O dão massas diferentes → fórmula molecular única. Ex: C₂H₆O e CH₂O₂ têm mesma massa nominal (46) mas massas exatas diferentes.', hint:'HRMS: massa exata → combinação única de C,H,N,O,S → fórmula molecular.' },
  { q:'A espectroscopia Raman é complementar ao IV porque:', opts:['Mede as mesmas vibrações que o IV com maior sensibilidade','Vibrações IV-ativas têm Δμ≠0; vibrações Raman-ativas têm Δα≠0 — moléculas com centro de inversão têm regra de exclusão mútua','Raman usa raios-X; IV usa luz visível','Raman não pode analisar líquidos'], ans:1, exp:'Regra de seleção: IV requer variação do momento dipolar (Δμ≠0). Raman requer variação da polarizabilidade (Δα≠0). Moléculas com centro de inversão (i): modos IV-ativos são Raman-inativos e vice-versa (regra de exclusão mútua). CO₂: modo de estiramento simétrico (Raman) vs. antissimétrico (IV).', hint:'IV: Δμ≠0. Raman: Δα≠0. Com centro de inversão: exclusão mútua.' },
  { q:'No experimento de ressonância de spin eletrônico (RPE/ESR), o que é detectado?', opts:['Núcleos com spin ½ como ¹H','Espécies com elétrons desemparelhados (radicais, complexos paramagnéticos)','Todos os compostos orgânicos','Apenas metais de transição isolados'], ans:1, exp:'RPE detecta transições entre estados de spin eletrônico em campo magnético. Requer elétrons desemparelhados: radicais livres (DPPH, O₂), metais de transição (Cu²⁺, Fe³⁺, Mn²⁺), defeitos em sólidos. Complementar ao RMN (que detecta spins nucleares).', hint:'RPE: elétrons desemparelhados. RMN: spins nucleares. RPE detecta radicais.' },
  { q:'A fluorescência acontece em escala de tempo de nanosegundos e a fosforescência em milissegundos a segundos porque:', opts:['Fluorescência usa fótons de menor energia','Fluorescência é S₁→S₀ (mesma multiplicidade, permitida); fosforescência é T₁→S₀ (spin proibida — mais lenta)','A fosforescência envolve mais energia','Fluorescência ocorre no IV; fosforescência no UV'], ans:1, exp:'Fluorescência: S₁→S₀ (singleto→singleto), transição permitida por spin → 10⁻⁹ s. Fosforescência: T₁→S₀ (tripleto→singleto), proibida por spin — requer acoplamento spin-órbita → 10⁻³-10² s. A proibição de spin retarda muito a emissão.', hint:'Spin permitida (S→S): rápida (ns). Spin proibida (T→S): lenta (ms-s).' },
  { q:'A espectroscopia de absorção atômica (AAS) é seletiva para cada elemento porque:', opts:['Cada elemento tem comprimento de onda de absorção único (espectro atômico discreto)','Usa filtros de cores diferentes para cada metal','Cada elemento tem massa atômica diferente','A temperatura da chama seleciona os elementos'], ans:0, exp:'Átomos gasosos em chama ou forno absorvem fótons em comprimentos de onda exatamente iguais aos das suas transições eletrônicas (específicas para cada elemento). Fonte: lâmpada de cátodo oco do mesmo elemento → emite linha característica → amostra absorve proporcionalmente à concentração. AAS é altamente seletivo e sensível (ppb).', hint:'Cada elemento tem linhas de absorção únicas. AAS usa lâmpada do mesmo elemento como fonte.' },
  { q:'No RMN ¹³C, o DEPT (Distortionless Enhancement by Polarization Transfer) distingue:', opts:['Diferentes isótopos de carbono','CH₃, CH₂, CH e C quaternário — pelo número de H diretamente ligados ao carbono','Carbonos sp e sp²','Carbonos aromáticos de carbonos alifáticos apenas'], ans:1, exp:'DEPT 135: CH e CH₃ apontam para cima; CH₂ aponta para baixo; C quaternário não aparece. Fundamental para identificar estruturas orgânicas: carbonila (C quaternário, ausente no DEPT), CH₂ de cadeia (para baixo), etc. Complementa o RMN ¹³C padrão que mostra todos os carbonos.', hint:'DEPT diferencia CH₃, CH₂, CH (por fase no espectro) e C quaternário (ausente).' }
];

let _irIdx      = 0;
let _msIdx      = 0;
let _exIdx      = 0;
let _exAttempts = 0;
let _exDone     = false;

// ---------------------------------------------------------------------------
export function render(outlet) {
  _irIdx = 0; _msIdx = 0;
  _exIdx = 0; _exAttempts = 0; _exDone = false;

  outlet.innerHTML = _buildHTML();
  _initSpectroscopy();
  markSectionDone('spectroscopy', 'visited');
}

// ---------------------------------------------------------------------------
function _buildHTML() {
  return `
<div class="module-page" id="module-spectroscopy">
  <button class="module-back btn-ghost" data-nav="/modules">&#8592; Módulos</button>

  <header class="module-header">
    <div class="module-header-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
           stroke-width="1.8" aria-hidden="true">
        <path d="M3 18l9-14 9 14H3z"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </div>
    <div>
      <h1 class="module-title">Espectroscopia</h1>
      <p class="module-subtitle">IV, RMN ¹H, espectrometria de massas, UV-Vis e identificação estrutural.</p>
    </div>
  </header>

  <!-- ============================================================
       BEER-LAMBERT
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Lei de Beer-Lambert</h2>
    <p class="module-text">
      A base quantitativa de toda espectroscopia de absorção. A absorbância é
      proporcional à concentração e ao caminho óptico.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-base);color:var(--accent-electron);margin-bottom:.4rem">
        A = ε · c · l &nbsp;&nbsp;|&nbsp;&nbsp; A = log(I₀/I)
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        A = absorbância (adimensional) &nbsp;|&nbsp; ε = absortividade molar (L·mol⁻¹·cm⁻¹)<br>
        c = concentração (mol/L) &nbsp;|&nbsp; l = caminho óptico (cm)<br>
        T = I/I₀ = transmitância &nbsp;|&nbsp; A = -log T
      </p>
    </div>

    <!-- Calculadora Beer-Lambert -->
    <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:var(--space-5)">
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">ε (L·mol⁻¹·cm⁻¹):</span>
        <input type="range" id="bl-eps" min="10" max="100000" step="100" value="1000"
               style="width:130px;accent-color:var(--accent-electron)">
        <span id="bl-eps-val" style="font-size:var(--text-sm);color:var(--accent-electron);min-width:80px">1 000</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">c (mmol/L):</span>
        <input type="range" id="bl-c" min="0.01" max="10" step="0.01" value="1.0"
               style="width:130px;accent-color:var(--accent-bond)">
        <span id="bl-c-val" style="font-size:var(--text-sm);color:var(--accent-bond);min-width:60px">1,00 mM</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span style="font-size:var(--text-sm);color:var(--text-muted);min-width:180px">l — caminho óptico (cm):</span>
        <input type="range" id="bl-l" min="0.1" max="10" step="0.1" value="1.0"
               style="width:130px;accent-color:var(--accent-organic)">
        <span id="bl-l-val" style="font-size:var(--text-sm);color:var(--accent-organic);min-width:40px">1,0 cm</span>
      </div>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Absorbância A</p>
        <div id="bl-A" style="font-size:var(--text-xl);font-weight:700;color:var(--accent-electron)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Transmitância T</p>
        <div id="bl-T" style="font-size:var(--text-lg);font-weight:700;color:var(--accent-bond)">—</div>
      </div>
      <div class="info-card">
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:.3rem">Luz absorvida</p>
        <div id="bl-abs" style="font-size:var(--text-base);font-weight:600;color:var(--accent-reaction)">—</div>
      </div>
    </div>
  </section>

  <!-- ============================================================
       ESPECTROSCOPIA IV
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Espectroscopia de Infravermelho (IV)</h2>
    <p class="module-text">
      A radiação IV (4000–400 cm⁻¹) excita modos vibracionais moleculares.
      Apenas vibrações que causam mudança no momento de dipolo absorvem IV.
      A região <strong>4000–1500 cm⁻¹</strong> (grupos funcionais) é diagnóstica;
      a região <strong>1500–400 cm⁻¹</strong> (impressão digital) é única para cada molécula.
    </p>
    <div id="ir-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:var(--space-4)">
      ${IR_GROUPS.map((g, i) => `
        <button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="ir-tab-${i}" data-ir="${i}"
                style="border-color:${g.color}">${esc(g.name.split(' ')[0])}</button>`).join('')}
    </div>
    <div class="canvas-frame" id="ir-frame" style="min-height:180px">
      <canvas id="ir-canvas" aria-label="Espectro IV simulado"></canvas>
    </div>
    <div id="ir-info" class="info-card" style="background:var(--bg-raised);margin-top:var(--space-4)"></div>
  </section>

  <!-- ============================================================
       RMN ¹H
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">RMN de ¹H — Deslocamento Químico</h2>
    <p class="module-text">
      Na ressonância magnética nuclear, prótons em ambientes eletrônicos diferentes
      ressoam a campos diferentes. O <strong>deslocamento químico δ (ppm)</strong> é
      medido em relação ao TMS (δ = 0). Maior δ = mais desblindado = menos densidade
      eletrônica = mais próximo de um grupo eletronegativo ou sistema π.
    </p>
    <div class="canvas-frame" id="nmr-frame" style="min-height:160px">
      <canvas id="nmr-canvas" aria-label="Escala de deslocamento químico RMN"></canvas>
    </div>

    <div style="overflow-x:auto;margin-top:var(--space-5)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Ambiente</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">δ (ppm)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Motivo</th>
          </tr>
        </thead>
        <tbody>
          ${NMR_ENVIRONMENTS.map(r => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;color:${r.color}">${esc(r.env)}</td>
            <td style="padding:.4rem .6rem;font-weight:600;color:var(--accent-electron)">
              ${r.delta_min === r.delta_max ? r.delta_min.toFixed(1) : `${r.delta_min}–${r.delta_max}`}
            </td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-secondary)">${esc(r.desc)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-top:var(--space-4)">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Multiplicidade (n+1)</h3>
        <p style="font-size:var(--text-sm)">Prótons vizinhos não equivalentes causam divisão do sinal. n vizinhos → n+1 picos (dubleto, tripleto, quarteto…). Ex: CH₃CH₂– o CH₃ vê 2 H → tripleto; CH₂ vê 3 H → quarteto.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">Integração</h3>
        <p style="font-size:var(--text-sm)">Área do sinal ∝ número de prótons equivalentes. Razão de áreas dá razão de prótons. Ex: etanol (CD₃COOD) → CH₃ : CH₂ = 3:2.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Constante de acoplamento J</h3>
        <p style="font-size:var(--text-sm)">J (Hz) mede a separação entre linhas. Independe do campo (≠ δ). J vicinal (³J) ≈ 0–16 Hz. Trans em alcenos ≈ 12–18 Hz; cis ≈ 6–12 Hz. Útil para estereoquímica.</p>
      </div>
    </div>
  </section>

  <!-- ============================================================
       ESPECTROMETRIA DE MASSAS
  ============================================================ -->
  <section class="module-section">
    <h2 class="module-section-title">Espectrometria de Massas</h2>
    <p class="module-text">
      Moléculas são ionizadas (EI: impacto de elétrons, 70 eV) formando o <strong>íon molecular
      M⁺•</strong> (m/z = M). Fragmentação produz picos de menor m/z.
      A <strong>regra do nitrogênio</strong>: compostos sem N têm M par; um N → M ímpar.
      Padrões isotópicos de Cl (3:1) e Br (1:1) são diagnósticos.
    </p>
    <div id="ms-tabs" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:var(--space-4)">
      ${MS_MOLECULES.map((m, i) => `
        <button class="btn btn-xs ${i===0?'btn-secondary':'btn-ghost'}" id="ms-tab-${i}" data-ms="${i}">
          ${esc(m.name.split(' ')[0])}</button>`).join('')}
    </div>
    <div class="canvas-frame" id="ms-frame" style="min-height:180px">
      <canvas id="ms-canvas" aria-label="Espectro de massas"></canvas>
    </div>
    <div id="ms-info" class="info-card" style="background:var(--bg-raised);margin-top:var(--space-4)"></div>
  </section>

  <!-- ============================================================
       UV-VIS TRANSIÇÕES
  ============================================================ -->
  <!-- RMN 2D -->
  <section class="module-section">
    <h2 class="module-section-title">RMN 2D — COSY, HSQC e HMBC</h2>
    <p class="module-text">
      Espectros 2D correlacionam dois núcleos simultaneamente, resolvendo sobreposições do
      espectro 1D e revelando conectividades estruturais. Eixos: ambos em ppm (¹H ou ¹³C).
      <strong>Picos diagonais:</strong> autocorrelação. <strong>Cross-peaks:</strong> correlação
      entre dois núcleos diferentes — a informação estrutural útil.
    </p>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr));margin-bottom:var(--space-5)">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">COSY</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">¹H–¹H via ³J (vicinal)</p>
        <p style="font-size:var(--text-sm)">Cross-peak entre dois ¹H acoplados por 2–3 ligações. Sequencia fragmentos H–C–C–H. Identifica CH₂–CH₂ vicinal, CH–OH, etc. Leitura: projete o cross-peak em ambos os eixos δ(¹H) para obter os dois deslocamentos.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">HSQC</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">¹H–¹³C via ¹J (direto)</p>
        <p style="font-size:var(--text-sm)">Correlaciona cada ¹H com o ¹³C ao qual está ligado diretamente (¹J_CH ≈ 125–150 Hz). Resolve C sobrepostos no ¹³C 1D via dispersão de ¹H. DEPT-HSQC editado: CH/CH₃ = positivo; CH₂ = negativo.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">HMBC</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">¹H–¹³C via ²J, ³J (longa distância)</p>
        <p style="font-size:var(--text-sm)">Conecta ¹H a ¹³C a 2–3 ligações. Fundamental ao redor de C quaternários, C=O e C aromáticos (invisíveis no HSQC). Ex: HMBC de H-2 com C-4 → confirma sequência C2–C3–C4. Pilar da elucidação de produtos naturais.</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">NOESY / ROESY</h3>
        <p style="font-family:monospace;font-size:var(--text-xs);margin-bottom:.3rem">¹H–¹H espacial (&lt;5 Å)</p>
        <p style="font-size:var(--text-sm)">Nuclear Overhauser Effect: correlação através do espaço (1/r⁶). Confirma estereoquímica (R/S, cis/trans), conformação de peptídeos e estrutura 3D de proteínas em solução. ROESY para moléculas grandes (&gt;1 kDa).</p>
      </div>
    </div>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-3)">
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        <strong style="color:var(--accent-bond)">Protocolo de elucidação estrutural:</strong>
        <span style="font-family:monospace"> MS → IHD → ¹H/¹³C 1D → DEPT → HSQC → COSY → HMBC → NOESY</span><br>
        IHD = (2C + 2 + N - H) / 2. Cada anel ou dupla ligação = 1 IHD. Tripla = 2 IHD. Aromático = 4 IHD.
      </p>
    </div>
  </section>

  <!-- Raman -->
  <section class="module-section">
    <h2 class="module-section-title">Espectroscopia Raman</h2>
    <p class="module-text">
      Raman é complementar ao IV: detecta os mesmos modos vibracionais, mas com regra de
      seleção oposta. IV ativo → variação de momento dipolar. Raman ativo → variação de
      polarizabilidade. Em moléculas com centro de inversão: <strong>regra de exclusão
      mútua</strong> — nenhum modo é simultaneamente IV e Raman ativo.
    </p>
    <div class="info-card" style="background:var(--bg-raised);margin-bottom:var(--space-5)">
      <p style="font-family:monospace;font-size:var(--text-sm);color:var(--accent-electron);margin-bottom:.3rem">
        Δν̃ = ν̃_laser - ν̃_emitido &nbsp;&nbsp;|&nbsp;&nbsp; I_Raman ∝ (dα/dQ)² · ν₀⁴
      </p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">
        Stokes (emite menos energia): mais comum a T ambiente. Anti-Stokes: molécula já excitada — razão I_AS/I_S = exp(-hν/kT) → termometria molecular.<br>
        Água é transparente no Raman → ideal para amostras biológicas em solução aquosa.
      </p>
    </div>
    <div style="overflow-x:auto;margin-bottom:var(--space-4)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Grupo funcional</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">ν̃ Raman (cm⁻¹)</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">IV ativo?</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Aplicação</th>
          </tr>
        </thead>
        <tbody>
          ${[
            ['C≡C (alcino)',       '~2100',     'Fraco',  'Confirma tripla C–C em produtos naturais'],
            ['C=C (alceno)',       '~1640',     'Fraco',  'Poliisopreno, borracha, carotenóides'],
            ['Anel benzênico',     '~1580, 992','Fraco',  'Aromaticidade, grau de substituição'],
            ['C=C grafite (G)',    '~1580',     'Não',    'Qualidade do grafeno/CNT'],
            ['C=C defeitos (D)',   '~1350',     'Não',    'Densidade de defeitos em grafeno'],
            ['S–S (dissulfeto)',   '~500',      'Fraco',  'Pontes dissulfeto em proteínas'],
            ['C–C (diamante)',     '~1332',     'Não',    'Única banda — identifica diamante'],
            ['C–H aromático',      '~3050',     'Médio',  'Aromáticos vs alifáticos'],
            ['O–H (água)',         '~3400',     'Forte',  'IV intenso; Raman fraco → vantagem biológica'],
          ].map(_r => { const [g,v,iv,app]=_r; return `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-weight:600;color:var(--accent-electron)">${g}</td>
            <td style="padding:.4rem .6rem;font-family:monospace;color:var(--accent-bond)">${v}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:${iv==='Não'?'var(--accent-reaction)':iv==='Forte'?'var(--accent-organic)':'var(--text-muted)'}">${iv}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-muted)">${app}</td>
          </tr>`; }).join('')}
        </tbody>
      </table>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-electron)">Raman confocal</h3>
        <p style="font-size:var(--text-sm)">Resolução espacial ~0,5 μm com foco laser. Mapeia distribuição de fases, polímeros, minerais e células. Sem preparo de amostra. Identifica polimorfos farmacêuticos (forma I vs II).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-bond)">SERS</h3>
        <p style="font-size:var(--text-sm)">Surface-Enhanced Raman Scattering: nanopartículas de Au/Ag amplificam 10⁶–10¹⁴×. Permite detecção de molécula única. Diagnóstico de câncer (biomarcadores a fM), autenticidade de obras de arte (pigmentos).</p>
      </div>
    </div>
  </section>


  <section class="module-section">
    <h2 class="module-section-title">UV-Vis — Transições eletrônicas</h2>
    <p class="module-text">
      A espectroscopia UV-Vis detecta transições entre orbitais moleculares.
      A posição (λmax) e intensidade (ε) dependem do cromóforo.
      <strong>Efeito batocrômico</strong> (red shift): λmax aumenta com conjugação ou solvente polar
      para n→π*. <strong>Efeito hipsocrômico</strong> (blue shift): λmax diminui.
    </p>
    <div style="overflow-x:auto;margin-bottom:var(--space-4)">
      <table style="width:100%;border-collapse:collapse;font-size:var(--text-sm)">
        <thead>
          <tr style="font-size:var(--text-xs);text-transform:uppercase;color:var(--text-muted)">
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Transição</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Região</th>
            <th style="text-align:left;padding:.4rem .6rem;border-bottom:1px solid var(--border-default)">Descrição e exemplos</th>
          </tr>
        </thead>
        <tbody>
          ${UV_TRANSITIONS.map(t => `
          <tr style="border-bottom:1px solid var(--border-subtle)">
            <td style="padding:.4rem .6rem;font-family:monospace;font-weight:600;color:${t.color}">${esc(t.type)}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--accent-bond);white-space:nowrap">${esc(t.range)}</td>
            <td style="padding:.4rem .6rem;font-size:var(--text-xs);color:var(--text-secondary)">${esc(t.desc)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="module-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-organic)">Cromóforos comuns</h3>
        <p style="font-size:var(--text-sm)">C=O: n→π* ≈ 280 nm (fraco, ε ≈ 15). C=C conjugado: π→π* ≈ 217 nm; butadieno 217 nm, hexatrieno 258 nm, β-caroteno 450 nm (cor laranja). Benzeno: 254 nm (fraco, ε ≈ 200).</p>
      </div>
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--accent-reaction)">Regras de Woodward-Fieser</h3>
        <p style="font-size:var(--text-sm)">Para calcular λmax de dienos e enonas conjugados. Base (dieno s-cis: 253 nm) + incremento por cada extensão (+30 nm/dupla), substituinte (+5 nm/alkila), anel (+5 nm). Preditivo para colorantes e vitaminas.</p>
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
// Canvas — Espectro IV simulado
// ---------------------------------------------------------------------------
function _drawIR(ctx, W, H, group, t = 1) {
  clearCanvas(ctx, W, H);
  const MX = 45, MY = 10, PW = W - MX - 10, PH = H - MY - 30;
  const WN_MAX = 4000, WN_MIN = 400;

  // Baseline
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(MX, MY); ctx.lineTo(MX, MY + PH); ctx.lineTo(MX + PW, MY + PH); ctx.stroke();

  // Axis labels
  ctx.fillStyle = COLOR.textMuted; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Número de onda (cm⁻¹)', MX + PW / 2, H - 4);
  ctx.save(); ctx.translate(12, MY + PH / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('Transmitância (%)', 0, 0); ctx.restore();

  // X ticks
  [4000, 3000, 2000, 1500, 1000, 500].forEach(wn => {
    const x = MX + (1 - (wn - WN_MIN) / (WN_MAX - WN_MIN)) * PW;
    ctx.fillStyle = COLOR.textMuted; ctx.textAlign = 'center';
    ctx.fillText(wn, x, MY + PH + 14);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, MY); ctx.lineTo(x, MY + PH); ctx.stroke();
  });

  // Y ticks
  [0, 25, 50, 75, 100].forEach(pct => {
    const y = MY + PH - (pct / 100) * PH;
    ctx.fillStyle = COLOR.textMuted; ctx.textAlign = 'right';
    ctx.fillText(pct, MX - 4, y + 3);
  });

  // Build transmittance curve
  const pts = [];
  for (let px = 0; px <= PW; px++) {
    const wn = WN_MIN + (1 - px / PW) * (WN_MAX - WN_MIN);
    let T = 1.0;
    group.bands.forEach(b => {
      const diff = wn - b.wn;
      const gauss = Math.exp(-diff * diff / (2 * b.width * b.width));
      T -= b.intensity * gauss * t;
    });
    T = Math.max(0.02, Math.min(1, T));
    pts.push({ x: MX + px, y: MY + PH - T * PH });
  }

  // Fill under curve
  ctx.beginPath();
  ctx.moveTo(pts[0].x, MY + PH);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, MY + PH);
  ctx.closePath();
  ctx.fillStyle = group.color + '22'; ctx.fill();

  // Curve
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = group.color; ctx.lineWidth = 1.5; ctx.stroke();

  // Band labels
  group.bands.forEach(b => {
    const x = MX + (1 - (b.wn - WN_MIN) / (WN_MAX - WN_MIN)) * PW;
    const y = MY + PH - b.intensity * PH - 8;
    ctx.fillStyle = group.color; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(b.wn + ' cm⁻¹', x, y);
  });
}

// ---------------------------------------------------------------------------
// Canvas — NMR scale
// ---------------------------------------------------------------------------
function _drawNMR(ctx, W, H) {
  clearCanvas(ctx, W, H);
  const MX = 20, MY = 15, PW = W - MX - 20, PH = H - MY - 30;
  const D_MAX = 12, D_MIN = 0;

  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(MX, MY + PH); ctx.lineTo(MX + PW, MY + PH); ctx.stroke();

  // X axis: δ from 12 to 0 (RMN convention: low field left)
  for (let d = 0; d <= 12; d += 2) {
    const x = MX + (1 - d / D_MAX) * PW;
    ctx.fillStyle = COLOR.textMuted; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(d, x, H - 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, MY); ctx.lineTo(x, MY + PH); ctx.stroke();
  }
  ctx.fillStyle = COLOR.textMuted; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('δ (ppm) →', MX + PW * 0.5, H - 16);
  ctx.fillText('Campo baixo', MX + 20, H - 16);
  ctx.fillText('Campo alto', MX + PW - 20, H - 16);

  // Environment bars
  NMR_ENVIRONMENTS.forEach(env => {
    const x1 = MX + (1 - env.delta_max / D_MAX) * PW;
    const x2 = MX + (1 - env.delta_min / D_MAX) * PW;
    const bw  = Math.max(4, x2 - x1);
    const row = NMR_ENVIRONMENTS.indexOf(env);
    const y   = MY + row * ((PH - 20) / NMR_ENVIRONMENTS.length) + 4;

    ctx.fillStyle = env.color + '55';
    ctx.fillRect(x1, y, bw, 10);
    ctx.strokeStyle = env.color; ctx.lineWidth = 1;
    ctx.strokeRect(x1, y, bw, 10);

    ctx.fillStyle = COLOR.textMuted; ctx.font = '7px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(env.env.split('(')[0].trim().slice(0, 18), Math.min(x1 + 2, W - 80), y + 8);
  });
}

// ---------------------------------------------------------------------------
// Canvas — Mass spectrum
// ---------------------------------------------------------------------------
function _drawMS(ctx, W, H, mol, t = 1) {
  clearCanvas(ctx, W, H);
  const MX = 40, MY = 10, PW = W - MX - 20, PH = H - MY - 30;

  if (!mol.peaks.length) return;
  const maxMZ = mol.peaks.reduce((a, b) => Math.max(a, b.mz), 0) + 10;

  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(MX, MY); ctx.lineTo(MX, MY + PH); ctx.lineTo(MX + PW, MY + PH); ctx.stroke();

  ctx.fillStyle = COLOR.textMuted; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('m/z', MX + PW / 2, H - 4);
  ctx.save(); ctx.translate(12, MY + PH / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('Intensidade relativa (%)', 0, 0); ctx.restore();

  mol.peaks.forEach(p => {
    const x = MX + (p.mz / maxMZ) * PW;
    const y = MY + PH - (p.rel / 100) * PH;
    ctx.strokeStyle = p.rel === 100 ? COLOR.reaction : COLOR.electron;
    ctx.lineWidth = p.rel === 100 ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(x, MY + PH); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = COLOR.textMuted; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(p.mz, x, y - 4);
  });

  // 100% marker
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(MX, MY); ctx.lineTo(MX + PW, MY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLOR.textMuted; ctx.font = '8px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('100%', MX - 2, MY + 4);
}

// ---------------------------------------------------------------------------
function _initSpectroscopy() {
  // Beer-Lambert
  function updateBL() {
    const eps = parseFloat(document.getElementById('bl-eps')?.value ?? 1000);
    const c   = parseFloat(document.getElementById('bl-c')?.value ?? 1.0) / 1000; // mol/L
    const l   = parseFloat(document.getElementById('bl-l')?.value ?? 1.0);
    document.getElementById('bl-eps-val').textContent = eps.toLocaleString('pt-BR');
    document.getElementById('bl-c-val').textContent   = (c * 1000).toFixed(2) + ' mM';
    document.getElementById('bl-l-val').textContent   = l.toFixed(1) + ' cm';
    const A = eps * c * l;
    const T = Math.pow(10, -A);
    document.getElementById('bl-A').textContent   = A.toFixed(3);
    document.getElementById('bl-T').textContent   = (T * 100).toFixed(1) + ' %';
    document.getElementById('bl-abs').textContent = ((1 - T) * 100).toFixed(1) + ' % absorvida';
  }
  updateBL();
  ['bl-eps', 'bl-c', 'bl-l'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', updateBL));

  // IR Canvas
  const irCanvas = document.getElementById('ir-canvas');
  const irFrame  = document.getElementById('ir-frame');
  if (irCanvas && irFrame) {
    const W = Math.min(irFrame.clientWidth || 560, 560);
    const H = 180;
    const dpr = window.devicePixelRatio || 1;
    irCanvas.width = Math.round(W * dpr); irCanvas.height = Math.round(H * dpr);
    irCanvas.style.width = W + 'px'; irCanvas.style.height = H + 'px';
    const ctx = irCanvas.getContext('2d'); ctx.scale(dpr, dpr);

    function renderIR(idx) {
      const g = IR_GROUPS[idx];
      _animateIR(ctx, W, H, g);
      const info = document.getElementById('ir-info');
      if (info) info.innerHTML = `
        <span style="font-weight:700;color:${g.color}">${esc(g.name)}</span>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.4rem 0 0">${esc(g.note)}</p>`;
      IR_GROUPS.forEach((_, j) => {
        const b = document.getElementById('ir-tab-' + j);
        if (b) b.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
      });
    }
    renderIR(0);
    IR_GROUPS.forEach((_, i) =>
      document.getElementById('ir-tab-' + i)?.addEventListener('click', () => { _irIdx = i; renderIR(i); }));
  }

  // NMR Canvas
  const nmrCanvas = document.getElementById('nmr-canvas');
  const nmrFrame  = document.getElementById('nmr-frame');
  if (nmrCanvas && nmrFrame) {
    const W = Math.min(nmrFrame.clientWidth || 560, 560);
    const H = 160;
    const dpr = window.devicePixelRatio || 1;
    nmrCanvas.width = Math.round(W * dpr); nmrCanvas.height = Math.round(H * dpr);
    nmrCanvas.style.width = W + 'px'; nmrCanvas.style.height = H + 'px';
    const ctx = nmrCanvas.getContext('2d'); ctx.scale(dpr, dpr);
    _drawNMR(ctx, W, H);
  }

  // MS Canvas
  const msCanvas = document.getElementById('ms-canvas');
  const msFrame  = document.getElementById('ms-frame');
  if (msCanvas && msFrame) {
    const W = Math.min(msFrame.clientWidth || 560, 560);
    const H = 180;
    const dpr = window.devicePixelRatio || 1;
    msCanvas.width = Math.round(W * dpr); msCanvas.height = Math.round(H * dpr);
    msCanvas.style.width = W + 'px'; msCanvas.style.height = H + 'px';
    const ctx = msCanvas.getContext('2d'); ctx.scale(dpr, dpr);

    function renderMS(idx) {
      const mol = MS_MOLECULES[idx];
      _animateMS(ctx, W, H, mol);
      const info = document.getElementById('ms-info');
      if (info) info.innerHTML = `
        <span style="font-weight:700;color:var(--accent-electron)">${esc(mol.name)}</span>
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:.4rem 0 0">${esc(mol.note)}</p>`;
      MS_MOLECULES.forEach((_, j) => {
        const b = document.getElementById('ms-tab-' + j);
        if (b) b.className = 'btn btn-xs ' + (j === idx ? 'btn-secondary' : 'btn-ghost');
      });
    }
    renderMS(0);
    MS_MOLECULES.forEach((_, i) =>
      document.getElementById('ms-tab-' + i)?.addEventListener('click', () => { _msIdx = i; renderMS(i); }));
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
          markSectionDone('spectroscopy', 'exercise');
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

// ---------------------------------------------------------------------------
// Estado de animação dos canvas de espectroscopia
// ---------------------------------------------------------------------------
let _irAnimId  = null;
let _msAnimId  = null;

function _animateIR(ctx, W, H, group) {
  if (_irAnimId) cancelAnimationFrame(_irAnimId);
  let t = 0;
  function step() {
    t = Math.min(1, t + 0.07);
    _drawIR(ctx, W, H, group, t);
    if (t < 1) _irAnimId = requestAnimationFrame(step);
    else _irAnimId = null;
  }
  _irAnimId = requestAnimationFrame(step);
}

function _animateMS(ctx, W, H, mol) {
  if (_msAnimId) cancelAnimationFrame(_msAnimId);
  let t = 0;
  function step() {
    t = Math.min(1, t + 0.07);
    _drawMS(ctx, W, H, mol, t);
    if (t < 1) _msAnimId = requestAnimationFrame(step);
    else _msAnimId = null;
  }
  _msAnimId = requestAnimationFrame(step);
}

export function destroy() {
  if (_irAnimId) { cancelAnimationFrame(_irAnimId); _irAnimId = null; }
  if (_msAnimId) { cancelAnimationFrame(_msAnimId); _msAnimId = null; }
}
