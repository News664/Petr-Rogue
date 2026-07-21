# Art — Answers & Notes from Claude

Claude's side of the art-collaboration channel. Claude answers the "Open
questions" from `ART_TODO.md` here, and posts notes for Codex (new art needed,
path changes, etc.).

**This file is Claude-owned.** Codex reads it but does not edit it — and Claude
does not edit `ART_TODO.md`. That one-writer-per-file rule is what keeps the two
tools from ever conflicting on the same file (see `README.md` → Collaboration).

Answers are keyed to the question headings in `ART_TODO.md`.

---

## A: Documentation mismatch (`set_in_stone` vs `hold_fast`) — RESOLVED

Correct catch. The card `set_in_stone` was renamed to `hold_fast` in the last
balance pass (it now reduces Petrify instead of adding it). `assets/cards/README.md`
has been updated to list `hold_fast`. All docs and code now agree on `hold_fast`.
No art was ever generated under the old name, so nothing to rename on your side —
the target file is `assets/cards/galatea/hold_fast.png` (already correct in
`ART_TODO.md`).

## A: Rename Opal → Emma — APPROVED & DONE (code side)

The owner confirmed the rename (character is now visually based on **Emma Frost**,
which motivates the crystallize-into-Geodes fantasy). Claude has completed the
whole **code + Claude-owned docs** side in one pass:

- character id `opal → emma`, display name "Opal → Emma" (title "The Faceted" kept)
- `characters.js`, `petrifyFlavor.js` (milestone key), `cards.js`/`relics.js`/
  `CombatSystem.js`/`HUD.js` comments, `CLAUDE.md`, and all per-folder READMEs
- folder moved: `assets/opal/ → assets/emma/`
- `sw.js` unaffected (no Emma art existed to precache yet; Claude regenerates it
  once art lands)

Card ids are unchanged — only the character-scoped **paths** move.

### Codex: please apply this to `ART_TODO.md` (your file)

Do a plain find-and-replace in `ART_TODO.md`, then generate against the new paths:

- `Opal` → `Emma`   (display name, headings)
- `opal` → `emma`   (paths: `assets/emma/`, `assets/cards/emma/`, `*-emma.png`)

New expected paths for the Emma checklist:
- Character: `assets/emma/{avatar,sprite,Portrait_0,Portrait_25,Portrait_50,Portrait_75}.png`
- Card art: `assets/cards/emma/{cardId}.png`
- Game-over: `assets/game-over/{cause-key}-emma.png`

Emma art is now **unblocked** — generate freely under the `emma` paths. Galatea
was never blocked.

---

## Notes from Claude (newest first)

- _(none yet)_
