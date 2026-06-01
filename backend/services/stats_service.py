from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.models.invoice import Invoice
from backend.models.report import ExpenseReport
from backend.schemas.stats import StatsSummary


def _month_bounds(today: date) -> tuple[date, date]:
    start = today.replace(day=1)
    if start.month == 12:
        end = date(start.year + 1, 1, 1)
    else:
        end = date(start.year, start.month + 1, 1)
    return start, end


def get_stats_summary(db: Session, today: date | None = None) -> StatsSummary:
    today = today or date.today()
    month_start, next_month = _month_bounds(today)
    year_start = date(today.year, 1, 1)
    next_year = date(today.year + 1, 1, 1)
    active_reports = ExpenseReport.deleted_at.is_(None)

    month_amount, month_count = db.execute(
        select(func.coalesce(func.sum(ExpenseReport.total_amount), Decimal("0.00")), func.count(ExpenseReport.id)).where(
            active_reports,
            ExpenseReport.report_date >= month_start,
            ExpenseReport.report_date < next_month,
        )
    ).one()
    year_amount, year_count = db.execute(
        select(func.coalesce(func.sum(ExpenseReport.total_amount), Decimal("0.00")), func.count(ExpenseReport.id)).where(
            active_reports,
            ExpenseReport.report_date >= year_start,
            ExpenseReport.report_date < next_year,
        )
    ).one()

    status_counts = dict(
        db.execute(
            select(ExpenseReport.status, func.count(ExpenseReport.id)).where(active_reports).group_by(ExpenseReport.status)
        ).all()
    )

    pending_invoice_count = int(
        db.scalar(
            select(func.count(Invoice.id))
            .join(ExpenseReport, Invoice.report_id == ExpenseReport.id)
            .where(
                active_reports,
                Invoice.deleted_at.is_(None),
                Invoice.amount_confirmed.is_(False),
            )
        )
        or 0
    )

    recent_reports = list(
        db.scalars(
            select(ExpenseReport)
            .where(active_reports)
            .order_by(ExpenseReport.updated_at.desc(), ExpenseReport.created_at.desc())
            .limit(5)
        ).all()
    )

    return StatsSummary(
        month_amount=month_amount or Decimal("0.00"),
        month_count=int(month_count or 0),
        year_amount=year_amount or Decimal("0.00"),
        year_count=int(year_count or 0),
        draft_count=int(status_counts.get("draft", 0)),
        printed_count=int(status_counts.get("printed", 0)),
        reimbursed_count=int(status_counts.get("reimbursed", 0)),
        pending_invoice_count=pending_invoice_count,
        recent_reports=recent_reports,
    )
