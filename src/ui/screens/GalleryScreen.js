// ── GalleryScreen.js ──────────────────────────────────────────────────────────
// Game Over Gallery — lets you browse and preview all death scenes without playing.
// Accessible from the main menu. Uses the same slideshow logic as CombatScreen.
//
// Exports:
//   GalleryScreen — screen object with init(el) and teardown()
// ─────────────────────────────────────────────────────────────────────────────

import { DEATH_MESSAGES } from '../../data/deathMessages.js';

const KEYS = [
  'hp', 'petrify', 'petrify_enemy', 'petrify_status', 'petrify_curse',
  'petrify_self', 'petrify_event',
  'boss_obsidian_sentinel', 'boss_petrified_queen', 'boss_stone_heart',
];

const CHARS = [
  { label: 'Generic', charId: null },
  { label: 'Mint',    charId: 'mint' },
  { label: 'Tharja',  charId: 'tharja' },
];

let _container = null;

export const GalleryScreen = {
  init(el) { _container = el; _renderList(); },
  teardown() { _container = null; },
};

function _entry(key, charId) {
  const fullKey = charId ? `${key}_${charId}` : key;
  return DEATH_MESSAGES[fullKey] ?? DEATH_MESSAGES[key];
}

function _artSrc(key, charId) {
  const base = key.replace(/_/g, '-');
  return charId ? `assets/game-over/${base}-${charId}.png` : `assets/game-over/${base}.png`;
}

function _renderList() {
  _container.innerHTML = `
    <div class="gallery-screen">
      <div class="gallery-header">
        <h1>Game Over Gallery</h1>
        <button id="gallery-menu-back">← Back to Menu</button>
      </div>
      ${CHARS.map(ch => `
        <section class="gallery-section">
          <h2>${ch.label}</h2>
          <div class="gallery-grid">
            ${KEYS.map(key => {
              const e = _entry(key, ch.charId);
              const title = e?.title ?? key;
              const hasFr = !!(e?.frames?.length);
              return `<button class="gallery-item${hasFr ? ' has-frames' : ''}"
                              data-key="${key}" data-charid="${ch.charId ?? ''}">
                <div class="gallery-thumb">
                  <img src="${_artSrc(key, ch.charId)}" alt=""
                       onerror="this.style.display='none'">
                </div>
                <span>${title}</span>
              </button>`;
            }).join('')}
          </div>
        </section>
      `).join('')}
    </div>`;

  _container.querySelector('#gallery-menu-back')
    .addEventListener('click', () => location.reload());

  _container.querySelectorAll('.gallery-item').forEach(btn => {
    btn.addEventListener('click', () =>
      _showPreview(btn.dataset.key, btn.dataset.charid || null));
  });
}

function _showPreview(key, charId) {
  const entry = _entry(key, charId);
  if (!entry) return;
  const { title, body, frames } = entry;

  const primarySrc  = _artSrc(key, charId);
  const fallbackSrc = charId ? `assets/game-over/${key.replace(/_/g, '-')}.png` : null;

  _container.innerHTML = '<div class="game-over game-over-slideshow"></div>';
  const wrapper = _container.querySelector('.game-over-slideshow');

  const artDiv = document.createElement('div');
  artDiv.className = 'game-over-art';
  const imgEl = document.createElement('img');
  imgEl.alt = '';
  imgEl.src = primarySrc;
  imgEl.onerror = fallbackSrc
    ? () => { imgEl.src = fallbackSrc; imgEl.onerror = () => { imgEl.style.display = 'none'; }; }
    : () => { imgEl.style.display = 'none'; };
  artDiv.appendChild(imgEl);

  const textDiv = document.createElement('div');
  textDiv.className = 'game-over-text';

  wrapper.appendChild(artDiv);
  wrapper.appendChild(textDiv);

  const preFrames = frames ?? [];
  let frameIndex = 0;

  function _applyFrame() {
    if (frameIndex < preFrames.length) {
      const f = preFrames[frameIndex];
      imgEl.style.transform       = `scale(${f.zoom ?? 1})`;
      imgEl.style.transformOrigin = `${f.originX ?? '50%'} ${f.originY ?? '50%'}`;
      artDiv.classList.add('go-frame-mode');
      textDiv.innerHTML = `
        <p class="go-frame-text">${f.text}</p>
        <p class="go-hint">Click to continue</p>`;
    } else {
      imgEl.style.transform       = 'scale(1)';
      imgEl.style.transformOrigin = '50% 50%';
      artDiv.classList.remove('go-frame-mode');
      textDiv.innerHTML = `
        <h1>${title}</h1>
        <p class="game-over-epitaph">${body}</p>
        <button id="gallery-preview-back">← Back to Gallery</button>`;
      textDiv.querySelector('#gallery-preview-back')
        .addEventListener('click', _renderList);
    }
  }

  _applyFrame();

  if (preFrames.length > 0) {
    wrapper.style.cursor = 'pointer';
    wrapper.addEventListener('click', e => {
      if (e.target.id === 'gallery-preview-back') return;
      if (frameIndex >= preFrames.length) return;
      frameIndex++;
      wrapper.classList.add('go-fade');
      setTimeout(() => { _applyFrame(); wrapper.classList.remove('go-fade'); }, 300);
    });
  }
}
