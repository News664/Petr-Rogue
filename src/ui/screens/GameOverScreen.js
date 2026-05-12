// ── GameOverScreen.js ─────────────────────────────────────────────────────────
// Game-over screen navigated to when the player dies outside of combat
// (e.g. during an event). Reads cause from route params and renders the
// same death slideshow as CombatScreen.
//
// Exports:
//   GameOverScreen — screen object with init(el, params) and teardown()
// ─────────────────────────────────────────────────────────────────────────────

import { GameState } from '../../state/GameState.js';
import { resolveDeathScreen } from '../../data/deathMessages.js';
import { renderDeathSlideshow } from '../components/DeathSlideshow.js';

export const GameOverScreen = {
  init(el, { cause }) {
    const charId = GameState.player?.characterId ?? null;
    const { key, title, body, frames } = resolveDeathScreen(cause, charId);

    const map        = GameState.map;
    const act        = map ? Math.floor(map.currentFloor / 10) + 1 : 1;
    const floorInAct = map ? (map.currentFloor % 10) + 1 : 1;
    const enemies    = GameState.enemiesDefeated ?? 0;
    const relics     = GameState.player?.relics?.length ?? 0;
    const gold       = GameState.player?.gold ?? 0;

    renderDeathSlideshow(el, {
      key, charId, title, body, frames,
      stats: { act, floor: floorInAct, enemies, relics, gold },
      onExit: () => location.reload(),
    });
  },
  teardown() {},
};
