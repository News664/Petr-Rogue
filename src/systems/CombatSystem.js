import { checkDeathCause } from '../state/Player.js';
import { createDeckState, drawCards, discardCard, discardHand, exhaustCard } from './DeckSystem.js';
import { triggerRelics } from './RelicSystem.js';
import { tickPlayerStatuses, tickEnemyStatuses } from './StatusSystem.js';
import { createEnemyInstance } from '../data/enemies.js';

export function startCombat(state, enemyIds) {
  state.player.block = 0;
  state.combat = {
    enemies: enemyIds.map(createEnemyInstance),
    deckState: createDeckState(state.player.deck),
    energy: state.player.relics.some(r => r.id === 'brittle_core') ? 4 : 3,
    maxEnergy: 3,
    turn: 0,
    phase: 'player',
    lastLog: '',
    activePowers: [],
  };
  triggerRelics('onCombatStart', state);
  _startPlayerTurn(state);
}

export function playCard(state, handIndex, targetIndex = 0) {
  const { combat, player } = state;
  const card = combat.deckState.hand[handIndex];
  if (!card) return { ok: false, reason: 'invalid_card' };
  if (card.cost > combat.energy) return { ok: false, reason: 'no_energy' };

  combat.energy -= card.cost;
  const target = card.targetType === 'enemy' ? combat.enemies[targetIndex] : null;
  card.effect(state, target);
  combat.lastLog = `Played ${card.name}.`;

  if (card.exhaust) exhaustCard(combat.deckState, handIndex);
  else              discardCard(combat.deckState, handIndex);

  triggerRelics('onCardPlayed', state, { card });
  _triggerPowers(state, 'onCardPlayed', { card });

  const cause = checkDeathCause(player);
  if (cause) return { ok: true, event: 'game_over', cause };
  if (combat.enemies.every(e => e.hp <= 0)) return { ok: true, event: 'victory' };
  return { ok: true };
}

export function endPlayerTurn(state) {
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

  tickPlayerStatuses(player);

  // Check death from Numbing tick before drawing cards
  const cause = checkDeathCause(player);
  if (cause) return { event: 'game_over', cause };

  drawCards(combat.deckState, 5);
  triggerRelics('onTurnStart', state);
  _triggerPowers(state, 'onTurnStart', {});
}

function _runEnemyTurn(state) {
  const { combat, player } = state;
  combat.phase = 'enemy';

  for (const enemy of combat.enemies) {
    if (enemy.hp <= 0) continue;
    enemy.block = 0;
    tickEnemyStatuses(enemy);

    const intent = enemy.intents[enemy.intentIndex];
    combat.lastLog = `${enemy.name}: ${intent.label}`;
    intent.action(enemy, player, state);
    enemy.intentIndex = (enemy.intentIndex + 1) % enemy.intents.length;

    const cause = checkDeathCause(player);
    if (cause) return { event: 'game_over', cause };
  }

  if (combat.enemies.every(e => e.hp <= 0)) return { event: 'victory' };

  _startPlayerTurn(state);
  return { event: 'player_turn' };
}

function _triggerPowers(state, hookName, payload) {
  for (const power of (state.combat?.activePowers ?? [])) {
    if (power.hooks?.[hookName]) power.hooks[hookName](state, payload);
  }
}
