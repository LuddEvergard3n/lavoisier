/**
 * js/views/lab/equation-balancer.js
 * Laboratório — Balanceador de Equações Químicas
 *
 * Algoritmo: monta a matriz de conservação de átomos e resolve o
 * espaço nulo via eliminação gaussiana com aritmética racional
 * (frações inteiras exatas). Garante coeficientes inteiros mínimos.
 *
 * Exporta: renderEquationBalancer(container), destroyEquationBalancer()
 */

import { esc } from '../../ui.js';

// -------------------------------------------------------------------------
// Aritmética racional  (para evitar erros de ponto flutuante)
// -------------------------------------------------------------------------
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = b; b = a % b; a = t; }
  return a || 1;
}
function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }

function frac(n, d = 1) {
  const g = gcd(Math.abs(n), Math.abs(d));
  const sign = d < 0 ? -1 : 1;
  return { n: sign * n / g, d: sign * d / g };
}
function fadd(a, b) { return frac(a.n * b.d + b.n * a.d, a.d * b.d); }
function fsub(a, b) { return frac(a.n * b.d - b.n * a.d, a.d * b.d); }
function fmul(a, b) { return frac(a.n * b.n, a.d * b.d); }
function fdiv(a, b) { return frac(a.n * b.d, a.d * b.n); }
function fzero(a)   { return a.n === 0; }

// -------------------------------------------------------------------------
// Parser de fórmula química
// Suporta: H2O, Ca3(PO4)2, [Fe(CN)6]3-, CH3COOH, etc.
// Retorna { 'H':2, 'O':1, ... }
// -------------------------------------------------------------------------
export function parseFormula(formula) {
  const counts = {};
  let i = 0;

  function parseGroup() {
    const local = {};
    while (i < formula.length) {
      const ch = formula[i];
      if (ch === ')' || ch === ']') { i++; break; }
      if (ch === '(' || ch === '[') {
        i++;
        const inner = parseGroup();
        i; // parseGroup já avançou i
        const num = readNum();
        for (const [el, c] of Object.entries(inner)) {
          local[el] = (local[el] || 0) + c * num;
        }
      } else if (ch >= 'A' && ch <= 'Z') {
        const el = readElement();
        const num = readNum();
        local[el] = (local[el] || 0) + num;
      } else {
        i++; // ignora caracter inesperado (ex: carga: 3-, 2+)
      }
    }
    return local;
  }

  function readElement() {
    let el = formula[i++];
    while (i < formula.length && formula[i] >= 'a' && formula[i] <= 'z') {
      el += formula[i++];
    }
    return el;
  }

  function readNum() {
    let s = '';
    while (i < formula.length && formula[i] >= '0' && formula[i] <= '9') {
      s += formula[i++];
    }
    return s === '' ? 1 : parseInt(s, 10);
  }

  const result = parseGroup();
  return result;
}

// -------------------------------------------------------------------------
// Separar equação em reagentes e produtos
// Aceita: "H2 + O2 -> H2O",  "H2 + O2 = H2O",  "H2+O2->H2O"
// Retorna { reagents: ['H2','O2'], products: ['H2O'] }
// -------------------------------------------------------------------------
function parseEquation(eq) {
  const sep = eq.includes('->') ? '->' : eq.includes('=>') ? '=>' : '=';
  const [left, right] = eq.split(sep).map(s => s.trim());
  if (!left || !right) return null;
  const reagents = left.split('+').map(s => s.trim()).filter(Boolean);
  const products = right.split('+').map(s => s.trim()).filter(Boolean);
  if (!reagents.length || !products.length) return null;
  return { reagents, products };
}

// -------------------------------------------------------------------------
// Montar matriz de conservação de átomos
// Colunas: compostos (reagentes com sinal +, produtos com sinal -)
// Linhas: cada elemento
// -------------------------------------------------------------------------
function buildMatrix(reagents, products) {
  const allElements = new Set();
  const allFormulas = [...reagents, ...products];
  const parsed = allFormulas.map(f => parseFormula(f));

  parsed.forEach(p => Object.keys(p).forEach(el => allElements.add(el)));
  const elements = [...allElements].sort();
  const n = allFormulas.length; // colunas = variáveis (coeficientes)
  const m = elements.length;    // linhas  = equações de conservação

  // Matriz m x n como frações
  const mat = Array.from({ length: m }, () =>
    Array.from({ length: n }, () => frac(0))
  );

  elements.forEach((el, row) => {
    reagents.forEach((_, col) => {
      mat[row][col] = frac(parsed[col][el] || 0);
    });
    products.forEach((_, j) => {
      const col = reagents.length + j;
      mat[row][col] = frac(-(parsed[col][el] || 0));
    });
  });

  return { mat, elements, n, m };
}

