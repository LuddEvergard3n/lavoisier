/**
 * js/views/lesson-planner.js — View: Gerador de Plano de Aula
 * Lavoisier — Laboratório Visual de Química
 *
 * Ferramenta para geração de planos de aula de Química com:
 *   - Habilidades BNCC de Ciências da Natureza (EM13CNT / EF09CI)
 *   - Objetivos, metodologias, recursos e avaliação por checkboxes
 *   - Campos de texto livre em cada seção
 *   - Preview em tempo real do documento
 *   - Impressão nativa (window.print) com @media print isolando apenas o documento
 *
 * Layout: dois painéis (formulário fixo + preview flex:1)
 * Zero dependências. Todo client-side.
 *
 * Exporta: renderLessonPlanner(outlet), destroyLessonPlanner()
 */

import { esc } from '../ui.js';

// -------------------------------------------------------------------------
// Dados BNCC — Ciências da Natureza e suas Tecnologias
// EF09CI: Ensino Fundamental (9º ano) — ciências com foco em química
// EM13CNT: Ensino Médio — área de Ciências da Natureza
// -------------------------------------------------------------------------
const BNCC = {
  // 9º ano EF — Ciências (unidade temática: Matéria e Energia)
  'EF9': [
    { id: 'EF09CI01', t: 'Investigar as propriedades físicas e químicas de substâncias através de experimentos, relacionando com as fórmulas químicas.' },
    { id: 'EF09CI02', t: 'Reconhecer a linguagem simbólica das equações químicas e identificar reagentes, produtos e transformações envolvidas.' },
    { id: 'EF09CI03', t: 'Identificar os principais modelos atômicos e compreender a evolução histórica do conceito de átomo.' },
    { id: 'EF09CI04', t: 'Reconhecer a tabela periódica como resultado da organização de elementos por propriedades, relacionando posição e características dos elementos.' },
    { id: 'EF09CI05', t: 'Compreender como as ligações químicas determinam as propriedades das substâncias, distinguindo ligações iônicas, covalentes e metálicas.' },
    { id: 'EF09CI06', t: 'Analisar as consequências das transformações químicas no cotidiano e no ambiente, incluindo corrosão, combustão e decomposição.' },
  ],

  // Ensino Médio 1ª série
  'EM1': [
    { id: 'EM13CNT101', t: 'Analisar e representar as transformações e conservações em sistemas que envolvam quantidade de matéria, de energia e de carga elétrica.' },
    { id: 'EM13CNT102', t: 'Realizar previsões e estimativas de grandezas em situações cotidianas, aplicando modelos e conhecimentos das Ciências da Natureza.' },
    { id: 'EM13CNT103', t: 'Interpretar textos científicos e de divulgação, relacionando informações a conceitos e modelos das Ciências da Natureza.' },
    { id: 'EM13CNT201', t: 'Analisar e utilizar modelos científicos, identificando seus usos, alcances e limitações para representar e explicar fenômenos.' },
    { id: 'EM13CNT202', t: 'Compreender as transformações nucleares naturais e artificiais, relacionando energia nuclear e radioatividade com aplicações tecnológicas e impactos ambientais.' },
    { id: 'EM13CNT203', t: 'Avaliar e prever efeitos de intervenções humanas nos ciclos biogeoquímicos, como a emissão de gases de efeito estufa, e propor medidas.' },
    { id: 'EM13CNT301', t: 'Construir e utilizar tabelas, gráficos e modelos para representar e analisar dados de experimentos ou simulações.' },
    { id: 'EM13CNT302', t: 'Comunicar, por escrito ou oralmente, conclusões sobre investigações, usando linguagem científica adequada e argumentação embasada em evidências.' },
  ],

  // Ensino Médio 2ª série
  'EM2': [
    { id: 'EM13CNT101', t: 'Analisar e representar as transformações e conservações em sistemas que envolvam quantidade de matéria, de energia e de carga elétrica.' },
    { id: 'EM13CNT104', t: 'Avaliar os riscos envolvidos em atividades experimentais, identificando procedimentos de segurança e descarte adequado de materiais.' },
    { id: 'EM13CNT201', t: 'Analisar e utilizar modelos científicos, identificando seus usos, alcances e limitações para representar e explicar fenômenos.' },
    { id: 'EM13CNT204', t: 'Elaborar hipóteses para fenômenos observados, planejar investigações para testá-las e interpretar resultados à luz de conceitos das Ciências.' },
    { id: 'EM13CNT205', t: 'Interpretar resultados de experimentos de equilíbrio químico, termoquímica e cinética, relacionando com fatores que afetam as reações.' },
    { id: 'EM13CNT301', t: 'Construir e utilizar tabelas, gráficos e modelos para representar e analisar dados de experimentos ou simulações.' },
    { id: 'EM13CNT303', t: 'Interpretar e elaborar infográficos, tabelas e modelos visuais para comunicar resultados de investigações científicas.' },
    { id: 'EM13CNT311', t: 'Analisar, mediante leitura de fórmulas estruturais, as propriedades das substâncias orgânicas e suas aplicações em diferentes contextos.' },
  ],

  // Ensino Médio 3ª série
  'EM3': [
    { id: 'EM13CNT101', t: 'Analisar e representar as transformações e conservações em sistemas que envolvam quantidade de matéria, de energia e de carga elétrica.' },
    { id: 'EM13CNT103', t: 'Interpretar textos científicos e de divulgação, relacionando informações a conceitos e modelos das Ciências da Natureza.' },
    { id: 'EM13CNT203', t: 'Avaliar e prever efeitos de intervenções humanas nos ciclos biogeoquímicos e propor medidas mitigadoras.' },
    { id: 'EM13CNT206', t: 'Discutir a aplicação de conceitos químicos, físicos e biológicos em processos industriais e biotecnológicos, avaliando impactos socioeconômicos.' },
    { id: 'EM13CNT301', t: 'Construir e utilizar tabelas, gráficos e modelos para representar e analisar dados de experimentos ou simulações.' },
    { id: 'EM13CNT302', t: 'Comunicar conclusões sobre investigações usando linguagem científica adequada e argumentação embasada em evidências.' },
    { id: 'EM13CNT304', t: 'Elaborar e executar planos de investigação que envolvam múltiplas variáveis, analisando causas, relações e incertezas dos resultados.' },
    { id: 'EM13CNT311', t: 'Analisar, mediante leitura de fórmulas estruturais, as propriedades das substâncias orgânicas e suas aplicações em diferentes contextos.' },
  ],
};

