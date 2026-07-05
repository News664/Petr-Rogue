// ── cards.js ──────────────────────────────────────────────────────────────────
// All card definitions for every character and the colorless pool.
//
// Exports:
//   cardDefs  — object keyed by card ID; each entry is the base card definition
//   makeCard(id) → card instance (spread of def + isUpgraded:false)
//   starterDeck() → default 10-card array (unused when character select is active)
//   rewardPool[] — fallback reward card IDs (override by character.cardPool)
//
// Card object shape:
//   { id, name, cost, type, targetType, rarity,
//     description, shortDescription,
//     effect(state, target), upgrade, exhaust?,
//     isStatus?, isCurse?, unplayable? }
//
// type: 'attack' | 'skill' | 'power' | 'status' | 'curse'
// targetType: 'enemy' | 'none'
// rarity: 'common' | 'uncommon' | 'rare' | 'special'
// upgrade: null | { name?, description?, shortDescription?, effect?, cost? }
//   — applied in-place by RewardSystem.upgradeCard()
//
// Character card pools:
//   Mint unique: purifying_touch, holy_light, petrify_ward, consecrate, sanctify,
//                stone_coat, holy_surge, purifying_nova, sacred_ground
//   Tharja unique: stone_fang, fracture, petrify_lash, petrify_mantle, void_release,
//                  void_crack, overload, stone_pact, stone_bastion, petrify_shroud
//   Opal unique: ore_strike, crystallize, facet_strike, geode_ward, splinter,
//                shatter_burst, prismatic_core, mother_lode, grand_geode, cataclysm
//   Galatea unique: composure, brace, chisel, unyielding, set_in_stone, monument,
//                   pedestal, weight_of_ages, living_marble, awakening
//   Colorless: bash, gravel_shot, stone_skin, shatter, petrify_surge, purify,
//              fortify, stone_will, controlled_calcify, stone_channel
//   Status/curse (unplayable): stasis, torpor, stone_debt, stone_shard, crystal_sliver
//
// Custom resources (stored on player, reset each combat by startCombat):
//   player.geodes — Opal: crystallized Petrify; spent/scaled by her cards.
//     gainGeodes(state, n) respects combat._geodeBonus (Grand Geode).
//   player.poise  — Galatea: focus; spent by attacks for scaling.
//     gainPoise(state, n) respects combat._poiseBlock (Living Marble).
//
// Harden keyword (Galatea): a `retained` card whose main number rises each turn
//   it stays unplayed. Implemented via onRetain (bumps this._harden, returns false
//   to stay in hand) + onCombatStart (resets this._harden). effect() reads
//   this._harden. upgradeCard copies onRetain/onCombatStart so upgrades work.
// ─────────────────────────────────────────────────────────────────────────────

import { applyDamage, applyBlock, gainPetrify, reducePetrify, healPlayer } from '../systems/Effects.js';
import { applyStatus } from '../systems/StatusSystem.js';
import { drawCards } from '../systems/DeckSystem.js';

// ── Custom resource helpers ────────────────────────────────────────────────
// Geodes (Opal) and Poise (Galatea) live on the player and reset each combat.

function gainGeodes(state, n) {
  if (n <= 0) { state.player.geodes = Math.max(0, (state.player.geodes ?? 0) + n); return; }
  const bonus = state.combat?._geodeBonus ?? 0; // Grand Geode
  state.player.geodes = (state.player.geodes ?? 0) + n + bonus;
}
function spendAllGeodes(state) {
  const g = state.player.geodes ?? 0;
  state.player.geodes = 0;
  return g;
}
function gainPoise(state, n) {
  state.player.poise = Math.max(0, (state.player.poise ?? 0) + n);
  if (n > 0) {
    const per = state.combat?._poiseBlock ?? 0; // Living Marble
    if (per > 0) applyBlock(state.player, per * n);
  }
}

// ── Card definitions ─────────────────────────────────────────────────────────────────────

