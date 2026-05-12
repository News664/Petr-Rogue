// ── RelicSystem.js ────────────────────────────────────────────────────────────
// Relic hook dispatch — iterates player's active relics and calls the named hook.
//
// Exports:
//   triggerRelics(hookName, state, payload?) — fires hook on all equipped relics
//
// hookName values: 'onCombatStart' | 'onTurnStart' | 'onTurnEnd' | 'onCardPlayed'
// Relics stored in state.player.relics[].
// ─────────────────────────────────────────────────────────────────────────────

export function triggerRelics(hookName, state, payload = {}) {
  for (const relic of (state.player?.relics ?? [])) {
    if (relic.hooks?.[hookName]) {
      relic.hooks[hookName](state, payload);
    }
  }
}
