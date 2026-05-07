// Pure effect primitives — no imports from other game modules

export function applyDamage(target, amount) {
  const absorbed = Math.min(target.block || 0, amount);
  target.block = Math.max(0, (target.block || 0) - amount);
  target.hp -= amount - absorbed;
}

export function applyBlock(entity, amount) {
  entity.block = (entity.block || 0) + amount;
}

// Petrify bypasses block entirely
export function gainPetrify(player, amount) {
  player.petrify = (player.petrify || 0) + amount;
}

export function reducePetrify(player, amount) {
  player.petrify = Math.max(0, (player.petrify || 0) - amount);
}

export function healPlayer(player, amount) {
  player.hp = Math.min(player.maxHp, player.hp + amount);
}
