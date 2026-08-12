# Component Diagrams

## Containers

![Container diagram](./components_diagram.svg)

What runs and what talks to what: one web client, one API split into five services, one database.

## Backend

![Backend detail](./components_backend.svg)

The same five services, opened up. Each one is a Controller, a Service and a Repository, except Overdue, which stores nothing and only reads.
