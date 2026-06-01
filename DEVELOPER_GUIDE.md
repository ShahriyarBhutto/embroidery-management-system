# Developer Guide — Embroidery Management System

> Written for someone who knows the basics of development but wants to fully understand how this project is built, why every piece exists, and how to modify or extend anything in it.

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [Tech Stack — What and Why](#2-tech-stack--what-and-why)
3. [Project Structure Explained](#3-project-structure-explained)
4. [Docker & Docker Compose](#4-docker--docker-compose)
5. [Backend Deep Dive (FastAPI)](#5-backend-deep-dive-fastapi)
   - [Entry Point — main.py](#51-entry-point--mainpy)
   - [Config & Environment Variables](#52-config--environment-variables)
   - [Database Setup (SQLAlchemy Async)](#53-database-setup-sqlalchemy-async)
   - [Models — Database Tables](#54-models--database-tables)
   - [Schemas — Request & Response Shapes](#55-schemas--request--response-shapes)
   - [Repositories — Database Queries](#56-repositories--database-queries)
   - [Routers — HTTP Endpoints](#57-routers--http-endpoints)
   - [Authentication — JWT Tokens](#58-authentication--jwt-tokens)
   - [Migrations — Alembic](#59-migrations--alembic)
   - [Scheduler — Email Reports](#510-scheduler--email-reports)
6. [Frontend Deep Dive (React + TypeScript)](#6-frontend-deep-dive-react--typescript)
   - [Entry Point & App Shell](#61-entry-point--app-shell)
   - [Routing & Auth Guards](#62-routing--auth-guards)
   - [State Management (Zustand)](#63-state-management-zustand)
   - [API Layer (Axios + React Query)](#64-api-layer-axios--react-query)
   - [UI Components](#65-ui-components)
   - [Pages](#66-pages)
7. [How Data Flows End-to-End](#7-how-data-flows-end-to-end)
8. [How to Add a New Feature](#8-how-to-add-a-new-feature)
9. [How to Modify Existing Features](#9-how-to-modify-existing-features)
10. [Common Patterns Cheat Sheet](#10-common-patterns-cheat-sheet)
11. [Building a Similar App from Scratch](#11-building-a-similar-app-from-scratch)

---

## 1. The Big Picture

This is a **full-stack web application**. That means it has three separate programs running together:

```
Browser (React) ──HTTP──▶ FastAPI Backend ──SQL──▶ PostgreSQL Database
```

- **React (Frontend):** What the user sees in the browser. It's all HTML/CSS/JavaScript. It talks to the backend by making HTTP requests.
- **FastAPI (Backend):** A Python web server. It receives HTTP requests, queries the database, and returns JSON data.
- **PostgreSQL (Database):** Where all the data lives permanently. The backend reads and writes to it.

All three run in **Docker containers** so they work the same on any machine.

---

## 2. Tech Stack — What and Why

### Backend

| Tool | What it is | Why we use it |
|------|-----------|---------------|
| **Python 3.11** | Programming language | Readable, huge ecosystem |
| **FastAPI** | Web framework | Fast, auto-generates API docs, modern |
| **SQLAlchemy 2.0** | Database ORM | Write Python instead of raw SQL |
| **asyncpg** | PostgreSQL driver | Async (handles many requests at once) |
| **Alembic** | Migration tool | Version-controls your database schema |
| **Pydantic v2** | Data validation | Validates and shapes request/response data |
| **python-jose** | JWT library | Creates and verifies login tokens |
| **bcrypt** | Password hashing | Stores passwords safely (never plain text) |
| **APScheduler** | Task scheduler | Runs the monthly email report automatically |
| **Docker** | Containerization | Same environment everywhere |

### Frontend

| Tool | What it is | Why we use it |
|------|-----------|---------------|
| **React 18** | UI framework | Component-based, reactive UI |
| **TypeScript** | Typed JavaScript | Catches mistakes before runtime |
| **Vite** | Build tool | Extremely fast dev server |
| **Tailwind CSS** | Utility CSS | Write styles inline, no separate CSS files |
| **shadcn/ui** | Component library | Pre-built accessible components |
| **React Router v6** | Client-side routing | Navigate between pages without reload |
| **TanStack React Query** | Server state | Caches API responses, handles loading/error |
| **Zustand** | Client state | Lightweight global state (auth, UI) |
| **Axios** | HTTP client | Makes API calls, handles JWT refresh |
| **Recharts** | Chart library | Bar, Line, Pie charts |

---

## 3. Project Structure Explained

```
Factory Management/
├── docker-compose.yml          ← Defines all 4 services (postgres, pgadmin, backend, frontend)
├── .env.example                ← Template for environment variables
├── .gitignore
├── README.md
├── GUIDE.md                    ← Operations guide (how to run)
├── DEVELOPER_GUIDE.md          ← This file
│
├── backend/
│   ├── Dockerfile              ← How to build the backend container
│   ├── requirements.txt        ← Python packages
│   ├── .env                    ← Your local secrets (NOT committed to git)
│   ├── alembic.ini             ← Alembic config
│   ├── alembic/
│   │   ├── env.py              ← Alembic async setup
│   │   └── versions/
│   │       └── 001_initial_migration.py  ← Creates all DB tables
│   └── app/
│       ├── main.py             ← FastAPI app entry point
│       ├── config.py           ← Reads .env into settings object
│       ├── database.py         ← DB engine + session + Base class
│       ├── models/             ← SQLAlchemy table definitions
│       ├── schemas/            ← Pydantic request/response shapes
│       ├── repositories/       ← All database queries
│       ├── routers/            ← HTTP route handlers
│       ├── auth/               ← JWT + password logic
│       ├── email/              ← Email service + HTML template
│       ├── scheduler/          ← APScheduler (automated reports)
│       ├── scripts/            ← One-off scripts (seed data, create admin)
│       └── utils/              ← Shared helpers (response formatter)
│
└── frontend/
    ├── Dockerfile              ← How to build the frontend container
    ├── package.json            ← Node packages
    ├── vite.config.ts          ← Vite + dev proxy config
    ├── tailwind.config.js      ← Tailwind theme
    ├── tsconfig.json           ← TypeScript config
    └── src/
        ├── main.tsx            ← React entry point
        ├── App.tsx             ← Routes + auth guards
        ├── index.css           ← Global styles + Tailwind directives
        ├── api/
        │   ├── axios.ts        ← Axios instance + JWT interceptor
        │   └── index.ts        ← All API functions
        ├── store/
        │   ├── authStore.ts    ← Zustand: token, user
        │   └── uiStore.ts      ← Zustand: dark mode, sidebar
        ├── types/
        │   └── index.ts        ← TypeScript type definitions
        ├── lib/
        │   └── utils.ts        ← formatCurrency, formatDate helpers
        ├── components/
        │   ├── Layout.tsx      ← Sidebar + top bar wrapper
        │   ├── Sidebar.tsx     ← Navigation sidebar
        │   ├── StatCard.tsx    ← KPI card component
        │   ├── LoadingSpinner.tsx
        │   └── ui/             ← shadcn/ui base components
        └── pages/              ← One file per page/route
```

---

## 4. Docker & Docker Compose

Docker lets you run applications in isolated **containers** — think of each container as a tiny Linux machine with exactly the right software installed.

**`docker-compose.yml`** defines all containers and how they connect:

```yaml
services:
  postgres:          # The database
    image: postgres:16
    environment:
      POSTGRES_USER: embroidery
      POSTGRES_PASSWORD: embroidery_pass
      POSTGRES_DB: embroidery_db
    ports:
      - "5433:5432"  # host:container (5433 because 5432 was taken on host)
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U embroidery"]

  backend:           # FastAPI Python server
    build: ./backend
    depends_on:
      postgres:
        condition: service_healthy   # Wait for DB before starting
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app   # Mount code for hot reload in dev

  frontend:          # React Vite dev server
    build: ./frontend
    ports:
      - "3000:3000"

  pgadmin:           # Database GUI (browser-based)
    image: dpage/pgadmin4
    ports:
      - "5050:80"
```

**Key concept:** Containers talk to each other using **service names as hostnames**. The backend connects to postgres using `postgres:5432` (the service name), not `localhost:5432`.

### Common Docker commands

```powershell
docker-compose up -d          # Start all containers in background
docker-compose down           # Stop all containers
docker-compose down -v        # Stop + delete database data
docker-compose logs -f backend  # Watch backend logs
docker-compose exec backend bash  # Open terminal inside backend container
docker-compose ps             # See status of all containers
```

---

## 5. Backend Deep Dive (FastAPI)

### 5.1 Entry Point — `main.py`

This is where the FastAPI application is created:

```python
# backend/app/main.py

app = FastAPI(title="Embroidery Management System")

# Allow the frontend (localhost:3000) to call the API
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"])

# Register all route groups
app.include_router(machines.router)
app.include_router(labour.router)
# ... etc
```

**What is CORS?** Browsers block requests from one origin (localhost:3000) to another (localhost:8000) by default. CORS middleware tells the browser "this is allowed".

**What are routers?** Instead of putting all 50+ routes in one file, we split them into logical groups (machines, labour, orders, etc.) using `APIRouter`. Then `main.py` includes them all.

**The `lifespan` function** runs code on startup/shutdown:
```python
@asynccontextmanager
async def lifespan(app):
    start_scheduler()   # Start the email scheduler on boot
    yield               # App runs here
    stop_scheduler()    # Clean shutdown
```

### 5.2 Config & Environment Variables

**`backend/app/config.py`** reads the `.env` file into a typed Python object:

```python
class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://..."
    SECRET_KEY: str = "change-this"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

settings = Settings()   # Read .env automatically
```

Anywhere in the code: `from app.config import settings` then use `settings.DATABASE_URL`.

**Why environment variables?** You never hard-code secrets (passwords, API keys) in source code. The `.env` file is in `.gitignore` — it never gets pushed to GitHub. The `.env.example` file shows what variables are needed without revealing the actual values.

### 5.3 Database Setup (SQLAlchemy Async)

**`backend/app/database.py`** sets up the database connection:

```python
# The engine is the connection pool to PostgreSQL
engine = create_async_engine(settings.DATABASE_URL, pool_size=10)

# Session factory — creates database sessions
async_session_maker = async_sessionmaker(engine, class_=AsyncSession)

# Dependency injected into every route that needs DB access
async def get_db():
    async with async_session_maker() as session:
        try:
            yield session        # Route uses the session here
            await session.commit()  # Auto-commit on success
        except:
            await session.rollback()  # Rollback on error
            raise
```

**What is async?** Normal Python code runs one thing at a time. `async` code can pause while waiting for the database and handle other requests meanwhile. This is why every function uses `async def` and every database call uses `await`.

**What is a session?** Think of it as a shopping cart. You can add multiple database operations to the session, then commit them all at once. If one fails, rollback cancels all of them.

### 5.4 Models — Database Tables

Each file in `backend/app/models/` maps to one database table.

```python
# backend/app/models/machine.py

class Machine(Base):
    __tablename__ = "machines"   # The actual table name in PostgreSQL

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    status = Column(String(20), default="active")   # active/idle/maintenance
    purchase_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships — tells SQLAlchemy how tables connect
    shifts = relationship("Shift", back_populates="machine")
    orders = relationship("Order", back_populates="machine")
```

**Column types:**
- `Integer` → a number (1, 2, 3...)
- `String(255)` → text up to 255 characters
- `Text` → long text (no limit)
- `Date` → just a date (2024-01-15)
- `DateTime` → date + time
- `Numeric` → exact decimal (use for money, not Float)
- `Boolean` → true/false

**`nullable=False`** means the field is required — PostgreSQL will reject a row without it.

**`server_default=func.now()`** means PostgreSQL automatically fills in the current time.

**Relationships** don't create extra columns — they let you do things like `machine.shifts` in Python to get all shifts for that machine.

#### All 12 models and what they store

| Model | Table | Key Fields |
|-------|-------|-----------|
| `User` | users | name, email, hashed_password, role (admin/manager/viewer) |
| `Machine` | machines | name, model_number, status, purchase_date |
| `Labour` | labour | name, phone, cnic, monthly_salary, joining_date, status |
| `Advance` | advances | labour_id, amount, date (salary advance payment) |
| `Shift` | shifts | machine_id, labour_id, date, shift_type, stitch_count |
| `Client` | clients | name, phone, company_name, address |
| `Order` | orders | client_id, machine_id, design_name, order_type, stitches, amount, status |
| `RawMaterial` | raw_materials | name, unit, current_stock, cost_per_unit, minimum_stock_alert |
| `MaterialUsage` | material_usages | order_id, material_id, quantity_used, date |
| `DailyExpense` | daily_expenses | category, amount, date, description |
| `MaintenanceLog` | maintenance_logs | machine_id, date, cost, description, type |
| `ReportConfig` | report_config | send_day, recipient_email, smtp settings |

### 5.5 Schemas — Request & Response Shapes

Every model has three Pydantic schemas in `backend/app/schemas/`:

```python
# backend/app/schemas/machine.py

# What the API accepts when CREATING a machine
class MachineCreate(BaseModel):
    name: str                     # Required
    model_number: Optional[str] = None   # Optional
    status: str = "active"        # Default value

# What the API accepts when UPDATING a machine (everything optional)
class MachineUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    # ...

# What the API returns (safe to expose)
class MachineOut(BaseModel):
    id: int
    name: str
    status: str
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}  # Read from SQLAlchemy object
```

**Why separate from models?** Models define the database structure. Schemas define what goes in/out of the API. You might store a `hashed_password` in the database but never want to return it from the API — schemas let you control this precisely.

**`model_config = {"from_attributes": True}`** tells Pydantic it can read from a SQLAlchemy object (which uses attributes), not just from a dictionary.

### 5.6 Repositories — Database Queries

The repository pattern separates database logic from HTTP logic.

**Base repository** (`backend/app/repositories/base.py`) provides generic CRUD that every entity inherits:

```python
class BaseRepository(Generic[ModelT]):
    def __init__(self, model, db: AsyncSession):
        self.model = model
        self.db = db

    async def get(self, id: int):
        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(self, skip=0, limit=200):
        result = await self.db.execute(select(self.model).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def create(self, data: dict):
        obj = self.model(**data)   # Create model instance from dict
        self.db.add(obj)
        await self.db.flush()      # Write to DB (but don't commit yet)
        await self.db.refresh(obj) # Get the auto-generated id back
        return obj

    async def update(self, id: int, data: dict):
        await self.db.execute(update(self.model).where(self.model.id == id).values(**data))
        return await self.get(id)

    async def delete(self, id: int):
        result = await self.db.execute(delete(self.model).where(self.model.id == id))
        return result.rowcount > 0
```

**Specific repositories** extend the base and add custom queries:

```python
# backend/app/repositories/machine.py
class MachineRepository(BaseRepository[Machine]):
    def __init__(self, db):
        super().__init__(Machine, db)   # Tell base which model to use

    # Custom query not in the base
    async def get_performance(self, machine_id: int, period: str):
        # Complex SQL query for stitch statistics
        result = await self.db.execute(
            select(func.sum(Shift.stitch_count))
            .where(Shift.machine_id == machine_id)
            # ... date filters based on period
        )
        return result.scalar()
```

**Why this pattern?** If you want to change how machines are fetched (add caching, change the query), you change it in one place — the repository — not scattered across 10 route files.

### 5.7 Routers — HTTP Endpoints

Routers handle HTTP requests and return responses:

```python
# backend/app/routers/machines.py

router = APIRouter(prefix="/machines", tags=["machines"])

# GET /machines — list all machines
@router.get("")
async def list_machines(
    db: AsyncSession = Depends(get_db),       # Inject DB session
    _=Depends(get_current_user),              # Require login
):
    repo = MachineRepository(db)
    machines = await repo.get_all()
    return ok([MachineOut.model_validate(m).model_dump() for m in machines])

# POST /machines — create a machine (manager only)
@router.post("")
async def create_machine(
    body: MachineCreate,                       # Auto-validates request body
    db: AsyncSession = Depends(get_db),
    _=Depends(require_manager),               # Require manager role
):
    repo = MachineRepository(db)
    machine = await repo.create(body.model_dump())
    return ok(MachineOut.model_validate(machine).model_dump(), "Machine created")

# GET /machines/{machine_id} — get one machine
@router.get("/{machine_id}")
async def get_machine(machine_id: int, db=Depends(get_db), _=Depends(get_current_user)):
    repo = MachineRepository(db)
    machine = await repo.get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return ok(MachineOut.model_validate(machine).model_dump())
```

**`Depends()`** is FastAPI's dependency injection. It runs the function and passes the result as a parameter. `Depends(get_db)` runs `get_db()` and gives you a database session. `Depends(get_current_user)` validates the JWT token and gives you the logged-in user.

**`ok()`** is our helper in `utils/response.py` that wraps every response in a consistent format:
```python
{"success": True, "data": ..., "message": ""}
```

**HTTP methods and what they mean:**
- `GET` — Read data, no side effects
- `POST` — Create new data
- `PUT` — Replace/update existing data (send all fields)
- `PATCH` — Partial update (send only changed fields)
- `DELETE` — Delete data

### 5.8 Authentication — JWT Tokens

**How login works:**

```
1. User sends email + password to POST /auth/login
2. Backend finds the user in DB, checks password with bcrypt
3. Backend creates two tokens:
   - Access token (expires in 30 min) — used for API calls
   - Refresh token (expires in 7 days) — used to get new access token
4. Both tokens returned to frontend, stored in localStorage
```

**JWT (JSON Web Token)** is a string with three parts separated by dots:
```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzgwMzEzODM4fQ.signature
     header                        payload                         signature
```

The payload contains: `{"sub": "2", "exp": 1780313838, "type": "access"}` — the user ID and expiry time. The signature ensures nobody tampered with it.

**`backend/app/auth/jwt.py`:**

```python
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(UTC) + timedelta(minutes=30)
    to_encode["type"] = "access"
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

def verify_token(token: str, token_type: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain, hashed) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())
```

**`backend/app/auth/dependencies.py`** — runs on every protected route:

```python
async def get_current_user(credentials=Depends(HTTPBearer()), db=Depends(get_db)):
    token = credentials.credentials   # Extract token from "Authorization: Bearer <token>"
    payload = verify_token(token, "access")
    if not payload:
        raise HTTPException(401, "Invalid or expired token")
    user = await db.execute(select(User).where(User.id == int(payload["sub"])))
    return user.scalar_one_or_none()

async def require_manager(user=Depends(get_current_user)):
    if user.role not in ("admin", "manager"):
        raise HTTPException(403, "Manager access required")
    return user
```

### 5.9 Migrations — Alembic

Alembic tracks changes to your database schema over time — like git, but for your database tables.

**How it works:**
- Each migration is a Python file in `alembic/versions/`
- Files have an `upgrade()` function (apply the change) and `downgrade()` (undo it)
- Alembic tracks which migrations have run in a `alembic_version` table

**Common commands:**
```powershell
# Apply all pending migrations
docker-compose exec backend alembic upgrade head

# See current migration version
docker-compose exec backend alembic current

# Create a new migration after changing a model
docker-compose exec backend alembic revision --autogenerate -m "add_phone_to_clients"

# Roll back one migration
docker-compose exec backend alembic downgrade -1
```

**When to create a migration:** Every time you add/remove/change a column in any model file, create a migration. Otherwise the code and database get out of sync and errors occur.

### 5.10 Scheduler — Email Reports

`backend/app/scheduler/scheduler.py` runs a job every hour that checks if today is the configured report day:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

async def send_monthly_report_job():
    async with async_session_maker() as db:
        config = await get_report_config(db)
        if not config or today.day != config.send_day:
            return   # Not the right day, skip
        # Gather all stats and send the email

def start_scheduler():
    scheduler.add_job(send_monthly_report_job, "interval", hours=1)
    scheduler.start()
```

The email is an HTML template (`backend/app/email/templates/monthly_report.html`) rendered with Jinja2 and sent via Gmail SMTP.

---

## 6. Frontend Deep Dive (React + TypeScript)

### 6.1 Entry Point & App Shell

**`frontend/src/main.tsx`** — renders the root React component into the HTML:

```tsx
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**`frontend/index.html`** has `<div id="root"></div>` where React mounts.

### 6.2 Routing & Auth Guards

**`frontend/src/App.tsx`** defines all routes and wraps them with auth checks:

```tsx
// If user has no token → redirect to /login
function RequireAuth({ children }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

// Settings page only for admin role
function RequireAdmin({ children }) {
  const { user } = useAuthStore();
  return user?.role === "admin" ? <>{children}</> : <Navigate to="/" />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>   {/* React Query context */}
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Dashboard />} />  {/* "/" */}
            <Route path="machines" element={<Machines />} />
            <Route path="machines/:id" element={<MachineDetail />} />
            {/* ...more routes */}
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

**Nested routes:** The parent route (`/`) renders `<Layout>` which has the sidebar. Child routes render inside the sidebar via `<Outlet />` in Layout.tsx. This is why you see the sidebar on all pages except login.

### 6.3 State Management (Zustand)

There are two global stores:

**`authStore.ts`** — holds login state:
```tsx
export const useAuthStore = create(persist(
  (set) => ({
    token: null,
    refreshToken: null,
    user: null,
    setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
    clearAuth: () => set({ token: null, refreshToken: null, user: null }),
  }),
  { name: "auth-storage" }   // Saves to localStorage automatically
));

// Usage in any component:
const { token, user, setAuth, clearAuth } = useAuthStore();
```

**`uiStore.ts`** — holds dark mode and sidebar state:
```tsx
export const useUiStore = create(persist(
  (set, get) => ({
    isDarkMode: false,
    isSidebarOpen: true,
    toggleDarkMode: () => {
      const next = !get().isDarkMode;
      document.documentElement.classList.toggle("dark", next);  // Add/remove "dark" class
      set({ isDarkMode: next });
    },
  }),
  { name: "ui-storage" }
));
```

**Why Zustand over React Context?** Simpler API, better performance (only re-renders components that use changed state), built-in localStorage persistence.

### 6.4 API Layer (Axios + React Query)

**`frontend/src/api/axios.ts`** — configures Axios with automatic JWT handling:

```tsx
const api = axios.create({ baseURL: "http://localhost:8000" });

// Before every request: attach the JWT token
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("auth-storage");
  const { state } = JSON.parse(raw);
  if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
  return config;
});

// After every response: if 401, try to refresh the token silently
api.interceptors.response.use(
  (res) => res,          // Success: pass through
  async (error) => {
    if (error.response?.status !== 401) return Promise.reject(error);
    // Call /auth/refresh with the refresh token
    // If it works: update localStorage and retry the original request
    // If it fails: clear auth and redirect to /login
  }
);
```

**`frontend/src/api/index.ts`** — all API functions:

```tsx
export const machinesApi = {
  list: () => api.get("/machines").then(res => res.data.data),
  create: (data) => api.post("/machines", data).then(res => res.data.data),
  update: (id, data) => api.put(`/machines/${id}`, data),
  delete: (id) => api.delete(`/machines/${id}`),
};
```

**React Query** wraps API calls with caching, loading states, and automatic refetching:

```tsx
// In a component:
const { data: machines, isLoading, error } = useQuery({
  queryKey: ["machines"],     // Cache key — unique identifier for this data
  queryFn: machinesApi.list,  // Function that fetches the data
  staleTime: 30_000,          // Consider cached data fresh for 30 seconds
});

if (isLoading) return <LoadingSpinner />;
if (error) return <div>Error loading machines</div>;
// data is available here
```

**Mutations** (create/update/delete):
```tsx
const createMachine = useMutation({
  mutationFn: machinesApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["machines"] }); // Refresh the list
    setOpen(false);  // Close dialog
  },
});

// Call it:
createMachine.mutate({ name: "New Machine", status: "active" });
```

### 6.5 UI Components

**Tailwind CSS** — write styles as class names:
```tsx
<div className="flex items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
  <span className="text-2xl font-bold text-blue-600">Hello</span>
</div>
```

Common Tailwind patterns used in this project:
- `flex` / `grid` — layout
- `gap-4` — spacing between flex/grid items (4 = 1rem = 16px)
- `p-6` — padding all sides (6 = 1.5rem = 24px)
- `text-sm` / `text-base` / `text-2xl` — font sizes
- `font-bold` / `font-medium` — font weight
- `rounded-lg` — border radius
- `dark:bg-gray-900` — dark mode variant (applies when `dark` class is on `<html>`)

**shadcn/ui components** (`frontend/src/components/ui/`) are copy-pasted into the project (not an npm package). You can freely edit them. Key ones:
- `Button` — with variants (default, outline, destructive, ghost)
- `Card` / `CardHeader` / `CardContent` — content containers
- `Dialog` — modal popups for create/edit forms
- `Input` / `Label` / `Textarea` — form fields
- `Badge` — status chips
- `Table` — data tables
- `Select` — dropdowns
- `Tabs` — tabbed interfaces

### 6.6 Pages

Each page follows the same pattern:

```tsx
export default function Machines() {
  // 1. State for dialog open/close
  const [open, setOpen] = useState(false);

  // 2. Fetch data
  const { data: machines, isLoading } = useQuery({
    queryKey: ["machines"],
    queryFn: machinesApi.list,
  });

  // 3. Mutation for create/update/delete
  const createMachine = useMutation({
    mutationFn: machinesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["machines"] }),
  });

  // 4. Handle loading/error
  if (isLoading) return <LoadingSpinner />;

  // 5. Render
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Add Machine</Button>
      <Table>...</Table>
      <Dialog open={open} onOpenChange={setOpen}>
        <form onSubmit={...}>...</form>
      </Dialog>
    </div>
  );
}
```

---

## 7. How Data Flows End-to-End

**Example: User adds a new machine**

```
1. User fills form → clicks "Save"
   Frontend: createMachine.mutate({ name: "Tajima M-3", status: "active" })

2. Axios sends:
   POST http://localhost:8000/machines
   Authorization: Bearer eyJhbGc...
   Body: { "name": "Tajima M-3", "status": "active" }

3. FastAPI receives the request:
   - HTTPBearer extracts the token from the Authorization header
   - get_current_user() verifies the JWT, loads the user from DB
   - require_manager() checks user.role is "manager" or "admin"
   - MachineCreate schema validates the request body

4. Router calls the repository:
   repo = MachineRepository(db)
   machine = await repo.create({ "name": "Tajima M-3", "status": "active" })

5. Repository inserts into PostgreSQL:
   INSERT INTO machines (name, status) VALUES ('Tajima M-3', 'active') RETURNING *

6. Response goes back:
   { "success": true, "data": { "id": 6, "name": "Tajima M-3", ... }, "message": "Machine created" }

7. React Query invalidates the machines cache:
   queryClient.invalidateQueries({ queryKey: ["machines"] })

8. The list refetches automatically and shows the new machine
```

---

## 8. How to Add a New Feature

**Example: Adding a "Supplier" entity**

### Step 1: Create the Model

```python
# backend/app/models/supplier.py
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50))
    email = Column(String(255))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### Step 2: Import the model in `models/__init__.py`

```python
from app.models.supplier import Supplier
```

### Step 3: Create the Schemas

```python
# backend/app/schemas/supplier.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SupplierCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None

class SupplierOut(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    notes: Optional[str]
    created_at: Optional[datetime]
    model_config = {"from_attributes": True}
```

### Step 4: Create the Repository

```python
# backend/app/repositories/supplier.py
from app.repositories.base import BaseRepository
from app.models.supplier import Supplier

class SupplierRepository(BaseRepository[Supplier]):
    def __init__(self, db):
        super().__init__(Supplier, db)
    # Add custom queries here if needed
```

### Step 5: Create the Router

```python
# backend/app/routers/suppliers.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierOut
from app.repositories.supplier import SupplierRepository
from app.auth.dependencies import get_current_user, require_manager
from app.utils.response import ok

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

@router.get("")
async def list_suppliers(db=Depends(get_db), _=Depends(get_current_user)):
    repo = SupplierRepository(db)
    suppliers = await repo.get_all()
    return ok([SupplierOut.model_validate(s).model_dump() for s in suppliers])

@router.post("")
async def create_supplier(body: SupplierCreate, db=Depends(get_db), _=Depends(require_manager)):
    repo = SupplierRepository(db)
    supplier = await repo.create(body.model_dump())
    return ok(SupplierOut.model_validate(supplier).model_dump(), "Supplier created")

@router.put("/{supplier_id}")
async def update_supplier(supplier_id: int, body: SupplierUpdate, db=Depends(get_db), _=Depends(require_manager)):
    repo = SupplierRepository(db)
    supplier = await repo.update(supplier_id, body.model_dump(exclude_none=True))
    if not supplier:
        raise HTTPException(404, "Supplier not found")
    return ok(SupplierOut.model_validate(supplier).model_dump(), "Supplier updated")

@router.delete("/{supplier_id}")
async def delete_supplier(supplier_id: int, db=Depends(get_db), _=Depends(require_manager)):
    repo = SupplierRepository(db)
    deleted = await repo.delete(supplier_id)
    if not deleted:
        raise HTTPException(404, "Supplier not found")
    return ok(message="Supplier deleted")
```

### Step 6: Register the Router in `main.py`

```python
from app.routers import suppliers  # add this import

app.include_router(suppliers.router)  # add this line
```

### Step 7: Create a Migration

```powershell
docker-compose exec backend alembic revision --autogenerate -m "add_suppliers_table"
docker-compose exec backend alembic upgrade head
```

### Step 8: Add the TypeScript Type

```typescript
// frontend/src/types/index.ts
export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
}
```

### Step 9: Add API Functions

```typescript
// frontend/src/api/index.ts
export const suppliersApi = {
  list: () => api.get("/suppliers").then(unwrap<Supplier[]>),
  create: (data: Partial<Supplier>) => api.post("/suppliers", data).then(unwrap<Supplier>),
  update: (id: number, data: Partial<Supplier>) => api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
};
```

### Step 10: Create the Page

Copy any existing page (e.g., `Clients.tsx`) and adapt it for suppliers. Then add the route in `App.tsx` and the sidebar link in `Sidebar.tsx`.

---

## 9. How to Modify Existing Features

### Change a field on a model

1. Edit the model file (e.g., add `contact_person` to `Client`)
2. Run `alembic revision --autogenerate -m "add_contact_person_to_clients"`
3. Run `alembic upgrade head`
4. Update the schema to include/expose the new field
5. Update the TypeScript type in `frontend/src/types/index.ts`
6. Update the form and table in the relevant page

### Change the dashboard stats

The dashboard data comes from `backend/app/repositories/report.py`. Find the specific query and modify the SQL. The frontend just displays whatever the API returns.

### Change which roles can access an endpoint

Change `Depends(require_manager)` to `Depends(get_current_user)` (any logged-in user) or `Depends(require_admin)` (admin only).

### Change token expiry

In `backend/.env`:
```
ACCESS_TOKEN_EXPIRE_MINUTES=60    # Change from 30 to 60 minutes
REFRESH_TOKEN_EXPIRE_DAYS=30     # Change from 7 to 30 days
```

### Add a new order status

1. In `backend/app/models/order.py`, the `status` field is a plain string — just use the new value.
2. In the frontend `Orders.tsx`, add the new status to the color/badge mapping.
3. No migration needed (it's a string column, not an enum).

### Change the email report layout

Edit `backend/app/email/templates/monthly_report.html`. It's a Jinja2 template. Variables available: `{{ revenue }}`, `{{ expenses }}`, `{{ machines }}`, etc. Use `docker-compose exec backend python -m app.scripts.seed` to trigger a test email from the Settings page.

---

## 10. Common Patterns Cheat Sheet

### Backend

```python
# Standard route pattern
@router.get("/{id}")
async def get_item(id: int, db=Depends(get_db), _=Depends(get_current_user)):
    repo = ItemRepository(db)
    item = await repo.get(id)
    if not item:
        raise HTTPException(404, "Not found")
    return ok(ItemOut.model_validate(item).model_dump())

# Filter query in repository
async def get_by_status(self, status: str):
    result = await self.db.execute(
        select(self.model).where(self.model.status == status)
    )
    return list(result.scalars().all())

# Date range filter
from datetime import date
async def get_by_date_range(self, date_from: date, date_to: date):
    result = await self.db.execute(
        select(self.model)
        .where(self.model.date >= date_from)
        .where(self.model.date <= date_to)
        .order_by(self.model.date.desc())
    )
    return list(result.scalars().all())

# Aggregate query (sum, count, avg)
from sqlalchemy import func
async def get_total_stitches(self, machine_id: int):
    result = await self.db.execute(
        select(func.sum(Shift.stitch_count))
        .where(Shift.machine_id == machine_id)
    )
    return result.scalar() or 0
```

### Frontend

```tsx
// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ["items"],
  queryFn: itemsApi.list,
});

// Create
const create = useMutation({
  mutationFn: itemsApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
    toast.success("Created!");
  },
});

// Delete with confirm
const del = useMutation({ mutationFn: itemsApi.delete });
const handleDelete = (id: number) => {
  if (confirm("Delete?")) del.mutate(id);
};

// Form submit
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target as HTMLFormElement));
  create.mutate(data);
};

// Conditional render
if (isLoading) return <LoadingSpinner />;
if (error) return <p className="text-destructive">Failed to load.</p>;
if (!data?.length) return <p>No items yet.</p>;
```

---

## 11. Building a Similar App from Scratch

Here is the exact sequence to build a project like this from zero:

### Phase 1: Backend Setup (Day 1)

```bash
# 1. Create project structure
mkdir my-app && cd my-app
mkdir backend frontend

# 2. Set up Python environment
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install fastapi uvicorn sqlalchemy asyncpg alembic pydantic-settings python-jose bcrypt

# 3. Create requirements.txt
pip freeze > requirements.txt

# 4. Create these files in order:
#    app/config.py       (Settings class)
#    app/database.py     (engine, session, Base)
#    app/models/*.py     (one per table)
#    app/schemas/*.py    (one per model, three classes each)
#    app/repositories/*  (base.py first, then specific ones)
#    app/routers/*.py    (one per feature)
#    app/main.py         (wire everything together)

# 5. Set up Alembic
alembic init alembic
# Edit alembic/env.py to use async engine
# Create first migration
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

### Phase 2: Docker (Day 1-2)

```yaml
# docker-compose.yml — start with just postgres + backend
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: myapp
      POSTGRES_PASSWORD: mypass
      POSTGRES_DB: myapp_db
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
```

### Phase 3: Authentication (Day 2)

Create in this order:
1. `User` model + migration
2. `auth/jwt.py` — token creation + verification
3. `auth/dependencies.py` — `get_current_user`, `require_manager`
4. `routers/auth.py` — `/auth/login`, `/auth/refresh`, `/auth/me`

Test with: `curl -X POST http://localhost:8000/auth/login -d '{"email":"...","password":"..."}'`

### Phase 4: Business Logic (Day 3-5)

Add models, schemas, repositories, and routers for each entity. Work feature by feature, testing each with the Swagger UI at `http://localhost:8000/docs`.

### Phase 5: Frontend Setup (Day 5-6)

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install axios @tanstack/react-query zustand react-router-dom recharts lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Create in this order:
# src/types/index.ts         (TypeScript interfaces)
# src/api/axios.ts           (Axios + JWT interceptor)
# src/api/index.ts           (API functions)
# src/store/authStore.ts     (Zustand auth store)
# src/App.tsx                (Routes)
# src/pages/Login.tsx        (Login form)
# src/components/Layout.tsx  (Sidebar wrapper)
# src/pages/*.tsx            (One per feature)
```

### Phase 6: Polish (Day 7+)

- Add loading states to all pages
- Add error boundaries
- Add form validation
- Add dark mode
- Add CSV export to reports
- Write seed data script for testing

### Key principles to follow

1. **Never put business logic in routes.** Routes call repositories. Repositories call the database. Keep it layered.
2. **Never hard-code secrets.** Everything configurable goes in `.env`.
3. **Always validate at the boundary.** Pydantic schemas validate incoming requests. Trust nothing from the outside.
4. **One migration per schema change.** Don't modify existing migrations once they're committed.
5. **Keep TypeScript types in sync with backend schemas.** When you add a field to a Pydantic schema, add it to the TypeScript interface.
6. **Invalidate React Query cache after mutations.** After create/update/delete, call `queryClient.invalidateQueries()` so the UI reflects the change.
7. **Test with Swagger first.** `http://localhost:8000/docs` lets you test every endpoint before touching the frontend.
