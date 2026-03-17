# Payout MVP

Full-stack payout management system with role-based access control.

## Stack
- **Backend**: Node.js, Express, Sequelize, PostgreSQL
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS

## Prerequisites
- Node.js 18+
- PostgreSQL running locally

## Setup

### 1. Database
Create a PostgreSQL database:
```sql
CREATE DATABASE payout_mvp;
```

### 2. Backend
```bash
cd backend
npm install
# Edit .env if your DB credentials differ from defaults (postgres/postgres)
npm run seed     # creates tables + seeds users & vendors
npm run dev      # starts on http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install      # already done by scaffold
npm run dev      # starts on http://localhost:3000
```

## Seeded Users
| Email | Password | Role |
|---|---|---|
| ops@demo.com | ops123 | OPS |
| finance@demo.com | fin123 | FINANCE |

## API Endpoints
| Method | Path | Role |
|---|---|---|
| POST | /auth/login | Public |
| GET | /vendors | Any |
| POST | /vendors | Any |
| GET | /payouts | Any |
| POST | /payouts | OPS |
| GET | /payouts/:id | Any |
| POST | /payouts/:id/submit | OPS |
| POST | /payouts/:id/approve | FINANCE |
| POST | /payouts/:id/reject | FINANCE |

## Role Rules
- **OPS**: Create payouts (Draft), submit (Draft → Submitted), view all
- **FINANCE**: Approve (Submitted → Approved), reject with reason (Submitted → Rejected), view all
- Status transitions are strictly enforced server-side
