import { GameState } from '../../state/GameState.js';
import { generateCardRewards, addCardToDeck } from '../../systems/RewardSystem.js';
import { reducePetrify } from '../../systems/Effects.js';
import { renderCard } from '../components/CardView.js';
import { navigate } from '../../router.js';

const CARD_PRICE    = 40;
const PURIFY_PRICE  = 50;
const PURIFY_AMOUNT = 20;

let _container = null;
let _shopCards = [];

export const ShopScreen = {
  init(el) {
    _container = el;
    _shopCards = generateCardRewards(4);
    _render();
  },
  teardown() { _container = null; },
};

function _render() {
  const { player } = GameState;
  _container.innerHTML = `
    <div class="shop-screen">
      <h2>🛒 Shop</h2>
      <p class="shop-gold">💰 ${player.gold} Gold</p>
      <h3>Cards — ${CARD_PRICE} Gold each</h3>
      <div class="shop-cards">
        ${_shopCards.map((card, i) => renderCard(card, i, player.gold < CARD_PRICE)).join('')}
      </div>
      <h3>Services</h3>
      <div class="shop-services">
        <button id="buy-purify" ${player.gold < PURIFY_PRICE ? 'disabled' : ''}>
          Purify Stone (${PURIFY_PRICE}g) — Reduce Petrify by ${PURIFY_AMOUNT}
        </button>
      </div>
      <button id="leave-shop" style="margin-top:24px">Leave Shop</button>
    </div>
  `;

  _container.querySelectorAll('.shop-cards .card:not(.card-disabled)').forEach(el => {
    el.addEventListener('click', () => {
      if (player.gold < CARD_PRICE) return;
      player.gold -= CARD_PRICE;
      addCardToDeck(GameState, _shopCards[Number(el.dataset.index)]);
      navigate('MapScreen');
    });
  });

  _container.querySelector('#buy-purify').addEventListener('click', () => {
    if (player.gold < PURIFY_PRICE) return;
    player.gold -= PURIFY_PRICE;
    reducePetrify(player, PURIFY_AMOUNT);
    navigate('MapScreen');
  });

  _container.querySelector('#leave-shop').addEventListener('click', () => {
    navigate('MapScreen');
  });
}
