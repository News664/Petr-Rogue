import { GameState } from '../../state/GameState.js';
import { healPlayer, reducePetrify } from '../../systems/Effects.js';
import { upgradeCard } from '../../systems/RewardSystem.js';
import { navigate } from '../../router.js';

export const RestScreen = {
  init(el) {
    _renderOptions(el);
  },
  teardown() {},
};

function _renderOptions(el) {
  const { player } = GameState;
  const healAmt   = Math.floor(player.maxHp * 0.3);
  const purifyAmt = 15;
  const canUpgrade = player.deck.some(c => !c.isUpgraded && c.upgrade);

  el.innerHTML = `
    <div class="rest-screen">
      <h2>🔥 Rest Site</h2>
      <p style="color:var(--text-muted)">
        ❤️ ${player.hp} / ${player.maxHp} &nbsp;|&nbsp; 🪨 Petrify ${player.petrify}
      </p>
      <div class="rest-options">
        <button class="rest-option-btn" id="rest-heal">
          <strong>Rest</strong>
          <span>Heal ${healAmt} HP</span>
        </button>
        <button class="rest-option-btn" id="rest-purify">
          <strong>Purify</strong>
          <span>Reduce Petrify by ${purifyAmt}</span>
        </button>
        <button class="rest-option-btn" id="rest-upgrade" ${canUpgrade ? '' : 'disabled'}>
          <strong>Upgrade</strong>
          <span>${canUpgrade ? 'Permanently upgrade a card' : 'No upgradeable cards'}</span>
        </button>
      </div>
    </div>
  `;

  el.querySelector('#rest-heal').addEventListener('click', () => {
    healPlayer(GameState.player, healAmt);
    navigate('MapScreen');
  });
  el.querySelector('#rest-purify').addEventListener('click', () => {
    reducePetrify(GameState.player, purifyAmt);
    navigate('MapScreen');
  });
  if (canUpgrade) {
    el.querySelector('#rest-upgrade').addEventListener('click', () => _renderUpgradePicker(el));
  }
}

function _renderUpgradePicker(el) {
  const { deck } = GameState.player;
  const upgradeable = deck.map((c, i) => ({ card: c, i })).filter(({ card }) => !card.isUpgraded && card.upgrade);

  el.innerHTML = `
    <div class="rest-screen">
      <h2>🔥 Upgrade a Card</h2>
      <p style="color:var(--text-muted)">Choose one card to upgrade permanently.</p>
      <div class="upgrade-list">
        ${upgradeable.map(({ card, i }) => `
          <button class="upgrade-item" data-index="${i}">
            <span class="upgrade-from">${card.name}</span>
            <span class="upgrade-arrow">→</span>
            <span class="upgrade-to">${card.upgrade.name ?? card.name + '+'}</span>
            <span class="upgrade-desc">${card.upgrade.description ?? ''}</span>
          </button>
        `).join('')}
      </div>
      <button id="back-to-rest" style="margin-top:16px">← Back</button>
    </div>
  `;

  el.querySelectorAll('.upgrade-item').forEach(btn => {
    btn.addEventListener('click', () => {
      upgradeCard(deck[Number(btn.dataset.index)]);
      navigate('MapScreen');
    });
  });
  el.querySelector('#back-to-rest').addEventListener('click', () => _renderOptions(el));
}
