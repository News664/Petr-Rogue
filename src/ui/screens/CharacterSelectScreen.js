import { characterDefs, createPlayerFromCharacter } from '../../data/characters.js';
import { GameState } from '../../state/GameState.js';
import { generateMap } from '../../systems/MapSystem.js';
import { navigate } from '../../router.js';

export const CharacterSelectScreen = {
  init(el) {
    const chars = Object.values(characterDefs);
    el.innerHTML = `
      <div class="char-select-screen">
        <h1>Choose Your Character</h1>
        <div class="char-list">
          ${chars.map(c => `
            <div class="char-card" data-id="${c.id}">
              <div class="char-portrait">
                <img src="assets/${c.id}/avatar.png" alt="${c.name}" class="char-avatar"
                     onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'🧎',className:'char-avatar-fallback'}))">
              </div>
              <div class="char-name">${c.name}</div>
              <div class="char-title">${c.title}</div>
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
            </div>
          `).join('')}
          <div class="char-card char-locked">
            <div class="char-portrait">🔒</div>
            <div class="char-name">???</div>
            <div class="char-title">Coming soon</div>
            <div class="char-flavor">A dark sorceress who wields petrification as a weapon, letting the stone run deep for terrible power.</div>
          </div>
          <div class="char-card char-locked">
            <div class="char-portrait">🔒</div>
            <div class="char-name">???</div>
            <div class="char-title">Coming soon</div>
            <div class="char-flavor">A warrior who fights the stone with raw physical force, turning hardened flesh into an unstoppable weapon.</div>
          </div>
        </div>
      </div>
    `;

    el.querySelectorAll('.char-select-btn').forEach(btn => {
      btn.addEventListener('click', () => _startRun(btn.dataset.id));
    });
  },
  teardown() {},
};

function _startRun(charId) {
  const charDef = characterDefs[charId];
  if (!charDef) return;
  GameState.player = createPlayerFromCharacter(charDef);
  GameState.map    = generateMap();
  GameState.combat = null;
  navigate('MapScreen');
}

function _relicName(relicId) {
  const names = {
    stone_veil: 'Stone Veil',
  };
  return names[relicId] ?? relicId;
}

function _deckPreview(charDef) {
  const counts = {};
  charDef.starterDeck().forEach(c => { counts[c.name] = (counts[c.name] || 0) + 1; });
  return Object.entries(counts)
    .map(([name, n]) => `<span class="deck-pip">${n}× ${name}</span>`)
    .join('');
}
