/**
 * js/views/teacher.js — View: Guia do Professor
 * Lavoisier — Laboratório Visual de Química
 *
 * Guia pedagógico com navegação interna (sidebar sticky),
 * atividades prontas para uso em sala e orientações práticas.
 *
 * Layout: sidebar 220px (sticky) + conteúdo flex:1
 * Exporta: renderTeacher(outlet)
 */

import { esc } from '../ui.js';

const SECTIONS = [
  { id: 'o-que-e',      label: 'O que é o Lavoisier' },
  { id: 'como-navegar', label: 'Como navegar' },
  { id: 'como-usar',    label: 'Como usar em sala' },
  { id: 'atividades',   label: 'Atividades práticas' },
  { id: 'ativ-1',       label: '1 — Fenômeno primeiro',   indent: true },
  { id: 'ativ-2',       label: '2 — Laboratório guiado',  indent: true },
  { id: 'ativ-3',       label: '3 — Exercício em dupla',  indent: true },
  { id: 'ativ-4',       label: '4 — Plano de aula livre', indent: true },
  { id: 'lab-pedagogia',label: 'Laboratório em sala' },
  { id: 'niveis',       label: 'Níveis de ensino' },
  { id: 'limitacoes',   label: 'Limitações' },
];

const ACTIVITIES = [
  {
    id: 'ativ-1',
    num: 'Ativ. 1',
    title: 'Fenômeno primeiro',
    level: 'Médio',
    duration: '20–30 min',
    mode: 'Exposição projetada',
    body: `
      <p>Escolha um módulo de ensino médio (sugestão: <strong>Ligações Químicas</strong>
      ou <strong>Reações</strong>). Projete a animação inicial do módulo sem explicar
      nada antes. Deixe os alunos observarem por 1–2 minutos.</p>
      <p>Pergunte: <em>"O que vocês estão vendo? O que está acontecendo?"</em> Recolha
      respostas sem corrigi-las. Depois navegue pelo módulo normalmente, conectando
      cada explicação ao que eles descreveram.</p>
      <div class="teacher-note">
        <strong>Por que funciona:</strong> o aluno que formula uma hipótese errada
        e a vê corrigida pela simulação retém mais do que o que recebe a explicação
        correta de imediato. O erro produtivo é o mecanismo de aprendizagem.
      </div>
      <p><strong>Variante:</strong> peça que anotem 3 perguntas antes de você falar
      qualquer coisa. Essas perguntas viram o roteiro da aula.</p>`,
  },
  {
    id: 'ativ-2',
    num: 'Ativ. 2',
    title: 'Laboratório guiado',
    level: 'Médio / Graduação',
    duration: '45 min',
    mode: 'Computador individual ou dupla',
    body: `
      <p>Abra o <strong>Laboratório</strong> (aba no menu principal). Atribua uma
      tarefa específica por ferramenta:</p>
      <ul style="margin:0.5rem 0 0.5rem 1.25rem;line-height:1.8">
        <li><strong>Construtor de moléculas:</strong> "Monte a molécula de glicose (C₆H₁₂O₆)
        e desenhe a estrutura no caderno."</li>
        <li><strong>Balanceador:</strong> "Balanceie 3 equações que você mesmo inventar e
        verifique na tabela de conservação de átomos."</li>
        <li><strong>Titulação:</strong> "Trace a curva de HCl + NaOH e identifique o
        ponto de equivalência."</li>
        <li><strong>Orbitais:</strong> "Compare o 2s com o 2p e descreva a diferença
        de forma em 2 frases."</li>
      </ul>
      <div class="teacher-warning">
        <strong>Atenção:</strong> o balanceador usa álgebra linear — funciona para
        equações complexas como a do KMnO₄. Se um aluno apresentar uma equação
        impossível (ex: C + O₂ → H₂O), o sistema retornará erro. Aproveite para
        discutir por que a equação não pode ser balanceada.
      </div>
      <p><strong>Variante:</strong> para graduação, use o simulador de titulação
      com ácido fraco (CH₃COOH + NaOH) e peça que identifiquem a região tampão
      e calculem o pKa graficamente a partir da curva.</p>`,
  },
  {
    id: 'ativ-3',
    num: 'Ativ. 3',
    title: 'Exercício em dupla: o erro como dado',
    level: 'Médio / Graduação',
    duration: '30–40 min',
    mode: 'Computador compartilhado',
    body: `
      <p>Em duplas, um aluno responde o exercício sem consultar o parceiro. Ao
      errar e ver a explicação, ele deve explicar oralmente ao parceiro por que
      errou. O parceiro decide se a explicação faz sentido.</p>
      <p>O professor circula e pede que duplas expliquem erros interessantes para
      a turma. O foco não é o acerto — é o diagnóstico do erro.</p>
      <div class="teacher-note">
        <strong>Para o professor:</strong> os erros mais frequentes em cada módulo
        revelam os mal-entendidos conceituais mais comuns. Registre quais questões
        geram mais erros — isso informa o planejamento das próximas aulas.
      </div>
      <p><strong>Variante para ensino médio:</strong> peça que escrevam "por que
      marquei X em vez de Y" — a metacognição escrita é mais eficaz que a oral
      para alunos que não se sentem seguros para falar em público.</p>`,
  },
  {
    id: 'ativ-4',
    num: 'Ativ. 4',
    title: 'Plano de aula com o Gerador',
    level: 'Professor',
    duration: '10–15 min de prep',
    mode: 'Individual (professor)',
    body: `
      <p>Use o <strong>Gerador de Plano de Aula</strong> (menu principal) para
      criar um plano estruturado antes da aula. O gerador já inclui as habilidades
      BNCC de Ciências da Natureza relevantes para cada série do Ensino Médio.</p>
      <p>Fluxo sugerido:</p>
      <ol style="margin:0.5rem 0 0.5rem 1.25rem;line-height:1.8">
        <li>Selecione o ano e os módulos do Lavoisier que usará</li>
        <li>Marque os objetivos de aprendizagem que se aplicam</li>
        <li>Adicione as habilidades BNCC correspondentes</li>
        <li>Escolha metodologia e instrumentos de avaliação</li>
        <li>Imprima ou salve como PDF pelo botão "Gerar PDF"</li>
      </ol>
      <div class="teacher-note">
        O plano gerado é um ponto de partida — edite os campos de texto livre para
        especificidades da sua turma, escola e contexto regional.
      </div>`,
  },
];

