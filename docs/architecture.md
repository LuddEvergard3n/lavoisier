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
- Transição: `opacity: 0 → 1` via CSS (150ms) para feedback visual mínimo

```
#/module/periodic-table
  → match('/module/:id', { id: 'periodic-table' })
  → _loadModule('periodic-table')
  → import('../modules/periodic-table/index.js')
  → mod.render(outlet)
```

## Ciclo de vida de módulo

Cada módulo exporta duas funções:

```js
export function render(outlet)  // chamado ao navegar para o módulo
export function destroy()       // chamado antes de navegar para outro
```

`render()` deve:
1. Resetar todo estado local
2. Escrever `outlet.innerHTML`
3. Inicializar canvas (se houver)
4. Vincular eventos
5. Chamar `markSectionDone(id, 'visited')`

`destroy()` deve:
1. Parar `SimLoop` (`.stop()`)
2. Limpar referências de canvas/drag

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
// Dimensões físicas fixas, não dependentes do layout responsivo
const W = Math.min(frame.clientWidth || 520, 520);
const H = 320;  // altura fixa

const dpr = window.devicePixelRatio || 1;
canvas.width  = Math.round(W * dpr);
canvas.height = Math.round(H * dpr);
canvas.style.width  = W + 'px';
canvas.style.height = H + 'px';

const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);  // escala uma vez; todas as coordenadas são em CSS px
```

**Regra crítica**: nunca aplicar `max-width: 100%` ou `width: 100%` ao elemento `<canvas>` via CSS.
Isso distorce `getBoundingClientRect()` relativo às coordenadas físicas do canvas.

## Engine de simulação

### SimLoop
`requestAnimationFrame` com delta-time normalizado. Cap de 100ms para evitar saltos ao voltar de aba em background.

```js
const loop = new SimLoop((dt, elapsed) => {
  // dt em segundos (float)
  particles.forEach(p => p.update(dt, W, H));
  clearCanvas(ctx, W, H);
  particles.forEach(p => drawParticle(ctx, p.x, p.y, p.r, p.color));
});
loop.start();
// Ao destruir o módulo:
loop.stop();
```

### ElectronOrbit
Elétron em órbita elíptica inclinada — simula perspectiva 3D do modelo de Bohr.

```js
const orbit = new ElectronOrbit(cx, cy, rx, ry, speed, initialAngle, tilt);
orbit.update(dt);
const { x, y } = orbit.position();
```

### Particle
Partícula 2D com velocidade e rebote elástico nas paredes.

```js
const p = new Particle(x, y, vx, vy, r, color, label);
p.update(dt, W, H);
p.collidesWith(other);  // retorna boolean
```

### DragManager
Unifica eventos de mouse e touch sobre um canvas.

```js
const dm = new DragManager(canvas);
dm.onDragStart = (x, y) => findAtom(x, y);  // retorna item ou null
dm.onDragMove  = (x, y, item) => { item.x = x; item.y = y; };
dm.onDragEnd   = (x, y, item) => snapToGrid(item);
```

## Segurança XSS

Toda inserção via `innerHTML` usa `esc()` de `js/ui.js`:

```js
panel.innerHTML = `<h3>${esc(element.name)}</h3>`;
```

Dados em atributos HTML também passam por `esc()`:
```js
`<button data-answer="${esc(option)}">${esc(option)}</button>`
```

## Importações dinâmicas

```js
// main.js — carrega módulo apenas quando o usuário navega
const mod = await import('../modules/periodic-table/index.js');
mod.render(outlet);
```

O browser faz cache do módulo após o primeiro carregamento. Navegar para o mesmo módulo
duas vezes não baixa o arquivo novamente.

## CSS: variáveis e tokens

Todos os valores de cor, espaçamento, tipografia e sombra estão em `:root` (`css/base.css`).
Os módulos Canvas não têm acesso a variáveis CSS — usam o objeto `COLOR` de `engine/renderer.js`,
que espelha os tokens definidos no CSS.
