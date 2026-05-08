import { GameState } from '../../state/GameState.js';
import { generateCardRewards, generateRelicReward, addCardToDeck, addRelicToPlayer } from '../../systems/RewardSystem.js';
import { renderCard } from '../components/CardView.js';
import { navigate } from '../../router.js';
import { rewardPool } from '../../data/cards.js';

let _container = null;
let _rewards   = [];
let _relic     = null;

export const RewardScreen = {
  init(el, { source = 'combat' }) {
    _container = el;
    const pool = GameState.player.cardPool ?? rewardPool;
    _rewards   = generateCardRewards(pool, 3);
    _relic     = (source === 'elite' || source === 'boss') ? generateRelicReward() : null;
    GameState.player.gold += 15 + Math.floor(Math.random() * 15);
    if (source === 'boss') {
      GameState.player.hp     = GameState.player.maxHp;
      GameState.player.petrify = 0;
    }
    _render(source);
  },
  teardown() { _container = null; },
};

function _render(source) {
  const sourceLabel = source === 'elite' ? 'Elite Victory' : source === 'boss' ? 'Boss Defeated!' : 'Combat Victory';

  _container.innerHTML = `
    <div class="reward-screen">
      <h2>${sourceLabel}</h2>
      ${_relic ? `
        <div class="relic-reward">
          <h3>✨ Relic obtained</h3>
          <div class="relic-card" id="take-relic">
            <div class="relic-name">${_relic.name}</div>
            <div class="relic-desc">${_relic.description}</div>
          </div>
        </div>
      ` : ''}
      <p>Choose a card to add to your deck, or skip.</p>
      <div class="reward-cards">
        ${_rewards.map((card, i) => renderCard(card, i)).join('')}
      </div>
      <button id="skip-reward">Skip card</button>
    </div>
  `;

  if (_relic) {
    _container.querySelector('#take-relic').addEventListener('click', () => {
      addRelicToPlayer(GameState, _relic);
      _relic = null;
      _container.querySelector('.relic-reward').innerHTML =
        `<p class="relic-taken">✅ Relic added to your collection.</p>`;
    });
  }

  _container.querySelectorAll('.card').forEach(el => {
    el.addEventListener('click', () => {
      addCardToDeck(GameState, _rewards[Number(el.dataset.index)]);
      navigate('MapScreen');
    });
  });

  _container.querySelector('#skip-reward').addEventListener('click', () => navigate('MapScreen'));
}
