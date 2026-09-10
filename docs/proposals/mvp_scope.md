# MVP Scope — Vehicle Maintenance Tracking System (RFP-012)

Framework: **IN** (built & verified) / **OUT** (explicitly excluded) / **LATER** (future phase, not MVP) / **RESOLVED / IMPLEMENTED** (previously unknown or deferred, now settled in code)

## IN

- **Vehicle profiles**: Create, view, edit, filter, and track vehicle records (license plate, VIN, make, model, year, odometer, operational status)[cite: 2]. Includes a vehicle gallery with multi-photo uploads and primary thumbnail selection[cite: 2].
- **User accounts & roles**: Complete authentication and authorization supporting fleet managers, technicians, coordinators, and platform admins[cite: 2]. Expanded into configurable role-based access control (RBAC) with granular permissions[cite: 2].
- **Planned maintenance schedule**: Configurable recurring service tasks linked to vehicle models or specific vehicles, tracking intervals by calendar days, mileage (km), or both[cite: 2].
- **Service event log**: Comprehensive logging of completed preventative maintenance and repairs (service task, date, odometer reading, costs, notes, technician attribution, and Cloudinary-backed receipt/photo attachments)[cite: 1, 2].
- **Overdue / upcoming maintenance view**: Real-time fleet status evaluation with visual indicators, overdue alert banners, and dedicated "Needs Attention" tables comparing current odometer/date against schedule thresholds[cite: 2].
- **Reporting snapshot**: Interactive analytical reports with summary KPI cards and configurable charts (cost trends, service volume, status breakdowns)[cite: 2].
- **Multi-tenant organization management**: Complete tenant isolation allowing distinct organizations to manage their own fleets, users, and custom branding (accent colors and logos)[cite: 2].
- **Bulk spreadsheet import**: In-app CSV/TSV copy-paste import tooling to onboard vehicle fleets (`ImportVehicles.tsx`) and team rosters (`ImportTeam.tsx`) without manual entry[cite: 2].
- **QA & test coverage**: Unit test suites, end-to-end integration workflows (`fleet-workflow.e2e-spec.ts`, `tenant-isolation.e2e-spec.ts`), and CI pipelines (`ci.yml`)[cite: 2].

## OUT

- Route planning or fuel consumption optimization[cite: 2].
- Real-time telematics hardware or direct OBD-II live stream integration[cite: 2].
- Complex spare-parts inventory stockroom management and supplier procurement[cite: 2].

*(These remain explicitly excluded per RFP-012 guidelines[cite: 2].)*

## LATER

- **Automated external notifications**: Push notifications, email digests, or SMS alerts (e.g., via SendGrid or Twilio) for pending/overdue maintenance items.
- **Exportable audit packages**: Direct PDF generation for work order receipts and compliance history exports.
- **Parts catalog per event**: Line-item tracking of parts used during service logging.
- **Native mobile applications**: Dedicated iOS and Android native apps (currently served as a responsive mobile-friendly web layout)[cite: 2].

## RESOLVED / IMPLEMENTED

*(Items previously classified as UNKNOWN or deferred to LATER that are now fully resolved and implemented in the repository[cite: 2]):*

- **Authentication mechanism**: Resolved using stateless JWT Bearer authentication with hashed passwords (bcrypt), Passport JWT strategy, and persistent client session storage[cite: 2].
- **Hosting & CI/CD pipeline**: Resolved and deployed using **Vercel** for the React + Vite frontend and **Render** (via containerized Dockerfile) for the NestJS backend, connected to a serverless **Neon PostgreSQL** database with Cloudinary asset storage[cite: 1, 2]. Automation is handled via GitHub Actions (`ci.yml`)[cite: 2].
- **Interval priority & overdue logic**: Resolved in `fleet-state.ts` and `maintenance.ts`[cite: 2]. The evaluation engine checks both days and odometer thresholds independently[cite: 2]; a schedule item triggers **OVERDUE** or **DUE SOON** whenever *either* condition breaches its respective threshold[cite: 2].
- **Spreadsheet onboarding**: Shifted from LATER to IN[cite: 2]. Built-in parsers (`parseVehicleRows.ts`, `parseTeamRows.ts`) and modal UI components allow direct spreadsheet table pasting during initial fleet setup[cite: 2].
- **Multi-tenant architecture**: Shifted from LATER to IN[cite: 2]. Full multi-tenancy is implemented at the schema level with tenant ID isolation on all primary repositories and a separate platform admin console[cite: 2].
