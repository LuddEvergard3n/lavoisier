/**
 * engine/interaction.js — Abstração de eventos de interação (mouse e touch)
 * Lavoisier — Laboratório Visual de Química
 *
 * Fornece uma camada unificada sobre mouse e touch para Canvas 2D.
 * Não depende de bibliotecas externas.
 */

/**
 * Retorna coordenadas lógicas (CSS px) de um evento pointer sobre um canvas.
 * Considera position e devicePixelRatio automaticamente.
 *
 * @param {MouseEvent|TouchEvent} event
 * @param {HTMLCanvasElement}     canvas
 * @returns {{ x: number, y: number }}
 */
export function canvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  // touches[0] é undefined em touchend (dedo já levantado).
  // changedTouches[0] contém a posição do último toque encerrado.
  const src  = (event.touches && event.touches[0])
             || (event.changedTouches && event.changedTouches[0])
             || event;
  return {
    x: src.clientX - rect.left,
    y: src.clientY - rect.top,
  };
}

/**
 * Verifica se um ponto esta dentro de um círculo.
 * @param {number} px
 * @param {number} py
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @returns {boolean}
 */
export function hitCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

/**
 * Verifica se um ponto esta dentro de um retangulo.
 * @param {number} px
 * @param {number} py
 * @param {number} rx
 * @param {number} ry
 * @param {number} rw
 * @param {number} rh
 * @returns {boolean}
 */
export function hitRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * DragManager — facilita arrastar elementos sobre Canvas.
 *
 * Uso:
 *   const dm = new DragManager(canvas);
 *   dm.onDragStart = (x, y) => findItem(x, y);
 *   dm.onDragMove  = (x, y, item) => item.x = x;
 *   dm.onDragEnd   = (x, y, item) => snap(item);
 */
export class DragManager {
  constructor(canvas) {
    this._canvas  = canvas;
    this._item    = null;
    this._active  = false;
    this._abort   = new AbortController();

    /** @type {function(number, number): unknown} */
    this.onDragStart = null;
    /** @type {function(number, number, unknown): void} */
    this.onDragMove  = null;
    /** @type {function(number, number, unknown): void} */
    this.onDragEnd   = null;

    this._bindEvents();
  }

  _bindEvents() {
    const c   = this._canvas;
    const sig = this._abort.signal;

    // Mouse — canvas recebe mousedown, window recebe move/up para capturar
    // arrastar fora do canvas sem perder o evento
    c.addEventListener('mousedown',  e => this._start(e), { signal: sig });
    window.addEventListener('mousemove', e => this._move(e), { signal: sig });
    window.addEventListener('mouseup',   e => this._end(e),  { signal: sig });

    // Touch — passive:false permite preventDefault() para bloquear scroll
    // durante drag; signal garante remoção automática no destroy()
    c.addEventListener('touchstart',
      e => { e.preventDefault(); this._start(e); },
      { passive: false, signal: sig }
    );
    window.addEventListener('touchmove',
      e => { if (this._active) e.preventDefault(); this._move(e); },
      { passive: false, signal: sig }
    );
    window.addEventListener('touchend', e => this._end(e), { signal: sig });
  }

  _start(e) {
    if (!this.onDragStart) return;
    const { x, y } = canvasPoint(e, this._canvas);
    this._item   = this.onDragStart(x, y);
    this._active = this._item !== null && this._item !== undefined;
  }

  _move(e) {
    if (!this._active || !this.onDragMove) return;
    const { x, y } = canvasPoint(e, this._canvas);
    this.onDragMove(x, y, this._item);
  }

  _end(e) {
    if (!this._active) return;
    const { x, y } = canvasPoint(e, this._canvas);
    if (this.onDragEnd) this.onDragEnd(x, y, this._item);
    this._item   = null;
    this._active = false;
  }

  /**
   * Remove todos os event listeners registrados pelo DragManager.
   * Deve ser chamado quando o componente que contém o canvas for destruído.
   */
  destroy() {
    this._abort.abort();
    this._item   = null;
    this._active = false;
  }
}
