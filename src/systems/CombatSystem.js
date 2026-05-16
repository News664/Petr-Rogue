// ── CombatSystem.js ───────────────────────────────────────────────────────────
// Turn-based combat orchestration: start combat, play cards, run enemy turns.
//
// Exports:
//   startCombat(state, enemyIds) → result
//   playCard(state, handIndex, targetIndex?) → { ok, event?, cause?, reason? }
//   endPlayerTurn(state) → result
//   getEnemyIntent(enemy) → intent object
//
// Result events: 'player_turn' | 'victory' | 'game_over' (+ cause)
//
// Turn start order (_startPlayerTurn):
//   1. Reset block and energy
//   2. tickPlayerStatuses — Numbing fires here (adds Petrify)
//   3. checkDeathCause — death from status Petrify gain
//   4. Draw 5 cards (4 if Slowed) — Stone Shard / Stone Debt draw hooks fire
//   5. triggerRelics('onTurnStart') — Stone Hunger energy, Petrify Shroud block, etc.
//
// Torpor: blocks playing a 3rd card per turn when in hand.
// Stasis: non-status cards in hand cost +1 per Stasis card (max 3).
// Phase transitions: captured intent executes BEFORE onPhaseCheck takes effect
//   so that bosses don't blindside players with unannounced phase-opener attacks.
// ─────────────────────────────────────────────────────────────────────────────

import { checkDeathCause } from '../state/Player.js';
import { createDeckState, drawCards, discardCard, discardHand, exhaustCard } from './DeckSystem.js';
import { triggerRelics } from './RelicSystem.js';
import { tickPlayerStatuses, tickEnemyStatuses, tickCrumblingOnEnemyTurn } from './StatusSystem.js';
import { createEnemyInstance } from '../data/enemies.js';

const LOG_LIMIT = 40;

function _log(state, msg) {
  state.combat.log.push(msg);
  if (state.combat.log.length > LOG_LIMIT) state.combat.log.shift();
  state.combat.lastLog = msg;
}

// Summons (e.g. Stone Royal Guard) flee when all non-summon enemies are dead.
function _checkVictory(combat) {
  const principals = combat.enemies.filter(e => !e.isSummon);
  if (principals.length > 0 && principals.every(e => e.hp <= 0)) {
    for (const e of combat.enemies) e.hp = 0; // summons flee
    return true;
  }
  return combat.enemies.every(e => e.hp <= 0);
}

export function startCombat(state, enemyIds) {
  state.player.block = 0;
  state.player.statusEffects = {};
  state.player.lastPetrifySource = null;
  if (!state.enemiesDefeated) state.enemiesDefeated = 0;
  state.combat = {
    enemies: enemyIds.map((id, i) => {
      const e = createEnemyInstance(id);
      // Stagger same-type enemies so they don't act in unison every turn.
      if (i > 0) e.intentIndex = i % e.intents.length;
      return e;
    }),
    deckState: createDeckState(state.player.deck),
    energy: 3,
    maxEnergy: 3,
    turn: 0,
    phase: 'player',
    lastLog: '',
    log: [],
    activePowers: [],
    cardsPlayedThisTurn: 0,
    lastEnemyAttacker: null,
  };
  triggerRelics('onCombatStart', state);
  for (const card of state.player.deck) {
    if (card.onCombatStart) card.onCombatStart(state);
  }
  return _startPlayerTurn(state);
}

// Non-status cards cost +1 per Stasis card in hand, capped at 3.
function _effectiveCost(card, hand) {
  if (card.isStatus || card.isCurse) return card.cost;
  const stasis = hand.filter(c => c.id === 'stasis').length;
  return Math.min(3, card.cost + stasis);
}

// Returns true if Torpor in hand blocks playing another card this turn.
function _torporBlocked(hand, cardsPlayedThisTurn) {
  const hasTorpor = hand.some(c => c.id === 'torpor');
  return hasTorpor && cardsPlayedThisTurn >= 2;
}

