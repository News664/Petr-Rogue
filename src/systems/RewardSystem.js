import { makeCard } from '../data/cards.js';
import { makeRelic, relicDropPool } from '../data/relics.js';

// Colorless (shared) cards appear with ~20% probability per reward slot.
// Rarity weights: 10% rare, 30% uncommon, 60% common.
const COLORLESS_CHANCE = 0.20;

function _rollRarity() {
  const r = Math.random() * 100;
  if (r < 10) return 'rare';
  if (r < 40) return 'uncommon';
  return 'common';
}

export function generateCardRewards(cardPool, count = 3) {
  const colorless = cardPool.filter(id => { const c = makeCard(id); return c.colorless && !c.eventOnly; });
  const character = cardPool.filter(id => { const c = makeCard(id); return !c.colorless && !c.eventOnly; });
  const used = new Set();

  const results = [];
  for (let i = 0; i < count; i++) {
    const useColorless = Math.random() < COLORLESS_CHANCE;
    const primary   = useColorless ? colorless : character;
    const secondary = useColorless ? character : colorless;
    const rarity    = _rollRarity();

    // Try: target rarity from primary pool → any rarity from primary → any from combined
    let candidates = primary.filter(id => !used.has(id) && makeCard(id).rarity === rarity);
    if (!candidates.length) candidates = primary.filter(id => !used.has(id));
    if (!candidates.length) candidates = secondary.filter(id => !used.has(id));
    if (!candidates.length) continue;

    const id = candidates[Math.floor(Math.random() * candidates.length)];
    used.add(id);
    results.push(makeCard(id));
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
