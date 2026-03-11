# Arquitetura — Lavoisier

## Visão geral

```
index.html
  └── <script type="module" src="js/main.js">
        ├── loadState()           — restaura localStorage
        ├── initSidebar()         — hamburger menu mobile
        ├── initToast()           — região de feedback
        ├── _registerRoutes()     — registra handlers no router
        └── initRouter(outlet)    — dispara rota inicial
```

## Roteamento

`js/router.js` é um roteador SPA baseado em hash (`window.location.hash`).

- Suporta rotas exatas (`/`, `/modules`) e com parâmetro (`/module/:id`)
- Cada mudança de hash chama `_dispatch()`, que casa o padrão e invoca o handler
- O handler recebe `params` como objeto (`{ id: 'atomic-structure' }`)
- Transição: `opacity: 0 → 1` via CSS (150ms)

```
#/module/periodic-table
  → match('/module/:id', { id: 'periodic-table' })
  → _loadModule('periodic-table')
  → import('../modules/periodic-table/index.js')
  → mod.render(outlet)
```

## Ciclo de vida de módulo

Cada módulo exporta exatamente duas funções:

```js
export function render(outlet)  // chamado ao navegar para o módulo
export function destroy()       // chamado antes de navegar para outro
```

`render()` deve:
1. Resetar todo estado local (variáveis de módulo, índice de exercício, loops)
2. Escrever `outlet.innerHTML`
3. Chamar funções `_initX()` para canvas, simulações e eventos
4. Chamar `markSectionDone(id, 'visited')`

`destroy()` deve:
1. Parar `SimLoop` (`.stop()`)
2. Cancelar qualquer `requestAnimationFrame` ativo
3. Limpar referências de canvas/drag se necessário

### Por que `_initX()` e não código direto em `render()`?

Módulos longos com múltiplas seções interativas ficam legíveis quando cada seção tem
sua função de inicialização separada. O padrão também permite reutilizar `_initX()` em
testes sem precisar montar todo o outlet.

```js
export function render(outlet) {
  _exIdx = 0;
  _loop  = null;

  outlet.innerHTML = `...`;

  _initSimulation();   // canvas principal
  _initCalculator();   // calculadora com sliders
  _initExercises();    // sistema de exercícios
  markSectionDone('kinetics', 'visited');
}
```

## Estado global

`js/state.js` mantém estado em memória com persistência em `localStorage`.

```
AppState {
  currentRoute: string
  progress:     { [moduleId]: { [section]: boolean } }
  attempts:     { [exerciseId]: number }
  hintUsed:     { [exerciseId]: boolean }
  theme:        'dark'
  fontSize:     number
  highContrast: boolean
}
```

Mutação **sempre** via `setState(patch)`, que persiste e dispara `CustomEvent('statechange')`.

## Canvas e HiDPI

Padrão para todos os módulos com canvas:

```js
const frame = document.getElementById('sim-frame');
const W   = Math.min(frame.clientWidth || 520, 520);
const H   = 320;
const dpr = window.devicePixelRatio || 1;

canvas.width  = Math.round(W * dpr);
canvas.height = Math.round(H * dpr);
canvas.style.width  = W + 'px';
canvas.style.height = H + 'px';

const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);  // escala uma vez; todas as coordenadas são em CSS px
```

**Regra crítica:** nunca aplicar `max-width: 100%` ou `width: 100%` ao `<canvas>` via CSS.
Isso distorce `getBoundingClientRect()` relativo às coordenadas físicas do canvas.

## Animações com requestAnimationFrame

Módulos com animação contínua usam um dos dois padrões:

### Padrão SimLoop — simulações com delta-time

```js
let _loop = null;

function _initSimulation() {
  // ...setup canvas...
  _loop = new SimLoop((dt, elapsed) => {
    update(dt);
    draw();
  });
  _loop.start();
}

export function destroy() {
  if (_loop) { _loop.stop(); _loop = null; }
}
```

`SimLoop` normaliza o delta-time e faz cap a 100ms para evitar saltos ao voltar de aba em background.

### Padrão rAF direto — animações de entrada ou loop visual

```js
let _animId = null;

function _animateEntry() {
  if (_animId) cancelAnimationFrame(_animId);
  let t = 0;
  function step() {
    t = Math.min(1, t + 0.06);
    draw(t);
    if (t < 1) _animId = requestAnimationFrame(step);
    else _animId = null;
  }
  _animId = requestAnimationFrame(step);
}

// Para loops contínuos (pulsação, etc.):
function _startLoop() {
  if (_animId) cancelAnimationFrame(_animId);
  let phase = 0;
  function step() {
    phase += 0.04;
    draw(phase);
    _animId = requestAnimationFrame(step);
  }
  _animId = requestAnimationFrame(step);
}

export function destroy() {
  if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
}
```

