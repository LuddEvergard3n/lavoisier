# Lavoisier — Laboratório Visual de Química

> Laboratório interativo de pensamento químico. Do ensino médio ao ensino superior.

Parte do ecossistema educacional:
[Heródoto](https://luddevergard3n.github.io/Herodoto/) ·
[Euclides](https://luddevergard3n.github.io/euclides/) ·
[Quintiliano](https://luddevergard3n.github.io/quintiliano/) ·
[Johnson](https://luddevergard3n.github.io/johnson-english/)

---

## Stack

| Camada       | Tecnologia                                      |
|--------------|-------------------------------------------------|
| Interface    | HTML5 + CSS3 (sem framework)                    |
| Scripts      | ES Modules nativos (sem bundler)                |
| Simulação    | Canvas 2D (sem WebGL)                           |
| Roteamento   | Hash-based SPA (`#/rota`)                       |
| Persistência | `localStorage` (progresso e preferências)       |
| Testes       | Node.js stdlib — zero dependências externas     |
| Deploy       | Estático — compatível com GitHub Pages          |

---

## Estrutura de arquivos

```
lavoisier/
├── index.html
├── icon.svg
├── css/
│   ├── base.css       — design tokens, reset, tipografia
│   ├── theme.css      — cores, badges, canvas-frame, toast
│   ├── layout.css     — header, módulos, exercícios, feature cards
│   └── mobile.css     — responsivo, reduced-motion, print
├── js/
│   ├── main.js        — bootstrap, router, delegated nav, dynamic imports
│   ├── router.js      — SPA hash router com :param
│   ├── state.js       — estado global + localStorage
│   ├── ui.js          — esc(), showToast(), createHiDPICanvas()
│   ├── engine/
│   │   ├── renderer.js    — Canvas 2D primitives + COLOR
│   │   ├── simulation.js  — SimLoop, ElectronOrbit, Particle
│   │   ├── interaction.js — hitCircle, hitRect, DragManager
│   │   └── feedback.js    — evaluateAnswer(), renderHintBox()
│   └── views/
│       ├── home.js, modules-list.js, sandbox.js, about.js
├── modules/             — 14 módulos (todos disponíveis)
│   ├── atomic-structure/
│   ├── periodic-table/
│   ├── chemical-bonds/
│   ├── reactions/
│   ├── stoichiometry/
│   ├── solutions/
│   ├── thermochemistry/
│   ├── kinetics/
│   ├── electrochemistry/
│   ├── organic/
│   ├── gases/
│   ├── analytical/
│   ├── biochemistry/
│   └── nuclear/
├── data/
│   ├── elements.json  — 53 elementos
│   └── modules.json   — 14 módulos (todos status:"available")
└── tests/
    └── test-runner.js — 535 testes, Node.js stdlib only
```

---

## Módulos (14)

### EM (Ensino Médio)

#### 1. Estrutura Atômica
Modelo de Bohr animado (12 elementos), controle iônico, configuração eletrônica interativa (Z=1–36, diagrama de caixas orbitais, exceções Cr/Cu), modelo quântico (4 números quânticos), **espectroscopia (Rydberg, séries de Lyman/Balmer/Paschen)**, **efeito fotoelétrico e De Broglie**.

#### 2. Tabela Periódica
Grade SVG 51 elementos, filtro por 10 categorias, painel de tendências periódicas, **química de coordenação (5 complexos interativos, série espectroquímica, spin, cor)**, **estados de oxidação dos metais de transição (Fe, Mn, Cr, Cu)**.

#### 3. Ligações Químicas
Canvas com DragManager (5 moléculas), VSEPR (5 geometrias + SVG inline), forças intermoleculares, **teoria de orbitais moleculares — TOM** (H₂, He₂, N₂, O₂, F₂, NO: configuração, ordem de ligação, paramagnetismo), hibridização (sp, sp², sp³, sp³d, sp³d²).

#### 4. Reações Químicas
Balanceador visual +/−, simulação Canvas de partículas, 4 reações, **reações redox completas** (4 exemplos com meia-reações balanceadas: MnO₄⁻/Fe²⁺, Cr₂O₇²⁻/I⁻, H₂O₂ desprop., Cu/HNO₃), regras de NOx.

#### 5. Estequiometria
Canvas de barras molares, calculadora mol/massa/moléculas, reagente limitante visual (sliders), rendimento percentual.

#### 6. Soluções e pH
Escala de pH animada, teoria Brønsted-Lowry, diluição C₁V₁=C₂V₂, Henderson-Hasselbalch (4 tampões).

### Transição EM → Superior

#### 7. Gases *(novo)*
Teoria cinético-molecular (canvas animado), leis de Boyle/Charles/Gay-Lussac/Avogadro, **PV=nRT** (calculadora da 4ª variável), **Van der Waals** (8 gases reais, sliders), **Lei de Dalton** (3 gases, pressões parciais), **Lei de Graham** (efusão, slider de massas molares).

#### 8. Química Analítica *(nova)*
**Curva de titulação** pH×volume (canvas, ponto de equivalência marcado), **Beer-Lambert** A=εlc (sliders, transmitância visual), **Ksp** (8 sais, efeito de íon comum), **propriedades coligativas** (ΔTb, ΔTf, pressão osmótica, 4 solutos com i de van't Hoff).

### Nível Superior

#### 9. Termoquímica
Canvas de diagrama de entalpia, 4 reações, Lei de Hess, calorimetria Q=mcΔT, **ΔG = ΔH − TΔS** (calculadora com espontaneidade e temperatura de inversão), **entropia** (2ª e 3ª Leis).

#### 10. Cinética e Equilíbrio
Canvas de partículas com barreira de Ea, Arrhenius, Maxwell-Boltzmann interativo, Le Chatelier, **leis de velocidade integradas** (ordens 0/1/2: [A](t), t½, % reagido — calculadora interativa).

#### 11. Eletroquímica
Canvas de célula galvânica animada, 3 células, eletrólise, Leis de Faraday (5 metais), **equação de Nernst** E=E°−(0,0592/n)logQ (sliders de E°, n, logQ; ΔG e K calculados), **corrosão e proteção catódica** (4 métodos).

#### 12. Química Orgânica
Alcanos C1–C6, 6 funções orgânicas, alcenos/alcinos, isomeria interativa (4 tipos), nomenclatura IUPAC, **estereoquímica** (R/S, enantiômeros, diastereômeros, E/Z), **mecanismos** (SN1, SN2, E2, adição eletrofílica), **polímeros** (adição, condensação, biopolímeros).

#### 13. Bioquímica *(nova)*
**20 aminoácidos** (6 grupos, estrutura, propriedades), estrutura proteica (1ª–4ª), DNA/RNA (código genético, dogma central), glicídios (glucose, sacarose, amido, celulose), lipídios (ácidos graxos, triglicerídeos, fosfolipídios), **cinética enzimática Michaelis-Menten** (4 enzimas, canvas da curva v×[S], slider de [S]).

#### 14. Química Nuclear *(nova)*
**Tipos de radiação** (α, β⁻, β⁺, γ com equações), **simulação de decaimento** (canvas com 8 isótopos selecionáveis), **calculadora de meia-vida** N(t)=N₀×(½)^(t/t½) (sliders de N₀ e n de meias-vidas), fissão e fusão (equações, E=Δmc²), dose e unidades (Bq, Gy, Sv).

---

## Como executar

```bash
# ES Modules exigem HTTP — não funciona por file://
npx serve lavoisier/
# ou
python3 -m http.server 8080 --directory lavoisier/

# Testes
node lavoisier/tests/test-runner.js
# Resultado esperado: 535 passed, 0 failed
```

---

## Como adicionar um módulo

1. Criar `modules/id/index.js` com `export function render(outlet)` e `export function destroy()`
2. Adicionar entrada em `data/modules.json` com `"status":"available"`
3. Adicionar `'id': () => import('../modules/id/index.js')` em `js/main.js`
4. Resetar todo estado local no início de `render()` — nunca usar módulo-level init
5. Chamar `_loop.stop()` em `destroy()` se houver SimLoop
6. Nunca atribuir `max-width` ou `width:100%` ao `<canvas>` via CSS

---

## Decisões de design

| Decisão | Justificativa |
|---------|---------------|
| Canvas sem `max-width:100%` | CSS distorce coordenadas de hit detection |
| Estado local resetado em `render()` | Evita stale state ao re-navegar |
| Código DOM-dependente dentro de `render()` | Executar fora de `render()` = DOM ausente = `getElementById` retorna `null` silenciosamente |
| Expansões extraídas em `_initX()` e chamadas de `render()` | Padrão adotado após bug da v0.5.0 — nunca injetar código de módulo com acesso ao DOM |
| `onclick` → `data-nav` + listener delegado | CSP `script-src-attr:'none'` |
| `style-src 'unsafe-inline'` | Cores computadas em runtime |
| Dynamic imports por módulo | Carrega apenas na visita; cacheado |
| `esc()` em todo HTML dinâmico | Prevenção de XSS |
| Zero dependências externas | Deploy estático puro |
