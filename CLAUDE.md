# Petr-Rogue — Project Context for Claude Sessions

## Tech Stack

- **Vanilla JS ES modules**, no build step, no bundler
- **Deployed on GitHub Pages** from the `main` branch
- No TypeScript, no React, no npm packages
- All screens are plain objects with `init(el, params)` and `teardown()` methods
- Navigation: `navigate('ScreenName', params)` from `src/router.js`
- Global state: `GameState` singleton in `src/state/GameState.js`

## Git Workflow (IMPORTANT)

`main` is a protected branch — direct `git push origin main` is blocked with HTTP 403.
Feature branch pushes work fine via direct git push.

**Established workflow:**

1. Develop on the designated feature branch (see session instructions)
2. Commit and push the feature branch normally:
   ```
   git push -u origin <feature-branch>
   ```
3. Merge to `main` via MCP — create a PR then merge it:
   ```js
   mcp__github__create_pull_request({ head: '<feature-branch>', base: 'main', ... })
   mcp__github__merge_pull_request({ pullNumber: N, merge_method: 'squash' })
   ```
   Use `squash` — `rebase` sometimes fails with 405.
4. After the MCP merge, reset local main to avoid "unpushed commits" warnings:
   ```
   git fetch origin main && git checkout main && git reset --hard origin/main
   git checkout <feature-branch>
   ```

**If the PR has merge conflicts** (happens when the feature branch contains commits
already merged to main with different SHAs): create a clean branch from `origin/main`,
cherry-pick only the genuinely new commits onto it, push that branch, and open the PR
from there instead.

**Branch hygiene:** Keep only two active branches besides `main`:
- `claude/design-deckbuilding-game-structure-Scwr5` — preserved design archive
- `claude/continue-deckbuilding-design-RjfqY` — current working branch

**Deleting branches** requires the GitHub web UI — no MCP tool exists for it.

**Never** try to fix the proxy or force-push to main.

## Reducing Context Window Usage

The session summary injected at startup can consume 30–40% of the context window
if the previous session was long. To minimise this:

- **Keep CLAUDE.md current.** The more accurate this file is, the less exploratory
  reading the agent needs to do. Update it at the end of every session.
- **Avoid re-reading files already in context.** If a file was read earlier in the
  session, reference the earlier result rather than reading again.
- **Use offset/limit on large files.** Read only the relevant section rather than
  the whole file, especially for `cards.js`, `enemies.js`, `events.js`.
- **Discuss design before implementing.** Implementing then reverting wastes both
  tokens and context. Get explicit approval on card designs, names, and numbers
  before touching any file.
- **Batch independent edits into one turn.** Multiple parallel tool calls in a
  single message cost far less than sequential turns.
- **Start a new session before the window is full.** Once context usage is
  noticeably high, commit and push everything, update CLAUDE.md, then continue
  in a fresh session rather than compressing mid-task.

## Lore Rules

- All playable characters are female — no exceptions
- Petrify death condition: `player.petrify >= player.hp` (checked in `src/state/Player.js`)
- Death cause is tracked via `checkDeathCause(player, combat)` and passed to the game-over screen
- `Portrait_100.png` is **not used** — the game-over screen fires before full petrification
  is ever rendered, so only Portrait_0/25/50/75 are needed per character

## Project Structure

```
src/
  data/
    cards.js          — all card definitions (makeCard factory at bottom)
    characters.js     — character definitions + createPlayerFromCharacter
    enemies.js        — enemy definitions + encounter tables
    events.js         — event definitions
    relics.js         — relic definitions + relicDropPool
    deathMessages.js  — all game-over epitaphs + resolveDeathScreen() lookup
  state/
    GameState.js      — global singleton
    Player.js         — petrify death check, checkDeathCause
    RunManager.js
  systems/
    CombatSystem.js   — startCombat, playCard, endPlayerTurn
    DeckSystem.js
    Effects.js        — applyDamage, applyBlock, gainPetrify, reducePetrify, healPlayer
    MapSystem.js      — generateMap, FLOORS, NUM_ACTS
    RelicSystem.js
    RewardSystem.js   — generateCardRewards, generateRelicReward
    StatusSystem.js   — applyStatus, tickPlayerStatuses, formatStatuses
  ui/
    components/       — CardView, DeckViewer, EnemyView, HUD, StatusBar
    screens/          — CharacterSelectScreen, CombatScreen, EventScreen, MapScreen,
                        RestScreen, RewardScreen, ShopScreen
assets/
  {charId}/           — avatar.png, sprite.png, Portrait_0/25/50/75.png  (no Portrait_100)
  cards/{charId}/     — {cardId}.png (falls back to assets/cards/{cardId}.png)
  game-over/          — {cause-key}.png and {cause-key}-{charId}.png
  backgrounds/        — combat.png
```

