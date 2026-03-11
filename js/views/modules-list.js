/**
 * js/views/modules-list.js — View: Lista completa de módulos
 * Lavoisier — Laboratório Visual de Química
 *
 * Carrega data/modules.json via fetch, exibe grade com:
 *   - filtro por nível (Todos / Ensino Médio / Graduação / Pós)
 *   - busca por título e tópicos
 *   - barra de progresso por módulo (visited + exercise)
 *   - badge de nível, tempo estimado e pré-requisitos
 */

import { esc }                        from '../ui.js';
import { moduleProgress, getState }   from '../state.js';

// Seções usadas para calcular o progresso de cada módulo.
// 'visited' = usuário abriu o módulo; 'exercise' = acertou ao menos um exercício.
const PROGRESS_SECTIONS = ['visited', 'exercise'];

const LEVEL_LABEL = {
  'high-school': 'Ensino Médio',
  'university':  'Graduação',
  'graduate':    'Pós-graduação',
};

const LEVEL_BADGE_CLASS = {
  'high-school': 'badge-electron',
  'university':  'badge-bond',
  'graduate':    'badge-organic',
};

// Cache para não re-fazer fetch em cada render (ex: voltar e avançar)
let _cachedModules = null;

// Estado de filtro e busca — resetado em renderModules()
let _activeLevel  = 'all';
let _searchQuery  = '';

// -------------------------------------------------------------------------
// Render principal
// -------------------------------------------------------------------------
export async function renderModules(outlet) {
  _activeLevel = 'all';
  _searchQuery = '';

  // Esqueleto imediato enquanto carrega
  outlet.innerHTML = _buildShell();
  _bindEvents(outlet);

  if (!_cachedModules) {
    try {
      const res = await fetch('data/modules.json');
      _cachedModules = await res.json();
    } catch (e) {
      document.getElementById('modules-grid').innerHTML =
        `<p style="color:var(--accent-reaction)">Erro ao carregar módulos: ${esc(String(e))}</p>`;
      return;
    }
  }

  _renderGrid();
}

// -------------------------------------------------------------------------
// Shell HTML (sem os cards — carregados após fetch)
// -------------------------------------------------------------------------
function _buildShell() {
  return `
<div class="page" id="modules-page">
  <header style="margin-bottom:var(--space-6)">
    <h1 style="font-size:var(--text-2xl);margin-bottom:var(--space-2)">Módulos</h1>
    <p style="color:var(--text-secondary);max-width:520px">
      Cada módulo segue o ciclo: fenômeno → visualização → interação → exercício → cotidiano.
      O progresso é salvo automaticamente.
    </p>
  </header>

  <!-- Controles: filtro + busca -->
  <div style="display:flex;flex-wrap:wrap;align-items:center;
              gap:var(--space-3);margin-bottom:var(--space-5)">

    <!-- Filtro por nível -->
    <div role="group" aria-label="Filtrar por nível"
         id="level-filter"
         style="display:flex;gap:var(--space-2);flex-wrap:wrap">
      <button class="btn btn-xs btn-secondary" data-level="all">Todos</button>
      <button class="btn btn-xs btn-ghost"     data-level="high-school">Ensino Médio</button>
      <button class="btn btn-xs btn-ghost"     data-level="university">Graduação</button>
      <button class="btn btn-xs btn-ghost"     data-level="graduate">Pós-graduação</button>
    </div>

    <!-- Separador visual -->
    <div style="width:1px;height:24px;background:var(--border-subtle);
                display:none" id="filter-sep" aria-hidden="true"></div>

    <!-- Campo de busca -->
    <div style="position:relative;flex:1;min-width:180px;max-width:320px">
      <input
        id="module-search"
        type="search"
        placeholder="Buscar por título ou tópico…"
        autocomplete="off"
        aria-label="Buscar módulos"
        style="width:100%;padding:.4rem .75rem .4rem 2rem;
               background:var(--bg-raised);border:1px solid var(--border-default);
               border-radius:6px;color:var(--text-primary);
               font-size:var(--text-sm);outline:none;box-sizing:border-box">
      <svg style="position:absolute;left:.6rem;top:50%;transform:translateY(-50%);
                  opacity:.4;pointer-events:none"
           width="13" height="13" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    </div>

    <!-- Contador de resultados -->
    <span id="module-count"
          style="font-size:var(--text-xs);color:var(--text-muted);white-space:nowrap">
    </span>
  </div>

  <!-- Grade de módulos -->
  <div id="modules-grid" aria-live="polite">
    <p style="color:var(--text-muted);font-size:var(--text-sm)">Carregando…</p>
  </div>

  <!-- Resumo de progresso total -->
  <div id="progress-summary"
       style="margin-top:var(--space-8);padding-top:var(--space-5);
              border-top:1px solid var(--border-subtle)">
  </div>
</div>`;
}

