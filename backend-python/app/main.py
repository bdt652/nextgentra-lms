"""FastAPI main application module."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth
from app.core.database import connect_db, disconnect_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Manage database connection lifecycle."""
    # Startup: connect to database
    await connect_db()
    yield
    # Shutdown: disconnect
    await disconnect_db()


app = FastAPI(
    title="NextGenTra LMS API",
    description="Learning Management System Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "NextGenTra LMS API", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "lms-backend"}
