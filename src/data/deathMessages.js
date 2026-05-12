// ── deathMessages.js ──────────────────────────────────────────────────────────
// Game-over epitaphs and slideshow frame data for all characters.
//
// Exports:
//   DEATH_MESSAGES — object keyed by cause key (see lookup chain below)
//   resolveDeathScreen(cause, charId) → { key, title, body, frames? }
//
// Entry shape:
//   { title, body, frames? }
//   frames: optional array of pre-frames shown before the final epitaph view.
//     Each frame: { text, zoom?, originX?, originY? }
//     zoom defaults to 1. originX/Y are CSS transform-origin % strings.
//     The final full-image title+body view is NOT stored in frames — it is implicit.
//
// Key lookup chain (most-specific first):
//   boss_{bossId}
//   petrify_{sourceType}_{sourceId}
//   petrify_{sourceType}
//   petrify  /  hp
//
// Character-specific entries append _{charId} to the base key, e.g. hp_mint.
// They are tried first; generic keys are used as fallbacks.
//
// Art file convention:
//   assets/game-over/{cause-key-with-hyphens}-{charId}.png   (character-specific)
//   assets/game-over/{cause-key-with-hyphens}.png            (generic fallback)
//   e.g.  hp-mint.png,  boss-obsidian-sentinel-tharja.png
//
// To add a new character's death screens:
//   1. Append a block of {key}_{charId} entries below (copy any existing block as template).
//   2. Place art at assets/game-over/{cause-key}-{charId}.png for each cause you want art for.
//      Missing art files are silently hidden — partial sets are fine.
// ─────────────────────────────────────────────────────────────────────────────

