# Context Diagram — Vehicle Maintenance Tracking System (MTS)

## Overview
<img width="1022" height="532" alt="Captura de pantalla 2026-08-12 172537" src="https://github.com/user-attachments/assets/1ec71473-39d7-4c1e-be5b-b028f82b3078" />

This is the C4 Level 1 (Context) diagram for MTS. It shows the system as a single black box and the people who interact with it.  

## System

**MTS** *[Software System]*
A platform that centralizes vehicles, maintenance schedules, and service events, and automatically calculates what maintenance is overdue.

## Actors

| Actor | Description | Interaction |
|---|---|---|
| **Fleet Coordinator** | Registers vehicles, defines schedules, monitors overdue items. | Uses MTS via HTTPS |
| **Operations Manager** | Reviews history and overdue status for decisions. | Uses MTS via HTTPS |
| **Mechanic / Service Recorder** | Logs service events performed. | Uses MTS via HTTPS |

## Notes

- No external systems are integrated at this stage. MTS is a closed, standalone application (no telematics, no third-party APIs).
- All actors interact with the system over HTTPS through the same web client; role-based permissions determine what each can do once inside (see the [Container](./architecture_diagram.md) and [Component](./components_diagram.md) diagrams for how access is enforced).
