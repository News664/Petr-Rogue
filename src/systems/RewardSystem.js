import { makeCard } from '../data/cards.js';
import { makeRelic, relicDropPool } from '../data/relics.js';

export function generateCardRewards(cardPool, count = 3) {
  const shuffled = [...cardPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(makeCard);
}

export function generateRelicReward() {
  const id = relicDropPool[Math.floor(Math.random() * relicDropPool.length)];
  return makeRelic(id);
}

export function addCardToDeck(state, card) {
  state.player.deck.push({ ...card });
}

export function addRelicToPlayer(state, relic) {
  state.player.relics.push({ ...relic });
}

export function removeCardFromDeck(state, deckIndex) {
  state.player.deck.splice(deckIndex, 1);
}

export function upgradeCard(card) {
  if (card.isUpgraded || !card.upgrade) return false;
  const u = card.upgrade;
  if (u.name)        card.name        = u.name;
  if (u.description) card.description = u.description;
  if (u.effect)      card.effect      = u.effect;
  if (u.cost !== undefined) card.cost = u.cost;
  card.isUpgraded = true;
  return true;
}
