// Pure effect primitives — the only file allowed to mutate entity HP/block/petrify directly

// Returns the amount of unblocked damage dealt
export function applyDamage(target, amount, attacker = null) {
  let actual = amount;
  if (attacker?.statusEffects?.weak > 0)       actual = Math.floor(actual * 0.75);
  if (attacker?._strength > 0)                 actual += attacker._strength;
  if (target.statusEffects?.vulnerable > 0)    actual = Math.floor(actual * 1.5);

  const absorbed  = Math.min(target.block || 0, actual);
  target.block    = Math.max(0, (target.block || 0) - actual);
  const unblocked = actual - absorbed;
  target.hp      -= unblocked;

  if (unblocked > 0 && (target.statusEffects?.calcified ?? 0) > 0) {
    gainPetrify(target, unblocked);
  }

  return unblocked;
}

export function applyBlock(entity, amount) {
  entity.block = (entity.block || 0) + amount;
}

// Stone Coat intercepts Petrify gain and converts stacks to Block first
export function gainPetrify(player, amount, source = null) {
  let remaining = amount + (source?._petrifyPower ?? 0);
  // Attuned: amplify all Petrify gain (self or enemy sourced)
  if (remaining > 0 && (player.statusEffects?.attuned ?? 0) > 0) {
    remaining += player.statusEffects.attuned;
  }
  const coat = player.statusEffects?.stoneCoat ?? 0;
  if (remaining > 0 && coat > 0) {
    const absorbed = Math.min(coat, remaining);
    player.statusEffects.stoneCoat -= absorbed;
    player.block = (player.block || 0) + absorbed;
    remaining -= absorbed;
  }
  player.petrify = (player.petrify || 0) + remaining;
}

export function reducePetrify(player, amount) {
  if ((player.statusEffects?.anchored ?? 0) > 0) return;
  player.petrify = Math.max(0, (player.petrify || 0) - amount);
}

export function healPlayer(player, amount) {
  player.hp = Math.min(player.maxHp, player.hp + amount);
}
