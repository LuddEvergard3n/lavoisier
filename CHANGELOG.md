# Changelog — Lavoisier

Todas as alterações notáveis seguem o formato [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.9.1] — 2026-03-12 — Correções de bug no Laboratório e Plano de Aula

### Correções

#### `lab/orbital-viewer.js`
- `esc` estava sendo usado em template literal mas ausente do import de `../../ui.js`
- Causa: `ReferenceError: esc is not defined` ao abrir a aba Orbitais

#### `lab/lewis-builder.js`
- `typeof null === 'object'` em JavaScript causava entrada no `else if` de toggle
  quando `_pendingToggle` era `null` (estado após reset), acessando `null.id`
- Causa: `TypeError: can't access property "id", a is null` ao clicar em átomo após toggle
- Correção: guarda explícita `_pendingToggle !== null` adicionada à condição

#### `lab/stoich-calc.js`
- Seção "Modo 2 — Reagente limitante" (título + inputs) aparecia em tela
  mesmo antes de uma equação válida ser analisada, gerando aparência de conteúdo vazio
- Correção: seção envolvida em `#sc-mode2-section` com `display:none` por padrão;
  visível apenas após `parse()` bem-sucedido; re-escondida em caso de erro

#### `lesson-planner.js`
- Campo "Turma" transbordava o grid de 3 colunas de identificação
- Causa: `.lp-input` sem `width: 100%` nem `box-sizing: border-box`
- Inputs usavam tamanho intrínseco padrão do browser (~20ch + padding > célula 1fr)
- Correção: adicionado `width: 100%; box-sizing: border-box` ao `.lp-input`

---

## [1.9.0] — 2026-03-11 — Páginas pedagógicas e Archimedes no ecossistema

### Novas views

#### `/about` — Página Sobre reescrita
- Epígrafe da lei de Lavoisier com borda-left estilo acadêmico
- Grid de 6 métricas (`auto-fit minmax(130px, 1fr)`)
- Seção "Por que Lavoisier?" conectando o nome à lei da conservação da massa
- Ciclo pedagógico visual com 6 etapas numeradas (Fenômeno → Aplicação)
- Três cards de nível de ensino (Médio, Graduação, Pós-graduação)
- Grid do ecossistema com card ativo `pointer-events: none`

#### `/teacher` — Guia do Professor (novo)
- Layout sidebar 220px (`flex-shrink: 0`, sticky) + conteúdo `flex: 1; min-width: 0`
- Sidebar com grupos não-clicáveis (`sec-group`) + links âncora
- `scroll-margin-top` em todos os destinos de âncora
- 4 cards de atividade com header gradiente, badge, meta-tags e corpo
- `.teacher-warning` (borda 4px, accent-reaction) e `.teacher-note` (borda 3px, accent-energy)
- Tabela de ferramentas do laboratório com objetivos pedagógicos por ferramenta
- Seção de limitações posicionada por último (design deliberado)
- Smooth scroll via `scrollIntoView` nos links da sidebar

#### `/planner` — Gerador de Plano de Aula (novo)
- Dois painéis: formulário 460px fixo + preview `1fr` sticky
- Habilidades BNCC Ciências da Natureza embutidas no JS (EF9, EM1, EM2, EM3)
- Módulos do Lavoisier como checkboxes filtrados por ano
- Carga horária calculada automaticamente (nº aulas × duração)
- Preview em tempo real com documento formatado em branco
- `window.print()` com `@media print` isolando apenas o documento
- `print-color-adjust: exact` para preservar fundos coloridos na impressão
- Data pré-preenchida na inicialização; `AbortController` para cleanup

### Ecossistema
- Archimedes (Física — `luddevergard3n.github.io/archimedes/`) adicionado em:
  `about.js`, `home.js`, `README.md`

### Correções de layout
- `.teacher-page` e `.lp-page` receberam `max-width: 1200px; margin: 0 auto`
  para alinhamento consistente com o restante do app
- Botões do gerador de plano reduzidos com `btn-sm`
- `.lp-doc` com `max-height: calc(100vh - 180px)` e `overflow-y: auto`

### Navegação
- Dois novos botões no header: `Guia` (`/teacher`) e `Plano de Aula` (`/planner`)
- Sidebar móvel atualizada com as mesmas rotas
- Rotas registradas em `main.js` com `destroyLessonPlanner()` no `_activeModule`

---

## [1.5.0] — 2026-03-10 — Expansão de conteúdo e documentação

### Novas visualizações interativas

#### `solutions` — Curva de titulação canvas
- Canvas pH × V (mL de base adicionados) para os três tipos de titulação
- 200 pontos por cálculo analítico/Henderson-Hasselbalch com transição suave entre regiões
- Curva colorida por pH (frio → neutro → básico), marcador amarelo no PE com pH anotado
- Atualiza em tempo real ao mover qualquer slider (Ca, Va, Cb, pKa, tipo)

