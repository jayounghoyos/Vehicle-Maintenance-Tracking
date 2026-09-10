# Vehicle Maintenance Tracking System (MTS)

Internal tool for a small delivery fleet to track vehicle records, preventive maintenance schedules, and service history (replacing spreadsheets and calendar reminders).

## The problem

The fleet currently tracks service dates in spreadsheets and calendar reminders, and breakdown notes are not recorded consistently. As a result preventive maintenance gets missed, vehicles spend avoidable time out of service, and the people making operational decisions have no history at hand when they need it.

## What the system does

MTS brings the vehicles, their maintenance schedules and the record of the services performed into one place. From those it works out on its own what is overdue or coming up, by comparing the schedule against the log, so nobody has to open a spreadsheet to find out.

## Running it

Requires Node 24, pnpm and Docker.

```bash
pnpm install
cp .env.example .env
pnpm db:up              # postgres in docker, on 5433
pnpm migration:run      # creates the schema, which migrations own
pnpm seed               # demo fleet and a year of service history
pnpm dev                # api on :3002, web on :5173
```

Running the migrations is not optional. A fresh postgres container comes up
empty, and the tables only exist once the migrations have created them. TypeORM
can build them from the entity classes instead, through its synchronize option,
but that is deliberately off here: the schema is only ever written by a migration
somebody wrote and reviewed, so the database on a laptop is built the same way as
the one in production.

Skipping it fails confusingly rather than obviously. Postgres accepts the
connection, the health endpoint reports the database up, and the first login is
what finally errors, on a table that was never created.

Then open http://localhost:5173 and sign in. Every seeded account uses the
password mts-dev-password:

| Account                 | Sees                          |
| ----------------------- | ----------------------------- |
| ana@citylogistics.co    | Fleet coordinator, everything |
| carlos@citylogistics.co | Mechanic, no reports          |
| laura@citylogistics.co  | Operations manager            |
| admin@mts.local         | Platform admin                |

The API documents itself at http://localhost:3002/docs and reports its health at
/api/health. Ports live in .env, and the defaults avoid 5432 and 3000 because
a system Postgres and most editors' preview servers already hold them. Setting
DATABASE_URL points everything at a database somewhere else and the five DB_
values are ignored.

## Testing it

```bash
pnpm test                      # unit tests, no database
pnpm --filter api test:e2e     # integration tests, through HTTP into postgres
```

Every query in the API is scoped to one organization by the query builder, and a
unit test cannot see when that scope goes missing, because the builder it was
handed is a mock that agrees with whatever it is asked. The integration tests run
the real thing instead, from the HTTP request through the guards and services
into postgres, against a database of their own that they create and wipe.

## Deploying it

Three free tiers: **Vercel** serves the client, **Render** runs the API, **Neon**
holds the database. The browser only ever talks to Vercel, which forwards /api
to Render, so no API host is baked into the client and there is no CORS to set up.

render.yaml and vercel.json configure both services. What is not in them, and
has to be pasted into Render's dashboard, is DATABASE_URL from Neon,
WEB_ORIGIN once Vercel has issued a domain, and the three CLOUDINARY_ values
that send vehicle photos to an object store instead of to Render's disk, which is
wiped on every deploy. Leave those three empty and the app runs with photo upload
switched off.

Migrations run on start, since Render offers pre-deploy steps only on paid plans.
For the demo data, run pnpm seed:prod from Render's shell.

Two things that bite:

- **The Render hostname is not always the service name.** onrender.com
  subdomains are unique across every account, so a taken name gets a suffix. Read
  the real URL off the service page after the first deploy and make vercel.json
  match, or the client forwards /api into nothing.
- **A free Render service sleeps after fifteen minutes** and takes about a minute
  to wake. Open the app before presenting.

## Docs

- [`docs/RFP-012_Vehicle_Maintenance_Tracking.pdf`](docs/RFP-012_Vehicle_Maintenance_Tracking.pdf) Original RFP
- [`docs/proposals/RFP-012_statement_of_work.md`](docs/proposals/RFP-012_statement_of_work.md) Statement of Work
- [`docs/proposals/RFP-012_software_project_proposal.md`](docs/proposals/RFP-012_software_project_proposal.md) Project proposal
- [`docs/proposals/mvp_scope.md`](docs/proposals/mvp_scope.md) MVP scope
- [`docs/design/context_diagram.md`](docs/design/context_diagram.md) Context diagram
- [`docs/design/use_cases_diagram.md`](docs/design/use_cases_diagram.md) Use case diagram
- [`docs/design/components_diagram.md`](docs/design/components_diagram.md) Component diagram
- [`docs/design/architecture_diagram.md`](docs/design/architecture_diagram.md) AWS deployment architecture
- [`docs/design/api_contracts.md`](docs/design/api_contracts.md) API contract
- [`docs/design/data_model.md`](docs/design/data_model.md) Data model
- [`docs/design/mockup.md`](docs/design/mockup.md) Mockup and brand manual
- [Figma](https://www.figma.com/design/fMaBXAqdPYR5PV6qh3xMvY/Pen.dev-to-Figma-%C2%B7-FREE--Community-?t=WU94WV9zbpYN4iTN-1) Screens and flow

## Working on the code

[`AGENTS.md`](AGENTS.md) holds the conventions this repository follows — how queries are scoped to an organization, where a permission is checked, how commits and branches are named, which commands are safe to run. Read it before the first change, whether you are writing the code yourself or handing the task to an assistant.

[`docs/ai/prompts/`](docs/ai/prompts) holds three reusable prompt templates: [adding an API module](docs/ai/prompts/api-module.md), [building a web screen](docs/ai/prompts/web-screen.md), and [fixing a bug](docs/ai/prompts/bug-fix.md).

## Project wiki

Everything about how the project is run rather than how the code works lives in the [wiki](https://github.com/jayounghoyos/Vehicle-Maintenance-Tracking/wiki).

- [Backlog](https://github.com/jayounghoyos/Vehicle-Maintenance-Tracking/wiki/Backlog) — milestone status, user stories, and the questions still open with the client
- [Architecture](https://github.com/jayounghoyos/Vehicle-Maintenance-Tracking/wiki/Architecture) — how the pieces fit together
- [AI usage](https://github.com/jayounghoyos/Vehicle-Maintenance-Tracking/wiki/AI-usage) — which tools were used, how their output was checked, and where it failed
- [Status updates](https://github.com/jayounghoyos/Vehicle-Maintenance-Tracking/wiki/Status-updates) — the weekly report to the client
- [Client meetings](https://github.com/jayounghoyos/Vehicle-Maintenance-Tracking/wiki/Client-meetings) — what was agreed, and which features came out of it
- [Mockups](https://github.com/jayounghoyos/Vehicle-Maintenance-Tracking/wiki/Mockups) — the design each screen was built against
## Stack

React 19 + Vite (web client), NestJS 11 (back-end API), PostgreSQL 18 and TypeORM, in Docker. Styling is Tailwind 4, data fetching is TanStack Query. Deployment options are compared in [`architecture_diagram.md`](docs/design/architecture_diagram.md).
