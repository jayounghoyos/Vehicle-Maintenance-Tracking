# Component Diagram

![Component diagram for the Vehicle Maintenance Tracking System](./components_diagram.svg)

---


Every component reads and writes the same SQL database directly, since this is a small, single-team system rather than a set of independently deployed services.

Four of the five domain components come straight from the SOW's MVP scope: Vehicle Profiles, Maintenance Scheduling, Service Event Log, and Overdue Engine. Authentication is not in the RFP text, but the system needs a way to log in, so it is included as a confirmed component.

There is no Reporting component. The RFP lists "reporting snapshot" under Deliverables Expected, not under Suggested MVP Scope, and groups it with "QA evidence" — both read as a one-time handoff artifact the team assembles at delivery (a frozen export of the data plus test evidence), not a screen the Operations Manager uses day to day.