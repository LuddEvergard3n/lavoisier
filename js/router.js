/**
 * router.js — Roteamento SPA baseado em hash
 * Lavoisier — Laboratório Visual de Química
 *
 * Rotas:
 *   #/                    — home
 *   #/modules             — lista de módulos
 *   #/module/:id          — módulo específico
 *   #/sandbox             — laboratório livre
 *   #/about               — sobre
 */

import { setState } from './state.js';

/** @type {Map<string, function(): Promise<void>>} */
const _routes = new Map();

/** @type {HTMLElement} */
let _outlet = null;

/**
 * Registra uma rota.
 * @param {string}   pattern   - padrão exato ou com prefixo ':param'
 * @param {function(Object): Promise<void>} handler
 */
export function route(pattern, handler) {
  _routes.set(pattern, handler);
}

/**
 * Inicializa o roteador.
 * @param {HTMLElement} outlet - elemento onde o conteúdo é renderizado
 */
export function initRouter(outlet) {
  _outlet = outlet;
  window.addEventListener('hashchange', _dispatch);
  window.addEventListener('popstate',   _dispatch);
  _dispatch();
}

/**
 * Navega para uma rota sem recarregar.
 * @param {string} path
 */
export function navigate(path) {
  window.location.hash = path.startsWith('#') ? path : '#' + path;
}

/**
 * Retorna o outlet onde páginas são renderizadas.
 * @returns {HTMLElement}
 */
export function getOutlet() {
  return _outlet;
}

/* -----------------------------------------------------------------------
   Internals
----------------------------------------------------------------------- */

/**
 * Extrai a rota atual do hash.
 * @returns {{ path: string, params: Object }}
 */
function _parseHash() {
  const raw = window.location.hash.slice(1) || '/';
  const segments = raw.split('/').filter(Boolean);
  return { path: raw, segments };
}

/**
 * Tenta casar o path contra os padrões registrados.
 * Suporta segmentos ':param'.
 *
 * @param {string[]} segments
 * @returns {{ handler: function, params: Object } | null}
 */
function _match(segments) {
  for (const [pattern, handler] of _routes) {
    const pSegs = pattern.split('/').filter(Boolean);
    if (pSegs.length !== segments.length) continue;

    const params = {};
    let ok = true;
    for (let i = 0; i < pSegs.length; i++) {
      if (pSegs[i].startsWith(':')) {
        params[pSegs[i].slice(1)] = decodeURIComponent(segments[i]);
      } else if (pSegs[i] !== segments[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return { handler, params };
  }
  return null;
}

async function _dispatch() {
  const { path, segments } = _parseHash();
  setState({ currentRoute: path });

  // Atualiza botões de nav ativos
  document.querySelectorAll('[data-route]').forEach(btn => {
    const r = btn.dataset.route;
    btn.classList.toggle('active', r === '/' ? path === '/' : path.startsWith(r) && r !== '/');
  });

  // Tenta casar — primeiro exato, depois com params
  const exactKey = '/' + segments.join('/');
  const matched = _match(segments.length ? segments : []);

  if (!matched) {
    // Tenta raiz explicitamente
    const rootHandler = _routes.get('/');
    if (segments.length === 0 && rootHandler) {
      await _render(() => rootHandler({}));
      return;
    }
    await _render(() => _render404(path));
    return;
  }

  await _render(() => matched.handler(matched.params));
}

/**
 * Troca o conteúdo do outlet com transição mínima.
 * @param {function(): Promise<void>} fn
 */
async function _render(fn) {
  if (!_outlet) return;
  _outlet.style.opacity = '0';
  try {
    await fn();
  } catch (err) {
    console.error('[router] erro ao renderizar rota:', err);
    _outlet.innerHTML = `<div class="page"><p style="color:var(--state-error)">Erro ao carregar módulo: ${_escape(err.message)}</p></div>`;
  }
  // Micro-animação de entrada
  requestAnimationFrame(() => {
    _outlet.style.transition = 'opacity 150ms ease';
    _outlet.style.opacity = '1';
  });
}

function _render404(path) {
  if (!_outlet) return;
  _outlet.innerHTML = `
    <div class="page" style="text-align:center; padding-top: 6rem;">
      <h1 style="color:var(--text-muted); font-size:4rem; font-weight:700;">404</h1>
      <p style="color:var(--text-secondary); margin:1rem 0 2rem;">Rota não encontrada: <code>${_escape(path)}</code></p>
      <button class="btn btn-secondary" data-nav="/">Voltar ao início</button>
    </div>
  `;
}

function _escape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
