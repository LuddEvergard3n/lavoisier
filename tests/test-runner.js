/**
 * tests/test-runner.js — Orquestrador de testes (Node.js, zero dependências)
 * Lavoisier — Laboratório Visual de Química
 *
 * Execução: node tests/test-runner.js
 *
 * Verifica:
 *  - Integridade dos arquivos JSON de dados
 *  - Presença de todos os arquivos obrigatórios
 *  - Consistência dos módulos (campos obrigatórios)
 *  - Validade de exercícios (resposta entre as opções)
 */

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/* -----------------------------------------------------------------------
   Utilitários de asserção
----------------------------------------------------------------------- */
let _passed = 0;
let _failed = 0;
const _errors = [];

function ok(condition, label) {
  if (condition) {
    _passed++;
    process.stdout.write(`  [ok] ${label}\n`);
  } else {
    _failed++;
    _errors.push(label);
    process.stdout.write(`  [FAIL] ${label}\n`);
  }
}

function equal(a, b, label) {
  ok(a === b, `${label} (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`);
}

function suite(name, fn) {
  console.log(`\n${name}`);
  console.log('─'.repeat(name.length));
  fn();
}

/* -----------------------------------------------------------------------
   Helpers
----------------------------------------------------------------------- */
const ROOT = path.join(__dirname, '..');