## Characters

### Mint — "The Reclaimed" (68 HP, 3 Energy)
- Starting relic: **Stone Veil** — gain Stone Coat 4 at combat start
- Theme: cleanse Petrify, convert it to offense and healing
- Unique cards: purifying_touch, holy_light, petrify_ward, consecrate, sanctify,
  stone_coat, holy_surge, purifying_nova, sacred_ground

### Tharja — "The Stone-Kissed" (72 HP, 3 Energy)
- Starting relic: **Stone Hunger** — gain +1 Energy each turn when Petrify ≥ 50% HP
- Theme: court Petrify as a power source; threshold mechanics at Petrify ≥ 50% HP
- Unique cards: stone_fang, fracture, petrify_lash, petrify_mantle, void_release,
  void_crack, overload, stone_pact, stone_bastion, petrify_shroud
- Starter deck: 4× strike, 3× defend, 2× stone_fang, 1× petrify_lash

## Colorless (Shared) Card Pool

bash, gravel_shot, stone_skin, shatter, petrify_surge,
purify, fortify, stone_will, controlled_calcify, stone_channel

`stone_channel` was formerly named "Calcify" — renamed to avoid confusion with the
Calcified status effect. Any event references used `makeCard('stone_channel')`.

## Key System Notes

### Petrify Cap (Obsidian Cap relic)
The cap is enforced inside `gainPetrify()` in `Effects.js` via `player.petrifyCap`.
The relic sets `state.player.petrifyCap = 50` on `onCombatStart`. This means the
cap applies to ALL Petrify sources at ALL times (enemy attacks, status ticks, card
effects, draw hooks) — not just at turn start.

### Petrify Threshold Cards (Tharja)
Several Tharja cards use `state.player.petrify >= state.player.hp * 0.5` as the
threshold condition. This uses **current HP**, not maxHp, so the threshold lowers
as she takes damage (easier to trigger when wounded).

### Death Screen System
- Messages live in `src/data/deathMessages.js` — edit epitaphs there, not in CombatScreen.js
- Key lookup chain: `boss_{bossId}` → `petrify_{type}_{id}` → `petrify_{type}` → `petrify` / `hp`
- Character-specific keys: append `_{charId}` (e.g. `hp_mint`, `boss_stone_heart_tharja`)
- Art: `assets/game-over/{cause-key-with-hyphens}-{charId}.png` → `{cause-key}.png` → hidden
- To add a new character: append a block in deathMessages.js + place art files

### Turn Start Order (CombatSystem.js `_startPlayerTurn`)
1. Reset block and energy
2. `tickPlayerStatuses` — Numbing fires here (adds Petrify)
3. `checkDeathCause` — death check
4. Draw cards — Stone Shard/Debt draw hooks fire here
5. `triggerRelics('onTurnStart')` — Stone Hunger, Petrify Shroud power, etc.

## Reward System

- Card rewards: 20% colorless chance per slot; rarity weights 60% common / 30% uncommon / 10% rare
- Relics: drawn from `relicDropPool` in relics.js (starting relics are NOT in this pool)
- Shop: cards and relics from the same pools

## Enemies & Bosses

- `isBoss: true` required on boss enemy defs for boss death cause to trigger
- Bosses: obsidian_sentinel (Act 1), petrified_queen (Act 2), stone_heart (Act 3)
- Elites and bosses have `onPhaseCheck` for phase transitions
- All boss phase-2/3 intent arrays are defined at the top of `enemies.js` (before `enemyDefs`)
