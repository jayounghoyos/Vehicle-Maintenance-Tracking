# AGENTS.md

Vehicle Maintenance Tracking System (MTS), RFP-012. A fleet coordinator records vehicles, sets how often each job repeats, and logs the work as it happens; the system works out what is overdue.

## Setup

pnpm monorepo, Node 24 (`.nvmrc`), pnpm 10.

```
pnpm install
pnpm db:up            # postgres in docker, port 5433
pnpm migration:run
pnpm seed
pnpm check            # format:check, lint, build, test — the same four the CI runs
```

Run `pnpm check` before pushing.

The app itself is `pnpm dev`: API on 3002 (`PORT` in `.env`), web on 5173. An agent should not run it, nor `dev:api`, `dev:web` or anything with `--watch`: those do not exit and will hang the session. To verify, use `pnpm build`, `pnpm test` and `pnpm lint`, which return.

## Layout

- `apps/api` — NestJS 11, TypeORM, Postgres. One folder per feature (`vehicles/`, `schedules/`, `service-events/`, `reports/`, `team/`), each with its module, controller, service, `dto.ts` and `*.types.ts`.
- `apps/web` — React 19, Vite, Tailwind 4, TanStack Query, React Router 7. `routes/` are screens, `components/` are shared pieces, `lib/api.ts` is the only place that talks to the API.
- `docs/design/mockups/` — the mockup for each screen. Read the matching `.png` before building or changing a screen.
- `docs/design/api_contracts.md` — how the API is described, and what every endpoint has in common. The spec itself is generated: `/docs` on a running API, or `-json` for the raw OpenAPI.

## Rules

**Every query goes through the tenant repository.** `this.tenants.for(Entity, organizationId)` in `apps/api/src/tenant/tenant-repository.ts`. A raw repository call leaks one client's data into another's. On a query builder it already returns, use `.andWhere(...)` — `.where(...)` replaces the
organization condition instead of adding to it, which is a bug we have already shipped once.

**Permissions are checked on both sides.** The API guards the route; the web hides the control with `can(principal, '...')`. The names are in `apps/web/src/auth/permissions.ts` and match the API enum exactly. Adding a permission means touching both.

**Routes are plural nouns under `/api`**: `/api/vehicles`, `/api/service-events`. Errors come back as structured Nest exceptions with a readable message — a unique-constraint violation is a 409 with a sentence, never a 500.

**The screen's primary action lives in the `action` prop of its table's `Panel`**, not in the page header. `AppShell`'s `action` is for screens with no central table.

**Copy for the guided tours** follows the rules commented at the top of `apps/web/src/tours/tours.ts`: nothing over forty words, nothing named after an icon or a panel, anchored by `data-tour` attributes. New screens get a tour, registered in `TOURS` before the `'/'` entry.

## Conventions

- Conventional commits with a scope: `feat(api):`, `feat(web):`, `fix(web):`, `test(api):`, `refactor(web):`. One atomic commit per step, API before web, each one compiling on its own.
- Branches are `feat/…`, `fix/…`, `test/…`. Never commit to `main`.
- Do not add `Co-Authored-By` or any attribution line to commit messages.
- Prettier and the linters are not negotiable; `pnpm format` fixes style.
- Unit tests are `*.spec.ts` beside the code and mock their repositories; integration tests are `test/*.e2e-spec.ts` and use the real database. Copy the patterns in `service-events.service.spec.ts` and `test/harness.ts` rather than inventing new ones.

## Domain

- **Vehicle** — a van in the fleet, with an odometer reading and a status.
- **Maintenance task** — a job that gets done, e.g. an oil change. Unique by name within an organization.
- **Maintenance schedule** — the rule: this task, on this vehicle, every N days or every N kilometres, or both. At least one interval is required.
- **Service event** — the work as it happened, optionally against a schedule. Logging one moves that schedule's next due date forward.
- Whether a schedule is `overdue`, `due_soon` or `on_track` is worked out in `apps/api/src/maintenance/maintenance.ts`. Never duplicate that logic.

## Do not touch

- Which interval wins when days and kilometres disagree. Open question, issues #11 and #13. `maintenance.ts` reads `nextDueDate` only, on purpose.
- Migrations that already ran. Add a new one; never edit an old one.
- `.env`, credentials or anything under `apps/api/src/seed/seed.ts` that looks like a password.
- Anything outside the scope you were given. If a fix seems needed elsewhere, say so instead of doing it.

## Ask, do not guess

When a decision is about what the client wants rather than how to write it — what a delete should do to existing history, what a row should open, which interval takes priority — stop and ask. Those get filed as issues with the `clarificacion-pendiente` label, not resolved in code.
