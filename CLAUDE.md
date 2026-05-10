# Petr-Rogue — Project Context for Claude Sessions

## Tech Stack

- **Vanilla JS ES modules**, no build step, no bundler
- **Deployed on GitHub Pages** from the `main` branch
- No TypeScript, no React, no npm packages
- All screens are plain objects with `init(el, params)` and `teardown()` methods
- Navigation: `navigate('ScreenName', params)` from `src/router.js`
- Global state: `GameState` singleton in `src/state/GameState.js`

## Git Workflow (IMPORTANT)

`git push` fails with 403 through the local proxy (`http://local_proxy@127.0.0.1:.../git/...`). **Never try to fix the proxy.** The established workaround is:

1. Commit changes locally as normal
2. Push via `mcp__github__push_files` in batches of ~6 files (tool has a payload limit)
3. After push, sync local: `git fetch origin <branch> && git reset --hard origin/<branch>`

Development branch: `claude/design-deckbuilding-game-structure-Scwr5`  
Production branch: `main` (GitHub Pages)

## Lore & Character Rules (CRITICAL)

**All characters in the game are female** — player, NPCs, bosses, event figures, enemies, and any other named entity. This is a firm design rule. No exceptions.

## Three-Act Structure

| Act | Theme | Location | Key Mechanic |
|-----|-------|----------|--------------|
| 1 | Power / Strength | Surface Ruins | Weak, Strength, PetrifyPower |
| 2 | Crystal / Summons | Deep Mines | Attuned, Crystal Sliver, isSummon |
| 3 | Staggering | The Abyss | Slowed, Stasis |

## Core Mechanics

### Petrify
- Player dies when `player.petrify >= player.hp` (OR hp ≤ 0)
- Every `gainPetrify` call must be preceded by setting `player.lastPetrifySource = { type, id }`
- Source types: `'enemy'`, `'status'`, `'curse'`, `'event'`, `'self'` (card effect), `'unknown'`

### Death Cause Tracking
`checkDeathCause(player, combat = null)` in `src/state/Player.js` returns:
```js
// Boss kill (hp or petrify):
{ type: 'boss', bossId: attacker.id, subtype: 'hp' | 'petrify' }
// Regular HP death:
{ type: 'hp', killerId: attacker?.id ?? null }
// Petrify death:
{ type: 'petrify', source: player.lastPetrifySource ?? { type: 'unknown', id: null } }
// Alive:
null
```
`combat.lastEnemyAttacker = { id, name, isBoss }` is set before each enemy action in `CombatSystem.js`.

### Innate Cards
Placed at the **end** of the draw array (popped first), guaranteeing they appear in the opening hand on turn 1.
```js
const innate = cards.filter(c => c.innate);
const rest   = cards.filter(c => !c.innate);
return { draw: [...shuffle([...rest]), ...innate], hand: [], discard: [], exhaust: [] };
```

### Torpor (curse)
While Torpor is in hand, player may only play **2 cards per turn** (not stacking with multiple copies — still 2 limit). `_torporBlocked(hand, cardsPlayedThisTurn)` in `CombatSystem.js`.

### Stasis (status card)
Retained, exhaust on play. While in hand, inflates cost of all non-status/non-curse cards by +1 (max 3 stacks effect = +1, not cumulative per copy). `_effectiveCost` in `CombatSystem.js` excludes `isCurse`.

### Slowed (status)
Draws 1 fewer card per turn while active. Implemented as `5 - (slowed > 0 ? 1 : 0)` — not hardcoded to 4.

### Card Rarity Weighting (RewardSystem.js)
```
10% rare / 30% uncommon / 60% common
```
No replacement within a single offer (uses a `Set` of used IDs). `eventOnly: true` cards are excluded from reward and shop pools.

## Card Flags

