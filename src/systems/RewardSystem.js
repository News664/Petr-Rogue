import { rewardPool, makeCard } from '../data/cards.js';

export function generateCardRewards(count = 3) {
  const shuffled = [...rewardPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(makeCard);
}

export function addCardToDeck(state, card) {
  state.player.deck.push({ ...card });
}
