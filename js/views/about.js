/**
 * js/views/about.js — View: Sobre o projeto
 * Lavoisier — Laboratório Visual de Química
 */

export function renderAbout(outlet) {
  outlet.innerHTML = `
<div class="about-page">

  <h1>Lavoisier — Laboratório Visual de Química</h1>

  <p>
    O Lavoisier é um laboratório educacional interativo para o ensino de Química.
    Seu objetivo central é transformar conceitos químicos abstratos em experiências
    visuais, manipuláveis e conectadas ao cotidiano.
  </p>

  <p>
    O projeto nasce de uma constatação: o ensino tradicional de Química começa
    pela fórmula — e aí perde o aluno. O Lavoisier inverte essa ordem.
    Cada módulo começa pelo <strong>fenômeno</strong>: o que você observa,
    o que acontece, o que você pode manipular. A formalização vem depois.
  </p>

  <h2>Filosofia pedagógica</h2>

  <p>
    Todo módulo segue o ciclo: fenômeno → visualização → interação → explicação →
    exercício guiado → aplicação no cotidiano. O aluno não decora — experimenta.
    As dicas não entregam a resposta; elas reduzem o espaço de busca e
    direcionam o raciocínio.
  </p>

  <h2>Stack técnica</h2>

  <p>
    HTML5, CSS3 e JavaScript ES2022 modular — sem frameworks, sem bundlers obrigatórios,
    sem dependências externas. Canvas 2D para simulações, SVG para a tabela periódica.
    Funciona diretamente no GitHub Pages. PWA-ready (sem Service Worker nesta versão).
  </p>

  <h2>Parte do ecossistema educacional</h2>

  <div class="ecosystem-links">
    <div class="ecosystem-item">
      <a href="https://luddevergard3n.github.io/Herodoto/" target="_blank" rel="noopener" class="ecosystem-link"><strong>Heródoto</strong> — História</a>
      <a href="https://github.com/LuddEvergard3n/Herodoto" target="_blank" rel="noopener" class="ecosystem-repo">repo</a>
    </div>
    <div class="ecosystem-item">
      <a href="https://luddevergard3n.github.io/euclides/" target="_blank" rel="noopener" class="ecosystem-link"><strong>Euclides</strong> — Matemática</a>
      <a href="https://github.com/LuddEvergard3n/euclides" target="_blank" rel="noopener" class="ecosystem-repo">repo</a>
    </div>
    <div class="ecosystem-item">
      <a href="https://luddevergard3n.github.io/quintiliano/" target="_blank" rel="noopener" class="ecosystem-link"><strong>Quintiliano</strong> — Língua Portuguesa</a>
      <a href="https://github.com/LuddEvergard3n/quintiliano" target="_blank" rel="noopener" class="ecosystem-repo">repo</a>
    </div>
    <div class="ecosystem-item">
      <a href="https://luddevergard3n.github.io/johnson-english/" target="_blank" rel="noopener" class="ecosystem-link"><strong>Johnson</strong> — Inglês</a>
      <a href="https://github.com/LuddEvergard3n/johnson-english" target="_blank" rel="noopener" class="ecosystem-repo">repo</a>
    </div>
    <div class="ecosystem-item">
      <a href="https://luddevergard3n.github.io/humboldt/" target="_blank" rel="noopener" class="ecosystem-link"><strong>Humboldt</strong> — Geografia</a>
      <a href="https://github.com/LuddEvergard3n/humboldt" target="_blank" rel="noopener" class="ecosystem-repo">repo</a>
    </div
    </a>
  </div>

  <h2>Licença</h2>
  <p>MIT License. Código aberto e livre para uso educacional.</p>

</div>
`;
}
