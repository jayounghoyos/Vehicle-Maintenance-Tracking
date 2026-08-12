# Mockup

## Flow

![Screen flow](./mockups/flow.png)

The highlighted arrow is the one that matters: a mechanic logs a service and the vehicle leaves the coordinator's "Needs attention" list. Everything else is navigation.

## Screens

![Dashboard](./mockups/dashboard.png)

What needs attention now, plus recent activity and the fleet at a glance.

![Vehicles](./mockups/vehicles.png)

The fleet, with the selected vehicle's profile, schedules and last services beside it.

![Schedules](./mockups/schedules.png)

The rules: every N days or N kilometres, when it was last done, when it falls due.

![Service log](./mockups/service_log.png)

What the workshop recorded. The clutch on MNO345 shows "None, unplanned repair": the nullable `schedule_id` from the data model.

## Brand manual

![Brand manual](./mockups/brand_manual.png)

Status colour always carries meaning: red overdue, amber due soon, green on track. Lime is only ever the primary action.

The screens and the flow are also in [Figma](https://www.figma.com/design/fMaBXAqdPYR5PV6qh3xMvY/Pen.dev-to-Figma-%C2%B7-FREE--Community-?t=WU94WV9zbpYN4iTN-1).

Source files are the `.pen` files in [`mockups/`](./mockups), edited with the [pen.dev](https://pen.dev) CLI.
