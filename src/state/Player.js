import { starterDeck } from '../data/cards.js';

// Generic player creation (used as fallback without character select)
export function createPlayer() {
  return {
    characterId: null,
    hp: 75, maxHp: 75,
    petrify: 0, block: 0, gold: 100,
    deck: starterDeck(),
    relics: [],
    statusEffects: {},
    cardPool: null,
  };
}

// Returns 'hp', 'petrify', or null
export function checkDeathCause(player) {
  if (player.hp <= 0)              return 'hp';
  if (player.petrify >= player.hp) return 'petrify';
  return null;
}
