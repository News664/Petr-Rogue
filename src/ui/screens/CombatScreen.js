import { GameState } from '../../state/GameState.js';
import { startCombat, playCard, endPlayerTurn } from '../../systems/CombatSystem.js';
import { renderHUD } from '../components/HUD.js';
import { renderEnemy } from '../components/EnemyView.js';
import { navigate } from '../../router.js';
import { FLOORS, NUM_ACTS } from '../../systems/MapSystem.js';
import { openDeckViewer } from '../components/DeckViewer.js';
import { resolveDeathScreen } from '../../data/deathMessages.js';
import { renderDeathSlideshow } from '../components/DeathSlideshow.js';

let _container = null;
let _selectedHandIndex = null;
let _source = 'combat'; // 'combat' | 'elite' | 'boss'
let _lastPetrifyStage = 0;

const _GO_KEYS = [
  'hp', 'petrify', 'petrify-enemy', 'petrify-status', 'petrify-curse',
  'petrify-self', 'petrify-event', 'boss-obsidian-sentinel',
  'boss-petrified-queen', 'boss-stone-heart',
];

function _preloadImages(charId) {
  const urls = [
    `assets/${charId}/sprite.png`,
    `assets/${charId}/Portrait_0.png`,
    `assets/${charId}/Portrait_25.png`,
    `assets/${charId}/Portrait_50.png`,
    `assets/${charId}/Portrait_75.png`,
    ..._GO_KEYS.map(k => `assets/game-over/${k}-${charId}.png`),
    ..._GO_KEYS.map(k => `assets/game-over/${k}.png`),
  ];
  urls.forEach(src => { const img = new Image(); img.src = src; });
}

// Cache of sprite content bounds per charId: { top: 0..1, bottom: 0..1 }
// top/bottom are the fraction of transparent rows at top and bottom of the sprite.
const _spriteBounds = {};

function _scanSpriteBounds(charId, url) {
  if (_spriteBounds[charId]) return;
  _spriteBounds[charId] = { top: 0, bottom: 0 }; // default: no trim
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      // Scan at reduced resolution for performance
      const scale = Math.min(1, 128 / img.naturalHeight);
      canvas.width  = Math.round(img.naturalWidth  * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const h = canvas.height, w = canvas.width;
      const alphaThreshold = 10;
      let topRow = 0, bottomRow = h - 1;
      outer: for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4 + 3] > alphaThreshold) { topRow = y; break outer; }
        }
      }
      outer2: for (let y = h - 1; y >= 0; y--) {
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4 + 3] > alphaThreshold) { bottomRow = y; break outer2; }
        }
      }
      _spriteBounds[charId] = { top: topRow / h, bottom: (h - 1 - bottomRow) / h };
      // Re-render to apply corrected clip-path
      if (_container) _render();
    } catch (_) { /* tainted canvas on local file:// — bounds stay at default */ }
  };
  img.src = url;
}

