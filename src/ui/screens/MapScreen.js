import { GameState } from '../../state/GameState.js';
import { getAvailableNodes, NODE_META, FLOORS } from '../../systems/MapSystem.js';
import { navigate } from '../../router.js';
import { combatEncounters, eliteEncounters, bossEncounters } from '../../data/enemies.js';
import { eventDefs } from '../../data/events.js';

let _container = null;

export const MapScreen = {
  init(el) { _container = el; _render(); },
  teardown() { _container = null; },
};

function _render() {
  const { map } = GameState;
  const available     = getAvailableNodes(map);
  const availableKeys = new Set(available.map(n => `${n.floor},${n.col}`));

  let html = `
    <div class="map-screen">
      <h2>Map</h2>
      <div class="map-grid" id="map-grid">
  `;

  // Render top-to-bottom (boss at top, floor 0 at bottom)
  for (let f = map.floors.length - 1; f >= 0; f--) {
    html += `<div class="map-floor-row" data-floor="${f}"><div class="map-floor-label">F${f + 1}</div><div class="map-row">`;
    for (const node of map.floors[f]) {
      const key       = `${node.floor},${node.col}`;
      const isAvail   = availableKeys.has(key);
      const isVisited = map.visitedNodes.includes(key);
      const isCurrent = map.currentCol !== null && node.floor === map.currentFloor && node.col === map.currentCol;
      const meta      = NODE_META[node.type] ?? { icon: '?', label: node.type };
      const cls = ['map-node',
        isAvail   ? 'available' : '',
        isVisited ? 'visited'   : '',
        isCurrent ? 'current'   : '',
      ].filter(Boolean).join(' ');
      html += `<div class="${cls}" data-floor="${node.floor}" data-col="${node.col}" title="${meta.label}">${meta.icon}</div>`;
    }
    html += '</div></div>';
  }

  html += '</div></div>';
  _container.innerHTML = html;

  _container.querySelectorAll('.map-node.available').forEach(el => {
    el.addEventListener('click', () => _enterNode(Number(el.dataset.floor), Number(el.dataset.col)));
  });

  // Draw connection lines after layout has been calculated
  requestAnimationFrame(_drawConnections);
}

function _drawConnections() {
  const grid = _container?.querySelector('#map-grid');
  if (!grid) return;

  const gridRect = grid.getBoundingClientRect();
  if (gridRect.width === 0) return;

  // Remove any existing SVG
  grid.querySelector('.map-svg')?.remove();

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('map-svg');
  svg.setAttribute('width',  grid.scrollWidth);
  svg.setAttribute('height', grid.scrollHeight);
  svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;overflow:visible;';
  grid.style.position = 'relative';
  grid.insertBefore(svg, grid.firstChild);

  const { map } = GameState;
  const available     = getAvailableNodes(map);
  const availableKeys = new Set(available.map(n => `${n.floor},${n.col}`));

  for (let f = 0; f < map.floors.length - 1; f++) {
    for (const node of map.floors[f]) {
      for (const conn of node.connections) {
        const fromEl = _container.querySelector(`.map-node[data-floor="${f}"][data-col="${node.col}"]`);
        const toEl   = _container.querySelector(`.map-node[data-floor="${conn.floor}"][data-col="${conn.col}"]`);
        if (!fromEl || !toEl) continue;

        const fr = fromEl.getBoundingClientRect();
        const tr = toEl.getBoundingClientRect();

        const x1 = fr.left - gridRect.left + fr.width  / 2;
        const y1 = fr.top  - gridRect.top  + fr.height / 2;
        const x2 = tr.left - gridRect.left + tr.width  / 2;
        const y2 = tr.top  - gridRect.top  + tr.height / 2;

        // Determine line style based on node state
        const fromKey = `${f},${node.col}`;
        const toKey   = `${conn.floor},${conn.col}`;
        const isActive = availableKeys.has(toKey) && (map.visitedNodes.includes(fromKey) || map.currentCol === null);
        const isVisited = map.visitedNodes.includes(fromKey) && map.visitedNodes.includes(toKey);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1); line.setAttribute('y1', y1);
        line.setAttribute('x2', x2); line.setAttribute('y2', y2);
        line.setAttribute('stroke', isVisited ? '#5a5248' : isActive ? '#27ae60' : '#2e2a26');
        line.setAttribute('stroke-width', isActive ? '2' : '1.5');
        if (!isVisited && !isActive) line.setAttribute('stroke-dasharray', '4 3');
        svg.appendChild(line);
      }
    }
  }
}

function _enterNode(floor, col) {
  const node = GameState.map.floors[floor][col];
  const key  = `${floor},${col}`;
  if (!GameState.map.visitedNodes.includes(key)) GameState.map.visitedNodes.push(key);
  GameState.map.currentFloor = floor;
  GameState.map.currentCol   = col;

  switch (node.type) {
    case 'combat': navigate('CombatScreen', { enemyIds: _pick(combatEncounters), source: 'combat' }); break;
    case 'elite':  navigate('CombatScreen', { enemyIds: _pick(eliteEncounters),  source: 'elite'  }); break;
    case 'boss':   navigate('CombatScreen', { enemyIds: _pick(bossEncounters),   source: 'boss'   }); break;
    case 'rest':   navigate('RestScreen',  {}); break;
    case 'shop':   navigate('ShopScreen',  {}); break;
    case 'event':  navigate('EventScreen', { event: _pick(eventDefs) }); break;
    default:       navigate('CombatScreen', { enemyIds: _pick(combatEncounters), source: 'combat' });
  }
}

function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
