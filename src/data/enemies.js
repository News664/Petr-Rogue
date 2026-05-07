import { applyDamage, applyBlock, gainPetrify } from '../systems/Effects.js';

function def(id, name, maxHp, intents) {
  return { id, name, maxHp, intents };
}

function atk(label, dmg) {
  return { label, icon: '⚔️', action: (_e, player) => applyDamage(player, dmg) };
}

function petrify(label, amt) {
  return { label, icon: '🪨', action: (_e, player) => gainPetrify(player, amt) };
}

function block(label, amt) {
  return { label, icon: '🛡️', action: (enemy) => applyBlock(enemy, amt) };
}

function atkPetrify(label, dmg, pt) {
  return {
    label, icon: '⚔️🪨',
    action: (_e, player) => { applyDamage(player, dmg); gainPetrify(player, pt); },
  };
}

// ── Enemy definitions ────────────────────────────────────────────────────────

export const enemyDefs = {
  stone_imp: def('stone_imp', 'Stone Imp', 22, [
    atk('Strike 6', 6),
    petrify('Petrify 2', 2),
  ]),

  gravel_bat: def('gravel_bat', 'Gravel Bat', 16, [
    atk('Scratch 4', 4),
    atk('Scratch 4', 4),
    petrify('Petrify 3', 3),
  ]),

  rock_golem: def('rock_golem', 'Rock Golem', 48, [
    block('Fortify 8', 8),
    atk('Smash 12', 12),
    atk('Smash 12', 12),
  ]),

  marble_knight: def('marble_knight', 'Marble Knight', 65, [
    block('Guard 12', 12),
    atkPetrify('Petrifying Slash 10+4', 10, 4),
    atk('Heavy Strike 16', 16),
    atkPetrify('Petrifying Slash 10+4', 10, 4),
  ]),

  obsidian_sentinel: def('obsidian_sentinel', 'Obsidian Sentinel', 90, [
    block('Barrier 15', 15),
    atk('Crush 18', 18),
    petrify('Calcify 8', 8),
    atk('Crush 18', 18),
    atkPetrify('Petrifying Slam 14+6', 14, 6),
  ]),
};

// ── Encounter tables ─────────────────────────────────────────────────────────

export const combatEncounters = [
  ['stone_imp'],
  ['gravel_bat', 'gravel_bat'],
  ['rock_golem'],
  ['stone_imp', 'gravel_bat'],
  ['stone_imp', 'stone_imp'],
];

export const eliteEncounters = [
  ['marble_knight'],
  ['rock_golem', 'stone_imp'],
];

export const bossEncounters = [
  ['obsidian_sentinel'],
];

export function createEnemyInstance(id) {
  const d = enemyDefs[id];
  if (!d) throw new Error(`Unknown enemy id: ${id}`);
  return { ...d, hp: d.maxHp, block: 0, intentIndex: 0 };
}
