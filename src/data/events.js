// ── events.js ─────────────────────────────────────────────────────────────────
// Non-combat room event definitions.
//
// Exports:
//   eventDefs — object keyed by event ID
//   pickEvent(state) → event def (randomly selected, avoids repeats via state.seenEvents)
//
// Event def shape:
//   { id, title, description, choices: [{ label, apply(state) }] }
//   apply(state) runs when the player selects that choice; may mutate player/deck/relics.
//
// Events may: add/remove cards, grant/remove relics, heal/damage, apply statuses,
//   grant gold, add Petrify, or do nothing (flavour choices).
// ─────────────────────────────────────────────────────────────────────────────

import { gainPetrify, reducePetrify, healPlayer } from '../systems/Effects.js';
import { applyStatus } from '../systems/StatusSystem.js';
import { makeCard } from './cards.js';
import { makeRelic, relicDropPool } from './relics.js';

// Each event has:
//   acts:     number[]  — which acts it can appear in (1-indexed)
//   tone:     'positive' | 'neutral' | 'negative'
//   position: 'early' | 'late' | 'any'  (early: floors 1-4, late: floors 6-9)
//
// Choices with needsCardPick trigger the deck card-picker in EventScreen.
// onPick(state, cardIndex) is called when the player selects a card.

export const eventDefs = [

  // ── Shared across Acts 1–2 ────────────────────────────────────────────────

  {
    id: 'ancient_statue',
    acts: [1, 2], tone: 'neutral', position: 'any',
    title: 'Ancient Statue',
    text: 'A moss-covered statue dominates the chamber. Its eyes seem to follow you. You feel a strange pull — touching it might offer power, but at a cost.',
    choices: [
      {
        label: 'Touch the statue',
        description: '+20 Gold, +8 Petrify',
        effect(state) {
          state.player.gold += 20;
          state.player.lastPetrifySource = { type: 'event', id: 'ancient_statue' };
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
    acts: [1, 2], tone: 'positive', position: 'any',
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
        effect(state) { healPlayer(state.player, 15); },
      },
    ],
  },

  {
    id: 'wandering_merchant',
    acts: [1, 2], tone: 'neutral', position: 'any',
    title: 'Wandering Merchant',
    text: 'A cloaked figure blocks your path, offering a stone-grey card that hums with barely-contained energy. "A bargain," she says, "for a small toll."',
    choices: [
      {
        label: 'Accept (add Stone Strike, +5 Petrify)',
        description: 'Add Stone Strike to your deck. Gain 5 Petrify.',
        effect(state) {
          state.player.deck.push(makeCard('stone_strike'));
          state.player.lastPetrifySource = { type: 'event', id: 'wandering_merchant' };
          gainPetrify(state.player, 5);
        },
      },
      {
        label: 'Accept (add Shatter, +10 Petrify)',
        description: 'Add Shatter to your deck. Gain 10 Petrify.',
        effect(state) {
          state.player.deck.push(makeCard('shatter'));
          state.player.lastPetrifySource = { type: 'event', id: 'wandering_merchant' };
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
    acts: [1, 2], tone: 'neutral', position: 'any',
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
    id: 'stone_shrine',
    acts: [1, 2], tone: 'neutral', position: 'any',
    title: 'Stone Shrine',
    text: 'A small shrine of polished obsidian stands untouched amid the rubble. A single relic rests on its surface, waiting. Taking it feels like a pact.',
    choices: [
      {
        label: 'Take the relic (+10 Petrify)',
        description: 'Gain a random relic. Gain 10 Petrify.',
        effect(state) {
          const id = relicDropPool[Math.floor(Math.random() * relicDropPool.length)];
          state.player.relics.push(makeRelic(id));
          state.player.lastPetrifySource = { type: 'event', id: 'stone_shrine' };
          gainPetrify(state.player, 10);
        },
      },
      {
        label: 'Smash the shrine (+30 Gold)',
        description: 'Gain 30 Gold.',
        effect(state) { state.player.gold += 30; },
      },
      {
        label: 'Leave it',
        description: 'Nothing happens.',
        effect() {},
      },
    ],
  },

  {
    id: 'numbing_fog',
    acts: [1, 2], tone: 'negative', position: 'any',
    title: 'Numbing Fog',
    text: 'A grey mist fills the corridor ahead. You can push through quickly or wait for it to pass — but waiting costs time, and something stirs in the dark behind you.',
    choices: [
      {
        label: 'Push through (Numbing 3)',
        description: 'Gain Numbing 3 — gain 3 Petrify at the start of your next three turns.',
        effect(state) { applyStatus(state.player, 'numbing', 3); },
      },
      {
        label: 'Wait it out (lose 10 HP)',
        description: 'Take 10 damage to avoid the fog.',
        effect(state) { state.player.hp = Math.max(1, state.player.hp - 10); },
      },
    ],
  },

  // ── Act 1 only ────────────────────────────────────────────────────────────

  {
    id: 'petrified_adventurer',
    acts: [1], tone: 'neutral', position: 'any',
    title: 'Petrified Adventurer',
    text: 'In the corner stands a statue that was once a person — her expression frozen mid-scream. In her stone hand, you notice a card and a small pouch of gold.',
    choices: [
      {
        label: 'Take the card (add Calcify)',
        description: 'Add Calcify to your deck.',
        effect(state) { state.player.deck.push(makeCard('stone_channel')); },
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
          state.player.deck.push(makeCard('stone_channel'));
          state.player.gold += 15;
          state.player.lastPetrifySource = { type: 'event', id: 'petrified_adventurer' };
          gainPetrify(state.player, 6);
        },
      },
    ],
  },

  {
    id: 'fleeing_scholar',
    acts: [1], tone: 'neutral', position: 'early',
    title: 'The Fleeing Scholar',
    text: 'A young woman stumbles into you, half her arm already grey with stone. She was cataloguing the ruins when the petrification started. She thrusts a worn card into your hands — "Take her notes," she gasps — before running for the exit.',
    choices: [
      {
        label: 'Keep her notes (add Stone Will)',
        description: 'Add Stone Will to your deck.',
        effect(state) { state.player.deck.push(makeCard('stone_will')); },
      },
      {
        label: 'Call her back for her gold pouch',
        description: 'Gain 20 Gold.',
        effect(state) { state.player.gold += 20; },
      },
    ],
  },

  {
    id: 'petrified_guard',
    acts: [1], tone: 'positive', position: 'any',
    title: 'Petrified Guard',
    text: 'A soldier frozen mid-salute, stone fist raised in a final gesture of duty. Her armour has half-crumbled away, and you spot a coin purse at her feet. You could try to free what remains of her — or simply take what the stone has left behind.',
    choices: [
      {
        label: 'Crack the stone armour free',
        description: 'Heal 12 HP.',
        effect(state) { healPlayer(state.player, 12); },
      },
      {
        label: 'Take the coin purse',
        description: 'Gain 25 Gold.',
        effect(state) { state.player.gold += 25; },
      },
    ],
  },

  // ── Act 2 only ────────────────────────────────────────────────────────────

  {
    id: 'resonant_crystal',
    acts: [2], tone: 'neutral', position: 'any',
    title: 'Resonant Crystal',
    text: 'A fist-sized crystal pulses with inner light, half-buried in the mine wall. It hums when you approach — a frequency that resonates with the stone in your veins. Attuning yourself to it would amplify all Petrify you gain from every source.',
    choices: [
      {
        label: 'Resonate with it (Attuned 3, add Stone Eruption)',
        description: 'Gain Attuned 3. Add Stone Eruption to your deck. High risk, high reward.',
        effect(state) {
          applyStatus(state.player, 'attuned', 3);
          state.player.deck.push(makeCard('stone_eruption'));
        },
      },
      {
        label: 'Mine it for ore (30 Gold, −6 HP)',
        description: 'Gain 30 Gold. Lose 6 HP from flying shards.',
        effect(state) {
          state.player.gold += 30;
          state.player.hp = Math.max(1, state.player.hp - 6);
        },
      },
      {
        label: 'Leave it',
        description: 'Nothing happens.',
        effect() {},
      },
    ],
  },

  {
    id: 'the_other_escapee',
    acts: [2], tone: 'neutral', position: 'any',
    title: 'The Other Escapee',
    text: 'Another survivor — a woman with stone-flecked skin and quick, calculating eyes. She studies you without warmth. "I\'ll trade," she says, gesturing to your deck. "My technique for yours." She is clearly skilled with hexes and negative effects.',
    choices: [
      {
        label: 'Trade an Attack card → Hexing Strike',
        description: 'Select an Attack card. She replaces it with Hexing Strike (1c: deal 10 dmg, Vulnerable 2).',
        needsCardPick: { type: 'attack', label: 'Choose an Attack card to trade away' },
        onPick(state, cardIndex) {
          state.player.deck.splice(cardIndex, 1, makeCard('hexing_strike'));
        },
      },
      {
        label: 'Trade a Skill card → Cursed Ward',
        description: 'Select a Skill card. She replaces it with Cursed Ward (1c: gain 10 Block, Weak 1 to all).',
        needsCardPick: { type: 'skill', label: 'Choose a Skill card to trade away' },
        onPick(state, cardIndex) {
          state.player.deck.splice(cardIndex, 1, makeCard('cursed_ward'));
        },
      },
      {
        label: 'Trade a Power card → Stone Dominion',
        description: 'Select a Power card. She replaces it with Stone Dominion (2c: each turn, gain 2 Petrify + 1 Energy).',
        needsCardPick: { type: 'power', label: 'Choose a Power card to trade away' },
        onPick(state, cardIndex) {
          state.player.deck.splice(cardIndex, 1, makeCard('stone_dominion'));
        },
      },
      {
        label: 'Have her remove a Curse',
        description: 'Select a Curse. She destroys it — no trade required.',
        needsCardPick: { type: 'curse', label: 'Choose a Curse to remove' },
        onPick(state, cardIndex) {
          state.player.deck.splice(cardIndex, 1);
        },
      },
      {
        label: 'Refuse',
        description: 'She shrugs and steps aside.',
        effect() {},
      },
    ],
  },

  {
    id: 'trapped_miner',
    acts: [2], tone: 'neutral', position: 'any',
    title: 'The Trapped Miner',
    text: 'A woman is pinned beneath a fallen beam, her lamp still burning beside her. She is unhurt but unable to move. "My pack," she says when she sees you. "Take what you need — just get me free."',
    choices: [
      {
        label: 'Free her (she gives you a card)',
        description: 'Add Fortify to your deck. She disappears into the tunnels.',
        effect(state) { state.player.deck.push(makeCard('fortify')); },
      },
      {
        label: 'Take her pack and leave',
        description: 'Gain 25 Gold.',
        effect(state) { state.player.gold += 25; },
      },
    ],
  },

  {
    id: 'cave_in',
    acts: [2], tone: 'negative', position: 'any',
    title: 'Cave-In',
    text: 'The ceiling groans. You have seconds to act before the section collapses. Brace and absorb the hit, or throw something into the debris to reduce the damage.',
    choices: [
      {
        label: 'Brace yourself (−15 HP)',
        description: 'Take 15 damage. All cards survive.',
        effect(state) { state.player.hp = Math.max(1, state.player.hp - 15); },
      },
      {
        label: 'Sacrifice a card (−5 HP)',
        description: 'Remove your highest-cost card from your deck. Take only 5 damage.',
        effect(state) {
          const deck = state.player.deck;
          if (deck.length > 0) {
            const maxCost = Math.max(...deck.map(c => c.cost ?? 0));
            const idx = deck.findIndex(c => (c.cost ?? 0) === maxCost);
            if (idx !== -1) deck.splice(idx, 1);
          }
          state.player.hp = Math.max(1, state.player.hp - 5);
        },
      },
    ],
  },

  // ── Act 3 only ────────────────────────────────────────────────────────────

  {
    id: 'crystallized_echo',
    acts: [3], tone: 'positive', position: 'any',
    title: 'Crystallized Echo',
    text: 'A fully petrified figure stands in the centre of the chamber, her stone shell cracked open from within. Where her heart would be, a faint light pulses — a last memory preserved in crystal. She is gone, but something of what she knew remains.',
    choices: [
      {
        label: 'Take the memory (add Stone Coat)',
        description: 'Add Stone Coat to your deck. The echo fades peacefully.',
        effect(state) { state.player.deck.push(makeCard('stone_coat')); },
      },
      {
        label: 'Leave a tribute',
        description: 'Gain 20 Gold — offerings left by others who passed through.',
        effect(state) { state.player.gold += 20; },
      },
    ],
  },

  {
    id: 'the_watcher',
    acts: [3], tone: 'neutral', position: 'any',
    title: 'The Watcher',
    text: 'Something observes you from the far end of the chamber. No shape — only presence, and the creeping cold it carries. It does not move. It simply watches.',
    choices: [
      {
        label: 'Acknowledge it (30 Gold, Slowed 2)',
        description: 'Gain 30 Gold. Gain Slowed 2 — draw 1 fewer card for 2 turns.',
        effect(state) {
          state.player.gold += 30;
          applyStatus(state.player, 'slowed', 2);
        },
      },
      {
        label: 'Ignore it (−8 HP)',
        description: 'Walk past. Lose 8 HP — it takes what it was owed anyway.',
        effect(state) { state.player.hp = Math.max(1, state.player.hp - 8); },
      },
      {
        label: 'Offer gold (−20 Gold, gain a relic)',
        description: 'Spend 20 Gold. Gain a random relic.',
        effect(state) {
          if (state.player.gold >= 20) {
            state.player.gold -= 20;
            const id = relicDropPool[Math.floor(Math.random() * relicDropPool.length)];
            state.player.relics.push(makeRelic(id));
          }
        },
      },
    ],
  },

  {
    id: 'temporal_loop',
    acts: [3], tone: 'negative', position: 'any',
    title: 'Temporal Loop',
    text: 'The room repeats. You have walked this corridor before — the same crack in the wall, the same dead torch. You are caught in a loop of fractured time. Fighting it tears at you. Accepting it settles like fog.',
    choices: [
      {
        label: 'Break free (−15 HP)',
        description: 'Force your way out. Lose 15 HP.',
        effect(state) { state.player.hp = Math.max(1, state.player.hp - 15); },
      },
      {
        label: 'Accept the loop (Numbing 4)',
        description: 'Stop fighting. Gain Numbing 4 — gain 4 Petrify at the start of your next four turns.',
        effect(state) { applyStatus(state.player, 'numbing', 4); },
      },
    ],
  },

  {
    id: 'ancient_prisoner',
    acts: [3], tone: 'neutral', position: 'late',
    title: 'The Ancient Prisoner',
    text: 'Someone was sealed into this chamber long before the dungeon had a name. She is half stone, half woman, and entirely aware. She says nothing — just holds out her hand, then points at you, then at the wall behind her.',
    choices: [
      {
        label: 'Break the seal (remove a Curse, +15 Petrify)',
        description: 'Remove a Curse from your deck. Gain 15 Petrify — the act of breaking stone resonates through you.',
        needsCardPick: { type: 'curse', label: 'Choose a Curse to destroy' },
        onPick(state, cardIndex) {
          state.player.deck.splice(cardIndex, 1);
          state.player.lastPetrifySource = { type: 'event', id: 'ancient_prisoner' };
          gainPetrify(state.player, 15);
        },
      },
      {
        label: 'Leave her (find 25 Gold in the rubble)',
        description: 'Gain 25 Gold.',
        effect(state) { state.player.gold += 25; },
      },
    ],
  },

];