function readJSON(rel) {
  const full = path.join(ROOT, rel);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

/* -----------------------------------------------------------------------
   Suite 1 — Estrutura de arquivos obrigatórios
----------------------------------------------------------------------- */
suite('Estrutura de arquivos', () => {
  const required = [
    'index.html',
    'css/base.css',
    'css/layout.css',
    'css/mobile.css',
    'css/theme.css',
    'js/main.js',
    'js/router.js',
    'js/state.js',
    'js/ui.js',
    'js/engine/renderer.js',
    'js/engine/simulation.js',
    'js/engine/interaction.js',
    'js/engine/feedback.js',
    'js/engine/hint-system.js',
    'js/views/home.js',
    'js/views/modules-list.js',
    'js/views/sandbox.js',
    'js/views/about.js',
    'modules/atomic-structure/index.js',
    'modules/periodic-table/index.js',
    'modules/chemical-bonds/index.js',
    'modules/reactions/index.js',
    'data/elements.json',
    'data/modules.json',
    'README.md',
    'CHANGELOG.md',
  ];

  required.forEach(f => ok(exists(f), `Arquivo presente: ${f}`));
});

/* -----------------------------------------------------------------------
   Suite 2 — Integridade do JSON de elementos
----------------------------------------------------------------------- */
suite('data/elements.json', () => {
  let elements;
  try {
    elements = readJSON('data/elements.json');
    ok(true, 'JSON parseable');
  } catch (e) {
    ok(false, `JSON parseable — ${e.message}`);
    return;
  }

  ok(Array.isArray(elements), 'É um array');
  ok(elements.length >= 50, `Tem pelo menos 50 elementos (${elements.length})`);

  const required_fields = ['z', 'symbol', 'name', 'mass', 'period'];
  elements.forEach(el => {
    required_fields.forEach(f => {
      ok(f in el, `Elemento Z=${el.z} (${el.symbol}) tem campo '${f}'`);
    });
    ok(typeof el.z === 'number' && el.z > 0, `Z > 0: ${el.symbol}`);
    ok(typeof el.symbol === 'string' && el.symbol.length > 0, `symbol definido: ${el.symbol}`);
  });

  // Unicidade de Z
  const zSet = new Set(elements.map(e => e.z));
  equal(zSet.size, elements.length, 'Todos os Z são únicos');

  // Unicidade de símbolo
  const symSet = new Set(elements.map(e => e.symbol));
  equal(symSet.size, elements.length, 'Todos os símbolos são únicos');
});

/* -----------------------------------------------------------------------
   Suite 3 — Integridade do JSON de módulos
----------------------------------------------------------------------- */
suite('data/modules.json', () => {
  let modules;
  try {
    modules = readJSON('data/modules.json');
    ok(true, 'JSON parseable');
  } catch (e) {
    ok(false, `JSON parseable — ${e.message}`);
    return;
  }

  ok(Array.isArray(modules), 'É um array');
  ok(modules.length >= 4, `Tem ao menos 4 módulos (${modules.length})`);

  const required_fields = ['id', 'title', 'status', 'route'];
  modules.forEach(mod => {
    required_fields.forEach(f => {
      ok(f in mod, `Módulo '${mod.id}' tem campo '${f}'`);
    });

    // Módulos disponíveis devem ter exercícios
    if (mod.status === 'available') {
      ok(Array.isArray(mod.exercises), `Módulo disponível '${mod.id}' tem array exercises`);
      ok(Array.isArray(mod.realLife),  `Módulo disponível '${mod.id}' tem array realLife`);

      // Cada exercício deve ter resposta entre as opções
      if (Array.isArray(mod.exercises)) {
        mod.exercises.forEach(ex => {
          if (!Array.isArray(ex.options)) return;
          ok(ex.options.includes(ex.answer),
            `Exercício '${ex.id}' — resposta está entre as opções`);
          ok(ex.hints && ex.hints.length > 0,
            `Exercício '${ex.id}' — tem pelo menos uma dica`);
        });
      }
    }
  });

  // IDs únicos
  const idSet = new Set(modules.map(m => m.id));
  equal(idSet.size, modules.length, 'Todos os IDs de módulo são únicos');
});

/* -----------------------------------------------------------------------
   Suite 4 — Conteúdo mínimo dos módulos JS
----------------------------------------------------------------------- */
suite('Conteúdo dos módulos JS', () => {
  const available_modules = [
    'modules/atomic-structure/index.js',
    'modules/periodic-table/index.js',
    'modules/chemical-bonds/index.js',
    'modules/reactions/index.js',
  ];

  available_modules.forEach(modPath => {
    const src = fs.readFileSync(path.join(ROOT, modPath), 'utf8');
    ok(src.includes('export function render'),  `${modPath}: exporta render()`);
    ok(src.includes('markSectionDone'),         `${modPath}: chama markSectionDone()`);
    ok(src.includes('exercise'),                `${modPath}: contém exercício`);
    ok(src.includes('realLife') || src.includes('real-life'), `${modPath}: contém cotidiano`);
  });
});

/* -----------------------------------------------------------------------
   Suite 5 — Estabilidade do roteador (análise estática)
----------------------------------------------------------------------- */
suite('Router JS (análise estática)', () => {
  const routerSrc = fs.readFileSync(path.join(ROOT, 'js/router.js'), 'utf8');
  ok(routerSrc.includes('export function route'),      'Exporta route()');
  ok(routerSrc.includes('export function initRouter'), 'Exporta initRouter()');
  ok(routerSrc.includes('export function navigate'),   'Exporta navigate()');
  ok(routerSrc.includes('hashchange'),                 'Ouve evento hashchange');
});

/* -----------------------------------------------------------------------
   Suite 6 — Estado da aplicação (análise estática)
----------------------------------------------------------------------- */
suite('State JS (análise estática)', () => {
  const stateSrc = fs.readFileSync(path.join(ROOT, 'js/state.js'), 'utf8');
  ok(stateSrc.includes('export function loadState'),      'Exporta loadState()');
  ok(stateSrc.includes('export function getState'),       'Exporta getState()');
  ok(stateSrc.includes('export function setState'),       'Exporta setState()');
  ok(stateSrc.includes('export function markSectionDone'),'Exporta markSectionDone()');
  ok(stateSrc.includes('export function recordAttempt'),  'Exporta recordAttempt()');
  ok(stateSrc.includes('localStorage'),                   'Usa localStorage');
  ok(stateSrc.includes('try'),                            'Tem tratamento de erro no storage');
});

/* -----------------------------------------------------------------------
   Suite 7 — Contrato editorial e científico
----------------------------------------------------------------------- */
suite('Contrato editorial e científico', () => {
  const editorial = readJSON('data/editorial.json');
  const modules = readJSON('data/modules.json');
  equal(editorial.version, 2, 'Versão editorial é 2');
  ok(/^\d{4}-\d{2}-\d{2}$/.test(editorial.lastReviewed), 'Data global de revisão é ISO');
  equal(modules.length, 26, 'Inventário tem exatamente 26 módulos');
  equal(Object.keys(editorial.modules).length, 26, 'Todos os módulos têm metadados editoriais');

  modules.forEach(module => {
    const review = editorial.modules[module.id];
    ok(Boolean(review), `${module.id}: possui revisão editorial`);
    if (!review) return;
    ['learningObjectives','misconceptions','modelLimitations','advancedSections','sourceIds','citations'].forEach(field =>
      ok(Array.isArray(review[field]) && review[field].length > 0, `${module.id}: ${field} preenchido`));
    review.sourceIds.forEach(sourceId => ok(Boolean(editorial.sources[sourceId]), `${module.id}: fonte '${sourceId}' resolvida`));
    review.citations.forEach(citation => {
      ['section','claim','status'].forEach(field => ok(Boolean(citation[field]), `${module.id}: citação tem ${field}`));
      ok(Array.isArray(citation.sourceIds) && citation.sourceIds.length > 0, `${module.id}: citação possui fontes`);
      citation.sourceIds.forEach(sourceId => ok(Boolean(editorial.sources[sourceId]), `${module.id}: citação resolve '${sourceId}'`));
    });
  });

  Object.entries(editorial.sources).forEach(([id, source]) => {
    ['author','title','type','year','url','accessed','scope','method','limitations'].forEach(field =>
      ok(Boolean(source[field]), `Fonte '${id}' tem ${field}`));
  });
});

/* -----------------------------------------------------------------------
   Suite 8 — Grafo de pré-requisitos
----------------------------------------------------------------------- */
suite('Grafo de pré-requisitos', () => {
  const modules = readJSON('data/modules.json');
  const ids = new Set(modules.map(module => module.id));
  const graph = new Map(modules.map(module => [module.id, module.prerequisites || []]));
  modules.forEach(module => (module.prerequisites || []).forEach(id =>
    ok(ids.has(id), `${module.id}: pré-requisito '${id}' existe`)));

  const visiting = new Set();
  const visited = new Set();
  function acyclic(id) {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;
    visiting.add(id);
    const valid = (graph.get(id) || []).every(acyclic);
    visiting.delete(id);
    visited.add(id);
    return valid;
  }
  graph.forEach((_deps, id) => ok(acyclic(id), `${id}: cadeia de pré-requisitos sem ciclo`));
});

/* -----------------------------------------------------------------------
   Suite 9 — JavaScript carregável e integração estática
----------------------------------------------------------------------- */
suite('JavaScript e integração', () => {
  const files = [];
  function collect(dir) {
    fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).forEach(entry => {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(rel);
      else if (entry.name.endsWith('.js')) files.push(rel);
    });
  }
  collect('js');
  collect('modules');
  files.forEach(file => {
    const result = spawnSync(process.execPath, ['--check', path.join(ROOT, file)], { encoding: 'utf8' });
    ok(result.status === 0, `${file}: sintaxe válida`);
  });

  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const precache = [...sw.matchAll(/'\.\/([^']+)'/g)].map(match => match[1]);
  precache.forEach(asset => ok(exists(asset), `Precache resolve: ${asset}`));
  ['css/editorial.css','js/editorial.js','data/editorial.json'].forEach(asset => {
    ok(index.includes(asset) || sw.includes(`./${asset}`), `${asset}: integrado à aplicação`);
    ok(sw.includes(`'./${asset}'`), `${asset}: disponível offline`);
  });
  ok(sw.includes('Promise.allSettled'), 'Pré-cache tolera falha isolada de asset');
  ok(!index.includes('React') && !index.includes('tailwind'), 'Sem framework de interface remoto');
});

