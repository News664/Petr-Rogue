import { GameState } from '../../state/GameState.js';
import { startCombat, playCard, endPlayerTurn } from '../../systems/CombatSystem.js';
import { renderHUD } from '../components/HUD.js';
import { renderCard } from '../components/CardView.js';
import { renderEnemy } from '../components/EnemyView.js';
import { navigate } from '../../router.js';

let _container = null;
let _selectedHandIndex = null;

export const CombatScreen = {
  init(el, { enemyIds }) {
    _container = el;
    _selectedHandIndex = null;
    startCombat(GameState, enemyIds);
    _render();
  },
  teardown() {
    _container = null;
    _selectedHandIndex = null;
  },
};

function _render() {
  const { player, combat } = GameState;
  const { enemies, deckState, energy, maxEnergy, lastLog } = combat;

  _container.innerHTML = `
    <div class="combat-screen">
      <div class="enemies-area">
        ${enemies.map((e, i) => renderEnemy(e, i)).join('')}
      </div>
      ${renderHUD(player)}
      <div class="energy-display">⚡ ${energy} / ${maxEnergy} Energy</div>
      <div class="combat-log">${lastLog || '&nbsp;'}</div>
      <div class="hand-area">
        ${deckState.hand.map((card, i) => {
          const disabled = card.cost > energy;
          const selected = i === _selectedHandIndex;
          const cls = ['card',
            disabled ? 'card-disabled' : '',
            selected ? 'card-selected' : '',
          ].filter(Boolean).join(' ');
          const color = card.type === 'attack' ? 'var(--card-attack)'
                      : card.type === 'skill'  ? 'var(--card-skill)'
                      : 'var(--card-power)';
          return `
            <div class="${cls}" data-index="${i}" style="--card-color:${color}">
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
      </div>
      <div class="deck-counts">
        Draw: ${deckState.draw.length} &nbsp;|&nbsp; Discard: ${deckState.discard.length} &nbsp;|&nbsp; Exhaust: ${deckState.exhaust.length}
      </div>
    </div>
  `;

  _attachEvents();
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

  if (_selectedHandIndex === index) {
    // Deselect
    _selectedHandIndex = null;
    _render();
    return;
  }

  if (card.targetType === 'none') {
    const result = playCard(GameState, index);
    _handleResult(result);
  } else {
    // Needs a target — highlight enemies
    _selectedHandIndex = index;
    _render();
    _container.querySelectorAll('.enemy:not(.dead)').forEach(el => {
      el.classList.add('targetable');
    });
  }
}

function _onEnemyClick(targetIndex) {
  if (_selectedHandIndex === null) return;
  const result = playCard(GameState, _selectedHandIndex, targetIndex);
  _selectedHandIndex = null;
  _handleResult(result);
}

function _onEndTurn() {
  _selectedHandIndex = null;
  const result = endPlayerTurn(GameState);
  _handleResult(result);
}

function _handleResult(result) {
  if (!result?.ok && result?.event === undefined) {
    _render();
    return;
  }
  if (result.event === 'game_over') {
    _showGameOver(result.cause);
  } else if (result.event === 'victory') {
    _checkVictoryType();
  } else {
    _render();
  }
}

function _checkVictoryType() {
  const map = GameState.map;
  const node = map?.floors[map.currentFloor]?.[map.currentCol];
  if (node?.type === 'boss') {
    _showRunVictory();
  } else {
    navigate('RewardScreen', {});
  }
}

function _showGameOver(cause) {
  const messages = {
    hp: {
      title: 'You Died',
      body: 'Your wounds proved fatal. The dungeon claims another soul.',
    },
    petrify: {
      title: 'Fully Petrified',
      body: 'Stone crept through your veins until nothing remained but a silent statue. You will stand here forever, deep beneath the earth.',
    },
  };
  const { title, body } = messages[cause] ?? messages.hp;
  _container.innerHTML = `
    <div class="game-over">
      <h1>${title}</h1>
      <p>${body}</p>
      <button id="restart">Return to Menu</button>
    </div>
  `;
  _container.querySelector('#restart').addEventListener('click', () => location.reload());
}

function _showRunVictory() {
  _container.innerHTML = `
    <div class="victory-screen">
      <h1>Victory!</h1>
      <p>The Obsidian Sentinel shatters. Stone dust fills the air. You have survived the depths — for now.</p>
      <button id="restart">Return to Menu</button>
    </div>
  `;
  _container.querySelector('#restart').addEventListener('click', () => location.reload());
}
