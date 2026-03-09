# Guia de desenvolvimento — Lavoisier

## Adicionar um novo módulo

### 1. Criar o arquivo

```
modules/<id>/index.js
```

Estrutura mínima:

```js
import { esc }             from '../../js/ui.js';
import { markSectionDone } from '../../js/state.js';

// Estado local — sempre resetado em render()
let _exDone = false;

export function render(outlet) {
  _exDone = false;

  outlet.innerHTML = `
    <div class="module-page">
      <button class="module-back btn-ghost"
              onclick="window.location.hash='#/modules'">&#8592; Módulos</button>
      <header class="module-header">
        <h1 class="module-title">Nome do Módulo</h1>
        <p class="module-concept">Descrição introdutória...</p>
      </header>
      <!-- seções do ciclo pedagógico -->
    </div>`;

  _bindEvents();
  markSectionDone('<id>', 'visited');
}

export function destroy() {
  // parar SimLoop se existir
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
  "concept": "Dois parágrafos introdutórios.",
  "status": "available",
  "route": "/module/<id>",
  "sections": ["visualization", "interaction", "exercise", "reallife"],
  "exercises": [
    {
      "id": "<id>-ex-01",
      "question": "Pergunta do exercício?",
      "options": ["A", "B", "C", "D"],
      "answer": "B",
      "hints": ["Dica 1 — observacional", "Dica 2 — conceitual", "Dica 3 — factual"]
    }
  ],
  "realLife": ["Aplicação 1", "Aplicação 2"]
}
```

---

## Convenções de código

### Estado local
- Declare variáveis de estado no topo do arquivo, fora das funções
- **Sempre** resete todo o estado no início de `render()`
- Não use closures que capturam o estado sem intenção

```js
// Correto
let _loop = null;
let _exDone = false;

export function render(outlet) {
  if (_loop) { _loop.stop(); _loop = null; }
  _exDone = false;
  // ...
}
```

### Canvas
- Calcule `_W` a partir de `frame.clientWidth` capped em um valor máximo
- Nunca use `canvas.style.width = '100%'`
- Escale o contexto uma vez com `ctx.scale(dpr, dpr)` imediatamente após criar
- Todas as coordenadas de desenho e hit detection são em CSS px (não px físicos)

```js
const W = Math.min(frame.clientWidth || 500, 500);
const H = 300;
const dpr = window.devicePixelRatio || 1;
canvas.width  = Math.round(W * dpr);
canvas.height = Math.round(H * dpr);
canvas.style.width  = W + 'px';
canvas.style.height = H + 'px';
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);
```

### Eventos
- Use delegação quando possível: um listener no container, não um por elemento
- Sempre use `e.target.closest('[data-attr]')` para delegação robusta
- Guard contra elementos nulos: `el?.addEventListener(...)`

```js
// Correto: delegação
document.getElementById('container')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  // ...
});
```

### XSS
- **Todo** dado dinâmico inserido via `innerHTML` deve passar por `esc()`
- Dados em atributos HTML também: `data-answer="${esc(option)}"`
- Textos em Canvas (`ctx.fillText`) não precisam de escape

### SimLoop
- Pare o loop em `destroy()` sem exceção
- Verifique se o canvas ainda existe antes de desenhar (pode ter sido desmontado)

---

## Classes CSS disponíveis

### Layout de módulo
- `.module-page` — container principal com max-width e padding
- `.module-header` — cabeçalho com borda inferior
- `.module-section` — seção com margin-bottom
- `.module-section-title` — título de seção uppercase com linha decorativa
- `.module-back` — botão de voltar

### Simulação
- `.sim-panel` — grid para controles + canvas
- `.sim-controls` — flex row para controles
- `.sim-slider` — range input estilizado
- `.canvas-frame` — container com borda e border-radius para canvas

### Exercício
- `.exercise-card` — card do exercício
- `.exercise-question` — texto da pergunta
- `.exercise-options` — container das opções
- `.exercise-option` — botão de opção (`.selected`, `.correct`, `.wrong`)
- `.exercise-feedback` — texto de feedback (`.bg-correct`, `.bg-error`)
- `.exercise-actions` — row de botões de ação
- `.hint-box` — box de dica (`.visible` para mostrar)

### Cards
- `.info-card` — card informativo genérico
- `.real-life-card` — card de cotidiano com borda esquerda verde

### Badges e estados
- `.badge` — badge inline
- `.badge-electron`, `.badge-bond`, `.badge-organic`, `.badge-reaction`, `.badge-energy`, `.badge-neutral`
- `.bg-correct`, `.bg-error`, `.bg-hint` — fundos de estado

### Tabela periódica
- `.periodic-table-wrapper` — scroll horizontal com scrollbar estilizada
- `.element-cell` — célula de elemento
- `.element-detail` — painel de detalhes
- `.element-props` / `.element-prop` — grid de propriedades

### Reações
- `.reaction-equation` — container da equação
- `.reaction-coeff` — botão/span de coeficiente
- `.reaction-arrow` — seta da equação
- `.mass-balance` — grid reagentes / símbolo / produtos
- `.mass-side` — lado da balança
- `.mass-balanced` — símbolo de igualdade (`.ok` verde, `.fail` vermelho)

---

## Acessibilidade

- Botões de opção devem ter `aria-pressed` dinâmico
- Canvas deve ter `aria-label` descritivo
- Grupos de controles devem ter `role="group"` e `aria-label`
- Regiões dinâmicas devem ter `aria-live="polite"`
- Foco visível: o reset CSS mantém `:focus-visible` com outline azul

---

## Testes

O runner em `tests/test-runner.js` verifica:

1. **Estrutura de arquivos** — todos os arquivos esperados existem
2. **elements.json** — integridade, unicidade de Z e symbol
3. **modules.json** — campos obrigatórios, exercícios com resposta válida
4. **Conteúdo dos módulos JS** — `export render`, `markSectionDone`, exercício, cotidiano
5. **Router** — exports e listeners
6. **State** — exports e localStorage

Para adicionar testes ao seu módulo, edite `tests/test-runner.js` e adicione casos ao suite correspondente.
