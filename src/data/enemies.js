import { applyDamage, applyBlock, gainPetrify } from '../systems/Effects.js';
import { applyStatus } from '../systems/StatusSystem.js';
import { addCardToDraw } from '../systems/DeckSystem.js';
import { makeCard } from './cards.js';

// ── Intent builders ───────────────────────────────────────────────────────────

const atk      = (label, dmg)   => ({ label, icon: '⚔️',  damage: dmg, action: (e, p) => applyDamage(p, dmg, e) });
const petr     = (label, amt)   => ({ label, icon: '🪨',  action: (e, p) => gainPetrify(p, amt, e) });
const blk      = (label, amt)   => ({ label, icon: '🛡️', action: (e)    => applyBlock(e, amt) });
const numb     = (label, stks)  => ({ label, icon: '🫧',  action: (e, p) => applyStatus(p, 'numbing', stks) });
const calc     = (label, stks)  => ({ label, icon: '⛏️', action: (e, p) => applyStatus(p, 'calcified', stks) });
const vuln     = (label, stks)  => ({ label, icon: '💔',  action: (e, p) => applyStatus(p, 'vulnerable', stks) });
const wkn      = (label, stks)  => ({ label, icon: '🩸',  action: (e, p) => applyStatus(p, 'weak', stks) });
const anchor   = (label, stks)  => ({ label, icon: '⚓',  action: (e, p) => applyStatus(p, 'anchored', stks) });
const crumble  = (label, stks)  => ({ label, icon: '💨',  action: (e, p) => applyStatus(p, 'crumbling', stks) });
const strengthen    = (label, amt) => ({ label, icon: '💪', action: (e) => { e._strength     = (e._strength     || 0) + amt; } });
const petrifyPower  = (label, amt) => ({ label, icon: '🔥', action: (e) => { e._petrifyPower = (e._petrifyPower || 0) + amt; } });

const atkP = (label, dmg, pt) => ({
  label, icon: '⚔️🪨', damage: dmg,
  // Petrify first so Stone Coat converts it to Block, which then absorbs the damage.
  action: (e, p) => { gainPetrify(p, pt, e); applyDamage(p, dmg, e); },
});

const addShard = (label) => ({
  label, icon: '💀',
  action: (e, p, state) => addCardToDraw(state.combat.deckState, makeCard('stone_shard')),
});

function _log(state, msg) {
  state.combat.log.push(msg);
  if (state.combat.log.length > 40) state.combat.log.shift();
  state.combat.lastLog = state.combat.log.at(-1);
}

// ── Phase-2/3 arrays (defined before enemyDefs so closures can reference them) ─

const _sentinelP2 = [
  atkP('Petrify Slam 16+8', 16, 8),
  { label: 'Stone Rains ×2', icon: '💀',
    action(e, p, state) {
      addCardToDraw(state.combat.deckState, makeCard('stone_shard'));
      addCardToDraw(state.combat.deckState, makeCard('stone_shard'));
    } },
  anchor('Seal 2', 2),
  atk('Avalanche 22', 22),
  numb('Numb 4', 4),
  atk('Avalanche 22', 22),
  petr('Void Tremor 6 · direct', 6),
];

const _kingP2 = [
  atkP('Reign of Stone 20+10', 20, 10),
  anchor('Iron Will 3', 3),
  atk('Crushing Decree 30', 30),
  calc('Royal Calcify 4', 4),
  { label: 'Stone Edict', icon: '💀',
    action(e, p, state) {
      addCardToDraw(state.combat.deckState, makeCard('stone_shard'));
      addCardToDraw(state.combat.deckState, makeCard('stone_shard'));
      gainPetrify(p, 6);
    } },
  atk('Crushing Decree 32', 32),
  crumble('Crumble 5', 5),
];

const _heartP2 = [
  atkP('Void Pulse 22+12', 22, 12),
  calc('Calcify All 6', 6),
  atk('Shatter World 35', 35),
  anchor('Eternal Bind 4', 4),
  { label: 'Void Rain', icon: '💀',
    action(e, p, state) {
      for (let i = 0; i < 3; i++) addCardToDraw(state.combat.deckState, makeCard('stone_shard'));
      gainPetrify(p, 8);
    } },
  numb('Deep Drain 6', 6),
  { label: 'Phase Shift II', icon: '🌑',
    action(e, p, state) {
      if (!e._phase2done && e.hp <= e.maxHp * 0.33) {
        e._phase2done = true;
        e.intents = _heartP3;
        e.intentIndex = 0;
        _log(state, '🌑 The Stone Heart CRACKS — Phase 3!');
      } else {
        applyBlock(e, 24);
      }
    } },
];

const _heartP3 = [
  atkP('Final Reckoning 28+15', 28, 15),
  crumble('Void Crumble 6', 6),
  atk('World Ender 45', 45),
  calc('Calcify Soul 7', 7),
  anchor('Eternal Bind 5', 5),
  atk('World Ender 48', 48),
  { label: 'Petrify Pulse', icon: '🌑',
    action(e, p) { gainPetrify(p, 15); applyDamage(p, 15, e); } },
];

