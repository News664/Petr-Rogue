import { gainPetrify } from './Effects.js';

// ── Apply ────────────────────────────────────────────────────────────────────

export function applyStatus(entity, status, stacks) {
  if (!entity.statusEffects) entity.statusEffects = {};
  entity.statusEffects[status] = (entity.statusEffects[status] || 0) + stacks;
}

// ── Tick — call at start of the affected entity's turn ───────────────────────

export function tickPlayerStatuses(player) {
  const s = player.statusEffects;
  if (!s) return;

  // Numbing: gain Petrify equal to current stacks, then decrement (like StS Poison)
  if (s.numbing > 0) {
    gainPetrify(player, s.numbing);
    s.numbing = Math.max(0, s.numbing - 1);
  }

  // Duration-based statuses decrement each turn
  if (s.calcified > 0)   s.calcified--;
  if (s.vulnerable > 0)  s.vulnerable--;
}

export function tickEnemyStatuses(enemy) {
  const s = enemy.statusEffects;
  if (!s) return;
  if (s.weak > 0)        s.weak--;
  if (s.vulnerable > 0)  s.vulnerable--;
}

// ── Display ──────────────────────────────────────────────────────────────────

const STATUS_META = {
  weak:       { icon: '🩸', label: 'Weak' },
  vulnerable: { icon: '💔', label: 'Vuln' },
  numbing:    { icon: '🫧', label: 'Numb' },
  calcified:  { icon: '⛏️', label: 'Calc' },
  stoneCoat:  { icon: '🪨', label: 'Coat' },
};

export function formatStatuses(statusEffects) {
  if (!statusEffects) return '';
  return Object.entries(statusEffects)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => {
      const meta = STATUS_META[k];
      return meta ? `<span class="status-badge status-${k}" title="${meta.label} ${v}">${meta.icon}${v}</span>` : '';
    })
    .join('');
}