export const DEATH_MESSAGES = {

  // ── Generic (fallback for any character) ─────────────────────────────────

  hp:                     { title: 'Fallen',              body: 'Your wounds proved fatal. The dungeon closes around the fallen and does not mourn. The light from the surface grows a little darker.' },
  petrify:                { title: 'Fully Petrified',     body: 'Stone crept through your veins until nothing remained. You will stand here in the dark forever — still, silent, a monument to how far you came.' },
  petrify_enemy:          { title: 'Turned to Stone',     body: "The dungeon's creatures carry the cold in every strike. Each blow moved it deeper. By the end, there was nowhere left for it to go." },
  petrify_status:         { title: 'The Slow Creep',      body: 'No single blow finished you. A status left untended, ticking through turns while you fought other things. The dungeon is patient.' },
  petrify_curse:          { title: 'A Debt in Stone',     body: 'The curses seemed manageable, one by one. Together they added up quietly. Stone debts have a way of being collected in full.' },
  petrify_self:           { title: 'Your Own Power',      body: 'You understood the risk. You pushed further than you should have. The stone that claimed you was something you built, slowly, with your own hands.' },
  petrify_event:          { title: "The Dungeon's Trap",  body: 'The choice seemed reasonable at the time. The dungeon has no shortage of reasonable-seeming traps, and no patience for regret.' },
  boss_obsidian_sentinel: { title: 'The Sentinel Stands', body: 'It did not move. It did not speak. It simply endured — stone from the moment of its forging, patient beyond thought. Another challenger tried to break what was never breakable.' },
  boss_petrified_queen:   { title: 'Added to the Court',  body: 'The Petrified Queen does not need to speak. Her stillness is command enough. Another challenger joins her court — frozen, silent, permanent.' },
  boss_stone_heart:       { title: 'The Heart Beats On',  body: 'The Heart of the Abyss has beaten longer than memory. It did not even slow as you fell. Another challenger returned to dust at the bottom of the world.' },

  // ── Mint ─────────────────────────────────────────────────────────────────
  // Art: assets/game-over/{cause-key}-mint.png
  // frames: pre-frames shown before the final full-image epitaph (click to advance).
  //   zoom/originX/originY are CSS transform values targeting the focal element.

  hp_mint: {
    title: 'Fallen',
    body: "The dungeon does not distinguish between the reclaimed and the rest. She was found again, as all things left in the dark are found — not by stone this time, but by something simpler. She bled. She did not rise.",
    frames: [
      { text: 'She fought as if she had nothing left to lose.', zoom: 2.5, originX: '38%', originY: '28%' },
      { text: 'She did. She always did.',                       zoom: 1.6, originX: '50%', originY: '65%' },
    ],
  },

  petrify_mint: {
    title: 'Remembered by Stone',
    body: "She had been reclaimed once. The miracle did not repeat. What the stone remembers, it keeps.",
    frames: [
      { text: 'It knew her.',                                                                           zoom: 2.5, originX: '50%', originY: '22%' },
      { text: 'The stone had touched her before, left its memory in the seams of her. Now it followed those old lines back.', zoom: 1.6, originX: '50%', originY: '38%' },
    ],
  },

  petrify_enemy_mint: {
    title: 'The Cold in Every Strike',
    body: "She had outrun this fate once, with help, with prayer, with something she could not name. This time there was no one at her back. The stone closed over her like a hand that had always known where to reach.",
    frames: [
      { text: 'One blow. That was all it took.',                                               zoom: 2.5, originX: '85%', originY: '42%' },
      { text: 'She had survived worse. She had outrun worse. But survival is not a promise — only a record.', zoom: 1.6, originX: '55%', originY: '47%' },
    ],
  },

  petrify_status_mint: {
    title: 'The Slow Creep',
    body: "She had walked back from the edge before, step by careful step. This time the edge walked with her. By the time she understood, there was no step left to take.",
    frames: [
      { text: 'She felt it before she saw it.',           zoom: 2.5, originX: '50%', originY: '45%' },
      { text: 'Not the violence of it. The slow kind. The kind that waits.', zoom: 1.6, originX: '50%', originY: '32%' },
    ],
  },

  petrify_curse_mint: {
    title: 'A Debt in Stone',
    body: "Some doors should not be opened from the inside. She had never believed that. The dungeon, patient as stone, had waited for her to prove it.",
    frames: [
      { text: 'She knew the cost when she reached for it.',                        zoom: 2.5, originX: '28%', originY: '75%' },
      { text: 'She reached anyway. That is the shape of her — always one choice past the safe one.', zoom: 1.6, originX: '52%', originY: '48%' },
    ],
  },

  petrify_self_mint: {
    title: 'What She Had Always Known',
    body: "The reclaimed carry the stone in them forever — subdued, quiet, waiting. She knew this. She had always known this. She told herself it didn't matter. The stone disagreed.",
    frames: [
      { text: 'Her own power. Her own undoing.',                                                zoom: 2.5, originX: '63%', originY: '30%' },
      { text: 'She had purified the stone from others. She could not always outrun what she had already let in.', zoom: 1.6, originX: '52%', originY: '22%' },
    ],
  },

  petrify_event_mint: {
    title: 'The Price of Reaching',
    body: "The dungeon offers what you need most at exactly the price you cannot afford. She was brave enough to reach for it. Not quite brave enough to walk away.",
    frames: [
      { text: 'She made a choice.',                                                          zoom: 2.5, originX: '75%', originY: '35%' },
      { text: 'She had made choices before in dark places and lived. She had begun to trust herself too much.', zoom: 1.6, originX: '58%', originY: '45%' },
    ],
  },

  boss_obsidian_sentinel_mint: {
    title: 'The Sentinel Stands',
    body: "The Obsidian Sentinel does not hate. It does not want. It simply holds its ground until there is no ground left to hold. Mint understood this, at the end. Understanding was not enough.",
    frames: [
      { text: 'It was waiting long before she arrived.',                                              zoom: 2.5, originX: '18%', originY: '18%' },
      { text: 'She had faced stone before. But stone with purpose — stone that holds and does not tire — that was something different.', zoom: 1.6, originX: '38%', originY: '52%' },
    ],
  },

  boss_petrified_queen_mint: {
    title: 'No Room for Pity',
    body: "Pity is a weight you cannot carry into a fight and win. The Petrified Queen has had centuries to learn this. Mint had only the dungeon. It was not enough.",
    frames: [
      { text: 'She saw herself in her. That was the mistake.',                                      zoom: 2.5, originX: '78%', originY: '28%' },
      { text: 'Another woman taken by stone — who wore it like sovereignty, who had made it her court. Mint had almost pitied her.', zoom: 1.6, originX: '55%', originY: '45%' },
    ],
  },

  boss_stone_heart_mint: {
    title: 'The Heart Remembers',
    body: "She had been sent back once, purpose attached to the miracle. Perhaps this was the purpose fulfilled — not victory, but witness. She had seen the heart of it. The heart had seen her. Neither survived the meeting unchanged. Only one survived.",
    frames: [
      { text: 'At the end, she saw what she had been walking toward.',                                 zoom: 2.0, originX: '50%', originY: '22%' },
      { text: 'Not a monster. Not a god. The thing at the center of all of it — the source, the answer, the reason she had been reclaimed.', zoom: 1.5, originX: '44%', originY: '78%' },
    ],
  },

  // ── Tharja ───────────────────────────────────────────────────────────────
  // Art: assets/game-over/{cause-key}-tharja.png

  hp_tharja:                     { title: 'Not the Stone',        body: 'Tharja spent so long dancing with petrification that she forgot blades were just as final. The stone did not take her. She finds that darkly funny, wherever she is now.' },
  petrify_tharja:                { title: 'Too Deep',             body: 'She had felt it building for turns — that heavy, electric weight spreading through her. She chased it further than she should have. The edge found her before she found it. She had time, at the end, to appreciate the irony.' },
  petrify_enemy_tharja:          { title: 'Outpaced',             body: 'Tharja welcomed the stone on her own terms. She did not welcome someone else pouring it into her faster than she could spend it. There is a difference between controlling the flood and drowning in it.' },
  petrify_status_tharja:         { title: 'The Slow Burn',        body: 'She knew it was ticking. She left it, because the edge felt good, because it was feeding her. One more turn. Then one more. Tharja gambled on her own endurance. The dungeon collected its chips.' },
  petrify_curse_tharja:          { title: 'A Debt She Owed',      body: 'She had taken from the stone willingly, turn after turn. The curses were just the stone taking back. Tharja might have respected that, if she had had time to think about it.' },
  petrify_self_tharja:           { title: 'The Thrill, Fulfilled', body: 'There is a part of Tharja that knew exactly what she was doing. She chose the card. She played the hand. The edge was right there — and she leaned a little too far. She would not call it a mistake. Not entirely.' },
  petrify_event_tharja:          { title: 'A Bet Gone Wrong',     body: 'The dungeon offered her a deal. Tharja has never been good at turning down deals that involve more power, more stone, more of that electric feeling. This one took more than she could pay back.' },
  boss_obsidian_sentinel_tharja: { title: 'An Immovable Edge',    body: 'Tharja had felt stronger stone before — inside her own veins. But the Sentinel is not a resource. It does not pulse with dark potential. It is simply weight, and mass, and patience. She found an edge she could not dance along.' },
  boss_petrified_queen_tharja:   { title: 'A Different Court',    body: 'The Petrified Queen had mastered stone without ever choosing it. Tharja had chosen it her whole life. The Queen looked at her as a curiosity — another fool who welcomed the cold. Then she ended the curiosity, efficiently and without interest.' },
  boss_stone_heart_tharja:       { title: 'The Source, Untapped', body: 'The Heart of the Abyss pulses with more lithic power than Tharja had ever imagined existed. She felt it calling from the moment she saw it — not as a threat, but as an invitation. She accepted. The Heart did not.' },

};

