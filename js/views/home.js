/**
 * js/views/home.js — View: Página inicial
 * Lavoisier — Laboratório Visual de Química
 */

import { esc } from '../ui.js';

/* SVG inline para ícone dos feature cards */
const DIAMOND_SVG = `<svg class="info-card-icon" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 2L16 9L9 16L2 9Z" fill="var(--accent-electron)"/></svg>`;

const ALL_MODULES = [
  { id: 'atomic-structure',  title: 'Estrutura Atômica',       desc: 'Prótons, elétrons, camadas e modelos atômicos. Visualize o átomo de Bohr em movimento.' },
  { id: 'periodic-table',    title: 'Tabela Periódica',         desc: 'Explore todos os elementos, famílias, períodos e tendências periódicas.' },
  { id: 'chemical-bonds',    title: 'Ligações Químicas',        desc: 'Monte moléculas, visualize polaridade e entenda por que o sal dissolve em água.' },
  { id: 'reactions',         title: 'Reações Químicas',         desc: 'Balance equações visualmente e observe conservação de massa com partículas.' },
  { id: 'inorganic',         title: 'Funções Inorgânicas',       desc: 'Ácidos, bases, sais e óxidos. Nomenclatura, classificação e calculadora de pH.' },
  { id: 'mixtures',          title: 'Separação de Misturas',     desc: 'Filtração, destilação animada, cromatografia, cristalização e centrifugação.' },
  { id: 'stoichiometry',     title: 'Estequiometria',            desc: 'Proporções entre reagentes, mol, massa molar e reagente limitante visual.' },
  { id: 'solutions',         title: 'Soluções e pH',            desc: 'Dissolução, tampões, especiação de ácidos e curva de titulação interativa.' },
  { id: 'thermochemistry',   title: 'Termoquímica',             desc: 'Entalpia, Lei de Hess, ΔG=ΔH-TΔS e termodinâmica estatística.' },
  { id: 'kinetics',          title: 'Cinética e Equilíbrio',    desc: 'Velocidade de reação, Arrhenius, equilíbrio reversível A⇌B e Maxwell-Boltzmann.' },
  { id: 'electrochemistry',  title: 'Eletroquímica',            desc: 'Pilhas, eletrólise, Leis de Faraday e equação de Nernst.' },
  { id: 'organic',           title: 'Química Orgânica',         desc: 'Cadeias carbônicas, mecanismos SN1/SN2/SEAr, Diels-Alder e animação de inversão.' },
  { id: 'gases',             title: 'Gases',                    desc: 'PV=nRT, Van der Waals, fator Z (Newton-Raphson) e lei dos estados correspondentes.' },
  { id: 'analytical',        title: 'Química Analítica',        desc: 'Titulação, Beer-Lambert, HPLC/GC, EDTA e espectroscopia atômica.' },
  { id: 'environmental',     title: 'Química Ambiental',        desc: 'Efeito estufa (canvas CO₂), ozônio, chuva ácida, poluição e energias renováveis.' },
  { id: 'biochemistry',      title: 'Bioquímica',               desc: 'Glicólise, Krebs, cadeia respiratória, fotossíntese e cinética enzimática.' },
  { id: 'nuclear',           title: 'Química Nuclear',          desc: 'Radioatividade, meia-vida, fissão, fusão e aplicações médicas.' },
  { id: 'quantum',           title: 'Mecânica Quântica',        desc: 'Schrödinger, orbitais, TOM/LCAO e probabilidade radial P(r).' },
  { id: 'phases',            title: 'Equilíbrio de Fases',      desc: 'Diagramas P×T interativos (H₂O e CO₂), Clausius-Clapeyron e Raoult.' },
  { id: 'spectroscopy',      title: 'Espectroscopia',           desc: 'IV animado, RMN ¹H/2D, massas, Raman (SERS) e UV-Vis.' },
  { id: 'solidstate',        title: 'Estado Sólido',            desc: 'SC/BCC/FCC canvas 3D, semicondutores, defeitos e Lei de Bragg.' },
  { id: 'coordination',      title: 'Química de Coordenação',   desc: 'Campo cristalino animado, Δo → cor observada e série espectroquímica.' },
  { id: 'supramolecular',    title: 'Química Supramolecular',   desc: 'Macrociclos, self-assembly, máquinas moleculares e polímeros condutores.' },
  { id: 'symmetry',          title: 'Simetria Molecular',       desc: 'Elementos de simetria animados, grupos pontuais e tabelas de caracteres.' },
];

