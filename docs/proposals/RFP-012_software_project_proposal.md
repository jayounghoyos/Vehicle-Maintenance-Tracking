# Software Development Proposal

**Prepared for:** City Logistics Fleet  
**Prepared by:** Software Development Team  


## Project Info

| | | | |
|---|---|---|---|
| **Project Name** | Vehicle Maintenance Tracking System (MTS)[cite: 1] | | |
| **Est. Start Date** | 2026-08-08 | **Est. Finish Date** | 2026-12-05 |
| **Submitted To** | City Logistics Fleet | **Company** | City Logistics Fleet |
| **Contact Name** | Operations Manager | **Address** | City Logistics / Poblado |
| **Phone** | 32172405555 | | |
| **Email** | logistics@gmail.com | | |

| | | | |
|---|---|---|---|
| **Submitted By** | Software Development Team | **Company** | Software Development Team |
| **Contact Name** | Juan | **Address** | EAFIT |
| **Phone** | 3215904287 | | |
| **Email** | jayoungh@eafit.edu.co | | |


## Project Overview

A missed oil change does not stay cheap. The van comes off the route, the repair costs more than the preventive service would have, and the delivery it was carrying becomes an operational disruption.

City Logistics Fleet previously had no centralized, automated method to track service schedules. Maintenance dates sat in isolated spreadsheets, reminder notes were fragmented across personal calendars, and breakdown records were written down inconsistently. The information required to prevent costly downtime existed, but was siloed where operations teams could not act on it proactively.

This proposal defines a production-ready, cloud-native web application that centralizes fleet records, schedules, service event logs, and operational cost analytics into a single multi-tenant workspace[cite: 1, 2]. The platform automates status evaluations to immediately answer the central question: **what is overdue right now**[cite: 2].


## Purpose / Goals

What the fleet achieves with this system in place:

- **Eliminate overdue preventative maintenance surprises:** Automatic threshold calculations trigger alerts before vehicles breach mileage or calendar limits[cite: 2].
- **Zero silent drop-offs:** Fleet state is derived deterministically by cross-referencing live odometer readings and dates against active maintenance schedules[cite: 2].
- **100% auditable service history:** Every completed task, repair cost, technician note, and attached invoice/receipt photo is securely indexed and retrievable[cite: 1, 2].
- **Rapid onboarding:** Direct spreadsheet copy-paste import tools remove manual data re-entry bottlenecks during rollout[cite: 2].


## Scope of Work

- **Vehicle & Fleet Management:** Centralized vehicle catalog (VIN, license plate, make, model, odometer, operational status) with multi-image gallery support[cite: 2].
- **Spreadsheet Bulk Import:** Integrated CSV/TSV table pasting for seamless initial fleet and roster migrations[cite: 2].
- **Planned Maintenance Scheduling:** Recurrence rules based on calendar day intervals, odometer distance (km), or whichever threshold is reached first[cite: 2].
- **Service Event Logging:** Comprehensive records of executed maintenance and breakdown events, including cost tracking, odometer recording, and photo attachment[cite: 1, 2].
- **Overdue & Attention Dashboard:** High-priority "Needs Attention" panels, overdue banners, and aggregate fleet health KPIs[cite: 2].
- **Analytics & Reporting:** Interactive analytics summarizing fleet maintenance expense trends, service frequency, and vehicle status breakdowns[cite: 2].
- **Access Control & Multi-Tenancy:** Multi-tenant organization isolation with configurable role-based access control (RBAC)[cite: 2].
- **Custom Branding:** Client-level brand customization (custom accent colors and organization logos)[cite: 2].
- **Guided User Onboarding:** Step-by-step interactive workflow tours for team members[cite: 2].


## Out of Scope

- Live GPS route planning and route optimization[cite: 2].
- Real-time telematics hardware or live OBD-II streaming integration[cite: 2].
- Full-scale spare-parts inventory stockroom and warehouse management[cite: 2].

*(These items remain explicitly excluded per the original RFP-012 requirements[cite: 2].)*


## Architecture & Technical Implementation

The application architecture has been standardized around a modern, reliable cloud stack[cite: 1]:

- **Frontend:** Single-page application built with React, Vite, Tailwind CSS, and TanStack Query, deployed on **Vercel**[cite: 1].
- **Backend API:** Containerized **NestJS** REST API deployed on **Render** (Docker runtime) utilizing TypeORM[cite: 1].
- **Database:** Serverless **PostgreSQL** hosted on **Neon**, accessed over secure TLS connections[cite: 1].
- **Object Storage:** **Cloudinary** CDN integration for vehicle inspection and receipt photos[cite: 1].
- **Authentication:** Stateless JSON Web Token (JWT) session security with bcrypt password hashing[cite: 2].


## Obstacles & Mitigations

- **Inconsistent spreadsheet formatting:** Resolved by delivering an in-app spreadsheet copy-paste parser (`parseVehicleRows.ts`, `parseTeamRows.ts`) that validates and previews column mapping before ingestion[cite: 2].
- **Validation of overdue logic without digital records:** Resolved by developing a dual-threshold engine (`fleet-state.ts`) that flags vehicles as overdue when *either* days or mileage thresholds are crossed, verified through comprehensive automated end-to-end tests (`fleet-workflow.e2e-spec.ts`)[cite: 2].


## Deployment & Access

The application is deployed to production via automated CI/CD pipelines (`ci.yml`)[cite: 2]. Access is partitioned through dedicated web views tailored to specific permissions (Platform Admin, Operations Manager, Fleet Coordinator, and Mechanic/Service Recorder)[cite: 2].


## Timeline / Milestones

| Milestone | Deliverables & Client Value | Status / Target |
|---|---|---|
| **M1: Core Fleet & Bulk Import** | Vehicle registry, multi-photo gallery, and spreadsheet copy-paste onboarding tools[cite: 2]. | **Completed** |
| **M2: Maintenance Engine & Scheduling** | Recurrence rules (km / days), threshold evaluation engine, and task catalogue[cite: 2]. | **Completed** |
| **M3: Service Log & Cloud Attachments** | Historical logging, cost/odometer auditing, and Cloudinary photo receipt uploads[cite: 1, 2]. | **Completed** |
| **M4: Dashboard, Analytics & Access Control** | "Needs Attention" views, interactive reporting charts, custom branding, and granular RBAC[cite: 2]. | **Completed** |
| **M5: Final Verification & Handover** | Full test suite execution, platform admin validation, and production deployment[cite: 2]. | **2026-11-30** |
