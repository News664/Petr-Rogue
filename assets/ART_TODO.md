# Art TODO — image-generation checklist

Single source of truth for art that still needs to be generated. Tick items as
files land. Detailed size/content specs live in each folder's `README.md`; this
file is the **status board** and the **exact expected-path list**.

## Collaboration rules (Codex ↔ Claude)

To keep the two workstreams from colliding:

- **Codex touches only `assets/**`** — the PNG files below, and this checklist.
- **Codex must NOT edit** `src/**`, `sw.js`, `style.css`, or `index.html`. Those
  are Claude's; Claude wires art into the code and regenerates the offline
  precache (`sw.js`) after each art batch.
- **Filenames are contractual and case-sensitive.** The code requests these exact
  paths; a mismatch (e.g. `portrait_50.png` vs `Portrait_50.png`) shows as blank.
- Work on a **separate branch** (e.g. `assets/opal-galatea-art`) → PR to `main`.
  Binary PNGs under `assets/` won't textually conflict with Claude's `src/` work.
- Missing art degrades gracefully in-game (hidden), so partial batches are safe
  to merge. Use the checkboxes to show what's done vs. pending.
- Leave a note under **Open questions** below if a spec is unclear; Claude will
  answer there rather than editing your files.

Sizes (see folder READMEs for full detail): avatar `1122×1402` (4:5, opaque);
sprite `1024×1536` (2:3, **RGBA transparent**); `Portrait_0/25/50/75` `963×1634`
(opaque, progressive petrification, face upper-center); card art `1536×1024`
(3:2, opaque); game-over art `1536×1024` (3:2, opaque). `Portrait_100` is NOT used.

---

## Opal — "The Faceted"  (needs all art)

**Character** (`assets/opal/`)
- [ ] `avatar.png`
- [ ] `sprite.png`  (transparent, full-body, feet near bottom)
- [ ] `Portrait_0.png`  [ ] `Portrait_25.png`  [ ] `Portrait_50.png`  [ ] `Portrait_75.png`

**Card art** (`assets/cards/opal/`) — one `{cardId}.png` each
- [ ] `strike.png`  [ ] `defend.png`
- [ ] `ore_strike.png`  [ ] `crystallize.png`  [ ] `facet_strike.png`  [ ] `geode_ward.png`  [ ] `splinter.png`
- [ ] `shatter_burst.png`  [ ] `prismatic_core.png`  [ ] `mother_lode.png`  [ ] `grand_geode.png`  [ ] `cataclysm.png`

**Game-over art** (`assets/game-over/`) — `{cause-key}-opal.png`
- [ ] `hp-opal.png`  [ ] `petrify-opal.png`  [ ] `petrify-enemy-opal.png`  [ ] `petrify-status-opal.png`  [ ] `petrify-curse-opal.png`
- [ ] `petrify-self-opal.png`  [ ] `petrify-event-opal.png`
- [ ] `boss-obsidian-sentinel-opal.png`  [ ] `boss-petrified-queen-opal.png`  [ ] `boss-stone-heart-opal.png`

---

## Galatea — "The Statue"  (needs all art)

**Character** (`assets/galatea/`)
- [ ] `avatar.png`
- [ ] `sprite.png`  (transparent, full-body, feet near bottom)
- [ ] `Portrait_0.png`  [ ] `Portrait_25.png`  [ ] `Portrait_50.png`  [ ] `Portrait_75.png`

**Card art** (`assets/cards/galatea/`) — one `{cardId}.png` each
- [ ] `strike.png`  [ ] `defend.png`
- [ ] `composure.png`  [ ] `brace.png`  [ ] `chisel.png`  [ ] `unyielding.png`  [ ] `hold_fast.png`
- [ ] `monument.png`  [ ] `pedestal.png`  [ ] `weight_of_ages.png`  [ ] `living_marble.png`  [ ] `awakening.png`

**Game-over art** (`assets/game-over/`) — `{cause-key}-galatea.png`
- [ ] `hp-galatea.png`  [ ] `petrify-galatea.png`  [ ] `petrify-enemy-galatea.png`  [ ] `petrify-status-galatea.png`  [ ] `petrify-curse-galatea.png`
- [ ] `petrify-self-galatea.png`  [ ] `petrify-event-galatea.png`
- [ ] `boss-obsidian-sentinel-galatea.png`  [ ] `boss-petrified-queen-galatea.png`  [ ] `boss-stone-heart-galatea.png`

---

## Shared / colorless card art  (pre-existing gap, all characters)

The shared/colorless cards have no art in any character folder and no shared
fallback (`assets/cards/{cardId}.png`). Lowest priority; generate a shared
fallback set if desired: `bash, gravel_shot, stone_skin, shatter, petrify_surge,
purify, fortify, stone_will, controlled_calcify, stone_channel`.

---

## Open questions

_(Codex: leave spec questions here; Claude will answer inline.)_
