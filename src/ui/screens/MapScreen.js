import { GameState } from '../../state/GameState.js';
import { getAvailableNodes, NODE_META, FLOORS } from '../../systems/MapSystem.js';
import { navigate } from '../../router.js';
import { combatEncounters, eliteEncounters, bossEncounters } from '../../data/enemies.js';
import { eventDefs } from '../../data/events.js';

let _container = null;

export const MapScreen = {
  init(el) {
    _container = el;
    _render();
  },
  teardown() { _container = null; },
};

function _render() {
  const { map, player } = GameState;
  const available = getAvailableNodes(map);
  const availableKeys = new Set(available.map(n => `${n.floor},${n.col}`));

  let html = `
    <div class="map-screen">
      <h2>Map</h2>
      <p class="map-subtitle">
        Floor ${map.currentCol !== null ? map.currentFloor + 1 : 0} / ${FLOORS}
        &nbsp;|&nbsp; ❤️ ${player.hp}/${player.maxHp}
        &nbsp;|&nbsp; 🪨 ${player.petrify}
        &nbsp;|&nbsp; 💰 ${player.gold}
      </p>
      <div class="map-grid">
  `;

  // Render top-to-bottom (boss at top, start at bottom)
  for (let f = map.floors.length - 1; f >= 0; f--) {
    html += `<div class="map-floor-label">Floor ${f + 1}</div><div class="map-row">`;
    for (const node of map.floors[f]) {
      const key = `${node.floor},${node.col}`;
      const isAvailable = availableKeys.has(key);
      const isVisited   = map.visitedNodes.includes(key);
      const isCurrent   = map.currentCol !== null
        && node.floor === map.currentFloor
        && node.col   === map.currentCol;
      const meta = NODE_META[node.type] ?? { icon: '?', label: node.type };
      const cls = ['map-node',
        isAvailable ? 'available' : '',
        isVisited   ? 'visited'   : '',
        isCurrent   ? 'current'   : '',
      ].filter(Boolean).join(' ');
      html += `<div class="${cls}" data-floor="${node.floor}" data-col="${node.col}" title="${meta.label}">${meta.icon}</div>`;
    }
    html += '</div>';
  }

  html += '</div></div>';
  _container.innerHTML = html;

  _container.querySelectorAll('.map-node.available').forEach(el => {
    el.addEventListener('click', () => {
      _enterNode(Number(el.dataset.floor), Number(el.dataset.col));
    });
  });
}

function _enterNode(floor, col) {
  const node = GameState.map.floors[floor][col];
  const key = `${floor},${col}`;

  if (!GameState.map.visitedNodes.includes(key)) {
    GameState.map.visitedNodes.push(key);
  }
  GameState.map.currentFloor = floor;
  GameState.map.currentCol   = col;

  switch (node.type) {
    case 'combat':
      navigate('CombatScreen', { enemyIds: _pick(combatEncounters) });
      break;
    case 'elite':
      navigate('CombatScreen', { enemyIds: _pick(eliteEncounters) });
      break;
    case 'boss':
      navigate('CombatScreen', { enemyIds: _pick(bossEncounters) });
      break;
    case 'rest':
      navigate('RestScreen', {});
      break;
    case 'shop':
      navigate('ShopScreen', {});
      break;
    case 'event':
      navigate('EventScreen', { event: _pick(eventDefs) });
      break;
    default:
      navigate('CombatScreen', { enemyIds: _pick(combatEncounters) });
  }
}

function _pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
