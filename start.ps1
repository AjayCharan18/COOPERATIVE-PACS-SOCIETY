# Production deployment script for DCCB Loan Management System (Windows)

Write-Host "🚀 Starting DCCB Loan Management System deployment..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure it." -ForegroundColor Yellow
    exit 1
}

# Load environment variables from .env
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Check required environment variables
$required_vars = @("DATABASE_URL", "SECRET_KEY", "ENVIRONMENT")
foreach ($var in $required_vars) {
    if (-not [Environment]::GetEnvironmentVariable($var, "Process")) {
        Write-Host "❌ Error: $var is not set in .env" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Environment variables validated" -ForegroundColor Green

# Activate virtual environment if it exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "📦 Activating virtual environment..." -ForegroundColor Cyan
    & "venv\Scripts\Activate.ps1"
}

# Install Python dependencies
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

# Run database migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
alembic upgrade head

# Seed initial data (if needed)
$seedData = [Environment]::GetEnvironmentVariable("SEED_DATA", "Process")
if ($seedData -eq "true") {
    Write-Host "🌱 Seeding initial data..." -ForegroundColor Cyan
    python scripts/seed_data.py
}

# Create necessary directories
Write-Host "📁 Creating directories..." -ForegroundColor Cyan
@("logs", "uploads", "temp") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ | Out-Null
    }
}

# Start application
$environment = [Environment]::GetEnvironmentVariable("ENVIRONMENT", "Process")
Write-Host "🚀 Starting application..." -ForegroundColor Green

if ($environment -eq "production") {
    Write-Host "Starting in production mode with 4 workers..." -ForegroundColor Yellow
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
} else {
    Write-Host "Starting in development mode..." -ForegroundColor Yellow
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}
