import { makeCard } from '../data/cards.js';
import { makeRelic, relicDropPool } from '../data/relics.js';

// Colorless (shared) cards appear with ~20% probability per reward slot.
// Within each group, selection is uniformly random without replacement.
const COLORLESS_CHANCE = 0.20;

export function generateCardRewards(cardPool, count = 3) {
  const colorless = cardPool.filter(id => makeCard(id).colorless);
  const character = cardPool.filter(id => !makeCard(id).colorless);

  const shuffleClone = arr => [...arr].sort(() => Math.random() - 0.5);
  const clPool = shuffleClone(colorless);
  const chPool = shuffleClone(character);
  let clIdx = 0, chIdx = 0;

  const results = [];
  for (let i = 0; i < count; i++) {
    const useColorless = Math.random() < COLORLESS_CHANCE && clIdx < clPool.length;
    if (useColorless) {
      results.push(makeCard(clPool[clIdx++]));
    } else if (chIdx < chPool.length) {
      results.push(makeCard(chPool[chIdx++]));
    } else if (clIdx < clPool.length) {
      results.push(makeCard(clPool[clIdx++])); // fallback if char pool exhausted
    }
  }
  return results;
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
