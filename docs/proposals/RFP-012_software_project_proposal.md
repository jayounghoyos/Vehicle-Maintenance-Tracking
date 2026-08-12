# Software Development Proposal

**Prepared for:** City Logistics Fleet
**Prepared by:** Software Development Team


## Project Info

| | | | |
|---|---|---|---|
| **Project Name** | Vehicle Maintenance Tracking System (MTS) | | |
| **Est. Start Date** | 2026-08-08 | **Est. Finish Date** | 2026-12-05 |
| **Submitted To** | City Logistics Fleet | **Company** | City Logistics Fleet |
| **Contact Name** | Operations Manager | **Address** | City Logistics/Poblado |
| **Phone** | 32172405555 | | |
| **Email** | logistics@gmail.com | | |

| | | | |
|---|---|---|---|
| **Submitted By** | Software Development Team | **Company** | Software Development Team |
| **Contact Name** | Juan | **Address** | EAFIT |
| **Phone** | 3215904287 | | |
| **Email** | jayoungh@eafit.edu.co | | |


## Project Overview

A missed oil change does not stay cheap. The van comes off the route, the repair costs more than the service would have, and the delivery it was carrying is somebody else's problem that day.

City Logistics Fleet has no reliable way to know which vehicle is due. Service dates sit in spreadsheets, reminders sit in calendars, and breakdown notes are written down inconsistently or not at all so maintenance is usually discovered late, once the vehicle is already out of service. The information needed to prevent that exists; it is just scattered where nobody can act on it.

This proposal covers an internal application that puts vehicle records, maintenance schedules and service history in one place, and uses them to answer one question the fleet cannot answer today: what is overdue right now.


## Purpose / Goals

What the fleet should be able to measure once this is in place:

- **80% fewer overdue preventive maintenance items** than the current spreadsheet process produces.
- **No vehicle silently drops off the list.** Overdue items are surfaced with zero false negatives   the system is only useful if it can be trusted to be complete.
- **100% of logged services are usable**, each with its vehicle, date and outcome, so history is worth consulting when deciding what to put on the road.


## Scope of Work

- **Vehicle profiles** — one record per vehicle, so the fleet stops living in a spreadsheet that only one person maintains.
- **Planned maintenance schedule** — the interval rules per vehicle, so "when is it due" stops being someone's memory.
- **Service event log** — what was actually done, including the breakdowns that today go unrecorded.
- **Overdue and upcoming view** — the schedule compared against the log, so nothing is discovered late.
- **Reporting snapshot and QA evidence** at delivery, so the client can verify what was built.


## Out of Scope

- Route planning or fuel optimization.
- Telematics or live vehicle data integration.
- Complex spare-parts inventory management.


## Obstacles

- Existing maintenance history lives in spreadsheets/calendars with inconsistent formatting, which may complicate any future data import.
- No prior digital record of breakdowns, so overdue logic will need validation against real-world fleet expectations rather than historical data.


## Deployment / Distribution

The application will be deployed as an internally accessible web application for the fleet coordinator, mechanic/service recorder, and operations manager roles. Deployment approach and hosting details will be confirmed during the design phase.


## Timeline / Milestones

Each milestone ends with something the client can use, not just something built.

| Milestone | What the client gets | Reporting | Deadline |
|---|---|---|---|
| Vehicle profiles | The fleet is registered in one place, off the spreadsheet | Progress demo | 2026-09-19 |
| Planned maintenance schedule | Every vehicle has its intervals defined | Progress demo | 2026-09-30 |
| Service event log | The workshop records services and breakdowns as they happen | Progress demo | 2026-10-31 |
| Overdue view + final QA/demo | The question "what is overdue" is answered on screen | Final demo | 2026-11-30 |
