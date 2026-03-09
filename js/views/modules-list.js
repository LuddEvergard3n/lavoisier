/**
 * js/views/modules-list.js — View: Lista completa de módulos
 * Lavoisier — Laboratório Visual de Química
 */

import { esc } from '../ui.js';

const ALL_MODULES = [
  { id:'atomic-structure',  icon:'&#9737;', title:'Estrutura Atômica',       status:'available', desc:'Prótons, elétrons, camadas eletrônicas e modelos atômicos históricos.' },
  { id:'periodic-table',    icon:'&#9783;', title:'Tabela Periódica',         status:'available', desc:'Todos os elementos, famílias, períodos e tendências periódicas.' },
  { id:'chemical-bonds',    icon:'&#8734;', title:'Ligações Químicas',        status:'available', desc:'Iônica, covalente e metálica. Geometria molecular e polaridade.' },
  { id:'reactions',         icon:'&#8651;', title:'Reações Químicas',         status:'available', desc:'Balanceamento visual, conservação de massa e energia de reação.' },
  { id:'stoichiometry',     icon:'&#8736;', title:'Estequiometria',           status:'available', desc:'Mol, massa molar, proporções e regra de três visual.' },
  { id:'solutions',         icon:'&#9680;', title:'Soluções e pH',            status:'available', desc:'Dissolução, concentração, acidez e basicidade.' },
  { id:'thermochemistry',   icon:'&#9651;', title:'Termoquímica',             status:'available', desc:'Entalpia, calor de reação, Hess e calorimetria.' },
  { id:'kinetics',          icon:'&#9202;', title:'Cinética e Equilíbrio',    status:'available', desc:'Velocidade de reação, colisões e equilíbrio dinâmico.' },
  { id:'electrochemistry',  icon:'&#9889;', title:'Eletroquímica',            status:'available', desc:'Pilhas, eletrólise, oxidação e redução.' },
  { id:'organic',           icon:'&#9675;', title:'Química Orgânica',         status:'available', desc:'Cadeias carbônicas, funções orgânicas e compostos do cotidiano.' },
];

export function renderModules(outlet) {
  outlet.innerHTML = `
<div class="page">
  <h1 style="font-size:var(--text-xl);margin-bottom:0.5rem">Módulos</h1>
  <p style="color:var(--text-secondary);margin-bottom:2.5rem">
    Cada módulo segue o ciclo: fenômeno → visualização → interação → exercício → cotidiano.
  </p>

  <div style="margin-bottom:1.5rem;display:flex;gap:0.5rem;flex-wrap:wrap" role="group" aria-label="Filtro">
    <button class="btn btn-sm btn-secondary active" id="filter-all">Todos</button>
    <button class="btn btn-sm btn-ghost"             id="filter-avail">Disponíveis</button>
  </div>

  <div class="module-grid" id="modules-grid">
    ${ALL_MODULES.map(m => {
      const avail = m.status === 'available';
      return `
        <div class="module-card"
             role="${avail ? 'button' : 'article'}"
             tabindex="${avail ? '0' : '-1'}"
             style="${avail ? '' : 'opacity:0.55;cursor:default'}"
             data-status="${esc(m.status)}"
             ${avail ? `data-nav="/module/${esc(m.id)}"` : ''}
             aria-label="${esc(m.title)} — ${avail ? 'disponível' : 'em breve'}">
          <div class="module-card-title">${esc(m.title)}</div>
          <div class="module-card-desc">${esc(m.desc)}</div>
          <div class="module-card-meta">
            <span class="badge ${avail ? 'badge-electron' : 'badge-neutral'}">
              ${avail ? 'Disponível' : 'Em breve'}
            </span>
          </div>
        </div>
      `;
    }).join('')}
  </div>
</div>
`;

  // Filtro simples
  document.getElementById('filter-all')?.addEventListener('click', () => {
    document.querySelectorAll('#modules-grid .module-card').forEach(c => c.style.display = '');
    document.getElementById('filter-all').classList.add('active');
    document.getElementById('filter-avail').classList.remove('active');
  });
  document.getElementById('filter-avail')?.addEventListener('click', () => {
    document.querySelectorAll('#modules-grid .module-card').forEach(c => {
      c.style.display = c.dataset.status === 'available' ? '' : 'none';
    });
    document.getElementById('filter-avail').classList.add('active');
    document.getElementById('filter-all').classList.remove('active');
  });
}
