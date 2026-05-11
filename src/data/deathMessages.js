// ── Death screen messages ─────────────────────────────────────────────────────
//
// Keys follow the cause-key lookup chain (most-specific first):
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

  hp_mint:                     { title: 'Fallen',              body: "Mint's wounds proved fatal. The dungeon closes around the fallen and does not mourn — another reclaimed soul, lost again. Somewhere above, the light from the surface grows a little darker." },
  petrify_mint:                { title: 'Fully Petrified',     body: "Stone crept through Mint's veins until nothing remained. She will stand here in the dark forever — still, silent. She had been freed once. The goddess does not pass through twice." },
  petrify_enemy_mint:          { title: 'Turned to Stone',     body: "The dungeon's creatures carry the cold in every strike. Each blow moved the stone deeper into Mint. She had survived it once — sealed in silence, waiting. She did not survive it twice." },
  petrify_status_mint:         { title: 'The Slow Creep',      body: 'No single blow finished Mint. A status left untended, ticking quietly while she fought other things. She had been patient herself — waiting decades in stone. The dungeon out-waited her.' },
  petrify_curse_mint:          { title: 'A Debt in Stone',     body: 'The curses seemed manageable. Mint had carried stone before — it was part of her, in a way. Together they added up quietly. Stone debts have a way of being collected in full, even from those who have already paid once.' },
  petrify_self_mint:           { title: 'Your Own Power',      body: 'Mint understood the risk. She had felt this cold before — placed in her by someone else, without her consent. This time she chose it. The stone that claimed her this time was her own.' },
  petrify_event_mint:          { title: "The Dungeon's Trap",  body: 'The choice seemed reasonable at the time. Mint had already walked blind into one trap in this dungeon — sealed away, frozen, waiting for rescue. The dungeon offered her a second chance and used it.' },
  boss_obsidian_sentinel_mint: { title: 'The Sentinel Stands', body: "The Obsidian Sentinel offered Mint no answers — only weight, and stone, and a patience older than her curse. She had survived petrification once. The Sentinel does not negotiate with survivors." },
  boss_petrified_queen_mint:   { title: 'Added to the Court',  body: "The Petrified Queen does not need to speak. Her stillness is command enough. Mint joins her court — frozen, silent, a mirror of the fate she once escaped. No goddess wanders through the Queen's halls." },
  boss_stone_heart_mint:       { title: 'The Heart Beats On',  body: 'The Heart of the Abyss has beaten longer than memory. It did not even slow as Mint fell. She came here for answers. At the bottom of the world, the Heart offers only silence — and stone.' },

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

// Returns { key, title, body } — key is used by the UI to derive the art filename.
export function resolveDeathScreen(cause, charId) {
  const key     = _causeKey(cause);
  const charKey = charId ? `${key}_${charId}` : null;
  const { title, body } =
    (charKey && DEATH_MESSAGES[charKey]) ? DEATH_MESSAGES[charKey] :
    DEATH_MESSAGES[key] ?? DEATH_MESSAGES.hp;
  return { key, title, body };
}
