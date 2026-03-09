# Changelog — Lavoisier

Todas as alterações notáveis seguem o formato [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.1.0] — 2026-03-09 — Conteúdo de Graduação 2º ano+ fechado

### Expansões para fechar os ~5% restantes

#### Espectroscopia (`spectroscopy`) +102 linhas
- **RMN 2D**: COSY (¹H–¹H, ³J vicinal), HSQC (¹H–¹³C, ¹J direto), HMBC (¹H–¹³C, ²J/³J longa distância), NOESY/ROESY (NOE espacial < 5 Å)
- Tabela de técnicas 2D: tipo de J, eixos, uso diagnóstico
- Protocolo de elucidação estrutural: MS→IHD→¹H/¹³C→DEPT→HSQC→COSY→HMBC→NOESY
- **Espectroscopia Raman**: Stokes vs anti-Stokes, I ∝ (dα/dQ)²·ν₀⁴, regra de exclusão mútua IV/Raman
- Tabela de bandas Raman diagnósticas (9 grupos: C≡C, C=C, anel, grafite, S–S, diamante, água)
- Raman confocal (~0,5 μm) e SERS (amplificação 10⁶–10¹⁴×)

#### Mecânica Quântica (`quantum`) +234 linhas
- **Funções de onda radiais R_nl(r)**: ψ_nlm = R_nl(r)·Y_lm(θ,φ), P(r) = r²|R_nl|²
- Tabela de R_nl para 1s, 2s, 2p, 3s, 3p, 3d, 4s, 4f com nós radiais e r_max
- **Canvas interativo de P(r)**: 6 orbitais selecionáveis, curva de probabilidade radial com linhas vermelhas nos nós radiais, label de nós
- Regra: nós radiais = n − l − 1; nós angulares = l; nós totais = n − 1

#### Termodinâmica (`thermochemistry`) +124 linhas
- **Ensemble canônico (NVT)**: p_i = g_i·exp(−ε_i/k_BT)/q, relação com potenciais termodinâmicos
- Fórmulas: U = −(∂ ln q/∂β), S = k_B(ln q + βU), F = −k_BT ln q
- **Calculadora de razão de populações**: Δε (cm⁻¹), T, g₂/g₁ → N₂/N₁, % nível superior, Δε em kJ/mol, k_BT em cm⁻¹
- **Tabela de ensembles**: microcanônico, canônico, gran-canônico, isobárico-isotérmico (NPT) — variáveis fixas, potencial termodinâmico, função de partição, uso

#### Supramolecular (`supramolecular`) +102 linhas
- **Polímeros condutores**: mecanismo de condução π-conjugada, dopagem p/n (pôlarons/bipôlarons)
- Tabela completa: PA, PPy, PT, PEDOT, PEDOT:PSS, PANI, PFO — Eg, σ dopado, dopante, aplicações
- **Calculadora Eg → λ**: conversão band gap eV → λ nm com identificação da região espectral → relação com cor de emissão em OLEDs

#### Estado Sólido (`solidstate`) +179 linhas
- **Lei de Bragg**: 2d_hkl·sin θ = nλ, interpretação física (interferência construtiva)
- **Índices de Miller {hkl}**: definição geométrica, regra dos recíprocos
- Tabela de planos para Fe (BCC), d_hkl, 2θ para Cu Kα
- **Calculadora de Bragg**: λ (4 alvos: Cu/Mo/Co/Cr Kα), parâmetro a, plano {hkl} → d, θ, 2θ
- **Extinções sistemáticas**: regras para SC, BCC, FCC e diamante — planos permitidos vs extintos

---

### Cobertura curricular final

| Nível                  | Cobertura |
|------------------------|-----------|
| Ensino Médio           | ~100%     |
| ENEM / vestibular      | ~100%     |
| Graduação 1º ano       | 100%      |
| Graduação 2º ano+      | **~99%**  |