// ── Lookup ────────────────────────────────────────────────────────────────────

function _causeKey(cause) {
  if (!cause) return 'hp';
  if (cause.type === 'boss') return `boss_${cause.bossId}`;
  if (cause.type === 'petrify') {
    const src = cause.source;
    const specific = `petrify_${src.type}_${src.id}`;
    const category = `petrify_${src.type}`;
    if (DEATH_MESSAGES[specific]) return specific;
    if (DEATH_MESSAGES[category]) return category;
    return 'petrify';
  }
  return 'hp';
}

// Returns { key, title, body, frames? }
// frames: optional array of { text, zoom?, originX?, originY? } for slideshow pre-frames.
//   zoom defaults to 1 (full image). originX/Y are CSS transform-origin % strings.
//   The final "frame" is always the full-image title+body view — not stored in frames[].
// key is used by the UI to derive the art filename.
export function resolveDeathScreen(cause, charId) {
  const key     = _causeKey(cause);
  const charKey = charId ? `${key}_${charId}` : null;
  const entry   =
    (charKey && DEATH_MESSAGES[charKey]) ? DEATH_MESSAGES[charKey] :
    DEATH_MESSAGES[key] ?? DEATH_MESSAGES.hp;
  const { title, body, frames } = entry;
  return { key, title, body, frames };
}
