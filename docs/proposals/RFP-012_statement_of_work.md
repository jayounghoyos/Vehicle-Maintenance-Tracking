# Statement Of Work — Vehicle Maintenance Tracking (RFP-012)

Contents:

- [Statement of work template](#statement-of-work-template)
  - [Title](#title)
  - [Abstract](#abstract)
  - [Value](#value)
  - [Scope](#scope)
  - [Payment](#payment)
- [Purpose](#purpose)
  - [Objectives](#objectives)
  - [Performance](#performance)
- [Who does what](#who-does-what)
  - [People](#people)
  - [Roles](#roles)
  - [Responsibilities](#responsibilities)
- [Context](#context)
  - [Present](#present)
  - [Future](#future)
- [Planning](#planning)
  - [Requirements](#requirements)
- [Other terms and conditions](#other-terms-and-conditions)
  - [Client's obligations](#clients-obligations)
- [Schedule](#schedule)
  - [Expected start date and completion date](#expected-start-date-and-completion-date)
  - [Sign-off](#sign-off)


## Statement of work template


### Title

Vehicle Maintenance Tracking System


### Abstract

City Logistics Fleet currently tracks vehicle service dates in spreadsheets and calendar reminders, with breakdown and maintenance notes recorded inconsistently. This causes missed preventive maintenance and avoidable vehicle downtime, and leaves managers without a reliable view of maintenance history. This Statement of Work covers the design and delivery of an internal maintenance tracking application for a single fleet team, providing vehicle profiles, a planned maintenance schedule, a service event log, and an overdue-maintenance view. The engagement is scoped to a single fleet team and basic service events, with no telematics, route planning, or spare-parts inventory functionality.


### Value

The total project value is currently pending negotiation.

The estimated value of this project covers the design, development, testing, deployment, and documentation of the maintenance tracking application, including the vehicle profile, scheduling, service log, and overdue-view features, as well as the reporting snapshot and QA evidence delivered at project close. Value is tied to the delivery of a working MVP rather than to hours spent, and payment, where applicable, would be aligned to the completion of each milestone rather than paid as a lump sum.


### Scope

In scope: vehicle profiles, a planned maintenance schedule, a service event log, and an overdue/upcoming maintenance view, built for a single fleet team (fleet coordinator, mechanic/service recorder, operations manager). Out of scope: route planning, fuel optimization, telematics or live vehicle data integration, and complex spare-parts inventory management. Delivery includes the application itself, scheduling/history views, and a reporting snapshot with QA evidence.


### Payment

Payment terms are pending negotiation, consistent with the Value section above. Payment would be released per milestone (vehicle profiles, maintenance schedule, service event log, overdue view) rather than as a single lump sum, so that payment tracks delivered, demonstrable functionality.


## Purpose


### Objectives

- Give fleet coordinators a single source of truth for vehicle records and maintenance history, replacing spreadsheets and calendar reminders.
- Ensure preventive maintenance items are visible before they become overdue, reducing avoidable vehicle downtime.
- Give operations managers a clear, at-a-glance view of upcoming and overdue maintenance to support operational decisions.


### Performance

Business performance:

- **Preventive maintenance compliance:** overdue preventive maintenance items reduced by 80% compared to the current spreadsheet-based process.

Technical performance:

- **Data completeness:** 100% of logged service events include vehicle, date, and outcome notes.
- **Overdue accuracy:** overdue maintenance items are surfaced with zero false negatives against the planned schedule.

## Who does what


### People

- **Client:** City Logistics Fleet.
- **Contractor:** Development team responding to RFP-012.


### Roles

- **Fleet coordinator:** registers vehicles, defines maintenance schedules, monitors overdue items.
- **Mechanic / service recorder:** logs completed service events and maintenance notes.
- **Operations manager:** reviews maintenance history and overdue status to inform operational decisions.

### Responsibilities

| Area | Fleet coordinator | Mechanic/recorder | Ops manager | Dev team |
|---|---|---|---|---|
| Define requirements & priorities | A | C | C | R |
| Vehicle profile management | R | I | I | Responsible for building |
| Service event logging | I | R | I | Responsible for building |
| Maintenance scheduling & overdue tracking | R | I | C | Responsible for building |
| QA / acceptance | C | C | A | R |

(R: Responsible, A: Accountable, C: Consultable, I: Informable)


## Context


### Present

City Logistics Fleet is a small delivery fleet operation. Vehicle service dates live in spreadsheets and calendar reminders; breakdown and maintenance notes are not stored consistently. There is no shared system for maintenance history, so preventive maintenance is missed and managers lack visibility when making operational decisions.


### Future

Out of scope for this engagement and left for potential future phases, are route planning, fuel optimization, telematics/live vehicle data integration, and complex spare-parts inventory management. The MVP is intentionally scoped to one fleet team and basic service events so it can be delivered and validated before any such expansion is considered.


## Planning


### Requirements

MVP deliverables, in order of dependency:

1. **Vehicle profiles**: create/view/edit vehicle records (identification, make/model, status). Foundation for all other features.
2. **Planned maintenance schedule**: define recurring/planned service items per vehicle (e.g., oil change interval).
3. **Service event log**: record completed maintenance/breakdown events against a vehicle, with date and notes.
4. **Overdue view**: derive and display upcoming and overdue maintenance items from the schedule and event log.

Completion of the MVP is signaled by: all four features implemented, a working end-to-end demo (register vehicle → schedule maintenance → log service → see overdue status), a reporting snapshot, and QA evidence (test results/checklist) attached to the deliverable.


## Other terms and conditions


### Client's obligations

- Provide the RFP-012 requirements and clarify scope/priority questions as they arise.
- Review and comment on proposed schedules or demos within a reasonable time.
- Provide feedback needed to validate the overdue-maintenance logic against real fleet expectations.


## Schedule


### Expected start date and completion date

The services of the Contractor will be required for a period of approximately four months, commencing on or about 2026-08-08, with expected MVP completion on or about 2026-12-05.


### Sign-off

NOTE: Before signing the Statement of Work, if you have any questions or concerns, please call the Work Authority indicated above to negotiate any issues.

If you agree to the requirements of this Statement of Work, please sign and date the document which will be accepted as your proposal by Client, and return to my attention.

Please return an original signature copy by mail.


Printed Name:

__________________________________________


Signature:

__________________________________________


Date:

__________________________________________