**Lacuna residual (~1%):** distribuição de Boltzmann rigorosa com degenerescência completa em sistemas multiníveis (já coberta conceitualmente), espectroscopia de correlação 2D avançada (TOCSY, INADEQUATE), síntese total de produtos naturais como disciplina separada.

---

## [1.0.0] — 2026-03-09 — Graduação 2º ano+: completo

### Módulo novo: Química Supramolecular (`supramolecular`)
- Princípios de química supramolecular: definição, complementaridade, lock-and-key vs induced-fit
- Tabela de forças diretoras: efeito hidrofóbico, π–π, LH, cátion–π, íon–dipolo, VdW (com energia e exemplos)
- Macrociclos interativos: 18-coroa-6, 12-coroa-4, criptando [2.2.2], α/β/γ-ciclodextrina (log Ka, hóspede, aplicação)
- Self-assembly: canvas animado de anfifílicos brownianos (cabeça polar + cauda apolar)
- Micelas, lipossomos, LNP para vacinas mRNA, DNA duplex e G-quadruplex
- Polímeros avançados: Mn, Mw, PDI com calculadora; Tg, Tm, cristalinidade para 8 polímeros
- Máquinas moleculares: catenanos (Sauvage), rotaxanos (Stoddart), motor de Feringa, click chemistry (Nobel 2022)
- Exercício com feedback

### Expansões de módulos existentes

#### Orgânica (`organic`) +190 linhas
- **E1 — eliminação unimolecular**: mecanismo em 2 etapas via carbocátion, Zaitsev, rearranjo possível
- **Tabela comparativa SN1/SN2/E1/E2**: 6 critérios (etapas, substrato, Nu/base, solvente, estereoquímica)
- **SEAr — substituição eletrofílica aromática**: mecanismo Wheland, 4 reações (halogenação, nitração, Friedel-Crafts alquilação, acilação) com condições e aplicações
- **Efeito mesomérico +M/−M e indutivo −I**: ativadores orto/para vs desativadores meta
- **Química de carbonila**: adição nucleofílica 1,2 (NaBH₄, Grignard, CN⁻), condensação aldólica (enolato → β-hidroxi carbonila → enona), acilação (cloreto de acila → derivados), oxidação/redução seletiva
- **Reatividade relativa** de derivados de carbonila (cloreto → anidrido → éster → amida)
- **Reações pericíclicas**: Diels-Alder [4+2] (condições, regio, estereoquímica endo/exo), regras de Woodward-Hoffmann, tabela completa com condições térmica/fotoquímica para 7 tipos
- **Retrossíntese**: conceito Corey, desconexão Diels-Alder

#### Eletroquímica (`electrochemistry`) +198 linhas
- **Série eletroquímica completa**: 15 pares de F₂/F⁻ a Li⁺/Li com E°, destaque de oxidantes/redutores
- **Calculadora E°célula**: E°cat, E°ano, n → E°célula, ΔG°, K de equilíbrio, espontaneidade
- **Pilha de concentração**: E = (RT/nF)·ln(C₂/C₁), calculadora com sliders log C₁/C₂
- **pH-metro e eletrodo de vidro**: princípio (E ∝ −0,05916·pH), calibração com tampões, slope, drift ATC, ISE e equação de Nikolsky

#### Química Analítica (`analytical`) +266 linhas
- **Estatística analítica**: erros sistemáticos vs aleatórios, média, desvio padrão, RSD, IC 95% (t de Student), propagação de incerteza
- Calculadora de estatística para até 5 replicatas: x̄, s, RSD, IC, t_calc, detecção de erro sistemático
- **Cromatografia**: tabela com CCD/TLC, CG, HPLC, CLAE-MS, iônica, exclusão por tamanho (FM, FE, detecção, aplicações)
- Parâmetros: N (pratos teóricos), Rs (resolução), H = HETP, equação de Van Deemter
- **Complexometria EDTA**: princípio de quelação hexadentada, K_f efetivo = K_f·α_Y(pH), indicador EBT
- Tabela de log K_f para 7 íons (Ca²⁺ a Ni²⁺) com pH ótimo e indicador
- Calculadora de dureza total da água: C_EDTA, V_EDTA, V_amostra → n_EDTA, dureza em mmol/L, mg CaCO₃/L e graus alemães

