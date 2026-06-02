from __future__ import annotations

from decimal import Decimal
from io import BytesIO
from pathlib import Path
from typing import Mapping

from pypdf import PdfReader, PdfWriter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfgen import canvas

from backend.database.connection import PROJECT_ROOT
from backend.models.report import ExpenseReport
from backend.services.amount_formatter import amount_to_chinese_upper

TEMPLATE_DIR = PROJECT_ROOT / "backend" / "templates"
BASE_TEMPLATE_PATH = TEMPLATE_DIR / "reimbursement_template.pdf"
FIELD_TEMPLATE_PATH = TEMPLATE_DIR / "reimbursement_form_fields.pdf"
FONT_NAME = "STSong-Light"
MAX_TRIP_ROWS = 7

try:
    pdfmetrics.registerFont(UnicodeCIDFont(FONT_NAME))
except Exception:
    pass

OTHER_FIELD_PREFIX = {
    "luggage": "luggage",
    "city_transport": "city_transport",
    "accommodation": "accommodation",
    "postal": "postal",
    "no_sleeper_subsidy": "no_sleeper",
    "toll": "toll",
    "fuel_subsidy": "fuel_subsidy",
}


def _money(value: Decimal | int | float | None, blank_zero: bool = False) -> str:
    amount = Decimal(str(value or "0")).quantize(Decimal("0.01"))
    if blank_zero and amount == Decimal("0.00"):
        return ""
    return f"{amount:.2f}"


def _plain(value: object) -> str:
    if value is None:
        return ""
    return str(value)


def _active_confirmed_invoices(report: ExpenseReport):
    return [invoice for invoice in report.invoices if invoice.deleted_at is None and invoice.amount_confirmed]


def _chunked_trips(trips: list, size: int) -> list[list]:
    if not trips:
        return [[]]
    return [trips[index : index + size] for index in range(0, len(trips), size)]


def _build_field_values(report: ExpenseReport, trip_rows: list | None = None) -> dict[str, str]:
    invoices = _active_confirmed_invoices(report)
    trips = sorted(report.trips, key=lambda item: item.sort_order)
    visible_trips = trips if trip_rows is None else trip_rows
    transport_invoices = [invoice for invoice in invoices if invoice.expense_category == "transport_fare"]
    values: dict[str, str] = {
        "department": _plain(report.department),
        "employee_name": _plain(report.employee_name),
        "purpose": _plain(report.purpose),
        "report_date_year": _plain(report.report_date.year if report.report_date else ""),
        "report_date_month": _plain(report.report_date.month if report.report_date else ""),
        "report_date_day": _plain(report.report_date.day if report.report_date else ""),
        "subsidy_days": _plain(report.subsidy_days),
        "subsidy_amount": _money(report.subsidy_total),
        "total_amount": _money(report.total_amount),
        "total_amount_cn": amount_to_chinese_upper(report.total_amount),
        "advance_amount": _money(report.advance_amount, blank_zero=True),
        "advance_month": _plain(report.advance_date_month),
        "advance_day": _plain(report.advance_date_day),
        "shortfall": _money(report.shortfall, blank_zero=True),
        "surplus": _money(report.surplus, blank_zero=True),
    }

    transport_count = len(transport_invoices)
    transport_total = sum((invoice.amount for invoice in transport_invoices), Decimal("0.00"))
    for row, trip in enumerate(visible_trips[:MAX_TRIP_ROWS], start=1):
        trip_invoices = [
            invoice
            for invoice in invoices
            if invoice.expense_category == "transport_fare" and invoice.trip_id == trip.id
        ]
        trip_amount = sum((invoice.amount for invoice in trip_invoices), Decimal("0.00"))
        values.update(
            {
                f"depart_month_{row}": _plain(trip.depart_month),
                f"depart_day_{row}": _plain(trip.depart_day),
                f"depart_hour_{row}": _plain(trip.depart_hour),
                f"depart_place_{row}": _plain(trip.depart_place),
                f"arrive_month_{row}": _plain(trip.arrive_month),
                f"arrive_day_{row}": _plain(trip.arrive_day),
                f"arrive_hour_{row}": _plain(trip.arrive_hour),
                f"arrive_place_{row}": _plain(trip.arrive_place),
                f"transport_{row}": _plain(trip.transport),
                f"invoice_count_{row}": _plain(len(trip_invoices)) if trip_invoices else "",
                f"transport_fare_{row}": _money(trip_amount, blank_zero=True),
            }
        )

    other_count = 0
    other_amount = Decimal("0.00")
    for category, prefix in OTHER_FIELD_PREFIX.items():
        category_invoices = [invoice for invoice in invoices if invoice.expense_category == category]
        category_count = len(category_invoices)
        category_amount = sum((invoice.amount for invoice in category_invoices), Decimal("0.00"))
        other_count += category_count
        other_amount += category_amount
        values[f"{prefix}_count"] = _plain(category_count) if category_count else ""
        values[f"{prefix}_amount"] = _money(category_amount, blank_zero=True)

    values.update(
        {
            "total_invoice_count": _plain(transport_count) if transport_count else "",
            "total_transport_fare": _money(transport_total, blank_zero=True),
            "total_lodging_amount": "",
            "total_other_count": _plain(other_count) if other_count else "",
            "total_other_amount": _money(other_amount, blank_zero=True),
        }
    )
    return values


