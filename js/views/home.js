/**
 * js/views/home.js — View: Página inicial
 * Lavoisier — Laboratório Visual de Química
 */

import { esc } from '../ui.js';

/* SVG inline para ícone dos feature cards */
const DIAMOND_SVG = `<svg class="info-card-icon" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 2L16 9L9 16L2 9Z" fill="var(--accent-electron)"/></svg>`;

const ALL_MODULES = [
  { id: 'atomic-structure', title: 'Estrutura Atômica', desc: 'Prótons, elétrons, camadas e modelos atômicos. Visualize o átomo de Bohr em movimento.' },
  { id: 'periodic-table', title: 'Tabela Periódica', desc: 'Explore todos os elementos, famílias, períodos e tendências periódicas.' },
  { id: 'chemical-bonds', title: 'Ligações Químicas', desc: 'Monte moléculas, visualize polaridade e entenda por que o sal dissolve em água.' },
  { id: 'reactions', title: 'Reações Químicas', desc: 'Balance equações visualmente e observe conservação de massa com partículas.' },
  { id: 'stoichiometry', title: 'Estequiometria', desc: 'Proporções entre reagentes, mol, massa molar e regra de três visual.' },
  { id: 'solutions', title: 'Soluções e pH', desc: 'Dissolução, concentração e a escala de pH com exemplos do cotidiano.' },
  { id: 'thermochemistry', title: 'Termoquímica', desc: 'Entalpia, calor de reação, Lei de Hess e calorimetria.' },
  { id: 'kinetics', title: 'Cinética e Equilíbrio', desc: 'Velocidade de reação, equação de Arrhenius e distribuição de Maxwell-Boltzmann.' },
  { id: 'electrochemistry', title: 'Eletroquímica', desc: 'Pilhas, eletrólise, Leis de Faraday e equação de Nernst.' },
  { id: 'organic', title: 'Química Orgânica', desc: 'Cadeias carbônicas, funções orgânicas, isomeria e mecanismos de reação.' },
  { id: 'gases', title: 'Gases', desc: 'Lei dos gases ideais PV=nRT, Van der Waals, Dalton e Lei de Graham.' },
  { id: 'analytical', title: 'Química Analítica', desc: 'Titulação, Beer-Lambert, produto de solubilidade e propriedades coligativas.' },
  { id: 'biochemistry', title: 'Bioquímica', desc: 'Aminoácidos, proteínas, DNA, glicídios, lipídios e cinética enzimática.' },
  { id: 'nuclear', title: 'Química Nuclear', desc: 'Radioatividade, meia-vida, fissão, fusão e aplicações médicas.' },
  { id: 'environmental',     title: 'Química Ambiental',        desc: 'Efeito estufa, chuva ácida, ozônio, poluição da água e energias renováveis.' },
];

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
}