#### Termodinâmica (`thermochemistry`) +142 linhas
- **Termodinâmica estatística formal**: S = k_B·ln W (Boltzmann), condições S=0 (3ª lei)
- Função de partição: q_trans, q_rot (Θ_rot), q_vib (Θ_vib) — fórmulas e interpretação física
- **Equipartição de energia**: ⟨εᵢ⟩ = ½k_BT por grau de liberdade quadrático
- Calculadora: 4 tipos de molécula (monoatômico, diatômico ±vibração, não-linear) → Cv, Cp, γ
- **Entropia de mistura ideal**: ΔS_mix = −R(x₁ ln x₁ + x₂ ln x₂), calculadora x₁ → ΔS, ΔG_mix a 298 K

---

### Cobertura curricular — Graduação 2º ano+

| Tópico                                    | Status v1.0.0 |
|-------------------------------------------|---------------|
| Orgânica: mecanismos SN1/SN2/E1/E2        | ✅ completo    |
| Orgânica: SEAr (halogenação, FC, nitração) | ✅ completo    |
| Orgânica: carbonila (adição, aldol, acil) | ✅ completo    |
| Orgânica: Diels-Alder + W-H              | ✅ completo    |
| Eletroquímica: série + pilha concentração | ✅ completo    |
| Eletroquímica: pH-metro (ISE)             | ✅ completo    |
| Analítica: estatística + IC + teste-t     | ✅ completo    |
| Analítica: cromatografia (TLC/GC/HPLC)   | ✅ completo    |
| Analítica: complexometria EDTA            | ✅ completo    |
| Termodinâmica estatística (S=kln W, q)    | ✅ completo    |
| Equipartição e Cv/Cp de moléculas         | ✅ completo    |
| Supramolecular: macrociclos + ciclodextrinas | ✅ completo  |
| Supramolecular: self-assembly + máquinas  | ✅ completo    |
| Polímeros: Mn/Mw/PDI, Tg/Tm              | ✅ completo    |

| Nível                  | v0.9.0 | v1.0.0 |
|------------------------|--------|--------|
| Ensino Médio           | ~100%  | ~100%  |
| ENEM/vestibular        | ~100%  | ~100%  |
| Graduação 1º ano       | 100%   | 100%   |
| Graduação 2º ano+      | ~65%   | ~95%   |

**Lacunas residuais (≈5%):** termodinâmica estatística avançada (distribuição de Maxwell-Boltzmann rigorosa, ensemble canônico formal), espectroscopia avançada (COSY, HMBC, Raman), funções de onda radiais formais (ψ_nlm), polímeros condutores detalhados, cristalografia de raios-X.

---

## [0.9.0] — 2026-03-09 — Graduação 1º ano: 100%

### Expansões de módulos existentes

#### Ligações Químicas (`chemical-bonds`) +150 linhas
- **Hibridização formal** — tabela sp/sp²/sp³/sp³d/sp³d² com orbitais misturados, geometrias, ângulos e exemplos
- Ligações σ (orbitais híbridos, sobreposição axial) vs π (orbitais p puros, sobreposição lateral)
- Pares livres e distorção de ângulos: NH₃ (107°), H₂O (104,5°)
- Ressonância e deslocalização: benzeno como sistema π extendido
- **Forças intermoleculares** — seção formal dedicada:
  - London (dispersão): dipolo instantâneo/induzido, cresce com massa molar e polarizabilidade
  - Dipolo-dipolo (Keesom): moléculas polares, 3–25 kJ/mol
  - Dipolo-dipolo induzido (Debye): polar + apolar polarizável
  - Ligação de hidrogênio: H–N/O/F⋯N/O/F, 10–40 kJ/mol
  - Íon-dipolo: hidratação de sais
  - Tabela com energia típica de cada tipo
  - Comparador de PE: 8 substâncias (He a etanol) com FIM e explicação da anomalia da água
  - "Like dissolves like": regra de solubilidade explicada por FIM

