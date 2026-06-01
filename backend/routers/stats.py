from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.schemas.common import ApiResponse
from backend.schemas.stats import StatsSummary
from backend.services.stats_service import get_stats_summary

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/summary", response_model=ApiResponse[StatsSummary])
def get_summary(db: Session = Depends(get_db)) -> ApiResponse[StatsSummary]:
    return ApiResponse(data=get_stats_summary(db))
