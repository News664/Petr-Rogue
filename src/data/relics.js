import { reducePetrify, applyBlock, gainPetrify } from '../systems/Effects.js';
import { applyStatus } from '../systems/StatusSystem.js';

export const relicDefs = {
  // ── Mint's starting relic ────────────────────────────────────────────────
  stone_veil: {
    id: 'stone_veil',
    name: 'Stone Veil',
    description: 'At the start of each combat, gain Stone Coat 4 (next 4 Petrify you would gain becomes Block instead).',
    hooks: {
      onCombatStart(state) { applyStatus(state.player, 'stoneCoat', 4); },
    },
  },

  // ── Drop pool ─────────────────────────────────────────────────────────────
  stone_heart: {
    id: 'stone_heart',
    name: 'Stone Heart',
    description: 'At the start of each combat, reduce Petrify by 3.',
    hooks: {
      onCombatStart(state) { reducePetrify(state.player, 3); },
    },
  },
  gravel_charm: {
    id: 'gravel_charm',
    name: 'Gravel Charm',
    description: 'Start each combat with 6 extra Block.',
    hooks: {
      onCombatStart(state) { applyBlock(state.player, 6); },
    },
  },
  obsidian_cap: {
    id: 'obsidian_cap',
    name: 'Obsidian Cap',
    description: 'Your Petrify cannot exceed 50.',
    hooks: {
      onTurnStart(state) {
        if (state.player.petrify > 50) state.player.petrify = 50;
      },
    },
  },
  cracked_geode: {
    id: 'cracked_geode',
    name: 'Cracked Geode',
    description: 'At the start of your turn, gain 1 Block per 5 Petrify (max 10).',
    hooks: {
      onTurnStart(state) {
        const bonus = Math.min(10, Math.floor(state.player.petrify / 5));
        if (bonus > 0) applyBlock(state.player, bonus);
      },
    },
  },
  smooth_stone: {
    id: 'smooth_stone',
    name: 'Smooth Stone',
    description: 'At the start of each turn, gain 2 Block.',
    hooks: {
      onTurnStart(state) { applyBlock(state.player, 2); },
    },
  },
  saints_tear: {
    id: 'saints_tear',
    name: "Saint's Tear",
    description: 'At the start of each combat, heal 6 HP.',
    hooks: {
      onCombatStart(state) {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 6);
      },
    },
  },
  brittle_core: {
    id: 'brittle_core',
    name: 'Brittle Core',
    description: 'Gain 1 extra Energy each turn. At the start of each combat, gain Numbing 2.',
    hooks: {
      onCombatStart(state) { applyStatus(state.player, 'numbing', 2); },
      onTurnStart(state)   { state.combat.energy += 1; },
    },
  },
};

// Relics available as drops (not starting relics)
export const relicDropPool = [
  'stone_heart', 'gravel_charm', 'obsidian_cap',
  'cracked_geode', 'smooth_stone', 'saints_tear', 'brittle_core',
];

export function makeRelic(id) {
  const def = relicDefs[id];
  if (!def) throw new Error(`Unknown relic id: ${id}`);
  return { ...def };
}
