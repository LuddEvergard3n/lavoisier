/**
 * js/views/about.js — View: Sobre o Lavoisier
 * Lavoisier — Laboratório Visual de Química
 *
 * Página de identidade do projeto: origem do nome, filosofia,
 * métricas, stack técnica e ecossistema educacional.
 */

import { esc } from '../ui.js';

const METRICS = [
  { val: '26',   label: 'Módulos temáticos' },
  { val: '460',  label: 'Exercícios interativos' },
  { val: '7',    label: 'Ferramentas de laboratório' },
  { val: '3',    label: 'Níveis de ensino' },
  { val: '0',    label: 'Dependências externas' },
  { val: '100%', label: 'Código aberto (MIT)' },
];

const ECOSYSTEM = [
  { name: 'Heródoto',   sub: 'História',          url: 'https://luddevergard3n.github.io/Herodoto/',       repo: 'https://github.com/LuddEvergard3n/Herodoto' },
  { name: 'Euclides',   sub: 'Matemática',         url: 'https://luddevergard3n.github.io/euclides/',        repo: 'https://github.com/LuddEvergard3n/euclides' },
  { name: 'Quintiliano',sub: 'Língua Portuguesa',  url: 'https://luddevergard3n.github.io/quintiliano/',     repo: 'https://github.com/LuddEvergard3n/quintiliano' },
  { name: 'Johnson',    sub: 'Inglês',             url: 'https://luddevergard3n.github.io/johnson-english/', repo: 'https://github.com/LuddEvergard3n/johnson-english' },
  { name: 'Humboldt',   sub: 'Geografia',          url: 'https://luddevergard3n.github.io/humboldt/',        repo: 'https://github.com/LuddEvergard3n/humboldt' },
  { name: 'Archimedes', sub: 'Física',              url: 'https://luddevergard3n.github.io/archimedes/',      repo: 'https://github.com/LuddEvergard3n/archimedes' },
];

