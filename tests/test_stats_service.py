from datetime import date
from decimal import Decimal

from backend.models.invoice import Invoice
from backend.schemas.report import ReportCreate
from backend.services.report_service import create_report, update_report_status
from backend.services.stats_service import get_stats_summary


def test_stats_summary_counts_periods_statuses_and_pending_invoices(db):
    current = create_report(db, ReportCreate(report_date=date(2026, 6, 1), purpose="本月"))
    current.total_amount = Decimal("120.00")
    printed = create_report(db, ReportCreate(report_date=date(2026, 6, 2), purpose="已打印"))
    printed.total_amount = Decimal("80.00")
    update_report_status(db, printed.id, "printed")
    previous_month = create_report(db, ReportCreate(report_date=date(2026, 5, 30), purpose="上月"))
    previous_month.total_amount = Decimal("50.00")
    db.add(
        Invoice(
            report_id=current.id,
            expense_category="luggage",
            file_path="uploads/1/test.pdf",
            file_type="pdf",
            amount=Decimal("30.00"),
            amount_confirmed=False,
        )
    )
    db.commit()

    summary = get_stats_summary(db, today=date(2026, 6, 15))

    assert summary.month_amount == Decimal("200.00")
    assert summary.month_count == 2
    assert summary.year_amount == Decimal("250.00")
    assert summary.year_count == 3
    assert summary.draft_count == 2
    assert summary.printed_count == 1
    assert summary.pending_invoice_count == 1
