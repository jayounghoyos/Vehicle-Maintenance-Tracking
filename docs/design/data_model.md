# Data Model

## First version

![First entity relationship diagram](./entity_diagram.png)

Four tables. It worked, but two things were repeated:

- Every Chevrolet NHR wrote "Chevrolet" again in its own row.
- The task was plain text, so "Oil change" and "oil change" counted as different work.

## After the feedback

![Normalized entity relationship diagram](./entity_relation.png)

Two new tables, following the professor's note on normalization:

| Table | What it fixes |
|---|---|
| `vehicle_models` | The make is written once. `vehicles` points at it. |
| `maintenance_tasks` | One list of tasks. Schedules and events both point at the same row. |

Second normal form had nothing to fix: every table has a single-column primary key, so partial dependencies cannot happen.

## Two rules to know

Due date passed and nobody logged that service = overdue.

`schedule_id` can be empty. A breakdown is work nobody planned.

Source: [`data_model.dbml`](./data_model.dbml), edited at [dbdiagram.io](https://dbdiagram.io/d/EMS-68be14fa61a46d388edda3bc).
