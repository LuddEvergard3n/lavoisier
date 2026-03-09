/**
 * ui.js — Utilitários de interface: DOM helpers, escape, toast, sidebar
 * Lavoisier — Laboratório Visual de Química
 */

/* -----------------------------------------------------------------------
   Escape HTML — previne XSS em toda inserção via innerHTML
----------------------------------------------------------------------- */

/**
 * Escapa string para inserção segura como HTML.
 * @param {unknown} val
 * @returns {string}
 */
export function esc(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* -----------------------------------------------------------------------
   Toast
----------------------------------------------------------------------- */

/** @type {HTMLElement | null} */
let _toastRegion = null;

export function initToast() {
  _toastRegion = document.getElementById('toast-region');
}

/**
 * Exibe toast de feedback.
 * @param {string} message
 * @param {'correct'|'error'|'hint'|'info'} type
 * @param {number} duration - ms
 */
export function showToast(message, type = 'info', duration = 3000) {
  if (!_toastRegion) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  _toastRegion.appendChild(toast);

  // Forçar reflow para ativar transição
  void toast.offsetWidth;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

/* -----------------------------------------------------------------------
   Sidebar mobile
----------------------------------------------------------------------- */

export function initSidebar() {
  const hamburger = document.getElementById('hamburger');
  const sidebar    = document.getElementById('sidebar');
  const overlay    = document.getElementById('sidebar-overlay');
  const closeBtn   = document.getElementById('sidebar-close');

  if (!hamburger || !sidebar || !overlay || !closeBtn) return;

  function open() {
    sidebar.classList.add('open');
    sidebar.removeAttribute('aria-hidden');
    overlay.classList.add('visible');
    hamburger.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
  }

  function close() {
    sidebar.classList.remove('open');
    sidebar.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('visible');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.focus();
  }

  hamburger.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  // Fechar sidebar ao navegar
  sidebar.querySelectorAll('.sidebar-link').forEach(btn => {
    btn.addEventListener('click', close);
  });

  // ESC fecha sidebar
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) close();
  });
}

/* -----------------------------------------------------------------------
   DOM helpers
----------------------------------------------------------------------- */

/**
 * Seleciona elemento com asserção.
 * @template {Element} T
 * @param {string} selector
 * @param {Element | Document} [root]
 * @returns {T | null}
 */
export function $ (selector, root = document) {
  return root.querySelector(selector);
}

/**
 * Seleciona todos os elementos correspondentes.
 * @param {string} selector
 * @param {Element | Document} [root]
 * @returns {NodeListOf<Element>}
 */
export function $$(selector, root = document) {
  return root.querySelectorAll(selector);
}

/**
 * Delega evento ao documento (útil para elementos dinâmicos).
 * @param {string} event
 * @param {string} selector
 * @param {function(Event): void} handler
 */
export function delegate(event, selector, handler) {
  document.addEventListener(event, e => {
    const target = e.target.closest(selector);
    if (target) handler(Object.assign(e, { delegateTarget: target }));
  });
}

/* -----------------------------------------------------------------------
   Utilitários de Canvas
----------------------------------------------------------------------- */

/**
 * Cria um canvas com suporte a pixel ratio alto (Retina).
 * @param {number} width  - largura CSS em px
 * @param {number} height - altura CSS em px
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, dpr: number }}
 */
export function createHiDPICanvas(width, height) {
  const dpr    = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(width  * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width  = width  + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { canvas, ctx, dpr };
}

/**
 * Redimensiona canvas HiDPI mantendo o ratio.
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @returns {number} dpr
 */
export function resizeHiDPICanvas(canvas, ctx, width, height) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(width  * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width  = width  + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(dpr, dpr);
  return dpr;
}

/* -----------------------------------------------------------------------
   Progress strip
----------------------------------------------------------------------- */

/**
 * Renderiza tira de progresso de seções.
 * @param {string[]} sections
 * @param {string[]} doneSections
 * @param {string}   currentSection
 * @returns {string} HTML
 */
export function renderProgressStrip(sections, doneSections, currentSection) {
  return `<div class="progress-strip" aria-label="Progresso do módulo">
    ${sections.map(s => {
      const isDone    = doneSections.includes(s);
      const isCurrent = s === currentSection;
      const cls = isDone ? 'done' : isCurrent ? 'current' : '';
      return `<div class="progress-step ${cls}" title="${esc(s)}"></div>`;
    }).join('')}
  </div>`;
}