export function renderAbout(outlet) {
  outlet.innerHTML = `
<div class="about-page-v2" id="about-page">

  <div class="about-hero">
    <h1 class="about-title">Lavoisier</h1>
    <p class="about-subtitle">Laboratório Visual de Química</p>
    <blockquote class="about-epigraph">
      <span class="about-epigraph-text">
        "Rien ne se perd, rien ne se crée, tout se transforme."
      </span>
      <cite class="about-epigraph-cite">
        — Antoine-Laurent de Lavoisier, <em>Traité Élémentaire de Chimie</em>, 1789
      </cite>
    </blockquote>
  </div>

  <div class="about-body">

    <!-- Métricas -->
    <section class="about-section">
      <h2 class="about-h2">O projeto em números</h2>
      <div class="about-metrics">
        ${METRICS.map(m => `
          <div class="about-metric-card">
            <span class="about-metric-val">${esc(m.val)}</span>
            <span class="about-metric-label">${esc(m.label)}</span>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Por que Lavoisier -->
    <section class="about-section">
      <h2 class="about-h2">Por que Lavoisier?</h2>
      <p>
        Antoine-Laurent de Lavoisier (1743–1794) é considerado o pai da química
        moderna. Ele foi o primeiro a tratar a química como ciência rigorosa:
        introduziu a balança de precisão, estabeleceu a nomenclatura química
        sistemática que usamos até hoje e formulou a lei da conservação da massa —
        a frase acima, que abre esta página.
      </p>
      <p>
        O nome não é homenagem apenas histórica. É um princípio de design:
        assim como Lavoisier não inventou novos elementos, mas descreveu com
        precisão o que já existia, este projeto não inventa uma nova forma de
        ensinar química — revela a lógica que já está nela, tornando-a visível
        e manipulável.
      </p>
      <div class="about-callout about-callout--accent">
        A lei da conservação da massa, formulada por Lavoisier, é também o
        princípio por trás do balanceador de equações do laboratório:
        nada se perde, nada se cria nos dois lados da seta.
      </div>
    </section>

    <!-- Filosofia pedagógica -->
    <section class="about-section">
      <h2 class="about-h2">Filosofia pedagógica</h2>
      <p>
        O ensino tradicional de Química começa pela fórmula — e aí perde o aluno.
        O Lavoisier inverte essa ordem. Todo módulo parte do <strong>fenômeno
        observável</strong>: o que acontece, o que você pode manipular, o que
        você já conhece do cotidiano. A formalização matemática e nomeclatura
        chegam depois, ancoradas em algo concreto.
      </p>
      <p>
        O ciclo de aprendizagem de cada módulo é:
      </p>
      <div class="about-cycle">
        ${['Fenômeno', 'Visualização', 'Interação', 'Explicação', 'Exercício', 'Aplicação'].map((step, i) => `
          <div class="about-cycle-step">
            <span class="about-cycle-num">${i + 1}</span>
            <span class="about-cycle-label">${esc(step)}</span>
          </div>
          ${i < 5 ? '<span class="about-cycle-arrow">→</span>' : ''}
        `).join('')}
      </div>
      <p>
        As dicas nos exercícios não entregam a resposta — reduzem o espaço de
        busca e direcionam o raciocínio. O aluno que chega à resposta por si
        mesmo retém de forma diferente de quem recebe a solução pronta.
      </p>
    </section>

    <!-- Organização dos módulos -->
    <section class="about-section">
      <h2 class="about-h2">Organização dos 26 módulos</h2>
      <p>
        Os módulos são distribuídos em três níveis de ensino, refletindo a
        progressão real do currículo brasileiro:
      </p>
      <div class="about-levels">
        <div class="about-level-card">
          <span class="about-level-badge" style="background:rgba(107,203,119,0.15);color:var(--accent-organic);border-color:var(--accent-organic)">Ensino Médio</span>
          <p>7 módulos — da estrutura atômica à estequiometria. Base para o ENEM e vestibulares. Ênfase em visualização e cálculo numérico.</p>
        </div>
        <div class="about-level-card">
          <span class="about-level-badge" style="background:rgba(79,195,247,0.15);color:var(--accent-electron);border-color:var(--accent-electron)">Graduação</span>
          <p>16 módulos — da físico-química ao orgânico avançado. Inclui termodinâmica, cinética, eletroquímica, espectroscopia e bioquímica.</p>
        </div>
        <div class="about-level-card">
          <span class="about-level-badge" style="background:rgba(179,157,219,0.15);color:var(--accent-neutral);border-color:var(--accent-neutral)">Pós-graduação</span>
          <p>3 módulos — supramolecular, simetria e catálise. Conteúdo de disciplinas de nível avançado e pesquisa.</p>
        </div>
      </div>
    </section>

    <!-- Stack técnica -->
    <section class="about-section">
      <h2 class="about-h2">Stack técnica</h2>
      <p>
        HTML5, CSS3 e JavaScript ES2022 modular — sem frameworks, sem bundlers,
        sem dependências externas em tempo de execução. Canvas 2D para simulações
        físicas e visualizações (orbitais, titulação, construtor de moléculas).
        SVG para a tabela periódica interativa. Roteamento hash-based SPA sem
        biblioteca de roteamento. Testes com Node.js nativo (zero dependências).
      </p>
      <p>
        A escolha por dependência zero não é austeridade — é manutenibilidade.
        Sem npm, não há breaking changes de dependências. O projeto estará
        funcionando em 10 anos da mesma forma que hoje, hospedado em GitHub Pages.
      </p>
      <div class="about-callout about-callout--neutral">
        Todo o código-fonte está disponível em
        <a href="https://github.com/LuddEvergard3n/lavoisier" target="_blank" rel="noopener"
           style="color:var(--accent-electron)">github.com/LuddEvergard3n/lavoisier</a>
        sob licença MIT.
      </div>
    </section>

    <!-- Ecossistema -->
    <section class="about-section about-section--ecosystem">
      <h2 class="about-h2">Parte de um ecossistema</h2>
      <p>
        O Lavoisier é um dos projetos de uma coleção de ferramentas pedagógicas
        interativas para diferentes disciplinas, todas com a mesma filosofia:
        zero dependências, código aberto, hospedagem estática.
      </p>
      <div class="about-ecosystem-grid">
        ${ECOSYSTEM.map(e => `
          <div class="about-eco-card">
            <div class="about-eco-top">
              <span class="about-eco-name">${esc(e.name)}</span>
              <span class="about-eco-sub">${esc(e.sub)}</span>
            </div>
            <div class="about-eco-links">
              <a href="${esc(e.url)}" target="_blank" rel="noopener"
                 class="about-eco-link">Acessar</a>
              <a href="${esc(e.repo)}" target="_blank" rel="noopener"
                 class="about-eco-link about-eco-link--ghost">Repo</a>
            </div>
          </div>
        `).join('')}
        <div class="about-eco-card about-eco-card--active">
          <div class="about-eco-top">
            <span class="about-eco-name" style="color:var(--accent-electron)">Lavoisier</span>
            <span class="about-eco-sub">Química</span>
          </div>
          <div class="about-eco-links">
            <span style="font-size:0.75rem;color:var(--text-muted)">você está aqui</span>
          </div>
        </div>
      </div>
    </section>

  </div><!-- .about-body -->
</div>`;
}
