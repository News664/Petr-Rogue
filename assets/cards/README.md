# Card Art

One PNG per card, named by its **card ID** + `.png`.

## Spec

| Property     | Value                              |
|--------------|------------------------------------|
| Size         | **1536×1024 px**                   |
| Aspect       | 3:2 landscape                      |
| Transparency | opaque                             |

## Loading & fallback

For a card played by character `charId`:

1. `assets/cards/{charId}/{cardId}.png`  — character-specific art (preferred)
2. `assets/cards/{cardId}.png`           — shared fallback (colorless / generic)
3. if neither exists, the art is hidden

So each character needs art for every card ID in their pool, **unless** a shared
`assets/cards/{cardId}.png` already covers it. Currently there is no shared
`cards/*.png` layer — art lives under the per-character subfolders.

## Card IDs per character

Card IDs come from each character's `starterDeck()` + `cardPool` in
`src/data/characters.js`. Every character's deck includes the basic `strike` and
`defend`, plus shared colorless cards and their unique cards.

**Shared colorless pool** (appears across characters): `bash`, `gravel_shot`,
`stone_skin`, `shatter`, `petrify_surge`, `purify`, `fortify`, `stone_will`,
`controlled_calcify`, `stone_channel`.

### mint — "The Reclaimed" (art complete for its current pool)

Basics: `strike`, `defend`
Shared: `bash`, `gravel_shot`, `stone_skin`, `shatter`, `purify`, `fortify`,
`stone_will`, `controlled_calcify`
Unique: `purifying_touch`, `holy_light`, `petrify_ward`, `consecrate`,
`sanctify`, `stone_coat`, `holy_surge`, `purifying_nova`, `sacred_ground`

### tharja — "The Stone-Kissed" (art complete for its current pool)

Basics: `strike`, `defend`
Shared: `bash`, `gravel_shot`, `stone_skin`, `shatter`, `petrify_surge`,
`purify`, `fortify`, `stone_will`, `controlled_calcify`
Unique: `stone_fang`, `fracture`, `petrify_lash`, `petrify_mantle`,
`void_release`, `void_crack`, `overload`, `stone_pact`, `stone_bastion`,
`petrify_shroud`

### opal — "The Faceted" — **needs art** (`assets/cards/opal/`)

Basics: `strike`, `defend`
Unique (new): `ore_strike`, `crystallize`, `facet_strike`, `geode_ward`,
`splinter`, `shatter_burst`, `prismatic_core`, `mother_lode`, `grand_geode`,
`cataclysm`
Plus any shared colorless cards in her pool (see shared list above).

### galatea — "The Statue" — **needs art** (`assets/cards/galatea/`)

Basics: `strike`, `defend`
Unique (new): `composure`, `brace`, `chisel`, `unyielding`, `hold_fast`,
`monument`, `pedestal`, `weight_of_ages`, `living_marble`, `awakening`
Plus any shared colorless cards in her pool (see shared list above).

Card names and descriptions for art context live in `src/data/cards.js`.