def _field_rects(path: Path) -> dict[str, tuple[float, float, float, float]]:
    reader = PdfReader(str(path))
    rects: dict[str, tuple[float, float, float, float]] = {}
    for page in reader.pages:
        for annotation_ref in page.get("/Annots", []):
            annotation = annotation_ref.get_object()
            name = annotation.get("/T")
            rect = annotation.get("/Rect")
            if name and rect:
                rects[str(name)] = tuple(float(item) for item in rect)
    return rects


def _is_amount_field(name: str) -> bool:
    return any(token in name for token in ("amount", "fare", "shortfall", "surplus"))


def _draw_value(c: canvas.Canvas, rect: tuple[float, float, float, float], name: str, value: str) -> None:
    if not value:
        return
    x0, y0, x1, y1 = rect
    width = max(1, x1 - x0)
    height = max(1, y1 - y0)
    font_size = min(9.0, max(5.5, height * 0.48))
    max_width = width - 3

    while font_size > 5 and pdfmetrics.stringWidth(value, FONT_NAME, font_size) > max_width:
        font_size -= 0.35

    text_width = pdfmetrics.stringWidth(value, FONT_NAME, font_size)
    if text_width > max_width:
        value = _truncate_to_width(value, max_width, font_size)
        text_width = pdfmetrics.stringWidth(value, FONT_NAME, font_size)

    if _is_amount_field(name):
        x = x1 - text_width - 1.5
    elif name.endswith("_count") or name.endswith("_day") or name.endswith("_month") or name.endswith("_hour") or name == "subsidy_days":
        x = x0 + (width - text_width) / 2
    else:
        x = x0 + 1.5
    y = y0 + (height - font_size) / 2 + 1.0

    c.setFont(FONT_NAME, font_size)
    c.drawString(x, y, value)


def _truncate_to_width(text: str, max_width: float, font_size: float) -> str:
    if pdfmetrics.stringWidth(text, FONT_NAME, font_size) <= max_width:
        return text
    ellipsis = "..."
    available = max_width - pdfmetrics.stringWidth(ellipsis, FONT_NAME, font_size)
    result = ""
    for char in text:
        if pdfmetrics.stringWidth(result + char, FONT_NAME, font_size) > available:
            break
        result += char
    return result + ellipsis if result else ellipsis


def _build_overlay(
    page_width: float,
    page_height: float,
    rects: Mapping[str, tuple[float, float, float, float]],
    values: Mapping[str, str],
) -> BytesIO:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=(page_width, page_height))
    c.setFillColorRGB(0, 0, 0)
    for name, value in values.items():
        rect = rects.get(name)
        if rect:
            _draw_value(c, rect, name, value)
    c.save()
    buffer.seek(0)
    return buffer


def generate_report_pdf(report: ExpenseReport) -> bytes:
    if not BASE_TEMPLATE_PATH.exists():
        raise FileNotFoundError(f"报销单模板不存在：{BASE_TEMPLATE_PATH}")
    if not FIELD_TEMPLATE_PATH.exists():
        raise FileNotFoundError(f"报销单填表域模板不存在：{FIELD_TEMPLATE_PATH}")

    field_rects = _field_rects(FIELD_TEMPLATE_PATH)
    trips = sorted(report.trips, key=lambda item: item.sort_order)
    trip_pages = _chunked_trips(trips, MAX_TRIP_ROWS)

    writer = PdfWriter()
    for trip_rows in trip_pages:
        base_reader = PdfReader(str(BASE_TEMPLATE_PATH))
        page = base_reader.pages[0]
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)
        overlay_buffer = _build_overlay(page_width, page_height, field_rects, _build_field_values(report, trip_rows))
        overlay_reader = PdfReader(overlay_buffer)
        page.merge_page(overlay_reader.pages[0])
        writer.add_page(page)

    output = BytesIO()
    writer.write(output)
    return output.getvalue()