#### Estequiometria (`stoichiometry`) +110 linhas
- **Análise elementar e fórmula empírica → molecular**:
  - Procedimento formal: %massa → mol/100g → ratio → inteiros → FE → n = Mm/M_FE → FM
  - Calculadora interativa %C, %H, Mm → computa FE e FM em tempo real
  - Algoritmo de redução a inteiros por tentativa de denominadores 1–6
- **Pureza de reagente**:
  - Calculadora combinada: massa bruta × pureza × rendimento → produto real
  - Fator global = pureza × η mostrado explicitamente

#### Soluções e Equilíbrio (`solutions`) +200 linhas
- **Indicadores ácido-base**:
  - Tabela: azul de timol, vermelho de metila, azul de bromotimol, fenolftaleína, alizarina
  - Simulador: dado pH e pKa_In → fração [In⁻]/[HIn], % forma básica, cor observada
- **Especiação de ácidos polipróticos** (α₀, α₁, α₂):
  - Fórmulas: D = [H⁺]² + Ka₁[H⁺] + Ka₁Ka₂; αᵢ = (termos)/D
  - Canvas interativo: gráfico α(pH) com curvas H₂A/HA⁻/A²⁻
  - Presets: H₂CO₃ (equilíbrio oceânico), H₃PO₄ (tampão fisiológico), H₂C₂O₄
  - Marcadores de pKa₁ e pKa₂ no gráfico; cursor de pH com valores α em tempo real
- **Titulação formal — pH no ponto de equivalência**:
  - 3 tipos selecionáveis: forte-forte (pH=7), fraco-forte (pH>7, hidrólise), forte-fraco (pH<7)
  - Calculadora: Ca, Va, Cb → V_equiv, n_ácido = n_base, pH_PE
  - pH calculado exatamente (quadrática de hidrólise para casos fraco-forte)
  - Indicador adequado sugerido automaticamente com explicação

#### Gases (`gases`) +130 linhas
- **Fator de compressibilidade Z** = PV/nRT
- Equação do virial: segundo coeficiente B, temperatura de Boyle (B=0)
- Calculadora de Z via Newton-Raphson (VdW cúbica) para N₂, CO₂, H₂, NH₃, He
- Exibe Z, V_VdW, V_ideal, regime (atração/repulsão)
- **Lei dos estados correspondentes**: T_r, P_r universais
- Tabela: T_c, P_c, Z_c, T_Boyle para 7 gases

#### Cinética (`kinetics`) +100 linhas
- **Equilíbrio Kp/Kc formal**: Kp = Kc·(RT)^Δn_g, significado de Δn_g
- Calculadora Kp↔Kc com sliders (logKc, Δn_g, T)
- **Grau de dissociação α** para A(g) ⇌ 2B(g):
  - Expressão α = √(Kp/(Kp+4P)) derivada de ICE
  - Calculadora com sliders Kp e P_total → α, % dissociado, efeito de Le Chatelier

#### Química Analítica (`analytical`) +100 linhas
- **Produto iônico Q vs Ksp**: critério de precipitação/dissolução
- Calculadora Q vs Ksp: [M⁺], [X⁻], log Ksp → Q, comparação, solubilidade molar
- Dissolução por pH: consumo de OH⁻ (Mg(OH)₂) ou H⁺ (CaCO₃)
- **Osmometria — determinação de Mm**: π = iMRT → M → Mm = m/(M·V)
- Calculadora: massa, volume, π medido, T → M, Mm, ΔTf, ΔTb