export const cardDefs = {

  // ── Starter / shared basic ────────────────────────────────────────────

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

  // ── Shared reward pool ────────────────────────────────────────────────

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
    shortDescription: 'Deal Petrify as dmg. Halve Petrify.',
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
    shortDescription: 'Deal 5 dmg (10 if Petrify ≥ 15).',
    effect(state, target) { applyDamage(target, state.player.petrify >= 15 ? 10 : 5, state.player); },
    upgrade: { name: 'Gravel Shot+', description: 'Deal 8 damage. If Petrify ≥ 15, deal 15 instead.',
      effect(state, target) { applyDamage(target, state.player.petrify >= 15 ? 15 : 8, state.player); } },
  },
  stone_skin: {
    id: 'stone_skin', name: 'Stone Skin', cost: 1, type: 'skill', targetType: 'none', rarity: 'common', colorless: true,
    description: 'Gain 5 Block. If Petrify ≥ 20, gain 12 Block instead.',
    shortDescription: 'Gain 5 Block (12 if Petrify ≥ 20).',
    effect(state) { applyBlock(state.player, state.player.petrify >= 20 ? 12 : 5); },
    upgrade: { name: 'Stone Skin+', description: 'Gain 7 Block. If Petrify ≥ 20, gain 16 Block instead.',
      effect(state) { applyBlock(state.player, state.player.petrify >= 20 ? 16 : 7); } },
  },
  stone_channel: {
    id: 'stone_channel', name: 'Stone Channel', cost: 0, type: 'skill', targetType: 'none', rarity: 'common', colorless: true,
    description: 'Gain 3 Petrify. Draw 2 cards.',
    effect(state) { gainPetrify(state.player, 3); drawCards(state.combat.deckState, 2, state); },
    upgrade: { name: 'Stone Channel+', description: 'Gain 3 Petrify. Draw 3 cards.',
      effect(state) { gainPetrify(state.player, 3); drawCards(state.combat.deckState, 3, state); } },
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
    shortDescription: 'Gain 6 Petrify + equal Block.',
    effect(state) { gainPetrify(state.player, 6); applyBlock(state.player, 6); },
    upgrade: { name: 'Controlled Calcify+', description: 'Gain 9 Petrify. Gain Block equal to amount gained.',
      effect(state) { gainPetrify(state.player, 9); applyBlock(state.player, 9); } },
  },

  // ── Mint unique ────────────────────────────────────────────────────────────────────

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
    effect(state) { applyBlock(state.player, 6); drawCards(state.combat.deckState, 1, state); },
    upgrade: { name: 'Holy Light+', description: 'Gain 9 Block. Draw 1 card.',
      effect(state) { applyBlock(state.player, 9); drawCards(state.combat.deckState, 1, state); } },
  },
  petrify_ward: {
    id: 'petrify_ward', name: 'Petrify Ward', cost: 0, type: 'skill', targetType: 'none', rarity: 'common',
    description: 'Reduce Petrify by 2. Draw 1 card.',
    effect(state) { reducePetrify(state.player, 2); drawCards(state.combat.deckState, 1, state); },
    upgrade: { name: 'Petrify Ward+', description: 'Reduce Petrify by 3. Draw 2 cards.',
      effect(state) { reducePetrify(state.player, 3); drawCards(state.combat.deckState, 2, state); } },
  },
  sanctify: {
    id: 'sanctify', name: 'Sanctify', cost: 1, type: 'skill', targetType: 'none', rarity: 'common',
    description: 'Exhaust all Status and Curse cards in your hand. Gain 2 Block per card exhausted.',
    shortDescription: 'Exhaust Status & Curses. +2 Block each.',
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
    shortDescription: 'Next 8 Petrify → Block instead.',
    effect(state) { applyStatus(state.player, 'stoneCoat', 8); },
    upgrade: { name: 'Stone Coat+', description: 'Next 14 Petrify you would gain becomes Block instead.',
      effect(state) { applyStatus(state.player, 'stoneCoat', 14); } },
  },
  holy_surge: {
    id: 'holy_surge', name: 'Holy Surge', cost: 2, type: 'attack', targetType: 'enemy', rarity: 'uncommon',
    description: 'Reduce Petrify by 6. Deal 6 + the amount reduced as damage.',
    shortDescription: 'Lose 6 Petrify. Deal 6 + reduction.',
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
    shortDescription: 'Lose 8 Petrify. Deal that to all.',
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

  // ── Tharja unique ──────────────────────────────────────────────────────────────────

  stone_fang: {
    id: 'stone_fang', name: 'Stone Fang', cost: 1, type: 'attack', targetType: 'enemy', rarity: 'common',
    description: 'Deal 6 damage. Gain 6 Petrify. Heal 2 HP.',
    effect(state, target) { applyDamage(target, 6, state.player); gainPetrify(state.player, 6); healPlayer(state.player, 2); },
    upgrade: { name: 'Stone Fang+', description: 'Deal 8 damage. Gain 8 Petrify. Heal 3 HP.',
      effect(state, target) { applyDamage(target, 8, state.player); gainPetrify(state.player, 8); healPlayer(state.player, 3); } },
  },
  fracture: {
    id: 'fracture', name: 'Fracture', cost: 1, type: 'attack', targetType: 'enemy', rarity: 'common',
    description: 'Deal 8 damage. Apply Vulnerable 1. Gain 2 Petrify.',
    effect(state, target) { applyDamage(target, 8, state.player); applyStatus(target, 'vulnerable', 1); gainPetrify(state.player, 2); },
    upgrade: { name: 'Fracture+', description: 'Deal 11 damage. Apply Vulnerable 2. Gain 2 Petrify.',
      effect(state, target) { applyDamage(target, 11, state.player); applyStatus(target, 'vulnerable', 2); gainPetrify(state.player, 2); } },
  },
  petrify_lash: {
    id: 'petrify_lash', name: 'Petrify Lash', cost: 1, type: 'attack', targetType: 'enemy', rarity: 'common',
    description: 'Deal 5 damage. If Petrify ≥ 50% HP, deal 15 instead.',
    shortDescription: 'Deal 5 dmg (15 if Petrify ≥ 50% HP).',
    effect(state, target) { applyDamage(target, state.player.petrify >= state.player.hp * 0.5 ? 15 : 5, state.player); },
    upgrade: { name: 'Petrify Lash+', description: 'Deal 7 damage. If Petrify ≥ 50% HP, deal 20 instead.',
      shortDescription: 'Deal 7 dmg (20 if Petrify ≥ 50% HP).',
      effect(state, target) { applyDamage(target, state.player.petrify >= state.player.hp * 0.5 ? 20 : 7, state.player); } },
  },
  petrify_mantle: {
    id: 'petrify_mantle', name: 'Petrify Mantle', cost: 1, type: 'skill', targetType: 'none', rarity: 'common',
    description: 'If Petrify < 50% HP: gain 5 Petrify, gain Block = Petrify ÷ 3 (min 5). If Petrify ≥ 50% HP: reduce Petrify by 4, gain Block = Petrify ÷ 3 (min 8).',
    shortDescription: 'Below threshold: +5 Petrify + Block. At threshold: −4 Petrify + Block.',
    effect(state) {
      if (state.player.petrify >= state.player.hp * 0.5) {
        reducePetrify(state.player, 4);
        applyBlock(state.player, Math.max(8, Math.floor(state.player.petrify / 3)));
      } else {
        gainPetrify(state.player, 5);
        applyBlock(state.player, Math.max(5, Math.floor(state.player.petrify / 3)));
      }
    },
    upgrade: { name: 'Petrify Mantle+', description: 'If Petrify < 50% HP: gain 5 Petrify, gain Block = Petrify ÷ 2 (min 7). If Petrify ≥ 50% HP: reduce Petrify by 6, gain Block = Petrify ÷ 2 (min 10).',
      shortDescription: 'Below threshold: +5 Petrify + Block. At threshold: −6 Petrify + Block.',
      effect(state) {
        if (state.player.petrify >= state.player.hp * 0.5) {
          reducePetrify(state.player, 6);
          applyBlock(state.player, Math.max(10, Math.floor(state.player.petrify / 2)));
        } else {
          gainPetrify(state.player, 5);
          applyBlock(state.player, Math.max(7, Math.floor(state.player.petrify / 2)));
        }
      } },
  },
  void_release: {
    id: 'void_release', name: 'Void Release', cost: 1, type: 'skill', targetType: 'enemy', rarity: 'common',
    description: 'Deal 5 damage. Heal 2 HP. If Petrify ≥ 50% HP, also reduce Petrify by 8.',
    shortDescription: 'Deal 5 dmg. Heal 2 HP. Reduce 8 Petrify if at threshold.',
    effect(state, target) {
      applyDamage(target, 5, state.player);
      healPlayer(state.player, 2);
      if (state.player.petrify >= state.player.hp * 0.5) reducePetrify(state.player, 8);
    },
    upgrade: { name: 'Void Release+', description: 'Deal 7 damage. Heal 3 HP. If Petrify ≥ 50% HP, also reduce Petrify by 12.',
      shortDescription: 'Deal 7 dmg. Heal 3 HP. Reduce 12 Petrify if at threshold.',
      effect(state, target) {
        applyDamage(target, 7, state.player);
        healPlayer(state.player, 3);
        if (state.player.petrify >= state.player.hp * 0.5) reducePetrify(state.player, 12);
      } },
  },
  void_crack: {
    id: 'void_crack', name: 'Void Crack', cost: 2, type: 'attack', targetType: 'enemy', rarity: 'uncommon',
    description: 'Deal 10 damage, plus 3 per 5 Petrify.',
    shortDescription: 'Deal 10 + 3 per 5 Petrify.',
    effect(state, target) { applyDamage(target, 10 + Math.floor(state.player.petrify / 5) * 3, state.player); },
    upgrade: { name: 'Void Crack+', description: 'Deal 10 damage, plus 4 per 5 Petrify.',
      shortDescription: 'Deal 10 + 4 per 5 Petrify.',
      effect(state, target) { applyDamage(target, 10 + Math.floor(state.player.petrify / 5) * 4, state.player); } },
  },
  overload: {
    id: 'overload', name: 'Overload', cost: 2, type: 'attack', targetType: 'enemy', rarity: 'uncommon',
    description: 'Deal 10 damage. If Petrify ≥ 50% HP, deal 25 instead and gain 5 Petrify.',
    shortDescription: 'Deal 10 dmg (25 + 5 Petrify if at threshold).',
    effect(state, target) {
      if (state.player.petrify >= state.player.hp * 0.5) {
        applyDamage(target, 25, state.player); gainPetrify(state.player, 5);
      } else {
        applyDamage(target, 10, state.player);
      }
    },
    upgrade: { name: 'Overload+', description: 'Deal 12 damage. If Petrify ≥ 50% HP, deal 30 instead and gain 4 Petrify.',
      shortDescription: 'Deal 12 dmg (30 + 4 Petrify if at threshold).',
      effect(state, target) {
        if (state.player.petrify >= state.player.hp * 0.5) {
          applyDamage(target, 30, state.player); gainPetrify(state.player, 4);
        } else {
          applyDamage(target, 12, state.player);
        }
      } },
  },
  stone_pact: {
    id: 'stone_pact', name: 'Stone Pact', cost: 0, type: 'skill', targetType: 'none', rarity: 'uncommon',
    description: 'If Petrify < 50% HP: gain 6 Petrify, draw 2. If Petrify ≥ 50% HP: reduce Petrify by 4, draw 1.',
    shortDescription: 'Below threshold: +6 Petrify + draw 2. At threshold: −4 Petrify + draw 1.',
    effect(state) {
      if (state.player.petrify >= state.player.hp * 0.5) {
        reducePetrify(state.player, 4);
        drawCards(state.combat.deckState, 1, state);
      } else {
        gainPetrify(state.player, 6);
        drawCards(state.combat.deckState, 2, state);
      }
    },
    upgrade: { name: 'Stone Pact+', description: 'If Petrify < 50% HP: gain 6 Petrify, draw 3. If Petrify ≥ 50% HP: reduce Petrify by 6, draw 2.',
      shortDescription: 'Below threshold: +6 Petrify + draw 3. At threshold: −6 Petrify + draw 2.',
      effect(state) {
        if (state.player.petrify >= state.player.hp * 0.5) {
          reducePetrify(state.player, 6);
          drawCards(state.combat.deckState, 2, state);
        } else {
          gainPetrify(state.player, 6);
          drawCards(state.combat.deckState, 3, state);
        }
      } },
  },
  stone_bastion: {
    id: 'stone_bastion', name: 'Stone Bastion', cost: 1, type: 'skill', targetType: 'none', rarity: 'uncommon',
    description: 'Gain 8 Block. If Petrify ≥ 50% HP, gain 16 Block and Attuned 1 instead.',
    shortDescription: '8 Block (16 Block + Attuned 1 if at threshold).',
    effect(state) {
      if (state.player.petrify >= state.player.hp * 0.5) {
        applyBlock(state.player, 16); applyStatus(state.player, 'attuned', 1);
      } else {
        applyBlock(state.player, 8);
      }
    },
    upgrade: { name: 'Stone Bastion+', description: 'Gain 10 Block. If Petrify ≥ 50% HP, gain 20 Block and Attuned 1 instead.',
      shortDescription: '10 Block (20 Block + Attuned 1 if at threshold).',
      effect(state) {
        if (state.player.petrify >= state.player.hp * 0.5) {
          applyBlock(state.player, 20); applyStatus(state.player, 'attuned', 1);
        } else {
          applyBlock(state.player, 10);
        }
      } },
  },
  petrify_shroud: {
    id: 'petrify_shroud', name: 'Petrify Shroud', cost: 2, type: 'power', targetType: 'none', rarity: 'rare',
    description: 'At the start of each turn, gain Block equal to Petrify ÷ 4 (min 2).',
    shortDescription: 'Each turn: gain Petrify÷4 Block (min 2).',
    effect(state) {
      state.combat.activePowers.push({
        name: 'Petrify Shroud',
        hooks: {
          onTurnStart(s) { applyBlock(s.player, Math.max(2, Math.floor(s.player.petrify / 4))); },
        },
      });
    },
    upgrade: { name: 'Petrify Shroud+', description: 'At the start of each turn, gain Block equal to Petrify ÷ 3 (min 3).',
      shortDescription: 'Each turn: gain Petrify÷3 Block (min 3).',
      effect(state) {
        state.combat.activePowers.push({
          name: 'Petrify Shroud+',
          hooks: {
            onTurnStart(s) { applyBlock(s.player, Math.max(3, Math.floor(s.player.petrify / 3))); },
          },
        });
      } },
  },

  // ── Status cards (temporary — added mid-combat, never persist to player deck) ──

  stone_shard: {
    id: 'stone_shard', name: 'Stone Shard', cost: 0, type: 'status', targetType: 'none',
    rarity: 'status', isStatus: true, ethereal: true, unplayable: true,
    description: 'Unplayable. Ethereal. On draw: gain 3 Petrify.',
    shortDescription: 'Unplayable. Ethereal. +3 Petrify on draw.',
    effect() {},
    onDraw(state) { gainPetrify(state.player, 3); },
    upgrade: null,
  },
  crystal_sliver: {
    id: 'crystal_sliver', name: 'Crystal Sliver', cost: 0, type: 'status', targetType: 'none',
    rarity: 'status', isStatus: true, ethereal: true, unplayable: true,
    description: 'Unplayable. Ethereal. On enter hand: gain Attuned 2.',
    shortDescription: 'Unplayable. Ethereal. +Attuned 2 on enter.',
    effect() {},
    onDraw(state) { applyStatus(state.player, 'attuned', 2); },
    upgrade: null,
  },
  stasis: {
    id: 'stasis', name: 'Stasis', cost: 1, type: 'status', targetType: 'none',
    rarity: 'status', isStatus: true, retained: true, exhaust: true,
    description: 'Retained. Exhaust. While in hand: all non-status cards cost +1 (max 3). Play to remove.',
    shortDescription: 'Retained. Exhaust. Non-status cards cost +1 (max 3) while held.',
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
    rarity: 'curse', isCurse: true, unplayable: true, innate: true,
    description: 'Unplayable. Innate. On draw: gain 2 Petrify.',
    effect() {},
    onDraw(state) {
      state.player.lastPetrifySource = { type: 'curse', id: 'fossil_burden' };
      gainPetrify(state.player, 2);
    },
    upgrade: null,
  },

  deadstone: {
    id: 'deadstone', name: 'Deadstone', cost: 0, type: 'curse', targetType: 'none',
    rarity: 'curse', isCurse: true, unplayable: true,
    description: 'Unplayable. No effect.',
    effect() {},
    upgrade: null,
  },

  torpor: {
    id: 'torpor', name: 'Torpor', cost: 0, type: 'curse', targetType: 'none',
    rarity: 'curse', isCurse: true, unplayable: true,
    description: 'Unplayable. While in hand, you may only play 2 cards per turn.',
    effect() {},
    upgrade: null,
  },

  stone_debt: {
    id: 'stone_debt', name: 'Stone Debt', cost: 0, type: 'curse', targetType: 'none',
    rarity: 'curse', isCurse: true, unplayable: true,
    description: 'Unplayable. On draw: gain 3 Petrify.',
    effect() {},
    onDraw(state) {
      state.player.lastPetrifySource = { type: 'curse', id: 'stone_debt' };
      gainPetrify(state.player, 3);
    },
    upgrade: null,
  },

  // ── Event-exclusive cards (never appear in reward or shop pools) ──────────────

  stone_eruption: {
    id: 'stone_eruption', name: 'Stone Eruption', cost: 0, type: 'attack', targetType: 'none',
    rarity: 'special', eventOnly: true, colorless: true,
    description: 'Deal 12 damage to ALL enemies. Gain 10 Petrify.',
    shortDescription: 'Deal 12 to all. Gain 10 Petrify.',
    effect(state) {
      for (const e of state.combat.enemies) if (e.hp > 0) applyDamage(e, 12, state.player);
      state.player.lastPetrifySource = { type: 'self', id: 'stone_eruption' };
      gainPetrify(state.player, 10);
    },
    upgrade: null,
  },

  hexing_strike: {
    id: 'hexing_strike', name: 'Hexing Strike', cost: 1, type: 'attack', targetType: 'enemy',
    rarity: 'special', eventOnly: true, colorless: true,
    description: 'Deal 10 damage. Apply Vulnerable 2.',
    effect(state, target) {
      applyDamage(target, 10, state.player);
      applyStatus(target, 'vulnerable', 2);
    },
    upgrade: null,
  },

  cursed_ward: {
    id: 'cursed_ward', name: 'Cursed Ward', cost: 1, type: 'skill', targetType: 'none',
    rarity: 'special', eventOnly: true, colorless: true,
    description: 'Gain 10 Block. Apply Weak 1 to all enemies.',
    effect(state) {
      applyBlock(state.player, 10);
      for (const e of state.combat.enemies) if (e.hp > 0) applyStatus(e, 'weak', 1);
    },
    upgrade: null,
  },

  stone_dominion: {
    id: 'stone_dominion', name: 'Stone Dominion', cost: 2, type: 'power', targetType: 'none',
    rarity: 'special', eventOnly: true, colorless: true,
    description: 'At the start of each turn: gain 2 Petrify and 1 Energy.',
    effect(state) {
      state.combat.activePowers.push({
        name: 'Stone Dominion',
        hooks: {
          onTurnStart(s) {
            s.player.lastPetrifySource = { type: 'self', id: 'stone_dominion' };
            gainPetrify(s.player, 2);
            s.combat.energy += 1;
          },
        },
      });
    },
    upgrade: null,
  },

  // ── Opal — "The Faceted" (Geode economy) ─────────────────────────────────
  // Loop: gain Petrify (Ore Strike) → crystallize it into Geodes → spend/scale.

  ore_strike: {
    id: 'ore_strike', name: 'Ore Strike', cost: 1, type: 'attack', targetType: 'enemy', rarity: 'common',
    description: 'Deal 6 damage. Gain 3 Petrify.',
    effect(state, target) { applyDamage(target, 6, state.player); gainPetrify(state.player, 3); },
    upgrade: { name: 'Ore Strike+', description: 'Deal 8 damage. Gain 3 Petrify.',
      effect(state, target) { applyDamage(target, 8, state.player); gainPetrify(state.player, 3); } },
  },
  crystallize: {
    id: 'crystallize', name: 'Crystallize', cost: 1, type: 'skill', targetType: 'none', rarity: 'common',
    description: 'Reduce Petrify by up to 6. Gain 1 Geode for every 2 Petrify removed.',
    shortDescription: 'Convert up to 6 Petrify → Geodes (1 per 2).',
    effect(state) {
      const before = state.player.petrify;
      reducePetrify(state.player, 6);
      gainGeodes(state, Math.ceil((before - state.player.petrify) / 2));
    },
    upgrade: { name: 'Crystallize+', description: 'Reduce Petrify by up to 8. Gain 1 Geode for every 2 Petrify removed.',
      shortDescription: 'Convert up to 8 Petrify → Geodes (1 per 2).',
      effect(state) {
        const before = state.player.petrify;
        reducePetrify(state.player, 8);
        gainGeodes(state, Math.ceil((before - state.player.petrify) / 2));
      } },
  },
  facet_strike: {
    id: 'facet_strike', name: 'Facet Strike', cost: 1, type: 'attack', targetType: 'enemy', rarity: 'common',
    description: 'Deal 5 damage, plus 2 for each Geode you have. Geodes are not spent.',
    shortDescription: 'Deal 5 + 2 per Geode (not spent).',
    effect(state, target) { applyDamage(target, 5 + 2 * (state.player.geodes ?? 0), state.player); },
    upgrade: { name: 'Facet Strike+', description: 'Deal 7 damage, plus 2 for each Geode you have. Geodes are not spent.',
      shortDescription: 'Deal 7 + 2 per Geode (not spent).',
      effect(state, target) { applyDamage(target, 7 + 2 * (state.player.geodes ?? 0), state.player); } },
  },
  geode_ward: {
    id: 'geode_ward', name: 'Geode Ward', cost: 1, type: 'skill', targetType: 'none', rarity: 'common',
    description: 'Gain 4 Block, plus 2 for each Geode you have. Geodes are not spent.',
    shortDescription: 'Gain 4 + 2 per Geode Block (not spent).',
    effect(state) { applyBlock(state.player, 4 + 2 * (state.player.geodes ?? 0)); },
    upgrade: { name: 'Geode Ward+', description: 'Gain 6 Block, plus 2 for each Geode you have. Geodes are not spent.',
      shortDescription: 'Gain 6 + 2 per Geode Block (not spent).',
      effect(state) { applyBlock(state.player, 6 + 2 * (state.player.geodes ?? 0)); } },
  },
  splinter: {
    id: 'splinter', name: 'Splinter', cost: 0, type: 'attack', targetType: 'enemy', rarity: 'common',
    description: 'Consume 1 Geode to deal 6 damage. If you have none, deal 2 damage.',
    shortDescription: 'Spend 1 Geode: deal 6 (else 2).',
    effect(state, target) {
      if ((state.player.geodes ?? 0) > 0) { state.player.geodes -= 1; applyDamage(target, 6, state.player); }
      else applyDamage(target, 2, state.player);
    },
    upgrade: { name: 'Splinter+', description: 'Consume 1 Geode to deal 9 damage. If you have none, deal 3 damage.',
      shortDescription: 'Spend 1 Geode: deal 9 (else 3).',
      effect(state, target) {
        if ((state.player.geodes ?? 0) > 0) { state.player.geodes -= 1; applyDamage(target, 9, state.player); }
        else applyDamage(target, 3, state.player);
      } },
  },
  shatter_burst: {
    id: 'shatter_burst', name: 'Shatter Burst', cost: 2, type: 'attack', targetType: 'none', rarity: 'uncommon',
    description: 'Consume all Geodes. Deal 4 damage to ALL enemies for each Geode consumed.',
    shortDescription: 'Spend all Geodes: 4 dmg to all per Geode.',
    effect(state) {
      const g = spendAllGeodes(state);
      for (const e of state.combat.enemies) if (e.hp > 0) applyDamage(e, 4 * g, state.player);
    },
    upgrade: { name: 'Shatter Burst+', description: 'Consume all Geodes. Deal 5 damage to ALL enemies for each Geode consumed.',
      shortDescription: 'Spend all Geodes: 5 dmg to all per Geode.',
      effect(state) {
        const g = spendAllGeodes(state);
        for (const e of state.combat.enemies) if (e.hp > 0) applyDamage(e, 5 * g, state.player);
      } },
  },
  prismatic_core: {
    id: 'prismatic_core', name: 'Prismatic Core', cost: 1, type: 'power', targetType: 'none', rarity: 'uncommon',
    description: 'At the start of each turn, gain 1 Geode.',
    effect(state) {
      state.combat.activePowers.push({
        name: 'Prismatic Core',
        hooks: { onTurnStart(s) { gainGeodes(s, 1); } },
      });
    },
    upgrade: { name: 'Prismatic Core+', description: 'At the start of each turn, gain 2 Geodes.',
      effect(state) {
        state.combat.activePowers.push({
          name: 'Prismatic Core+',
          hooks: { onTurnStart(s) { gainGeodes(s, 2); } },
        });
      } },
  },
  mother_lode: {
    id: 'mother_lode', name: 'Mother Lode', cost: 2, type: 'skill', targetType: 'none', rarity: 'uncommon',
    description: 'Consume all Geodes. For each Geode consumed, gain 3 Block and reduce Petrify by 2.',
    shortDescription: 'Spend all Geodes: +3 Block & −2 Petrify each.',
    effect(state) {
      const g = spendAllGeodes(state);
      applyBlock(state.player, 3 * g);
      reducePetrify(state.player, 2 * g);
    },
    upgrade: { name: 'Mother Lode+', description: 'Consume all Geodes. For each Geode consumed, gain 4 Block and reduce Petrify by 2.',
      shortDescription: 'Spend all Geodes: +4 Block & −2 Petrify each.',
      effect(state) {
        const g = spendAllGeodes(state);
        applyBlock(state.player, 4 * g);
        reducePetrify(state.player, 2 * g);
      } },
  },
  grand_geode: {
    id: 'grand_geode', name: 'Grand Geode', cost: 2, type: 'power', targetType: 'none', rarity: 'rare',
    description: 'Whenever you gain Geodes, gain 1 additional Geode.',
    effect(state) {
      state.combat._geodeBonus = (state.combat._geodeBonus ?? 0) + 1;
      state.combat.activePowers.push({ name: 'Grand Geode', hooks: {} });
    },
    upgrade: { name: 'Grand Geode+', cost: 1, description: 'Whenever you gain Geodes, gain 1 additional Geode.',
      effect(state) {
        state.combat._geodeBonus = (state.combat._geodeBonus ?? 0) + 1;
        state.combat.activePowers.push({ name: 'Grand Geode+', hooks: {} });
      } },
  },
  cataclysm: {
    id: 'cataclysm', name: 'Cataclysm', cost: 3, type: 'attack', targetType: 'enemy', rarity: 'rare',
    description: 'Deal 8 damage. Then consume all Geodes; deal 6 damage per Geode to the target.',
    shortDescription: 'Deal 8, then spend all Geodes: 6 dmg each.',
    effect(state, target) {
      applyDamage(target, 8, state.player);
      const g = spendAllGeodes(state);
      if (g > 0 && target.hp > 0) applyDamage(target, 6 * g, state.player);
    },
    upgrade: { name: 'Cataclysm+', description: 'Deal 10 damage. Then consume all Geodes; deal 7 damage per Geode to the target.',
      shortDescription: 'Deal 10, then spend all Geodes: 7 dmg each.',
      effect(state, target) {
        applyDamage(target, 10, state.player);
        const g = spendAllGeodes(state);
        if (g > 0 && target.hp > 0) applyDamage(target, 7 * g, state.player);
      } },
  },

  // ── Galatea — "The Statue" (Poise + Harden) ──────────────────────────────
  // Build Poise via defense/skills and Harden banking; spend it on scaling attacks.

  composure: {
    id: 'composure', name: 'Composure', cost: 1, type: 'skill', targetType: 'none', rarity: 'common',
    description: 'Gain 6 Block. Gain 2 Poise.',
    effect(state) { applyBlock(state.player, 6); gainPoise(state, 2); },
    upgrade: { name: 'Composure+', description: 'Gain 9 Block. Gain 2 Poise.',
      effect(state) { applyBlock(state.player, 9); gainPoise(state, 2); } },
  },
  brace: {
    id: 'brace', name: 'Brace', cost: 1, type: 'skill', targetType: 'none', rarity: 'common', retained: true,
    description: 'Gain 5 Block. Harden 3 (each turn this stays in your hand, its Block rises by 3).',
    shortDescription: 'Gain 5 Block. Harden 3.',
    effect(state) { applyBlock(state.player, 5 + (this._harden || 0)); },
    onRetain() { this._harden = (this._harden || 0) + 3; this.shortDescription = `Gain ${5 + this._harden} Block. Harden 3.`; return false; },
    onCombatStart() { this._harden = 0; this.shortDescription = 'Gain 5 Block. Harden 3.'; },
    upgrade: { name: 'Brace+', description: 'Gain 7 Block. Harden 4 (each turn this stays in your hand, its Block rises by 4).', shortDescription: 'Gain 7 Block. Harden 4.',
      effect(state) { applyBlock(state.player, 7 + (this._harden || 0)); },
      onRetain() { this._harden = (this._harden || 0) + 4; this.shortDescription = `Gain ${7 + this._harden} Block. Harden 4.`; return false; },
      onCombatStart() { this._harden = 0; this.shortDescription = 'Gain 7 Block. Harden 4.'; } },
  },
  chisel: {
    id: 'chisel', name: 'Chisel', cost: 1, type: 'attack', targetType: 'enemy', rarity: 'common', retained: true,
    description: 'Deal 5 damage. Harden 4 (each turn this stays in your hand, its damage rises by 4).',
    shortDescription: 'Deal 5. Harden 4.',
    effect(state, target) { applyDamage(target, 5 + (this._harden || 0), state.player); },
    onRetain() { this._harden = (this._harden || 0) + 4; this.shortDescription = `Deal ${5 + this._harden}. Harden 4.`; return false; },
    onCombatStart() { this._harden = 0; this.shortDescription = 'Deal 5. Harden 4.'; },
    upgrade: { name: 'Chisel+', description: 'Deal 6 damage. Harden 5 (each turn this stays in your hand, its damage rises by 5).', shortDescription: 'Deal 6. Harden 5.',
      effect(state, target) { applyDamage(target, 6 + (this._harden || 0), state.player); },
      onRetain() { this._harden = (this._harden || 0) + 5; this.shortDescription = `Deal ${6 + this._harden}. Harden 5.`; return false; },
      onCombatStart() { this._harden = 0; this.shortDescription = 'Deal 6. Harden 5.'; } },
  },
  unyielding: {
    id: 'unyielding', name: 'Unyielding', cost: 1, type: 'attack', targetType: 'enemy', rarity: 'common',
    description: 'Spend up to 3 Poise. Deal 6 damage, plus 4 for each Poise spent.',
    shortDescription: 'Spend ≤3 Poise: deal 6 + 4 each.',
    effect(state, target) {
      const spent = Math.min(3, state.player.poise ?? 0);
      state.player.poise -= spent;
      applyDamage(target, 6 + 4 * spent, state.player);
    },
    upgrade: { name: 'Unyielding+', description: 'Spend up to 3 Poise. Deal 6 damage, plus 5 for each Poise spent.',
      shortDescription: 'Spend ≤3 Poise: deal 6 + 5 each.',
      effect(state, target) {
        const spent = Math.min(3, state.player.poise ?? 0);
        state.player.poise -= spent;
        applyDamage(target, 6 + 5 * spent, state.player);
      } },
  },
  set_in_stone: {
    id: 'set_in_stone', name: 'Set in Stone', cost: 1, type: 'skill', targetType: 'none', rarity: 'common',
    description: 'Gain 5 Petrify. Gain 4 Poise.',
    effect(state) { gainPetrify(state.player, 5); gainPoise(state, 4); },
    upgrade: { name: 'Set in Stone+', description: 'Gain 5 Petrify. Gain 6 Poise.',
      effect(state) { gainPetrify(state.player, 5); gainPoise(state, 6); } },
  },
  monument: {
    id: 'monument', name: 'Monument', cost: 2, type: 'attack', targetType: 'enemy', rarity: 'uncommon',
    description: 'Consume all Poise. Deal 3 damage for each Poise consumed.',
    shortDescription: 'Spend all Poise: deal 3 each.',
    effect(state, target) {
      const p = state.player.poise ?? 0;
      state.player.poise = 0;
      applyDamage(target, 3 * p, state.player);
    },
    upgrade: { name: 'Monument+', description: 'Consume all Poise. Deal 4 damage for each Poise consumed.',
      shortDescription: 'Spend all Poise: deal 4 each.',
      effect(state, target) {
        const p = state.player.poise ?? 0;
        state.player.poise = 0;
        applyDamage(target, 4 * p, state.player);
      } },
  },
  pedestal: {
    id: 'pedestal', name: 'Pedestal', cost: 1, type: 'power', targetType: 'none', rarity: 'uncommon',
    description: 'At the end of your turn, gain 1 Poise for each card in your hand (max 3).',
    shortDescription: 'End of turn: +1 Poise per card held (max 3).',
    effect(state) {
      state.combat.activePowers.push({
        name: 'Pedestal',
        hooks: { onTurnEnd(s) { gainPoise(s, Math.min(3, s.combat.deckState.hand.length)); } },
      });
    },
    upgrade: { name: 'Pedestal+', description: 'At the end of your turn, gain 1 Poise for each card in your hand (max 4).',
      shortDescription: 'End of turn: +1 Poise per card held (max 4).',
      effect(state) {
        state.combat.activePowers.push({
          name: 'Pedestal+',
          hooks: { onTurnEnd(s) { gainPoise(s, Math.min(4, s.combat.deckState.hand.length)); } },
        });
      } },
  },
  weight_of_ages: {
    id: 'weight_of_ages', name: 'Weight of Ages', cost: 2, type: 'skill', targetType: 'none', rarity: 'uncommon',
    description: 'Gain Block equal to your Poise. Then gain 3 Poise.',
    shortDescription: 'Block = Poise. Then +3 Poise.',
    effect(state) { applyBlock(state.player, state.player.poise ?? 0); gainPoise(state, 3); },
    upgrade: { name: 'Weight of Ages+', description: 'Gain Block equal to your Poise. Then gain 4 Poise.',
      shortDescription: 'Block = Poise. Then +4 Poise.',
      effect(state) { applyBlock(state.player, state.player.poise ?? 0); gainPoise(state, 4); } },
  },
  living_marble: {
    id: 'living_marble', name: 'Living Marble', cost: 2, type: 'power', targetType: 'none', rarity: 'rare',
    description: 'Whenever you gain Poise, gain Block equal to the Poise gained.',
    shortDescription: 'Gain Poise → gain that much Block.',
    effect(state) {
      state.combat._poiseBlock = (state.combat._poiseBlock ?? 0) + 1;
      state.combat.activePowers.push({ name: 'Living Marble', hooks: {} });
    },
    upgrade: { name: 'Living Marble+', description: 'Whenever you gain Poise, gain Block equal to twice the Poise gained.',
      shortDescription: 'Gain Poise → gain 2× Block.',
      effect(state) {
        state.combat._poiseBlock = (state.combat._poiseBlock ?? 0) + 2;
        state.combat.activePowers.push({ name: 'Living Marble+', hooks: {} });
      } },
  },
  awakening: {
    id: 'awakening', name: 'Awakening', cost: 3, type: 'attack', targetType: 'enemy', rarity: 'rare',
    description: 'Deal 6 damage. Then double your Poise.',
    shortDescription: 'Deal 6. Double your Poise.',
    effect(state, target) { applyDamage(target, 6, state.player); gainPoise(state, state.player.poise ?? 0); },
    upgrade: { name: 'Awakening+', description: 'Deal 9 damage. Then double your Poise.',
      shortDescription: 'Deal 9. Double your Poise.',
      effect(state, target) { applyDamage(target, 9, state.player); gainPoise(state, state.player.poise ?? 0); } },
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
