import { applyDamage, applyBlock, gainPetrify } from '../systems/Effects.js';
import { applyStatus } from '../systems/StatusSystem.js';
import { addCardToDraw, addCardToHand } from '../systems/DeckSystem.js';
import { makeCard } from './cards.js';

// ── Intent builders ─────────────────────────────────────────────────────────────────────────

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

const addShard  = (label) => ({
  label, icon: '💀',
  action: (e, p, state) => addCardToDraw(state.combat.deckState, makeCard('stone_shard')),
});
const addSliver = (label) => ({
  label, icon: '💎',
  action: (e, p, state) => addCardToHand(state.combat.deckState, makeCard('crystal_sliver'), state),
});
const slow     = (label, stks) => ({ label, icon: '⏳', action: (e, p) => applyStatus(p, 'slowed', stks) });
const addStasis = (label) => ({
  label, icon: '⌛',
  action: (e, p, state) => addCardToHand(state.combat.deckState, makeCard('stasis'), state),
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
  atkP('Reign of Stone 20+8', 20, 8),
  atk('Crushing Decree 26', 26),
  { label: 'Attune Edict', icon: '💎',
    action(e, p, state) {
      addCardToHand(state.combat.deckState, makeCard('crystal_sliver'), state);
      addCardToHand(state.combat.deckState, makeCard('crystal_sliver'), state);
    } },
  atkP('Final Judgment 18+10', 18, 10),
  petr('Royal Wrath 8 · direct', 8),
];

const _heartP2 = [
  atkP('Void Pulse 22+12', 22, 12),
  calc('Calcify All 6', 6),
  atk('Shatter World 35', 35),
  anchor('Eternal Bind 4', 4),
  { label: 'Void Rain', icon: '💀',
    action(e, p, state) {
      addCardToDraw(state.combat.deckState, makeCard('stone_shard'));
      addCardToDraw(state.combat.deckState, makeCard('stone_shard'));
      addCardToHand(state.combat.deckState, makeCard('stasis'), state);
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

// ── Enemy definitions ────────────────────────────────────────────────────────────────────────

export const enemyDefs = {

  // ── Act 1: The Surface Ruins ─────────────────────────────────────────────────

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

  // ── Act 2: The Deep Mines ──────────────────────────────────────────────────

  crystal_imp: {
    id: 'crystal_imp', name: 'Crystal Imp', maxHp: 30,
    intents: [petr('Crystal Sting 3 · direct', 3), atk('Scratch 7', 7), addShard('Shard Burst'), atk('Scratch 9', 9)],
  },
  crystal_horror: {
    id: 'crystal_horror', name: 'Crystal Horror', maxHp: 42,
    intents: [atk('Shard 5', 5), addSliver('Attune'), atk('Shard 6', 6), addShard('Shatter')],
  },
  void_golem: {
    id: 'void_golem', name: 'Void Golem', maxHp: 72,
    intents: [blk('Stone Shell 10', 10), atkP('Void Crush 12+4', 12, 4), anchor('Seal 2', 2), atk('Slam 18', 18)],
  },

  crystal_titan: {
    id: 'crystal_titan', name: 'Crystal Titan', maxHp: 110,
    intents: [
      blk('Reinforce 14', 14),
      atkP('Crystal Slam 14+5', 14, 5),
      addSliver('Attune Surge'),
      addShard('Shard Storm ×2'),
      atk('Titan Crush 22', 22),
    ],
  },
  stone_marauder: {
    id: 'stone_marauder', name: 'Stone Marauder', maxHp: 100,
    intents: [
      atkP('Crush 11+4', 11, 4),
      calc('Calcify 3', 3),
      petrifyPower('Deepen +2', 2),
      atkP('Deep Crush 13+5', 13, 5),
      petr('Stone Aura 6 · direct', 6),
    ],
  },

  stone_royal_guard: {
    id: 'stone_royal_guard', name: 'Stone Royal Guard', maxHp: 60,
    isSummon: true,
    intents: [blk('Shield Wall 12', 12), addSliver('Crystal Pulse'), atkP('Thorn Strike 7+3', 7, 3)],
  },
  petrified_king: {
    id: 'petrified_king', name: 'Petrified King', maxHp: 190,
    intents: [
      atkP('Kingly Blow 16+5', 16, 5),
      strengthen('Royal Wrath +3', 3),
      atk('Crushing Strike 20', 20),
      petr('Royal Decree 6 · direct', 6),
      calc('Calcify 3', 3),
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

  // ── Act 3: The Abyss — Staggering ────────────────────────────────────────────
  // Theme: enemies manipulate time, dragging fights out so they can grow
  // stronger. New mechanics: Slowed (fewer draws) and Stasis (retained
  // status card that inflates all non-status card costs while held).

  temporal_wraith: {
    id: 'temporal_wraith', name: 'Temporal Wraith', maxHp: 45,
    intents: [slow('Time Tear 2', 2), atk('Wraith Strike 8', 8), slow('Fade 1', 1), atk('Wraith Strike 10', 10)],
  },
  void_phantom: {
    id: 'void_phantom', name: 'Void Phantom', maxHp: 58,
    intents: [addStasis('Temporal Pulse'), atk('Phase Strike 9', 9), anchor('Void Bind 2', 2), atkP('Null Touch 8+4', 8, 4)],
  },
  abyss_crawler: {
    id: 'abyss_crawler', name: 'Abyss Crawler', maxHp: 88,
    intents: [blk('Crawl 12', 12), calc('Stone Seep 4', 4), strengthen('Ancient Power +2', 2), atk('Crush 20', 20)],
  },

  void_revenant: {
    id: 'void_revenant', name: 'Void Revenant', maxHp: 150,
    intents: [
      slow('Time Warp 2', 2),
      atkP('Void Slam 15+6', 15, 6),
      addStasis('Distort'),
      anchor('Void Bind 3', 3),
      atk('Judgment 24', 24),
    ],
  },
  ancient_colossus: {
    id: 'ancient_colossus', name: 'Ancient Colossus', maxHp: 165,
    intents: [
      blk('Stone Fortress 18', 18),
      calc('Petrify Deep 5', 5),
      atkP('Colossus Strike 18+8', 18, 8),
      crumble('Erode 5', 5),
      strengthen('Monument +3', 3),
    ],
  },

  stone_heart: {
    id: 'stone_heart', name: 'The Stone Heart', maxHp: 250,
    intents: [
      blk('Void Barrier 18', 18),
      atk('Heartbeat 22', 22),
      calc('Calcify 5', 5),
      atkP('Heart Crush 18+8', 18, 8),
      { label: 'Temporal Pulse', icon: '⌛',
        action(e, p, state) {
          addCardToHand(state.combat.deckState, makeCard('stasis'), state);
          applyStatus(p, 'slowed', 1);
        } },
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

// ── Encounter tables ────────────────────────────────────────────────────────────────────

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
  ['crystal_imp'],
  ['crystal_horror', 'crystal_imp'],
  ['void_golem'],
  ['crystal_horror', 'crystal_horror'],
  ['crystal_imp', 'crystal_imp', 'crystal_imp'],
  ['crystal_horror', 'void_golem'],
];

export const act2EliteEncounters = [
  ['crystal_titan'],
  ['stone_marauder'],
  ['crystal_titan', 'crystal_imp'],
];

export const act2BossEncounters = [
  ['stone_royal_guard', 'petrified_king', 'stone_royal_guard'],
];

export const act3CombatEncounters = [
  ['temporal_wraith'],
  ['void_phantom', 'temporal_wraith'],
  ['abyss_crawler'],
  ['temporal_wraith', 'temporal_wraith'],
  ['void_phantom', 'abyss_crawler'],
  ['temporal_wraith', 'temporal_wraith', 'void_phantom'],
];

export const act3EliteEncounters = [
  ['void_revenant'],
  ['ancient_colossus'],
  ['void_revenant', 'temporal_wraith'],
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
