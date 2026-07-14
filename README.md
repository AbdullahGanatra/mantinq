# MaintainIQ - Enterprise CMMS

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-5.15-2D3748?logo=prisma&logoColor=white" />
</p>

**MaintainIQ** is a premium enterprise-grade Computerized Maintenance Management System (CMMS) built for schools, hospitals, factories, warehouses, hotels, and facility management companies.

## Features

- **Asset Management** - Track, manage, and monitor all assets with QR codes
- **Work Orders** - Create, assign, and track maintenance work orders
- **Issue Reporting** - Report and resolve issues with full audit trail
- **Maintenance Scheduling** - Preventive and corrective maintenance planning
- **QR Code Scanner** - Quick asset lookup via QR scanning
- **Analytics & Reports** - Maintenance cost, technician performance, asset utilization
- **Role-Based Access** - 6 user roles with granular permissions
- **Real-time Notifications** - In-app and email notifications
- **Dark Mode** - Premium dark/light theme support
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

### Frontend
- React 19 + Vite + TypeScript
- Tailwind CSS + shadcn/ui components
- Framer Motion + GSAP animations
- TanStack Query (React Query)
- Recharts for analytics
- Lucide React icons

### Backend
- Node.js + Express.js + TypeScript
- Prisma ORM + PostgreSQL
- JWT Authentication + Refresh Tokens
- bcrypt password hashing
- Rate limiting + Helmet security
- Swagger API documentation
- Winston logging

### DevOps
- Docker + Docker Compose
- Nginx reverse proxy
- GitHub Actions CI/CD

## Quick Start (Docker)

```bash
# 1. Navigate to project
cd MaintainIQ

# 2. Copy environment file
cp backend/.env.example backend/.env

# 3. Start all services
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost
# API: http://localhost/api/v1
# API Docs: http://localhost/api-docs
# Health Check: http://localhost/health
```

## Manual Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed demo data
npx prisma db seed

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Organization Admin | admin@maintainiq.com | Password123! |
| Maintenance Manager | manager@maintainiq.com | Password123! |
| Technician | tech1@maintainiq.com | Password123! |
| Employee | employee@maintainiq.com | Password123! |
| Viewer | viewer@maintainiq.com | Password123! |

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new organization
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Assets
- `GET /api/v1/assets` - List assets (paginated, searchable)
- `GET /api/v1/assets/:id` - Get asset details
- `POST /api/v1/assets` - Create asset
- `PUT /api/v1/assets/:id` - Update asset
- `DELETE /api/v1/assets/:id` - Delete asset
- `GET /api/v1/assets/:id/qr` - Generate QR code
- `POST /api/v1/assets/scan` - Scan QR code

### Work Orders
- `GET /api/v1/work-orders` - List work orders
- `GET /api/v1/work-orders/:id` - Get work order details
- `POST /api/v1/work-orders` - Create work order
- `PUT /api/v1/work-orders/:id` - Update work order
- `DELETE /api/v1/work-orders/:id` - Delete work order

### Issues
- `GET /api/v1/issues` - List issues
- `GET /api/v1/issues/:id` - Get issue details
- `POST /api/v1/issues` - Report issue
- `PUT /api/v1/issues/:id` - Update issue
- `DELETE /api/v1/issues/:id` - Delete issue

### Users
- `GET /api/v1/users` - List users
- `GET /api/v1/users/:id` - Get user details
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `PUT /api/v1/users/profile` - Update profile

### Reports
- `GET /api/v1/reports/maintenance-cost` - Maintenance cost report
- `GET /api/v1/reports/technician-performance` - Technician performance
- `GET /api/v1/reports/asset-utilization` - Asset utilization
- `GET /api/v1/reports/issue-resolution` - Issue resolution metrics

### Public (no login — QR code destination)
- `GET /api/v1/public/assets/:id` - Safe public asset page (name, code, category, location, status, last/next service, recent activity). No serials, costs, private notes, or user data.
- `POST /api/v1/public/assets/:id/issues` - Report an issue from the public asset page (reporter name/email/phone, no account needed)
- `GET /api/v1/public/issues/:issueNumber?code=XXXXXX` - Check a reported issue's status with its tracking code

### AI Issue Triage
- `POST /api/v1/ai/triage-issue` - Body: `{ complaint, assetId? }`. Converts a natural-language complaint (English or Roman Urdu) into a structured suggestion: `{ title, category, priority, possibleCauses, initialChecks, recurringWarning, source }`. `source` is `"ai"` when the Anthropic API answered, or `"fallback"` when no API key is set / the API timed out, so the flow always keeps working. This is advisory only — the frontend must let the user review/edit before saving the issue (pass the reviewed fields back into `createIssue` / `reportPublicIssue`).

## Project Structure

```
MaintainIQ/
├── frontend/                 # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/       # UI components & layouts
│   │   ├── contexts/         # React contexts (Auth, Theme)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── styles/           # Global styles
│   │   ├── types/            # TypeScript types
│   │   ├── lib/              # Utility functions
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # Entry point
│   ├── public/               # Static assets
│   ├── docker/nginx/         # Nginx config
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/           # Database, env, logger, email
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── models/           # Data models
│   │   ├── repositories/     # Data access layer
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Helper functions
│   │   ├── validators/       # Input validators
│   │   └── server.ts         # Express server
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── migrations/       # Database migrations
│   │   └── seed/             # Seed data
│   ├── uploads/              # File uploads
│   ├── logs/                 # Application logs
│   ├── package.json
│   └── tsconfig.json
│
├── docker/                   # Docker configurations
│   └── nginx/
│       └── nginx.conf        # Nginx reverse proxy
│
├── docker-compose.yml        # Docker Compose setup
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI/CD
└── README.md
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/maintainiq?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# AI Issue Triage — server-side only, never sent to the frontend
ANTHROPIC_API_KEY="your-anthropic-api-key"
AI_MODEL="claude-haiku-4-5-20251001"
AI_TIMEOUT_MS=15000

# Base URL encoded into every asset's QR code, e.g. https://maintainiq.app
PUBLIC_APP_URL="http://localhost:5173"
```

## User Roles

1. **Super Admin** - Full system access
2. **Organization Admin** - Full organization access
3. **Maintenance Manager** - Manage work orders, assets, reports
4. **Technician** - View assigned work orders, update status
5. **Employee** - Report issues, view assets
6. **Viewer** - Read-only access

## License

MIT License - See LICENSE file for details.

## Support

For support, email support@maintainiq.com or open an issue on GitHub.

---

<p align="center">
  Built with by the MaintainIQ Team
</p>
