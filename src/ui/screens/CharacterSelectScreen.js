// ── CharacterSelectScreen.js ──────────────────────────────────────────────────
// Master–detail character picker. A roster grid of avatars on the left; the
// focused character's full detail (flavor, stats, relic, starter deck) on the
// right. Scales to many characters without the screen becoming a wall of cards.
//
// Exports:
//   CharacterSelectScreen — screen object with init(el) and teardown()
//
// Roster = all characterDefs (built-in; future custom defs merge in here too),
// followed by LOCKED placeholder tiles for not-yet-implemented characters.
// ─────────────────────────────────────────────────────────────────────────────

import { characterDefs, createPlayerFromCharacter } from '../../data/characters.js';
import { relicDefs } from '../../data/relics.js';
import { GameState } from '../../state/GameState.js';
import { generateMap } from '../../systems/MapSystem.js';
import { navigate } from '../../router.js';

// Placeholder tiles shown after the playable roster (design teasers).
const LOCKED = [
  { name: 'Opal',    title: 'The Faceted',    flavor: 'She does not fear the stone, nor merely endure it — she mines it. Petrification, to her, is raw ore: something to be cut, banked, and spent.' },
  { name: 'Galatea', title: 'The Statue',     flavor: 'Carved before she was born, or so the story goes. She fights with the patience of marble — gathering her poise in perfect stillness, then striking once, decisively.' },
];

let _el = null;
let _selectedId = null;

export const CharacterSelectScreen = {
  init(el) {
    _el = el;
    const ids = Object.keys(characterDefs);
    _selectedId = ids[0] ?? null;
    _render();
  },
  teardown() { _el = null; _selectedId = null; },
};

function _render() {
  const chars = Object.values(characterDefs);
  _el.innerHTML = `
    <div class="char-select-screen">
      <h1>Choose Your Character</h1>
      <div class="char-select-body">
        <div class="char-roster">
          ${chars.map(c => `
            <button class="char-tile${c.id === _selectedId ? ' char-tile-active' : ''}" data-id="${c.id}">
              <div class="char-tile-portrait">
                <img src="assets/${c.id}/avatar.png" alt="${c.name}"
                     onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'🧎',className:'char-avatar-fallback'}))">
              </div>
              <span class="char-tile-name">${c.name}</span>
            </button>
          `).join('')}
          ${LOCKED.map(l => `
            <div class="char-tile char-tile-locked" title="Coming soon">
              <div class="char-tile-portrait">🔒</div>
              <span class="char-tile-name">${l.name}</span>
            </div>
          `).join('')}
        </div>
        <div class="char-detail" id="char-detail"></div>
      </div>
    </div>
  `;

  _el.querySelectorAll('.char-tile[data-id]').forEach(btn => {
    btn.addEventListener('click', () => { _selectedId = btn.dataset.id; _render(); });
  });

  _renderDetail();
}

function _renderDetail() {
  const detail = _el.querySelector('#char-detail');
  if (!detail) return;
  const c = characterDefs[_selectedId];
  if (!c) {
    detail.innerHTML = `<p class="char-detail-empty">Select a character.</p>`;
    return;
  }
  detail.innerHTML = `
    <div class="char-detail-head">
      <div class="char-name">${c.name}</div>
      <div class="char-title">${c.title}</div>
    </div>
    <div class="char-flavor">${c.flavor}</div>
    <div class="char-stats">
      <span>❤️ ${c.hp} HP</span>
      <span>⚡ ${c.energy} Energy</span>
    </div>
    <div class="char-relic-hint">Starting relic: <em>${_relicName(c.startingRelicId)}</em></div>
    <div class="char-deck-preview">
      <span class="deck-preview-label">Starter deck:</span>
      ${_deckPreview(c)}
    </div>
    <button class="btn-primary char-select-btn" data-id="${c.id}">Play as ${c.name}</button>
  `;
  detail.querySelector('.char-select-btn')
    .addEventListener('click', () => _startRun(c.id));
}

function _startRun(charId) {
  const charDef = characterDefs[charId];
  if (!charDef) return;
  GameState.player = createPlayerFromCharacter(charDef);
  GameState.map    = generateMap();
  GameState.combat = null;
  navigate('MapScreen');
}

function _relicName(relicId) {
  return relicDefs[relicId]?.name ?? relicId;
}

function _deckPreview(charDef) {
  const counts = {};
  charDef.starterDeck().forEach(c => { counts[c.name] = (counts[c.name] || 0) + 1; });
  return Object.entries(counts)
    .map(([name, n]) => `<span class="deck-pip">${n}× ${name}</span>`)
    .join('');
}
