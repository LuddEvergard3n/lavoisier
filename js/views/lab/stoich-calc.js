/**
 * js/views/lab/stoich-calc.js
 * Laboratório — Calculadora Estequiométrica
 *
 * Dado uma equação balanceada e a quantidade conhecida de um composto,
 * calcula as quantidades estequiométricas de todos os outros compostos,
 * identifica o reagente limitante e calcula o rendimento real se fornecido.
 *
 * Exporta: renderStoichCalc(container), destroyStoichCalc()
 */

import { esc } from '../../ui.js';
import { balanceEquation, parseFormula as _pf } from './equation-balancer.js';

// Re-expor parseFormula para uso interno (evitar duplicação)
// Não é export direto; apenas uso local:
function parseFormula(f) { return _pf ? _pf(f) : {}; }

// Massa molar de elementos comuns (g/mol)
const MOLAR_MASS = {
  H:1.008,  He:4.003, Li:6.941,  Be:9.012, B:10.81,  C:12.011, N:14.007, O:15.999,
  F:18.998, Ne:20.18, Na:22.990, Mg:24.305,Al:26.982,Si:28.085,P:30.974, S:32.06,
  Cl:35.45, Ar:39.948,K:39.098, Ca:40.078,Sc:44.956,Ti:47.867,V:50.942, Cr:51.996,
  Mn:54.938,Fe:55.845,Co:58.933,Ni:58.693,Cu:63.546,Zn:65.38, Ga:69.723,Ge:72.63,
  As:74.922,Se:78.971,Br:79.904,Kr:83.798,Rb:85.468,Sr:87.62, Y:88.906, Zr:91.22,
  Ag:107.868,Cd:112.41,In:114.818,Sn:118.71,Sb:121.76,I:126.904,Ba:137.327,
  Pt:195.084,Au:196.967,Hg:200.592,Pb:207.2, Bi:208.98,
  Na:22.990, Mg:24.305,
};

function molarMassOf(formula) {
  const atoms = _pf(formula);
  let M = 0;
  for (const [el, n] of Object.entries(atoms)) {
    if (!(el in MOLAR_MASS)) return null;
    M += MOLAR_MASS[el] * n;
  }
  return M;
}

// -------------------------------------------------------------------------
// Calcular estequiometria a partir de mol de referência
// -------------------------------------------------------------------------
function calcStoich(eq, refIdx, refMoles) {
  const res = balanceEquation(eq);
  if (!res.ok) return { ok: false, error: res.error };

  const all = [...res.reagents, ...res.products];
  const n   = all.length;

  const coeff  = res.coeffs;         // coeficientes balanceados
  const moles  = new Array(n);        // moles de cada composto
  const masses = new Array(n);        // massas (g)
  const Mvals  = new Array(n);        // massas molares

  for (let i = 0; i < n; i++) Mvals[i] = molarMassOf(all[i]);

  // Moles de i = (coeff[i] / coeff[ref]) * refMoles
  for (let i = 0; i < n; i++) {
    moles[i] = (coeff[i] / coeff[refIdx]) * refMoles;
  }
  for (let i = 0; i < n; i++) {
    masses[i] = Mvals[i] !== null ? moles[i] * Mvals[i] : null;
  }

  return {
    ok: true,
    reagents: res.reagents,
    products: res.products,
    all, coeff, moles, masses, Mvals,
    nReagents: res.reagents.length,
  };
}

// -------------------------------------------------------------------------
// Calcular reagente limitante dado massas de todos os reagentes
// -------------------------------------------------------------------------
function findLimitingReagent(eq, inputMasses) {
  const res = balanceEquation(eq);
  if (!res.ok) return null;

  const nR = res.reagents.length;
  const moles = res.reagents.map((f, i) => {
    const M = molarMassOf(f);
    if (!M || !inputMasses[i]) return Infinity;
    return inputMasses[i] / M;
  });

  // Moles de produto por mol de coeficiente de cada reagente
  // Limitante = reagente com menor moles/coeff_reagente * coeff_produto[0]
  const pCoeff   = res.coeffs[nR]; // coeficiente do 1° produto
  const rCoeffs  = res.coeffs.slice(0, nR);
  const molProd  = moles.map((m, i) => (m / rCoeffs[i]) * pCoeff);
  const minProd  = Math.min(...molProd);
  const limIdx   = molProd.indexOf(minProd);

  return { limIdx, molProd, minProd, rCoeffs, moles };
}

// -------------------------------------------------------------------------
// HTML helpers
// -------------------------------------------------------------------------
function fmtNum(v) {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  if (v < 0.001) return v.toExponential(3);
  if (v < 10)    return v.toFixed(4);
  return v.toFixed(2);
}

// -------------------------------------------------------------------------
// Render / Destroy
// -------------------------------------------------------------------------
let _abortController = null;