export function renderTeacher(outlet) {
  const sidebarLinks = SECTIONS.map(s => `
    <a href="#${s.id}" class="teacher-sidebar-link${s.indent ? ' teacher-sidebar-link--indent' : ''}">
      ${esc(s.label)}
    </a>
  `).join('');

  const actCards = ACTIVITIES.map(a => `
    <div class="teacher-activity" id="${a.id}">
      <div class="teacher-activity-header">
        <span class="teacher-activity-num">${esc(a.num)}</span>
        <span class="teacher-activity-title">${esc(a.title)}</span>
      </div>
      <div class="teacher-activity-meta">
        <span class="teacher-meta-tag">${esc(a.level)}</span>
        <span class="teacher-meta-tag">${esc(a.duration)}</span>
        <span class="teacher-meta-tag">${esc(a.mode)}</span>
      </div>
      <div class="teacher-activity-body">${a.body}</div>
    </div>
  `).join('');

  outlet.innerHTML = `
<div class="teacher-page" id="teacher-page">

  <div class="teacher-layout">

    <!-- Sidebar -->
    <aside class="teacher-sidebar" aria-label="Navegação do guia">
      <div class="teacher-sidebar-panel">
        <div class="teacher-sidebar-group">Visão geral</div>
        <a href="#o-que-e"      class="teacher-sidebar-link">O que é o Lavoisier</a>
        <a href="#como-navegar" class="teacher-sidebar-link">Como navegar</a>
        <a href="#como-usar"    class="teacher-sidebar-link">Como usar em sala</a>
        <div class="teacher-sidebar-group">Atividades</div>
        <a href="#ativ-1" class="teacher-sidebar-link teacher-sidebar-link--indent">1 — Fenômeno primeiro</a>
        <a href="#ativ-2" class="teacher-sidebar-link teacher-sidebar-link--indent">2 — Laboratório guiado</a>
        <a href="#ativ-3" class="teacher-sidebar-link teacher-sidebar-link--indent">3 — Exercício em dupla</a>
        <a href="#ativ-4" class="teacher-sidebar-link teacher-sidebar-link--indent">4 — Gerador de plano</a>
        <div class="teacher-sidebar-group">Referência</div>
        <a href="#lab-pedagogia" class="teacher-sidebar-link">Laboratório em sala</a>
        <a href="#niveis"        class="teacher-sidebar-link">Níveis de ensino</a>
        <a href="#limitacoes"    class="teacher-sidebar-link">Limitações</a>
      </div>
    </aside>

    <!-- Conteúdo principal -->
    <main class="teacher-content">

      <header class="teacher-content-header">
        <h1>Guia do Professor</h1>
        <p class="teacher-lead">
          Material pedagógico para uso do Lavoisier em sala de aula.
          Atividades práticas, orientações de nível e sugestões de integração
          com o currículo de Química.
        </p>
      </header>

      <!-- O que é -->
      <section class="teacher-section" id="o-que-e">
        <h2 class="teacher-h2">O que é o Lavoisier?</h2>
        <p>
          O Lavoisier é um laboratório educacional interativo para o ensino de Química,
          organizado em 26 módulos temáticos com animações, simulações e exercícios guiados.
          Funciona diretamente no navegador, sem instalação, sem conta e sem necessidade
          de conexão contínua após o primeiro carregamento.
        </p>
        <p>
          A ferramenta não substitui o professor — ela fornece ao professor uma
          bancada visual que seria impossível em sala de aula física: visualizar
          orbitais atômicos, simular uma titulação com 200 pontos de dados, construir
          moléculas por arrastar e soltar, balancear equações complexas em tempo real.
        </p>
        <div class="teacher-warning">
          O Lavoisier é uma ferramenta de <strong>apoio</strong>. A mediação do
          professor — a pergunta certa no momento certo — é o que transforma
          a simulação em aprendizagem. Sem mediação, é entretenimento interativo.
        </div>
      </section>

      <!-- Como navegar -->
      <section class="teacher-section" id="como-navegar">
        <h2 class="teacher-h2">Como navegar</h2>
        <p>
          O menu principal tem quatro destinos:
        </p>
        <div class="teacher-nav-guide">
          <div class="teacher-nav-item">
            <span class="teacher-nav-tag">Início</span>
            <span>Visão geral dos módulos por nível de ensino. Ponto de entrada para selecionar o conteúdo.</span>
          </div>
          <div class="teacher-nav-item">
            <span class="teacher-nav-tag">Módulos</span>
            <span>Lista completa dos 26 módulos com filtro por nível. Cada módulo tem seções de conteúdo, simulação e exercícios.</span>
          </div>
          <div class="teacher-nav-item">
            <span class="teacher-nav-tag">Laboratório</span>
            <span>7 ferramentas independentes: construtor de moléculas, Lewis, balanceador, estequiometria, titulação, orbitais, solubilidade.</span>
          </div>
          <div class="teacher-nav-item">
            <span class="teacher-nav-tag">Plano de Aula</span>
            <span>Gerador de planos com habilidades BNCC, objetivos, metodologias e exportação para PDF.</span>
          </div>
        </div>
        <p>
          Dentro de cada módulo, as seções seguem uma ordem pedagógica fixa:
          fenômeno → teoria → simulação → exercícios. O progresso do aluno é
          salvo localmente no navegador.
        </p>
      </section>

      <!-- Como usar em sala -->
      <section class="teacher-section" id="como-usar">
        <h2 class="teacher-h2">Como usar em sala de aula</h2>

        <h3 class="teacher-h3">Projeção única (sala sem computadores)</h3>
        <p>
          O modo mais simples e acessível. Abra o módulo no computador do professor
          e projete. Use as animações como ponto de partida para discussão.
          As simulações interativas podem ser operadas pelo professor enquanto
          recebe sugestões dos alunos: "aumenta a temperatura", "adiciona mais
          moles de reagente".
        </p>

        <h3 class="teacher-h3">Lab de informática (computador por aluno ou dupla)</h3>
        <p>
          Permite atividades de exploração individual. Os alunos podem avançar
          em ritmos diferentes — o progresso é salvo por dispositivo. O professor
          circula e usa os erros nos exercícios como dados diagnósticos.
        </p>

        <h3 class="teacher-h3">Tarefa de casa</h3>
        <p>
          Os módulos funcionam em celular. Exercícios podem ser atribuídos como
          tarefa: "Complete o módulo de Estequiometria até sexta e traga anotadas
          as 2 questões que você errou e por quê." O foco no erro, não no acerto,
          transforma o dever de casa em instrumento diagnóstico.
        </p>

        <div class="teacher-note">
          <strong>Sugestão de rotina:</strong> nos primeiros 5 minutos da aula,
          projete a última questão do módulo anterior. Peça que alguém explique
          a resposta. Isso retoma o conteúdo anterior sem "revisão formal" e
          identifica rapidamente quem não compreendeu.
        </div>
      </section>

      <!-- Atividades -->
      <section class="teacher-section" id="atividades">
        <h2 class="teacher-h2">Atividades práticas prontas para usar</h2>
        <p>
          As quatro atividades abaixo foram desenhadas para funcionar com o
          Lavoisier em diferentes configurações de sala. Cada uma tem nível,
          duração estimada, modo de execução e pelo menos uma variante.
        </p>
        ${actCards}
      </section>

      <!-- Laboratório em sala -->
      <section class="teacher-section" id="lab-pedagogia">
        <h2 class="teacher-h2">Usando o Laboratório em sala</h2>
        <p>
          O Laboratório tem 7 ferramentas com diferentes objetivos pedagógicos:
        </p>
        <table class="teacher-table">
          <thead>
            <tr>
              <th>Ferramenta</th>
              <th>Objetivo pedagógico</th>
              <th>Nível sugerido</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Construtor de moléculas</td><td>Visualizar geometria molecular, arrastar e montar</td><td>Médio / Graduação</td></tr>
            <tr><td>Estruturas de Lewis</td><td>Pares não-ligantes, carga formal, regra do octeto</td><td>Médio / Graduação</td></tr>
            <tr><td>Balanceador de equações</td><td>Conservação de átomos, estequiometria qualitativa</td><td>Médio</td></tr>
            <tr><td>Calculadora estequiométrica</td><td>Cálculo de massas, reagente limitante</td><td>Médio</td></tr>
            <tr><td>Simulador de titulação</td><td>Curva de pH, ponto de equivalência, tampão</td><td>Graduação</td></tr>
            <tr><td>Visualizador de orbitais</td><td>Densidade de probabilidade |ψ|², nós angulares</td><td>Graduação</td></tr>
            <tr><td>Tabela de solubilidade</td><td>Regras de solubilidade, Ksp, precipitação</td><td>Médio / Graduação</td></tr>
          </tbody>
        </table>
      </section>

      <!-- Níveis de ensino -->
      <section class="teacher-section" id="niveis">
        <h2 class="teacher-h2">Níveis de ensino</h2>
        <p>
          Os módulos são marcados com um dos três níveis abaixo. O nível não é
          uma barreira — um aluno de graduação se beneficia de rever os módulos
          de ensino médio, e um aluno de ensino médio avançado pode explorar
          os de graduação com mediação adequada.
        </p>
        <table class="teacher-table">
          <thead>
            <tr><th>Nível</th><th>Módulos</th><th>Corresponde a</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="teacher-level-tag teacher-level-tag--medio">Médio</span></td>
              <td>Estrutura atômica, Tabela periódica, Ligações, Reações, Inorgânica, Misturas, Estequiometria</td>
              <td>1º–3º EM, ENEM, vestibulares</td>
            </tr>
            <tr>
              <td><span class="teacher-level-tag teacher-level-tag--grad">Graduação</span></td>
              <td>Soluções, Termoquímica, Cinética, Eletroquímica, Orgânica, Gases, Analítica, Bioquímica, Nuclear, Ambiental, Quântica, Fases, Espectroscopia, Estado sólido, Coordenação, Fotoquímica</td>
              <td>1º–4º ano de Química/Engenharia/Farmácia/Biologia</td>
            </tr>
            <tr>
              <td><span class="teacher-level-tag teacher-level-tag--pos">Pós-grad.</span></td>
              <td>Supramolecular, Simetria, Catálise</td>
              <td>Disciplinas de pós-graduação, pesquisa</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Limitações -->
      <section class="teacher-section" id="limitacoes">
        <h2 class="teacher-h2">Limitações — comunique explicitamente</h2>
        <div class="teacher-warning">
          As simulações do Lavoisier são modelos simplificados. Comunicar essas
          limitações aos alunos não é fraqueza — é epistemologia: todos os modelos
          em Química são aproximações.
        </div>
        <ul style="line-height:2">
          <li>O construtor de moléculas usa ligação por proximidade, não por valência calculada — geometrias aproximadas.</li>
          <li>Os orbitais são calculados para o hidrogênio (um elétron). Orbitais de átomos multieletrônicos são diferentes.</li>
          <li>O simulador de titulação usa 25°C e Ka/Kb fixos — na prática, esses valores variam com a temperatura.</li>
          <li>O balanceador não indica mecanismo de reação — apenas a estequiometria. Uma equação balanceada não é necessariamente uma reação real.</li>
          <li>Nenhuma simulação substitui o laboratório real: odor, textura, aquecimento, variabilidade de reagentes — essas dimensões sensoriais são irreproduzíveis em software.</li>
        </ul>
      </section>

    </main>
  </div><!-- .teacher-layout -->

</div>`;

  // Smooth scroll nos links âncora do sidebar
  outlet.querySelectorAll('.teacher-sidebar-link[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(link.getAttribute('href').slice(1));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
