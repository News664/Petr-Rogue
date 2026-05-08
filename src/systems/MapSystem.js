export const FLOORS = 15;

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

export function generateMap() {
  const floors = [];

  for (let f = 0; f < FLOORS; f++) {
    const isBoss     = f === FLOORS - 1;
    const isPreBoss  = f === FLOORS - 2;
    const isEliteRow = !isBoss && !isPreBoss && f > 0 && f % 5 === 4;
    const numNodes = isBoss ? 1 : isPreBoss ? 1 : Math.max(2, Math.min(5, 2 + Math.floor(f / 4)));
    const row = [];
    for (let c = 0; c < numNodes; c++) {
      row.push({
        floor: f,
        col: c,
        type: isBoss ? 'boss' : isPreBoss ? 'rest' : (isEliteRow ? 'elite' : _pickType()),
        connections: [],
      });
    }
    floors.push(row);
  }

  // Connect nodes floor by floor
  for (let f = 0; f < FLOORS - 1; f++) {
    const curr = floors[f];
    const next = floors[f + 1];

    for (const node of curr) {
      const count = Math.min(next.length, Math.random() < 0.35 ? 2 : 1);
      const targets = _pickRandom(next, count);
      node.connections = targets.map(n => ({ floor: n.floor, col: n.col }));
    }

    // Guarantee every next-floor node has at least one incoming edge
    for (const nextNode of next) {
      const hasIncoming = curr.some(n =>
        n.connections.some(c => c.col === nextNode.col)
      );
      if (!hasIncoming) {
        const src = curr[Math.floor(Math.random() * curr.length)];
        src.connections.push({ floor: nextNode.floor, col: nextNode.col });
      }
    }
  }

  return {
    floors,
    currentFloor: 0,
    currentCol: null, // null = run just started, all floor-0 nodes are reachable
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

  return currentNode.connections
    .map(c => floors[nextFloor][c.col])
    .filter(Boolean);
}

function _pickType() {
  const pool = TYPE_WEIGHTS.flatMap(([t, w]) => Array(w).fill(t));
  return pool[Math.floor(Math.random() * pool.length)];
}

function _pickRandom(arr, count) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}
