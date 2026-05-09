export const FLOORS_PER_ACT = 10;
export const NUM_ACTS       = 3;
export const FLOORS         = FLOORS_PER_ACT * NUM_ACTS; // 30

/** 0-based act number for a given floor index */
export function getAct(floor) { return Math.floor(floor / FLOORS_PER_ACT); }

const TYPE_WEIGHTS = [
  ['combat', 4],
  ['elite',  1],
  ['rest',   2],
  ['shop',   1],
  ['event',  2],
];

export const NODE_META = {
  combat: { label: 'Combat',  icon: '⚔️'  },
  elite:  { label: 'Elite',   icon: '💀'  },
  rest:   { label: 'Rest',    icon: '🔥'  },
  shop:   { label: 'Shop',    icon: '🛒'  },
  event:  { label: 'Event',   icon: '❓'  },
  boss:   { label: 'Boss',    icon: '👁️'  },
};

function _posInAct(f) { return f % FLOORS_PER_ACT; }

function _isBoss(f)    { return _posInAct(f) === FLOORS_PER_ACT - 1; }
function _isPreBoss(f) { return _posInAct(f) === FLOORS_PER_ACT - 2; }
function _isElite(f)   { return _posInAct(f) === 4 && !_isBoss(f) && !_isPreBoss(f); }

export function generateMap() {
  const floors = [];

  for (let f = 0; f < FLOORS; f++) {
    const boss    = _isBoss(f);
    const preBoss = _isPreBoss(f);
    const elite   = _isElite(f);
    const numNodes = boss || preBoss ? 1 : Math.max(2, Math.min(5, 2 + Math.floor(_posInAct(f) / 3)));
    const row = [];
    for (let c = 0; c < numNodes; c++) {
      row.push({
        floor: f, col: c,
        type: boss ? 'boss' : preBoss ? 'rest' : elite ? 'elite' : _pickType(),
        connections: [],
      });
    }
    floors.push(row);
  }

  // Connect floor-by-floor
  for (let f = 0; f < FLOORS - 1; f++) {
    // Don't connect across act boundaries (boss is last floor of act; next act starts fresh)
    if (_isBoss(f)) {
      // Boss connects to first floor of next act
      const next = floors[f + 1];
      for (const node of next) {
        floors[f][0].connections.push({ floor: f + 1, col: node.col });
      }
      continue;
    }
    const curr = floors[f];
    const next = floors[f + 1];
    for (const node of curr) {
      const count   = Math.min(next.length, Math.random() < 0.35 ? 2 : 1);
      const targets = _pickRandom(next, count);
      node.connections = targets.map(n => ({ floor: n.floor, col: n.col }));
    }
    // Guarantee every next-floor node has ≥1 incoming edge
    for (const nextNode of next) {
      const hasIncoming = curr.some(n => n.connections.some(c => c.col === nextNode.col));
      if (!hasIncoming) {
        const src = curr[Math.floor(Math.random() * curr.length)];
        src.connections.push({ floor: nextNode.floor, col: nextNode.col });
      }
    }
  }

  // Guarantee exactly one shop per act (floors 1–7 within act, excluding elite/boss/rest)
  for (let act = 0; act < NUM_ACTS; act++) {
    const actStart = act * FLOORS_PER_ACT;
    const shopable = [];
    for (let f = actStart + 1; f < actStart + FLOORS_PER_ACT - 2; f++) {
      if (!_isElite(f) && !_isBoss(f) && !_isPreBoss(f)) shopable.push(f);
    }
    const hasShop = shopable.some(f => floors[f].some(n => n.type === 'shop'));
    if (!hasShop) {
      const f   = shopable[Math.floor(Math.random() * shopable.length)];
      const row = floors[f];
      const target = row[Math.floor(Math.random() * row.length)];
      if (target.type === 'combat') target.type = 'shop';
    }
  }

  return {
    floors,
    currentFloor: 0,
    currentCol: null,
    visitedNodes: [],
  };
}

export function getAvailableNodes(map) {
  const { floors, currentFloor, currentCol } = map;
  if (currentCol === null) return floors[0];
  const currentNode = floors[currentFloor]?.[currentCol];
  if (!currentNode) return [];
  const nextFloor = currentFloor + 1;
  if (nextFloor >= floors.length) return [];
  return currentNode.connections.map(c => floors[nextFloor][c.col]).filter(Boolean);
}

function _pickType() {
  const pool = TYPE_WEIGHTS.flatMap(([t, w]) => Array(w).fill(t));
  return pool[Math.floor(Math.random() * pool.length)];
}

function _pickRandom(arr, count) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}
