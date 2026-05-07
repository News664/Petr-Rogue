import { applyDamage, applyBlock, gainPetrify } from '../systems/Effects.js';
import { applyStatus } from '../systems/StatusSystem.js';

// ── Intent builders ───────────────────────────────────────────────────────────

const atk   = (label, dmg)   => ({ label, icon: '⚔️',  action: (e, p) => applyDamage(p, dmg, e) });
const petr  = (label, amt)   => ({ label, icon: '🪨',  action: (e, p) => gainPetrify(p, amt) });
const blk   = (label, amt)   => ({ label, icon: '🛡️', action: (e)    => applyBlock(e, amt) });
const numb  = (label, stks)  => ({ label, icon: '🫧',  action: (e, p) => applyStatus(p, 'numbing', stks) });
const calc  = (label, stks)  => ({ label, icon: '⛏️', action: (e, p) => applyStatus(p, 'calcified', stks) });
const vuln  = (label, stks)  => ({ label, icon: '💔',  action: (e, p) => applyStatus(p, 'vulnerable', stks) });

const atkP  = (label, dmg, pt) => ({
  label, icon: '⚔️🪨',
  action: (e, p) => { applyDamage(p, dmg, e); gainPetrify(p, pt); },
});

// ── Enemy definitions ─────────────────────────────────────────────────────────

export const enemyDefs = {
  stone_imp: {
    id: 'stone_imp', name: 'Stone Imp', maxHp: 22,
    intents: [atk('Strike 6', 6), petr('Petrify 2', 2)],
  },
  gravel_bat: {
    id: 'gravel_bat', name: 'Gravel Bat', maxHp: 16,
    intents: [atk('Scratch 4', 4), atk('Scratch 4', 4), numb('Numb 2', 2)],
  },
  rock_golem: {
    id: 'rock_golem', name: 'Rock Golem', maxHp: 48,
    intents: [blk('Fortify 8', 8), atk('Smash 12', 12), atk('Smash 12', 12)],
  },
  marble_knight: {
    id: 'marble_knight', name: 'Marble Knight', maxHp: 65,
    intents: [
      blk('Guard 12', 12),
      atkP('Pet. Slash 10+4', 10, 4),
      atk('Heavy Strike 16', 16),
      numb('Numb 3', 3),
    ],
  },
  crystal_widow: {
    id: 'crystal_widow', name: 'Crystal Widow', maxHp: 38,
    intents: [vuln('Expose 2', 2), atk('Bite 8', 8), atk('Bite 8', 8), calc('Calcify 2', 2)],
  },
  obsidian_sentinel: {
    id: 'obsidian_sentinel', name: 'Obsidian Sentinel', maxHp: 95,
    intents: [
      blk('Barrier 15', 15),
      atk('Crush 20', 20),
      calc('Calcify 3', 3),
      atk('Crush 20', 20),
      atkP('Pet. Slam 14+6', 14, 6),
      numb('Numb 4', 4),
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
  ['rock_golem', 'stone_imp'],
  ['crystal_widow', 'gravel_bat'],
];

export const bossEncounters = [
  ['obsidian_sentinel'],
];

export function createEnemyInstance(id) {
  const d = enemyDefs[id];
  if (!d) throw new Error(`Unknown enemy id: ${id}`);
  return { ...d, hp: d.maxHp, block: 0, intentIndex: 0, statusEffects: {} };
}
