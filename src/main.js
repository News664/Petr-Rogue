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

// Asks the active service worker how much of the precache is done. The worker
// owns the cache name, so the page never hardcodes a version (a mismatch here
// used to open an empty cache and report 0 forever).
function _swStatus(worker, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const ch = new MessageChannel();
    const timer = setTimeout(() => { ch.port1.close(); reject(new Error('timeout')); }, timeoutMs);
    ch.port1.onmessage = (e) => { clearTimeout(timer); ch.port1.close(); resolve(e.data); };
    worker.postMessage({ type: 'STATUS' }, [ch.port2]);
  });
}

// Registers the SW (idempotent), then polls precache progress until it finishes
// or stops advancing, so the player gets a definite answer before going offline.
async function prepareOffline(statusEl, btn) {
  if (!('serviceWorker' in navigator)) {
    statusEl.textContent = 'Offline play is not supported in this browser.';
    return;
  }
  if (!window.isSecureContext) {
    statusEl.textContent = 'Offline play needs HTTPS (or localhost). Open the game over https:// and try again.';
    return;
  }
  if (btn) btn.disabled = true;
  statusEl.textContent = 'Preparing offline play…';
  try {
    await navigator.serviceWorker.register('sw.js');
    const reg = await navigator.serviceWorker.ready;          // resolves once active
    const worker = reg.active ?? navigator.serviceWorker.controller;
    if (!worker) throw new Error('service worker did not activate');

    let last = -1, stalled = 0;
    for (let i = 0; i < 90; i++) {                            // ~90s ceiling
      const { cached = 0, total = 0 } = await _swStatus(worker).catch(() => ({}));
      if (total && cached >= total) {
        statusEl.textContent =
          `✓ Ready for offline play — all ${cached} files cached. You can go offline now; ` +
          'new runs and the reloads on victory/defeat will keep working.';
        return;
      }
      statusEl.textContent = total
        ? `Caching for offline play… ${cached} / ${total} files.`
        : 'Caching for offline play…';
      stalled = (cached === last) ? stalled + 1 : 0;
      last = cached;
      // Downloads finished but a few files never landed — report honestly.
      if (stalled >= 8 && cached > 0) {
        statusEl.textContent =
          `Cached ${cached} of ${total} files and stopped advancing. The game should still ` +
          'run offline, but a few images may be missing. Reload while online to retry.';
        return;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    statusEl.textContent = `Still caching (${last} files so far). Leave this page open a little longer, then press again.`;
  } catch (err) {
    statusEl.textContent = 'Could not enable offline play: ' + (err?.message ?? err);
  } finally {
    if (btn) btn.disabled = false;
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
      <button id="open-gallery" class="btn-secondary">The Hall of the Petrified</button>
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
  const offlineBtn = document.getElementById('prepare-offline');
  offlineBtn.addEventListener('click', () => {
    prepareOffline(document.getElementById('offline-status'), offlineBtn);
  });
}

showMenu();
