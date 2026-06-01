from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, machines, labour, shifts, orders, clients, expenses, raw_materials, reports, settings as settings_router
from app.scheduler.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(machines.router)
app.include_router(labour.router)
app.include_router(shifts.router)
app.include_router(orders.router)
app.include_router(clients.router)
app.include_router(expenses.router)
app.include_router(raw_materials.router)
app.include_router(reports.router)
app.include_router(settings_router.router)


@app.get("/")
async def root():
    return {"success": True, "message": f"{settings.APP_NAME} API is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}