export function renderStoichCalc(container) {
  _abortController = new AbortController();
  const sig = _abortController.signal;

  container.innerHTML = `
<div class="lab-tool" id="stoich-calc">
  <p class="lab-tool-desc">
    Digite uma equação (será balanceada automaticamente), escolha o composto de
    referência, informe a quantidade e veja os outros calculados.
  </p>

  <!-- Modo 1: a partir de 1 composto -->
  <div class="lab-section-title" style="margin-top:0">Modo 1 — A partir de um composto</div>

  <div class="lab-input-row" style="flex-wrap:wrap">
    <input type="text" id="sc-eq" class="lab-text-input"
           placeholder="Ex: N2 + H2 -> NH3"
           style="flex:2;min-width:200px;font-family:monospace"
           autocomplete="off" autocorrect="off" spellcheck="false">
    <button class="btn btn-primary" id="sc-parse-btn">Analisar</button>
  </div>

  <div id="sc-compounds" style="margin:0.75rem 0"></div>

  <div id="sc-ref-row" style="display:none;margin-bottom:0.75rem">
    <div class="lab-input-row" style="flex-wrap:wrap">
      <select id="sc-ref-sel" class="lab-text-input" style="flex:1;min-width:120px"></select>
      <input  type="number" id="sc-ref-val" class="lab-number-input"
              min="0" step="0.001" value="1" placeholder="mol">
      <select id="sc-ref-unit" class="lab-text-input" style="flex:1;min-width:80px">
        <option value="mol">mol</option>
        <option value="g">g (massa)</option>
        <option value="mmol">mmol</option>
      </select>
      <button class="btn btn-primary" id="sc-calc-btn">Calcular</button>
    </div>
  </div>

  <div id="sc-result-1" style="margin-top:0.5rem"></div>

  <!-- Modo 2: reagente limitante — visível apenas após parse bem-sucedido -->
  <div id="sc-mode2-section" style="display:none">
    <div class="lab-section-title" style="margin-top:1.5rem">Modo 2 — Reagente limitante</div>
    <div id="sc-lim-inputs" style="margin-bottom:0.75rem"></div>
    <div id="sc-lim-btn-row">
      <button class="btn btn-primary" id="sc-lim-btn">Identificar reagente limitante</button>
    </div>
    <div id="sc-result-2" style="margin-top:0.5rem"></div>
  </div>
</div>`;

  let _parsed = null; // resultado do balancEquation

  function parse() {
    const eq = container.querySelector('#sc-eq').value.trim();
    if (!eq) return;
    const res = balanceEquation(eq);
    if (!res.ok) {
      container.querySelector('#sc-compounds').innerHTML =
        `<div class="lab-error">${esc(res.error)}</div>`;
      container.querySelector('#sc-ref-row').style.display = 'none';
      container.querySelector('#sc-mode2-section').style.display = 'none';
      return;
    }
    _parsed = res;

    const all = [...res.reagents, ...res.products];
    const nR  = res.reagents.length;

    // Seletor de composto de referência
    const sel = container.querySelector('#sc-ref-sel');
    sel.innerHTML = all.map((f, i) => `
      <option value="${i}">${esc(f)} (coef. ${res.coeffs[i]})${i < nR ? ' [R]' : ' [P]'}</option>
    `).join('');
    container.querySelector('#sc-ref-row').style.display = '';

    // Resumo da equação balanceada
    container.querySelector('#sc-compounds').innerHTML = `
<div class="lab-result-card" style="padding:0.5rem 0.75rem">
  <span style="color:var(--accent-organic);font-family:monospace">${esc(res.balanced)}</span>
</div>`;

    // Modo 2: inputs para massas dos reagentes
    container.querySelector('#sc-lim-inputs').innerHTML = `
<p style="font-size:0.875rem;color:var(--text-secondary)">
  Informe a massa disponível de cada reagente:
</p>
${res.reagents.map((f, i) => {
  const M = molarMassOf(f);
  const hint = M ? ` (M = ${M.toFixed(2)} g/mol)` : '';
  return `<label class="lab-param-label" style="max-width:220px">
    ${esc(f)}${esc(hint)}
    <input type="number" class="lab-number-input sc-lim-mass"
           data-ridx="${i}" min="0" step="0.1" placeholder="g" value="">
  </label>`;
}).join('')}`;
    container.querySelector('#sc-lim-btn-row').style.display = '';
    container.querySelector('#sc-mode2-section').style.display = '';
  }

  function calc() {
    if (!_parsed) return;
    const refIdx = parseInt(container.querySelector('#sc-ref-sel').value, 10);
    const refVal = parseFloat(container.querySelector('#sc-ref-val').value) || 1;
    const unit   = container.querySelector('#sc-ref-unit').value;
    const eq     = container.querySelector('#sc-eq').value.trim();

    let refMoles = refVal;
    if (unit === 'g') {
      const all = [..._parsed.reagents, ..._parsed.products];
      const M   = molarMassOf(all[refIdx]);
      if (!M) {
        container.querySelector('#sc-result-1').innerHTML =
          '<div class="lab-error">Massa molar desconhecida para este composto.</div>';
        return;
      }
      refMoles = refVal / M;
    } else if (unit === 'mmol') {
      refMoles = refVal / 1000;
    }

    const r = calcStoich(eq, refIdx, refMoles);
    if (!r.ok) {
      container.querySelector('#sc-result-1').innerHTML =
        `<div class="lab-error">${esc(r.error)}</div>`;
      return;
    }

    const rows = r.all.map((f, i) => {
      const isRef = i === refIdx;
      const isR   = i < r.nReagents;
      return `<tr${isRef ? ' style="background:rgba(79,195,247,0.08)"' : ''}>
        <td>${esc(f)}</td>
        <td style="text-align:center;color:var(--text-secondary)">${r.coeff[i]}</td>
        <td style="text-align:center">${isR ? 'Reagente' : 'Produto'}</td>
        <td style="text-align:right;font-family:monospace">${fmtNum(r.moles[i])}</td>
        <td style="text-align:right;font-family:monospace">
          ${r.Mvals[i] ? fmtNum(r.Mvals[i]) : '—'}
        </td>
        <td style="text-align:right;font-family:monospace;color:var(--accent-organic)">
          ${r.masses[i] !== null ? fmtNum(r.masses[i]) : '—'}
        </td>
      </tr>`;
    }).join('');

    container.querySelector('#sc-result-1').innerHTML = `
<table class="lab-table">
  <thead><tr>
    <th>Composto</th><th>Coef.</th><th>Tipo</th>
    <th style="text-align:right">mol</th>
    <th style="text-align:right">M (g/mol)</th>
    <th style="text-align:right">massa (g)</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>`;
  }

  function calcLim() {
    if (!_parsed) return;
    const eq = container.querySelector('#sc-eq').value.trim();
    const masses = [...container.querySelectorAll('.sc-lim-mass')].map(inp => {
      const v = parseFloat(inp.value);
      return isNaN(v) || v <= 0 ? null : v;
    });

    if (masses.some(m => m === null)) {
      container.querySelector('#sc-result-2').innerHTML =
        '<div class="lab-error">Preencha a massa de todos os reagentes.</div>';
      return;
    }

    const lim = findLimitingReagent(eq, masses);
    if (!lim) {
      container.querySelector('#sc-result-2').innerHTML =
        '<div class="lab-error">Nao foi possível calcular.</div>';
      return;
    }

    const html = _parsed.reagents.map((f, i) => {
      const isLim = i === lim.limIdx;
      const M = molarMassOf(f) || 1;
      const mol = masses[i] / M;
      return `<tr${isLim ? ' style="background:rgba(239,71,111,0.1)"' : ''}>
        <td>${esc(f)}${isLim ? ' <strong style="color:var(--accent-reaction)">[LIMITANTE]</strong>' : ''}</td>
        <td style="text-align:right;font-family:monospace">${fmtNum(masses[i])}</td>
        <td style="text-align:right;font-family:monospace">${fmtNum(M)}</td>
        <td style="text-align:right;font-family:monospace">${fmtNum(mol)}</td>
        <td style="text-align:right;font-family:monospace">${fmtNum(lim.molProd[i])}</td>
      </tr>`;
    }).join('');

    const firstProd = _parsed.products[0];
    const Mprod = molarMassOf(firstProd);
    const massProd = Mprod ? lim.minProd * Mprod : null;

    container.querySelector('#sc-result-2').innerHTML = `
<table class="lab-table">
  <thead><tr>
    <th>Reagente</th>
    <th style="text-align:right">massa (g)</th>
    <th style="text-align:right">M (g/mol)</th>
    <th style="text-align:right">mol</th>
    <th style="text-align:right">mol ${esc(firstProd || 'produto')} possível</th>
  </tr></thead>
  <tbody>${html}</tbody>
</table>
<div class="info-card" style="margin-top:0.5rem">
  Produção máxima de <strong>${esc(firstProd || 'produto')}</strong>:
  <strong style="color:var(--accent-organic)">${fmtNum(lim.minProd)} mol</strong>
  ${massProd !== null ? `= <strong>${fmtNum(massProd)} g</strong>` : ''}
</div>`;
  }

  container.querySelector('#sc-parse-btn').addEventListener('click', parse, { signal: sig });
  container.querySelector('#sc-eq').addEventListener('keydown', e => {
    if (e.key === 'Enter') { parse(); }
  }, { signal: sig });
  container.querySelector('#sc-calc-btn').addEventListener('click', calc, { signal: sig });
  container.querySelector('#sc-lim-btn').addEventListener('click', calcLim, { signal: sig });
}

export function destroyStoichCalc() {
  if (_abortController) { _abortController.abort(); _abortController = null; }
}