// -------------------------------------------------------------------------
// Lógica de instalação PWA
// beforeinstallprompt é disparado pelo Chrome/Edge/Android quando o app
// atende os critérios de instalabilidade (HTTPS + manifest + SW).
// -------------------------------------------------------------------------

let _deferredInstallPrompt = null;
const DISMISSED_KEY = 'lavoisier_pwa_dismissed';

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredInstallPrompt = e;
  _showInstallBanner();
});

// iOS não dispara beforeinstallprompt — detectamos pelo userAgent
function _isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function _isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

function _showInstallBanner() {
  if (_isInStandaloneMode()) return;       // já instalado
  if (sessionStorage.getItem(DISMISSED_KEY)) return;  // descartado nesta sessão

  const banner = document.getElementById('pwa-install-banner');
  if (!banner) return;

  // iOS: substituir texto e botão por instrução manual
  if (_isIOS()) {
    const desc = banner.querySelector('p:last-of-type');
    const btn  = document.getElementById('pwa-install-btn');
    if (desc) desc.textContent = 'No Safari: toque em Compartilhar → "Adicionar à Tela de Início".';
    if (btn)  btn.style.display = 'none';
  }

  banner.style.display = 'flex';

  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (!_deferredInstallPrompt) return;
    _deferredInstallPrompt.prompt();
    const { outcome } = await _deferredInstallPrompt.userChoice;
    _deferredInstallPrompt = null;
    banner.style.display = 'none';
    if (outcome === 'accepted') sessionStorage.setItem(DISMISSED_KEY, '1');
  });

  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    banner.style.display = 'none';
    sessionStorage.setItem(DISMISSED_KEY, '1');
  });
}

// Ouvir evento de atualização do SW (disparado por index.html)
window.addEventListener('sw-update-available', () => {
  // Banner simples de atualização — sem dependência de import dinâmico
  const banner = document.createElement('div');
  banner.setAttribute('role', 'alert');
  banner.style.cssText = [
    'position:fixed;bottom:1rem;left:50%;transform:translateX(-50%)',
    'background:var(--bg-raised,#161b22)',
    'border:1px solid var(--border-default,#30363d)',
    'color:var(--text-primary,#e6edf3)',
    'padding:.6rem 1.2rem;border-radius:8px',
    'font-size:.8125rem;z-index:9999',
    'display:flex;align-items:center;gap:.75rem;box-shadow:0 4px 24px rgba(0,0,0,.4)',
  ].join(';');
  const btnUpdate  = document.createElement('button');
  const btnDismiss = document.createElement('button');
  const msg = document.createElement('span');
  msg.textContent = 'Nova versão disponível.';

  btnUpdate.textContent = 'Atualizar';
  btnUpdate.setAttribute('style',
    'background:var(--accent-electron,#4fc3f7);color:#000;' +
    'border:none;border-radius:4px;padding:.25rem .6rem;cursor:pointer;' +
    'font-size:.8125rem;font-weight:600');
  btnUpdate.addEventListener('click', () => location.reload());

  btnDismiss.innerHTML = '&#215;';
  btnDismiss.setAttribute('style',
    'background:none;border:none;color:var(--text-muted,#6e7681);' +
    'cursor:pointer;font-size:1rem;line-height:1');
  btnDismiss.addEventListener('click', () => banner.remove());

  banner.append(msg, btnUpdate, btnDismiss);
  document.body.appendChild(banner);
});