**Regra:** cada animação com rAF direto deve ter sua própria variável de ID. Nunca reutilizar
a mesma variável para dois loops simultâneos.

## Engine de simulação

### SimLoop
`requestAnimationFrame` com delta-time normalizado. Cap de 100ms para evitar saltos.

```js
const loop = new SimLoop((dt, elapsed) => {
  particles.forEach(p => p.update(dt, W, H));
  clearCanvas(ctx, W, H);
  particles.forEach(p => drawParticle(ctx, p.x, p.y, p.r, p.color));
});
loop.start();
loop.stop();  // em destroy()
```

### ElectronOrbit
Elétron em órbita elíptica inclinada — perspectiva 3D do modelo de Bohr.

```js
const orbit = new ElectronOrbit(cx, cy, rx, ry, speed, initialAngle, tilt);
orbit.update(dt);
const { x, y } = orbit.position();
```

### Particle
Partícula 2D com velocidade e rebote elástico.

```js
const p = new Particle(x, y, vx, vy, r, color, label);
p.update(dt, W, H);
p.collidesWith(other);  // boolean
```

### DragManager
Unifica eventos de mouse e touch sobre um canvas. Implementa `preventDefault()` em touch
para evitar scroll acidental.

```js
const dm = new DragManager(canvas);
dm.onDragStart = (x, y) => findAtom(x, y);  // retorna item ou null
dm.onDragMove  = (x, y, item) => { item.x = x; item.y = y; };
dm.onDragEnd   = (x, y, item) => snapToGrid(item);
```

`canvasPoint(event, canvas)` converte coordenadas de `MouseEvent | TouchEvent`
para CSS px independente de DPI.

## Sistema de exercícios

Todos os módulos implementam o mesmo padrão de exercícios:

```js
const EXERCISES = [
  { q: 'Pergunta?', opts: ['A','B','C','D'], ans: 1,
    exp: 'Explicação detalhada.', hint: 'Dica progressiva.' },
  // ...
];

let _exIdx = 0;
let _exAttempts = 0;
let _exDone     = false;

function loadExercise(idx) {
  const ex = EXERCISES[idx];
  // ...atualiza DOM...
  // delegação de click nas opções via data-exopt
}
```

O botão "Próximo →" aparece apenas após acerto, se houver mais exercícios. O contador
`N/total` é atualizado em cada transição.

**Exceção:** `atomic-structure` usa formato legado `{id, question, options, answer, hints[], explanation}`
com `_loadExercise(idx)` e sistema de dicas por `hints[]`.

## Segurança XSS

Toda inserção via `innerHTML` usa `esc()` de `js/ui.js`:

```js
panel.innerHTML = `<h3>${esc(element.name)}</h3>`;
// Dados em atributos HTML também:
`<button data-answer="${esc(option)}">${esc(option)}</button>`
```

Textos renderizados via `ctx.fillText()` no canvas não precisam de escape.

## Importações dinâmicas

```js
// main.js — carrega módulo apenas quando o usuário navega
const mod = await import('../modules/periodic-table/index.js');
mod.render(outlet);
```

O browser faz cache do módulo após o primeiro carregamento. Re-navegar para o
mesmo módulo não baixa o arquivo novamente.

## CSS: variáveis e tokens

Todos os valores de cor, espaçamento, tipografia e sombra estão em `:root` (`css/base.css`).
Os canvas não têm acesso a variáveis CSS — usam o objeto `COLOR` de `engine/renderer.js`,
que espelha os tokens:

```js
// renderer.js
export const COLOR = {
  bg:        '#0d1117',
  electron:  '#4fc3f7',
  bond:      '#ffd166',
  organic:   '#6bcb77',
  reaction:  '#ef476f',
  energy:    '#a8d8ea',
  textMuted: '#6e7681',
};
```

## modules.json — estrutura de metadados

```json
{
  "id": "kinetics",
  "title": "Cinética e Equilíbrio",
  "icon": "⚡",
  "description": "...",
  "status": "available",
  "route": "/module/kinetics",
  "level": "university",
  "topics": ["velocidade de reação", "lei de velocidade", "Arrhenius", "..."],
  "prerequisites": ["thermochemistry"],
  "estimatedTime": 30,
  "sections": ["visualization", "interaction", "exercise", "reallife"],
  "realLife": ["..."]
}
```

Campos `level`, `topics`, `prerequisites` e `estimatedTime` permitem filtros e
recomendação de ordem de estudo na interface.
