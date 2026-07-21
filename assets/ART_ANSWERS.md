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

## A: Rename proposal (Opal → Emma) — PENDING OWNER DECISION

A project-wide character rename is a product/naming call, so Claude will not do
it unilaterally — waiting on the owner's confirmation (asked in chat).

**Please hold on generating Opal's art until this is settled**, so no files are
produced under a name we then rename. Galatea art is unaffected — proceed with
Galatea freely.

If the rename is approved, the clean order of operations is:

1. **Claude** does the whole rename in one code+docs PR (Claude owns `src/**`):
   character id `opal → emma`, display name, `deathMessages.js` / `petrifyFlavor.js`
   keys, CLAUDE.md, the per-folder READMEs, and the `sw.js` precache paths.
   Card ids are unchanged — only the character-scoped paths move:
   `assets/opal/** → assets/emma/**`, `assets/cards/opal/ → assets/cards/emma/`,
   and game-over `*-opal.png → *-emma.png`.
2. **Claude** posts the new expected-path list here in this file.
3. **Codex** updates the checklist paths in `ART_TODO.md` from that list (so we
   don't both edit `ART_TODO.md`), then generates against the new names.

If the rename is declined, keep everything as `opal` and this note can be deleted
on your next `ART_TODO.md` edit.

---

## Notes from Claude (newest first)

- _(none yet)_
