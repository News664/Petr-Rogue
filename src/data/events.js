import { gainPetrify, reducePetrify, healPlayer } from '../systems/Effects.js';
import { makeCard } from './cards.js';

export const eventDefs = [
  {
    id: 'ancient_statue',
    title: 'Ancient Statue',
    text: 'A moss-covered statue dominates the chamber. Its eyes seem to follow you. You feel a strange pull — touching it might offer power, but at a cost.',
    choices: [
      {
        label: 'Touch the statue',
        description: '+20 Gold, +8 Petrify',
        effect(state) {
          state.player.gold += 20;
          gainPetrify(state.player, 8);
        },
      },
      {
        label: 'Walk away',
        description: 'Nothing happens.',
        effect() {},
      },
    ],
  },
  {
    id: 'stone_spring',
    title: 'Stone Spring',
    text: 'A spring of cloudy water bubbles from between grey rocks. It smells of minerals and cold earth. Drinking might ease the petrification spreading through your veins.',
    choices: [
      {
        label: 'Drink from the spring',
        description: 'Reduce Petrify by 8. Heal 8 HP.',
        effect(state) {
          reducePetrify(state.player, 8);
          healPlayer(state.player, 8);
        },
      },
      {
        label: 'Bathe your wounds instead',
        description: 'Heal 15 HP.',
        effect(state) {
          healPlayer(state.player, 15);
        },
      },
    ],
  },
  {
    id: 'wandering_merchant',
    title: 'Wandering Merchant',
    text: 'A cloaked figure blocks your path, offering a stone-grey card that hums with barely-contained energy. "A bargain," they say, "for a small toll."',
    choices: [
      {
        label: 'Accept (add Stone Strike, +5 Petrify)',
        description: 'Add Stone Strike to your deck. Gain 5 Petrify.',
        effect(state) {
          state.player.deck.push(makeCard('stone_strike'));
          gainPetrify(state.player, 5);
        },
      },
      {
        label: 'Accept (add Shatter, +10 Petrify)',
        description: 'Add Shatter to your deck. Gain 10 Petrify.',
        effect(state) {
          state.player.deck.push(makeCard('shatter'));
          gainPetrify(state.player, 10);
        },
      },
      {
        label: 'Refuse',
        description: 'Nothing happens.',
        effect() {},
      },
    ],
  },
  {
    id: 'crumbling_altar',
    title: 'Crumbling Altar',
    text: 'An altar carved from black stone stands in the centre of the room. Offerings of gold are scattered around its base. You could take the gold, or leave an offering for a blessing.',
    choices: [
      {
        label: 'Take the gold',
        description: 'Gain 30 Gold.',
        effect(state) { state.player.gold += 30; },
      },
      {
        label: 'Leave an offering (25 Gold)',
        description: 'Spend 25 Gold. Reduce Petrify by 12.',
        effect(state) {
          if (state.player.gold >= 25) {
            state.player.gold -= 25;
            reducePetrify(state.player, 12);
          }
        },
      },
    ],
  },
  {
    id: 'petrified_adventurer',
    title: 'Petrified Adventurer',
    text: 'In the corner stands a statue that was once a person — their expression frozen mid-scream. In their stone hand, you notice a card and a small pouch of gold.',
    choices: [
      {
        label: 'Take the card (add Calcify)',
        description: 'Add Calcify to your deck.',
        effect(state) { state.player.deck.push(makeCard('calcify')); },
      },
      {
        label: 'Take the gold',
        description: 'Gain 15 Gold.',
        effect(state) { state.player.gold += 15; },
      },
      {
        label: 'Take both (+6 Petrify)',
        description: 'Add Calcify. Gain 15 Gold. Gain 6 Petrify.',
        effect(state) {
          state.player.deck.push(makeCard('calcify'));
          state.player.gold += 15;
          gainPetrify(state.player, 6);
        },
      },
    ],
  },
];