| Flag | Meaning |
|------|---------|
| `innate: true` | Guaranteed in opening hand |
| `unplayable: true` | Cannot be played (all curses) |
| `isCurse: true` | Curse type; purple in UI |
| `isStatus: true` | Status card type |
| `eventOnly: true` | Never appears in reward/shop pools |
| `colorless: true` | Shared across characters (~20% chance per reward slot) |
| `rarity: 'curse'` | Rarity string for curses |
| `rarity: 'special'` | Rarity string for event-only cards |

## Curse Cards (all `unplayable: true`, `isCurse: true`, `rarity: 'curse'`)

| ID | Effect |
|----|--------|
| `deadstone` | Pure deck pollution, no effect |
| `torpor` | While in hand, you may only play 2 cards per turn |
| `stone_debt` | `onDraw`: sets `lastPetrifySource = { type: 'curse', id: 'stone_debt' }` then `gainPetrify(player, 3)` |
| `fossil_burden` | `innate: true`; `onDraw`: sets `lastPetrifySource = { type: 'curse', id: 'fossil_burden' }` then `gainPetrify(player, 2)` |

## Event-Only Cards (all `eventOnly: true`, `rarity: 'special'`, `colorless: true`)

| ID | Cost | Type | Effect |
|----|------|------|--------|
| `stone_eruption` | 0 | Attack | Deal 12 damage to all enemies, gain 10 Petrify |
| `hexing_strike` | 1 | Attack | Deal 10 damage, apply Vulnerable 2 |
| `cursed_ward` | 1 | Skill | Gain 10 Block, apply Weak 1 to all enemies |
| `stone_dominion` | 2 | Power | Each turn start: gain 2 Petrify + 1 Energy |

## Bosses (all have `isBoss: true`)

| ID | Act | Notes |
|----|-----|-------|
| `petrified_queen` | 1 | Two-phase; Phase 2 log: `'👑 The Petrified Queen rises from her throne — Phase 2!'` |
| `stone_heart` | 3 | Final boss |

Encounter table for Act 1 boss room: `['stone_royal_guard', 'petrified_queen', 'stone_royal_guard']`

## Events System

Events are in `src/data/events.js`. Each event has:
- `acts: [1]` / `[2]` / `[3]` / `[1, 2]` etc. — which acts it can appear in
- `tone: 'positive' | 'neutral' | 'negative'`
- `position: 'early' | 'late' | 'any'`

Map screen uses `_pickEvent(actNum, floorInAct)` with tone weights:
- Act 1: positive 40, neutral 45, negative 15
- Act 2: positive 25, neutral 45, negative 30
- Act 3: positive 15, neutral 35, negative 50

`position`: floorInAct ≤ 3 → `'early'`, ≥ 6 → `'late'`, else `'any'`

### Event Card Picker
Choices with `needsCardPick: { type, label }` trigger a second UI phase in `EventScreen.js`. The `onPick(state, cardIndex)` callback is called when a card is selected. Choices are disabled (with note) if no matching card type exists in deck.

Events must set `player.lastPetrifySource = { type: 'event', id: eventId }` before any `gainPetrify` call.

## Game Over Screen

### Art Lookup Chain
`CombatScreen.js` `_showGameOver(cause)`:
1. `_deathMessageKey(cause)` resolves key
2. Art path: `assets/game-over/{key-with-hyphens}.png` (underscores → hyphens)
3. Falls through to generic if specific art missing

### Key Resolution Order
1. `boss_{bossId}` — e.g. `boss_petrified_queen`
2. `petrify_{source.type}_{source.id}` — e.g. `petrify_curse_torpor`
3. `petrify_{source.type}` — e.g. `petrify_enemy`
4. `petrify` — generic petrify
5. `hp` — generic HP death

### Death Message Keys & Art Files Needed

All art: **480 × 320 px** (matches `.game-over-art { width: min(480px, 90vw); aspect-ratio: 3/2 }`)

