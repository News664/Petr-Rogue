// ── sw.js ─────────────────────────────────────────────────────────────────────
// Service worker for offline play. Precaches the entire game (HTML, CSS, all JS
// modules, all images) on install so the game runs with no network — including
// the location.reload() that fires when a run ends (victory or defeat).
//
// Strategy: network-first for same-origin GETs (fresh content when online),
// falling back to the precache when offline. Navigations fall back to the cached
// index so a reload works with zero connectivity.
//
// Bump CACHE when you change any game file so clients refresh the precache.
// The ASSETS list is generated from the file tree; regenerate it if files change
// (see scratchpad/gen-sw or the PR that introduced this file).
// ─────────────────────────────────────────────────────────────────────────────

const CACHE = 'petr-rogue-v1';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './src/data/cards.js',
  './src/data/characters.js',
  './src/data/deathMessages.js',
  './src/data/enemies.js',
  './src/data/events.js',
  './src/data/petrifyFlavor.js',
  './src/data/relics.js',
  './src/main.js',
  './src/router.js',
  './src/state/GameState.js',
  './src/state/Player.js',
  './src/state/RunManager.js',
  './src/systems/CombatSystem.js',
  './src/systems/DeckSystem.js',
  './src/systems/Effects.js',
  './src/systems/MapSystem.js',
  './src/systems/RelicSystem.js',
  './src/systems/RewardSystem.js',
  './src/systems/StatusSystem.js',
  './src/ui/components/CardView.js',
  './src/ui/components/DeathSlideshow.js',
  './src/ui/components/DeckViewer.js',
  './src/ui/components/EnemyView.js',
  './src/ui/components/HUD.js',
  './src/ui/components/StatusBar.js',
  './src/ui/screens/CharacterSelectScreen.js',
  './src/ui/screens/CombatScreen.js',
  './src/ui/screens/EventScreen.js',
  './src/ui/screens/GalleryScreen.js',
  './src/ui/screens/GameOverScreen.js',
  './src/ui/screens/MapScreen.js',
  './src/ui/screens/RestScreen.js',
  './src/ui/screens/RewardScreen.js',
  './src/ui/screens/ShopScreen.js',
  './assets/backgrounds/combat.png',
  './assets/cards/mint/consecrate.png',
  './assets/cards/mint/defend.png',
  './assets/cards/mint/holy_light.png',
  './assets/cards/mint/holy_surge.png',
  './assets/cards/mint/petrify_ward.png',
  './assets/cards/mint/purifying_nova.png',
  './assets/cards/mint/purifying_touch.png',
  './assets/cards/mint/sacred_ground.png',
  './assets/cards/mint/sanctify.png',
  './assets/cards/mint/stone_coat.png',
  './assets/cards/mint/strike.png',
  './assets/cards/tharja/defend.png',
  './assets/cards/tharja/fracture.png',
  './assets/cards/tharja/overload.png',
  './assets/cards/tharja/petrify_lash.png',
  './assets/cards/tharja/petrify_mantle.png',
  './assets/cards/tharja/petrify_shroud.png',
  './assets/cards/tharja/stone_bastion.png',
  './assets/cards/tharja/stone_fang.png',
  './assets/cards/tharja/stone_pact.png',
  './assets/cards/tharja/strike.png',
  './assets/cards/tharja/void_crack.png',
  './assets/cards/tharja/void_release.png',
  './assets/game-over/boss-obsidian-sentinel-mint.png',
  './assets/game-over/boss-obsidian-sentinel-tharja.png',
  './assets/game-over/boss-petrified-queen-mint.png',
  './assets/game-over/boss-petrified-queen-tharja.png',
  './assets/game-over/boss-stone-heart-mint.png',
  './assets/game-over/boss-stone-heart-tharja.png',
  './assets/game-over/hp-mint.png',
  './assets/game-over/hp-tharja.png',
  './assets/game-over/petrify-curse-mint.png',
  './assets/game-over/petrify-curse-tharja.png',
  './assets/game-over/petrify-enemy-mint.png',
  './assets/game-over/petrify-enemy-tharja.png',
  './assets/game-over/petrify-event-mint.png',
  './assets/game-over/petrify-event-tharja.png',
  './assets/game-over/petrify-mint.png',
  './assets/game-over/petrify-self-mint.png',
  './assets/game-over/petrify-self-tharja.png',
  './assets/game-over/petrify-status-mint.png',
  './assets/game-over/petrify-status-tharja.png',
  './assets/game-over/petrify-tharja.png',
  './assets/mint/Portrait_0.png',
  './assets/mint/Portrait_100.png',
  './assets/mint/Portrait_25.png',
  './assets/mint/Portrait_50.png',
  './assets/mint/Portrait_75.png',
  './assets/mint/avatar.png',
  './assets/mint/sprite.png',
  './assets/tharja/Portrait_0.png',
  './assets/tharja/Portrait_25.png',
  './assets/tharja/Portrait_50.png',
  './assets/tharja/Portrait_75.png',
  './assets/tharja/avatar.png',
  './assets/tharja/sprite.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Cache each asset individually so one bad URL doesn't abort the whole precache.
    await Promise.allSettled(ASSETS.map((u) => cache.add(u)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let cross-origin pass through

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const fresh = await fetch(req);
      // Keep the cache warm with successful responses.
      if (fresh && fresh.status === 200) cache.put(req, fresh.clone());
      return fresh;
    } catch (_) {
      // Offline: serve from cache; for navigations fall back to the app shell.
      const cached = await cache.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') {
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
      return Response.error();
    }
  })());
});

// Report precache status to the page (used by the "Prepare for Offline Play" button).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'STATUS') {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE);
      const keys = await cache.keys();
      event.source.postMessage({ type: 'STATUS', cached: keys.length, total: ASSETS.length });
    })());
  }
});
