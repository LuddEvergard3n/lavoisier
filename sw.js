/**
 * sw.js — Service Worker do Lavoisier
 *
 * Estratégia: Cache-First com pré-cache de todos os assets no install.
 * Na ativação, versões antigas do cache são deletadas automaticamente.
 *
 * Para forçar atualização em produção: incrementar CACHE_VERSION.
 */

const CACHE_VERSION = 'lavoisier-v1.8.0';

// Lista completa de assets a pré-cachear.
// Gerada automaticamente a partir da estrutura de arquivos do projeto.
const PRECACHE_ASSETS = [
  './index.html',
  './icon-192.svg',
  './icon-512.svg',
  './icon.svg',
  './manifest.json',
  './css/base.css',
  './css/layout.css',
  './css/mobile.css',
  './css/theme.css',
  './js/main.js',
  './js/router.js',
  './js/state.js',
  './js/ui.js',
  './js/engine/feedback.js',
  './js/engine/hint-system.js',
  './js/engine/interaction.js',
  './js/engine/renderer.js',
  './js/engine/simulation.js',
  './js/views/about.js',
  './js/views/home.js',
  './js/views/modules-list.js',
  './js/views/sandbox.js',
  './data/elements.json',
  './data/modules.json',
  './modules/analytical/index.js',
  './modules/atomic-structure/index.js',
  './modules/biochemistry/index.js',
  './modules/chemical-bonds/index.js',
  './modules/coordination/index.js',
  './modules/electrochemistry/index.js',
  './modules/environmental/index.js',
  './modules/gases/index.js',
  './modules/inorganic/index.js',
  './modules/kinetics/index.js',
  './modules/mixtures/index.js',
  './modules/nuclear/index.js',
  './modules/organic/index.js',
  './modules/periodic-table/index.js',
  './modules/phases/index.js',
  './modules/quantum/index.js',
  './modules/reactions/index.js',
  './modules/solidstate/index.js',
  './modules/solutions/index.js',
  './modules/spectroscopy/index.js',
  './modules/stoichiometry/index.js',
  './modules/supramolecular/index.js',
  './modules/symmetry/index.js',
  './modules/thermochemistry/index.js',
  './modules/photochemistry/index.js',
  './modules/catalysis/index.js',
];

// -------------------------------------------------------------------------
// Install — pré-cache de todos os assets
// -------------------------------------------------------------------------
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())  // ativa imediatamente sem esperar aba fechar
  );
});

// -------------------------------------------------------------------------
// Activate — limpa caches de versões anteriores
// -------------------------------------------------------------------------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())  // assume controle de todas as abas abertas
  );
});

// -------------------------------------------------------------------------
// Fetch — Cache-First: serve do cache; cai na rede se não encontrar
// -------------------------------------------------------------------------
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET (forms, API calls)
  if (event.request.method !== 'GET') return;

  // Ignora URLs de outros domínios (CDNs externos, se houver)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        // Asset não cacheado — busca na rede e armazena para próxima vez
        return fetch(event.request)
          .then(response => {
            // Não cachear respostas inválidas
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }
            const clone = response.clone();
            caches.open(CACHE_VERSION)
              .then(cache => cache.put(event.request, clone));
            return response;
          })
          .catch(() => {
            // Sem rede e sem cache — retorna página offline se for navegação
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// -------------------------------------------------------------------------
// Message — permite que a página force atualização do cache
// -------------------------------------------------------------------------
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