#### `periodic-table` — Mapa de calor da tabela periódica
- Grade SVG 36 elementos (Z=1–36) colorida por intensidade de propriedade
- 4 propriedades: raio atômico (pm), 1ª E. ionização (kJ/mol), EN (Pauling), AF (kJ/mol)
- Gradiente azul → verde → vermelho; barra de legenda com canvas e rótulo de faixa
- Tooltip ao hover com símbolo, Z e valor numérico; elementos sem dado em cinza

#### `kinetics` — Simulação de equilíbrio reversível A ⇌ B
- Integração numérica de Euler (300 passos): d[A]/dt = -k_d[A] + k_i[B]
- Sliders: k_direto, k_inverso, [A]₀; cálculo analítico de Kc, [A]_eq, [B]_eq, t½
- Gráfico [A](t) e [B](t) com linhas tracejadas de equilíbrio; atualiza instantaneamente

### Documentação — reescrita completa
- `README.md` — v1.5.0: 24 módulos com seções, tabela de metadados, stack, decisões de design
- `CHANGELOG.md` — histórico completo v0.1.0→v1.5.0
- `docs/architecture.md` — padrões de animação, ciclo `requestAnimationFrame`, `_initX()`
- `docs/development-guide.md` — canvas animado, integração numérica, convenções de `_init`
- `docs/pedagogy.md` — ciclo pedagógico, `loadExercise`, níveis, mapa de pré-requisitos

### Estatísticas

| Métrica | v1.4.0 | v1.5.0 |
|---------|--------|--------|
| Módulos | 24 | 24 |
| Exercícios | 123 | 123 |
| Canvas totais | 33 | 36 |
| Sliders totais | 118 | 124 |
| Testes | 591 | 591 |

---

## [1.4.0] — 2026-03-10 — Canvas animados e metadados completos

### Canvas animados — 24/24 módulos

#### `inorganic` — Canvas de escala de pH
- Gradiente colorimétrico universal (vermelho pH 0 → verde 7 → azul 14), marcador triangular animado
- Interpolação linear com `requestAnimationFrame` ao mover slider de concentração

#### `periodic-table` — Gráfico de barras das tendências periódicas
- Barras grow-in animadas para Z=1–18; 4 propriedades selecionáveis
- Animação dispara a cada troca de propriedade

#### `coordination` — Diagrama d-splitting animado
- Elétrons t₂g/eₘ entram com fade-in e pulsam com `shadowBlur` em seno (loop contínuo)

#### `spectroscopy` — Picos de espectro com entrada animada
- Transmitância do IV modulada por t=0→1; barras do MS crescem da linha de base

#### `symmetry` — Elementos de simetria pulsantes
- Eixos e planos pulsam com glow colorido em seno; átomos/ligações entram com fade-in

### `modules.json` — metadados completos (24/24)
- `level`: 7 high-school / 15 university / 2 graduate
- `topics`, `prerequisites` (grafo coerente), `estimatedTime` (total ~745 min)

### Estatísticas

| Métrica | v1.3.0 | v1.4.0 |
|---------|--------|--------|
| Canvas animados | 18/24 | **24/24** |
| modules.json completo | parcial | **sim** |
| Testes | 591 | 591 |

---

## [1.3.0] — 2026-03-10 — Interatividade completa e exercícios 5+

### 6 novos simuladores canvas

| Módulo | Simulador | Descrição |
|--------|-----------|-----------|
| `organic` | SN2 animado | Nucleófilo → TS bipirâmide → inversão de Walden |
| `organic` | Newman | Slider φ 0–360°, energia de torção, detecção de conformação |
| `symmetry` | Elementos 2D | 7 moléculas, eixos Cₙ/planos σ/centro i |
| `periodic-table` | Z_ef (Slater) | Slider Z=1–36, σ e Z_ef em tempo real |
| `chemical-bonds` | Polaridade | Δχ → nuvem eletrônica deslocada, dipolo visual |
| `coordination` | Cor do complexo | Slider Δo → λ_abs → cor observada, 7 presets |
| `reactions` | Célula redox | 18 semirreações, E°célula, ΔG°, K, espontaneidade |

### Exercícios — 24/24 módulos com ≥5 questões
- Padrão `EXERCISES[] + loadExercise(idx)` com dica progressiva e explicação
- 123 exercícios no total; contador `N/total` e navegação por "Próximo →"

### Estatísticas

| Métrica | v1.2.0 | v1.3.0 |
|---------|--------|--------|
| Módulos ≥5 ex. | 0/24 | **24/24** |
| Exercícios total | ~24 | **123** |
| Novos simuladores | 0 | **7** |
| Testes | 591 | 591 |

---

## [1.2.0] — 2026-03-10 — Química universitária 100% fechada

### Novo módulo: `symmetry`
- Elementos de simetria E, Cₙ, σ, i, Sₙ; 12 grupos pontuais; fluxograma de identificação
- Tabelas de caracteres C₂ᵥ/Td/Oh; regras de seleção IV/Raman; regra de exclusão mútua

