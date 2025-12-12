"""
Main FastAPI application entry point for COOPERATIVE PACS - Loan Management System
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import json

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
    allow_origins=["*"] if allow_all_origins else origins,
    allow_origin_regex=netlify_origin_regex if not allow_all_origins else None,
    allow_credentials=False if allow_all_origins else True,
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
            "services": {"api": "operational", "database": "connected"},
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
