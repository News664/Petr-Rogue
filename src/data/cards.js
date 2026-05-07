import { applyDamage, applyBlock, gainPetrify, reducePetrify } from '../systems/Effects.js';
import { drawCards } from '../systems/DeckSystem.js';

// ── Card definitions ────────────────────────────────────────────────────────
// effect(state, target) — target is an enemy object or null for self-targeting cards

export const cardDefs = {
  // Starter cards
  strike: {
    id: 'strike', name: 'Strike', cost: 1, type: 'attack', targetType: 'enemy',
    description: 'Deal 6 damage.',
    effect(state, target) { applyDamage(target, 6); },
  },
  defend: {
    id: 'defend', name: 'Defend', cost: 1, type: 'skill', targetType: 'none',
    description: 'Gain 5 Block.',
    effect(state) { applyBlock(state.player, 5); },
  },

  // Common attack cards
  bash: {
    id: 'bash', name: 'Bash', cost: 2, type: 'attack', targetType: 'enemy',
    description: 'Deal 10 damage.',
    effect(state, target) { applyDamage(target, 10); },
  },
  stone_strike: {
    id: 'stone_strike', name: 'Stone Strike', cost: 1, type: 'attack', targetType: 'enemy',
    description: 'Deal 8 damage. Gain 3 Petrify.',
    effect(state, target) {
      applyDamage(target, 8);
      gainPetrify(state.player, 3);
    },
  },
  shatter: {
    id: 'shatter', name: 'Shatter', cost: 2, type: 'attack', targetType: 'enemy',
    description: 'Deal damage equal to your Petrify. Halve your Petrify.',
    effect(state, target) {
      applyDamage(target, state.player.petrify);
      reducePetrify(state.player, Math.floor(state.player.petrify / 2));
    },
  },
  petrify_surge: {
    id: 'petrify_surge', name: 'Petrify Surge', cost: 2, type: 'attack', targetType: 'enemy',
    description: 'Deal 2× your Petrify as damage. Gain 5 Petrify.',
    effect(state, target) {
      applyDamage(target, state.player.petrify * 2);
      gainPetrify(state.player, 5);
    },
  },
  gravel_shot: {
    id: 'gravel_shot', name: 'Gravel Shot', cost: 1, type: 'attack', targetType: 'enemy',
    description: 'Deal 5 damage. If Petrify ≥ 15, deal 5 more.',
    effect(state, target) {
      applyDamage(target, state.player.petrify >= 15 ? 10 : 5);
    },
  },

  // Common skill cards
  stone_skin: {
    id: 'stone_skin', name: 'Stone Skin', cost: 1, type: 'skill', targetType: 'none',
    description: 'Gain 5 Block. If Petrify ≥ 20, gain 12 Block instead.',
    effect(state) {
      applyBlock(state.player, state.player.petrify >= 20 ? 12 : 5);
    },
  },
  calcify: {
    id: 'calcify', name: 'Calcify', cost: 0, type: 'skill', targetType: 'none',
    description: 'Gain 3 Petrify. Draw 2 cards.',
    effect(state) {
      gainPetrify(state.player, 3);
      drawCards(state.combat.deckState, 2);
    },
  },
  purify: {
    id: 'purify', name: 'Purify', cost: 2, type: 'skill', targetType: 'none',
    description: 'Reduce Petrify by 10.',
    effect(state) { reducePetrify(state.player, 10); },
  },
  fortify: {
    id: 'fortify', name: 'Fortify', cost: 1, type: 'skill', targetType: 'none',
    description: 'Gain 8 Block.',
    effect(state) { applyBlock(state.player, 8); },
  },
  stone_will: {
    id: 'stone_will', name: 'Stone Will', cost: 1, type: 'skill', targetType: 'none',
    description: 'Reduce Petrify by 5. Gain 4 Block.',
    effect(state) {
      reducePetrify(state.player, 5);
      applyBlock(state.player, 4);
    },
  },
  controlled_calcify: {
    id: 'controlled_calcify', name: 'Controlled Calcify', cost: 1, type: 'skill', targetType: 'none',
    description: 'Gain 6 Petrify. Gain Block equal to Petrify gained.',
    effect(state) {
      gainPetrify(state.player, 6);
      applyBlock(state.player, 6);
    },
  },
};

export function makeCard(id) {
  const def = cardDefs[id];
  if (!def) throw new Error(`Unknown card id: ${id}`);
  return { ...def };
}

export function starterDeck() {
  return [
    'strike', 'strike', 'strike', 'strike', 'strike',
    'defend', 'defend', 'defend', 'defend', 'defend',
  ].map(makeCard);
}

// Pool of cards that can appear as rewards or in the shop
export const rewardPool = [
  'bash', 'stone_strike', 'stone_skin', 'shatter', 'calcify',
  'purify', 'petrify_surge', 'gravel_shot', 'fortify', 'stone_will',
  'controlled_calcify',
];
