"""
Flight Check API Endpoints

Provides comprehensive platform diagnostics through REST API endpoints.
Based on specification in docs/flight-check.md
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional
from enum import Enum

from app.database import get_db
from app.services.flight_check_service import FlightCheckService
from app.auth import get_current_user
from app.models import User

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

class CheckType(str, Enum):
    QUICK = "quick"
    COMPREHENSIVE = "comprehensive"
    DEEP = "deep"

@router.get("/health", response_model=Dict[str, Any])
async def quick_health_check(
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Quick health check (30 seconds) - Essential systems only.
    
    No authentication required for basic health check.
    """
    try:
        flight_check = FlightCheckService(db)
        result = await flight_check.quick_health_check()
        return result
    except Exception as e:
        logger.error(f"Quick health check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        )

@router.get("/comprehensive", response_model=Dict[str, Any])
async def comprehensive_check(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Comprehensive check (5 minutes) - All major systems.
    
    Requires authentication.
    """
    try:
        flight_check = FlightCheckService(db)
        result = await flight_check.comprehensive_check()
        
        # Add user context
        result["user"] = {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role
        }
        
        return result
    except Exception as e:
        logger.error(f"Comprehensive check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Comprehensive check failed: {str(e)}"
        )

@router.get("/deep", response_model=Dict[str, Any])
async def deep_diagnostic(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Deep diagnostic (15 minutes) - Complete system analysis.
    
    Requires admin authentication.
    """
    if not current_user.role == "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required for deep diagnostic"
        )
    
    try:
        flight_check = FlightCheckService(db)
        result = await flight_check.deep_diagnostic()
        
        # Add user context
        result["user"] = {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role
        }
        
        return result
    except Exception as e:
        logger.error(f"Deep diagnostic failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Deep diagnostic failed: {str(e)}"
        )

@router.get("/database", response_model=Dict[str, Any])
async def database_check(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Focused database health check.
    """
    try:
        flight_check = FlightCheckService(db)
        result = await flight_check._check_database_comprehensive()
        
        return {
            "category": "Database",
            "timestamp": flight_check.start_time,
            "check": result
        }
    except Exception as e:
        logger.error(f"Database check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Database check failed: {str(e)}"
        )

@router.get("/ai-services", response_model=Dict[str, Any])
async def ai_services_check(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Focused AI services health check.
    """
    try:
        flight_check = FlightCheckService(db)
        result = await flight_check._check_ai_services()
        
        return {
            "category": "AI Services",
            "timestamp": flight_check.start_time,
            "checks": result
        }
    except Exception as e:
        logger.error(f"AI services check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"AI services check failed: {str(e)}"
        )

@router.get("/multi-tenant", response_model=Dict[str, Any])
async def multi_tenant_check(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Focused multi-tenant system health check.
    """
    try:
        flight_check = FlightCheckService(db)
        result = await flight_check._check_multi_tenant()
        
        return {
            "category": "Multi-Tenant System",
            "timestamp": flight_check.start_time,
            "checks": result
        }
    except Exception as e:
        logger.error(f"Multi-tenant check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Multi-tenant check failed: {str(e)}"
        )

@router.get("/processing", response_model=Dict[str, Any])
async def processing_check(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Focused document processing pipeline check.
    """
    try:
        flight_check = FlightCheckService(db)
        result = await flight_check._check_file_system()
        
        return {
            "category": "Document Processing",
            "timestamp": flight_check.start_time,
            "checks": result
        }
    except Exception as e:
        logger.error(f"Processing check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Processing check failed: {str(e)}"
        )

@router.get("/analytics", response_model=Dict[str, Any])
async def analytics_check(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Focused analytics system health check.
    """
    try:
        flight_check = FlightCheckService(db)
        result = await flight_check._check_analytics()
        
        return {
            "category": "Analytics & Reporting",
            "timestamp": flight_check.start_time,
            "checks": result
        }
    except Exception as e:
        logger.error(f"Analytics check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analytics check failed: {str(e)}"
        )

@router.get("/performance", response_model=Dict[str, Any])
async def performance_check(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Focused system performance check.
    """
    if not current_user.role == "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required for performance check"
        )
    
    try:
        flight_check = FlightCheckService(db)
        result = await flight_check._check_performance()
        
        return {
            "category": "Performance",
            "timestamp": flight_check.start_time,
            "checks": result
        }
    except Exception as e:
        logger.error(f"Performance check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Performance check failed: {str(e)}"
        )

@router.get("/security", response_model=Dict[str, Any])
async def security_check(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Focused security configuration check.
    """
    if not current_user.role == "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required for security check"
        )
    
    try:
        flight_check = FlightCheckService(db)
        result = await flight_check._check_security()
        
        return {
            "category": "Security",
            "timestamp": flight_check.start_time,
            "checks": result
        }
    except Exception as e:
        logger.error(f"Security check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Security check failed: {str(e)}"
        )

@router.get("/status", response_model=Dict[str, Any])
async def system_status(
    check_type: CheckType = Query(CheckType.QUICK, description="Type of check to perform"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Unified system status endpoint with configurable check depth.
    """
    try:
        flight_check = FlightCheckService(db)
        
        if check_type == CheckType.QUICK:
            result = await flight_check.quick_health_check()
        elif check_type == CheckType.COMPREHENSIVE:
            if not current_user:
                raise HTTPException(status_code=401, detail="Authentication required")
            result = await flight_check.comprehensive_check()
        elif check_type == CheckType.DEEP:
            if not current_user or not current_user.role == "admin":
                raise HTTPException(status_code=403, detail="Admin privileges required")
            result = await flight_check.deep_diagnostic()
        
        # Add metadata
        result["check_type"] = check_type.value
        if current_user:
            result["user"] = {
                "id": current_user.id,
                "username": current_user.username,
                "role": current_user.role
            }
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"System status check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"System status check failed: {str(e)}"
        ) 