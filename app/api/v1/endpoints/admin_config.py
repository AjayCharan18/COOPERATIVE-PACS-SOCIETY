"""
Admin System Configuration API endpoints
Manage loan types, interest rates, penalties, and global settings
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.loan import LoanTypeConfig, LoanType, InterestCalculationType
from app.api.deps import require_admin

router = APIRouter()


# Pydantic schemas for configuration
class LoanTypeConfigUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    default_interest_rate: Optional[float] = Field(None, ge=0, le=100)
    default_tenure_months: Optional[int] = Field(None, ge=1, le=600)
    min_amount: Optional[float] = Field(None, ge=0)
    max_amount: Optional[float] = Field(None, ge=0)
    interest_calculation_type: Optional[InterestCalculationType] = None
    penal_interest_rate: Optional[float] = Field(None, ge=0, le=50)
    overdue_days_for_penalty: Optional[int] = Field(None, ge=0)
    requires_emi: Optional[bool] = None
    emi_frequency: Optional[str] = None
    min_land_area: Optional[float] = Field(None, ge=0)
    eligible_crops: Optional[str] = None
    is_active: Optional[bool] = None


class LoanTypeConfigResponse(BaseModel):
    id: int
    loan_type: str
    display_name: str
    description: Optional[str]
    default_interest_rate: float
    default_tenure_months: int
    min_amount: float
    max_amount: Optional[float]
    interest_calculation_type: str
    penal_interest_rate: float
    overdue_days_for_penalty: int
    requires_emi: bool
    emi_frequency: str
    min_land_area: Optional[float]
    eligible_crops: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True


@router.get("/loan-types", response_model=List[LoanTypeConfigResponse])
async def get_all_loan_type_configs(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all loan type configurations (Admin only)
    """
    result = await db.execute(select(LoanTypeConfig))
    configs = result.scalars().all()
    
    return [
        LoanTypeConfigResponse(
            id=config.id,
            loan_type=config.loan_type.value,
            display_name=config.display_name,
            description=config.description,
            default_interest_rate=config.default_interest_rate,
            default_tenure_months=config.default_tenure_months,
            min_amount=config.min_amount,
            max_amount=config.max_amount,
            interest_calculation_type=config.interest_calculation_type.value,
            penal_interest_rate=config.penal_interest_rate,
            overdue_days_for_penalty=config.overdue_days_for_penalty,
            requires_emi=config.requires_emi,
            emi_frequency=config.emi_frequency,
            min_land_area=config.min_land_area,
            eligible_crops=config.eligible_crops,
            is_active=config.is_active
        )
        for config in configs
    ]


