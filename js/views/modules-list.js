/**
 * js/views/modules-list.js — View: Lista completa de módulos
 * Lavoisier — Laboratório Visual de Química
 */

import { esc } from '../ui.js';

const ALL_MODULES = [
  { id:'atomic-structure',  icon:'&#9737;', title:'Estrutura Atômica',       desc:'Prótons, elétrons, camadas eletrônicas e modelos atômicos históricos.' },
  { id:'periodic-table',    icon:'&#9783;', title:'Tabela Periódica',         desc:'Todos os elementos, famílias, períodos e tendências periódicas.' },
  { id:'chemical-bonds',    icon:'&#8734;', title:'Ligações Químicas',        desc:'Iônica, covalente e metálica. Geometria molecular e polaridade.' },
  { id:'reactions',         icon:'&#8651;', title:'Reações Químicas',         desc:'Balanceamento visual, conservação de massa e energia de reação.' },
  { id:'inorganic',         icon:'&#9783;', title:'Funções Inorgânicas',       desc:'Ácidos, bases, sais e óxidos. Nomenclatura, classificação e pH.' },
  { id:'mixtures',          icon:'&#9711;', title:'Separação de Misturas',     desc:'Filtração, destilação, cromatografia, cristalização e centrifugação.' },
  { id:'stoichiometry',     icon:'&#8736;', title:'Estequiometria',            desc:'Mol, massa molar, proporções e regra de três visual.' },
  { id:'solutions',         icon:'&#9680;', title:'Soluções e pH',            desc:'Dissolução, concentração, acidez e basicidade.' },
  { id:'thermochemistry',   icon:'&#9651;', title:'Termoquímica',             desc:'Entalpia, calor de reação, Hess e calorimetria.' },
  { id:'kinetics',          icon:'&#9202;', title:'Cinética e Equilíbrio',    desc:'Velocidade de reação, colisões e equilíbrio dinâmico.' },
  { id:'electrochemistry',  icon:'&#9889;', title:'Eletroquímica',            desc:'Pilhas, eletrólise, oxidação e redução.' },
  { id:'organic',           icon:'&#9675;', title:'Química Orgânica',         desc:'Cadeias carbônicas, funções orgânicas e compostos do cotidiano.' },
  { id:'gases',             icon:'&#9711;', title:'Gases',                    desc:'PV=nRT, Van der Waals, lei de Dalton e lei de Graham.' },
  { id:'analytical',        icon:'&#9680;', title:'Química Analítica',        desc:'Titulação, Beer-Lambert, Ksp e propriedades coligativas.' },
  { id:'biochemistry',      icon:'&#9675;', title:'Bioquímica',               desc:'Aminoácidos, proteínas, DNA, glicídios, lipídios e enzimas.' },
  { id:'nuclear',           icon:'&#9733;', title:'Química Nuclear',          desc:'Radioatividade, meia-vida, fissão e fusão.' },
  { id:'environmental', 'quantum', 'phases', 'spectroscopy', 'solidstate', 'coordination','supramolecular', icon:'&#127758;', title:'Química Ambiental', desc:'Efeito estufa, chuva ácida, ozônio, poluição da água e energias.' },
];

export function renderModules(outlet) {
  outlet.innerHTML = `
<div class="page">
  <h1 style="font-size:var(--text-xl);margin-bottom:0.5rem">Módulos</h1>
  <p style="color:var(--text-secondary);margin-bottom:2.5rem">
    Cada módulo segue o ciclo: fenômeno → visualização → interação → exercício → cotidiano.
  </p>

  <div class="module-grid">
    ${ALL_MODULES.map(m => `
      <div class="module-card"
           role="button"
           tabindex="0"
           data-nav="/module/${esc(m.id)}"
           aria-label="${esc(m.title)}">
        <div class="module-card-title">${esc(m.title)}</div>
        <div class="module-card-desc">${esc(m.desc)}</div>
      </div>
    `).join('')}
  </div>
</div>
`;
}
