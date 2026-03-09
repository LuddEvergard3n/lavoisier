/**
 * state.js — Gerenciamento de estado global e persistência (localStorage)
 * Lavoisier — Laboratório Visual de Química
 *
 * Estado imutável por convenção: mutações APENAS via setState().
 * Módulos externos leem getState() e ouvem eventos 'statechange'.
 */

const STORAGE_KEY = 'lavoisier_v1';

/**
 * Estado padrão da aplicação.
 * Persiste via localStorage após cada modificação.
 *
 * @typedef {Object} AppState
 * @property {string}  currentRoute        - rota atual
 * @property {Object}  progress            - progresso por módulo (moduleId -> seção -> boolean)
 * @property {Object}  attempts            - tentativas por exercício (exId -> count)
 * @property {Object}  hintUsed            - se dica foi usada (exId -> boolean)
 * @property {string}  theme               - 'dark' (única opção por ora)
 * @property {number}  fontSize            - multiplicador de fonte (1 = padrão)
 * @property {boolean} highContrast        - modo de alto contraste
 */

let _state = {
  currentRoute:  '/',
  progress:      {},
  attempts:      {},
  hintUsed:      {},
  theme:         'dark',
  fontSize:      1,
  highContrast:  false,
};

/**
 * Carrega estado persistido do localStorage.
 * Falha silenciosamente se storage não estiver disponível.
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    // Merge seguro: campos novos adicionados no futuro são preservados
    _state = Object.assign({}, _state, saved);
  } catch (_e) {
    // localStorage indisponível ou JSON corrompido — ignora
  }
}

/**
 * Salva estado atual no localStorage.
 */
function _persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  } catch (_e) {
    // storage cheio ou indisponível — ignora
  }
}

/**
 * Retorna snapshot imutável do estado atual.
 * @returns {AppState}
 */
export function getState() {
  return Object.freeze(Object.assign({}, _state));
}

/**
 * Aplica atualização parcial ao estado e dispara evento 'statechange'.
 * @param {Partial<AppState>} patch
 */
export function setState(patch) {
  _state = Object.assign({}, _state, patch);
  _persist();
  window.dispatchEvent(new CustomEvent('statechange', { detail: _state }));
}

/**
 * Marca uma seção de módulo como concluída.
 * @param {string} moduleId
 * @param {string} section   - 'visualization' | 'exercise' | 'reallife' etc.
 */
export function markSectionDone(moduleId, section) {
  const progress = Object.assign({}, _state.progress);
  progress[moduleId] = Object.assign({}, progress[moduleId], { [section]: true });
  setState({ progress });
}

/**
 * Retorna o progresso percentual de um módulo (0-100).
 * @param {string} moduleId
 * @param {string[]} sections - todas as seções possíveis
 * @returns {number}
 */
export function moduleProgress(moduleId, sections) {
  const done = _state.progress[moduleId] || {};
  const count = sections.filter(s => done[s]).length;
  return sections.length === 0 ? 0 : Math.round((count / sections.length) * 100);
}

/**
 * Registra tentativa de exercício e retorna total de tentativas.
 * @param {string} exerciseId
 * @returns {number}
 */
export function recordAttempt(exerciseId) {
  const attempts = Object.assign({}, _state.attempts);
  attempts[exerciseId] = (attempts[exerciseId] || 0) + 1;
  setState({ attempts });
  return attempts[exerciseId];
}

/**
 * Marca que o aluno usou a dica de um exercício.
 * @param {string} exerciseId
 */
export function markHintUsed(exerciseId) {
  const hintUsed = Object.assign({}, _state.hintUsed);
  hintUsed[exerciseId] = true;
  setState({ hintUsed });
}

/**
 * Zera todo o progresso (mantém preferências de acessibilidade).
 */
export function resetProgress() {
  setState({ progress: {}, attempts: {}, hintUsed: {} });
}
