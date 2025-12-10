"""
Main API router combining all endpoints
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    loans,
    dashboard,
    reports,
    overdue,
    loan_closure,
    loan_rescheduling,
    documents,
    branches,
    payments,
    smart_calculator,
    admin_config,
    audit,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(loans.router, prefix="/loans", tags=["Loans"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(
    dashboard.router, prefix="/dashboard", tags=["Dashboard & Analytics"]
)
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Export"])
api_router.include_router(
    overdue.router, prefix="/overdue", tags=["Overdue Management"]
)
api_router.include_router(
    loan_closure.router, prefix="/loan-closure", tags=["Loan Closure"]
)
api_router.include_router(
    loan_rescheduling.router, prefix="/loan-rescheduling", tags=["Loan Rescheduling"]
)
api_router.include_router(
    documents.router, prefix="/documents", tags=["Document Management"]
)
api_router.include_router(
    branches.router, prefix="/branches", tags=["Branch Management"]
)
api_router.include_router(
    smart_calculator.router, prefix="/smart-calculator", tags=["Smart Calculator & AI"]
)
api_router.include_router(
    admin_config.router, prefix="/admin/config", tags=["Admin Configuration"]
)
api_router.include_router(
    audit.router, prefix="/admin/audit", tags=["Audit & Activity Logs"]
)
