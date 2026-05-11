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
};

export function createPlayerFromCharacter(charDef) {
  return {
    characterId: charDef.id,
    hp: charDef.hp,
    maxHp: charDef.hp,
    petrify: 0,
    block: 0,
    gold: 100,
    deck: charDef.starterDeck(),
    relics: [makeRelic(charDef.startingRelicId)],
    statusEffects: {},
    cardPool: charDef.cardPool,
  };
}