export const CombatScreen = {
  init(el, { enemyIds, source = 'combat' }) {
    _container = el;
    _selectedHandIndex = null;
    _source = source;
    _lastPetrifyStage = 0;
    const startResult = startCombat(GameState, enemyIds);
    if (startResult?.event === 'game_over') { _handleResult(startResult); return; }
    _preloadImages(GameState.player.characterId ?? 'mint');
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
  const ratio    = player.petrify / Math.max(1, player.hp);
  const pct      = Math.min(1, ratio);
  const charId   = player.characterId ?? 'mint';
  const spriteUrl = `assets/${charId}/sprite.png`;

  // Scan sprite alpha on first encounter to find non-transparent content bounds.
  _scanSpriteBounds(charId, spriteUrl);
  const bounds = _spriteBounds[charId] ?? { top: 0, bottom: 0 };

  // Map petrify% within the content region only so transparent padding is ignored.
  const contentTop    = bounds.top * 100;
  const contentBottom = (1 - bounds.bottom) * 100;
  const clipTop       = contentBottom - pct * (contentBottom - contentTop);

  const maskStyle = [
    `clip-path:inset(${clipTop.toFixed(1)}% 0 0 0)`,
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

function _effectiveCost(card, hand) {
  if (card.isStatus || card.isCurse) return card.cost;
  const stasis = hand.filter(c => c.id === 'stasis').length;
  return Math.min(3, card.cost + stasis);
}

function _cardTypeLabel(card) {
  let t = card.type;
  if (card.ethereal) t += ' · ethereal';
  if (card.retained) t += ' · retained';
  return t;
}

function _renderHand(hand, energy, TYPE_COLOR, charId = 'shared', cardsPlayedThisTurn = 0) {
  const n = hand.length;
  const hasTorpor = hand.some(c => c.id === 'torpor');
  const torporLimitReached = hasTorpor && cardsPlayedThisTurn >= 2;
  return hand.map((card, i) => {
    const cost     = _effectiveCost(card, hand);
    const unplayable = !!card.unplayable;
    const torporBlocked = !unplayable && torporLimitReached;
    const disabled = unplayable || cost > energy || torporBlocked;
    const selected = !unplayable && !torporBlocked && i === _selectedHandIndex;
    const color    = TYPE_COLOR[card.type] ?? 'var(--border)';
    const extraCls = (card.isStatus ? ' card-status' : '') + (card.isCurse ? ' card-curse' : '');
    const norm = n > 1 ? (i / (n - 1) - 0.5) : 0;
    const rot  = (norm * 24).toFixed(1);
    const yo   = (norm * norm * 36).toFixed(1);
    const costInflated = cost > card.cost;
    return `
      <div class="card${disabled ? ' card-disabled' : ''}${selected ? ' card-selected' : ''}${extraCls}"
           data-index="${i}"
           style="--card-color:${color};--rot:${rot}deg;--yo:${yo}px">
        <div class="card-art">
          <img src="assets/cards/${charId}/${card.id}.png" alt="" draggable="false"
               onerror="this.src='assets/cards/${card.id}.png';this.onerror=()=>this.style.visibility='hidden'">
        </div>
        <div class="card-header">
          <div class="card-cost${costInflated ? ' cost-inflated' : ''}">${cost}</div>
          <div class="card-name">${card.name}</div>
        </div>
        <div class="card-type">${_cardTypeLabel(card)}</div>
        <div class="card-desc">${card.shortDescription ?? card.description}</div>
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
          ${_renderHand(deckState.hand, energy, TYPE_COLOR, player.characterId, combat.cardsPlayedThisTurn)}
        </div>
        ${deckState.hand.some(c => c.id === 'torpor') ? `<div class="torpor-indicator">⛓ Torpor: ${Math.max(0, 2 - combat.cardsPlayedThisTurn)} card play(s) remaining this turn</div>` : ''}
        <div class="combat-actions">
          <button id="end-turn">End Turn</button>
          <span class="deck-counts">
            <button class="pile-btn" id="btn-draw">Draw (${deckState.draw.length})</button>
            <button class="pile-btn" id="btn-discard">Discard (${deckState.discard.length})</button>
            <button class="pile-btn" id="btn-exhaust">Exhaust (${deckState.exhaust.length})</button>
          </span>
        </div>
      </div>
      <div class="battle-log" id="battle-log">
        <div class="battle-log-title">Battle Log</div>
        <div class="battle-log-entries" id="log-entries">
          ${logEntries.map((e, i) => `<div class="log-entry${i === logEntries.length - 1 ? ' log-latest' : ''}">${e}</div>`).join('')}
        </div>
        <div class="card-detail-panel" id="card-detail"></div>
      </div>
      <div class="petrify-vignette"></div>
      <div class="petrify-flash-overlay"></div>
    </div>
  `;

  _attachEvents();
  _applyPetrifyEffects();
  const logEl = _container.querySelector('#log-entries');
  if (logEl) logEl.scrollTop = logEl.scrollHeight;
}

function _applyPetrifyEffects() {
  const { player } = GameState;
  const ratio = Math.min(1, player.petrify / Math.max(1, player.hp));
  const stage = ratio >= 0.75 ? 3 : ratio >= 0.5 ? 2 : ratio >= 0.25 ? 1 : 0;

  const cs = _container.querySelector('.combat-screen');
  if (!cs) return;
  cs.style.setProperty('--petrify-ratio', ratio.toFixed(3));

  const vignette = _container.querySelector('.petrify-vignette');
  if (vignette) {
    const inner = (70 - ratio * 40).toFixed(1);
    const alpha = (ratio * 0.72).toFixed(3);
    vignette.style.background =
      `radial-gradient(ellipse at center, transparent ${inner}%, rgba(75,68,58,${alpha}) 100%)`;
  }

  if (stage > _lastPetrifyStage) {
    const flash = _container.querySelector('.petrify-flash-overlay');
    if (flash) {
      flash.classList.remove('flash-active');
      void flash.offsetWidth;
      flash.classList.add('flash-active');
    }
  }
  _lastPetrifyStage = stage;
}

function _attachEvents() {
  const detail = _container.querySelector('#card-detail');
  const charId = GameState.player.characterId ?? 'mint';

  _container.querySelectorAll('.hand-area .card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (!detail) return;
      const card = GameState.combat.deckState.hand[Number(el.dataset.index)];
      if (!card) return;
      const detailCost = _effectiveCost(card, GameState.combat.deckState.hand);
      const detailInflated = detailCost > card.cost;
      detail.innerHTML = `
        <div class="card-detail-art">
          <img src="assets/cards/${charId}/${card.id}.png" alt=""
               onerror="this.src='assets/cards/${card.id}.png';this.onerror=()=>this.style.visibility='hidden'">
        </div>
        <div class="card-detail-header">
          <div class="card-detail-cost${detailInflated ? ' cost-inflated' : ''}">${detailCost}</div>
          <div class="card-detail-name">${card.name}</div>
        </div>
        <div class="card-detail-type">${_cardTypeLabel(card)}</div>
        <div class="card-detail-desc">${card.description}</div>
      `;
    });
    el.addEventListener('mouseleave', () => { if (detail) detail.innerHTML = ''; });
  });

  _container.querySelectorAll('.card:not(.card-disabled)').forEach(el => {
    el.addEventListener('click', () => _onCardClick(Number(el.dataset.index)));
  });
  _container.querySelectorAll('.enemy:not(.dead)').forEach(el => {
    el.addEventListener('click', () => _onEnemyClick(Number(el.dataset.index)));
  });
  _container.querySelector('#end-turn')?.addEventListener('click', _onEndTurn);

  const overlay  = document.getElementById('deck-overlay');
  const player   = GameState.player;
  const { deckState } = GameState.combat;

  const sortedDraw = [...deckState.draw].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  _container.querySelector('#btn-draw')?.addEventListener('click', () =>
    openDeckViewer(overlay, player, { title: `Draw Pile (${sortedDraw.length})`, cards: sortedDraw }));
  _container.querySelector('#btn-discard')?.addEventListener('click', () =>
    openDeckViewer(overlay, player, { title: `Discard Pile (${deckState.discard.length})`, cards: deckState.discard }));
  _container.querySelector('#btn-exhaust')?.addEventListener('click', () =>
    openDeckViewer(overlay, player, { title: `Exhaust Pile (${deckState.exhaust.length})`, cards: deckState.exhaust }));
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
  const isFinalBoss = _source === 'boss' && GameState.map.currentFloor === FLOORS - 1;
  if (isFinalBoss) {
    _showRunVictory();
  } else {
    navigate('RewardScreen', { source: _source });
  }
}

function _showGameOver(cause) {
  const charId = GameState.player?.characterId ?? null;
  const { key, title, body, frames } = resolveDeathScreen(cause, charId);

  const map        = GameState.map;
  const act        = map ? Math.floor(map.currentFloor / 10) + 1 : 1;
  const floorInAct = map ? (map.currentFloor % 10) + 1 : 1;
  const enemies    = GameState.enemiesDefeated ?? 0;
  const relics     = GameState.player?.relics?.length ?? 0;
  const gold       = GameState.player?.gold ?? 0;

  renderDeathSlideshow(_container, {
    key, charId, title, body, frames,
    stats: { act, floor: floorInAct, enemies, relics, gold },
    onExit: () => location.reload(),
  });
}

function _showRunVictory() {
  const actWord = NUM_ACTS === 1 ? 'the only act' : `all ${NUM_ACTS} acts`;
  _container.innerHTML = `
    <div class="victory-screen">
      <h1>Victory!</h1>
      <p>The final guardian crumbles to dust. A deep silence settles over the abyss. You have descended through ${actWord} and emerged — still flesh, still moving, still alive.</p>
      <button id="restart">Return to Menu</button>
    </div>`;
  _container.querySelector('#restart').addEventListener('click', () => location.reload());
}