### Expansões
- `analytical`: FAAS/GFAAS/ICP-OES/ICP-MS/XRF, calculadora LOD/LOQ
- `biochemistry`: glicólise, Krebs, cadeia respiratória, calculadora ATP, fotossíntese, C4/CAM

### Cobertura curricular

| Nível | Cobertura |
|-------|-----------|
| Ensino Médio | ~100% |
| ENEM / vestibular | ~100% |
| Graduação 1º ano | 100% |
| Graduação 2º ano+ | **100%** |

---

## [1.1.0] — 2026-03-09 — Graduação 2º ano+: ~99%

- `spectroscopy`: RMN 2D (COSY/HSQC/HMBC/NOESY), Raman (Stokes/anti-Stokes, SERS)
- `quantum`: P(r) = r²|R_nl|², canvas interativo de probabilidade radial, 6 orbitais
- `thermochemistry`: ensemble canônico, calculadora de populações de Boltzmann
- `supramolecular`: polímeros condutores (PEDOT, PANI), calculadora Eg → λ
- `solidstate`: Lei de Bragg, índices de Miller, extinções sistemáticas, calculadora de Bragg

---

## [1.0.0] — 2026-03-09 — Graduação 2º ano+: 95%

- Novo módulo `supramolecular`: macrociclos, self-assembly, máquinas moleculares (Sauvage/Stoddart/Feringa)
- `organic`: E1, SN1/SN2/E1/E2, SEAr, carbonila, Diels-Alder + W-H, retrossíntese
- `electrochemistry`: série completa, calculadora E°célula, pilha de concentração, pH-metro ISE
- `analytical`: estatística analítica (IC 95%, t-Student), cromatografia, complexometria EDTA
- `thermochemistry`: S = k_B ln W, funções de partição, equipartição

---

## [0.9.0] — 2026-03-09 — Graduação 1º ano: 100%

- `chemical-bonds`: hibridização formal, FIM completas (London/Keesom/Debye/LH)
- `stoichiometry`: fórmula empírica→molecular (%C/%H), pureza × rendimento combinados
- `solutions`: indicadores, especiação de polipróticos (canvas α(pH)), titulação formal no PE
- `gases`: fator Z (Newton-Raphson VdW), lei dos estados correspondentes
- `kinetics`: Kp/Kc, grau de dissociação α para A(g) ⇌ 2B(g)
- `analytical`: Q vs Ksp, osmometria para Mm

---

## [0.8.0] — 2026-03-09 — 5 novos módulos de graduação

| Módulo | Conteúdo |
|--------|----------|
| `quantum` | Schrödinger, números quânticos, canvas de orbitais, TOM, diagramas OM |
| `phases` | Diagramas P×T (água/CO₂), Clausius-Clapeyron, Raoult, ponto crítico |
| `spectroscopy` | IV, RMN ¹H, massas, UV-Vis, Beer-Lambert |
| `solidstate` | SC/BCC/FCC canvas 3D oblíquo, NaCl/CsCl/ZnS/fluorita, semicondutores |
| `coordination` | Campo cristalino, t₂g/eₘ, série espectroquímica, metaloproteínas |

---

## [0.7.0] — 2026-03-09 — Cobertura EM: 100%

- Novo módulo `environmental`: efeito estufa (canvas com slider CO₂), ozônio (CFCs), chuva ácida, energias
- `organic`: isomeria de metameria, tautomeria cetona-enol, propriedades físicas

---

## [0.6.0] — 2026-03-09 — 2 novos módulos EM

- `inorganic`: ácidos, bases, sais, óxidos, nomenclatura, calculadora de pH
- `mixtures`: 6 técnicas, canvas de destilação animado, calculadora de Rf

---

## [0.5.1] — 2026-03-08 — Bug crítico: código JS fora de render()

Causa raiz: código injetado após `render()` executava na importação, antes do DOM existir.  
Todos os `getElementById()` retornavam `null` silenciosamente.  
Corrigidos: `thermochemistry`, `electrochemistry`, `kinetics`, `chemical-bonds`, `atomic-structure`, `reactions`, `periodic-table`.

---

## [0.5.0] — 2026-03-08 — 4 novos módulos e expansões massivas

- Novos: `gases`, `analytical`, `biochemistry`, `nuclear`
- Expansões: espectroscopia atômica/Rydberg, coordenação na tabela periódica, TOM (6 diatômicas), Nernst, corrosão, mecanismos orgânicos, velocidades integradas

---

## [0.3.0] — 2026-03-08 — CSP e 6 novos módulos

- CSP `script-src-attr:'none'`: `onclick` → `data-nav` + listener delegado
- Novos: `stoichiometry`, `solutions`, `thermochemistry`, `kinetics`, `electrochemistry`, `organic`

---

## [0.1.0] — 2026-03-08 — Lançamento inicial

- SPA com hash router; design tokens escuro acadêmico
- Engine: SimLoop, ElectronOrbit, Particle, DragManager, renderer, feedback
- Módulos iniciais: `atomic-structure`, `periodic-table`, `chemical-bonds`, `reactions`
- 499 testes automatizados (Node.js, zero deps)
