# Vehicle Maintenance Tracking

Internal tool for a small delivery fleet to track vehicle records, preventive maintenance schedules, and service history — replacing spreadsheets and calendar reminders.

## Status

Early planning. See `docs/` for the RFP and proposal documents.

## MVP scope

- Vehicle profiles
- Planned maintenance schedule
- Service event log
- Overdue/upcoming maintenance view

## Docs

- [`docs/RFP-012_Vehicle_Maintenance_Tracking.pdf`](docs/RFP-012_Vehicle_Maintenance_Tracking.pdf) — original RFP
- [`docs/proposals/RFP-012_statement_of_work.md`](docs/proposals/RFP-012_statement_of_work.md) — Statement of Work
- [`docs/proposals/RFP-012_software_project_proposal.md`](docs/proposals/RFP-012_software_project_proposal.md) — Project proposal
- [`docs/design/use_cases_diagram.md`](docs/design/use_cases_diagram.md) — Use case diagram
- [`docs/design/components_diagram.md`](docs/design/components_diagram.md) — Component diagram
- [`docs/design/architecture_diagram.md`](docs/design/architecture_diagram.md) — AWS deployment architecture
- [`docs/design/data_model.md`](docs/design/data_model.md) — Data model (ER)
- [`docs/design/mockup.md`](docs/design/mockup.md) — Mockup and brand manual

## Stack

React (web client), NestJS (back-end API), PostgreSQL, in Docker, deployed on AWS.

SQL first (to make sharing the DB simple), migrating to PostgreSQL later.

https://www.figma.com/community/file/1084032849269981099/knowns-and-unknowns-framework
