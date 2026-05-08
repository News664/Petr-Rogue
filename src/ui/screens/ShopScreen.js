import { GameState } from '../../state/GameState.js';
import { generateCardRewards, addCardToDeck, removeCardFromDeck } from '../../systems/RewardSystem.js';
import { reducePetrify } from '../../systems/Effects.js';
import { renderCard } from '../components/CardView.js';
import { navigate } from '../../router.js';
import { rewardPool } from '../../data/cards.js';

const CARD_PRICE   = 40;
const PURIFY_PRICE = 50;
const REMOVE_PRICE = 75;

let _container  = null;
let _shopCards  = [];
let _removeUsed = false;

export const ShopScreen = {
  init(el) {
    _container  = el;
    _removeUsed = false;
    const pool  = GameState.player.cardPool ?? rewardPool;
    _shopCards  = generateCardRewards(pool, 4);
    _renderShop();
  },
  teardown() { _container = null; },
};

function _renderShop() {
  const { player } = GameState;
  _container.innerHTML = `
    <div class="shop-screen">
      <h2>🛒 Shop</h2>
      <p class="shop-gold">💰 ${player.gold} Gold</p>

      <h3>Cards — ${CARD_PRICE}g each</h3>
      <div class="shop-cards">
        ${_shopCards.map((card, i) => renderCard(card, i, player.gold < CARD_PRICE)).join('')}
      </div>

      <h3>Services</h3>
      <div class="shop-services">
        <button id="buy-purify" ${player.gold < PURIFY_PRICE ? 'disabled' : ''}>
          Purify Stone (${PURIFY_PRICE}g) — Reduce Petrify by 20
        </button>
        <button id="remove-card" ${player.gold < REMOVE_PRICE || _removeUsed ? 'disabled' : ''}>
          ${_removeUsed ? 'Card Removed ✓' : `Remove a Card (${REMOVE_PRICE}g)`}
        </button>
      </div>

      <button id="leave-shop" style="margin-top:24px">Leave Shop</button>
    </div>
  `;

  _container.querySelectorAll('.shop-cards .card:not(.card-disabled)').forEach(el => {
    el.addEventListener('click', () => {
      if (player.gold < CARD_PRICE) return;
      const idx = Number(el.dataset.index);
      player.gold -= CARD_PRICE;
      addCardToDeck(GameState, _shopCards[idx]);
      _shopCards.splice(idx, 1);
      _renderShop();
    });
  });

  _container.querySelector('#buy-purify').addEventListener('click', () => {
    if (player.gold < PURIFY_PRICE) return;
    player.gold -= PURIFY_PRICE;
    reducePetrify(player, 20);
    _renderShop();
  });

  _container.querySelector('#remove-card').addEventListener('click', () => {
    if (player.gold < REMOVE_PRICE || _removeUsed) return;
    _renderRemovePicker();
  });

  _container.querySelector('#leave-shop').addEventListener('click', () => navigate('MapScreen'));
}

function _renderRemovePicker() {
  const { player } = GameState;
  _container.innerHTML = `
    <div class="shop-screen">
      <h2>🛒 Remove a Card</h2>
      <p style="color:var(--text-muted)">Choose one card to remove from your deck permanently. Costs ${REMOVE_PRICE}g.</p>
      <div class="upgrade-list">
        ${player.deck.map((card, i) => `
          <button class="upgrade-item" data-index="${i}">
            <span class="upgrade-from">${card.name}${card.isUpgraded ? '+' : ''}</span>
            <span class="upgrade-desc">${card.description}</span>
          </button>
        `).join('')}
      </div>
      <button id="back-to-shop" style="margin-top:16px">← Back</button>
    </div>
  `;

  _container.querySelectorAll('.upgrade-item').forEach(btn => {
    btn.addEventListener('click', () => {
      player.gold -= REMOVE_PRICE;
      removeCardFromDeck(GameState, Number(btn.dataset.index));
      _removeUsed = true;
      _renderShop();
    });
  });

  _container.querySelector('#back-to-shop').addEventListener('click', _renderShop);
}
