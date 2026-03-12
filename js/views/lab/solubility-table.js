/**
 * js/views/lab/solubility-table.js
 * Laboratório — Tabela de Solubilidade Interativa
 *
 * Matriz cátion × ânion com código de cor por solubilidade.
 * Clicar num cruzamento exibe o nome do composto, Ksp (quando disponível),
 * cor do precipitado e observações.
 *
 * Exporta: renderSolubilityTable(container), destroySolubilityTable()
 */

import { esc } from '../../ui.js';

// S = solúvel (>1 g/100mL), L = levemente solúvel, I = insolúvel, D = decompõe, - = não existe
// Fontes: CRC Handbook, Greenwood & Earnshaw, Solubility Rules (padrão didático)

const CATIONS = [
  { id:'H',   label:'H\u207a' },
  { id:'Li',  label:'Li\u207a' },
  { id:'Na',  label:'Na\u207a' },
  { id:'K',   label:'K\u207a' },
  { id:'NH4', label:'NH\u2084\u207a' },
  { id:'Mg',  label:'Mg\u00b2\u207a' },
  { id:'Ca',  label:'Ca\u00b2\u207a' },
  { id:'Sr',  label:'Sr\u00b2\u207a' },
  { id:'Ba',  label:'Ba\u00b2\u207a' },
  { id:'Al',  label:'Al\u00b3\u207a' },
  { id:'Fe2', label:'Fe\u00b2\u207a' },
  { id:'Fe3', label:'Fe\u00b3\u207a' },
  { id:'Cu2', label:'Cu\u00b2\u207a' },
  { id:'Zn',  label:'Zn\u00b2\u207a' },
  { id:'Ag',  label:'Ag\u207a' },
  { id:'Pb',  label:'Pb\u00b2\u207a' },
  { id:'Hg2', label:'Hg\u00b2\u207a' },
];

const ANIONS = [
  { id:'OH',   label:'OH\u207b' },
  { id:'Cl',   label:'Cl\u207b' },
  { id:'Br',   label:'Br\u207b' },
  { id:'I',    label:'I\u207b' },
  { id:'NO3',  label:'NO\u2083\u207b' },
  { id:'CH3COO', label:'CH\u2083COO\u207b' },
  { id:'SO4',  label:'SO\u2084\u00b2\u207b' },
  { id:'CO3',  label:'CO\u2083\u00b2\u207b' },
  { id:'PO4',  label:'PO\u2084\u00b3\u207b' },
  { id:'S2',   label:'S\u00b2\u207b' },
  { id:'CrO4', label:'CrO\u2084\u00b2\u207b' },
  { id:'F',    label:'F\u207b' },
];

// Tabela: [cat_id][anion_id] = { s: 'S'|'I'|'L'|'D'|'-', name, ksp, note, precipColor }
const DATA = {
  H:   { OH:'D', Cl:'S', Br:'S', I:'S', NO3:'S', CH3COO:'S', SO4:'S', CO3:'D', PO4:'D', S2:'D',  CrO4:'-', F:'S' },
  Li:  { OH:'L', Cl:'S', Br:'S', I:'S', NO3:'S', CH3COO:'S', SO4:'S', CO3:'S', PO4:'I', S2:'S',  CrO4:'S', F:'L' },
  Na:  { OH:'S', Cl:'S', Br:'S', I:'S', NO3:'S', CH3COO:'S', SO4:'S', CO3:'S', PO4:'S', S2:'S',  CrO4:'S', F:'S' },
  K:   { OH:'S', Cl:'S', Br:'S', I:'S', NO3:'S', CH3COO:'S', SO4:'S', CO3:'S', PO4:'S', S2:'S',  CrO4:'S', F:'S' },
  NH4: { OH:'S', Cl:'S', Br:'S', I:'S', NO3:'S', CH3COO:'S', SO4:'S', CO3:'S', PO4:'S', S2:'S',  CrO4:'S', F:'S' },
  Mg:  { OH:'L', Cl:'S', Br:'S', I:'S', NO3:'S', CH3COO:'S', SO4:'S', CO3:'I', PO4:'I', S2:'D',  CrO4:'S', F:'I' },
  Ca:  { OH:'L', Cl:'S', Br:'S', I:'S', NO3:'S', CH3COO:'S', SO4:'L', CO3:'I', PO4:'I', S2:'D',  CrO4:'L', F:'I' },
  Sr:  { OH:'L', Cl:'S', Br:'S', I:'S', NO3:'S', CH3COO:'S', SO4:'I', CO3:'I', PO4:'I', S2:'D',  CrO4:'I', F:'S' },
  Ba:  { OH:'S', Cl:'S', Br:'S', I:'S', NO3:'S', CH3COO:'S', SO4:'I', CO3:'I', PO4:'I', S2:'S',  CrO4:'I', F:'S' },
  Al:  { OH:'I', Cl:'S', Br:'S', I:'S', NO3:'S', CH3COO:'S', SO4:'S', CO3:'D', PO4:'I', S2:'D',  CrO4:'-', F:'I' },
  Fe2: { OH:'I', Cl:'S', Br:'S', I:'S', NO3:'S', CH3COO:'S', SO4:'S', CO3:'I', PO4:'I', S2:'I',  CrO4:'-', F:'S' },
  Fe3: { OH:'I', Cl:'S', Br:'S', I:'L', NO3:'S', CH3COO:'S', SO4:'S', CO3:'D', PO4:'I', S2:'D',  CrO4:'-', F:'S' },
  Cu2: { OH:'I', Cl:'S', Br:'I', I:'I', NO3:'S', CH3COO:'S', SO4:'S', CO3:'I', PO4:'I', S2:'I',  CrO4:'I', F:'S' },
  Zn:  { OH:'I', Cl:'S', Br:'S', I:'S', NO3:'S', CH3COO:'S', SO4:'S', CO3:'I', PO4:'I', S2:'I',  CrO4:'I', F:'S' },
  Ag:  { OH:'I', Cl:'I', Br:'I', I:'I', NO3:'S', CH3COO:'L', SO4:'L', CO3:'I', PO4:'I', S2:'I',  CrO4:'I', F:'S' },
  Pb:  { OH:'I', Cl:'L', Br:'I', I:'I', NO3:'S', CH3COO:'S', SO4:'I', CO3:'I', PO4:'I', S2:'I',  CrO4:'I', F:'I' },
  Hg2: { OH:'I', Cl:'I', Br:'I', I:'I', NO3:'S', CH3COO:'L', SO4:'I', CO3:'I', PO4:'I', S2:'I',  CrO4:'I', F:'S' },
};

