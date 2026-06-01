# Embroidery Management System — Operations Guide

## Quick Reference

| Service    | URL                        | Purpose              |
|------------|----------------------------|----------------------|
| App        | http://localhost:3000      | Main frontend        |
| API Docs   | http://localhost:8000/docs | Swagger UI           |
| pgAdmin    | http://localhost:5050      | Database GUI         |

### Login Credentials

| Role    | Email                      | Password     |
|---------|----------------------------|--------------|
| Manager | manager@embroidery.com     | Manager@123  |
| Viewer  | viewer@embroidery.com      | Viewer@123   |
| pgAdmin | admin@embroidery.com       | admin123     |

---

## 1. Starting the App

> **Requirement:** Docker Desktop must be running before these commands.

```powershell
# Navigate to project folder
cd "C:\Users\PMLS\Desktop\Projects\Factory Management"

# Start all services in the background
docker-compose up -d
```

Wait ~15 seconds for PostgreSQL to become healthy, then open http://localhost:3000.

### Check all containers are healthy

```powershell
docker-compose ps
```

All four containers should show `running` / `healthy`:
- `embroidery_postgres`
- `embroidery_pgadmin`
- `embroidery_backend`
- `embroidery_frontend`

---

## 2. Stopping the App

```powershell
# Stop all services (keeps data)
docker-compose down

# Stop AND wipe the database (fresh start)
docker-compose down -v
```

---

## 3. Database Migrations

Run migrations after pulling new code or after a fresh `down -v`:

```powershell
docker-compose exec backend alembic upgrade head
```

Check current migration state:

```powershell
docker-compose exec backend alembic current
```

---

## 4. Seeding Dummy Data

> Only run once on a fresh database — it will error if data already exists (duplicate emails/CNICs).

```powershell
docker-compose exec backend python -m app.scripts.seed
```

This creates:
- 2 users (manager + viewer)
- 5 machines, 6 labour, 6 clients
- 10 orders across all statuses
- 190 shifts over the last 45 days
- 8 raw materials (3 are low-stock for testing alerts)
- 42 daily expenses, 7 maintenance logs

---

## 5. Viewing Logs

```powershell
# All services
docker-compose logs -f

# Single service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

---

## 6. Fresh Start (Reset Everything)

```powershell
# 1. Stop and delete volumes
docker-compose down -v

# 2. Start fresh
docker-compose up -d

# 3. Wait ~15 seconds, then run migrations
docker-compose exec backend alembic upgrade head

# 4. Seed dummy data
docker-compose exec backend python -m app.scripts.seed
```

---

## 7. App Pages Overview

| Page       | URL                  | What it does                                      |
|------------|----------------------|---------------------------------------------------|
| Dashboard  | /                    | KPIs, machine performance charts, recent orders   |
| Machines   | /machines            | Add/edit machines, view stitch stats, maintenance |
| Labour     | /labour              | Worker list, salary, advance payments             |
| Shifts     | /shifts              | Daily shift log per machine/worker                |
| Orders     | /orders              | Client orders, status tracking, amounts           |
| Clients    | /clients             | Client directory, order history                   |
| Expenses   | /expenses            | Daily expenses + machine maintenance logs         |
| Inventory  | /inventory           | Raw materials stock, low-stock alerts             |
| Reports    | /reports             | P&L, revenue, labour summary, CSV export          |
| Settings   | /settings            | Email report config (manager only)                |

---

## 8. Email Reports (Optional Setup)

To enable monthly email reports, go to **Settings** and configure:

1. Use a Gmail account
2. Generate an **App Password** at: `myaccount.google.com → Security → 2-Step Verification → App Passwords`
3. Enter the app password (16 chars, no spaces) in the Settings page
4. Set the day of month to send (e.g., 1 = first of every month)
5. Click **Send Test** to verify

---

## 9. pgAdmin (Database GUI)

1. Open http://localhost:5050
2. Login: `admin@embroidery.com` / `admin123`
3. Add server:
   - Host: `postgres`
   - Port: `5432`
   - Database: `embroidery_db`
   - Username: `embroidery`
   - Password: `embroidery_pass`

---

## 10. Connecting to DB from Host Machine (e.g., DBeaver)

The PostgreSQL port is remapped to **5433** on the host (5432 was already in use):

| Field    | Value          |
|----------|----------------|
| Host     | localhost      |
| Port     | **5433**       |
| Database | embroidery_db  |
| Username | embroidery     |
| Password | embroidery_pass|

---

## 11. Common Troubleshooting

### Docker Desktop not running
```powershell
# Start Docker Desktop and wait for it to initialize
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
# Wait ~30 seconds, then retry docker-compose up -d
```

### Port already in use
```powershell
# Find what's using a port (e.g., 3000)
netstat -ano | findstr :3000
# Kill the process by PID
taskkill /PID <PID> /F
```

### Backend not starting (check logs)
```powershell
docker-compose logs backend
```

### Database connection refused
- Ensure the `postgres` container is healthy before the backend starts
- Run `docker-compose ps` to check status
- If postgres shows unhealthy, restart: `docker-compose restart postgres`

### Re-seed after accidental data deletion
```powershell
# Full reset
docker-compose down -v
docker-compose up -d
# Wait 15 seconds
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.scripts.seed
```
