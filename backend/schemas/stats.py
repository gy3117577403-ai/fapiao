from decimal import Decimal

from pydantic import BaseModel, Field

from backend.schemas.report import ReportRead


class StatsSummary(BaseModel):
    month_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    month_count: int = Field(default=0, ge=0)
    year_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    year_count: int = Field(default=0, ge=0)
    draft_count: int = Field(default=0, ge=0)
    printed_count: int = Field(default=0, ge=0)
    reimbursed_count: int = Field(default=0, ge=0)
    pending_invoice_count: int = Field(default=0, ge=0)
    recent_reports: list[ReportRead] = Field(default_factory=list)