// Detalhes de precipitados comuns
const DETAILS = {
  'AgCl':   { ksp:'1.8×10\u207b\u00b9\u2070', color:'branco',    note:'Precipitado branco clássico em reações de identificação de Cl\u207b. Escurece na luz (fotólise).' },
  'AgBr':   { ksp:'5.0×10\u207b\u00b9\u00b3', color:'amarelo pálido', note:'Usado em filmes fotográficos. Mais insolúvel que AgCl.' },
  'AgI':    { ksp:'8.5×10\u207b\u00b9\u2077', color:'amarelo',   note:'Extremamente insolúvel. Uso em fotografia e sementes de chuva artificial.' },
  'Ag2CrO4':{ ksp:'1.1×10\u207b\u00b9\u00b2', color:'vermelho tijolo', note:'Indicador de Mohr na titulação de Cl\u207b com AgNO\u2083.' },
  'BaSO4':  { ksp:'1.1×10\u207b\u00b9\u2070', color:'branco',    note:'Contraste em exames de raio-X do trato gastrointestinal. Muito insolúvel.' },
  'CaCO3':  { ksp:'3.3×10\u207b\u2079',        color:'branco',    note:'Calcário, mármore, conchas. Dissolve em ácido (chuva ácida corrói estátuas).' },
  'Fe(OH)3':{ ksp:'2.8×10\u207b\u00b3\u2079', color:'marrom ferrugem', note:'Precipita em pH > 3. A cor marrom é característica do Fe\u00b3\u207a hidratado.' },
  'Fe(OH)2':{ ksp:'4.9×10\u207b\u00b9\u2077', color:'verde',     note:'Precipita em pH > 6. Oxida lentamente a Fe(OH)\u2083 marrom ao ar.' },
  'Cu(OH)2':{ ksp:'2.2×10\u207b\u00b2\u2070', color:'azul',      note:'Azul característico. Usado no reagente de Benedict e Fehling.' },
  'PbSO4':  { ksp:'2.5×10\u207b\u2078',        color:'branco',    note:'Acumuladores de chumbo: PbSO\u2084 se forma durante descarga.' },
  'PbI2':   { ksp:'9.8×10\u207b\u2079',        color:'amarelo ouro', note:'Precipitado amarelo vistoso. Reação de demonstração clássica.' },
  'ZnS':    { ksp:'2.0×10\u207b\u00b2\u2075', color:'branco',    note:'Pigmento (branco de zinco). Semicondutor de gap largo.' },
  'CuS':    { ksp:'6.3×10\u207b\u00b3\u2076', color:'preto',     note:'Usado em análise qualitativa clássica (grupo IIB).' },
  'Mg(OH)2':{ ksp:'5.6×10\u207b\u00b9\u00b2', color:'branco',    note:'Leite de magnésia (antiácido). Suspensão coloidal de Mg(OH)\u2082.' },
  'Ca3(PO4)2':{ ksp:'2.1×10\u207b\u00b3\u00b3', color:'branco', note:'Mineral dos dentes e ossos (hidroxiapatita). Base dos fertilizantes fosfatados.' },
};

