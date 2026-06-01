# Embroidery Company Management System

A full-stack management system for embroidery factories — tracking machines, labour, orders, inventory, and financials with automated monthly email reports.

## Tech Stack

**Backend:** FastAPI · PostgreSQL · SQLAlchemy (async) · Alembic · JWT · APScheduler · fastapi-mail  
**Frontend:** React 18 · TypeScript · Tailwind CSS · shadcn/ui · Recharts · React Query · Zustand  
**Infrastructure:** Docker Compose

---

## Quick Start

### 1. Clone & Configure

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials
```

### 2. Gmail App Password (SMTP Setup)

To enable automated monthly email reports:

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Navigate to **Security** → **2-Step Verification** (must be enabled)
3. At the bottom of the 2-Step Verification page, click **App passwords**
4. Select app: **Mail** | Select device: **Other (Custom name)** → type "Embroidery System"
5. Click **Generate** — copy the 16-character password
6. In `backend/.env`, set:
   ```
   MAIL_USERNAME=your.email@gmail.com
   MAIL_PASSWORD=xxxx xxxx xxxx xxxx   # 16-char app password (spaces OK)
   MAIL_FROM=your.email@gmail.com
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   ```

> **Note:** Never use your regular Gmail password. App passwords bypass 2FA and can be revoked independently.

### 3. Start Services

```bash
docker-compose up -d
```

Services:
| Service   | URL                         |
|-----------|-----------------------------|
| Frontend  | http://localhost:3000       |
| Backend   | http://localhost:8000       |
| API Docs  | http://localhost:8000/docs  |
| pgAdmin   | http://localhost:5050       |

### 4. Run Migrations

```bash
docker-compose exec backend alembic upgrade head
```

### 5. Create Admin User

```bash
docker-compose exec backend python -m app.scripts.create_admin
```

---

## Development (Without Docker)

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # configure .env
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Project Structure

```
factory-management/
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── config.py         # Settings
│   │   ├── database.py       # Async DB setup
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── repositories/     # Data access layer
│   │   ├── services/         # Business logic
│   │   ├── routers/          # API routes
│   │   ├── auth/             # JWT auth
│   │   ├── email/            # Email service + templates
│   │   └── scheduler/        # APScheduler
│   ├── alembic/              # DB migrations
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api/              # Axios + endpoints
        ├── store/            # Zustand stores
        ├── types/            # TypeScript types
        ├── components/       # Reusable UI
        └── pages/            # Route pages
```

---

## Default Credentials

| Role    | Email                 | Password   |
|---------|-----------------------|------------|
| Admin   | admin@embroidery.com  | Admin@123  |

---

## Features

- **Dashboard** — Live KPIs, machine performance charts, revenue vs expense trend
- **Machines** — CRUD, status tracking, stitch performance, maintenance logs
- **Labour** — Employee management, advance recording, salary summaries
- **Shifts** — Daily machine-wise shift assignment and stitch recording
- **Orders** — Full order lifecycle (estimated & fixed stitch types), client linking
- **Clients** — Client database with order history and total business value
- **Expenses** — Daily expenses by category + machine maintenance logs
- **Inventory** — Raw material stock with low-stock alerts and usage tracking
- **Reports** — Period-based analytics with CSV export
- **Automated Email Reports** — Monthly HTML reports with P&L, machine stats, labour summary, and low-stock alerts

---

## Environment Variables

See `backend/.env.example` for all configurable options.
