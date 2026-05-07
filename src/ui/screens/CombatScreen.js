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

function _petrifyStage(player) {
  const ratio = player.petrify / Math.max(1, player.hp);
  if (ratio >= 0.75) return 75;
  if (ratio >= 0.50) return 50;
  if (ratio >= 0.25) return 25;
  return 0;
}

function _renderPortrait(player) {
  const stage  = _petrifyStage(player);
  const charId = player.characterId ?? 'mint';
  const pct    = Math.round(player.petrify / Math.max(1, player.hp) * 100);
  const cls    = pct >= 75 ? 'portrait-danger' : pct >= 50 ? 'portrait-warn' : '';
  return `
    <div class="portrait-panel">
      <div class="portrait-img-wrap">
        <img class="portrait-img"
             src="assets/${charId}/Portrait_${stage}.png"
             alt="portrait"
             onerror="this.style.visibility='hidden'">
      </div>
      <div class="portrait-pct ${cls}">${pct > 0 ? `Petrify ${pct}%` : ''}</div>
    </div>
  `;
}

function _renderSpriteArea(player) {
  const pct      = Math.min(100, Math.round(player.petrify / Math.max(1, player.hp) * 100));
  const charId   = player.characterId ?? 'mint';
  const spriteUrl = `assets/${charId}/sprite.png`;
  // clip-path reveals the bottom pct% of the full-height overlay;
  // mask-image uses the sprite's alpha so transparent areas stay clear.
  const maskStyle = [
    `clip-path:inset(${100 - pct}% 0 0 0)`,
    `mask-image:url(${spriteUrl})`,
    `-webkit-mask-image:url(${spriteUrl})`,
  ].join(';');
  return `
    <div class="player-sprite-area">
      <div class="sprite-wrap">
        <img class="sprite-img" src="${spriteUrl}" alt="" onerror="this.style.visibility='hidden'">
        <div class="petrify-mask" style="${maskStyle}"></div>
      </div>
    </div>
  `;
}

function _renderHand(hand, energy, TYPE_COLOR, charId = 'shared') {
  const n = hand.length;
  return hand.map((card, i) => {
    const unplayable = !!card.unplayable;
    const disabled = unplayable || card.cost > energy;
    const selected = !unplayable && i === _selectedHandIndex;
    const color    = TYPE_COLOR[card.type] ?? 'var(--border)';
    const extraCls = (card.isStatus ? ' card-status' : '') + (card.isCurse ? ' card-curse' : '');
    const norm = n > 1 ? (i / (n - 1) - 0.5) : 0;
    const rot  = (norm * 24).toFixed(1);
    const yo   = (norm * norm * 36).toFixed(1);
    return `
      <div class="card${disabled ? ' card-disabled' : ''}${selected ? ' card-selected' : ''}${extraCls}"
           data-index="${i}"
           style="--card-color:${color};--rot:${rot}deg;--yo:${yo}px">
        <div class="card-art">
          <img src="assets/cards/${charId}/${card.id}.png" alt="" draggable="false"
               onerror="this.src='assets/cards/${card.id}.png';this.onerror=()=>this.parentElement.classList.add('card-art-missing')">
        </div>
        <div class="card-header">
          <div class="card-cost">${card.cost}</div>
          <div class="card-name">${card.name}</div>
        </div>
        <div class="card-type">${card.type}${card.ethereal ? ' · ethereal' : ''}</div>
        <div class="card-desc">${card.description}</div>
      </div>
    `;
  }).join('');
}

function _render() {
  const { player, combat } = GameState;
  const { enemies, deckState, energy, maxEnergy, log, activePowers } = combat;

  const TYPE_COLOR = {
    attack: 'var(--card-attack)', skill: 'var(--card-skill)',
    power:  'var(--card-power)',  status: 'var(--card-status)', curse: 'var(--card-curse)',
  };
  const logEntries = log.slice(-7);

  _container.innerHTML = `
    <div class="combat-screen">
      ${_renderPortrait(player)}
      <div class="combat-main">
        <div class="combat-field">
          ${_renderSpriteArea(player)}
          <div class="enemies-area">
            ${enemies.map((e, i) => renderEnemy(e, i, player)).join('')}
          </div>
        </div>
        ${renderHUD(player)}
        <div class="energy-bar">
          <span class="energy-display">⚡ ${energy} / ${maxEnergy}</span>
          ${activePowers.length ? activePowers.map(p => `<span class="power-badge">${p.name}</span>`).join('') : ''}
        </div>
        <div class="hand-area">
          ${_renderHand(deckState.hand, energy, TYPE_COLOR, player.characterId)}
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
  const logEl = _container.querySelector('#log-entries');
  if (logEl) logEl.scrollTop = logEl.scrollHeight;
}

function _attachEvents() {
  _container.querySelectorAll('.card:not(.card-disabled):not(.card-status):not(.card-curse)').forEach(el => {
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
  const charId = GameState.player?.characterId ?? 'mint';
  const portrait = cause === 'petrify'
    ? `<img class="game-over-portrait" src="assets/${charId}/Portrait_100.png" alt="" onerror="this.style.display='none'">`
    : '';
  _container.innerHTML = `
    <div class="game-over">
      ${portrait}
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