| Key | File | Trigger |
|-----|------|----------|
| `hp` | `assets/game-over/hp.png` | Generic HP death |
| `petrify` | `assets/game-over/petrify.png` | Generic petrify death |
| `petrify_enemy` | `assets/game-over/petrify-enemy.png` | Petrified by enemy attack |
| `petrify_status` | `assets/game-over/petrify-status.png` | Petrified by status (e.g. Numbing) |
| `petrify_curse` | `assets/game-over/petrify-curse.png` | Petrified by any curse draw |
| `petrify_self` | `assets/game-over/petrify-self.png` | Petrified by own card effect |
| `petrify_event` | `assets/game-over/petrify-event.png` | Petrified by event choice |
| `boss_petrified_queen` | `assets/game-over/boss-petrified-queen.png` | Killed by Petrified Queen (hp or petrify) |
| `boss_stone_heart` | `assets/game-over/boss-stone-heart.png` | Killed by Stone Heart (hp or petrify) |

All 9 files are currently missing. The same art is used whether the boss killed via HP or Petrify.

### Game Over Stats Block
Displayed after art + title + epitaph: Act, Floor, Enemies Defeated, Relics held, Gold.

`state.enemiesDefeated` is a run-level counter on `state` (not combat state), incremented in both `playCard` (player kill) and `_runEnemyTurn` (no — only player victories increment it).

## Missing Assets Summary

| Category | Location | Size | Count | Status |
|----------|----------|------|-------|--------|
| Game-over art | `assets/game-over/*.png` | 480×320 | 9 | All missing |
| Card art | `assets/cards/*.png` | TBD | Most missing | User working independently |
| Enemy sprites | `assets/enemies/*.png` | TBD | All missing | Currently text/CSS |
| Relic images | `assets/relics/*.png` | TBD | All missing | No folder yet |

Existing art: `assets/backgrounds/` (combat.png, Portrait_*.png, avatar.png, sprite.png)

## File Map

```
src/
  data/
    cards.js          — Card definitions (makeCard factory)
    characters.js     — Player character definitions
    enemies.js        — Enemy definitions (makeEnemy factory)
    events.js         — Event definitions with acts/tone/position
    relics.js         — Relic definitions (makeRelic, relicDropPool)
  state/
    GameState.js      — Global singleton state
    Player.js         — Player factory + checkDeathCause()
    RunManager.js     — Run start/end logic
  systems/
    CombatSystem.js   — Turn engine, card play, death detection
    DeckSystem.js     — Deck creation, shuffle, draw
    Effects.js        — Shared effect helpers (damage, block, etc.)
    MapSystem.js      — Map generation
    RelicSystem.js    — Relic trigger hooks
    RewardSystem.js   — Card/relic reward generation
    StatusSystem.js   — Status tick logic (tickPlayerStatuses)
  ui/
    components/
      CardView.js     — Card rendering component
      DeckViewer.js   — Full deck overlay
      EnemyView.js    — Enemy rendering
      HUD.js          — In-combat HUD
      StatusBar.js    — Status icon row
    screens/
      CharacterSelectScreen.js
      CombatScreen.js — Combat UI + game-over rendering
      EventScreen.js  — Event UI + card picker
      MapScreen.js    — Map + event picking logic
      RestScreen.js
      RewardScreen.js
      ShopScreen.js
  main.js
  router.js
style.css
index.html
```

## Key Conventions

- **No build step**: all imports use `.js` extensions
- **Factory functions**: `makeCard(id)`, `makeEnemy(id)`, `makeRelic(id)` clone from data definitions
- **Screen pattern**: `export const FooScreen = { init(el, params) {}, teardown() {} }`
- **State mutation**: direct mutation of `GameState` object (no reducers/actions)
- **`eventOnly` cards**: added to player deck via event `onPick`/`effect` only; never in reward/shop pools
- All curse cards: `unplayable: true` — no exceptions
- Boss kills (hp and petrify) share the same game-over art/epitaph per boss
