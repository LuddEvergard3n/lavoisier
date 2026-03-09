/**
 * engine/renderer.js — Primitivas de renderização Canvas 2D
 * Lavoisier — Laboratório Visual de Química
 *
 * Funções puras de desenho. Nenhuma referência ao DOM fora do canvas.
 * Todas as funções recebem o contexto 2D como primeiro argumento.
 */

/* -----------------------------------------------------------------------
   Constantes de cor (espelham tokens CSS, mas definidas aqui para
   uso direto no Canvas que não lê variáveis CSS)
----------------------------------------------------------------------- */
export const COLOR = {
  bg:          '#0d1117',
  surface:     '#161b22',
  raised:      '#1c2128',
  border:      '#30363d',
  electron:    '#4fc3f7',
  bond:        '#ffd166',
  organic:     '#6bcb77',
  reaction:    '#ef476f',
  energy:      '#ffa726',
  neutral:     '#b39ddb',
  textPrimary: '#e6edf3',
  textMuted:   '#6e7681',
  correct:     '#3fb950',
  error:       '#f85149',
  hint:        '#e3b341',

  // Cores por elemento (subset dos mais usados)
  H:  '#e6edf3',
  C:  '#8b949e',
  N:  '#4fc3f7',
  O:  '#ef476f',
  F:  '#6bcb77',
  Cl: '#6bcb77',
  Br: '#ffa726',
  S:  '#ffd166',
  P:  '#ffa726',
  Na: '#ef5350',
  K:  '#ef5350',
  Ca: '#ffa726',
  Fe: '#ffd166',
  Cu: '#4fc3f7',
  Zn: '#b39ddb',
  Mg: '#a5d6a7',
};

/**
 * Retorna a cor de um elemento pelo símbolo.
 * @param {string} symbol
 * @returns {string}
 */
export function elementColor(symbol) {
  return COLOR[symbol] || COLOR.neutral;
}

/* -----------------------------------------------------------------------
   Funções de desenho fundamentais
----------------------------------------------------------------------- */

/**
 * Limpa o canvas com a cor de fundo padrão.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w - largura lógica
 * @param {number} h - altura lógica
 */
export function clearCanvas(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Desenha um átomo como círculo com símbolo centralizado.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} r       - raio
 * @param {string} symbol  - símbolo do elemento
 * @param {Object} [opts]
 * @param {boolean} [opts.glow]
 * @param {boolean} [opts.selected]
 * @param {number}  [opts.opacity]
 */
export function drawAtom(ctx, x, y, r, symbol, opts = {}) {
  const color = elementColor(symbol);
  const { glow = false, selected = false, opacity = 1 } = opts;

  ctx.save();
  ctx.globalAlpha = opacity;

  if (glow || selected) {
    ctx.shadowColor = color;
    ctx.shadowBlur  = selected ? 18 : 10;
  }

  // Preenchimento
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, lighten(color, 0.35));
  grad.addColorStop(1, darken(color, 0.3));
  ctx.fillStyle = grad;
  ctx.fill();

  // Borda
  ctx.strokeStyle = selected ? COLOR.bond : color;
  ctx.lineWidth   = selected ? 2.5 : 1.5;
  ctx.stroke();

  // Símbolo
  ctx.shadowBlur  = 0;
  ctx.fillStyle   = luminance(color) > 0.45 ? '#0d1117' : '#e6edf3';
  ctx.font        = `bold ${Math.max(10, r * 0.8)}px "Segoe UI", sans-serif`;
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol.length > 2 ? symbol.slice(0, 2) : symbol, x, y);

  ctx.restore();
}

/**
 * Desenha uma órbita (elipse ou círculo) de elétrons — modelo de Bohr.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx      - centro x
 * @param {number} cy      - centro y
 * @param {number} rx      - raio x
 * @param {number} ry      - raio y
 * @param {number} [angle] - rotação em radianos
 * @param {number} [alpha] - opacidade
 */
export function drawOrbit(ctx, cx, cy, rx, ry, angle = 0, alpha = 0.25) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = COLOR.electron;
  ctx.lineWidth   = 1;
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.restore();
}

/**
 * Desenha um elétron em posição angular sobre uma órbita elíptica.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {number} theta   - ângulo atual (radianos)
 * @param {number} orbitAngle - inclinação da órbita
 * @param {number} [r]     - raio do elétron
 */