// Presets fixos — não dependem do ano
const P_OBJ = [
  'Reconhecer e descrever o fenômeno químico central do conteúdo',
  'Interpretar representações simbólicas (fórmulas, equações, gráficos)',
  'Realizar cálculos estequiométricos com grandezas do cotidiano',
  'Relacionar o conteúdo com aplicações industriais, ambientais ou biológicas',
  'Identificar e corrigir erros conceituais comuns dos estudantes',
  'Aplicar o conceito em situação-problema inédita',
  'Comparar modelos científicos históricos e contemporâneos',
  'Propor e interpretar experimentos mentais ou simulações',
];
const P_MET = [
  'Exposição dialogada com simulação projetada (Lavoisier)',
  'Exploração individual guiada no Laboratório',
  'Resolução de exercícios com feedback imediato',
  'Trabalho em duplas com discussão do erro',
  'Aula invertida: aluno explora o módulo em casa, discute em sala',
  'Resolução de problemas em grupo (aprendizagem cooperativa)',
  'Debate estruturado com defesa de hipóteses',
  'Leitura e análise de texto de divulgação científica',
];
const P_REC = [
  'Lavoisier — módulos temáticos',
  'Lavoisier — Laboratório (balanceador, titulação, orbitais)',
  'Lavoisier — Gerador de plano de aula',
  'Quadro branco / lousa digital',
  'Tabela periódica impressa ou projetada',
  'Kit de modelos moleculares físicos',
  'Roteiro de experimento impresso',
  'Calculadora científica',
  'Reagentes e vidraria de laboratório',
];
const P_AVA = [
  'Resolução dos exercícios interativos do módulo (registro de acertos/erros)',
  'Questão escrita de aplicação ao final da aula',
  'Relato oral: "explique com suas palavras"',
  'Registro escrito de erro e correção ("por que errei")',
  'Relatório de atividade experimental',
  'Questão de vestibular/ENEM comentada',
  'Mapa conceitual do conteúdo',
  'Avaliação formativa por rubrica observacional',
];

