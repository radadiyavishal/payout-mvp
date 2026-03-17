# Payout MVP

Full-stack payout management system with role-based access control.

## Stack
- **Backend**: Node.js, Express, Sequelize, PostgreSQL (port 4000)
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS (port 3000)

---

## ⚡ Run in 5 Minutes

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (default: `localhost:5432`)

---

### Step 1 — Create the database

```sql
CREATE DATABASE payout_mvp;
```

---

### Step 2 — Configure environment

Create `backend/.env` (or edit the existing one):

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=payout_mvp
DB_USER=postgres
DB_PASS=your_postgres_password
JWT_SECRET=any_random_secret_string
```

---

### Step 3 — Backend

```bash
cd backend
npm install
npm run seed   # creates tables + seeds users & vendors
npm run dev    # starts on http://localhost:4000
```

---

### Step 4 — Frontend

```bash
cd frontend
npm install
npm run dev    # starts on http://localhost:3000
```

Open **http://localhost:3000** — done.

---

## Seed Data

`npm run seed` creates:

**Users**
| Email | Password | Role |
|---|---|---|
| ops@demo.com | ops123 | OPS |
| finance@demo.com | fin123 | FINANCE |

**Vendors** — 2 sample vendors pre-loaded.

> On the login page, click **OPS** or **FINANCE** to auto-fill credentials.

---

## Role Rules
- **OPS** — Create payouts (Draft), submit for review (Draft → Submitted)
- **FINANCE** — Approve (Submitted → Approved) or reject with reason (Submitted → Rejected)
- Status transitions are strictly enforced server-side

## API Endpoints
| Method | Path | Auth |
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
