from datetime import date
from decimal import Decimal

import pytest
from pypdf import PdfReader

from backend.models.invoice import Invoice
from backend.schemas.report import ReportCreate, TripWrite
from backend.services.amount_formatter import amount_to_chinese_upper
from backend.services.pdf_generator import generate_report_pdf
from backend.services.report_service import create_report, recalculate_report_totals


def test_amount_to_chinese_upper_formats_common_values():
    assert amount_to_chinese_upper(Decimal("0.00")) == "零元整"
    assert amount_to_chinese_upper(Decimal("120.30")) == "壹佰贰拾元叁角"
    assert amount_to_chinese_upper(Decimal("1001.05")) == "壹仟零壹元零伍分"


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("0.01", "壹分"),
        ("0.10", "壹角"),
        ("1.00", "壹元整"),
        ("10.00", "壹拾元整"),
        ("101.00", "壹佰零壹元整"),
        ("1000001.01", "壹佰万零壹元零壹分"),
    ],
)
def test_amount_to_chinese_upper_handles_edge_values(value, expected):
    assert amount_to_chinese_upper(Decimal(value)) == expected


def test_amount_to_chinese_upper_rejects_negative_values():
    with pytest.raises(ValueError):
        amount_to_chinese_upper(Decimal("-0.01"))


def test_generate_report_pdf_uses_template_and_report_values(db, tmp_path):
    report = create_report(
        db,
        ReportCreate(
            report_date=date(2026, 6, 1),
            department="研发部",
            employee_name="张三",
            purpose="客户现场支持",
            daily_subsidy=Decimal("100.00"),
            advance_amount=Decimal("50.00"),
            advance_date_month=5,
            advance_date_day=31,
            trips=[
                TripWrite(
                    sort_order=1,
                    depart_month=6,
                    depart_day=1,
                    depart_hour=8,
                    depart_place="广州",
                    arrive_month=6,
                    arrive_day=1,
                    arrive_hour=11,
                    arrive_place="深圳",
                    transport="高铁",
                )
            ],
        ),
    )
    db.add(
        Invoice(
            report_id=report.id,
            trip_id=report.trips[0].id,
            expense_category="transport_fare",
            file_path="uploads/1/test.pdf",
            file_type="pdf",
            amount=Decimal("88.80"),
            amount_confirmed=True,
        )
    )
    db.flush()
    recalculate_report_totals(report)

    pdf_bytes = generate_report_pdf(report)
    pdf_path = tmp_path / "report.pdf"
    pdf_path.write_bytes(pdf_bytes)

    reader = PdfReader(str(pdf_path))
    text = reader.pages[0].extract_text()
    assert len(reader.pages) == 1
    assert "研发部" in text
    assert "188.80" in text
    assert "壹佰捌拾捌元捌角" in text


def test_generate_report_pdf_splits_long_trip_lists_across_pages(db, tmp_path):
    report = create_report(
        db,
        ReportCreate(
            report_date=date(2026, 6, 1),
            department="实施部",
            employee_name="李四",
            purpose="连续客户现场实施",
            daily_subsidy=Decimal("10.00"),
            trips=[
                TripWrite(
                    sort_order=index,
                    depart_month=6,
                    depart_day=index,
                    depart_hour=8,
                    depart_place=f"S{index}",
                    arrive_month=6,
                    arrive_day=index,
                    arrive_hour=18,
                    arrive_place=f"E{index}",
                    transport=f"T{index}",
                )
                for index in range(1, 9)
            ],
        ),
    )
    db.add(
        Invoice(
            report_id=report.id,
            trip_id=report.trips[-1].id,
            expense_category="transport_fare",
            file_path="uploads/1/test.pdf",
            file_type="pdf",
            amount=Decimal("12.34"),
            amount_confirmed=True,
        )
    )
    db.flush()
    recalculate_report_totals(report)

    pdf_bytes = generate_report_pdf(report)
    pdf_path = tmp_path / "long-trip-report.pdf"
    pdf_path.write_bytes(pdf_bytes)

    reader = PdfReader(str(pdf_path))
    assert len(reader.pages) == 2

    first_page_text = reader.pages[0].extract_text()
    second_page_text = reader.pages[1].extract_text()
    assert "S1" in first_page_text
    assert "S7" in first_page_text
    assert "S8" not in first_page_text
    assert "S8" in second_page_text
    assert "92.34" in second_page_text
