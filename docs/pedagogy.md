# Filosofia pedagógica — Lavoisier

## Princípio central

Lavoisier parte da premissa que química não é memorização de fórmulas — é aprender a **ver padrões** em fenômenos observáveis. O objetivo não é cobrir o currículo, mas construir intuição.

## Ciclo de aprendizagem

Cada módulo implementa o mesmo ciclo de 5 fases:

```
Fenômeno → Visualização → Interação → Exercício → Cotidiano
```

### 1. Fenômeno
O ponto de partida é sempre um fenômeno concreto, não uma definição abstrata. O usuário encontra o *porquê* antes do *o quê*.

- Estrutura Atômica: "Por que o néon brilha laranja nos letreiros?"
- Tabela Periódica: "Por que o ferro enferruja mas o ouro não?"
- Ligações Químicas: "Por que óleo não se mistura com água?"
- Reações Químicas: "Por que uma fogueira libera calor e luz?"

### 2. Visualização
A simulação torna o invisível visível. O aluno vê elétrons em órbita, átomos sendo arrastados, partículas colidindo. A visualização precisa ser fiel o suficiente para construir intuição, mas não exige precisão quântica.

### 3. Interação
O aluno manipula diretamente: arrasta átomos, ajusta coeficientes, seleciona elementos. A interação ativa a memória procedural — mais duradoura que a declarativa.

### 4. Exercício guiado
O exercício não é um teste de memorização — é uma pergunta que força o aluno a aplicar o raciocínio que acabou de desenvolver na visualização. A resposta correta deve ser derivável da observação da simulação.

**Princípio do exercício**: o aluno que prestou atenção na visualização consegue responder sem dicas.

### 5. Cotidiano
Cada módulo termina com 2–3 aplicações reais e concretas. O objetivo é criar conexões entre a química abstrata e o mundo do aluno: por que medicamentos se distribuem pelo corpo de certa forma, por que o sal iodado foi introduzido, por que o metano é usado em fogões.

---

## Sistema de dicas

As dicas nunca entregam a resposta. Seguem uma progressão de 3 níveis:

| Nível | Tipo | Estratégia |
|-------|------|-----------|
| 1 | Observacional | "Olhe para a simulação e observe X" |
| 2 | Conceitual | "Pense no mecanismo por trás de Y" |
| 3 | Factual | Fornece dados específicos sem a conclusão |

O aluno que chega à dica 3 e ainda erra recebe o feedback correto com a explicação. A dica 3 não entrega a resposta — entrega os dados que tornam a resposta inevitável por raciocínio.

Implementação em `js/engine/feedback.js`:

```js
export function getHint(exerciseId, hints, attempts) {
  markHintUsed(exerciseId);
  const level = Math.min(attempts - 1, hints.length - 1);
  return { text: hints[Math.max(0, level)], level };
}
```

---

## Critérios de design de exercício

Um bom exercício no Lavoisier:

1. **Tem uma resposta derivável** — não depende de memorização prévia
2. **Conecta-se à visualização** — o aluno precisa ter interagido com a simulação para responder
3. **Tem distratores plausíveis** — as opções erradas são erros conceituais comuns, não absurdos
4. **Tem feedback informativo** — a mensagem de erro explica por que está errado, não apenas que está
5. **Escala com tentativas** — dicas ficam mais diretas conforme o número de tentativas aumenta

---

## O que Lavoisier não é

- **Não é um simulador rigoroso**: as animações usam modelo de Bohr, não mecânica quântica. A geometria molecular é 2D projetada. Isso é intencional — a simplificação serve à intuição, não à precisão.
- **Não é um banco de questões**: o objetivo é entendimento, não prática de vestibular.
- **Não é adaptativo**: não há sistema de espaçamento repetido ou currículo personalizado. A progressão é linear e sequencial por design.

---

## Princípio de Lavoisier

> *"Nada se cria, nada se perde, tudo se transforma."*

Este princípio que nomeou o projeto — a conservação da massa — serve como metáfora pedagógica: o conhecimento não surge do nada. Ele se transforma de experiências concretas em modelos abstratos, de fenômenos observados em leis gerais.
