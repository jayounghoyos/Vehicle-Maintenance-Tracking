# MVP Scope — Vehicle Maintenance Tracking System (RFP-012)

Framework: **IN** (build now) / **OUT** (explicitly excluded) / **LATER** (future phase, not MVP) / **UNKNOWN** (needs a decision before/while building)

## IN

- **Vehicle profiles**: create, view, edit vehicle records (plate, make, model, year, odometer, status)
- **User accounts & roles**: fleet coordinator, mechanic/service recorder, operations manager, each with role-based access
- **Planned maintenance schedule**: define recurring service items per vehicle (task, interval in days/km, next due date/km)
- **Service event log**: record completed maintenance or breakdown events per vehicle (type, date, odometer, notes, recorded by)
- **Overdue / upcoming maintenance view**: derive and display maintenance items that are due soon or overdue, based on schedule vs. logged events
- **Reporting snapshot**: exportable/viewable summary of maintenance status for delivery
- **QA evidence**: test results/checklist delivered alongside the MVP

## OUT

- Route planning or fuel optimization
- Telematics or live vehicle data integration
- Complex spare-parts inventory management

*(These are explicitly excluded per RFP-012 — not a "maybe later," but out of scope for this engagement entirely.)*

## LATER

- Automated reminders/notifications (email or SMS) for upcoming maintenance
- Support for multiple fleet teams within the same instance
- Advanced analytics/reporting dashboards (trends, cost tracking over time)
- Mobile-friendly or native mobile app version
- Data import tooling from the client's existing spreadsheets

## UNKNOWN

- Authentication mechanism for the MVP (session-based vs. token/JWT) — data model has a `password` field but the auth strategy isn't decided yet
- Hosting/CI-CD specifics beyond "AWS" (which services, how deployment is triggered) — architecture diagram shows AWS but deployment approach is still "to be confirmed during design phase" per the proposal
- How overdue logic will be validated against real fleet expectations, given there's no historical digital data to test against
- Whether odometer-based intervals (km) or date-based intervals (days) take priority when both are defined for the same schedule item
