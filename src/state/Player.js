// ── Player.js ─────────────────────────────────────────────────────────────────
// Player state factory and death-cause checker.
//
// Exports:
//   createPlayer() → generic player state (fallback; prefer createPlayerFromCharacter)
//   checkDeathCause(player, combat) → cause string | null
//
// Death conditions (checked after every meaningful state mutation):
//   player.petrify >= player.hp  → petrify death (cause includes source type/id)
//   player.hp <= 0               → hp death
//
// cause string format (used by deathMessages.js for key lookup):
//   'petrify:{type}:{id}'  e.g. 'petrify:enemy:stone_heart'
//   'petrify:{type}'       e.g. 'petrify:status'
//   'hp'
// ─────────────────────────────────────────────────────────────────────────────

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

// Returns a cause object or null.
// { type: 'boss', bossId, subtype: 'hp'|'petrify' }
// { type: 'hp',      killerId }
// { type: 'petrify', source: { type, id } }
export function checkDeathCause(player, combat = null) {
  const attacker = combat?.lastEnemyAttacker ?? null;
  if (player.hp <= 0) {
    if (attacker?.isBoss) return { type: 'boss', bossId: attacker.id, subtype: 'hp' };
    return { type: 'hp', killerId: attacker?.id ?? null };
  }
  if (player.petrify >= player.hp) {
    if (attacker?.isBoss) return { type: 'boss', bossId: attacker.id, subtype: 'petrify' };
    return { type: 'petrify', source: player.lastPetrifySource ?? { type: 'unknown', id: null } };
  }
  return null;
}
