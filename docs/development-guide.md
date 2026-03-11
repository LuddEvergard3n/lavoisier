# Guia de desenvolvimento — Lavoisier

## Adicionar um novo módulo

### 1. Criar o arquivo

```
modules/<id>/index.js
```

Estrutura mínima com padrão `_initX()`:

```js
import { esc, createHiDPICanvas } from '../../js/ui.js';
import { markSectionDone }        from '../../js/state.js';
import { SimLoop }                from '../../js/engine/simulation.js';
import { clearCanvas, COLOR }     from '../../js/engine/renderer.js';

// Estado local — sempre resetado em render()
let _loop      = null;
let _animId    = null;
let _exIdx     = 0;
let _exAttempts = 0;
let _exDone    = false;

const EXERCISES = [
  { q: '...', opts: ['A','B','C','D'], ans: 0, exp: '...', hint: '...' },
  // mínimo 5 exercícios
];

export function render(outlet) {
  // 1. Resetar estado
  if (_loop)   { _loop.stop(); _loop = null; }
  if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
  _exIdx = 0; _exAttempts = 0; _exDone = false;

  // 2. Montar HTML
  outlet.innerHTML = `
    <div class="module-page">
      <button class="module-back btn-ghost"
              data-nav="/modules">&#8592; Módulos</button>
      <header class="module-header">
        <h1 class="module-title">Nome do Módulo</h1>
        <p class="module-concept">Descrição introdutória.</p>
      </header>

      <section class="module-section">
        <h2 class="module-section-title">Fenômeno</h2>
        <p class="module-text">Ponto de partida concreto...</p>
      </section>

      <section class="module-section">
        <h2 class="module-section-title">Simulação</h2>
        <div class="canvas-frame" id="sim-frame">
          <canvas id="sim-canvas" aria-label="Descrição da simulação"></canvas>
        </div>
      </section>

      <section class="module-section" id="exercise-section">
        <h2 class="module-section-title">Exercícios (<span id="ex-counter">1</span>/${EXERCISES.length})</h2>
        <p class="module-text" id="ex-question">${esc(EXERCISES[0].q)}</p>
        <div id="ex-options" style="display:flex;flex-direction:column;gap:.5rem;max-width:440px;margin-top:.75rem">
          ${EXERCISES[0].opts.map((o, i) =>
            `<button class="btn btn-ghost" style="text-align:left;justify-content:flex-start"
                     data-exopt="${i}">${esc(o)}</button>`).join('')}
        </div>
        <div id="exercise-feedback" style="margin-top:1rem"></div>
        <button class="btn btn-ghost btn-sm" id="ex-next"
                style="margin-top:1rem;display:none">Próximo exercício →</button>
      </section>

      <section class="module-section">
        <h2 class="module-section-title">No cotidiano</h2>
        <p class="module-text">Aplicações reais...</p>
      </section>
    </div>`;

  // 3. Inicializar seções interativas
  _initSimulation();
  _initExercises();
  markSectionDone('<id>', 'visited');
}

export function destroy() {
  if (_loop)   { _loop.stop(); _loop = null; }
  if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
}
```

### 2. Registrar em main.js

```js
// Em _loadModule():
'<id>': () => import('../modules/<id>/index.js'),
```

### 3. Registrar em data/modules.json

```json
{
  "id": "<id>",
  "title": "Nome do Módulo",
  "icon": "⚗",
  "description": "Uma linha explicando o módulo.",
  "status": "available",
  "route": "/module/<id>",
  "level": "university",
  "topics": ["tópico 1", "tópico 2", "tópico 3"],
  "prerequisites": ["outro-modulo"],
  "estimatedTime": 30,
  "sections": ["visualization", "interaction", "exercise", "reallife"],
  "realLife": ["Aplicação 1", "Aplicação 2"]
}
```

---

## Convenções de código

### Estado local

```js
// Correto: declare no topo do arquivo, resete em render()
let _loop    = null;
let _exIdx   = 0;
let _animId  = null;

export function render(outlet) {
  if (_loop)   { _loop.stop(); _loop = null; }
  if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
  _exIdx = 0;
  // ...
}
```

### Canvas — inicialização

