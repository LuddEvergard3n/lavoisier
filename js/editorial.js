/** Shared editorial layer for module metadata, sources and progressive depth. */
import { esc } from './ui.js';
import { getState, setState } from './state.js';

let editorialPromise;
let modulesPromise;

export function loadEditorial() {
  editorialPromise ||= fetch('data/editorial.json').then(checkedJSON);
  return editorialPromise;
}

export function loadModules() {
  modulesPromise ||= fetch('data/modules.json').then(checkedJSON);
  return modulesPromise;
}

async function checkedJSON(response) {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function enhanceModule(outlet, moduleId) {
  const [editorial, modules] = await Promise.all([loadEditorial(), loadModules()]);
  const meta = modules.find(item => item.id === moduleId);
  const review = editorial.modules[moduleId];
  const page = outlet.querySelector('.module-page');
  if (!page || !meta || !review || page.dataset.editorialEnhanced === 'true') return;
  page.dataset.editorialEnhanced = 'true';
  page.dataset.editorialModule = moduleId;
  movePrematureAdvancedContent(page, moduleId);
  wrapDeclaredAdvanced(page, review, meta.level);
  addModuleOverview(page, meta, review, editorial);
  addSectionNavigation(page);
  addClaimCitations(page, review);
  addSources(page, review, editorial.sources);
  saveLast(moduleId, page.querySelector('.module-section[id]')?.id || 'overview');
}

function wrapDeclaredAdvanced(page, review, level) {
  if (level !== 'high-school' || page.querySelector('.depth-panel--advanced')) return;
  const terms = review.advancedSections.map(item => item.toLocaleLowerCase('pt-BR').split(' ')[0]);
  const sections = [...page.querySelectorAll(':scope > .module-section:not([id])')].filter(section => {
    const title = section.querySelector('h2')?.textContent.toLocaleLowerCase('pt-BR') || '';
    return terms.some(term => title.includes(term));
  });
  if (!sections.length) return;
  const details = document.createElement('details');
  details.className = 'depth-panel depth-panel--advanced';
  details.innerHTML = '<summary><span>Aprofundamento</span><strong>Conteúdo universitário opcional</strong></summary><div class="depth-panel-body"></div>';
  sections[0].before(details);
  sections.forEach(section => details.querySelector('.depth-panel-body').appendChild(section));
}

function movePrematureAdvancedContent(page, moduleId) {
  if (moduleId !== 'atomic-structure') return;
  const phenomenon = page.querySelector('#sec-phenomenon');
  if (!phenomenon) return;
  const advanced = [];
  let node = phenomenon.previousElementSibling;
  while (node?.matches('.module-section')) {
    advanced.unshift(node);
    node = node.previousElementSibling;
  }
  const explanation = page.querySelector('#sec-explanation');
  const exercise = page.querySelector('#sec-exercise');
  node = explanation?.nextElementSibling;
  while (node && node !== exercise) {
    const next = node.nextElementSibling;
    if (node.matches('.module-section:not([id])')) advanced.push(node);
    node = next;
  }
  if (!advanced.length) return;
  const details = document.createElement('details');
  details.className = 'depth-panel depth-panel--advanced';
  details.innerHTML = '<summary><span>Aprofundamento</span><strong>Espectroscopia e fundamentos quânticos</strong></summary><div class="depth-panel-body"></div>';
  const body = details.querySelector('.depth-panel-body');
  advanced.forEach(section => body.appendChild(section));
  page.insertBefore(details, exercise);
}

function addModuleOverview(page, meta, review, editorial) {
  const header = page.querySelector('.module-header');
  if (!header) return;
  const level = {'high-school':'Ensino Médio','university':'Graduação','graduate':'Pós-graduação'}[meta.level] || meta.level;
  const prerequisites = (meta.prerequisites || []).map(id =>
    `<button class="meta-link" data-nav="/module/${esc(id)}">${esc(id.replaceAll('-', ' '))}</button>`).join('');
  const block = document.createElement('div');
  block.className = 'module-overview';
  block.innerHTML = `<div class="module-meta-row"><span class="science-tag">${esc(level)}</span><span>${Number(meta.estimatedTime) || 30} min</span><span>Revisado em ${esc(editorial.lastReviewed)}</span></div><div class="module-goals"><p class="eyebrow">Ao final, você será capaz de</p><ul>${review.learningObjectives.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>${prerequisites ? `<div class="module-prereqs"><span>Pré-requisitos recomendados</span>${prerequisites}</div>` : ''}<aside class="model-note"><strong>Limite do modelo</strong><span>${esc(review.modelLimitations[0])}</span></aside>`;
  header.appendChild(block);
}

function addSectionNavigation(page) {
  const sections = [...page.querySelectorAll(':scope > .module-section[id]')];
  if (sections.length < 2) return;
  const nav = document.createElement('nav');
  nav.className = 'lesson-rail';
  nav.setAttribute('aria-label', 'Etapas da aula');
  nav.innerHTML = sections.map((section, index) => {
    const heading = section.querySelector('h2')?.textContent.trim() || `Etapa ${index + 1}`;
    return `<button type="button" data-lesson-target="${esc(section.id)}"><span>${index + 1}</span>${esc(heading)}</button>`;
  }).join('');
  nav.addEventListener('click', event => {
    const button = event.target.closest('[data-lesson-target]');
    if (button) page.querySelector(`#${button.dataset.lessonTarget}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  page.insertBefore(nav, sections[0]);
}

function addSources(page, review, sources) {
  const section = document.createElement('section');
  section.className = 'module-section source-section';
  section.id = 'sec-sources';
  section.innerHTML = `<p class="eyebrow">Evidência e revisão</p><h2 class="module-section-title">Fontes e limites</h2><p class="module-text">As referências sustentam os conceitos e dados destacados. Modelos didáticos continuam sendo aproximações.</p><div class="citation-list">${review.sourceIds.map((id, index) => {
    const source = sources[id];
    return source ? `<details class="citation-card"><summary><span>[${index + 1}]</span><strong>${esc(source.author)} — ${esc(source.title)}</strong></summary><div><p>${esc(source.scope)}</p><p><b>Método:</b> ${esc(source.method)}</p><p><b>Limitação:</b> ${esc(source.limitations)}</p><a href="${esc(source.url)}" target="_blank" rel="noopener">Consultar fonte</a></div></details>` : '';
  }).join('')}</div><div class="misconception-panel"><strong>Evite esta armadilha</strong><p>${esc(review.misconceptions[0])}</p></div>`;
  page.appendChild(section);
}

function addClaimCitations(page, review) {
  review.citations.forEach((citation, index) => {
    const target = page.querySelector(`#sec-${citation.section}, #${citation.section}`);
    const heading = target?.querySelector('h2, h3');
    if (!heading) return;
    const marker = document.createElement('sup');
    marker.className = 'claim-citation';
    marker.title = citation.claim;
    marker.textContent = `[${index + 1}]`;
    heading.appendChild(marker);
  });
}

function saveLast(moduleId, sectionId) {
  const state = getState();
  setState({lastModule: moduleId, lastSection: sectionId, history: [moduleId, ...(state.history || []).filter(id => id !== moduleId)].slice(0, 6)});
}
