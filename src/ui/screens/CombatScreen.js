import { GameState } from '../../state/GameState.js';
import { startCombat, playCard, endPlayerTurn } from '../../systems/CombatSystem.js';
import { renderHUD } from '../components/HUD.js';
import { renderEnemy } from '../components/EnemyView.js';
import { navigate } from '../../router.js';

let _container = null;
let _selectedHandIndex = null;
let _source = 'combat'; // 'combat' | 'elite' | 'boss'

export const CombatScreen = {
  init(el, { enemyIds, source = 'combat' }) {
    _container = el;
    _selectedHandIndex = null;
    _source = source;
    const startResult = startCombat(GameState, enemyIds);
    if (startResult?.event === 'game_over') { _handleResult(startResult); return; }
    _render();
  },
  teardown() { _container = null; _selectedHandIndex = null; },
};

function _render() {
  const { player, combat } = GameState;
  const { enemies, deckState, energy, maxEnergy, log, activePowers } = combat;

  const TYPE_COLOR = { attack: 'var(--card-attack)', skill: 'var(--card-skill)', power: 'var(--card-power)' };
  // Show last 7 log entries, oldest at top, newest at bottom
  const logEntries = log.slice(-7);

  _container.innerHTML = `
    <div class="combat-screen">
      <div class="combat-main">
        <div class="enemies-area">
          ${enemies.map((e, i) => renderEnemy(e, i)).join('')}
        </div>
        ${renderHUD(player)}
        <div class="energy-bar">
          <span class="energy-display">⚡ ${energy} / ${maxEnergy}</span>
          ${activePowers.length ? activePowers.map(p => `<span class="power-badge">${p.name}</span>`).join('') : ''}
        </div>
        <div class="hand-area">
          ${deckState.hand.map((card, i) => {
            const disabled = card.cost > energy;
            const selected = i === _selectedHandIndex;
            const color    = TYPE_COLOR[card.type] ?? 'var(--border)';
            return `
              <div class="card${disabled ? ' card-disabled' : ''}${selected ? ' card-selected' : ''}"
                   data-index="${i}" style="--card-color:${color}">
                <div class="card-cost">${card.cost}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-type">${card.type}</div>
                <div class="card-desc">${card.description}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="combat-actions">
          <button id="end-turn">End Turn</button>
          <span class="deck-counts">Draw: ${deckState.draw.length} · Discard: ${deckState.discard.length} · Exhaust: ${deckState.exhaust.length}</span>
        </div>
      </div>
      <div class="battle-log" id="battle-log">
        <div class="battle-log-title">Battle Log</div>
        <div class="battle-log-entries" id="log-entries">
          ${logEntries.map((e, i) => `<div class="log-entry${i === logEntries.length - 1 ? ' log-latest' : ''}">${e}</div>`).join('')}
        </div>
      </div>
    </div>
  `;

  _attachEvents();
  // Scroll log to bottom so most recent entry is always visible
  const logEl = _container.querySelector('#log-entries');
  if (logEl) logEl.scrollTop = logEl.scrollHeight;
}

function _attachEvents() {
  _container.querySelectorAll('.card:not(.card-disabled)').forEach(el => {
    el.addEventListener('click', () => _onCardClick(Number(el.dataset.index)));
  });
  _container.querySelectorAll('.enemy:not(.dead)').forEach(el => {
    el.addEventListener('click', () => _onEnemyClick(Number(el.dataset.index)));
  });
  _container.querySelector('#end-turn')?.addEventListener('click', _onEndTurn);
}

function _onCardClick(index) {
  const card = GameState.combat.deckState.hand[index];
  if (!card) return;
  if (_selectedHandIndex === index) { _selectedHandIndex = null; _render(); return; }

  if (card.targetType === 'none') {
    _handleResult(playCard(GameState, index));
  } else {
    _selectedHandIndex = index;
    _render();
    _container.querySelectorAll('.enemy:not(.dead)').forEach(el => el.classList.add('targetable'));
  }
}

function _onEnemyClick(targetIndex) {
  if (_selectedHandIndex === null) return;
  const idx = _selectedHandIndex;
  _selectedHandIndex = null;
  _handleResult(playCard(GameState, idx, targetIndex));
}

function _onEndTurn() {
  _selectedHandIndex = null;
  _handleResult(endPlayerTurn(GameState));
}

function _handleResult(result) {
  if (!result) { _render(); return; }
  if (result.event === 'game_over')  _showGameOver(result.cause);
  else if (result.event === 'victory') _onVictory();
  else _render();
}

function _onVictory() {
  if (_source === 'boss') {
    _showRunVictory();
  } else {
    navigate('RewardScreen', { source: _source });
  }
}

function _showGameOver(cause) {
  const msg = {
    hp:      { title: 'You Died',          body: 'Your wounds proved fatal. The dungeon claims another soul.' },
    petrify: { title: 'Fully Petrified',   body: 'Stone crept through your veins until nothing remained but a silent statue. You will stand here forever, deep beneath the earth.' },
  };
  const { title, body } = msg[cause] ?? msg.hp;
  _container.innerHTML = `
    <div class="game-over">
      <h1>${title}</h1>
      <p>${body}</p>
      <button id="restart">Return to Menu</button>
    </div>`;
  _container.querySelector('#restart').addEventListener('click', () => location.reload());
}

function _showRunVictory() {
  _container.innerHTML = `
    <div class="victory-screen">
      <h1>Victory!</h1>
      <p>The Obsidian Sentinel shatters. Stone dust fills the air. You have survived the depths — for now.</p>
      <button id="restart">Return to Menu</button>
    </div>`;
  _container.querySelector('#restart').addEventListener('click', () => location.reload());
}
