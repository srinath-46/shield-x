# Shield X project structure

The application keeps the Next.js App Router hierarchy intact so that every existing URL and API endpoint remains unchanged.

```text
ShieldX/
|-- docs/                    Product and engineering documentation
|-- prisma/                  PostgreSQL schema and migrations
|-- public/                  Static public assets
|-- scripts/                 Maintenance and operational scripts
|-- src/
|   |-- app/                 Pages, layouts and API route handlers
|   |   |-- api/             Backend HTTP endpoints
|   |   |-- admin/           Protected Admin portal routes
|   |   |-- supervisor/      Protected Supervisor portal routes
|   |   |-- worker/          Protected Worker portal routes
|   |   `-- ...              Public website and authentication routes
|   |-- components/
|   |   |-- admin/           Admin-only interactive components
|   |   |-- marketing/       Public website components
|   |   |-- portal/          Shared authenticated-portal components
|   |   `-- supervisor/      Supervisor workflow components
|   |-- generated/           Generated Prisma client; do not edit manually
|   |-- lib/                 Authentication, data and integration services
|   `-- styles/
|       |-- base/            Global foundations
|       |-- brand/           Shield X and VMV visual identity
|       |-- marketing/       Public website sections and pages
|       `-- portal/          Admin, Supervisor and Worker portal styles
|-- middleware.ts            Route access middleware
`-- .env                     Local secrets and service configuration
```

## Placement rules

- Keep route files under `src/app`; their folders define public URLs.
- Put reusable UI in the component group that owns it.
- Put global CSS in `src/styles`; the root layout controls its load order.
- Keep server and integration logic in `src/lib`, not inside visual components.
- Keep generated Prisma files under `src/generated` and regenerate them through Prisma rather than editing them.
- Never commit `.env` or move secrets into source files.