// -------------------------------------------------------------------------
// Eliminação gaussiana sobre as frações → forma escalonada reduzida
// -------------------------------------------------------------------------
function gaussianElimination(mat, m, n) {
  const M = mat.map(row => [...row]); // cópia profunda
  let pivotRow = 0;

  for (let col = 0; col < n && pivotRow < m; col++) {
    // Encontrar pivô não-zero nessa coluna
    let pr = -1;
    for (let r = pivotRow; r < m; r++) {
      if (!fzero(M[r][col])) { pr = r; break; }
    }
    if (pr < 0) continue;

    // Trocar linhas
    [M[pivotRow], M[pr]] = [M[pr], M[pivotRow]];

    // Normalizar linha do pivô
    const pivot = M[pivotRow][col];
    for (let c = 0; c < n; c++) {
      M[pivotRow][c] = fdiv(M[pivotRow][c], pivot);
    }

    // Eliminar nas outras linhas
    for (let r = 0; r < m; r++) {
      if (r === pivotRow || fzero(M[r][col])) continue;
      const factor = M[r][col];
      for (let c = 0; c < n; c++) {
        M[r][c] = fsub(M[r][c], fmul(factor, M[pivotRow][c]));
      }
    }
    pivotRow++;
  }
  return M;
}

// -------------------------------------------------------------------------
// Extrair vetor do espaço nulo (solução para x: Ax = 0)
// Variáveis livres recebem valor 1; as pivot são calculadas de volta.
// -------------------------------------------------------------------------
function nullSpaceVector(rref, m, n) {
  // Encontrar colunas pivot
  const pivotCols = [];
  let pr = 0;
  for (let c = 0; c < n && pr < m; c++) {
    if (!fzero(rref[pr][c])) { pivotCols.push(c); pr++; }
  }
  const freeCols = [];
  for (let c = 0; c < n; c++) {
    if (!pivotCols.includes(c)) freeCols.push(c);
  }
  if (!freeCols.length) return null; // sistema sem grau de liberdade

  // Atribuir 1 à primeira variável livre
  const x = Array(n).fill(frac(0));
  x[freeCols[0]] = frac(1);

  // Back-substitute para variáveis pivot
  for (let i = pivotCols.length - 1; i >= 0; i--) {
    const pc = pivotCols[i];
    let val = frac(0);
    for (let c = 0; c < n; c++) {
      if (c === pc) continue;
      val = fadd(val, fmul(rref[i][c], x[c]));
    }
    x[pc] = frac(-val.n, val.d);
  }
  return x;
}

// -------------------------------------------------------------------------
// Converter vetor de frações para inteiros positivos mínimos
// -------------------------------------------------------------------------
function toMinimalIntegers(vec) {
  // 1. Encontrar denominador LCM para tornar todos inteiros
  let denom = 1;
  vec.forEach(f => { denom = lcm(denom, f.d); });
  const ints = vec.map(f => (f.n * denom) / f.d);

  // 2. Se houver negativos, inverter todo o vetor
  if (ints.some(v => v < 0)) {
    const allNeg = ints.every(v => v <= 0);
    if (allNeg) { for (let i = 0; i < ints.length; i++) ints[i] = -ints[i]; }
    else return null; // solução mista não é válida
  }

  // 3. Dividir pelo GCD para mínimos
  let g = ints[0];
  for (let i = 1; i < ints.length; i++) g = gcd(g, ints[i]);
  return ints.map(v => v / g);
}

// -------------------------------------------------------------------------
// Ponto de entrada: balancear equação
// Retorna { ok, coeffs, reagents, products, balanced, error }
// -------------------------------------------------------------------------
export function balanceEquation(input) {
  const parsed = parseEquation(input);
  if (!parsed) return { ok: false, error: 'Formato inválido. Use: H2 + O2 -> H2O' };

  const { reagents, products } = parsed;
  const { mat, elements, n, m } = buildMatrix(reagents, products);

  if (n < 2) return { ok: false, error: 'Equação precisa de pelo menos 2 compostos.' };

  const rref  = gaussianElimination(mat, m, n);
  const xFrac = nullSpaceVector(rref, m, n);
  if (!xFrac) return { ok: false, error: 'Sem solução com espaço nulo — verifique a equação.' };

  const coeffs = toMinimalIntegers(xFrac);
  if (!coeffs || coeffs.some(c => c <= 0 || !isFinite(c))) {
    return { ok: false, error: 'Equação não balanceável com coeficientes inteiros positivos.' };
  }

  // Formatar resultado
  const fmt = (names, start) =>
    names.map((name, i) => {
      const c = coeffs[start + i];
      return c === 1 ? name : `${c}${name}`;
    }).join(' + ');

  const balanced =
    fmt(reagents, 0) + ' \u2192 ' + fmt(products, reagents.length);

  return { ok: true, coeffs, reagents, products, balanced, elements };
}