export function renderHome(outlet) {
  outlet.innerHTML = `
<div class="page">

  <!-- Hero -->
  <section class="home-hero">
    <h1 class="home-hero-title">
      Química que você<br><span>vê e experimenta</span>
    </h1>
    <p class="home-hero-desc">
      Um laboratório visual para entender fenômenos invisíveis.
      Visualize átomos, monte moléculas, balance reações
      e conecte cada conceito com o mundo ao seu redor.
    </p>
    <div class="home-actions">
      <button class="btn btn-primary" data-route="/module/atomic-structure">
        Começar: Estrutura Atômica
      </button>
    </div>
  </section>

  <!-- Filosofia rápida -->
  <section class="feature-cards-section">
    <div class="feature-cards-grid">
      ${[
        ['Fenômeno primeiro', 'Nenhum módulo começa pela fórmula. Começa pelo que você pode observar.'],
        ['Visual e interativo', 'Canvas 2D, simulações em tempo real e elementos que você pode arrastar.'],
        ['Conectado ao real', 'Cada conceito tem exemplos concretos: cozinha, saúde, tecnologia, ambiente.'],
        ['Sem decoreba', 'O foco é compreensão. Dicas guiam o raciocínio sem entregar a resposta.'],
      ].map(([title, desc]) => `
        <div class="info-card">
          ${DIAMOND_SVG}
          <h3>${esc(title)}</h3>
          <p>${esc(desc)}</p>
        </div>
      `).join('')}
    </div>
  </section>

  <!-- Banner de instalação PWA (aparece dinamicamente via JS) -->
  <div id="pwa-install-banner"
       style="display:none;align-items:center;gap:var(--space-4);flex-wrap:wrap;
              padding:var(--space-4);border-radius:8px;margin-bottom:var(--space-6);
              background:var(--bg-raised);border:1px solid var(--border-default)">
    <div style="flex:1;min-width:200px">
      <p style="font-weight:600;margin-bottom:.2rem;font-size:var(--text-sm)">
        Instalar o Lavoisier
      </p>
      <p style="font-size:var(--text-xs);color:var(--text-secondary)">
        Funciona offline. Acesse todos os 24 módulos sem internet.
      </p>
    </div>
    <div style="display:flex;gap:var(--space-2)">
      <button class="btn btn-primary btn-sm" id="pwa-install-btn">Instalar</button>
      <button class="btn btn-ghost btn-sm"   id="pwa-dismiss-btn">Agora não</button>
    </div>
  </div>

  <!-- Módulos -->
  <section class="modules-section">
    <h2 class="section-title">Módulos</h2>
    <div class="module-grid">
      ${ALL_MODULES.map(m => `
        <div class="module-card"
             role="button"
             tabindex="0"
             data-nav="/module/${esc(m.id)}"
             aria-label="${esc(m.title)}">
          <div class="module-card-title">${esc(m.title)}</div>
          <div class="module-card-desc">${esc(m.desc)}</div>
        </div>
      `).join('')}
    </div>
  </section>

  <!-- Ecossistema -->
  <section style="margin-top:4rem;padding-top:2rem;border-top:1px solid var(--border-subtle)">
    <p style="font-size:0.8125rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.75rem">
      Ecossistema educacional
    </p>
    <div style="display:flex;flex-wrap:wrap;gap:0.75rem">
      ${[
        ['Heródoto',   'História',           'https://luddevergard3n.github.io/Herodoto/',       'https://github.com/LuddEvergard3n/Herodoto'],
        ['Euclides',   'Matemática',         'https://luddevergard3n.github.io/euclides/',        'https://github.com/LuddEvergard3n/euclides'],
        ['Quintiliano','Língua Portuguesa',  'https://luddevergard3n.github.io/quintiliano/',     'https://github.com/LuddEvergard3n/quintiliano'],
        ['Johnson',    'Inglês',             'https://luddevergard3n.github.io/johnson-english/', 'https://github.com/LuddEvergard3n/johnson-english'],
        ['Humboldt',   'Geografia',          'https://luddevergard3n.github.io/humboldt/',        'https://github.com/LuddEvergard3n/humboldt'],
      ].map(([name, subject, url, repo]) => `
        <div class="ecosystem-item">
          <a href="${esc(url)}" target="_blank" rel="noopener" class="ecosystem-link">
            <strong>${esc(name)}</strong> — ${esc(subject)}
          </a>
          <a href="${esc(repo)}" target="_blank" rel="noopener" class="ecosystem-repo">repo</a>
        </div>
      `).join('')}
    </div>
  </section>

</div>
`;

  // Mostrar banner de instalação se elegível
  _showInstallBanner();
}
