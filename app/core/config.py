"""
Application configuration settings
"""

from typing import List
import os
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = Field(
        default="COOPERATIVE PACS Loan Automation AI System", env="APP_NAME"
    )
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:12367@localhost:5433/DCCBLOANMANAGEMENT",
        env="DATABASE_URL",
    )
    DB_SSL_INSECURE: bool = Field(default=False, env="DB_SSL_INSECURE")
    DB_SSL_CA_CERT_PEM: str = Field(default="", env="DB_SSL_CA_CERT_PEM")

    # Security
    SECRET_KEY: str = Field(
        default="GKAUQiSuMPq-Bh8zmNYVtOD9JYcAbvd6x8-KvXMGVMg", env="SECRET_KEY"
    )
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=0, env="ACCESS_TOKEN_EXPIRE_MINUTES"
    )  # 0 means non-expiring

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")

    # AI/Gemini
    GEMINI_API_KEY: str = Field(
        default="AIzaSyDYv5Wrh4Fd2nBHbriJIaw7ftgPmyY5jKo", env="GEMINI_API_KEY"
    )

    # OCR
    TESSERACT_PATH: str = Field(
        default="C:\\Program Files\\Tesseract-OCR\\tesseract.exe", env="TESSERACT_PATH"
    )

    # CORS
    BACKEND_CORS_ORIGINS: str = Field(
        default='["http://localhost:3000","http://localhost:5173","http://localhost:5174","https://cooperative-pacs-loan-management.netlify.app"]',
        env="BACKEND_CORS_ORIGINS",
    )

    # Twilio/SMS
    TWILIO_ACCOUNT_SID: str = Field(default="", env="TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: str = Field(default="", env="TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER: str = Field(default="", env="TWILIO_PHONE_NUMBER")

    # WhatsApp
    WHATSAPP_API_KEY: str = Field(default="", env="WHATSAPP_API_KEY")
    WHATSAPP_API_URL: str = Field(
        default="https://graph.facebook.com/v18.0", env="WHATSAPP_API_URL"
    )

    # Payment Gateway
    RAZORPAY_KEY_ID: str = Field(default="", env="RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET: str = Field(default="", env="RAZORPAY_KEY_SECRET")

    # Email/SMTP
    SMTP_HOST: str = Field(default="smtp.gmail.com", env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USER: str = Field(default="", env="SMTP_USER")
    SMTP_PASSWORD: str = Field(default="", env="SMTP_PASSWORD")
    EMAIL_FROM: str = Field(
        default="COOPERATIVE PACS Loan Alerts <noreply@cooperativepacs.com>",
        env="EMAIL_FROM",
    )

    # Pagination
    DEFAULT_PAGE_SIZE: int = Field(default=20, env="DEFAULT_PAGE_SIZE")
    MAX_PAGE_SIZE: int = Field(default=100, env="MAX_PAGE_SIZE")

    # Interest Rates (Default - can be overridden per loan type)
    DEFAULT_INTEREST_RATE: float = Field(default=7.0, env="DEFAULT_INTEREST_RATE")
    PENAL_INTEREST_RATE: float = Field(default=2.0, env="PENAL_INTEREST_RATE")
    OVERDUE_DAYS_FOR_PENALTY: int = Field(default=90, env="OVERDUE_DAYS_FOR_PENALTY")

    # File Upload
    MAX_UPLOAD_SIZE: int = Field(
        default=10 * 1024 * 1024, env="MAX_UPLOAD_SIZE"
    )  # 10MB
    ALLOWED_EXTENSIONS: List[str] = Field(
        default=["pdf", "jpg", "jpeg", "png"], env="ALLOWED_EXTENSIONS"
    )

    # Celery
    CELERY_BROKER_URL: str = Field(
        default="redis://localhost:6379/0", env="CELERY_BROKER_URL"
    )
    CELERY_RESULT_BACKEND: str = Field(
        default="redis://localhost:6379/0", env="CELERY_RESULT_BACKEND"
    )

    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FILE: str = Field(default="logs/app.log", env="LOG_FILE")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create settings instance
settings = Settings()