```js
function _initMyCanvas() {
  const frame  = document.getElementById('my-frame');
  const canvas = document.getElementById('my-canvas');
  if (!canvas || !frame) return;

  const W   = Math.min(frame.clientWidth || 500, 500);
  const H   = 300;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Todas as coordenadas daqui em diante são em CSS px
  draw();
}
```

### Canvas — animação de entrada (fade-in / grow)

```js
let _entryAnimId = null;

function _animateEntry(drawFn) {
  if (_entryAnimId) cancelAnimationFrame(_entryAnimId);
  let t = 0;
  function step() {
    t = Math.min(1, t + 0.06);   // ~17 frames para completar
    drawFn(t);
    if (t < 1) _entryAnimId = requestAnimationFrame(step);
    else _entryAnimId = null;
  }
  _entryAnimId = requestAnimationFrame(step);
}

// Uso: ao trocar de item selecionado, animar a entrada
function renderItem(idx) {
  const item = ITEMS[idx];
  _animateEntry(t => draw(item, t));
}
```

### Canvas — loop contínuo (pulsação, glow)

```js
let _loopAnimId = null;
let _phase = 0;

function _startContinuousLoop() {
  if (_loopAnimId) cancelAnimationFrame(_loopAnimId);
  function step() {
    _phase += 0.04;
    draw(_phase);
    _loopAnimId = requestAnimationFrame(step);
  }
  _loopAnimId = requestAnimationFrame(step);
}

export function destroy() {
  if (_loopAnimId) { cancelAnimationFrame(_loopAnimId); _loopAnimId = null; }
}
```

### Integração numérica de Euler

Para simular equações diferenciais simples (ex: A ⇌ B, decaimento radioativo):

```js
function integrate(kd, ki, A0, nSteps, dt) {
  const points = [];
  let A = A0, B = 0;
  for (let i = 0; i <= nSteps; i++) {
    points.push({ t: i * dt, A, B });
    const dA = (-kd * A + ki * B) * dt;
    A = Math.max(0, A + dA);
    B = Math.max(0, B - dA);
  }
  return points;
}
// Escolha dt = T_total / nSteps com nSteps ≥ 200 para curvas suaves
```

### Eventos

```js
// Delegação de clique — robusto contra re-renderização do DOM
document.getElementById('container')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  handleAction(btn.dataset.action);
});

// Guards contra nulo
document.getElementById('slider')?.addEventListener('input', e => {
  update(parseFloat(e.target.value));
});
```

### XSS

```js
// Todo dado dinâmico via innerHTML passa por esc()
container.innerHTML = `
  <h3>${esc(item.name)}</h3>
  <button data-id="${esc(item.id)}">${esc(item.label)}</button>`;

// ctx.fillText no canvas não precisa de escape
ctx.fillText(item.name, x, y);
```

---

## Sistema de exercícios — padrão `loadExercise`

```js
const EXERCISES = [
  { q: 'Pergunta?',
    opts: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
    ans: 1,                            // índice da opção correta (0-based)
    exp: 'Explicação completa...',
    hint: 'Dica progressiva...' },
  // mínimo 5 exercícios por módulo
];

let _exIdx      = 0;
let _exAttempts = 0;
let _exDone     = false;

function loadExercise(idx) {
  const ex = EXERCISES[idx];
  if (!ex) return;
  _exAttempts = 0;
  _exDone     = false;

  const qEl = document.getElementById('ex-question');
  const cEl = document.getElementById('ex-counter');
  const fb  = document.getElementById('exercise-feedback');
  const nx  = document.getElementById('ex-next');
  const op  = document.getElementById('ex-options');

  if (qEl) qEl.textContent = ex.q;
  if (cEl) cEl.textContent = idx + 1;
  if (fb)  fb.innerHTML = '';
  if (nx)  nx.style.display = 'none';

  if (op) {
    op.innerHTML = ex.opts.map((o, i) =>
      `<button class="btn btn-ghost"
               style="text-align:left;justify-content:flex-start"
               data-exopt="${i}">${esc(o)}</button>`
    ).join('');
  }
}

function _initExercises() {
  loadExercise(0);

  document.getElementById('ex-options')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-exopt]');
    if (!btn || _exDone) return;

    const chosen = parseInt(btn.dataset.exopt, 10);
    const ex     = EXERCISES[_exIdx];
    const fb     = document.getElementById('exercise-feedback');

    if (chosen === ex.ans) {
      _exDone = true;
      if (fb) {
        fb.innerHTML = `<div style="color:var(--accent-organic);padding:.5rem;
          border-left:3px solid var(--accent-organic);background:var(--bg-raised);
          margin-top:.5rem;border-radius:4px">
          ✓ Correto! ${esc(ex.exp)}</div>`;
      }
      markSectionDone('<id>', 'exercise');
      const nx = document.getElementById('ex-next');
      if (nx && _exIdx < EXERCISES.length - 1) nx.style.display = 'block';
    } else {
      _exAttempts++;
      if (fb) {
        fb.innerHTML = `<div style="color:var(--accent-reaction);padding:.5rem;
          border-left:3px solid var(--accent-reaction);background:var(--bg-raised);
          margin-top:.5rem;border-radius:4px">
          ✗ Tente novamente. ${_exAttempts >= 1 ? esc(ex.hint) : ''}</div>`;
      }
    }
  });

  document.getElementById('ex-next')?.addEventListener('click', () => {
    _exIdx++;
    if (_exIdx < EXERCISES.length) loadExercise(_exIdx);
  });
}
```

