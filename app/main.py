"""
Main FastAPI application entry point for COOPERATIVE PACS - Loan Management System
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import json
from sqlalchemy import text
from sqlalchemy.engine.url import make_url

from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import engine
from app.db.base import Base

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Loan Management System for COOPERATIVE PACS Banks",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

# CORS Configuration
try:
    origins = json.loads(settings.BACKEND_CORS_ORIGINS)
except Exception:
    origins = []

if not isinstance(origins, list):
    origins = []

if "https://cooperative-pacs-loan-management.netlify.app" not in origins:
    origins.append("https://cooperative-pacs-loan-management.netlify.app")

allow_all_origins = len(origins) == 0

netlify_origin_regex = r"https://.*\.netlify\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=None,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    # Create tables if not exist (for development)
    # In production, use Alembic migrations
    # Disabled temporarily - tables already exist in database
    # if settings.ENVIRONMENT == "development":
    #     async with engine.begin() as conn:
    #         await conn.run_sync(Base.metadata.create_all)

    print(f"🚀 {settings.APP_NAME} started successfully!")
    print(f"📝 Environment: {settings.ENVIRONMENT}")
    try:
        db_url = make_url(settings.DATABASE_URL)
        db_host = db_url.host or ""
        db_port = db_url.port or ""
        db_name = (db_url.database or "")
        print(f"🗄️  Database: host={db_host} port={db_port} db={db_name}")
    except Exception:
        print("🗄️  Database: unable to parse DATABASE_URL")

    print(f"📚 API Docs: http://localhost:8000/docs")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 Shutting down gracefully...")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to COOPERATIVE PACS Loan Management System",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring and load balancers"""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "timestamp": datetime.utcnow().isoformat(),
            "app": settings.APP_NAME,
            "services": {"api": "operational", "database": "unknown"},
        },
    )


@app.get("/health/db", tags=["Health"])
async def health_db_check():
    """Database connectivity health check."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return JSONResponse(
            status_code=200,
            content={
                "status": "healthy",
                "database": "connected",
                "timestamp": datetime.utcnow().isoformat(),
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "unreachable",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            },
        )


@app.get("/health/env", tags=["Health"])
async def health_env_check():
    """Environment diagnostics (sanitized)."""
    db_host = ""
    db_port = ""
    db_name = ""
    try:
        db_url = make_url(settings.DATABASE_URL)
        db_host = db_url.host or ""
        db_port = str(db_url.port or "")
        db_name = db_url.database or ""
    except Exception:
        pass

    return JSONResponse(
        status_code=200,
        content={
            "environment": settings.ENVIRONMENT,
            "db_ssl_insecure": settings.DB_SSL_INSECURE,
            "db": {"host": db_host, "port": db_port, "name": db_name},
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
    )
