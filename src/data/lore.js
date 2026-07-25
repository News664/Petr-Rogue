// ── lore.js ───────────────────────────────────────────────────────────────────
// World-building text: act-opening narration and the petrified-predecessor motif.
//
// Exports:
//   ACT_INTROS[] — narration shown once when the player enters each act
//   PREDECESSORS — per-character statue descriptions (keyed by charId)
//   pickPredecessor(currentCharId) → { charId, ...entry } | null
//
// LORE RULE — no duplicates: a predecessor statue is NEVER the character you are
// currently playing. pickPredecessor filters the current charId out.
//
// Why other playable characters can appear as statues without contradicting a
// later run where you play them: petrification in this world is *not always
// final* — Mint's own backstory is that she was petrified here and later
// reclaimed by a wandering goddess. The dungeon collects people in stone; some
// are eventually returned. So a statue is a fate, not an epitaph.
// ─────────────────────────────────────────────────────────────────────────────

export const ACT_INTROS = [
  {
    title: 'Act I — Surface Ruins',
    lines: [
      'The entrance was never sealed. That is the first thing the ruins teach you: nothing here needs a door.',
      'Between the fallen columns stand figures — too detailed to be sculpture, too still to be anything else. Some wear armour a century out of fashion. Some are dressed for a walk in the sun.',
      'None of them were brought here. Every one of them walked in.',
    ],
  },
  {
    title: 'Act II — The Deep Mines',
    lines: [
      'Below the ruins, the tunnels were cut by people who knew what they were digging toward, and dug anyway.',
      'The tools are still here. So are the hands that held them — grey now, fused to the hafts, arranged along the walls where they stopped.',
      'The stone down here does not spread. It reaches.',
    ],
  },
  {
    title: 'Act III — The Abyss',
    lines: [
      'There is no floor to this place, only the long throat of it, and something at the bottom keeping time.',
      'The statues are thicker here, crowded shoulder to shoulder, all of them facing the same direction — inward, downward, toward the beat.',
      'You realise, too late to matter, that they are not a warning. They are an audience.',
    ],
  },
];

// Statue descriptions for each playable character, seen when *another* character
// finds them. Written so the figure is recognisable but her fate is unresolved.
export const PREDECESSORS = {
  mint: {
    name: 'a woman in a travel-worn habit',
    text: 'A woman in a travel-worn habit, one hand raised as though pushing something away, the other open in offering. The stone took her mid-prayer. There is no fear in her face — only the particular exhaustion of someone who has done this before and found it did not stay done.',
    keepsake: 'a pendant, still faintly warm',
  },
  tharja: {
    name: 'a woman with a book fused to her palm',
    text: 'A woman with a heavy book fused to her palm, still open. She is smiling. Whatever she was reaching for at the end, the stone caught her in the middle of enjoying it, and her expression has not had the decency to change since.',
    keepsake: 'a page torn loose and never finished',
  },
  emma: {
    name: 'a woman edged in facets',
    text: 'A woman edged in crystal facets, caught in the act of cutting something out of her own forearm. The tool is still in her grip. Around her feet, a scatter of small bright geodes — the last of what she managed to save before the vein ran the wrong way.',
    keepsake: 'a cut geode, cold and perfect',
  },
  galatea: {
    name: 'a woman who might always have been marble',
    text: 'A woman so composed that for a long moment you take her for ordinary statuary. Only the wear on her boots argues otherwise. She stands the way someone stands when they have decided not to run, and the stone simply agreed with her.',
    keepsake: 'a chisel worn down to nothing',
  },
};

// Returns a predecessor entry for someone OTHER than the current character.
// Returns null if there is no valid alternative (single-character roster).
export function pickPredecessor(currentCharId) {
  const ids = Object.keys(PREDECESSORS).filter(id => id !== currentCharId);
  if (ids.length === 0) return null;
  const charId = ids[Math.floor(Math.random() * ids.length)];
  return { charId, ...PREDECESSORS[charId] };
}
