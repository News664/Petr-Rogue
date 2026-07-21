// ── characters.js ─────────────────────────────────────────────────────────────
// Playable character definitions and player state factory.
//
// Exports:
//   characterDefs — object keyed by character ID
//   createPlayerFromCharacter(charId) → full player state object
//
// Character def shape:
//   { id, name, title, hp, energy, startingRelicId, flavor,
//     starterDeck() → Card[], cardPool[] }
//
// Current characters:
//   mint    — "The Reclaimed" (68 HP) — Petrify-cleanse and conversion
//   tharja  — "The Stone-Kissed" (72 HP) — Petrify as a power source, threshold at ≥50% HP
//   emma    — "The Faceted" (70 HP) — crystallize Petrify into Geodes, spend/scale
//   galatea — "The Statue" (75 HP) — build Poise + Harden held cards, burst attacks
//
// All characters must be female (lore rule).
// ─────────────────────────────────────────────────────────────────────────────

import { makeCard } from './cards.js';
import { makeRelic } from './relics.js';

export const characterDefs = {
  mint: {
    id: 'mint',
    name: 'Mint',
    title: 'The Reclaimed',
    flavor: 'Mint was petrified and sealed away in these depths — by whom, and why, she does not yet know. A wandering goddess passed through and breathed life back into her. Now she descends further, carrying both the curse and its antidote, searching for answers.',
    hp: 68,
    energy: 3,
    startingRelicId: 'stone_veil',
    starterDeck() {
      return [
        'strike', 'strike', 'strike', 'strike',
        'defend', 'defend', 'defend',
        'purifying_touch', 'purifying_touch',
        'holy_light',
      ].map(makeCard);
    },
    cardPool: [
      'bash', 'gravel_shot', 'stone_skin', 'shatter',
      'purify', 'fortify', 'stone_will', 'controlled_calcify',
      'purifying_touch', 'holy_light', 'petrify_ward', 'consecrate', 'sanctify',
      'stone_coat', 'holy_surge',
      'purifying_nova', 'sacred_ground',
    ],
  },

  tharja: {
    id: 'tharja',
    name: 'Tharja',
    title: 'The Stone-Kissed',
    flavor: 'Other mages treat petrification as a threat to be endured. Tharja learned, through years of forbidden study and careful self-experimentation, that it is something else entirely — a reservoir, humming with dark potential, waiting to be spent. She came to the dungeon to drink from the source. The risk is part of the appeal. The edge between flesh and stone is where she does her best work.',
    hp: 72,
    energy: 3,
    startingRelicId: 'stone_hunger',
    starterDeck() {
      return [
        'strike', 'strike', 'strike', 'strike',
        'defend', 'defend', 'defend',
        'stone_fang', 'stone_fang',
        'petrify_lash',
      ].map(makeCard);
    },
    cardPool: [
      'bash', 'gravel_shot', 'stone_skin', 'shatter', 'petrify_surge',
      'purify', 'fortify', 'stone_will', 'controlled_calcify',
      'stone_fang', 'fracture', 'petrify_lash', 'petrify_mantle', 'void_release',
      'void_crack', 'overload', 'stone_pact', 'stone_bastion',
      'petrify_shroud',
    ],
  },

  emma: {
    id: 'emma',
    name: 'Emma',
    title: 'The Faceted',
    flavor: 'Where others see a curse, Emma sees ore. She learned to draw the creeping stone out of her own flesh before it could root — and, refusing to waste it, to cut it into faceted geodes she carries like coin. Petrification is not her enemy. It is her supply. She came to the dungeon because it is the richest vein she has ever found.',
    hp: 70,
    energy: 3,
    startingRelicId: 'geode_core',
    starterDeck() {
      return [
        'strike', 'strike', 'strike',
        'defend', 'defend', 'defend',
        'ore_strike', 'ore_strike',
        'crystallize', 'geode_ward',
      ].map(makeCard);
    },
    cardPool: [
      'bash', 'gravel_shot', 'stone_skin', 'shatter', 'petrify_surge',
      'purify', 'fortify', 'stone_will', 'controlled_calcify',
      'ore_strike', 'crystallize', 'facet_strike', 'geode_ward', 'splinter',
      'shatter_burst', 'prismatic_core', 'mother_lode',
      'grand_geode', 'cataclysm',
    ],
  },

  galatea: {
    id: 'galatea',
    name: 'Galatea',
    title: 'The Statue',
    flavor: 'Legend says she was carved before she drew breath, and something of the marble never left her. Galatea does not flail against the stone that hunts every soul down here — she meets it with its own stillness, gathering her poise motionless, hardening her intent, and then moving exactly once, exactly enough. Patience, for her, is a weapon with an edge.',
    hp: 75,
    energy: 3,
    startingRelicId: 'sculptors_plinth',
    starterDeck() {
      return [
        'strike', 'strike', 'strike',
        'defend', 'defend', 'defend',
        'composure', 'composure',
        'chisel', 'unyielding',
      ].map(makeCard);
    },
    cardPool: [
      'bash', 'gravel_shot', 'stone_skin', 'shatter',
      'purify', 'fortify', 'stone_will', 'controlled_calcify',
      'composure', 'brace', 'chisel', 'unyielding', 'hold_fast',
      'monument', 'pedestal', 'weight_of_ages',
      'living_marble', 'awakening',
    ],
  },
};

export function createPlayerFromCharacter(charDef) {
  return {
    characterId: charDef.id,
    hp: charDef.hp,
    maxHp: charDef.hp,
    petrify: 0,
    block: 0,
    geodes: 0,   // Emma resource (reset each combat by startCombat)
    poise: 0,    // Galatea resource (reset each combat by startCombat)
    gold: 100,
    deck: charDef.starterDeck(),
    relics: [makeRelic(charDef.startingRelicId)],
    statusEffects: {},
    cardPool: charDef.cardPool,
  };
}