export function drawElectron(ctx, cx, cy, rx, ry, theta, orbitAngle = 0, r = 4) {
  const ex = cx + Math.cos(theta + orbitAngle) * rx * Math.cos(orbitAngle)
                - Math.sin(theta + orbitAngle) * ry * Math.sin(orbitAngle);
  const ey = cy + Math.cos(theta + orbitAngle) * rx * Math.sin(orbitAngle)
                + Math.sin(theta + orbitAngle) * ry * Math.cos(orbitAngle);

  ctx.save();
  ctx.shadowColor = COLOR.electron;
  ctx.shadowBlur  = 8;
  ctx.beginPath();
  ctx.arc(ex, ey, r, 0, Math.PI * 2);
  ctx.fillStyle = COLOR.electron;
  ctx.fill();
  ctx.restore();
}

/**
 * Desenha ligação química entre dois pontos.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {1|2|3} order - ordem da ligação
 * @param {string} [color]
 */
export function drawBond(ctx, x1, y1, x2, y2, order = 1, color = COLOR.bond) {
  const dx  = x2 - x1;
  const dy  = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return;

  const nx = -dy / len;  // normal perpendicular
  const ny =  dx / len;
  const gap = 4;          // separação entre linhas em ligação múltipla

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  ctx.lineCap     = 'round';

  const offsets = order === 1 ? [0]
    : order === 2 ? [-gap / 2, gap / 2]
    : [-gap, 0, gap];

  for (const off of offsets) {
    ctx.beginPath();
    ctx.moveTo(x1 + nx * off, y1 + ny * off);
    ctx.lineTo(x2 + nx * off, y2 + ny * off);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Desenha seta de dipolo (polaridade).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {string} [color]
 */
export function drawDipole(ctx, x1, y1, x2, y2, color = COLOR.neutral) {
  const dx  = x2 - x1;
  const dy  = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return;

  const ux = dx / len;
  const uy = dy / len;
  const head = 10;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = 2;
  ctx.lineCap     = 'round';

  // Linha com sinal de + na cauda
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * head, y2 - uy * head);
  ctx.stroke();

  // Seta
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * head - uy * 5, y2 - uy * head + ux * 5);
  ctx.lineTo(x2 - ux * head + uy * 5, y2 - uy * head - ux * 5);
  ctx.closePath();
  ctx.fill();

  // + na cauda
  ctx.font      = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', x1, y1);

  ctx.restore();
}

/**
 * Desenha partícula simples (para simulação de colisão).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {string} color
 * @param {number} [alpha]
 */
export function drawParticle(ctx, x, y, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur  = 6;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/**
 * Texto com sombra (para rótulos sobre Canvas escuro).
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {string} [color]
 * @param {string} [font]
 */
export function drawLabel(ctx, text, x, y, color = COLOR.textPrimary, font = '13px "Segoe UI", sans-serif') {
  ctx.save();
  ctx.font         = font;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#0d1117';
  ctx.fillText(text, x + 1, y + 1);  // sombra
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/* -----------------------------------------------------------------------
   Auxiliares de cor
----------------------------------------------------------------------- */

/**
 * Clareia uma cor hex em um fator (0-1).
 * @param {string} hex
 * @param {number} factor
 * @returns {string}
 */
export function lighten(hex, factor) {
  const [r, g, b] = hexToRGB(hex);
  return `rgb(${clamp(r + (255 - r) * factor)}, ${clamp(g + (255 - g) * factor)}, ${clamp(b + (255 - b) * factor)})`;
}

/**
 * Escurece uma cor hex.
 * @param {string} hex
 * @param {number} factor
 * @returns {string}
 */
export function darken(hex, factor) {
  const [r, g, b] = hexToRGB(hex);
  return `rgb(${clamp(r * (1 - factor))}, ${clamp(g * (1 - factor))}, ${clamp(b * (1 - factor))})`;
}

/**
 * Luminância relativa aproximada de uma cor hex (0-1).
 */
export function luminance(hex) {
  const [r, g, b] = hexToRGB(hex).map(v => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRGB(hex) {
  const c = hex.replace('#', '');
  const v = parseInt(c.length === 3
    ? c.split('').map(x => x + x).join('')
    : c, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
