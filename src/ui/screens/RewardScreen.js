import { GameState } from '../../state/GameState.js';
import { generateCardRewards, addCardToDeck } from '../../systems/RewardSystem.js';
import { renderCard } from '../components/CardView.js';
import { navigate } from '../../router.js';

let _container = null;
let _rewards = [];

export const RewardScreen = {
  init(el) {
    _container = el;
    _rewards = generateCardRewards(3);
    // Gold reward for winning combat
    GameState.player.gold += 15 + Math.floor(Math.random() * 15);
    _render();
  },
  teardown() { _container = null; },
};

function _render() {
  _container.innerHTML = `
    <div class="reward-screen">
      <h2>Combat Victory</h2>
      <p>Choose a card to add to your deck, or skip.</p>
      <div class="reward-cards">
        ${_rewards.map((card, i) => renderCard(card, i)).join('')}
      </div>
      <button id="skip-reward">Skip reward</button>
    </div>
  `;

  _container.querySelectorAll('.card').forEach(el => {
    el.addEventListener('click', () => {
      addCardToDeck(GameState, _rewards[Number(el.dataset.index)]);
      navigate('MapScreen');
    });
  });

  _container.querySelector('#skip-reward').addEventListener('click', () => {
    navigate('MapScreen');
  });
}
