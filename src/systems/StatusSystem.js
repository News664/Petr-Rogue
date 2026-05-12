// ── StatusSystem.js ───────────────────────────────────────────────────────────
// Status effect registry, application, and tick logic.
//
// Exports:
//   applyStatus(entity, key, stacks) — adds stacks to entity.statusEffects[key]
//   tickPlayerStatuses(player, state?) — fires on player turn start
//   tickEnemyStatuses(enemy) — fires on each enemy's action in enemy turn
//   tickCrumblingOnEnemyTurn(player) — eats player block before enemy acts
//   formatStatuses(statusEffects) → array of { icon, label, value } for display
//
// Key player statuses:
//   numbing   — gain N Petrify at turn start, then decrement
//   anchored  — prevents Petrify reduction; decrements per turn
//   slowed    — draw 1 fewer card; decrements per turn
//   calcified — unblocked damage also inflicts that amount as Petrify
//   crumbling — block is eaten at start of enemy phase
//   attuned   — amplifies all Petrify gain by N stacks
//   stoneCoat — absorbs up to N incoming Petrify as Block instead
//   weak      — outgoing damage ×0.75
//   vulnerable — incoming damage ×1.5
// ─────────────────────────────────────────────────────────────────────────────

import { gainPetrify } from './Effects.js';

// ── Apply ────────────────────────────────────────────────────────────────────

export function applyStatus(entity, status, stacks) {
  if (!entity.statusEffects) entity.statusEffects = {};
  entity.statusEffects[status] = (entity.statusEffects[status] || 0) + stacks;
}

// ── Tick ─────────────────────────────────────────────────────────────────────

export function tickPlayerStatuses(player, state = null) {
  const s = player.statusEffects;
  if (!s) return;
  if (s.numbing > 0) {
    if (state) player.lastPetrifySource = { type: 'status', id: 'numbing' };
    gainPetrify(player, s.numbing);
    s.numbing = Math.max(0, s.numbing - 1);
  }
  if (s.weak       > 0) s.weak--;
  if (s.calcified  > 0) s.calcified--;
  if (s.vulnerable > 0) s.vulnerable--;
  if (s.anchored   > 0) s.anchored--;
  if (s.attuned    > 0) s.attuned--;
  if (s.slowed     > 0) s.slowed--;
}

// Called at start of enemy turn (after player built block) so Crumbling actually bites.
export function tickCrumblingOnEnemyTurn(player) {
  const s = player.statusEffects;
  if (!s || !(s.crumbling > 0)) return;
  player.block = Math.max(0, (player.block || 0) - s.crumbling);
  s.crumbling--;
}

export function tickEnemyStatuses(enemy) {
  const s = enemy.statusEffects;
  if (!s) return;
  if (s.weak       > 0) s.weak--;
  if (s.vulnerable > 0) s.vulnerable--;
}

// ── Display ──────────────────────────────────────────────────────────────────

const STATUS_META = {
  weak:       { icon: '🩸', label: 'Weak',        tooltip: n => `Weak ${n}: Deals 25% less damage. Decrements each turn.` },
  vulnerable: { icon: '💔', label: 'Vulnerable',  tooltip: n => `Vulnerable ${n}: Takes 50% more damage. Decrements each turn.` },
  numbing:    { icon: '🫧', label: 'Numbing',     tooltip: n => `Numbing ${n}: Gain ${n} Petrify at start of your turn, then decrement.` },
  calcified:  { icon: '⛏️', label: 'Calcified',  tooltip: n => `Calcified ${n}: Unblocked HP damage also inflicts equal Petrify. ${n} turn(s) remaining.` },
  stoneCoat:  { icon: '🪨', label: 'Stone Coat', tooltip: n => `Stone Coat ${n}: Next ${n} Petrify you would gain becomes Block instead.` },
  anchored:   { icon: '⚓', label: 'Anchored',   tooltip: n => `Anchored ${n}: Cannot reduce Petrify for ${n} more turn(s). Decrements each turn.` },
  crumbling:  { icon: '💨', label: 'Crumbling',  tooltip: n => `Crumbling ${n}: Lose ${n} Block at the start of the enemy's turn. Decrements each turn.` },
  attuned:    { icon: '💎', label: 'Attuned',    tooltip: n => `Attuned ${n}: All Petrify you gain (from any source) is increased by ${n}. Decrements each turn.` },
  slowed:     { icon: '⏳', label: 'Slowed',     tooltip: n => `Slowed ${n}: Draw ${n} fewer card(s) at turn start. Decrements each turn.` },
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
