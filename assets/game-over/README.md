# Game-Over Art

Death-screen art, one image per **cause-key**, optionally per character.

## Spec

| Property     | Value                              |
|--------------|------------------------------------|
| Size         | **1536×1024 px**                   |
| Aspect       | 3:2 landscape                      |
| Transparency | opaque                             |

## Naming scheme

Cause keys use underscores in code but **hyphens in filenames**
(e.g. `petrify_event` → `petrify-event`).

1. `assets/game-over/{cause-key}-{charId}.png` — character-specific (preferred)
2. `assets/game-over/{cause-key}.png`          — generic fallback
3. if neither exists, art is hidden

## Cause keys

Base keys (from `DEATH_MESSAGES` in `src/data/deathMessages.js`):

| Cause key                | Filename base            | Meaning                                  |
|--------------------------|--------------------------|------------------------------------------|
| `hp`                     | `hp`                     | Killed by damage (HP reached 0)          |
| `petrify`                | `petrify`                | Fully petrified (generic)                |
| `petrify_enemy`          | `petrify-enemy`          | Petrified by an enemy attack             |
| `petrify_status`         | `petrify-status`         | Petrified by a lingering status          |
| `petrify_curse`          | `petrify-curse`          | Petrified by curse/debt cards            |
| `petrify_self`           | `petrify-self`           | Petrified by your own power              |
| `petrify_event`          | `petrify-event`          | Petrified by an event choice             |
| `boss_obsidian_sentinel` | `boss-obsidian-sentinel` | Died to the Act 1 boss                   |
| `boss_petrified_queen`   | `boss-petrified-queen`   | Died to the Act 2 boss                   |
| `boss_stone_heart`       | `boss-stone-heart`       | Died to the Act 3 boss                   |

## Current status

Character-specific art currently exists for **mint** and **tharja** — one file
per cause key above (e.g. `hp-mint.png`, `boss-stone-heart-tharja.png`).

**opal** and **galatea** need art for each cause key, as
`{cause-key}-opal.png` and `{cause-key}-galatea.png` respectively. A missing file
silently falls back to the generic `{cause-key}.png` (which does not yet exist),
then hides — partial sets are acceptable but a full set per character is ideal.

Epitaph text and per-cause framing live in `src/data/deathMessages.js`.