@router.get("/loan-types/{loan_type}", response_model=LoanTypeConfigResponse)
async def get_loan_type_config(
    loan_type: LoanType,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get specific loan type configuration (Admin only)
    """
    result = await db.execute(
        select(LoanTypeConfig).where(LoanTypeConfig.loan_type == loan_type)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration for loan type {loan_type.value} not found"
        )
    
    return LoanTypeConfigResponse(
        id=config.id,
        loan_type=config.loan_type.value,
        display_name=config.display_name,
        description=config.description,
        default_interest_rate=config.default_interest_rate,
        default_tenure_months=config.default_tenure_months,
        min_amount=config.min_amount,
        max_amount=config.max_amount,
        interest_calculation_type=config.interest_calculation_type.value,
        penal_interest_rate=config.penal_interest_rate,
        overdue_days_for_penalty=config.overdue_days_for_penalty,
        requires_emi=config.requires_emi,
        emi_frequency=config.emi_frequency,
        min_land_area=config.min_land_area,
        eligible_crops=config.eligible_crops,
        is_active=config.is_active
    )


@router.put("/loan-types/{loan_type}")
async def update_loan_type_config(
    loan_type: LoanType,
    config_update: LoanTypeConfigUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update loan type configuration (Admin only)
    """
    result = await db.execute(
        select(LoanTypeConfig).where(LoanTypeConfig.loan_type == loan_type)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration for loan type {loan_type.value} not found"
        )
    
    # Update only provided fields
    update_data = config_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    
    await db.commit()
    await db.refresh(config)
    
    return {
        "message": f"Loan type {loan_type.value} configuration updated successfully",
        "loan_type": loan_type.value,
        "updated_fields": list(update_data.keys())
    }


@router.post("/loan-types/{loan_type}/toggle-status")
async def toggle_loan_type_status(
    loan_type: LoanType,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Activate/Deactivate a loan type (Admin only)
    """
    result = await db.execute(
        select(LoanTypeConfig).where(LoanTypeConfig.loan_type == loan_type)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration for loan type {loan_type.value} not found"
        )
    
    config.is_active = not config.is_active
    await db.commit()
    await db.refresh(config)
    
    return {
        "message": f"Loan type {loan_type.value} {'activated' if config.is_active else 'deactivated'} successfully",
        "loan_type": loan_type.value,
        "is_active": config.is_active
    }


# Global system settings
class SystemSettingsResponse(BaseModel):
    """Current system-wide settings"""
    interest_accrual_enabled: bool = True
    daily_accrual_time: str = "00:00"
    overdue_notification_enabled: bool = True
    overdue_notification_days: int = 7
    sms_notifications_enabled: bool = True
    email_notifications_enabled: bool = True
    auto_penalty_calculation: bool = True
    max_loan_amount: float = 10000000.0
    min_loan_amount: float = 1000.0
    default_grace_period_days: int = 3


@router.get("/system-settings", response_model=SystemSettingsResponse)
async def get_system_settings(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current system settings (Admin only)
    In a real implementation, these would be stored in a database table
    For now, returning default values
    """
    return SystemSettingsResponse()


@router.put("/system-settings")
async def update_system_settings(
    settings: SystemSettingsResponse,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update system settings (Admin only)
    In a real implementation, these would be stored in a database table
    For now, just validating and returning the settings
    """
    return {
        "message": "System settings updated successfully",
        "settings": settings.model_dump()
    }


@router.get("/interest-rates/summary")
async def get_interest_rate_summary(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get summary of all interest rates across loan types (Admin only)
    """
    result = await db.execute(select(LoanTypeConfig))
    configs = result.scalars().all()
    
    return {
        "loan_types": [
            {
                "loan_type": config.loan_type.value,
                "display_name": config.display_name,
                "default_interest_rate": config.default_interest_rate,
                "penal_interest_rate": config.penal_interest_rate,
                "total_rate_if_overdue": config.default_interest_rate + config.penal_interest_rate,
                "is_active": config.is_active
            }
            for config in configs
        ],
        "interest_calculation_methods": list(set(config.interest_calculation_type.value for config in configs)),
        "generated_at": "now"
    }


@router.post("/interest-rates/bulk-update")
async def bulk_update_interest_rates(
    rate_adjustment_percentage: float = Query(..., ge=-50, le=50, description="Percentage adjustment (+/-50%)"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk update all interest rates by a percentage (Admin only)
    For example: 10% means increase all rates by 10%
                -5% means decrease all rates by 5%
    """
    result = await db.execute(select(LoanTypeConfig))
    configs = result.scalars().all()
    
    updated_configs = []
    for config in configs:
        old_rate = config.default_interest_rate
        adjustment_factor = 1 + (rate_adjustment_percentage / 100)
        new_rate = old_rate * adjustment_factor
        
        # Ensure rate stays within reasonable bounds (1% to 50%)
        new_rate = max(1.0, min(50.0, new_rate))
        
        config.default_interest_rate = round(new_rate, 2)
        updated_configs.append({
            "loan_type": config.loan_type.value,
            "old_rate": old_rate,
            "new_rate": config.default_interest_rate
        })
    
    await db.commit()
    
    return {
        "message": f"All interest rates adjusted by {rate_adjustment_percentage}%",
        "updated_count": len(updated_configs),
        "details": updated_configs
    }
