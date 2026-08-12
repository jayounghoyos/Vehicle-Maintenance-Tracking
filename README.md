# Vehicle Maintenance Tracking System (MTS)

Internal tool for a small delivery fleet to track vehicle records, preventive maintenance schedules, and service history (replacing spreadsheets and calendar reminders).

## The problem

The fleet currently tracks service dates in spreadsheets and calendar reminders, and breakdown notes are not recorded consistently. As a result preventive maintenance gets missed, vehicles spend avoidable time out of service, and the people making operational decisions have no history at hand when they need it.

## What the system does

MTS brings the vehicles, their maintenance schedules and the record of the services performed into one place. From those it works out on its own what is overdue or coming up, by comparing the schedule against the log, so nobody has to open a spreadsheet to find out.


## Docs

- [`docs/RFP-012_Vehicle_Maintenance_Tracking.pdf`](docs/RFP-012_Vehicle_Maintenance_Tracking.pdf)  Original RFP
- [`docs/proposals/RFP-012_statement_of_work.md`](docs/proposals/RFP-012_statement_of_work.md) Statement of Work
- [`docs/proposals/RFP-012_software_project_proposal.md`](docs/proposals/RFP-012_software_project_proposal.md) Project proposal
- [`docs/proposals/mvp_scope.md`](docs/proposals/mvp_scope.md) MVP scope
- [`docs/design/use_cases_diagram.md`](docs/design/use_cases_diagram.md) Use case diagram
- [`docs/design/components_diagram.md`](docs/design/components_diagram.md) Component diagram
- [`docs/design/architecture_diagram.md`](docs/design/architecture_diagram.md) AWS deployment architecture
- [`docs/design/data_model.md`](docs/design/data_model.md) Data model
- [`docs/design/mockup.md`](docs/design/mockup.md) Mockup and brand manual

## Stack

React (web client), NestJS (back-end API), PostgreSQL, in Docker. Deployment options are compared in [`architecture_diagram.md`](docs/design/architecture_diagram.md).