// ── Enemy definitions ─────────────────────────────────────────────────────────

export const enemyDefs = {

  // ── Act 1: The Surface Ruins ─────────────────────────────────────────────

  stone_imp: {
    id: 'stone_imp', name: 'Stone Imp', maxHp: 22,
    intents: [atk('Strike 6', 6), petr('Petrify 3 · direct', 3)],
  },
  gravel_bat: {
    id: 'gravel_bat', name: 'Gravel Bat', maxHp: 18,
    intents: [atk('Scratch 4', 4), atk('Scratch 4', 4), numb('Numb 2', 2)],
  },
  rock_golem: {
    id: 'rock_golem', name: 'Rock Golem', maxHp: 52,
    intents: [blk('Fortify 8', 8), atk('Smash 12', 12), atk('Smash 14', 14)],
  },
  crystal_widow: {
    id: 'crystal_widow', name: 'Crystal Widow', maxHp: 38,
    intents: [atk('Bite 9', 9), wkn('Weaken 2', 2), numb('Drain 2', 2), atk('Bite 11', 11)],
  },

  marble_knight: {
    id: 'marble_knight', name: 'Marble Knight', maxHp: 78,
    intents: [
      wkn('Weaken 2', 2),
      atk('Heavy Strike 14', 14),
      strengthen('Stone Ritual +2', 2),
      atkP('Pet. Slash 12+4', 12, 4),
      addShard('Stone Curse'),
    ],
  },
  petrified_warden: {
    id: 'petrified_warden', name: 'Petrified Warden', maxHp: 82,
    intents: [
      anchor('Seal 2', 2),
      atkP('Crush 10+5', 10, 5),
      petrifyPower('Deepen +2', 2),
      petr('Stone Aura 6 · direct', 6),
      atk('Stone Fist 14', 14),
    ],
  },

  obsidian_sentinel: {
    id: 'obsidian_sentinel', name: 'Obsidian Sentinel', maxHp: 125,
    intents: [
      blk('Barrier 12', 12),
      atk('Crush 18', 18),
      calc('Calcify 3', 3),
      atk('Crush 20', 20),
      atkP('Pet. Slam 12+5', 12, 5),
      strengthen('Monolith Grows +3', 3),
    ],
    onPhaseCheck(e, p, state) {
      if (!e._enraged && e.hp <= e.maxHp * 0.5) {
        e._enraged = true;
        e.intents = _sentinelP2;
        e.intentIndex = 0;
        _log(state, '💥 The Obsidian Sentinel AWAKENS — Phase 2!');
      }
    },
  },

  // ── Act 2: The Deep Mines ─────────────────────────────────────────────────

  magma_imp: {
    id: 'magma_imp', name: 'Magma Imp', maxHp: 34,
    intents: [atk('Scorch 8', 8), calc('Calcify 2', 2), atk('Scorch 10', 10), atkP('Burn 7+3', 7, 3)],
  },
  crystal_horror: {
    id: 'crystal_horror', name: 'Crystal Horror', maxHp: 30,
    intents: [atk('Shard 5', 5), atk('Shard 5', 5), vuln('Expose 2', 2), atk('Shard 6', 6), addShard('Shatter')],
  },
  void_golem: {
    id: 'void_golem', name: 'Void Golem', maxHp: 72,
    intents: [blk('Shell 10', 10), atk('Slam 16', 16), numb('Drain 3', 3), atk('Slam 18', 18)],
  },

  crystal_titan: {
    id: 'crystal_titan', name: 'Crystal Titan', maxHp: 120,
    intents: [
      blk('Reinforce 12', 12),
      atkP('Crystal Slam 14+5', 14, 5),
      addShard('Shatter ×2'),
      calc('Calcify 3', 3),
      atk('Titan Crush 22', 22),
      blk('Reinforce 14', 14),
      atkP('Crystal Slam 16+6', 16, 6),
    ],
  },
  molten_knight: {
    id: 'molten_knight', name: 'Molten Knight', maxHp: 105,
    intents: [
      atkP('Magma Strike 12+4', 12, 4),
      calc('Calcify 4', 4),
      atk('Molten Blade 18', 18),
      numb('Heat 4', 4),
      atkP('Magma Strike 14+5', 14, 5),
      vuln('Scorch 2', 2),
      atk('Molten Blade 20', 20),
    ],
  },

  petrified_king: {
    id: 'petrified_king', name: 'Petrified King', maxHp: 180,
    intents: [
      blk('Royal Guard 16', 16),
      atk('Kingly Blow 20', 20),
      calc('Calcify 4', 4),
      atkP('Stone Fist 16+6', 16, 6),
      numb('Reign 4', 4),
      atk('Kingly Blow 22', 22),
      strengthen('Royal Wrath +3', 3),
    ],
    onPhaseCheck(e, p, state) {
      if (!e._enraged && e.hp <= e.maxHp * 0.5) {
        e._enraged = true;
        e.intents = _kingP2;
        e.intentIndex = 0;
        _log(state, '👑 The Petrified King rises from his throne — Phase 2!');
      }
    },
  },

  // ── Act 3: The Abyss ─────────────────────────────────────────────────────

  void_stalker: {
    id: 'void_stalker', name: 'Void Stalker', maxHp: 42,
    intents: [atk('Rend 7', 7), atk('Rend 7', 7), numb('Drain 4', 4), vuln('Tear 2', 2), atk('Rend 9', 9)],
  },
  ancient_revenant: {
    id: 'ancient_revenant', name: 'Ancient Revenant', maxHp: 40,
    intents: [anchor('Bind 2', 2), atk('Haunt 12', 12), blk('Coalesce 8', 8), atkP('Drain 10+4', 10, 4)],
  },
  null_monolith: {
    id: 'null_monolith', name: 'Null Monolith', maxHp: 95,
    intents: [blk('Void Shell 14', 14), calc('Calcify 4', 4), numb('Drain 5', 5), atk('Void Slam 22', 22), crumble('Erode 4', 4)],
  },

  void_colossus: {
    id: 'void_colossus', name: 'Void Colossus', maxHp: 148,
    intents: [
      atkP('Void Crush 18+7', 18, 7),
      numb('Drain 5', 5),
      atk('Colossus Slam 26', 26),
      calc('Deep Calcify 5', 5),
      anchor('Void Bind 3', 3),
      atk('Colossus Slam 28', 28),
      crumble('Crumble 5', 5),
    ],
  },
  ancient_warden: {
    id: 'ancient_warden', name: 'Ancient Warden', maxHp: 135,
    intents: [
      anchor('Ancient Seal 3', 3),
      atkP('Primal Strike 15+8', 15, 8),
      calc('Petrify Deep 5', 5),
      atk('Warden Blow 24', 24),
      numb('Ancient Drain 5', 5),
      blk('Stone Veil 16', 16),
      atk('Warden Blow 26', 26),
    ],
  },

  stone_heart: {
    id: 'stone_heart', name: 'The Stone Heart', maxHp: 250,
    intents: [
      blk('Void Barrier 18', 18),
      atk('Heartbeat 22', 22),
      calc('Calcify 5', 5),
      atkP('Heart Crush 18+8', 18, 8),
      numb('Drain 5', 5),
      atk('Heartbeat 25', 25),
      strengthen('Pulse +3', 3),
    ],
    onPhaseCheck(e, p, state) {
      if (!e._enraged && e.hp <= e.maxHp * 0.66) {
        e._enraged = true;
        e.intents = _heartP2;
        e.intentIndex = 0;
        _log(state, '🌑 The Stone Heart pulses — Phase 2!');
      }
    },
  },
};

