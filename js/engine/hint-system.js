/**
 * engine/hint-system.js — Re-exporta sistema de dicas de feedback.js
 * Lavoisier — Laboratório Visual de Química
 *
 * O sistema de dicas e definido em feedback.js para manter cohesao.
 * Este arquivo re-exporta para compatibilidade com a estrutura de diretórios.
 */

export { getHint, renderHintBox } from './feedback.js';