---

## Classes CSS disponíveis

### Layout de módulo
- `.module-page` — container principal com max-width e padding
- `.module-header` — cabeçalho com borda inferior
- `.module-section` — seção com margin-bottom
- `.module-section-title` — título de seção uppercase com linha decorativa
- `.module-back` — botão de voltar
- `.module-text` — parágrafo de texto do módulo (line-height 1.7)
- `.module-grid` — grid responsivo de info-cards

### Simulação
- `.sim-panel` — grid para controles + canvas
- `.sim-controls` — flex row para controles
- `.canvas-frame` — container com borda e border-radius para canvas

### Exercício
- `.exercise-card` — card do exercício
- `.exercise-option` — botão de opção (`.selected`, `.correct`, `.wrong`)
- `.exercise-feedback` — texto de feedback (`.bg-correct`, `.bg-error`)
- `.hint-box` — box de dica (`.visible` para mostrar)

### Cards
- `.info-card` — card informativo genérico
- `.real-life-card` — card de cotidiano com borda esquerda verde

### Badges
- `.badge-electron`, `.badge-bond`, `.badge-organic`, `.badge-reaction`, `.badge-energy`, `.badge-neutral`

---

## Acessibilidade

- Botões de opção de exercício devem ter `aria-pressed` dinâmico
- Canvas deve ter `aria-label` descritivo
- Grupos de controles devem ter `role="group"` e `aria-label`
- Regiões dinâmicas devem ter `aria-live="polite"`
- Foco visível: o reset CSS mantém `:focus-visible` com outline azul

---

## Testes

O runner em `tests/test-runner.js` verifica:

1. Estrutura de arquivos — todos os arquivos esperados existem
2. `elements.json` — integridade, unicidade de Z e symbol
3. `modules.json` — campos obrigatórios (`level`, `topics`, `prerequisites`, `estimatedTime`)
4. Conteúdo dos módulos JS — `export render`, `export destroy`, `markSectionDone`, `EXERCISES`
5. Router — exports e listeners
6. State — exports e localStorage

```bash
node tests/test-runner.js
# Resultado esperado: 591 passed, 0 failed
```

Para verificar sintaxe JS sem executar:

```bash
node --check modules/kinetics/index.js
```

Para detectar o caractere `−` (U+2212, mathematical minus) que causa SyntaxError em template literals:

```bash
python3 -c "
import glob
for p in glob.glob('modules/*/index.js'):
    data = open(p,'rb').read()
    if b'\xe2\x88\x92' in data:
        print('AVISO U+2212:', p)
"
```

---

## Checklist para novo módulo

- [ ] `render()` reseta todo estado local
- [ ] `destroy()` para SimLoop e cancela rAF
- [ ] Canvas sem `max-width` nem `width:100%` via CSS
- [ ] Toda saída via `innerHTML` usa `esc()`
- [ ] Canvas com `aria-label` descritivo
- [ ] Mínimo 5 exercícios em `EXERCISES[]`
- [ ] `markSectionDone()` chamado ao final de `render()`
- [ ] Entrada em `modules.json` com todos os campos
- [ ] Import em `main.js`
- [ ] `node --check` sem erros
