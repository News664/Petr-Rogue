import { GameState } from '../../state/GameState.js';
import { startCombat, playCard, endPlayerTurn } from '../../systems/CombatSystem.js';
import { renderHUD } from '../components/HUD.js';
import { renderEnemy } from '../components/EnemyView.js';
import { navigate } from '../../router.js';
import { FLOORS, NUM_ACTS } from '../../systems/MapSystem.js';
import { openDeckViewer } from '../components/DeckViewer.js';

let _container = null;
let _selectedHandIndex = null;
let _source = 'combat'; // 'combat' | 'elite' | 'boss'

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
    </div>
  `;

  _attachEvents();
  const logEl = _container.querySelector('#log-entries');
  if (logEl) logEl.scrollTop = logEl.scrollHeight;
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

// ── Game Over ────────────────────────────────────────────────────────────────
// Cause key lookup chain (most-specific first):
//   boss_{bossId}  →  petrify_{sourceType}_{sourceId}  →  petrify_{sourceType}  →  petrify / hp
//
// Message lookup appends _{charId} to the cause key and tries that first.
// Art lookup: assets/game-over/{cause-key}-{charId}.png → {cause-key}.png → hidden.
//
// To add a new character's death screens:
//   1. Append a block of {key}_{charId} entries to _DEATH_MESSAGES below.
//   2. Place art at assets/game-over/{cause-key}-{charId}.png for each cause.

// Generic (character-agnostic) death messages — used as fallbacks when no
// character-specific entry exists. Keys match _deathMessageKey() output.
const _DEATH_MESSAGES = {
  hp:                   { title: 'Fallen',           body: 'Your wounds proved fatal. The dungeon closes around the fallen and does not mourn. The light from the surface grows a little darker.' },
  petrify:              { title: 'Fully Petrified',  body: 'Stone crept through your veins until nothing remained. You will stand here in the dark forever — still, silent, a monument to how far you came.' },
  petrify_enemy:        { title: 'Turned to Stone',  body: 'The dungeon\'s creatures carry the cold in every strike. Each blow moved it deeper. By the end, there was nowhere left for it to go.' },
  petrify_status:       { title: 'The Slow Creep',   body: 'No single blow finished you. A status left untended, ticking through turns while you fought other things. The dungeon is patient.' },
  petrify_curse:        { title: 'A Debt in Stone',  body: 'The curses seemed manageable, one by one. Together they added up quietly. Stone debts have a way of being collected in full.' },
  petrify_self:         { title: 'Your Own Power',   body: 'You understood the risk. You pushed further than you should have. The stone that claimed you was something you built, slowly, with your own hands.' },
  petrify_event:        { title: 'The Dungeon\'s Trap', body: 'The choice seemed reasonable at the time. The dungeon has no shortage of reasonable-seeming traps, and no patience for regret.' },
  boss_petrified_queen: { title: 'Added to the Court',  body: 'The Petrified Queen does not need to speak. Her stillness is command enough. Another challenger joins her court — frozen, silent, permanent.' },
  boss_stone_heart:     { title: 'The Heart Beats On',  body: 'The Heart of the Abyss has beaten longer than memory. It did not even slow as you fell. Another challenger returned to dust at the bottom of the world.' },

  // ── Mint — character-specific messages ───────────────────────────────────
  // Art: assets/game-over/{cause-key}-mint.png  (e.g. hp-mint.png)
  // To add a second character, append a matching block keyed with its charId.

  hp_mint:                   { title: 'Fallen',           body: 'Mint\'s wounds proved fatal. The dungeon closes around the fallen and does not mourn — another reclaimed soul, lost again. Somewhere above, the light from the surface grows a little darker.' },
  petrify_mint:              { title: 'Fully Petrified',  body: 'Stone crept through Mint\'s veins until nothing remained. She will stand here in the dark forever — still, silent. She had been freed once. The goddess does not pass through twice.' },
  petrify_enemy_mint:        { title: 'Turned to Stone',  body: 'The dungeon\'s creatures carry the cold in every strike. Each blow moved the stone deeper into Mint. She had survived it once — sealed in silence, waiting. She did not survive it twice.' },
  petrify_status_mint:       { title: 'The Slow Creep',   body: 'No single blow finished Mint. A status left untended, ticking quietly while she fought other things. She had been patient herself — waiting decades in stone. The dungeon out-waited her.' },
  petrify_curse_mint:        { title: 'A Debt in Stone',  body: 'The curses seemed manageable. Mint had carried stone before — it was part of her, in a way. Together they added up quietly. Stone debts have a way of being collected in full, even from those who have already paid once.' },
  petrify_self_mint:         { title: 'Your Own Power',   body: 'Mint understood the risk. She had felt this cold before — placed in her by someone else, without her consent. This time she chose it. The stone that claimed her this time was her own.' },
  petrify_event_mint:        { title: 'The Dungeon\'s Trap', body: 'The choice seemed reasonable at the time. Mint had already walked blind into one trap in this dungeon — sealed away, frozen, waiting for rescue. The dungeon offered her a second chance and used it.' },
  boss_petrified_queen_mint: { title: 'Added to the Court',  body: 'The Petrified Queen does not need to speak. Her stillness is command enough. Mint joins her court — frozen, silent, a mirror of the fate she once escaped. No goddess wanders through the Queen\'s halls.' },
  boss_stone_heart_mint:     { title: 'The Heart Beats On',  body: 'The Heart of the Abyss has beaten longer than memory. It did not even slow as Mint fell. She came here for answers. At the bottom of the world, the Heart offers only silence — and stone.' },
};

function _deathMessageKey(cause) {
  if (!cause) return 'hp';
  if (cause.type === 'boss') return `boss_${cause.bossId}`;
  if (cause.type === 'petrify') {
    const src = cause.source;
    const specific = `petrify_${src.type}_${src.id}`;
    const category = `petrify_${src.type}`;
    if (_DEATH_MESSAGES[specific]) return specific;
    if (_DEATH_MESSAGES[category]) return category;
    return 'petrify';
  }
  return 'hp';
}

function _showGameOver(cause) {
  const key    = _deathMessageKey(cause);
  const charId = GameState.player?.characterId ?? null;

  // Prefer character-specific message, fall back to generic.
  const charKey = charId ? `${key}_${charId}` : null;
  const { title, body } =
    (charKey && _DEATH_MESSAGES[charKey]) ? _DEATH_MESSAGES[charKey] :
    _DEATH_MESSAGES[key] ?? _DEATH_MESSAGES.hp;

  const map        = GameState.map;
  const act        = map ? Math.floor(map.currentFloor / 10) + 1 : 1;
  const floorInAct = map ? (map.currentFloor % 10) + 1 : 1;
  const enemies    = GameState.enemiesDefeated ?? 0;
  const relics     = GameState.player?.relics?.length ?? 0;
  const gold       = GameState.player?.gold ?? 0;

  // Art: try {cause}-{charId}.png first, fall back to {cause}.png, then hide.
  const baseArtKey = key.replace(/_/g, '-');
  const charArtKey = charId ? `${baseArtKey}-${charId}` : null;
  const artSrc     = charArtKey ? `assets/game-over/${charArtKey}.png` : `assets/game-over/${baseArtKey}.png`;
  const artFallback = charArtKey
    ? `this.src='assets/game-over/${baseArtKey}.png';this.onerror=()=>this.style.display='none'`
    : `this.style.display='none'`;

  _container.innerHTML = `
    <div class="game-over">
      <div class="game-over-art" data-cause="${key}" data-char="${charId ?? ''}">
        <img src="${artSrc}" alt="" onerror="${artFallback}">
      </div>
      <h1>${title}</h1>
      <p class="game-over-epitaph">${body}</p>
      <div class="game-over-stats">
        <span>Act ${act} · Floor ${floorInAct}</span>
        <span>Enemies defeated: ${enemies}</span>
        <span>Relics: ${relics}</span>
        <span>Gold: ${gold}</span>
      </div>
      <button id="restart">Return to Menu</button>
    </div>`;
  _container.querySelector('#restart').addEventListener('click', () => location.reload());
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
