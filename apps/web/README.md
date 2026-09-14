# Shield X

Production Next.js application implementing the PDF workflow with PostgreSQL/Prisma, Firebase Authentication, Razorpay and Resend. There is no demo dataset or mock-data fallback.

## Run

1. Keep the real credentials in `.env` and add `NEXT_PUBLIC_APP_URL` plus stable `LICENSE_PRIVATE_KEY` / `LICENSE_PUBLIC_KEY` PEM values for production.
2. Run `npm install`.
3. Run `npm run db:push` (or create a migration with `npm run db:migrate`).
4. Run `npm run dev`.

Registration creates the plan catalog as durable database records, opens Razorpay checkout, and creates the organization only after server-side signature verification. Admins invite supervisors; supervisors invite workers. Invitation tokens are single-use and only SHA-256 hashes are stored.

## Production configuration added by the 45-point implementation

- `RAZORPAY_WEBHOOK_SECRET`: validates `/api/payments/webhook` events.
- `CRON_SECRET`: protects `/api/cron/subscriptions`; invoke it daily with `Authorization: Bearer <secret>` for 30/15/7/1-day reminders and expiry processing.
- `SHIELDX_DEVICE_API_KEY`: authenticates ESP32 receiver telemetry sent to `/api/telemetry` in the `x-shieldx-device-key` header.
- `LICENSE_PRIVATE_KEY` and `LICENSE_PUBLIC_KEY`: stable RSA PEM keys. Production license creation fails closed when they are absent. Each new license stores an RSA-SHA256 signed payload that binds its key to the organization, subscription, plan, issue date and expiry date.
- `SUPERVISOR_DESKTOP_DOWNLOAD_URL` and `SHIELDX_MOBILE_DOWNLOAD_URL`: release URLs shown only to licensed roles.
- `SITE_CAMERA_STREAM_URL`: protected camera endpoint made available to assigned Supervisors.

Firebase email verification is required before a session cookie is created. Password resets use Firebase Authentication. Hardware, camera, native application binaries, Firebase Cloud Messaging credentials and deployment HTTPS must be supplied by the client infrastructure; the website does not fabricate these external resources.

## Code organization

The App Router route tree remains unchanged. Reusable components and global styles are grouped by responsibility; see [`docs/project-structure.md`](docs/project-structure.md).
