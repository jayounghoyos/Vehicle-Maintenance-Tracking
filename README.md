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
pnpm dev                # api on :3002, web on :5173
```

Then open http://localhost:5173. The page reports whether the API and the database are reachable.

| | |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:3002/api |
| Health | http://localhost:3002/api/health |
| API docs | http://localhost:3002/docs |
| Postgres | `localhost:5433` |

`pnpm up` runs the API in Docker too, instead of on the host.

Ports are set in `.env`. The defaults avoid 5432 and 3000 because a system Postgres and most editors' preview servers already hold them.

## Layout

```
apps/api    NestJS + TypeORM
apps/web    React + Vite + Tailwind
docs        RFP, proposals, design
```


## Docs

- [`docs/RFP-012_Vehicle_Maintenance_Tracking.pdf`](docs/RFP-012_Vehicle_Maintenance_Tracking.pdf)  Original RFP
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
