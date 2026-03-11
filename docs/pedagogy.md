# Filosofia pedagógica — Lavoisier

## Princípio central

Lavoisier parte da premissa que química não é memorização de fórmulas — é aprender a **ver padrões** em fenômenos observáveis. O objetivo não é cobrir o currículo, mas construir intuição.

O nome do projeto reflete isso: o princípio de Lavoisier — a conservação da massa — não é uma fórmula a memorizar, mas uma constatação derivável de experimentos concretos. Da mesma forma, cada módulo parte do observável para construir o abstrato.

---

## Ciclo de aprendizagem

Cada módulo implementa o mesmo ciclo de 5 fases:

```
Fenômeno → Visualização → Interação → Exercício → Cotidiano
```

### 1. Fenômeno
O ponto de partida é sempre um fenômeno concreto, não uma definição abstrata.
O aluno encontra o *porquê* antes do *o quê*.

Exemplos:
- Estrutura Atômica: "Por que o néon brilha laranja nos letreiros?"
- Tabela Periódica: "Por que o ferro enferruja mas o ouro não?"
- Ligações Químicas: "Por que óleo não se mistura com água?"
- Reações Químicas: "Por que uma fogueira libera calor e luz?"
- Simetria: "Por que moléculas com centro de inversão não têm bandas ativas em IV e Raman ao mesmo tempo?"

### 2. Visualização
A simulação torna o invisível visível. O aluno vê elétrons em órbita, átomos sendo arrastados,
partículas colidindo, equilíbrios sendo atingidos, picos de espectro emergindo.

A visualização não precisa ser fisicamente exata — precisa ser fiel o suficiente para
construir intuição. O modelo de Bohr é 2D e clássico, mas é suficiente para explicar
por que cada elemento emite uma cor diferente.

### 3. Interação
O aluno manipula diretamente: arrasta átomos, ajusta sliders, seleciona elementos.
A interação ativa a memória procedural — mais duradoura que a declarativa.

Exemplos de interações:
- Slider de Z_ef: mover Z de 1 a 36 e ver σ e Z_ef mudar em tempo real
- Curva de titulação: alterar Ca, Cb ou pKa e ver a curva pH×V se redesenhar
- Simulação de equilíbrio: mudar k_d/k_i e observar como [A]_eq/[B]_eq e t½ mudam
- Mapa de calor: trocar de propriedade e ver a tabela periódica se recolorir

### 4. Exercício guiado
O exercício não é um teste de memorização — é uma pergunta que força o aluno a aplicar
o raciocínio que acabou de desenvolver na visualização.

**Princípio:** o aluno que prestou atenção na simulação consegue responder sem dicas.

O sistema de exercícios (`loadExercise`) apresenta:
1. Pergunta de múltipla escolha com 4 opções
2. Dica progressiva ao errar (uma dica por tentativa errada)
3. Explicação completa ao acertar
4. Botão "Próximo →" para avançar (aparece apenas após acerto)
5. Contador `N/total` para mostrar progresso no módulo

Cada módulo tem ≥5 exercícios cobrindo os conceitos principais da seção.

### 5. Cotidiano
Cada módulo termina com aplicações reais e concretas. O objetivo é criar conexões entre
a química abstrata e o mundo do aluno.

Exemplos:
- Termoquímica: por que fogões a gás são mais eficientes que elétricos?
- Cinética: por que medicamentos têm prazo de validade?
- Simetria: por que o IR e o Raman de CO₂ têm bandas diferentes?
- Supramolecular: por que as vacinas de mRNA usam nanopartículas lipídicas?

---

## Sistema de dicas

As dicas nunca entregam a resposta. Seguem uma progressão de 3 níveis:

| Nível | Tipo | Estratégia |
|-------|------|-----------| 
| 1 | Observacional | "Olhe para a simulação e observe X" |
| 2 | Conceitual | "Pense no mecanismo por trás de Y" |
| 3 | Factual | Fornece dados específicos sem a conclusão |