#### Termodinâmica (`thermochemistry`) +70 linhas (consolidado de v0.8.0)
- 1ª lei formal: ΔU = q + w; funções de estado vs caminho
- 2ª lei: ΔS_universo ≥ 0; definição dS = δq_rev/T
- 3ª lei: S = 0 a 0 K; S° absoluta vs ΔfH° de elementos
- Relação unificadora: ΔG = ΔH − TΔS; ligação com K (ΔG° = −RT ln K)
- Calculadora de Carnot: η = 1 − T_f/T_q com sliders T_q e T_f

---

### Cobertura curricular — Graduação 1º ano: 100%

| Tópico de Química Geral I/II             | Status v0.9.0 |
|------------------------------------------|---------------|
| Estrutura atômica e mecânica quântica    | ✅ completo    |
| Tabela periódica e periodicidade         | ✅ completo    |
| Ligações: Lewis, VSEPR, TOM, hibridiz.   | ✅ completo    |
| Forças intermoleculares                  | ✅ completo    |
| Estequiometria + análise elementar       | ✅ completo    |
| Gases ideais e reais (Z, virial)         | ✅ completo    |
| Termoquímica + 3 leis + Carnot           | ✅ completo    |
| Equilíbrio químico (Kp, Kc, α)          | ✅ completo    |
| Equilíbrio ácido-base                    | ✅ completo    |
| Titulação + indicadores + especiação     | ✅ completo    |
| Equilíbrio de precipitação (Ksp, Q)      | ✅ completo    |
| Propriedades coligativas + osmometria    | ✅ completo    |
| Eletroquímica                            | ✅ completo    |
| Cinética + mecanismos + Michaelis-Menten | ✅ completo    |
| Equilíbrio de fases + Clausius-Clapeyron | ✅ completo    |

| Nível                  | v0.8.0 | v0.9.0 |
|------------------------|--------|--------|
| Ensino Médio           | ~100%  | ~100%  |
| ENEM/vestibular        | ~100%  | ~100%  |
| Graduação 1º ano       | ~90%   | ~100%  |
| Graduação 2º ano+      | ~65%   | ~65%   |

---

## [0.8.0] — 2026-03-09

### Adicionado — Química do Ensino Superior

**5 novos módulos (graduação 1º e 2º ano):**

#### Mecânica Quântica (`quantum`)
- Equação de Schrödinger: Ĥψ = Eψ, interpretação de Born, incerteza de Heisenberg
- Números quânticos n, l, mₗ, mₛ: tabela completa com restrições e significado físico
- Canvas animado: formas dos orbitais s, pₓ, d_z², d_xy com nós angulares identificados
- Regras de preenchimento: Aufbau, Pauli, Hund — exceções Cr e Cu explicadas
- Teoria de Orbitais Moleculares (TOM/LCAO): σ, σ*, π, π*, HOMO/LUMO
- Diagramas de OM interativos para H₂, He₂, O₂, N₂, CO com elétrons posicionados
- Paramagnetismo do O₂ explicado pela TOM (regra de Hund em π*2p)
- 3 exercícios com feedback

#### Equilíbrio de Fases (`phases`)
- Conceitos: ponto triplo, ponto crítico, fluido supercrítico, regra de Gibbs F = C − P + 2
- Equação de Clausius-Clapeyron com calculadora interativa (sliders ΔHvap, T₁, T₂)
- Canvas interativo do diagrama P×T com cursor T/P, identificação de fase em tempo real
- Diagramas da água (anomalia: inclinação s/l negativa) e do CO₂ (sublimação a 1 atm)
- Lei de Raoult: pressões parciais e totais, fração molar no vapor (y_A = P_A/P_total)
- Calculadora de Raoult com sliders P*A, P*B, xA
- 3 exercícios com feedback

#### Espectroscopia (`spectroscopy`)
- Lei de Beer-Lambert: A = ε·c·l com calculadora (ε, c, l → A, T%)
- IV: canvas com espectro simulado para 6 grupos funcionais (álcool, C=O, COOH, amina, alcino, alcano)
- Tabela de bandas diagnóstico com wavenumbers e modos vibracionais
- RMN ¹H: escala de deslocamento químico δ por canvas, tabela de 8 ambientes
- Multiplicidade (regra n+1), integração, constante J e estereoquímica
- Espectrometria de massas: canvas com espectros para 3 moléculas + explicação de fragmentação
- Padrão isotópico de Br (1:1) e Cl (3:1)
- UV-Vis: tabela de transições σ→σ*, n→σ*, π→π*, n→π*, transferência de carga
- Regras de Woodward-Fieser
- 3 exercícios com feedback

