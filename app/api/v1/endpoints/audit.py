"""
Audit Log API endpoints
View and search audit logs for compliance and monitoring
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.loan_ledger import AuditLog
from app.api.deps import require_admin, get_current_user

router = APIRouter()


# Response schemas
class AuditLogResponse(BaseModel):
    id: int
    actor_type: str
    actor_id: Optional[int]
    actor_name: Optional[str]
    action: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    old_value: Optional[str]
    new_value: Optional[str]
    rule_applied: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    details: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[AuditLogResponse])
async def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (loan, payment, user)"),
    entity_id: Optional[int] = Query(None, description="Filter by specific entity ID"),
    actor_id: Optional[int] = Query(None, description="Filter by user who performed action"),
    start_date: Optional[datetime] = Query(None, description="Start date for filter"),
    end_date: Optional[datetime] = Query(None, description="End date for filter"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get audit logs with filters (Admin only)
    Returns paginated audit trail
    """
    # Build query with filters
    query = select(AuditLog)
    
    filters = []
    if action:
        filters.append(AuditLog.action == action)
    if entity_type:
        filters.append(AuditLog.entity_type == entity_type)
    if entity_id:
        filters.append(AuditLog.entity_id == entity_id)
    if actor_id:
        filters.append(AuditLog.actor_id == actor_id)
    if start_date:
        filters.append(AuditLog.timestamp >= start_date)
    if end_date:
        filters.append(AuditLog.timestamp <= end_date)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Order by most recent first
    query = query.order_by(desc(AuditLog.timestamp))
    
    # Apply pagination
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return [
        AuditLogResponse(
            id=log.id,
            actor_type=log.actor_type,
            actor_id=log.actor_id,
            actor_name=log.actor_name,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            old_value=log.old_value,
            new_value=log.new_value,
            rule_applied=log.rule_applied,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            details=log.details,
            timestamp=log.timestamp
        )
        for log in logs
    ]


@router.get("/recent", response_model=List[AuditLogResponse])
async def get_recent_audit_logs(
    hours: int = Query(24, ge=1, le=168, description="Number of hours to look back"),
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get recent audit logs from last N hours (Admin only)
    Useful for quick monitoring of recent activities
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    query = select(AuditLog).where(
        AuditLog.timestamp >= cutoff_time
    ).order_by(desc(AuditLog.timestamp)).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return [
        AuditLogResponse(
            id=log.id,
            actor_type=log.actor_type,
            actor_id=log.actor_id,
            actor_name=log.actor_name,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            old_value=log.old_value,
            new_value=log.new_value,
            rule_applied=log.rule_applied,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            details=log.details,
            timestamp=log.timestamp
        )
        for log in logs
    ]


@router.get("/user/{user_id}", response_model=List[AuditLogResponse])
async def get_user_activity(
    user_id: int,
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all activities by a specific user (Admin only)
    Useful for investigating user behavior
    """
    cutoff_time = datetime.utcnow() - timedelta(days=days)
    
    query = select(AuditLog).where(
        and_(
            AuditLog.actor_id == user_id,
            AuditLog.timestamp >= cutoff_time
        )
    ).order_by(desc(AuditLog.timestamp)).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return [
        AuditLogResponse(
            id=log.id,
            actor_type=log.actor_type,
            actor_id=log.actor_id,
            actor_name=log.actor_name,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            old_value=log.old_value,
            new_value=log.new_value,
            rule_applied=log.rule_applied,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            details=log.details,
            timestamp=log.timestamp
        )
        for log in logs
    ]


@router.get("/statistics")
async def get_audit_statistics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get statistics about audit log activity (Admin only)
    Shows breakdown by action types, entity types, and users
    """
    from sqlalchemy import func
    
    cutoff_time = datetime.utcnow() - timedelta(days=days)
    
    # Count by action type
    action_query = select(
        AuditLog.action,
        func.count(AuditLog.id).label('count')
    ).where(
        AuditLog.timestamp >= cutoff_time
    ).group_by(AuditLog.action).order_by(desc('count'))
    
    result = await db.execute(action_query)
    actions = result.all()
    
    # Count by entity type
    entity_query = select(
        AuditLog.entity_type,
        func.count(AuditLog.id).label('count')
    ).where(
        AuditLog.timestamp >= cutoff_time
    ).group_by(AuditLog.entity_type).order_by(desc('count'))
    
    result = await db.execute(entity_query)
    entities = result.all()
    
    # Count by user
    user_query = select(
        AuditLog.actor_name,
        AuditLog.actor_type,
        func.count(AuditLog.id).label('count')
    ).where(
        AuditLog.timestamp >= cutoff_time
    ).group_by(AuditLog.actor_name, AuditLog.actor_type).order_by(desc('count'))
    
    result = await db.execute(user_query)
    users = result.all()
    
    # Total count
    total_query = select(func.count(AuditLog.id)).where(
        AuditLog.timestamp >= cutoff_time
    )
    result = await db.execute(total_query)
    total_count = result.scalar_one()
    
    return {
        "period_days": days,
        "total_activities": total_count,
        "by_action": [
            {"action": row.action, "count": row.count}
            for row in actions
        ],
        "by_entity_type": [
            {"entity_type": row.entity_type or "unknown", "count": row.count}
            for row in entities
        ],
        "by_user": [
            {"actor_name": row.actor_name, "actor_type": row.actor_type, "count": row.count}
            for row in users
        ][:20]  # Top 20 users
    }


@router.get("/entity/{entity_type}/{entity_id}", response_model=List[AuditLogResponse])
async def get_entity_history(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get complete audit history for a specific entity (Admin only)
    Shows all changes made to a loan, payment, user, etc.
    """
    query = select(AuditLog).where(
        and_(
            AuditLog.entity_type == entity_type,
            AuditLog.entity_id == entity_id
        )
    ).order_by(desc(AuditLog.timestamp))
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return [
        AuditLogResponse(
            id=log.id,
            actor_type=log.actor_type,
            actor_id=log.actor_id,
            actor_name=log.actor_name,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            old_value=log.old_value,
            new_value=log.new_value,
            rule_applied=log.rule_applied,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            details=log.details,
            timestamp=log.timestamp
        )
        for log in logs
    ]