// ── Encounter tables ──────────────────────────────────────────────────────────

export const combatEncounters = [
  ['stone_imp'],
  ['gravel_bat', 'gravel_bat'],
  ['rock_golem'],
  ['stone_imp', 'gravel_bat'],
];

export const eliteEncounters = [
  ['marble_knight'],
  ['petrified_warden'],
  ['rock_golem', 'stone_imp'],
];

export const bossEncounters = [
  ['obsidian_sentinel'],
];

export const act2CombatEncounters = [
  ['magma_imp'],
  ['crystal_horror', 'magma_imp'],
  ['void_golem'],
  ['crystal_horror', 'crystal_horror'],
  ['magma_imp', 'void_golem'],
];

export const act2EliteEncounters = [
  ['crystal_titan'],
  ['molten_knight'],
  ['void_golem', 'crystal_horror'],
];

export const act2BossEncounters = [
  ['petrified_king'],
];

export const act3CombatEncounters = [
  ['void_stalker'],
  ['ancient_revenant', 'void_stalker'],
  ['null_monolith'],
  ['void_stalker', 'void_stalker'],
  ['ancient_revenant', 'null_monolith'],
];

export const act3EliteEncounters = [
  ['void_colossus'],
  ['ancient_warden'],
  ['void_colossus', 'void_stalker'],
];

export const act3BossEncounters = [
  ['stone_heart'],
];

export function getEncounters(type, act) {
  const tables = {
    0: { combat: combatEncounters,      elite: eliteEncounters,      boss: bossEncounters      },
    1: { combat: act2CombatEncounters,  elite: act2EliteEncounters,  boss: act2BossEncounters  },
    2: { combat: act3CombatEncounters,  elite: act3EliteEncounters,  boss: act3BossEncounters  },
  };
  return (tables[act] ?? tables[0])[type] ?? combatEncounters;
}

export function createEnemyInstance(id) {
  const d = enemyDefs[id];
  if (!d) throw new Error(`Unknown enemy id: ${id}`);
  return { ...d, hp: d.maxHp, block: 0, intentIndex: 0, statusEffects: {}, _enraged: false, _phase2done: false, _strength: 0, _petrifyPower: 0 };
}