function getDetail(cat, an) {
  // Tentativa de construir nome do composto
  const names = {
    H:'H', Li:'Li', Na:'Na', K:'K', NH4:'NH4', Mg:'Mg', Ca:'Ca', Sr:'Sr', Ba:'Ba',
    Al:'Al', Fe2:'Fe', Fe3:'Fe', Cu2:'Cu', Zn:'Zn', Ag:'Ag', Pb:'Pb', Hg2:'Hg2',
  };
  const anNames = {
    OH:'(OH)', Cl:'Cl', Br:'Br', I:'I', NO3:'(NO3)', CH3COO:'(CH3COO)',
    SO4:'SO4', CO3:'CO3', PO4:'(PO4)', S2:'S', CrO4:'CrO4', F:'F',
  };
  const key = `${names[cat]}${anNames[an]}`.replace(/[()]/g,'');
  return DETAILS[key] || DETAILS[`${names[cat]}(${anNames[an]})`] || null;
}

function solColor(s) {
  switch (s) {
    case 'S': return { bg:'#1a3a1a', txt:'#6bcb77', label:'Solúvel' };
    case 'L': return { bg:'#2a2a10', txt:'#ffd166', label:'Levemente solúvel' };
    case 'I': return { bg:'#3a1010', txt:'#ef476f', label:'Insolúvel' };
    case 'D': return { bg:'#1a1a2a', txt:'#aaaaff', label:'Decompõe' };
    default:  return { bg:'#1a1a1a', txt:'#555555', label:'Não existe' };
  }
}

// -------------------------------------------------------------------------
// Render / Destroy
// -------------------------------------------------------------------------
let _abortController = null;

export function renderSolubilityTable(container) {
  _abortController = new AbortController();
  const sig = _abortController.signal;

  // Cabeçalho da tabela
  const headers = ANIONS.map(a => `<th class="sol-th">${a.label}</th>`).join('');

  const rows = CATIONS.map(cat => {
    const cells = ANIONS.map(an => {
      const s = (DATA[cat.id] && DATA[cat.id][an.id]) || '-';
      const { bg, txt } = solColor(s);
      return `<td class="sol-cell" data-cat="${cat.id}" data-an="${an.id}"
               style="background:${bg};color:${txt};cursor:pointer">${s}</td>`;
    }).join('');
    return `<tr><th class="sol-th sol-th-cat">${cat.label}</th>${cells}</tr>`;
  }).join('');

  container.innerHTML = `
<div class="lab-tool" id="solubility-table">
  <p class="lab-tool-desc">
    Solubilidade em água a 25°C. Clique numa célula para ver detalhes.
    <span style="color:#6bcb77">S</span> = solúvel &nbsp;
    <span style="color:#ffd166">L</span> = levemente solúvel &nbsp;
    <span style="color:#ef476f">I</span> = insolúvel (precipitado) &nbsp;
    <span style="color:#aaaaff">D</span> = decompõe
  </p>

  <div style="overflow-x:auto;margin-bottom:0.75rem">
    <table class="sol-matrix">
      <thead>
        <tr><th class="sol-th sol-th-corner"></th>${headers}</tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div id="sol-detail" class="info-card" style="min-height:60px"></div>
</div>

<style>
.sol-matrix { border-collapse:collapse; font-size:0.8125rem; }
.sol-matrix td, .sol-matrix th { border:1px solid rgba(255,255,255,0.06); }
.sol-cell { text-align:center; width:44px; height:36px; font-weight:700; transition:filter .15s; }
.sol-cell:hover { filter:brightness(1.5); }
.sol-th { padding:0.25rem 0.4rem; text-align:center; white-space:nowrap; color:var(--text-secondary); background:var(--bg-card); }
.sol-th-cat { text-align:right; min-width:52px; }
.sol-th-corner { min-width:52px; }
</style>`;

  const detail = container.querySelector('#sol-detail');
  detail.innerHTML = `<span style="color:var(--text-muted)">Clique numa célula para ver detalhes do composto.</span>`;

  container.querySelectorAll('.sol-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const catId = cell.dataset.cat;
      const anId  = cell.dataset.an;
      const s     = (DATA[catId] && DATA[catId][anId]) || '-';
      const { label, txt } = solColor(s);
      const cat = CATIONS.find(c => c.id === catId);
      const an  = ANIONS.find(a => a.id === anId);
      const det = getDetail(catId, anId);

      let html = `<strong style="color:${txt}">${cat.label} + ${an.label} &rarr; ${label}</strong>`;
      if (det) {
        html += `<br><span style="color:var(--text-secondary)">Ksp ≈ ${esc(det.ksp)}</span>`;
        if (det.color) html += ` &mdash; precipitado <strong>${esc(det.color)}</strong>`;
        html += `<br><span style="font-size:0.8125rem;color:var(--text-secondary)">${esc(det.note)}</span>`;
      }
      if (s === 'D') {
        html += `<br><span style="color:#aaaaff;font-size:0.8125rem">Este composto não existe em solução — decompõe-se ao contato com água.</span>`;
      }
      detail.innerHTML = html;
    }, { signal: sig });
  });
}

export function destroySolubilityTable() {
  if (_abortController) { _abortController.abort(); _abortController = null; }
}
