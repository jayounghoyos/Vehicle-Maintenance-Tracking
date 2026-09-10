# Prompt: a new API module

For a new domain folder under `apps/api/src/`. Fill the bracketed parts and delete this line.

---

Read these before writing anything, and follow their patterns:

- `apps/api/src/service-events/` — the whole folder. Module, controller, service, `dto.ts`, `*.types.ts` and `*.service.spec.ts`. This is the shape to copy.
- `apps/api/src/tenant/tenant-repository.ts` — every query goes through `this.tenants.for(Entity, organizationId)`. On the builder it returns use `.andWhere(...)`; `.where(...)` replaces the organization condition and leaks across organizations.
- `apps/api/src/entities/[ENTITY].entity.ts` — the entity already exists / needs a migration.
- `apps/web/src/auth/permissions.ts` — the permission names, which are the same on both sides.

Build: a `[NAME]` module with `GET` (filterable by [WHAT]), `POST`, `PATCH /:id` and `DELETE /:id`. Write operations guarded by `[PERMISSION]`.

Business rules that must hold:

- [RULE, e.g. at least one interval is required]
- [WHAT A DUPLICATE OR A CONFLICT SHOULD RETURN — a readable 409, never a 500]

Do not:

- Duplicate logic that already lives in `apps/api/src/maintenance/`.
- Decide anything the issue leaves open. If a choice is about what the client wants rather than how to write it, stop and ask me.
- Touch [FILES OUTSIDE THE SCOPE].

Tests: a `[NAME].service.spec.ts` mirroring `service-events.service.spec.ts`. It must cover the tenant boundary — a `[FOREIGN_ID]` belonging to another organization — not only the happy path.

Work: branch `feat/[NAME]` from `main`. One atomic commit per step, conventional commits with scope, each commit building on its own. No separate prettier commit. No `Co-Authored-By` lines. Run `pnpm check` at the end. Do not run `pnpm dev` or anything with `--watch`.
