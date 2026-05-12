// ── RunManager.js ─────────────────────────────────────────────────────────────
// Run-level flow: start, save, load, and room navigation.
//
// Exports:
//   saveRun() — persists GameState to localStorage
//   loadRun() → true if a save was found and restored
//   clearSave() — deletes the localStorage save
//   startRun(charId) — initialises a new run for the given character
//
// Room navigation is handled by the router / screen layer (MapScreen → CombatScreen etc.)
// This file only manages persistence and top-level run initialisation.
// ─────────────────────────────────────────────────────────────────────────────

import { GameState } from './GameState.js';

const SAVE_KEY = 'petr-rogue-save';

export function saveRun() {
  try {
    const data = {
      player: GameState.player,
      map: { ...GameState.map, visitedNodes: [...GameState.map.visitedNodes] },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {}
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
