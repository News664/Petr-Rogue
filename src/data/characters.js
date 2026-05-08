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