/* -----------------------------------------------------------------------
   Suite 10 — Ferramentas e metadados públicos
----------------------------------------------------------------------- */
suite('Laboratório e manifesto', () => {
  const sandbox = fs.readFileSync(path.join(ROOT, 'js/views/sandbox.js'), 'utf8');
  const toolIds = [...sandbox.matchAll(/id:\s*'([^']+)',\s*label:/g)].map(match => match[1]);
  equal(toolIds.length, 7, 'Laboratório declara sete ferramentas');
  equal(new Set(toolIds).size, 7, 'IDs das ferramentas são únicos');
  const manifest = readJSON('manifest.json');
  ok(manifest.shortcuts.some(item => item.description.includes('26 módulos')), 'Manifesto anuncia 26 módulos');
  ok(manifest.shortcuts.some(item => item.description.includes('Tabela periódica')), 'Manifesto descreve a tabela sem contagem divergente');
});

/* -----------------------------------------------------------------------
   Resultado final
----------------------------------------------------------------------- */
console.log('\n' + '═'.repeat(50));
console.log(`RESULTADO: ${_passed} passed, ${_failed} failed`);
if (_errors.length > 0) {
  console.log('\nFalhas:');
  _errors.forEach(e => console.log(`  - ${e}`));
  process.exit(1);
} else {
  console.log('\nALL TESTS PASSED');
  process.exit(0);
}
