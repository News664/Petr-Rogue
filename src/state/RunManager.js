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
