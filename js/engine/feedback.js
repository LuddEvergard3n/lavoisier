/**
 * engine/feedback.js — Sistema de feedback imediato e progressivo
 * Lavoisier — Laboratório Visual de Química
 *
 * Filosofia: o feedback nunca entrega a resposta.
 * Ele reduz o espaço de busca e direciona o raciocínio.
 */

import { showToast } from '../ui.js';
import { recordAttempt, markHintUsed } from '../state.js';

/**
 * Processa resposta de exercício e retorna feedback estruturado.
 *
 * @param {string}   exerciseId
 * @param {unknown}  given       - resposta dada pelo aluno
 * @param {unknown}  expected    - resposta correta
 * @param {Object}   [opts]
 * @param {function(string): string} [opts.feedbackFn] - gerador de feedback customizado
 * @returns {{ correct: boolean, attempts: number, message: string }}
 */
export function evaluateAnswer(exerciseId, given, expected, opts = {}) {
  const correct  = _deepEqual(given, expected);
  const attempts = recordAttempt(exerciseId);

  let message;
  if (correct) {
    message = _correctMessages[attempts > 2 ? 2 : attempts - 1] ?? 'Correto!';
    showToast(message, 'correct', 2500);
  } else {
    message = opts.feedbackFn
      ? opts.feedbackFn(given)
      : _wrongFeedback(attempts);
    showToast(message, 'error', 3000);
  }

  return { correct, attempts, message };
}

const _correctMessages = [
  'Correto! Bom raciocínio.',
  'Certo! Continue assim.',
  'Correto, mesmo depois de algumas tentativas. O importante e ter chegado la.',
];

function _wrongFeedback(attempts) {
  if (attempts === 1) return 'Nao esta certo. Observe a simulacao e tente novamente.';
  if (attempts === 2) return 'Tente com calma. Releia o conceito acima.';
  return 'Ainda nao. Use a dica abaixo para uma pista.';
}

/**
 * Verifica igualdade profunda para respostas simples (string, number, array).
 */
function _deepEqual(a, b) {
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => _deepEqual(v, b[i]));
  }
  if (typeof a === 'string') return a.trim().toLowerCase() === String(b).trim().toLowerCase();
  if (typeof a === 'number') return Math.abs(a - b) < 0.001;
  return a === b;
}

/* -----------------------------------------------------------------------
   engine/hint-system.js — Sistema de dicas progressivas
----------------------------------------------------------------------- */

/**
 * Retorna a dica adequada para um exercício dado o numero de tentativas.
 * As dicas ficam progressivamente mais diretas.
 *
 * @param {string}   exerciseId
 * @param {string[]} hints        - lista de dicas em ordem crescente de revelacao
 * @param {number}   attempts     - tentativas ja feitas
 * @returns {{ text: string, level: number }}
 */
export function getHint(exerciseId, hints, attempts) {
  markHintUsed(exerciseId);
  if (!hints || hints.length === 0) {
    return { text: 'Observe a simulacao com atencao.', level: 0 };
  }
  // Escolhe a dica de acordo com o numero de tentativas (maxima = ultima)
  const level = Math.min(attempts - 1, hints.length - 1);
  return { text: hints[Math.max(0, level)], level };
}

/**
 * Renderiza o elemento HTML de dica.
 * @param {string} text
 * @returns {string} HTML
 */
export function renderHintBox(text) {
  return `<div class="hint-box visible" role="note" aria-label="Dica">${_esc(text)}</div>`;
}

function _esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