export function playCard(state, handIndex, targetIndex = 0) {
  const { combat, player } = state;
  const card = combat.deckState.hand[handIndex];
  if (!card) return { ok: false, reason: 'invalid_card' };
  if (card.unplayable) return { ok: false, reason: 'unplayable' };
  if (_torporBlocked(combat.deckState.hand, combat.cardsPlayedThisTurn)) {
    return { ok: false, reason: 'torpor_limit' };
  }
  const effectiveCost = _effectiveCost(card, combat.deckState.hand);
  if (effectiveCost > combat.energy) return { ok: false, reason: 'no_energy' };

  combat.energy -= effectiveCost;
  combat.cardsPlayedThisTurn++;
  const target = card.targetType === 'enemy' ? combat.enemies[targetIndex] : null;

  const petrifyBefore = player.petrify;
  const hpBefore      = target?.hp;
  player.lastPetrifySource = { type: 'self', id: card.id };
  card.effect(state, target);

  let msg = `You played ${card.name}.`;
  if (target && hpBefore !== undefined) {
    const dmgDealt = hpBefore - Math.max(0, target.hp);
    if (dmgDealt > 0) msg += ` (${dmgDealt} dmg to ${target.name})`;
  }
  if (player.petrify !== petrifyBefore) {
    const delta = player.petrify - petrifyBefore;
    msg += delta > 0 ? ` (+${delta} Petrify)` : ` (${delta} Petrify)`;
  }
  _log(state, msg);

  // Power cards vanish (become the active effect); others exhaust or discard.
  const newIdx = combat.deckState.hand.indexOf(card);
  if (newIdx !== -1) {
    if (card.type === 'power') combat.deckState.hand.splice(newIdx, 1);
    else if (card.exhaust)    exhaustCard(combat.deckState, newIdx);
    else                      discardCard(combat.deckState, newIdx);
  }

  triggerRelics('onCardPlayed', state, { card });
  _triggerPowers(state, 'onCardPlayed', { card });

  const cause = checkDeathCause(player, combat);
  if (cause) return { ok: true, event: 'game_over', cause };
  if (_checkVictory(combat)) {
    state.enemiesDefeated += combat.enemies.filter(e => !e.isSummon).length;
    return { ok: true, event: 'victory' };
  }
  return { ok: true };
}

export function endPlayerTurn(state) {
  _log(state, '— End of your turn —');
  triggerRelics('onTurnEnd', state);
  discardHand(state.combat.deckState, state);
  return _runEnemyTurn(state);
}

export function getEnemyIntent(enemy) {
  return enemy.intents[enemy.intentIndex];
}

// ── Internal ─────────────────────────────────────────────────────────────────

function _startPlayerTurn(state) {
  const { combat, player } = state;
  combat.phase = 'player';
  combat.turn++;
  combat.cardsPlayedThisTurn = 0;
  player.block = 0;
  combat.energy = combat.maxEnergy;

  const petrifyBefore = player.petrify;
  tickPlayerStatuses(player, state);
  if (player.petrify > petrifyBefore) {
    _log(state, `Numbing: gained ${player.petrify - petrifyBefore} Petrify. (now ${player.petrify})`);
  }

  const cause = checkDeathCause(player, combat);
  if (cause) return { event: 'game_over', cause };

  _log(state, `— Turn ${combat.turn} —`);
  const slowed = player.statusEffects?.slowed ?? 0;
  drawCards(combat.deckState, 5 - (slowed > 0 ? 1 : 0), state);
  triggerRelics('onTurnStart', state);
  _triggerPowers(state, 'onTurnStart', {});
}

function _runEnemyTurn(state) {
  const { combat, player } = state;
  combat.phase = 'enemy';

  // Crumbling bites into block the player built this turn.
  tickCrumblingOnEnemyTurn(player);

  for (const enemy of combat.enemies) {
    if (enemy.hp <= 0) continue;
    enemy.block = 0;
    tickEnemyStatuses(enemy);

    // Capture intent BEFORE phase check so the transition takes effect next turn,
    // not mid-action (which would blindside the player with an unannounced move).
    const intent     = enemy.intents[enemy.intentIndex];
    if (enemy.onPhaseCheck) enemy.onPhaseCheck(enemy, player, state);
    const hpBefore   = player.hp;
    const petrBefore = player.petrify;
    combat.lastEnemyAttacker = { id: enemy.id, name: enemy.name, isBoss: enemy.isBoss ?? false };
    player.lastPetrifySource = { type: 'enemy', id: enemy.id };
    intent.action(enemy, player, state);
    enemy.intentIndex = (enemy.intentIndex + 1) % enemy.intents.length;

    let msg = `${enemy.name} used ${intent.label}.`;
    const dmg  = hpBefore - player.hp;
    const petr = player.petrify - petrBefore;
    if (dmg  > 0) msg += ` (${dmg} dmg to you)`;
    if (petr > 0) msg += ` (+${petr} Petrify)`;
    _log(state, msg);

    const cause = checkDeathCause(player, combat);
    if (cause) return { event: 'game_over', cause };
  }

  if (_checkVictory(combat)) {
    state.enemiesDefeated += combat.enemies.filter(e => !e.isSummon).length;
    return { event: 'victory' };
  }

  const turnResult = _startPlayerTurn(state);
  if (turnResult?.event === 'game_over') return turnResult;
  return { event: 'player_turn' };
}

function _triggerPowers(state, hookName, payload) {
  for (const power of (state.combat?.activePowers ?? [])) {
    if (power.hooks?.[hookName]) power.hooks[hookName](state, payload);
  }
}