O aluno que chega à dica 3 e ainda erra recebe o feedback correto com explicação.

No sistema atual (`loadExercise`), a dica única é apresentada a partir do primeiro erro.
Módulos com o sistema legado (`_loadExercise`) têm array `hints[]` com até 3 dicas progressivas.

---

## Critérios de design de exercício

Um bom exercício no Lavoisier:

1. **Tem uma resposta derivável** — não depende de memorização prévia ao módulo
2. **Conecta-se à simulação** — o aluno que interagiu com os sliders consegue responder
3. **Tem distratores plausíveis** — as opções erradas são erros conceituais comuns, não absurdos
4. **Tem feedback informativo** — a mensagem de acerto explica *por que* está correto
5. **Cobre o conceito central** — não detalhes periféricos da seção

Exemplos de distratores plausíveis:
- Para "O que acontece com Z_ef ao aumentar Z no mesmo período?" → opções erradas incluem "diminui" (confusão com raio atômico) e "permanece constante" (confusão com Z nuclear)
- Para "Kc de A ⇌ B com k_d=0,5 e k_i=0,25" → opções erradas incluem 0,5 (confusão k_d com Kc) e 0,25 (confusão k_i com Kc)

---

## Níveis de dificuldade

Os módulos são classificados em três níveis:

| Nível | Descrição | Módulos |
|-------|-----------|---------|
| `high-school` | Ensino Médio (1º–3º ano) e ENEM | 7 módulos |
| `university` | Graduação em Química, Engenharia, Biologia | 15 módulos |
| `graduate` | Pós-graduação ou disciplinas optativas avançadas | 2 módulos |

O grafo de pré-requisitos no `modules.json` define a ordem recomendada de estudo.
Um aluno de graduação pode começar diretamente em `quantum` se já tiver base de EM,
pulando os 7 módulos de ensino médio.

---

## Mapa de pré-requisitos

```
atomic-structure ────────────────────────┐
     │                                   │
     ▼                                   ▼
periodic-table                        nuclear
     │
     ▼
chemical-bonds ──────────────────────────┐
     │                                   │
     ▼                                   ▼
reactions                            quantum ──────────┐
     │                                   │             │
     ├──────────────┐                    ▼             ▼
     ▼              ▼               solidstate     spectroscopy
  inorganic     stoichiometry            │             │
     │              │                   └─────────────┘
     ▼              ▼                         │
 solutions      thermochemistry               ▼
     │              │                    coordination
     ▼              ▼                         │
  phases         kinetics                     ▼
                    │                  supramolecular
                    ▼
              electrochemistry
```

Módulos sem seta descendente (`mixtures`, `environmental`) não têm pré-requisitos formais
e podem ser estudados em qualquer ordem.

---

## O que Lavoisier não é

- **Não é um simulador rigoroso**: o modelo de Bohr é clássico, as geometrias moleculares são 2D projetadas, a mecânica quântica é aproximada. Isso é intencional — a simplificação serve à intuição.
- **Não é um banco de questões**: o objetivo é entendimento, não treinamento para prova. Os exercícios testam compreensão, não memorização.
- **Não é adaptativo**: não há sistema de espaçamento repetido ou currículo personalizado. A progressão é por pré-requisitos, não por desempenho.
- **Não é um substituto para prática numérica**: Lavoisier cobre conceitos e estimativas. Problemas de cálculo extenso (ex: síntese de Haber multi-etapa) pertencem a listas de exercícios convencionais.

---

## Princípio de Lavoisier

> *"Nada se cria, nada se perde, tudo se transforma."*

O conhecimento químico não surge do nada. Ele se transforma de experiências concretas
em modelos abstratos, de fenômenos observados em leis gerais, de leis gerais em previsões
sobre o mundo ainda não observado.

Cada módulo é projetado para que o aluno percorra esse caminho — do fenômeno à lei —
em ~25–45 minutos.
