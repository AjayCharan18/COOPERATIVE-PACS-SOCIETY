"""
Celery configuration for background tasks
"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "dccb_loan_system",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.notifications",
        "app.tasks.interest_calculation",
        "app.tasks.reports"
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "send-emi-reminders-daily": {
        "task": "app.tasks.notifications.send_emi_reminders",
        "schedule": 86400.0,  # Every 24 hours
        "options": {"expires": 3600}
    },
    "calculate-daily-interest": {
        "task": "app.tasks.interest_calculation.calculate_daily_interest",
        "schedule": 86400.0,  # Every 24 hours at midnight
        "options": {"expires": 3600}
    },
    "check-overdue-loans": {
        "task": "app.tasks.notifications.check_overdue_loans",
        "schedule": 86400.0,  # Every 24 hours
        "options": {"expires": 3600}
    },
}

if __name__ == "__main__":
    celery_app.start()
