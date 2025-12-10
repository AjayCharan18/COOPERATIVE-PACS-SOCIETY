#!/bin/bash
# Production deployment script for DCCB Loan Management System

set -e

echo "🚀 Starting DCCB Loan Management System deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Source environment variables
source .env

# Check required environment variables
required_vars=("DATABASE_URL" "SECRET_KEY" "ENVIRONMENT")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set in .env"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "🗄️  Running database migrations..."
alembic upgrade head

# Seed initial data (if needed)
if [ "$SEED_DATA" = "true" ]; then
    echo "🌱 Seeding initial data..."
    python scripts/seed_data.py
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs uploads temp

# Start application
echo "🚀 Starting application..."
if [ "$ENVIRONMENT" = "production" ]; then
    echo "Starting in production mode with 4 workers..."
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --log-config logging.conf
else
    echo "Starting in development mode..."
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
fi
