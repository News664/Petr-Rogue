// ── GameState.js ──────────────────────────────────────────────────────────────
// Global singleton — the single mutable run state passed by reference to all systems.
//
// Exports:
//   GameState — object with fields: player, map, combat, floor, seenEvents, enemiesDefeated, gold
//
// All systems receive `state` (this object) as their first argument.
// Reset between runs via GameState.reset() or by re-assigning fields directly.
// ─────────────────────────────────────────────────────────────────────────────
export const GameState = {
  player: null,
  map: null,
  combat: null,
};
