import { reducePetrify, applyBlock } from '../systems/Effects.js';

export const relicDefs = {
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
    description: 'Start each combat with 4 extra Block.',
    hooks: {
      onCombatStart(state) { applyBlock(state.player, 4); },
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
};
