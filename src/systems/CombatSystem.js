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
  state.combat = {
    enemies: enemyIds.map(createEnemyInstance),
    deckState: createDeckState(state.player.deck),
    energy: 3,
    maxEnergy: 3,
    turn: 0,
    phase: 'player',
    lastLog: '',
    log: [],
    activePowers: [],
  };
  triggerRelics('onCombatStart', state);
  for (const card of state.player.deck) {
    if (card.onCombatStart) card.onCombatStart(state);
  }
  return _startPlayerTurn(state);
}

export function playCard(state, handIndex, targetIndex = 0) {
  const { combat, player } = state;
  const card = combat.deckState.hand[handIndex];
  if (!card) return { ok: false, reason: 'invalid_card' };
  if (card.cost > combat.energy) return { ok: false, reason: 'no_energy' };

  combat.energy -= card.cost;
  const target = card.targetType === 'enemy' ? combat.enemies[targetIndex] : null;

  const petrifyBefore = player.petrify;
  const hpBefore      = target?.hp;
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

  const cause = checkDeathCause(player);
  if (cause) return { ok: true, event: 'game_over', cause };
  if (_checkVictory(combat)) return { ok: true, event: 'victory' };
  return { ok: true };
}

export function endPlayerTurn(state) {
  _log(state, '— End of your turn —');
  triggerRelics('onTurnEnd', state);
  discardHand(state.combat.deckState);
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
  player.block = 0;
  combat.energy = combat.maxEnergy;

  const petrifyBefore = player.petrify;
  tickPlayerStatuses(player);
  if (player.petrify > petrifyBefore) {
    _log(state, `Numbing: gained ${player.petrify - petrifyBefore} Petrify. (now ${player.petrify})`);
  }

  const cause = checkDeathCause(player);
  if (cause) return { event: 'game_over', cause };

  _log(state, `— Turn ${combat.turn} —`);
  drawCards(combat.deckState, 5, state);
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

    // HP-threshold phase transitions checked every turn (not only via intent).
    if (enemy.onPhaseCheck) enemy.onPhaseCheck(enemy, player, state);

    const intent     = enemy.intents[enemy.intentIndex];
    const hpBefore   = player.hp;
    const petrBefore = player.petrify;
    intent.action(enemy, player, state);
    enemy.intentIndex = (enemy.intentIndex + 1) % enemy.intents.length;

    let msg = `${enemy.name} used ${intent.label}.`;
    const dmg  = hpBefore - player.hp;
    const petr = player.petrify - petrBefore;
    if (dmg  > 0) msg += ` (${dmg} dmg to you)`;
    if (petr > 0) msg += ` (+${petr} Petrify)`;
    _log(state, msg);

    const cause = checkDeathCause(player);
    if (cause) return { event: 'game_over', cause };
  }

  if (_checkVictory(combat)) return { event: 'victory' };

  const turnResult = _startPlayerTurn(state);
  if (turnResult?.event === 'game_over') return turnResult;
  return { event: 'player_turn' };
}

function _triggerPowers(state, hookName, payload) {
  for (const power of (state.combat?.activePowers ?? [])) {
    if (power.hooks?.[hookName]) power.hooks[hookName](state, payload);
  }
}
