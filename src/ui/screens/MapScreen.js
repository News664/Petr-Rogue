import { GameState } from '../../state/GameState.js';
import { getAvailableNodes, NODE_META, FLOORS, FLOORS_PER_ACT, NUM_ACTS, getAct } from '../../systems/MapSystem.js';
import { navigate } from '../../router.js';
import { getEncounters } from '../../data/enemies.js';
import { eventDefs } from '../../data/events.js';

let _container = null;

const ACT_NAMES = ['Act I — Surface Ruins', 'Act II — The Deep Mines', 'Act III — The Abyss'];

const NODE_COLORS = {
  combat: { bg: '#3a1a1a', border: '#8b3a3a', glow: '#8b3a3a' },
  elite:  { bg: '#2a1a3a', border: '#7a4aaa', glow: '#9b5abf' },
  rest:   { bg: '#2a2010', border: '#b07830', glow: '#c89040' },
  shop:   { bg: '#1a2a1a', border: '#4a8a4a', glow: '#60aa60' },
  event:  { bg: '#102030', border: '#3a7aaa', glow: '#4a9acd' },
  boss:   { bg: '#3a0808', border: '#cc2222', glow: '#ff3333' },
};

export const MapScreen = {
  init(el) { _container = el; _render(); },
  teardown() { _container = null; },
};

function _render() {
  const { map } = GameState;
  const available     = getAvailableNodes(map);
  const availableKeys = new Set(available.map(n => `${n.floor},${n.col}`));
  const currentAct    = map.currentCol === null ? 0 : getAct(map.currentFloor);
  const floorLabel    = map.currentCol === null
    ? 'Choose your first path'
    : `${ACT_NAMES[currentAct]}  ·  Floor ${(map.currentFloor % FLOORS_PER_ACT) + 1} / ${FLOORS_PER_ACT}`;

  _container.innerHTML = `
    <div class="map-screen">
      <div class="map-header">
        <span class="map-title">⛰️ The Descent</span>
        <span class="map-floor-info">${floorLabel}</span>
      </div>
      <div class="map-scroll" id="map-scroll">
        <div class="map-grid" id="map-grid">
          ${_buildRows(map, availableKeys)}
        </div>
      </div>
    </div>
  `;

  _container.querySelectorAll('.map-node.available').forEach(el => {
    el.addEventListener('click', () => _enterNode(Number(el.dataset.floor), Number(el.dataset.col)));
  });

  requestAnimationFrame(() => {
    _drawConnections(map, availableKeys);
    const scroll = _container.querySelector('#map-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  });
}

function _buildRows(map, availableKeys) {
  const currentAct  = map.currentCol === null ? 0 : getAct(map.currentFloor);
  const actStart    = currentAct * FLOORS_PER_ACT;
  const actEnd      = actStart + FLOORS_PER_ACT - 1;

  let html = '';
  for (let f = actEnd; f >= actStart; f--) {
    if (!map.floors[f]) continue;
    const posInAct = f % FLOORS_PER_ACT;

    html += `<div class="map-floor-row" data-floor="${f}">`;
    html += `<div class="map-floor-label">F${posInAct + 1}</div>`;
    html += `<div class="map-row">`;
    for (const node of map.floors[f]) {
      const key       = `${node.floor},${node.col}`;
      const isAvail   = availableKeys.has(key);
      const isVisited = map.visitedNodes.includes(key);
      const isCurrent = map.currentCol !== null && node.floor === map.currentFloor && node.col === map.currentCol;
      const meta      = NODE_META[node.type] ?? { icon: '?', label: node.type };
      const colors    = NODE_COLORS[node.type] ?? NODE_COLORS.combat;
      const cls = ['map-node', node.type,
        isAvail   ? 'available' : '',
        isVisited ? 'visited'   : '',
        isCurrent ? 'current'   : '',
      ].filter(Boolean).join(' ');
      const style = isAvail || isCurrent
        ? `--nb:${colors.border};--ng:${colors.glow};--nbg:${colors.bg}`
        : '';
      html += `<div class="${cls}" data-floor="${node.floor}" data-col="${node.col}"
                    data-tooltip="${meta.label}" style="${style}">
                 <span class="node-icon">${isCurrent ? '📍' : meta.icon}</span>
               </div>`;
    }
    html += `</div></div>`;
  }
  return html;
}

function _drawConnections(map, availableKeys) {
  const grid = _container?.querySelector('#map-grid');
  if (!grid) return;
  grid.querySelector('.map-svg')?.remove();

  const gridRect = grid.getBoundingClientRect();
  if (gridRect.width === 0) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('map-svg');
  svg.setAttribute('width',  grid.scrollWidth);
  svg.setAttribute('height', grid.scrollHeight);
  svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;overflow:visible;';
  grid.style.position = 'relative';
  grid.insertBefore(svg, grid.firstChild);

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <filter id="line-glow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
  svg.appendChild(defs);

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

        const fromKey  = `${f},${node.col}`;
        const toKey    = `${conn.floor},${conn.col}`;
        const isVisited = map.visitedNodes.includes(fromKey) && map.visitedNodes.includes(toKey);
        const isActive  = availableKeys.has(toKey) && (map.visitedNodes.includes(fromKey) || map.currentCol === null);

        const mx = (x1 + x2) / 2 + (x2 - x1) * 0.15;
        const my = (y1 + y2) / 2;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M${x1},${y1} Q${mx},${my} ${x2},${y2}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-width', isActive ? '2.5' : '1.5');
        if (isVisited) {
          path.setAttribute('stroke', '#5a5248');
        } else if (isActive) {
          path.setAttribute('stroke', '#c8a96e');
          path.setAttribute('filter', 'url(#line-glow)');
        } else {
          path.setAttribute('stroke', '#2e2a26');
          path.setAttribute('stroke-dasharray', '5 4');
        }
        svg.appendChild(path);
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

  const act = getAct(floor);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  switch (node.type) {
    case 'combat': navigate('CombatScreen', { enemyIds: pick(getEncounters('combat', act)), source: 'combat' }); break;
    case 'elite':  navigate('CombatScreen', { enemyIds: pick(getEncounters('elite',  act)), source: 'elite'  }); break;
    case 'boss':   navigate('CombatScreen', { enemyIds: pick(getEncounters('boss',   act)), source: 'boss'   }); break;
    case 'rest':   navigate('RestScreen',  {}); break;
    case 'shop':   navigate('ShopScreen',  {}); break;
    case 'event':  navigate('EventScreen', { event: pick(eventDefs) }); break;
    default:       navigate('CombatScreen', { enemyIds: pick(getEncounters('combat', act)), source: 'combat' });
  }
}
