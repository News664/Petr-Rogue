import { makeCard } from './cards.js';
import { makeRelic } from './relics.js';

export const characterDefs = {
  mint: {
    id: 'mint',
    name: 'Mint',
    title: 'The Purifier',
    flavor: 'A former stone-cult priestess who turned the rites against themselves. She converts petrification into power — damage through cleansing.',
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
    // Cards that can appear in reward/shop pools for this character
    cardPool: [
      // Shared pool
      'bash', 'stone_strike', 'stone_skin', 'shatter', 'calcify',
      'purify', 'petrify_surge', 'gravel_shot', 'fortify',
      'stone_will', 'controlled_calcify',
      // Mint unique
      'purifying_touch', 'holy_light', 'holy_surge', 'purifying_nova',
      'stone_tithe', 'consecrate', 'sanctuary', 'petrify_ward',
      'stone_coat', 'sacred_ground',
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