// Módulos do Lavoisier agrupados por nível (para o checkbox de conteúdos)
const MODULOS = {
  'EF9':  ['Estrutura Atômica','Tabela Periódica','Ligações Químicas','Reações Químicas','Mistura e Substâncias'],
  'EM1':  ['Estrutura Atômica','Tabela Periódica','Ligações Químicas','Reações Químicas','Inorgânica','Misturas','Estequiometria','Gases'],
  'EM2':  ['Soluções','Termoquímica','Cinética Química','Eletroquímica','Química Orgânica','Analítica','Fases'],
  'EM3':  ['Química Orgânica','Bioquímica','Nuclear','Ambiental','Eletroquímica','Estequiometria','Espectroscopia'],
};

// -------------------------------------------------------------------------
// Helpers HTML
// -------------------------------------------------------------------------
function cbs(items, pfx, hasId = false) {
  if (!items || !items.length) {
    return '<div class="lp-empty">Selecione o ano/série...</div>';
  }
  return items.map((item, i) => {
    const txt  = hasId ? item.t  : item;
    const idEl = hasId ? item.id : `${pfx}-${i}`;
    const lbl  = hasId
      ? `<span class="lp-bncc-id">${esc(item.id)}</span>${esc(txt)}`
      : esc(txt);
    return `<label class="lp-check-row">
      <input type="checkbox" class="${pfx}-ck" data-text="${esc(txt).replace(/"/g,'&quot;')}"
             data-id="${hasId ? esc(idEl) : ''}">
      ${lbl}
    </label>`;
  }).join('');
}

function gc(pfx, extraId) {
  const checked = [...document.querySelectorAll(`.${pfx}-ck:checked`)]
    .map(c => c.dataset.id ? `[${c.dataset.id}] ${c.dataset.text}` : c.dataset.text);
  const extra = (document.getElementById(extraId)?.value || '').trim();
  return [...checked, ...(extra ? [extra] : [])];
}

function sec(title, items) {
  if (!items || !items.length) return '';
  const rows = items.map(t => `<div class="lp-doc-item">${esc(t)}</div>`).join('');
  return `<div class="lp-doc-sec">
    <div class="lp-doc-sec-title">${esc(title)}</div>
    ${rows}
  </div>`;
}

// -------------------------------------------------------------------------
// Render / Destroy
// -------------------------------------------------------------------------
let _abortController = null;

