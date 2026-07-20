# Petr-Rogue — Image Assets

This tree holds every rendered image the game loads at runtime. This index
describes the folder layout, the filename conventions, and the exact spec for
each asset type. Each subfolder has its own README with the full per-file list.

All specs below are **authoritative** — an automated image-generation workflow
consumes them, so pixel sizes and transparency requirements must be matched
exactly.

> **Status board & collaboration rules:** see [`ART_TODO.md`](./ART_TODO.md) for
> the checklist of art still to generate and the Codex ↔ Claude working split
> (Codex writes only `assets/**`; Claude owns `src/**` and `sw.js`).

## Art Direction

Keep new art consistent with the existing Mint/Tharja set so the roster feels
like one game:

- **Mood & palette:** dark, subterranean dungeon; low-key lighting; heavily
  desaturated, stone-grey tones with muted warm accents. Petrification reads as
  grey stone creeping over flesh. Avoid bright/saturated colors.
- **Rendering:** painterly semi-realistic fantasy illustration, soft dramatic
  lighting, visible stone texture where flesh turns to rock.
- **Cast:** all playable characters are **female** (lore rule). Each character
  has a consistent face/costume/silhouette across her avatar, sprite, and all
  four portrait stages — only the degree of petrification changes between stages.
- **Petrify stages (`Portrait_0/25/50/75`):** same pose, framing, and crop
  across the four; stone spreads progressively (0 = full flesh, 75 = mostly
  stone). Keep the face in the **upper-center** — portraits are top-cropped.
- **Sprites:** full-body, standing, upright, feet near the bottom edge, on a
  **fully transparent** background (a stone mask rises over the sprite in combat).
- **Character notes:** Opal "The Faceted" — a miner/lapidary who cuts stone into
  faceted geodes (crystalline motifs, gem tones within the grey). Galatea "The
  Statue" — marble-serene, sculptural, poised; classical-statue overtones.
- **Card art (`1536×1024`, 3:2):** a single evocative illustration of the card's
  theme; no text or borders (the UI frames it).

## Folder tree

```
assets/
  {charId}/          — per-character portraits & sprite   (mint, tharja, opal, galatea)
  cards/{charId}/    — card art, one PNG per card ID       (+ shared fallback in cards/)
  game-over/         — death-screen art, per cause-key     (+ character-specific variants)
  backgrounds/       — scene backgrounds                    (combat.png)
```

## Characters

| charId    | Name    | Title             | Art status        |
|-----------|---------|-------------------|-------------------|
| `mint`    | Mint    | The Reclaimed     | complete          |
| `tharja`  | Tharja  | The Stone-Kissed  | complete          |
| `opal`    | Opal    | The Faceted       | **needs art**     |
| `galatea` | Galatea | The Statue        | **needs art**     |

All playable characters are female (lore rule).

## Asset spec summary

| Asset               | Size (px)   | Aspect     | Transparency          | Notes                                              |
|---------------------|-------------|------------|-----------------------|----------------------------------------------------|
| `avatar.png`        | ~1122×1402  | 4:5        | opaque                | roster/detail bust thumbnail, cropped top-center   |
| `sprite.png`        | 1024×1536   | 2:3        | **RGBA, transparent** | full-body combat figure, feet near bottom          |
| `Portrait_0/25/50/75.png` | 963×1634 | ~3:5.1  | opaque                | petrification stages, face upper-center            |
| card art            | 1536×1024   | 3:2 land.  | opaque                | `cards/{charId}/{cardId}.png`                       |
| game-over art       | 1536×1024   | 3:2 land.  | opaque                | `game-over/{cause-key}[-{charId}].png`              |
| `backgrounds/combat.png` | 1672×941 | ~16:9    | opaque                | combat scene backdrop                              |

`Portrait_100.png` is **NOT USED** — the game-over screen fires before full
petrification is ever rendered. Do not generate it.

## Filename conventions

- **Character folders** are keyed by `charId` (lowercase): `assets/{charId}/`.
- **Card art**: `assets/cards/{charId}/{cardId}.png`. If the character-specific
  file is missing, the loader falls back to `assets/cards/{cardId}.png` (shared),
  then hides the art if neither exists.
- **Game-over art**: character-specific `assets/game-over/{cause-key}-{charId}.png`
  is tried first, then the generic `assets/game-over/{cause-key}.png`. Cause keys
  use hyphens in filenames (the code keys use underscores), e.g.
  `petrify_event` → `petrify-event.png`.

## Per-folder READMEs

- [mint/README.md](mint/README.md), [tharja/README.md](tharja/README.md),
  [opal/README.md](opal/README.md), [galatea/README.md](galatea/README.md)
- [cards/README.md](cards/README.md)
- [game-over/README.md](game-over/README.md)
- [backgrounds/README.md](backgrounds/README.md)
