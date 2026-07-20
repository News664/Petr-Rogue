import { initRouter, setNavHook, navigate } from './router.js';
import { CharacterSelectScreen } from './ui/screens/CharacterSelectScreen.js';
import { MapScreen }             from './ui/screens/MapScreen.js';
import { CombatScreen }          from './ui/screens/CombatScreen.js';
import { RewardScreen }          from './ui/screens/RewardScreen.js';
import { RestScreen }            from './ui/screens/RestScreen.js';
import { ShopScreen }            from './ui/screens/ShopScreen.js';
import { EventScreen }           from './ui/screens/EventScreen.js';
import { GalleryScreen }         from './ui/screens/GalleryScreen.js';
import { GameOverScreen }        from './ui/screens/GameOverScreen.js';
import { updateStatusBar }       from './ui/components/StatusBar.js';

const container   = document.getElementById('screen-container');
const statusBarEl = document.getElementById('status-bar');

// Register the offline service worker (auto — warms the cache on any online visit).
// The menu's "Prepare for Offline Play" button confirms the precache is complete.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline play just won't be available */ });
  });
}

// Registers the SW (idempotent), waits for it to activate, and reports how many
// files are cached so the player knows a run can survive offline reloads.
async function prepareOffline(statusEl) {
  if (!('serviceWorker' in navigator)) {
    statusEl.textContent = 'Offline play is not supported in this browser.';
    return;
  }
  statusEl.textContent = 'Caching the game for offline play…';
  try {
    await navigator.serviceWorker.register('sw.js');
    await navigator.serviceWorker.ready;
    const cache = await caches.open('petr-rogue-v1');
    const keys  = await cache.keys();
    statusEl.textContent = keys.length > 0
      ? `✓ Ready for offline play — ${keys.length} files cached. You can go offline now; the game (and its reloads on victory/defeat) will keep working.`
      : 'Caching started — reload this page once while online, then check again.';
  } catch (err) {
    statusEl.textContent = 'Could not enable offline play: ' + (err?.message ?? err);
  }
}

// Global tooltip: fixed-position div so it is never clipped by any overflow ancestor.
const _tip = document.getElementById('global-tooltip');
document.addEventListener('mouseover', e => {
  const badge = e.target.closest('[data-tooltip]');
  if (!badge) return;
  _tip.textContent = badge.dataset.tooltip;
  _tip.classList.add('visible');
});
document.addEventListener('mousemove', e => {
  if (!_tip.classList.contains('visible')) return;
  const x = e.clientX, y = e.clientY;
  const tw = _tip.offsetWidth, th = _tip.offsetHeight;
  const tipTop = y - th - 10;
  _tip.style.left = `${Math.min(x - tw / 2, window.innerWidth - tw - 8)}px`;
  _tip.style.top  = `${tipTop < 0 ? y + 16 : tipTop}px`;
});
document.addEventListener('mouseout', e => {
  if (!e.target.closest('[data-tooltip]')) return;
  _tip.classList.remove('visible');
});

initRouter(container, {
  CharacterSelectScreen,
  MapScreen,
  CombatScreen,
  RewardScreen,
  RestScreen,
  ShopScreen,
  EventScreen,
  GalleryScreen,
  GameOverScreen,
});

setNavHook(screenName => updateStatusBar(statusBarEl, screenName));

function showMenu() {
  // Clear status bar on menu
  statusBarEl.innerHTML = '';
  statusBarEl.classList.add('hidden');

  container.innerHTML = `
    <div class="menu-screen">
      <h1>Petr-Rogue</h1>
      <p class="subtitle">A petrification-themed roguelike deckbuilder</p>
      <p class="menu-hint">Build your deck. Manage the stone. Survive.</p>
      <button id="new-run" class="btn-primary">New Run</button>
      <button id="open-gallery" class="btn-secondary">Game Over Gallery</button>
      <button id="prepare-offline" class="btn-secondary">Prepare for Offline Play</button>
      <p id="offline-status" class="menu-hint"></p>
    </div>
  `;
  document.getElementById('new-run').addEventListener('click', () => {
    navigate('CharacterSelectScreen');
  });
  document.getElementById('open-gallery').addEventListener('click', () => {
    navigate('GalleryScreen');
  });
  document.getElementById('prepare-offline').addEventListener('click', () => {
    prepareOffline(document.getElementById('offline-status'));
  });
}

showMenu();
