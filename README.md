# Vehicle Maintenance Tracking System (MTS)

Internal tool for a small delivery fleet to track vehicle records, preventive maintenance schedules, and service history (replacing spreadsheets and calendar reminders).

## The problem

The fleet currently tracks service dates in spreadsheets and calendar reminders, and breakdown notes are not recorded consistently. As a result preventive maintenance gets missed, vehicles spend avoidable time out of service, and the people making operational decisions have no history at hand when they need it.

## What the system does

MTS brings the vehicles, their maintenance schedules and the record of the services performed into one place. From those it works out on its own what is overdue or coming up, by comparing the schedule against the log, so nobody has to open a spreadsheet to find out.

## Running it

Requires Node (the version in `.nvmrc`), pnpm and Docker.

```bash
nvm use                 # node 24
pnpm install
cp .env.example .env
pnpm db:up              # postgres in docker
pnpm migration:run      # creates the schema, which migrations own
pnpm seed               # demo fleet and a year of service history
pnpm dev                # api on :3002, web on :5173
```

The schema is never created by the API at start-up: `synchronize` is off, so
migrations are the only thing that writes it. Skipping that step leaves a database
that connects but has no tables, and the first login fails.

Then open http://localhost:5173 and sign in with any of the seeded accounts, all of
them with the password `mts-dev-password`:

| Account                   | Sees                          |
| ------------------------- | ----------------------------- |
| `ana@citylogistics.co`    | Fleet coordinator, everything |
| `carlos@citylogistics.co` | Mechanic, no reports          |
| `laura@citylogistics.co`  | Operations manager            |
| `admin@mts.local`         | Platform admin                |

|          |                                  |
| -------- | -------------------------------- |
| Web      | http://localhost:5173            |
| API      | http://localhost:3002/api        |
| Health   | http://localhost:3002/api/health |
| API docs | http://localhost:3002/docs       |
| Postgres | `localhost:5433`                 |

`pnpm up` runs the API in Docker too, instead of on the host.

Ports are set in `.env`. The defaults avoid 5432 and 3000 because a system Postgres and most editors' preview servers already hold them.

Set `DATABASE_URL` in `.env` to point at a database somewhere else instead, which
is the shape a managed provider hands over. When it is set the five `DB_` values are
ignored.

## Testing it

```bash
pnpm test                      # unit tests, no database
pnpm --filter api test:e2e     # integration tests, through HTTP into postgres
```

The integration tests exist for the failure a mocked query builder cannot show: a
query that loses its organization condition and reads another client's fleet. They
create and wipe a database of their own, `mts_test`, so `pnpm db:up` is all the
set-up they need.

## Deploying it

Three free tiers: Vercel serves the client, Render runs the API, Neon holds the
database. The browser only ever talks to Vercel, which forwards `/api` to Render,
so no API host is baked into the client and there is no CORS to configure.

**Neon.** Create a project and copy the connection string. The free plan does not
expire and its limits are per project, so this one does not compete with anything
else in the account.

**Render.** Connect the repository; `render.yaml` configures the service. Two
variables are not in the file and have to be pasted in the dashboard: `DATABASE_URL`
from Neon, and `WEB_ORIGIN` once Vercel has given the client a domain. Migrations
run on start rather than as a pre-deploy step, which Render offers only on paid
plans; they are idempotent, so repeating them costs one query.

**Vercel.** Import the repository. `vercel.json` sets the build and the forwarding.
Its destination has to be the hostname Render actually assigned, which is not
always the service name: `onrender.com` subdomains are unique across every
account, so a taken name gets a suffix. Check the URL on the service page after
the first deploy and make `vercel.json` match. JSON takes no comments, so
`render.yaml` carries the warning beside the name.

The second rewrite is what makes `/vehicles` and `/team/organization` work when
somebody types them or refreshes: those paths are React Router's, not files on
disk, so everything that is not `/api` and not a real file has to be answered with
`index.html`.

To put the demo data in the deployed database, run `pnpm seed:prod` from Render's
shell, or point `DATABASE_URL` at Neon locally and run `pnpm seed`.

**Cloudinary.** Vehicle photos go to an object store, not to Render's disk, which
is wiped on every deploy and every wake-up. The free plan is permanent and the
three values go in the dashboard like the others: `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`. Leave them unset and everything
runs with photo upload switched off.

One thing worth knowing before a live demo: a free Render service sleeps after
fifteen minutes and takes about a minute to wake, so open the app before
presenting.

## Layout

```
apps/api    NestJS + TypeORM
apps/web    React + Vite + Tailwind
docs        RFP, proposals, design
```

## Docs

- [`docs/RFP-012_Vehicle_Maintenance_Tracking.pdf`](docs/RFP-012_Vehicle_Maintenance_Tracking.pdf) Original RFP
- [`docs/proposals/RFP-012_statement_of_work.md`](docs/proposals/RFP-012_statement_of_work.md) Statement of Work
- [`docs/proposals/RFP-012_software_project_proposal.md`](docs/proposals/RFP-012_software_project_proposal.md) Project proposal
- [`docs/proposals/mvp_scope.md`](docs/proposals/mvp_scope.md) MVP scope
- [`docs/design/context_diagram.md`](docs/design/context_diagram.md) Context diagram
- [`docs/design/use_cases_diagram.md`](docs/design/use_cases_diagram.md) Use case diagram
- [`docs/design/components_diagram.md`](docs/design/components_diagram.md) Component diagram
- [`docs/design/architecture_diagram.md`](docs/design/architecture_diagram.md) AWS deployment architecture
- [`docs/design/data_model.md`](docs/design/data_model.md) Data model
- [`docs/design/mockup.md`](docs/design/mockup.md) Mockup and brand manual
- [Figma](https://www.figma.com/design/fMaBXAqdPYR5PV6qh3xMvY/Pen.dev-to-Figma-%C2%B7-FREE--Community-?t=WU94WV9zbpYN4iTN-1) Screens and flow

## Stack

React 19 + Vite (web client), NestJS 11 (back-end API), PostgreSQL 18 and TypeORM, in Docker. Styling is Tailwind 4, data fetching is TanStack Query. Deployment options are compared in [`architecture_diagram.md`](docs/design/architecture_diagram.md).
