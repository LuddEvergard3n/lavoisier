/**
 * engine/simulation.js — Motor de simulação e loop de animação
 * Lavoisier — Laboratório Visual de Química
 *
 * Fornece:
 *  - SimLoop: gerenciador de requestAnimationFrame com delta-time
 *  - Particle: partícula com posição, velocidade e colisão com paredes
 *  - ElectronOrbit: elétron orbital para modelo de Bohr
 */

/* -----------------------------------------------------------------------
   SimLoop — Loop principal de animação
----------------------------------------------------------------------- */

/**
 * Gerencia um loop de animação com delta-time normalizado.
 *
 * Uso:
 *   const loop = new SimLoop((dt, t) => render(dt, t));
 *   loop.start();
 *   loop.stop();
 */
export class SimLoop {
  /**
   * @param {function(number, number): void} tick - (deltaSeconds, totalSeconds)
   */
  constructor(tick) {
    this._tick    = tick;
    this._rafId   = null;
    this._prev    = 0;
    this._elapsed = 0;
    this._running = false;
    this._bound   = this._frame.bind(this);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._prev    = performance.now();
    this._rafId   = requestAnimationFrame(this._bound);
  }

  stop() {
    this._running = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /** @param {DOMHighResTimeStamp} now */
  _frame(now) {
    if (!this._running) return;
    const dt = Math.min((now - this._prev) / 1000, 0.1); // cap 100ms (tab blur)
    this._prev     = now;
    this._elapsed += dt;
    this._tick(dt, this._elapsed);
    this._rafId = requestAnimationFrame(this._bound);
  }
}

/* -----------------------------------------------------------------------
   ElectronOrbit — Elétron em órbita elíptica (Bohr)
----------------------------------------------------------------------- */

/**
 * Representa um elétron em uma órbita elíptica com velocidade angular.
 */
export class ElectronOrbit {
  /**
   * @param {number} cx          - centro x do núcleo
   * @param {number} cy          - centro y do núcleo
   * @param {number} rx          - raio maior da órbita
   * @param {number} ry          - raio menor da órbita
   * @param {number} speed       - velocidade angular (rad/s)
   * @param {number} initialAngle
   * @param {number} [tilt]      - inclinação da órbita (radianos)
   */
  constructor(cx, cy, rx, ry, speed, initialAngle = 0, tilt = 0) {
    this.cx    = cx;
    this.cy    = cy;
    this.rx    = rx;
    this.ry    = ry;
    this.speed = speed;
    this.angle = initialAngle;
    this.tilt  = tilt;
  }

  /**
   * Avança o ângulo com delta-time.
   * @param {number} dt
   */
  update(dt) {
    this.angle += this.speed * dt;
  }

  /**
   * Retorna posição (x, y) atual do elétron na órbita inclinada.
   * @returns {{ x: number, y: number }}
   */
  position() {
    const cos = Math.cos(this.tilt);
    const sin = Math.sin(this.tilt);
    const lx  = Math.cos(this.angle) * this.rx;
    const ly  = Math.sin(this.angle) * this.ry;
    return {
      x: this.cx + lx * cos - ly * sin,
      y: this.cy + lx * sin + ly * cos,
    };
  }
}

/* -----------------------------------------------------------------------
   Particle — Partícula com física básica (colisão com paredes)
----------------------------------------------------------------------- */

/**
 * Partícula 2D com velocidade e colisão elástica com bordas.
 */
export class Particle {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} vx    - velocidade x (px/s)
   * @param {number} vy    - velocidade y (px/s)
   * @param {number} r     - raio
   * @param {string} color
   * @param {string} [label]
   */
  constructor(x, y, vx, vy, r, color, label = '') {
    this.x     = x;
    this.y     = y;
    this.vx    = vx;
    this.vy    = vy;
    this.r     = r;
    this.color = color;
    this.label = label;
    this.alive = true;
  }

  /**
   * Atualiza posição e rebate nas paredes.
   * @param {number} dt
   * @param {number} w   - largura do container
   * @param {number} h   - altura do container
   */
  update(dt, w, h) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x - this.r < 0)   { this.x = this.r;     this.vx *= -1; }
    if (this.x + this.r > w)   { this.x = w - this.r; this.vx *= -1; }
    if (this.y - this.r < 0)   { this.y = this.r;     this.vy *= -1; }
    if (this.y + this.r > h)   { this.y = h - this.r; this.vy *= -1; }
  }

  /**
   * Verifica colisão com outra partícula.
   * @param {Particle} other
   * @returns {boolean}
   */
  collidesWith(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy) < this.r + other.r;
  }
}

/* -----------------------------------------------------------------------
   Utilitários de geração aleatória reproduzível
----------------------------------------------------------------------- */

/**
 * RNG de Mulberry32 — determinístico com seed.
 * @param {number} seed
 * @returns {function(): number}  - retorna [0, 1)
 */
export function makeRNG(seed) {
  let s = seed >>> 0;
  return function () {
    s  += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Distribui N partículas aleatoriamente dentro de uma área.
 * @param {number} n
 * @param {number} w
 * @param {number} h
 * @param {number} r         - raio das partículas
 * @param {number} speed     - velocidade escalar
 * @param {string} color
 * @param {string} [label]
 * @param {number} [seed]
 * @returns {Particle[]}
 */
export function spawnParticles(n, w, h, r, speed, color, label = '', seed = 42) {
  const rng = makeRNG(seed);
  const particles = [];
  for (let i = 0; i < n; i++) {
    const x  = r + rng() * (w - 2 * r);
    const y  = r + rng() * (h - 2 * r);
    const a  = rng() * Math.PI * 2;
    const vx = Math.cos(a) * speed;
    const vy = Math.sin(a) * speed;
    particles.push(new Particle(x, y, vx, vy, r, color, label));
  }
  return particles;
}
