"""
Celery tasks for reports
"""

from app.core.celery_app import celery_app


@celery_app.task(name="app.tasks.reports.generate_monthly_report")
def generate_monthly_report():
    """Generate monthly loan report"""
    # Implementation for monthly report generation
    return "Monthly report generated"


@celery_app.task(name="app.tasks.reports.generate_npa_report")
def generate_npa_report():
    """Generate NPA (Non-Performing Assets) report"""
    # Implementation for NPA report
    return "NPA report generated"
