import { GameState } from '../../state/GameState.js';
import { openDeckViewer } from './DeckViewer.js';

const HIDE_ON = new Set(['MenuScreen', 'CharacterSelectScreen']);

export function updateStatusBar(el, screenName) {
  const { player } = GameState;
  if (!player || HIDE_ON.has(screenName)) {
    el.innerHTML = '';
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');

  const { hp, maxHp, petrify, block, gold, relics, deck } = player;
  const pctPetrify = Math.min(100, (petrify / maxHp) * 100);
  const pctSafe    = Math.max(0,   ((hp - petrify) / maxHp) * 100);
  const pctMissing = Math.max(0,   100 - pctPetrify - pctSafe);
  const danger     = petrify > 0 && (hp - petrify) <= 10;

  el.innerHTML = `
    <div class="sbar-inner${danger ? ' sbar-danger' : ''}">
      <div class="sbar-vitals">
        <div class="sbar-bar">
          <div class="bar-petrify" style="width:${pctPetrify}%"></div>
          <div class="bar-safe"    style="width:${pctSafe}%"></div>
          <div class="bar-missing" style="width:${pctMissing}%"></div>
        </div>
        <div class="sbar-labels">
          <span class="label-petrify" title="Petrify — game over if this reaches your HP">🪨 ${petrify}</span>
          <span class="label-hp">❤️ ${hp}/${maxHp}</span>
          ${block > 0 ? `<span class="stat-block">🛡️ ${block}</span>` : ''}
          <span class="stat-gold">💰 ${gold}</span>
        </div>
      </div>
      <div class="sbar-relics">
        ${relics.map(r => `<span class="relic-pip" title="${r.name}: ${r.description}">${r.name.split(' ').map(w => w[0]).join('')}</span>`).join('')}
      </div>
      <button class="sbar-deck-btn" id="sbar-deck-btn">📖 Deck (${deck.length})</button>
    </div>
  `;

  el.querySelector('#sbar-deck-btn').addEventListener('click', () => {
    openDeckViewer(document.getElementById('deck-overlay'), player);
  });
}
