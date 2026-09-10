# Prompt: a new screen, or a redesign

For anything under `apps/web/src/routes/`. Fill the bracketed parts and delete this line.

---

Read these before writing anything:

- `docs/design/mockups/[SCREEN].png` — the target. Follow it for column order, wording and layout.
- `apps/web/src/routes/ServiceLog.tsx` and `components/ServiceLogTable.tsx`, `components/LogServiceModal.tsx` — the shape of a list screen here.
- `apps/web/src/lib/api.ts` — the only place the frontend talks to the API.
- `apps/web/src/tours/tours.ts` — read the rules commented at the top before writing any tour copy.
- `apps/web/src/components/pressableRow.ts` and `FleetTable.tsx` if rows should open something.

Build: [WHAT THE SCREEN SHOWS AND DOES].

Rules for this codebase:

- The primary action lives in the `action` prop of the table's `Panel`, next to the table it acts on — not in the page header.
- Reuse `Panel`, `StatusChip`, `SortHeader` and `PrimaryAction` rather than restyling. `PrimaryAction` takes `size="sm"` inside a `Panel`.
- Every write control is wrapped in `can(principal, '[PERMISSION]')`. The API guards it too; hiding it on the web is not the check.
- Table headings must be in the same order as the cells. They disagreed once and every date on the screen read as the wrong thing.
- A screen gets a tour, registered in `TOURS` before the `'/'` entry, with `data-tour` anchors. No permanent explanatory panel on the screen itself.

Do not: [WHAT IS OUT OF SCOPE].

When you are done, tell me what to check as a role without `[PERMISSION]`, because I have to verify that path by hand.

Work: branch `feat/[NAME]` from `main`, atomic commits with scope, no `Co-Authored-By`, `pnpm check` at the end. Never run `pnpm dev` or anything with `--watch` — I run the app myself to look at it.
