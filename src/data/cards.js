import { applyDamage, applyBlock, gainPetrify, reducePetrify } from '../systems/Effects.js';
import { applyStatus } from '../systems/StatusSystem.js';
import { drawCards } from '../systems/DeckSystem.js';

// ── Card definitions ─────────────────────────────────────────────────────────

export const cardDefs = {

  // ── Starter / shared basic ────────────────────────────────────────────────

  strike: {
    id: 'strike', name: 'Strike', cost: 1, type: 'attack', targetType: 'enemy', rarity: 'basic',
    description: 'Deal 6 damage.',
    effect(state, target) { applyDamage(target, 6, state.player); },
    upgrade: { name: 'Strike+', description: 'Deal 9 damage.',
      effect(state, target) { applyDamage(target, 9, state.player); } },
  },
  defend: {
    id: 'defend', name: 'Defend', cost: 1, type: 'skill', targetType: 'none', rarity: 'basic',
    description: 'Gain 5 Block.',
    effect(state) { applyBlock(state.player, 5); },
    upgrade: { name: 'Defend+', description: 'Gain 8 Block.',
      effect(state) { applyBlock(state.player, 8); } },
  },

  // ── Shared reward pool ────────────────────────────────────────────────────

  bash: {
    id: 'bash', name: 'Bash', cost: 2, type: 'attack', targetType: 'enemy', rarity: 'common', colorless: true,
    description: 'Deal 10 damage.',
    effect(state, target) { applyDamage(target, 10, state.player); },
    upgrade: { name: 'Bash+', description: 'Deal 14 damage.',
      effect(state, target) { applyDamage(target, 14, state.player); } },
  },
  stone_strike: {
    id: 'stone_strike', name: 'Stone Strike', cost: 1, type: 'attack', targetType: 'enemy', rarity: 'common', colorless: true,
    description: 'Deal 8 damage. Gain 3 Petrify.',
    effect(state, target) { applyDamage(target, 8, state.player); gainPetrify(state.player, 3); },
    upgrade: { name: 'Stone Strike+', description: 'Deal 12 damage. Gain 2 Petrify.',
      effect(state, target) { applyDamage(target, 12, state.player); gainPetrify(state.player, 2); } },
  },
  shatter: {
    id: 'shatter', name: 'Shatter', cost: 2, type: 'attack', targetType: 'enemy', rarity: 'uncommon', colorless: true,
    description: 'Deal damage equal to your Petrify. Halve your Petrify.',
    effect(state, target) {
      applyDamage(target, state.player.petrify, state.player);
      reducePetrify(state.player, Math.floor(state.player.petrify / 2));
    },
    upgrade: { name: 'Shatter+', description: 'Deal damage equal to your Petrify. Reduce Petrify by 60%.',
      effect(state, target) {
        applyDamage(target, state.player.petrify, state.player);
        reducePetrify(state.player, Math.floor(state.player.petrify * 0.6));
      } },
  },
  petrify_surge: {
    id: 'petrify_surge', name: 'Petrify Surge', cost: 2, type: 'attack', targetType: 'enemy', rarity: 'rare', colorless: true,
    description: 'Deal 2× your Petrify as damage. Gain 5 Petrify.',
    effect(state, target) {
      applyDamage(target, state.player.petrify * 2, state.player);
      gainPetrify(state.player, 5);
    },
    upgrade: { name: 'Petrify Surge+', description: 'Deal 3× your Petrify as damage. Gain 4 Petrify.',
      effect(state, target) {
        applyDamage(target, state.player.petrify * 3, state.player);
        gainPetrify(state.player, 4);
      } },
  },
  gravel_shot: {
    id: 'gravel_shot', name: 'Gravel Shot', cost: 1, type: 'attack', targetType: 'enemy', rarity: 'common', colorless: true,
    description: 'Deal 5 damage. If Petrify ≥ 15, deal 10 damage instead.',
    effect(state, target) { applyDamage(target, state.player.petrify >= 15 ? 10 : 5, state.player); },
    upgrade: { name: 'Gravel Shot+', description: 'Deal 8 damage. If Petrify ≥ 15, deal 15 instead.',
      effect(state, target) { applyDamage(target, state.player.petrify >= 15 ? 15 : 8, state.player); } },
  },
  stone_skin: {
    id: 'stone_skin', name: 'Stone Skin', cost: 1, type: 'skill', targetType: 'none', rarity: 'common', colorless: true,
    description: 'Gain 5 Block. If Petrify ≥ 20, gain 12 Block instead.',
    effect(state) { applyBlock(state.player, state.player.petrify >= 20 ? 12 : 5); },
    upgrade: { name: 'Stone Skin+', description: 'Gain 7 Block. If Petrify ≥ 20, gain 16 Block instead.',
      effect(state) { applyBlock(state.player, state.player.petrify >= 20 ? 16 : 7); } },
  },
  calcify: {
    id: 'calcify', name: 'Calcify', cost: 0, type: 'skill', targetType: 'none', rarity: 'common', colorless: true,
    description: 'Gain 3 Petrify. Draw 2 cards.',
    effect(state) { gainPetrify(state.player, 3); drawCards(state.combat.deckState, 2); },
    upgrade: { name: 'Calcify+', description: 'Gain 3 Petrify. Draw 3 cards.',
      effect(state) { gainPetrify(state.player, 3); drawCards(state.combat.deckState, 3); } },
  },
  purify: {
    id: 'purify', name: 'Purify', cost: 2, type: 'skill', targetType: 'none', rarity: 'uncommon', colorless: true,
    description: 'Reduce Petrify by 10.',
    effect(state) { reducePetrify(state.player, 10); },
    upgrade: { name: 'Purify+', description: 'Reduce Petrify by 15.',
      effect(state) { reducePetrify(state.player, 15); } },
  },
  fortify: {
    id: 'fortify', name: 'Fortify', cost: 1, type: 'skill', targetType: 'none', rarity: 'common', colorless: true,
    description: 'Gain 8 Block.',
    effect(state) { applyBlock(state.player, 8); },
    upgrade: { name: 'Fortify+', description: 'Gain 11 Block.',
      effect(state) { applyBlock(state.player, 11); } },
  },
  stone_will: {
    id: 'stone_will', name: 'Stone Will', cost: 1, type: 'skill', targetType: 'none', rarity: 'common', colorless: true,
    description: 'Reduce Petrify by 5. Gain 4 Block.',
    effect(state) { reducePetrify(state.player, 5); applyBlock(state.player, 4); },
    upgrade: { name: 'Stone Will+', description: 'Reduce Petrify by 7. Gain 6 Block.',
      effect(state) { reducePetrify(state.player, 7); applyBlock(state.player, 6); } },
  },
  controlled_calcify: {
    id: 'controlled_calcify', name: 'Controlled Calcify', cost: 1, type: 'skill', targetType: 'none', rarity: 'uncommon', colorless: true,
    description: 'Gain 6 Petrify. Gain Block equal to amount gained.',
    effect(state) { gainPetrify(state.player, 6); applyBlock(state.player, 6); },
    upgrade: { name: 'Controlled Calcify+', description: 'Gain 9 Petrify. Gain Block equal to amount gained.',
      effect(state) { gainPetrify(state.player, 9); applyBlock(state.player, 9); } },
  },

  // ── Mint unique ───────────────────────────────────────────────────────────

  purifying_touch: {
    id: 'purifying_touch', name: 'Purifying Touch', cost: 1, type: 'attack', targetType: 'enemy', rarity: 'common',
    description: 'Deal 5 damage. Reduce Petrify by 3.',
    effect(state, target) { applyDamage(target, 5, state.player); reducePetrify(state.player, 3); },
    upgrade: { name: 'Purifying Touch+', description: 'Deal 7 damage. Reduce Petrify by 4.',
      effect(state, target) { applyDamage(target, 7, state.player); reducePetrify(state.player, 4); } },
  },
  holy_light: {
    id: 'holy_light', name: 'Holy Light', cost: 1, type: 'skill', targetType: 'none', rarity: 'common',
    description: 'Gain 6 Block. Draw 1 card.',
    effect(state) { applyBlock(state.player, 6); drawCards(state.combat.deckState, 1); },
    upgrade: { name: 'Holy Light+', description: 'Gain 9 Block. Draw 1 card.',
      effect(state) { applyBlock(state.player, 9); drawCards(state.combat.deckState, 1); } },
  },
  petrify_ward: {
    id: 'petrify_ward', name: 'Petrify Ward', cost: 0, type: 'skill', targetType: 'none', rarity: 'common',
    description: 'Reduce Petrify by 2. Draw 1 card.',
    effect(state) { reducePetrify(state.player, 2); drawCards(state.combat.deckState, 1); },
    upgrade: { name: 'Petrify Ward+', description: 'Reduce Petrify by 3. Draw 2 cards.',
      effect(state) { reducePetrify(state.player, 3); drawCards(state.combat.deckState, 2); } },
  },
  sanctify: {
    id: 'sanctify', name: 'Sanctify', cost: 1, type: 'skill', targetType: 'none', rarity: 'common',
    description: 'Exhaust all Status and Curse cards in your hand. Gain 2 Block per card exhausted.',
    effect(state) {
      const { hand, exhaust } = state.combat.deckState;
      let n = 0;
      for (let i = hand.length - 1; i >= 0; i--) {
        if (hand[i].isStatus || hand[i].isCurse) { exhaust.push(hand.splice(i, 1)[0]); n++; }
      }
      if (n > 0) applyBlock(state.player, n * 2);
    },
    upgrade: { name: 'Sanctify+', description: 'Exhaust all Status and Curse cards in hand. Gain 3 Block per card exhausted.',
      effect(state) {
        const { hand, exhaust } = state.combat.deckState;
        let n = 0;
        for (let i = hand.length - 1; i >= 0; i--) {
          if (hand[i].isStatus || hand[i].isCurse) { exhaust.push(hand.splice(i, 1)[0]); n++; }
        }
        if (n > 0) applyBlock(state.player, n * 3);
      } },
  },
  consecrate: {
    id: 'consecrate', name: 'Consecrate', cost: 1, type: 'skill', targetType: 'none', rarity: 'common',
    description: 'Apply Weak 2 to all enemies.',
    effect(state) {
      for (const e of state.combat.enemies) if (e.hp > 0) applyStatus(e, 'weak', 2);
    },
    upgrade: { name: 'Consecrate+', description: 'Apply Weak 3 to all enemies.',
      effect(state) {
        for (const e of state.combat.enemies) if (e.hp > 0) applyStatus(e, 'weak', 3);
      } },
  },
  stone_coat: {
    id: 'stone_coat', name: 'Stone Coat', cost: 1, type: 'skill', targetType: 'none', rarity: 'uncommon',
    description: 'Next 8 Petrify you would gain becomes Block instead.',
    effect(state) { applyStatus(state.player, 'stoneCoat', 8); },
    upgrade: { name: 'Stone Coat+', description: 'Next 14 Petrify you would gain becomes Block instead.',
      effect(state) { applyStatus(state.player, 'stoneCoat', 14); } },
  },
  holy_surge: {
    id: 'holy_surge', name: 'Holy Surge', cost: 2, type: 'attack', targetType: 'enemy', rarity: 'uncommon',
    description: 'Reduce Petrify by 6. Deal 6 + the amount reduced as damage.',
    effect(state, target) {
      const before = state.player.petrify;
      reducePetrify(state.player, 6);
      applyDamage(target, 6 + (before - state.player.petrify), state.player);
    },
    upgrade: { name: 'Holy Surge+', description: 'Reduce Petrify by 9. Deal 6 + the amount reduced.',
      effect(state, target) {
        const before = state.player.petrify;
        reducePetrify(state.player, 9);
        applyDamage(target, 6 + (before - state.player.petrify), state.player);
      } },
  },
  purifying_nova: {
    id: 'purifying_nova', name: 'Purifying Nova', cost: 2, type: 'attack', targetType: 'none', rarity: 'rare',
    description: 'Reduce Petrify by 8. Deal that damage to ALL enemies.',
    effect(state) {
      const before = state.player.petrify;
      reducePetrify(state.player, 8);
      const dmg = before - state.player.petrify;
      for (const e of state.combat.enemies) if (e.hp > 0) applyDamage(e, dmg, state.player);
    },
    upgrade: { name: 'Purifying Nova+', description: 'Reduce Petrify by 11. Deal that to ALL enemies.',
      effect(state) {
        const before = state.player.petrify;
        reducePetrify(state.player, 11);
        const dmg = before - state.player.petrify;
        for (const e of state.combat.enemies) if (e.hp > 0) applyDamage(e, dmg, state.player);
      } },
  },
  sacred_ground: {
    id: 'sacred_ground', name: 'Sacred Ground', cost: 2, type: 'power', targetType: 'none', rarity: 'rare', exhaust: true,
    description: 'When you play a Skill, deal 3 dmg to all enemies.',
    effect(state) {
      state.combat.activePowers.push({
        name: 'Sacred Ground',
        hooks: {
          onCardPlayed(s, { card }) {
            if (card.type === 'skill') {
              for (const e of s.combat.enemies) if (e.hp > 0) applyDamage(e, 3, s.player);
            }
          },
        },
      });
    },
    upgrade: { name: 'Sacred Ground+',
      description: 'When you play a Skill, deal 5 dmg to all enemies.',
      effect(state) {
        state.combat.activePowers.push({
          name: 'Sacred Ground+',
          hooks: {
            onCardPlayed(s, { card }) {
              if (card.type === 'skill') {
                for (const e of s.combat.enemies) if (e.hp > 0) applyDamage(e, 5, s.player);
              }
            },
          },
        });
      } },
  },

  // ── Status cards (temporary — added mid-combat, never persist to player deck) ──

  stone_shard: {
    id: 'stone_shard', name: 'Stone Shard', cost: 0, type: 'status', targetType: 'none',
    rarity: 'status', isStatus: true, ethereal: true, unplayable: true,
    description: 'Unplayable. Ethereal.',
    effect() {},
    upgrade: null,
  },
  numbing_mist: {
    id: 'numbing_mist', name: 'Numbing Mist', cost: 0, type: 'status', targetType: 'none',
    rarity: 'status', isStatus: true, ethereal: true,
    description: 'Gain 2 Petrify. Ethereal.',
    effect(state) { gainPetrify(state.player, 2); },
    upgrade: null,
  },

  // ── Curse cards (permanent — added to player deck, persist after combat) ──

  fossil_burden: {
    id: 'fossil_burden', name: 'Fossil Burden', cost: 0, type: 'curse', targetType: 'none',
    rarity: 'curse', isCurse: true, unplayable: true,
    description: 'Unplayable. At the start of each combat, gain 2 Petrify.',
    onCombatStart(state) { gainPetrify(state.player, 2); },
    effect() {},
    upgrade: null,
  },
  petrifying_presence: {
    id: 'petrifying_presence', name: 'Petrifying Presence', cost: 1, type: 'curse', targetType: 'none',
    rarity: 'curse', isCurse: true,
    description: 'Gain 4 Petrify.',
    effect(state) { gainPetrify(state.player, 4); },
    upgrade: null,
  },
};

export function makeCard(id) {
  const def = cardDefs[id];
  if (!def) throw new Error(`Unknown card id: ${id}`);
  return { ...def, isUpgraded: false };
}

export function starterDeck() {
  return ['strike', 'strike', 'strike', 'strike', 'strike',
          'defend', 'defend', 'defend', 'defend', 'defend'].map(makeCard);
}

// Generic reward pool (used as fallback if no character card pool is set)
export const rewardPool = [
  'bash', 'stone_skin', 'shatter', 'gravel_shot',
  'purify', 'fortify', 'stone_will', 'controlled_calcify',
];
