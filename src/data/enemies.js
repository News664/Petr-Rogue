import { applyDamage, applyBlock, gainPetrify } from '../systems/Effects.js';
import { applyStatus } from '../systems/StatusSystem.js';
import { addCardToDraw } from '../systems/DeckSystem.js';
import { makeCard } from './cards.js';

// ── Intent builders ───────────────────────────────────────────────────────────

const atk    = (label, dmg)   => ({ label, icon: '⚔️',  damage: dmg, action: (e, p) => applyDamage(p, dmg, e) });
const petr   = (label, amt)   => ({ label, icon: '🪨',  action: (e, p) => gainPetrify(p, amt) });
const blk    = (label, amt)   => ({ label, icon: '🛡️', action: (e)    => applyBlock(e, amt) });
const numb   = (label, stks)  => ({ label, icon: '🫧',  action: (e, p) => applyStatus(p, 'numbing', stks) });
const calc   = (label, stks)  => ({ label, icon: '⛏️', action: (e, p) => applyStatus(p, 'calcified', stks) });
const vuln   = (label, stks)  => ({ label, icon: '💔',  action: (e, p) => applyStatus(p, 'vulnerable', stks) });
const anchor = (label, stks)  => ({ label, icon: '⚓',  action: (e, p) => applyStatus(p, 'anchored', stks) });
const crumble= (label, stks)  => ({ label, icon: '💨',  action: (e, p) => applyStatus(p, 'crumbling', stks) });

const atkP   = (label, dmg, pt) => ({
  label, icon: '⚔️🪨', damage: dmg,
  // Petrify first so Stone Coat converts it to Block, which then absorbs the damage.
  action: (e, p) => { gainPetrify(p, pt); applyDamage(p, dmg, e); },
});

// Adds a status card to the draw pile mid-combat.
const addShard = (label) => ({
  label, icon: '💀',
  action: (e, p, state) => addCardToDraw(state.combat.deckState, makeCard('stone_shard')),
});

// ── Obsidian Sentinel phase-2 intents (defined before enemyDefs) ─────────────

const _sentinelP2 = [
  atkP('Petrify Slam 16+8', 16, 8),
  addShard('Stone Rains ×2'),     // placeholder — action replaced below
  anchor('Seal 2', 2),
  atk('Avalanche 26', 26),
  numb('Numb 5', 5),
  atk('Avalanche 26', 26),
  crumble('Crumble 4', 4),
];
// Stone Rains adds two shards (override the simple addShard helper)
_sentinelP2[1] = {
  label: 'Stone Rains ×2', icon: '💀',
  action(e, p, state) {
    addCardToDraw(state.combat.deckState, makeCard('stone_shard'));
    addCardToDraw(state.combat.deckState, makeCard('stone_shard'));
  },
};

// ── Enemy definitions ─────────────────────────────────────────────────────────

export const enemyDefs = {

  // ── Regular encounters ───────────────────────────────────────────────────

  stone_imp: {
    id: 'stone_imp', name: 'Stone Imp', maxHp: 22,
    intents: [atk('Strike 6', 6), petr('Petrify 3', 3)],
  },
  gravel_bat: {
    id: 'gravel_bat', name: 'Gravel Bat', maxHp: 18,
    intents: [atk('Scratch 4', 4), atk('Scratch 4', 4), numb('Numb 2', 2)],
  },
  rock_golem: {
    id: 'rock_golem', name: 'Rock Golem', maxHp: 52,
    intents: [blk('Fortify 8', 8), atk('Smash 12', 12), atk('Smash 14', 14)],
  },

  // ── Elites ───────────────────────────────────────────────────────────────

  marble_knight: {
    id: 'marble_knight', name: 'Marble Knight', maxHp: 78,
    intents: [
      blk('Guard 10', 10),
      atkP('Pet. Slash 10+4', 10, 4),
      addShard('Stone Curse'),          // adds a Stone Shard to draw pile
      atk('Heavy Strike 16', 16),
      numb('Numb 3', 3),
      atk('Heavy Strike 18', 18),
      addShard('Stone Curse'),          // second shard cycle
    ],
  },

  crystal_widow: {
    id: 'crystal_widow', name: 'Crystal Widow', maxHp: 55,
    intents: [
      vuln('Expose 2', 2),
      atk('Bite 10', 10),
      calc('Calcify 2', 2),
      crumble('Web 3', 3),              // Crumbling 3: block erodes each turn
      atk('Bite 12', 12),
      vuln('Expose 3', 3),               // strong Vulnerable to set up big Bite
    ],
  },

  petrified_warden: {
    id: 'petrified_warden', name: 'Petrified Warden', maxHp: 82,
    intents: [
      atk('Stone Fist 14', 14),
      anchor('Seal 2', 2),             // Anchored 2: blocks Petrify reduction for 2 turns
      atkP('Crush 12+6', 12, 6),
      petr('Stone Aura 8', 8),
      anchor('Seal 1', 1),
      atk('Stone Fist 16', 16),
    ],
  },

  // ── Boss ─────────────────────────────────────────────────────────────────

  obsidian_sentinel: {
    id: 'obsidian_sentinel', name: 'Obsidian Sentinel', maxHp: 125,
    intents: [
      blk('Barrier 12', 12),
      atk('Crush 18', 18),
      calc('Calcify 3', 3),
      atk('Crush 20', 20),
      atkP('Pet. Slam 12+5', 12, 5),
      numb('Numb 3', 3),
      // Phase trigger: if HP ≤ 50% when this fires, enter Phase 2.
      // Otherwise acts as a heavy defensive turn.
      {
        label: 'Monolith Rises',
        icon: '🌋',
        action(e, p, state) {
          if (!e._enraged && e.hp <= e.maxHp * 0.5) {
            e._enraged = true;
            e.intents   = _sentinelP2;
            e.intentIndex = 0;
            state.combat.log.push('💥 The Obsidian Sentinel AWAKENS — Phase 2!');
            if (state.combat.log.length > 40) state.combat.log.shift();
            state.combat.lastLog = state.combat.log.at(-1);
            // Phase 2 opens with the Petrify Slam immediately
          } else {
            applyBlock(e, 18);
          }
        },
      },
    ],
  },
};

// ── Encounter tables ──────────────────────────────────────────────────────────

export const combatEncounters = [
  ['stone_imp'],
  ['gravel_bat', 'gravel_bat'],
  ['rock_golem'],
  ['stone_imp', 'gravel_bat'],
  ['crystal_widow'],
];

export const eliteEncounters = [
  ['marble_knight'],
  ['petrified_warden'],
  ['crystal_widow', 'gravel_bat'],
  ['rock_golem', 'stone_imp'],
];

export const bossEncounters = [
  ['obsidian_sentinel'],
];

export function createEnemyInstance(id) {
  const d = enemyDefs[id];
  if (!d) throw new Error(`Unknown enemy id: ${id}`);
  return { ...d, hp: d.maxHp, block: 0, intentIndex: 0, statusEffects: {}, _enraged: false };
}
