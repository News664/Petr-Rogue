# Opal — "The Faceted"

Character art for `opal`. **Status: needs art** — this folder is empty; every
file below must be generated. Opal is a newly added character. Female (lore rule).

Place all files in `assets/opal/`.

| File            | Size (px)  | Aspect  | Transparency          | Content                                                                                     |
|-----------------|------------|---------|-----------------------|---------------------------------------------------------------------------------------------|
| `avatar.png`    | ~1122×1402 | 4:5     | opaque                | Bust/portrait thumbnail for the character-select roster and detail panel. Rendered with `object-fit: cover` cropped to top-center, so keep the face high and centered. |
| `sprite.png`    | 1024×1536  | 2:3     | **RGBA, transparent** | Full-body standing figure for the combat scene. Background must be fully transparent. A petrification mask rises from the feet upward over this sprite, so pose her upright, filling the frame vertically, feet near the bottom edge. |
| `Portrait_0.png`  | 963×1634 | ~3:5.1  | opaque                | Petrification stage 0% — flesh, unaffected.                                                  |
| `Portrait_25.png` | 963×1634 | ~3:5.1  | opaque                | Petrification stage 25% — same framing/pose, light stone/grey creep.                        |
| `Portrait_50.png` | 963×1634 | ~3:5.1  | opaque                | Petrification stage 50% — same framing/pose, half turned to stone.                          |
| `Portrait_75.png` | 963×1634 | ~3:5.1  | opaque                | Petrification stage 75% — same framing/pose, mostly stone.                                   |

The four portraits must share one pose and framing; only the degree of
stone/grey petrification increases across the set. They render in the combat
portrait panel top-cropped (`object-fit: cover; object-position: top center`) —
keep the face in the upper-center.

`Portrait_100.png` is **NOT USED** — do not generate it (the game-over screen
fires before full petrification renders).

Opal also needs card art (`assets/cards/opal/`) and game-over art
(`assets/game-over/{cause-key}-opal.png`) — see those folders' READMEs.