#### Estado Sólido (`solidstate`)
- Tipos de sólidos: iônico, covalente, metálico, molecular
- Canvas 3D rotativo (projeção oblíqua) para SC, BCC, FCC
- Tabela comparativa: átomos/célula, CN, r/a, eficiência de empacotamento
- Estruturas iônicas com tabs: NaCl (6:6), CsCl (8:8), ZnS-blenda (4:4), fluorita (8:4)
- Teoria de bandas: gap, semicondutores intrínsecos, tipo n (P, As), tipo p (B)
- Tabela de semicondutores: Si, Ge, GaAs, ZnO, Si:P, Si:B com Eg e aplicações
- Defeitos: Schottky (par vacâncias), Frenkel (intersticial), deslocamentos
- 3 exercícios com feedback

#### Química de Coordenação (`coordination`)
- Nomenclatura IUPAC: ligantes, número de coordenação, efeito quelato
- Geometrias com tabs: CN2 (linear), CN4 (quadrado plano / tetraédrico), CN6 (octaédrico)
- Canvas do diagrama de Campo Cristalino octaédrico com elétrons posicionados
- 6 complexos exemplares (Ti³⁺, Cr³⁺, Fe²⁺ campo fraco/forte, Co³⁺ campo fraco/forte)
- Tabs interativos: configuração t₂g/eₘ, Δₒ, cor absorvida/observada, magnetismo
- Série espectroquímica: gráfico de barras interativo com 12 ligantes ordenados
- Metaloproteínas: hemoglobina (Fe²⁺), clorofila (Mg²⁺), vitamina B₁₂ (Co³⁺), cisplatina (Pt²⁺)
- 3 exercícios com feedback

**3 módulos existentes expandidos:**

#### Termodinâmica (`thermochemistry`) +70 linhas
- As três leis formais com notação matemática (ΔU = q+w, ΔS_univ ≥ 0, S=0 a 0 K)
- Relação entre as leis: ΔG = ΔH − TΔS e ligação com equilíbrio (ΔG° = −RT ln K)
- Calculadora do ciclo de Carnot: η = 1 − T_f/T_q com sliders T_q e T_f

#### Cinética (`kinetics`) +80 linhas
- Mecanismos multi-etapa: etapa determinante, intermediário, SN1 como exemplo
- Aproximação do estado estacionário
- Mecanismo de Lindemann (unimolecular)
- Calculadora de Michaelis-Menten: v = Vmax[S]/(Km+[S]) com sliders Vmax, Km, [S]

#### Soluções e Equilíbrio (`solutions`) +90 linhas
- Calculadora Ka/Kb numérico com quadrática exata vs aproximação √(Ka·C)
- Grau de ionização α e indicação de validade da aproximação
- Tabela de hidrólise de sais: NaCl, CH₃COONa, NH₄Cl, CH₃COONH₄

---

### Cobertura curricular atualizada

| Nível                  | v0.7.1 | v0.8.0 |
|------------------------|--------|--------|
| Ensino Médio (1º–3º)   | ~100%  | ~100%  |
| ENEM/vestibular        | ~100%  | ~100%  |
| Graduação 1º ano       | ~60%   | ~90%   |
| Graduação 2º ano+      | ~25%   | ~65%   |

**Lacunas de graduação restantes:** química quântica formal (funções de onda radiais,
Hamiltoniano multieletrônico), espectroscopia avançada (COSY, HMBC, CD, Raman),
termodinâmica estatística (função de partição), reações pericíclicas (Woodward-Hoffmann),
polímeros, química supramolecular.

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
