import { gainPetrify } from './Effects.js';

// ── Apply ────────────────────────────────────────────────────────────────────

export function applyStatus(entity, status, stacks) {
  if (!entity.statusEffects) entity.statusEffects = {};
  entity.statusEffects[status] = (entity.statusEffects[status] || 0) + stacks;
}

// ── Tick ─────────────────────────────────────────────────────────────────────

export function tickPlayerStatuses(player) {
  const s = player.statusEffects;
  if (!s) return;
  if (s.numbing > 0) {
    gainPetrify(player, s.numbing);
    s.numbing = Math.max(0, s.numbing - 1);
  }
  if (s.calcified > 0)  s.calcified--;
  if (s.vulnerable > 0) s.vulnerable--;
}

export function tickEnemyStatuses(enemy) {
  const s = enemy.statusEffects;
  if (!s) return;
  if (s.weak > 0)       s.weak--;
  if (s.vulnerable > 0) s.vulnerable--;
}

// ── Display ──────────────────────────────────────────────────────────────────

const STATUS_META = {
  weak:       { icon: '🩸', label: 'Weak',        tooltip: n => `Weak ${n}: Deals 25% less damage. Decrements each turn.` },
  vulnerable: { icon: '💔', label: 'Vulnerable',  tooltip: n => `Vulnerable ${n}: Takes 50% more damage. Decrements each turn.` },
  numbing:    { icon: '🫧', label: 'Numbing',     tooltip: n => `Numbing ${n}: Gain ${n} Petrify at start of your turn, then decrement.` },
  calcified:  { icon: '⛏️', label: 'Calcified',  tooltip: n => `Calcified ${n}: Unblocked HP damage also inflicts equal Petrify. ${n} turn(s) remaining.` },
  stoneCoat:  { icon: '🪨', label: 'Stone Coat', tooltip: n => `Stone Coat ${n}: Next ${n} Petrify you would gain becomes Block instead.` },
};

export function formatStatuses(statusEffects) {
  if (!statusEffects) return '';
  return Object.entries(statusEffects)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => {
      const meta = STATUS_META[k];
      if (!meta) return '';
      const tip = meta.tooltip(v).replace(/"/g, '&quot;');
      return `<span class="status-badge status-${k}" data-tooltip="${tip}">${meta.icon}${v}</span>`;
    })
    .join('');
}
