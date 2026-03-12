/**
 * js/main.js — Bootstrap da aplicação Lavoisier
 * Ponto de entrada ES Module. Inicializa roteador, sidebar, toast
 * e registra todas as rotas da SPA.
 */

import { initRouter, route, navigate, getOutlet } from './router.js';
import { initSidebar, initToast, esc }             from './ui.js';
import { loadState }                               from './state.js';

/* -----------------------------------------------------------------------
   Inicialização principal
----------------------------------------------------------------------- */
async function boot() {
  loadState();
  initSidebar();
  initToast();

  const outlet = document.getElementById('app');

  // Registrar rotas ANTES de iniciar o roteador
  _registerRoutes();

  // Delegação de cliques em [data-route] para navegação SPA
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-route]');
    if (!btn) return;
    const r = btn.dataset.route;
    if (r) navigate(r);
  });

  // Delegação de [data-nav] — usado em HTML gerado dinamicamente
  // para evitar onclick="..." que viola CSP script-src-attr
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-nav]');
    if (!el) return;
    navigate(el.dataset.nav);
  });

  // Suporte a teclado para [data-nav] com role="button"
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('[data-nav]');
    if (!el) return;
    e.preventDefault();
    navigate(el.dataset.nav);
  });

  // Iniciar roteador — dispara a rota inicial
  initRouter(outlet);
}

/* -----------------------------------------------------------------------
   Registro de rotas
----------------------------------------------------------------------- */

/**
 * Módulo ativo no momento (para destruir ao navegar).
 * @type {{ destroy?: function }|null}
 */
let _activeModule = null;

function _destroyActive() {
  if (_activeModule && typeof _activeModule.destroy === 'function') {
    _activeModule.destroy();
  }
  _activeModule = null;
}

function _registerRoutes() {
  // ---- Home ----
  route('/', async () => {
    _destroyActive();
    const { renderHome } = await import('./views/home.js');
    renderHome(getOutlet());
  });

  // ---- Lista de módulos ----
  route('/modules', async () => {
    _destroyActive();
    const { renderModules } = await import('./views/modules-list.js');
    await renderModules(getOutlet());
  });

  // ---- Módulo específico ----
  route('/module/:id', async ({ id }) => {
    _destroyActive();
    try {
      const mod = await _loadModule(id);
      _activeModule = mod;
      mod.render(getOutlet());
    } catch (err) {
      console.error(`[main] módulo não encontrado: ${id}`, err);
      getOutlet().innerHTML = `
        <div class="page" style="text-align:center;padding-top:5rem">
          <h2 style="color:var(--text-muted)">Módulo em desenvolvimento</h2>
          <p style="color:var(--text-secondary);margin:1rem 0 2rem">
            O módulo <strong>${esc(id)}</strong> ainda não está disponível nesta versão.
          </p>
          <button class="btn btn-secondary" data-nav="/modules">
            Ver módulos disponíveis
          </button>
        </div>
      `;
    }
  });

  // ---- Laboratório livre ----
  route('/sandbox', async () => {
    _destroyActive();
    const mod = await import('./views/sandbox.js');
    mod.renderSandbox(getOutlet());
    _activeModule = { destroy: mod.destroy };
  });

  // ---- Guia do Professor ----
  route('/teacher', async () => {
    _destroyActive();
    const { renderTeacher } = await import('./views/teacher.js');
    renderTeacher(getOutlet());
  });

  // ---- Gerador de Plano de Aula ----
  route('/planner', async () => {
    _destroyActive();
    const mod = await import('./views/lesson-planner.js');
    mod.renderLessonPlanner(getOutlet());
    _activeModule = { destroy: mod.destroyLessonPlanner };
  });

  // ---- Sobre ----
  route('/about', async () => {
    _destroyActive();
    const { renderAbout } = await import('./views/about.js');
    renderAbout(getOutlet());
  });
}

/**
 * Importa dinamicamente o módulo de conteúdo pelo ID.
 * @param {string} id
 * @returns {Promise<{ render: function, destroy?: function }>}
 */
async function _loadModule(id) {
  const map = {
    'atomic-structure': () => import('../modules/atomic-structure/index.js'),
    'periodic-table':   () => import('../modules/periodic-table/index.js'),
    'chemical-bonds':   () => import('../modules/chemical-bonds/index.js'),
    'reactions':        () => import('../modules/reactions/index.js'),
    'inorganic':        () => import('../modules/inorganic/index.js'),
    'mixtures':         () => import('../modules/mixtures/index.js'),
    'stoichiometry':    () => import('../modules/stoichiometry/index.js'),
    'solutions':        () => import('../modules/solutions/index.js'),
    'thermochemistry':  () => import('../modules/thermochemistry/index.js'),
    'kinetics':         () => import('../modules/kinetics/index.js'),
    'electrochemistry': () => import('../modules/electrochemistry/index.js'),
    'organic':          () => import('../modules/organic/index.js'),
    'gases':            () => import('../modules/gases/index.js'),
    'analytical':       () => import('../modules/analytical/index.js'),
    'symmetry':         () => import('../modules/symmetry/index.js'),
    'photochemistry':   () => import('../modules/photochemistry/index.js'),
    'catalysis':        () => import('../modules/catalysis/index.js'),
    'biochemistry':     () => import('../modules/biochemistry/index.js'),
    'nuclear':          () => import('../modules/nuclear/index.js'),
    'environmental':    () => import('../modules/environmental/index.js'),
    'quantum':          () => import('../modules/quantum/index.js'),
    'phases':           () => import('../modules/phases/index.js'),
    'spectroscopy':     () => import('../modules/spectroscopy/index.js'),
    'solidstate':       () => import('../modules/solidstate/index.js'),
    'coordination':     () => import('../modules/coordination/index.js'),
  'supramolecular':   () => import('../modules/supramolecular/index.js'),
  };

  const loader = map[id];
  if (!loader) throw new Error(`Módulo desconhecido: ${id}`);
  return loader();
}

/* -----------------------------------------------------------------------
   Start
----------------------------------------------------------------------- */
boot().catch(err => {
  console.error('[main] falha no boot:', err);
  const outlet = document.getElementById('app');
  if (outlet) {
    outlet.innerHTML = `
      <div class="page" style="text-align:center;padding-top:4rem">
        <h2 style="color:var(--state-error)">Erro ao inicializar</h2>
        <p style="color:var(--text-secondary);margin-top:0.5rem;font-family:monospace">${esc(String(err))}</p>
        <p style="color:var(--text-muted);margin-top:1rem;font-size:0.875rem">
          Este projeto requer um servidor HTTP (não funciona via file://). <br>
          Execute: <code>python3 -m http.server 8080</code> e acesse http://localhost:8080
        </p>
      </div>
    `;
  }
});
