// ── petrifyFlavor.js ──────────────────────────────────────────────────────────
// Per-character milestone flavor lines fired into the battle log when the
// player's Petrify first crosses 25% / 50% / 75% of HP during a combat.
//
// Exports:
//   PETRIFY_MILESTONES — { charId: { 25, 50, 75 } } lines; `default` is the fallback
//   petrifyStage(player) → 0 | 25 | 50 | 75  (shared stage helper)
//   petrifyMilestoneLine(charId, stage) → string | null
//
// Lines fire once per combat, only on the first upward crossing of each stage
// (CombatSystem tracks combat._petrifyStageSeen). Relief when Petrify drops does
// not re-trigger; a threshold passed at combat start (carried Petrify) is
// seeded as already-seen so only fresh advances during the fight speak.
// ─────────────────────────────────────────────────────────────────────────────

export const PETRIFY_MILESTONES = {
  mint: {
    25: 'The old cold returns to her fingertips. She knows this feeling far too well.',
    50: 'Grey climbs past her wrists. Not again — she will not let it be again.',
    75: 'Her heartbeat knocks like something trapped in stone. So little of her left.',
  },
  tharja: {
    25: 'The stone hums awake in her veins. There it is. She smiles.',
    50: 'Half of her is beautifully, terribly still. This is the edge she came for.',
    75: 'So close to the source now. She wonders how far is too far — and leans in.',
  },
  emma: {
    25: 'Fresh ore, seaming up her arm. Good. She lets it come.',
    50: 'A rich vein, humming under her skin — if she cuts it in time.',
    75: 'So much ore she can barely move. Cut it now, or become the mine.',
  },
  galatea: {
    25: 'The stone greets her like an old sculptor\'s hand. She holds still, and lets it.',
    50: 'Marble to the hip now. She has never felt so composed, so certain.',
    75: 'Nearly finished — the statue she was always meant to be. She breathes, and does not panic.',
  },
  default: {
    25: 'The stone spreads further through her.',
    50: 'She is half turned to stone now.',
    75: 'Barely anything of her still moves.',
  },
};

export function petrifyStage(player) {
  const ratio = player.petrify / Math.max(1, player.hp);
  if (ratio >= 0.75) return 75;
  if (ratio >= 0.50) return 50;
  if (ratio >= 0.25) return 25;
  return 0;
}

export function petrifyMilestoneLine(charId, stage) {
  if (!stage) return null;
  const set = PETRIFY_MILESTONES[charId] ?? PETRIFY_MILESTONES.default;
  return set[stage] ?? PETRIFY_MILESTONES.default[stage] ?? null;
}
