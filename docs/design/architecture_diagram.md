### Architecture Overview


This diagram illustrates the end-to-end architecture of a full-stack vehicle maintenance tracking system (MTS):

* **Client & Presentation (Vercel):** Users access a responsive Single Page Application through a web browser over HTTPS (REST/JSON). The frontend is bootstrapped with **Vite**, written in **React**, styled with **Tailwind CSS**, and uses **React Router** for routing and **TanStack Query** for asynchronous data fetching and state caching.
* **Application API (Render):** The frontend forwards REST requests to a containerized **NestJS** backend running inside a **Docker** container on Render. Using **TypeORM** for data persistence, the service isolates core business modules:
  * Authentication & Session Control (`Auth/JWT`)
  * Fleet Registry (`Vehicles`, `Vehicle Models`)
  * Maintenance Planning (`Maintenance Scheduling`, `Maintenance Tasks`)
  * Operations Logging (`Service Events`)
  * Aggregation & Metrics (`Dashboard`, `Reports`)
* **Relational Storage (Neon):** The API executes SQL queries over an encrypted TLS connection to a serverless **PostgreSQL** database hosting the schema for:
  * Multi-tenancy & Access Control (`Organizations`, `Users`, `Roles / Permissions`)
  * Asset Tracking (`Vehicles`, `Vehicle Models`)
  * Work Orders & Schedules (`Maintenance Tasks`, `Maintenance Schedules`, `Service Events`)
  * Media References (`Vehicle Photos metadata`)
* **Media & Asset Storage (Cloudinary):** Handles direct object/image storage for vehicle photos and service inspection imagery, referenced relationally via metadata URLs in the PostgreSQL instance.
