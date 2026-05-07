import { starterDeck } from '../data/cards.js';

export function createPlayer() {
  return {
    hp: 75,
    maxHp: 75,
    petrify: 0,
    block: 0,
    gold: 100,
    deck: starterDeck(),
    relics: [],
  };
}

// Returns 'hp', 'petrify', or null
export function checkDeathCause(player) {
  if (player.hp <= 0) return 'hp';
  if (player.petrify >= player.hp) return 'petrify';
  return null;
}
