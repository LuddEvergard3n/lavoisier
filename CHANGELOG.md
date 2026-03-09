# Changelog — Lavoisier

Todas as alterações notáveis seguem o formato [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [0.7.1] — 2026-03-09

### Corrigido

**CSP (Content-Security-Policy):**
- Removido `<meta http-equiv="Content-Security-Policy">` do `index.html`.
  O meta CSP estava bloqueando o sandbox de avaliação do Firefox DevTools,
  gerando erros falsos-positivos de `script-src 'self'`.
  Em produção (GitHub Pages), a CSP deve ser configurada via headers HTTP no servidor.

**CSS — erros de compatibilidade (Firefox):**
- `base.css:106` — `@media (prefers-contrast: high)` → `more` (valor correto conforme spec)
- `base.css:126` — adicionado `text-size-adjust: 100%` antes do prefixo webkit
- `base.css:209–225` — seletores `::-webkit-scrollbar*` envolvidos em `@supports selector()`
  para suprimir aviso no Firefox (que não suporta webkit scrollbar API)

**Cards de altura igual (todos os módulos):**
- `.info-card`: `align-self` alterado de `start` para `stretch` + `height: 100%` + `box-sizing: border-box`
- Cards em grids agora têm altura uniforme na mesma linha
- Adicionado `flex-grow: 1` no último filho de `.module-grid .info-card`
  para alinhar o fundo do conteúdo

**Espaçamento e respiração visual:**
- `.module-section`: `margin-bottom` aumentado para `space-12`
- `.module-text`: `margin-bottom: space-5` + `line-height: 1.7`
- Adicionadas regras de separação entre `.module-text` e grids/canvas/tabelas
- Seções de exercício recebem `border-top` + `padding-top` para separação clara
- Grids de info-cards agora têm `margin-top` explícito quando precedidos de texto
- Adicionadas classes `.feedback-correct` e `.feedback-hint` com padding e bordas
  coloridas (verde orgânico / amarelo bond)

**Bioquímica (`biochemistry`):**
- Card "Estrutura Primária" — sequência de proteína completa substituída por
  versão truncada com `<code>` formatado; card não alarga mais a linha inteira

---

## [0.7.0] — 2026-03-09

### Adicionado — Cobertura EM: ~70% → ~100%

#### Novo módulo: Química Ambiental (`environmental`)
- **Efeito estufa**: mecanismo IR/UV, GWP₁₀₀ de 6 GEEs (CO₂, CH₄, N₂O, O₃, H₂O, HFCs)
- **Canvas interativo**: fótons solares (amarelo) e IR (vermelho) em simulação com slider de CO₂ (280–1200 ppm); moléculas de CO₂ reemitem IR aleatoriamente; estimativa de temperatura dinâmica
- **Chuva ácida**: 5 etapas de reação (SOx e NOx → H₂SO₄ e HNO₃), impactos, soluções
- **Camada de ozônio**: ciclo de Chapman, fotólise de CFC, destruição catalítica por Cl•, Protocolo de Montreal
- **Poluição da água**: 7 poluentes com fontes e efeitos (DBO, eutrofização, Pb²⁺, Hg²⁺, Cd²⁺, NO₃⁻, microplásticos)
- **Agrotóxicos e solo**: organoclorados (DDT), organofosforados (glifosato), resíduos sólidos/chorume
- **Energias**: tabela comparativa de 8 fontes com gCO₂eq/kWh, vantagens e desvantagens
- 3 exercícios com feedback e progressão

#### Expansão: Química Orgânica (`organic`)
- **Isomeria de metameria**: novo tab com 3 éteres C₅H₁₂O exemplificando distribuição de cadeia em torno do heteroátomo
- **Tautomeria cetona-enol**: novo tab (C₃H₆O) — equilíbrio dinâmico, formas cetônica e enólica, reatividade
- **Propriedades físicas**: nova seção com tabela comparativa PE/solubilidade por função (8 funções), regras gerais de FIM, comparativo álcool vs éter
- Total de tabs de isomeria: 6 (era 4); cobre todos os 5 tipos do EM + estereoquímica já existente

### Alterado

- `modules.json`: 17 módulos (era 16)
- `main.js`, `home.js`, `modules-list.js`: `environmental` registrado
- Testes: 553 passando (era 547)

### Cobertura curricular atualizada

| Nível | v0.5.1 | v0.6.0 | v0.7.0 |
|-------|--------|--------|--------|
| EM 1º–3º ano | ~70% | ~88% | ~100% |
| ENEM/vestibular | ~75% | ~88% | ~100% |
| Graduação 1º ano | ~60% | ~60% | ~60% |
| Graduação 2º ano+ | ~25% | ~25% | ~25% |

**Cobertura EM concluída.** Lacunas de graduação (quantum, fase, espectroscopia analítica, estado sólido) ficam para versões futuras se necessário.

---

## [0.6.0] — 2026-03-09

### Adicionado — Cobertura completa do Ensino Médio

**2 novos módulos:**

#### Funções Inorgânicas (`inorganic`)
- **Ácidos**: classificação Arrhenius, hidracídeos vs oxiácidos, força (Ka/pKa), 
  nomenclatura sistemática (hipo…oso / …oso / …ico / per…ico), 12 ácidos com dados
- **Bases**: nomenclatura, força, regra de solubilidade dos hidróxidos, 10 bases com dados
- **Sais**: normal / ácido / básico / duplo — reação de formação, solubilidade, 10 sais
- **Óxidos**: ácidos, básicos, anfóteros e neutros — reação característica e NOx, 12 óxidos
- **Calculadora de pH** para ácidos e bases fortes (slider de concentração, exibe H⁺, OH⁻, pH, pOH, meio)
- 3 exercícios com feedback e progressão

#### Separação de Misturas (`mixtures`)
- 6 técnicas interativas: filtração, decantação, destilação, cristalização, cromatografia, centrifugação
- Canvas animado de destilação: partículas bicategorizadas por ponto de ebulição,
  slider de temperatura controla taxa de evaporação em tempo real
- **Calculadora de Rf** cromatográfico com interpretação qualitativa
- 3 exercícios com feedback e progressão (inclui cálculo numérico de Rf)

### Alterado

- `modules.json`: 16 módulos (era 14); novos módulos inseridos na posição lógica do EM (após Reações)
- `main.js`: rota dinâmica registrada para `inorganic` e `mixtures`
- `home.js` e `modules-list.js`: ambos os módulos incluídos na listagem completa
- Testes: 547 passando (era 535)

### Cobertura EM estimada atualizada

| Nível | Antes | Depois |
|-------|-------|--------|
| EM 1º–3º ano | ~70% | ~88% |
| ENEM/vestibular | ~75% | ~88% |

**Lacunas EM que permanecem** (fora do escopo desta versão):
- Isomeria óptica e geométrica detalhada (coberta parcialmente em organic)
- Polímeros naturais e sintéticos com propriedades
- Química ambiental (camada de ozônio, poluição, agrotóxicos)
- Resolução de problemas quantitativos multi-etapa (regra de três em série)

---

## [0.5.1] — 2026-03-08

### Corrigido — bug crítico: código JS fora de render()

**Causa raiz:** o script de expansão da v0.5.0 injetava blocos de código após o fechamento de
`export function render()`, tornando-os código de módulo executado uma única vez na importação —
antes do DOM existir. Todos os `getElementById()` retornavam `null` silenciosamente.

**Módulos afetados e correções:**

| Módulo | Código fora de render() | Solução |
|---|---|---|
| `thermochemistry` | `updateCalorimetry()`, `updateGibbs()` | Movido para dentro de `render()` |
| `electrochemistry` | `updateFaraday()`, `updateNernst()` | Movido para dentro de `render()` |
| `kinetics` | canvas Maxwell-Boltzmann + `updateIRL()` | Extraído em `_initCanvasAndIRL()`, chamado de `render()` |
| `chemical-bonds` | dados MO + `renderMO()` | Extraído em `_initMO()`, chamado de `render()` |
| `atomic-structure` | `updateEC()` + `updateSpec()` | Extraídos em `_initEC()` + `_initSpec()`, chamados de `render()` |
| `reactions` | dados redox + `renderRedox()` | Extraído em `_initRedox()`, chamado de `render()` |
| `periodic-table` | dados complexos + `renderComplex()` | Extraído em `_initComplexes()`, chamado de `render()` |

**Calculadoras que não funcionavam e agora funcionam:**
- Calorimetria (Q = m·c·ΔT)
- Gibbs (ΔG = ΔH − TΔS, espontaneidade, T de inversão)
- Nernst (E = E° − (0,0592/n)·logQ, ΔG = −nFE, K)
- Faraday (m = M·I·t / n·F)
- Leis de velocidade integradas (ordens 0/1/2, t½, % reagido)
- Teoria de Orbitais Moleculares (6 diatômicas)
- Configuração eletrônica com diagrama de caixas
- Espectroscopia/Rydberg (λ, eV, série espectral)
- Redox interativo (4 exemplos com meia-reações)
- Complexos de coordenação (5 complexos interativos)

### Corrigido — CSS

- `info-card`: adicionado `align-self: start` para evitar esticamento vertical no grid;
  padding reduzido de `space-5/space-6` para `space-4/space-5`
- `atomic-structure`: canvas do modelo de Bohr com largura mínima garantida de 400 px

### Verificado

- 535 testes passando (zero falhas)
- Sintaxe ES Module válida em todos os 14 módulos (`node --input-type=module`)

---

## [0.5.0] — 2026-03-08

### Adicionado — 4 novos módulos

**Gases** (`modules/gases/index.js`)
- Teoria cinético-molecular: canvas com 45 partículas, cor por velocidade, slider de T
- PV=nRT: calculadora da 4ª variável (P, V, n ou T) com sliders de entrada
- Van der Waals: 8 gases reais (a, b), P ideal vs P real, desvio percentual
- Lei de Dalton: 3 gases (N₂, O₂, Ar) com frações molares e pressões parciais
- Lei de Graham: v₁/v₂=√(M₂/M₁), sliders de massas molares

**Química Analítica** (`modules/analytical/index.js`)
- Titulação ácido-base: curva pH×volume (canvas, HCl 0,1M + NaOH 0,1M), slider de volume
- Beer-Lambert: A=εlc com sliders de ε, l, c; transmitância visual
- Ksp: 8 sais (AgCl, BaSO₄, CaCO₃, PbS, etc.), efeito de íon comum
- Propriedades coligativas: ΔTb, ΔTf, pressão osmótica; 4 solutos com i de van't Hoff

**Bioquímica** (`modules/biochemistry/index.js`)
- 20 aminoácidos em 6 grupos (apolar, aromático, polar, ácido, básico, especial)
- Estrutura proteica: 1ª, 2ª, 3ª e 4ª estruturas explicadas
- DNA/RNA: bases, dupla-hélice, dogma central, exemplo de código genético
- Glicídios: glucose, sacarose, amido, celulose (estrutura e função)
- Lipídios: ácidos graxos saturados/insaturados, triglicerídeos, fosfolipídios
- Michaelis-Menten: 4 enzimas (lactase, catalase, urease, hexoquinase), canvas v×[S]

**Química Nuclear** (`modules/nuclear/index.js`)
- 4 tipos de radiação: α, β⁻, β⁺, γ com equações e blindagem
- Simulação de decaimento: canvas com 8 isótopos, curva N(t)
- Calculadora de meia-vida: N₀ e n de meias-vidas; barra de progresso; % restante
- Fissão (²³⁵U) e fusão (²H+³H): equações e energia de ligação
- Dose: Bq, Gy, Sv com valores de referência

### Expandido — módulos existentes

**Estrutura Atômica** — Espectroscopia (Rydberg, séries Lyman/Balmer/Paschen, λ e E em eV); Efeito fotoelétrico (φ de 6 metais, De Broglie, Heisenberg)

**Tabela Periódica** — Química de coordenação (5 complexos interativos: fórmula, NC, spin, cor, uso); Estados de oxidação dos metais de transição (Fe, Mn, Cr, Cu)

**Ligações Químicas** — TOM (6 diatômicas: configuração OM, ordem de ligação, paramagnetismo); Hibridização (sp, sp², sp³, sp³d, sp³d²)

**Reações Químicas** — Reações redox com meia-reações balanceadas (4 exemplos); Regras de NOx; balanceamento em meio ácido/básico

**Termoquímica** — ΔG=ΔH−TΔS (calculadora de espontaneidade e temperatura de inversão); Entropia (2ª e 3ª Leis)

**Cinética** — Leis de velocidade integradas (ordens 0, 1, 2): [A](t), t½ calculados; % reagido; calculadora interativa com sliders

**Eletroquímica** — Equação de Nernst E=E°−(0,0592/n)logQ; ΔG=−nFE; K de equilíbrio; Corrosão e 4 métodos de proteção catódica

**Química Orgânica** — Estereoquímica (R/S, enantiômeros, diastereômeros, E/Z, talidomida); Mecanismos (SN1, SN2, E2, adição eletrofílica + Markovnikov); Polímeros (adição, condensação, biopolímeros, classificação)

**Tabela Periódica** — Complexos de coordenação interativos (5 complexos: [Fe(CN)₆]³⁻, [Cu(NH₃)₄]²⁺, [Cr(H₂O)₆]³⁺, [Pt(en)₂]²⁺, [Co(en)₃]³⁺); série espectroquímica; spin

### Estatísticas

| Versão | Módulos | Testes | Linhas (módulos) |
|--------|---------|--------|------------------|
| 0.1.0  | 4       | 499    | ~1.800           |
| 0.4.0  | 10      | 511    | ~5.188           |
| 0.5.0  | 14      | 535    | ~7.034           |

### Documentação
- `README.md`: reescrito — lista completa dos 14 módulos com todas as seções
- `CHANGELOG.md`: versão 0.5.0 adicionada


---

## [0.4.0] — 2026-03-08

### Adicionado — Expansão de módulos

**Estrutura Atômica**
- Seção do modelo quântico: 4 números quânticos (n, l, mₗ, mₛ) com explicações
- Configuração eletrônica interativa: slider Z = 1–36 com diagrama de caixas orbitais,
  notação compacta com gás nobre, exceções de Cr (24) e Cu (29) incluídas

**Ligações Químicas**
- 5 geometrias VSEPR com SVG inline: linear (180°), angular (104,5°), trigonal plana (120°),
  piramidal (107°), tetraédrica (109,5°); ângulo, exemplos e polaridade por geometria
- Seção de forças intermoleculares: ligação de H, dipolo-dipolo, London

**Estequiometria**
- Calculadora de reagente limitante: sliders de mol para cada reagente, barras visuais
  com limitante destacado, excesso em mol calculado
- Rendimento percentual: slider de rendimento, produto real vs. teórico

**Soluções e pH**
- Calculadora de diluição C₁V₁ = C₂V₂: sliders C₁, V₁, V₂; fator de diluição visual
- Sistema tampão Henderson-Hasselbalch: 4 pares ácido-base, slider de razão [A⁻]/[HA],
  pH ao vivo e faixa eficaz (pKa ± 1)

**Termoquímica**
- Lei de Hess: exemplo passo a passo com C → CO → CO₂
- Calorimetria Q = m·c·ΔT: sliders de massa e ΔT, Q e ΔH calculados com tipo da reação

**Cinética Química**
- Canvas de distribuição de Maxwell-Boltzmann: curva T baixa vs. T alta, linha Ea,
  área sombreada de moléculas reativas; slider de temperatura comparativa interativo
- Leis de velocidade: ordens 0, 1, 2 com exemplos; Arrhenius explicado

**Eletroquímica**
- Comparação galvânica vs. eletrólise
- Calculadora das Leis de Faraday: 5 metais selecionáveis, sliders de corrente e tempo;
  carga Q, massa depositada e mol de elétrons calculados em tempo real

**Química Orgânica**
- Alcenos e alcinos: eteno, propeno, etino, benzeno com usos e fórmulas
- Isomeria interativa: 4 tipos (cadeia, posição, função, geométrica) com estruturas e propriedades
- Nomenclatura IUPAC: prefixos de cadeia, sufixos de saturação e de função, exemplo completo

### Documentação
- `README.md`: reescrito integralmente — lista completa dos 10 módulos com seções expandidas,
  decisões de design atualizadas, CSP documentada, instruções de execução
- `CHANGELOG.md`: este arquivo

---

## [0.3.0] — 2026-03-08

### Corrigido — CSP (Content Security Policy)

- **`script-src-attr 'none'`**: todos os 14 `onclick="..."` em HTML dinâmico substituídos
  por atributos `data-nav="/rota"` com listener delegado em `js/main.js`
  - Arquivos afetados: `js/main.js`, `js/router.js`, `js/views/home.js`,
    `js/views/modules-list.js`, `js/views/sandbox.js`, `modules/atomic-structure/index.js`,
    `modules/periodic-table/index.js`, `modules/chemical-bonds/index.js`,
    `modules/reactions/index.js`
- **`style-src 'unsafe-inline'`**: necessário para cores computadas em runtime;
  todos os scripts inline foram removidos; apenas estilos inline permanecem

### Corrigido — Visual

- **Logo SVG**: órbitas e elétrons envolvidos em `<g transform="rotate(-30, 16, 16)">`;
  elétrons formam triângulo equilátero visível (topo-esquerdo, topo-direito, baixo-centro)
  em vez de dois elétrons agrupados no lado esquerdo
- **Feature cards**: grade `repeat(4, 1fr)` com `align-items: stretch` — todos os 4 cards
  com altura uniforme; substituídos caracteres Unicode por SVG inline `.info-card-icon`

### Adicionado — 6 novos módulos

- `modules/stoichiometry/index.js` — Estequiometria
- `modules/solutions/index.js` — Soluções e pH
- `modules/thermochemistry/index.js` — Termoquímica
- `modules/kinetics/index.js` — Cinética Química
- `modules/electrochemistry/index.js` — Eletroquímica
- `modules/organic/index.js` — Química Orgânica

`data/modules.json`: todos os 10 módulos com `"status": "available"`

---

## [0.2.0] — 2026-03-08

### Corrigido

- **Canvas hit detection**: removido `canvas { max-width: 100% }` do reset CSS.
  O browser distorcia as coordenadas de mouse vs. coordenadas físicas do canvas.
- **Estado stale entre navegações**: cada `render()` agora reseta explicitamente
  todo o estado local do módulo.
- **CSS faltando**: adicionadas `.badge-neutral` e `.periodic-table-wrapper`.

### Módulos reescritos

**Tabela Periódica**: grade SVG 51 elementos, 7 períodos, 18 grupos; filtro por 10 categorias;
painel de detalhes; tendências periódicas; exercício com 3 dicas.

**Ligações Químicas**: 5 moléculas; DragManager; dipolos e cargas iônicas; SimLoop com destroy.

**Reações Químicas**: balanceador visual +/−; contagem atômica em tempo real; partículas
proporcionais aos coeficientes; 4 reações.

---

## [0.1.0] — 2026-03-08

### Adicionado

- SPA completa com hash router
- Design tokens CSS (tema escuro acadêmico)
- Engine: SimLoop, ElectronOrbit, Particle, DragManager, renderer, feedback
- Módulo Estrutura Atômica (modelo de Bohr, 12 elementos)
- Módulo Tabela Periódica (versão inicial)
- Módulo Ligações Químicas (versão inicial)
- Módulo Reações Químicas (versão inicial)
- 499 testes automatizados (Node.js, zero deps)
- Laboratório livre (sandbox)
- Dados: 53 elementos, módulos JSON