export function renderLessonPlanner(outlet) {
  _abortController = new AbortController();
  const sig = _abortController.signal;

  outlet.innerHTML = `
<div class="lp-page" id="lp-page">

  <div class="lp-layout">

    <!-- Painel do formulário -->
    <div class="lp-form-panel">

      <h2 class="lp-panel-title">Dados do Plano</h2>

      <!-- Identificação -->
      <div class="lp-fieldset">
        <div class="lp-legend">Identificação</div>
        <div class="lp-grid-2">
          <label class="lp-label">Professor(a)
            <input type="text" id="f-prof" class="lp-input" placeholder="Nome completo">
          </label>
          <label class="lp-label">Escola / Instituição
            <input type="text" id="f-escola" class="lp-input" placeholder="Nome da escola">
          </label>
        </div>
        <div class="lp-grid-3">
          <label class="lp-label">Ano / Série
            <select id="f-ano" class="lp-input">
              <option value="">Selecione...</option>
              <option value="EF9">9º ano EF</option>
              <option value="EM1">1ª série EM</option>
              <option value="EM2">2ª série EM</option>
              <option value="EM3">3ª série EM</option>
            </select>
          </label>
          <label class="lp-label">Data
            <input type="date" id="f-data" class="lp-input">
          </label>
          <label class="lp-label">Nº de aulas
            <input type="number" id="f-naulas" class="lp-input" min="1" max="10" value="1">
          </label>
        </div>
        <div class="lp-grid-3">
          <label class="lp-label">Duração por aula
            <select id="f-dur" class="lp-input">
              <option value="45">45 min</option>
              <option value="50" selected>50 min</option>
              <option value="60">60 min</option>
              <option value="90">1h30</option>
              <option value="100">1h40</option>
            </select>
          </label>
          <label class="lp-label">Carga horária total
            <input type="text" id="f-carga" class="lp-input" readonly
                   style="background:var(--bg-overlay);color:var(--text-secondary)">
          </label>
          <label class="lp-label">Turma
            <input type="text" id="f-turma" class="lp-input" placeholder="Ex: 2º B">
          </label>
        </div>
        <label class="lp-label lp-label--full">Tema / título da aula
          <input type="text" id="f-tema" class="lp-input" placeholder="Ex: Balanceamento de equações por conservação de massa">
        </label>
      </div>

      <!-- Módulos do Lavoisier -->
      <div class="lp-fieldset">
        <div class="lp-legend">Módulos do Lavoisier utilizados</div>
        <div id="box-mod" class="lp-check-box">
          <div class="lp-empty">Selecione o ano/série...</div>
        </div>
        <textarea id="xa-mod" class="lp-textarea lp-textarea--sm"
                  placeholder="Outros módulos ou recursos (opcional)"></textarea>
      </div>

      <!-- Objetivos -->
      <div class="lp-fieldset">
        <div class="lp-legend">Objetivos de aprendizagem</div>
        <div id="box-obj" class="lp-check-box">
          ${cbs(P_OBJ, 'obj')}
        </div>
        <textarea id="xa-obj" class="lp-textarea lp-textarea--sm"
                  placeholder="Objetivo adicional (texto livre)"></textarea>
      </div>

      <!-- BNCC -->
      <div class="lp-fieldset">
        <div class="lp-legend">Habilidades BNCC — Ciências da Natureza</div>
        <div id="box-bncc" class="lp-check-box lp-check-box--bncc">
          <div class="lp-empty">Selecione o ano/série...</div>
        </div>
        <textarea id="xa-bncc" class="lp-textarea lp-textarea--sm"
                  placeholder="Habilidade adicional ou adaptação curricular (texto livre)"></textarea>
      </div>

      <!-- Metodologia -->
      <div class="lp-fieldset">
        <div class="lp-legend">Metodologia</div>
        <div id="box-met" class="lp-check-box">
          ${cbs(P_MET, 'met')}
        </div>
        <textarea id="xa-met" class="lp-textarea lp-textarea--sm"
                  placeholder="Descreva outras estratégias (opcional)"></textarea>
      </div>

      <!-- Recursos -->
      <div class="lp-fieldset">
        <div class="lp-legend">Recursos e materiais</div>
        <div id="box-rec" class="lp-check-box">
          ${cbs(P_REC, 'rec')}
        </div>
        <textarea id="xa-rec" class="lp-textarea lp-textarea--sm"
                  placeholder="Outros recursos (opcional)"></textarea>
      </div>

      <!-- Avaliação -->
      <div class="lp-fieldset">
        <div class="lp-legend">Avaliação</div>
        <div id="box-ava" class="lp-check-box">
          ${cbs(P_AVA, 'ava')}
        </div>
        <textarea id="xa-ava" class="lp-textarea lp-textarea--sm"
                  placeholder="Instrumento adicional de avaliação (opcional)"></textarea>
      </div>

      <!-- Observações -->
      <div class="lp-fieldset">
        <div class="lp-legend">Observações gerais</div>
        <textarea id="f-obs" class="lp-textarea"
                  placeholder="Adaptações para alunos com necessidades específicas, contexto da turma, etc."></textarea>
      </div>

      <!-- Ações -->
      <div class="lp-actions">
        <button class="btn btn-primary btn-sm" id="lp-gerar">Gerar plano</button>
        <button class="btn btn-ghost btn-sm"   id="lp-limpar">Limpar</button>
        <button class="btn btn-secondary btn-sm" id="lp-print" style="display:none">Imprimir / PDF</button>
      </div>

    </div><!-- .lp-form-panel -->

    <!-- Painel de preview -->
    <div class="lp-preview-panel">
      <div class="lp-preview-header">
        <span>Prévia do documento</span>
      </div>
      <div id="lp-doc" class="lp-doc">
        <div class="lp-doc-placeholder">
          Preencha os campos e clique em <strong>Gerar plano</strong>
          para visualizar o documento.
        </div>
      </div>
    </div>

  </div><!-- .lp-layout -->
</div>

<style>
/* =========================================================
   Estilos do Gerador de Plano de Aula
   Estilos inline por isolamento — não afetam o restante do app
   ========================================================= */

.lp-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8, 2rem) var(--space-6, 1.5rem) var(--space-16, 4rem);
}

.lp-layout {
  display: grid;
  grid-template-columns: 460px 1fr;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 900px) {
  .lp-layout { grid-template-columns: 1fr; }
}

/* Painel do formulário */
.lp-form-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.lp-panel-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-default);
}
.lp-fieldset {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.lp-legend {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--accent-electron);
  margin-bottom: 0.25rem;
}
.lp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.lp-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; }
@media (max-width: 600px) {
  .lp-grid-2, .lp-grid-3 { grid-template-columns: 1fr; }
}
.lp-label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  min-height: 2.5em;
  justify-content: flex-end;
}
.lp-label--full { grid-column: 1 / -1; }
.lp-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.4rem 0.6rem;
  background: var(--bg-base);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.875rem;
  outline: none;
  transition: border-color .15s;
}
.lp-input:focus { border-color: var(--accent-electron); }
.lp-check-box {
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 0.4rem;
}
.lp-check-box--bncc { max-height: 240px; }
.lp-check-row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  padding: 0.25rem 0.3rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
  transition: background .12s;
}
.lp-check-row:hover { background: var(--bg-overlay); }
.lp-check-row input { margin-top: 0.2rem; flex-shrink: 0; accent-color: var(--accent-electron); }
.lp-bncc-id {
  font-size: 0.7rem;
  font-family: monospace;
  color: var(--accent-bond);
  background: rgba(255,209,102,0.08);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  white-space: nowrap;
  flex-shrink: 0;
}
.lp-empty { font-size: 0.8125rem; color: var(--text-muted); padding: 0.5rem; }
.lp-textarea {
  width: 100%;
  min-height: 70px;
  padding: 0.5rem 0.6rem;
  background: var(--bg-base);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.8125rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  font-family: inherit;
  transition: border-color .15s;
  box-sizing: border-box;
}
.lp-textarea:focus { border-color: var(--accent-electron); }
.lp-textarea--sm { min-height: 44px; }
.lp-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 0.25rem;
}

/* Painel de preview */
.lp-preview-panel {
  position: sticky;
  top: 1rem;
}
.lp-preview-header {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--border-subtle);
}
.lp-doc {
  background: #ffffff;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  min-height: 280px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  color: #1a1a2e;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 0.8125rem;
  line-height: 1.55;
}
.lp-doc-placeholder {
  color: #888;
  text-align: center;
  padding: 2rem 1rem;
}
.lp-doc-header { margin-bottom: 1.5rem; border-bottom: 2px solid #1a1a2e; padding-bottom: 0.75rem; }
.lp-doc-title { font-size: 1.1rem; font-weight: 700; color: #0d1117; margin-bottom: 0.5rem; }
.lp-doc-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 0.15rem 1rem; font-size: 0.8rem; color: #444; }
.lp-doc-meta span strong { color: #1a1a2e; }
.lp-doc-sec { margin-bottom: 1.1rem; }
.lp-doc-sec-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: #0d1117;
  color: #fff;
  padding: 0.25rem 0.6rem;
  border-radius: 3px;
  margin-bottom: 0.5rem;
  display: inline-block;
}
.lp-doc-item {
  font-size: 0.8125rem;
  padding: 0.2rem 0 0.2rem 0.75rem;
  border-left: 2px solid #e0e0e0;
  margin-bottom: 0.2rem;
  color: #222;
}

/* Impressão */
@media print {
  body { background: white !important; }
  .app-header, .sidebar-nav, nav, .lp-form-panel, .lp-preview-header,
  .lp-actions, #lp-print, .module-back { display: none !important; }
  .lp-layout { display: block !important; }
  .lp-preview-panel { position: static !important; }
  .lp-doc {
    border: none !important;
    box-shadow: none !important;
    padding: 1.5cm 2cm !important;
    font-size: 10pt !important;
    min-height: unset !important;
  }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
</style>`;

  // ---- Inicialização ----
  const today = new Date();
  const dateInput = outlet.querySelector('#f-data');
  if (dateInput) dateInput.valueAsDate = today;

  function calcCarga() {
    const n   = parseInt(outlet.querySelector('#f-naulas')?.value || '1', 10) || 1;
    const dur = parseInt(outlet.querySelector('#f-dur')?.value || '50', 10) || 50;
    const tot = n * dur;
    let txt = tot >= 60
      ? (() => { const h = Math.floor(tot/60), r = tot%60; return r ? `${h}h${String(r).padStart(2,'0')}min` : `${h}h`; })()
      : `${tot} min`;
    const el = outlet.querySelector('#f-carga');
    if (el) el.value = txt;
  }
  calcCarga();

  function onAnoChange() {
    const ano = outlet.querySelector('#f-ano')?.value || '';
    const modList = MODULOS[ano] || [];
    const bnccList = BNCC[ano] || [];

    const boxMod = outlet.querySelector('#box-mod');
    if (boxMod) boxMod.innerHTML = cbs(modList, 'mod');

    const boxBncc = outlet.querySelector('#box-bncc');
    if (boxBncc) boxBncc.innerHTML = cbs(bnccList, 'bncc', true);
  }

  function gerar() {
    const v = id => outlet.querySelector(`#${id}`)?.value?.trim() || '';
    const ano  = v('f-ano');
    const prof = v('f-prof');
    const esc_ = v('f-escola');
    const data = v('f-data') ? new Date(v('f-data') + 'T12:00:00').toLocaleDateString('pt-BR') : '';
    const tema = v('f-tema') || '(sem título)';
    const turma = v('f-turma');
    const naulas = v('f-naulas');
    const carga = v('f-carga');
    const obs = v('f-obs');

    const anoLabel = { EF9:'9º ano EF', EM1:'1ª série EM', EM2:'2ª série EM', EM3:'3ª série EM' }[ano] || '';

    const mod  = gc('mod', 'xa-mod');
    const obj  = gc('obj', 'xa-obj');
    const bncc = gc('bncc', 'xa-bncc');
    const met  = gc('met', 'xa-met');
    const rec  = gc('rec', 'xa-rec');
    const ava  = gc('ava', 'xa-ava');

    let html = `
<div class="lp-doc-header">
  <div class="lp-doc-title">${esc(tema)}</div>
  <div class="lp-doc-meta">
    ${prof    ? `<span><strong>Professor(a):</strong> ${esc(prof)}</span>` : ''}
    ${esc_    ? `<span><strong>Escola:</strong> ${esc(esc_)}</span>` : ''}
    ${anoLabel? `<span><strong>Ano/Série:</strong> ${esc(anoLabel)}</span>` : ''}
    ${turma   ? `<span><strong>Turma:</strong> ${esc(turma)}</span>` : ''}
    ${data    ? `<span><strong>Data:</strong> ${esc(data)}</span>` : ''}
    ${carga   ? `<span><strong>Carga horária:</strong> ${esc(carga)} (${esc(naulas)} aula${naulas !== '1' ? 's' : ''})</span>` : ''}
  </div>
</div>`;

    if (mod.length)  html += sec('Módulos do Lavoisier', mod);
    if (obj.length)  html += sec('Objetivos de aprendizagem', obj);
    if (bncc.length) html += sec('Habilidades BNCC', bncc);
    if (met.length)  html += sec('Metodologia', met);
    if (rec.length)  html += sec('Recursos e materiais', rec);
    if (ava.length)  html += sec('Avaliação', ava);
    if (obs)         html += sec('Observações', [obs]);

    if (!mod.length && !obj.length && !bncc.length) {
      html += '<p style="color:#888;font-size:0.85rem">Selecione ao menos um item em cada seção para gerar o documento.</p>';
    }

    const doc = outlet.querySelector('#lp-doc');
    if (doc) doc.innerHTML = html;

    const printBtn = outlet.querySelector('#lp-print');
    if (printBtn) printBtn.style.display = '';
  }

  function limpar() {
    outlet.querySelectorAll('.lp-input').forEach(el => { el.value = ''; });
    outlet.querySelectorAll('.lp-textarea').forEach(el => { el.value = ''; });
    outlet.querySelectorAll('input[type="checkbox"]').forEach(el => { el.checked = false; });
    if (dateInput) dateInput.valueAsDate = today;
    calcCarga();
    const doc = outlet.querySelector('#lp-doc');
    if (doc) doc.innerHTML = '<div class="lp-doc-placeholder">Preencha os campos e clique em <strong>Gerar plano</strong> para visualizar o documento.</div>';
    const printBtn = outlet.querySelector('#lp-print');
    if (printBtn) printBtn.style.display = 'none';
  }

  // Eventos
  outlet.querySelector('#f-ano')?.addEventListener('change', onAnoChange, { signal: sig });
  outlet.querySelector('#f-naulas')?.addEventListener('input', calcCarga, { signal: sig });
  outlet.querySelector('#f-dur')?.addEventListener('change', calcCarga, { signal: sig });
  outlet.querySelector('#lp-gerar')?.addEventListener('click', gerar, { signal: sig });
  outlet.querySelector('#lp-limpar')?.addEventListener('click', limpar, { signal: sig });
  outlet.querySelector('#lp-print')?.addEventListener('click', () => window.print(), { signal: sig });
}

export function destroyLessonPlanner() {
  if (_abortController) { _abortController.abort(); _abortController = null; }
}