// -------------------------------------------------------------------------
// Exemplos pré-carregados
// -------------------------------------------------------------------------
const EXAMPLES = [
  { label: 'Formação da água',      eq: 'H2 + O2 -> H2O' },
  { label: 'Combustão do metano',   eq: 'CH4 + O2 -> CO2 + H2O' },
  { label: 'Síntese de amônia',     eq: 'N2 + H2 -> NH3' },
  { label: 'Ferrugem do ferro',     eq: 'Fe + O2 -> Fe2O3' },
  { label: 'Neutralização',         eq: 'HCl + NaOH -> NaCl + H2O' },
  { label: 'Dissolução permanganato', eq: 'KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2' },
  { label: 'Redox Cr₂O₇²⁻ + Fe²⁺', eq: 'K2Cr2O7 + FeSO4 + H2SO4 -> K2SO4 + Cr2(SO4)3 + Fe2(SO4)3 + H2O' },
  { label: 'Combustão da glicose',  eq: 'C6H12O6 + O2 -> CO2 + H2O' },
];

// -------------------------------------------------------------------------
// Render / Destroy
// -------------------------------------------------------------------------
let _abortController = null;

export function renderEquationBalancer(container) {
  _abortController = new AbortController();
  const sig = _abortController.signal;

  container.innerHTML = `
<div class="lab-tool" id="eq-balancer">
  <p class="lab-tool-desc">
    Digite uma equação química não-balanceada. Use <code>-></code> ou <code>=</code>
    para separar reagentes de produtos, e <code>+</code> entre compostos.
  </p>

  <div class="lab-input-row">
    <input type="text" id="eq-input" class="lab-text-input"
           placeholder="Ex: H2 + O2 -> H2O"
           autocomplete="off" autocorrect="off" spellcheck="false"
           style="flex:1;font-family:monospace;font-size:1rem">
    <button class="btn btn-primary" id="eq-balance-btn">Balancear</button>
    <button class="btn btn-ghost"   id="eq-clear-btn">Limpar</button>
  </div>

  <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin:0.75rem 0">
    ${EXAMPLES.map((ex, i) => `
      <button class="btn btn-sm btn-secondary" data-eq-example="${i}">
        ${esc(ex.label)}
      </button>
    `).join('')}
  </div>

  <div id="eq-result" style="margin-top:1rem"></div>
</div>`;

  const input  = container.querySelector('#eq-input');
  const result = container.querySelector('#eq-result');

  function run() {
    const val = input.value.trim();
    if (!val) { result.innerHTML = ''; return; }
    const res = balanceEquation(val);
    if (!res.ok) {
      result.innerHTML = `<div class="lab-error">${esc(res.error)}</div>`;
      return;
    }

    // Tabela de verificação por elemento
    const rows = res.elements.map(el => {
      const rCount = res.reagents.reduce((s, f, i) => {
        const p = parseFormula(f);
        return s + (p[el] || 0) * res.coeffs[i];
      }, 0);
      const pCount = res.products.reduce((s, f, i) => {
        const p = parseFormula(f);
        return s + (p[el] || 0) * res.coeffs[res.reagents.length + i];
      }, 0);
      const ok = rCount === pCount;
      return `<tr>
        <td style="font-weight:600">${esc(el)}</td>
        <td style="text-align:center">${rCount}</td>
        <td style="text-align:center">${pCount}</td>
        <td style="text-align:center;color:${ok ? 'var(--accent-organic)' : 'var(--accent-reaction)'}">
          ${ok ? '\u2714' : '\u2718'}
        </td>
      </tr>`;
    }).join('');

    result.innerHTML = `
<div class="lab-result-card">
  <div class="lab-balanced-eq">${esc(res.balanced)}</div>

  <details style="margin-top:0.75rem">
    <summary style="cursor:pointer;color:var(--text-secondary);font-size:0.875rem">
      Verificar conservacao de atomos
    </summary>
    <table class="lab-table" style="margin-top:0.5rem;width:auto">
      <thead><tr>
        <th>Elemento</th><th>Reagentes</th><th>Produtos</th><th>OK?</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </details>
</div>`;
  }

  container.querySelector('#eq-balance-btn').addEventListener('click', run, { signal: sig });
  container.querySelector('#eq-clear-btn').addEventListener('click', () => {
    input.value = ''; result.innerHTML = '';
  }, { signal: sig });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') run(); }, { signal: sig });

  container.querySelectorAll('[data-eq-example]').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = EXAMPLES[+btn.dataset.eqExample].eq;
      run();
    }, { signal: sig });
  });
}

export function destroyEquationBalancer() {
  if (_abortController) { _abortController.abort(); _abortController = null; }
}
