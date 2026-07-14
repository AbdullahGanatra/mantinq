# MaintainIQ - Enterprise CMMS

## Overview
MaintainIQ is an enterprise Computerized Maintenance Management System (CMMS): asset tracking, work orders, issue reporting, maintenance scheduling, QR scanning, analytics, and role-based access. Imported as a two-app (frontend/backend) project originally designed for Docker Compose; adapted here to run natively on Replit.

## Tech Stack
- **Frontend**: React 19 + Vite + TypeScript, Tailwind CSS + shadcn/ui, TanStack Query, Framer Motion/GSAP, Recharts
- **Backend**: Node.js + Express + TypeScript, Prisma ORM, JWT auth, Winston logging, Swagger docs
- **Database**: PostgreSQL (Replit-managed, via `DATABASE_URL`)

## Project Structure
- `frontend/` — Vite React app (dev server on port 5000, the webview-facing port)
- `backend/` — Express API (dev server on port 8000, internal only)
- `backend/prisma/schema.prisma` — DB schema; migrations in `backend/prisma/migrations/`

## Running on Replit
Two workflows are configured and auto-start:
- **Frontend** (`cd frontend && npm run dev`) — Vite on port 5000, shown in the webview. Proxies `/api/*` requests to the backend on port 8000 (see `frontend/vite.config.ts`), so the browser only ever talks to one origin and CORS isn't in play.
- **Backend** (`cd backend && npm run dev`) — Express + tsx watch on port 8000 (console output only, not directly webview-exposed).

Environment files (gitignored, already created):
- `backend/.env` — `DATABASE_URL` (Replit Postgres), generated `JWT_SECRET`/`JWT_REFRESH_SECRET`, `PORT=8000`, `FRONTEND_URL` (Replit dev domain). Email (SMTP) and Cloudinary are left unconfigured (optional features) — set them if email sending or Cloudinary uploads are needed.
- `frontend/.env` — `VITE_API_URL=/api/v1` (relative, so it works through the Vite proxy in dev and would need adjusting for a separate production deployment topology).

Database: migrations applied and demo data seeded (`npx prisma db seed` from `backend/`).

**Demo logins** (see `backend/prisma/seed/seed.ts`): `admin@maintainiq.com` / `Password123!` (and manager/tech1/employee/viewer variants, same password).

## Notes on the imported code
- The original `docker-compose.yml` / Dockerfiles / nginx config are unused in this Replit setup (kept in place, untouched) — they described a container topology (separate frontend/backend/nginx/postgres containers) that doesn't map onto Replit's single dev-workflow model.
- Fixed two pre-existing bugs found while getting the app running: an invalid Prisma relation in `MaintenanceSchedule`/`WorkOrder`↔`Issue` (missing relation name / missing `@unique`), and a duplicate `Users` identifier in `frontend/src/pages/Users.tsx` (icon import shadowed the component name).

## User preferences
None recorded yet.