// -------------------------------------------------------------------------
// Renderiza a grade filtrada
// -------------------------------------------------------------------------
function _renderGrid() {
  if (!_cachedModules) return;

  const state   = getState();
  const query   = _searchQuery.toLowerCase().trim();

  const filtered = _cachedModules.filter(m => {
    const levelOk = _activeLevel === 'all' || m.level === _activeLevel;
    if (!levelOk) return false;
    if (!query) return true;
    const haystack = [
      m.title,
      m.description || '',
      ...(m.topics || []),
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });

  const grid   = document.getElementById('modules-grid');
  const count  = document.getElementById('module-count');
  const sumDiv = document.getElementById('progress-summary');
  if (!grid) return;

  // Contador
  if (count) {
    count.textContent = filtered.length === _cachedModules.length
      ? `${filtered.length} módulos`
      : `${filtered.length} de ${_cachedModules.length}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <p style="color:var(--text-muted);font-size:var(--text-sm);padding:var(--space-4) 0">
        Nenhum módulo encontrado para "<strong>${esc(query)}</strong>".
      </p>`;
    return;
  }

  grid.innerHTML = `
    <div style="display:grid;
                grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
                gap:var(--space-4)">
      ${filtered.map(m => _buildCard(m, state)).join('')}
    </div>`;

  // Resumo global (apenas quando mostra todos)
  if (_activeLevel === 'all' && !query && sumDiv) {
    const done  = _cachedModules.filter(m =>
      moduleProgress(m.id, PROGRESS_SECTIONS) === 100).length;
    const total = _cachedModules.length;
    const pct   = Math.round((done / total) * 100);

    sumDiv.innerHTML = `
      <div style="display:flex;align-items:center;gap:var(--space-4);flex-wrap:wrap">
        <div>
          <p style="font-size:var(--text-xs);color:var(--text-muted);
                    text-transform:uppercase;letter-spacing:.05em;margin-bottom:.3rem">
            Progresso geral
          </p>
          <p style="font-size:var(--text-base);color:var(--text-primary);font-weight:600">
            ${done} de ${total} módulos concluídos
          </p>
        </div>
        <div style="flex:1;min-width:160px;max-width:300px">
          <div style="height:6px;border-radius:3px;background:var(--bg-raised);overflow:hidden">
            <div style="height:100%;border-radius:3px;width:${pct}%;
                        background:var(--accent-organic);
                        transition:width .4s ease"></div>
          </div>
          <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:.3rem">
            ${pct}% concluído
          </p>
        </div>
        ${done > 0 ? `
          <button class="btn btn-xs btn-ghost"
                  id="reset-progress-btn"
                  style="color:var(--accent-reaction);margin-left:auto">
            Resetar progresso
          </button>` : ''}
      </div>`;

    document.getElementById('reset-progress-btn')?.addEventListener('click', () => {
      if (!confirm('Resetar todo o progresso? Essa ação não pode ser desfeita.')) return;
      import('../state.js').then(({ resetProgress }) => {
        resetProgress();
        _renderGrid();
      });
    });
  } else if (sumDiv) {
    sumDiv.innerHTML = '';
  }
}

// -------------------------------------------------------------------------
// Card individual de módulo
// -------------------------------------------------------------------------
function _buildCard(m, state) {
  const pct        = moduleProgress(m.id, PROGRESS_SECTIONS);
  const isVisited  = state.progress?.[m.id]?.visited  ?? false;
  const hasExercise= state.progress?.[m.id]?.exercise ?? false;
  const levelLabel = LEVEL_LABEL[m.level]      || m.level;
  const badgeCls   = LEVEL_BADGE_CLASS[m.level] || 'badge-neutral';

  // Highlight de termos buscados no título
  const titleHtml = _highlight(m.title, _searchQuery);

  // Pré-requisitos (apenas os 2 primeiros para não sobrecarregar)
  const prereqs  = (m.prerequisites || []).slice(0, 2);
  const prereqHtml = prereqs.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-top:var(--space-2)">
        ${prereqs.map(p => {
          const dep = _cachedModules?.find(x => x.id === p);
          return `<span style="font-size:var(--text-xs);padding:.1rem .45rem;
                              border-radius:3px;background:var(--bg-raised);
                              color:var(--text-muted);border:1px solid var(--border-subtle)">
                    ${esc(dep?.title || p)}
                  </span>`;
        }).join('')}
        ${m.prerequisites.length > 2
          ? `<span style="font-size:var(--text-xs);color:var(--text-muted)">
               +${m.prerequisites.length - 2}</span>` : ''}
      </div>`
    : '';

  // Estado do card
  const cardBorder = pct === 100
    ? 'border-color:var(--accent-organic)'
    : isVisited ? 'border-color:var(--border-default)' : '';

  return `
    <div class="module-card"
         role="button"
         tabindex="0"
         data-nav="/module/${esc(m.id)}"
         aria-label="${esc(m.title)}"
         style="display:flex;flex-direction:column;gap:0;
                padding:var(--space-4);cursor:pointer;
                border:1px solid var(--border-subtle);border-radius:8px;
                background:var(--bg-secondary);
                transition:border-color .15s,transform .1s;${cardBorder}">

      <!-- Cabeçalho: título + badge de nível -->
      <div style="display:flex;align-items:flex-start;
                  justify-content:space-between;gap:var(--space-2);margin-bottom:.4rem">
        <span class="module-card-title" style="flex:1;font-weight:600;
               font-size:var(--text-base);line-height:1.3">
          ${titleHtml}
        </span>
        <span class="badge ${esc(badgeCls)}"
              style="white-space:nowrap;flex-shrink:0;font-size:10px">
          ${esc(levelLabel)}
        </span>
      </div>

      <!-- Descrição -->
      <p style="font-size:var(--text-sm);color:var(--text-secondary);
                line-height:1.5;flex:1;margin:0 0 var(--space-3)">
        ${esc(m.description || '')}
      </p>

      ${prereqHtml}

      <!-- Rodapé: tempo + barra de progresso -->
      <div style="margin-top:var(--space-3);padding-top:var(--space-3);
                  border-top:1px solid var(--border-subtle)">
        <div style="display:flex;align-items:center;
                    justify-content:space-between;margin-bottom:.4rem">
          <span style="font-size:var(--text-xs);color:var(--text-muted)">
            ${esc(String(m.estimatedTime || '—'))} min
          </span>
          <span style="font-size:var(--text-xs);font-weight:600;
                       color:${pct === 100 ? 'var(--accent-organic)' : 'var(--text-muted)'}">
            ${pct === 100 ? '✓ Concluído' : pct === 50 ? 'Em andamento' : 'Não iniciado'}
          </span>
        </div>
        <div style="height:4px;border-radius:2px;
                    background:var(--bg-raised);overflow:hidden">
          <div style="height:100%;border-radius:2px;
                      width:${pct}%;
                      background:${pct === 100
                        ? 'var(--accent-organic)'
                        : 'var(--accent-electron)'};
                      transition:width .3s ease"></div>
        </div>
      </div>
    </div>`;
}

// -------------------------------------------------------------------------
// Eventos de filtro e busca
// -------------------------------------------------------------------------
function _bindEvents(outlet) {
  // Filtro por nível — delegação no container
  outlet.addEventListener('click', e => {
    const btn = e.target.closest('[data-level]');
    if (!btn) return;

    _activeLevel = btn.dataset.level;

    // Atualiza estilo dos botões
    outlet.querySelectorAll('[data-level]').forEach(b => {
      b.className = 'btn btn-xs ' +
        (b.dataset.level === _activeLevel ? 'btn-secondary' : 'btn-ghost');
    });

    _renderGrid();
  });

  // Busca — debounce de 150ms
  let _debounceId = null;
  outlet.addEventListener('input', e => {
    if (e.target.id !== 'module-search') return;
    clearTimeout(_debounceId);
    _debounceId = setTimeout(() => {
      _searchQuery = e.target.value;
      _renderGrid();
    }, 150);
  });
}

// -------------------------------------------------------------------------
// Utilitário: destaca termos da busca no texto
// -------------------------------------------------------------------------
function _highlight(text, query) {
  if (!query.trim()) return esc(text);
  const escaped = esc(text);
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(re,
    '<mark style="background:rgba(255,209,102,.25);color:inherit;border-radius:2px">$1</mark>');
}
