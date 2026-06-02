from decimal import Decimal
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfReader

from backend.database.session import get_db
from backend.main import app
from backend.services import invoice_service


@pytest.fixture()
def client(db, tmp_path, monkeypatch):
    monkeypatch.setattr(invoice_service, "UPLOAD_ROOT", tmp_path / "uploads")

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def as_decimal(value) -> Decimal:
    return Decimal(str(value))


def test_phase1_to_phase4_practical_api_flow(client):
    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["data"]["status"] == "ok"

    settings = client.put(
        "/api/settings",
        json={"department": "项目交付部", "employee_name": "王五", "daily_subsidy": "100.00"},
    )
    assert settings.status_code == 200
    assert settings.json()["data"]["department"] == "项目交付部"

    create_payload = {
        "report_date": "2026-06-01",
        "purpose": "客户现场实施",
        "daily_subsidy": "100.00",
        "advance_amount": "300.00",
        "trips": [
            {
                "sort_order": index,
                "depart_month": 6,
                "depart_day": index,
                "depart_hour": 8,
                "depart_place": f"S{index}",
                "arrive_month": 6,
                "arrive_day": index,
                "arrive_hour": 18,
                "arrive_place": f"E{index}",
                "transport": "高铁",
            }
            for index in range(1, 9)
        ],
        "expense_items": [{"category": "accommodation", "remark": "酒店住宿"}],
    }
    created = client.post("/api/reports", json=create_payload)
    assert created.status_code == 200
    report_id = created.json()["data"]["id"]

    detail = client.get(f"/api/reports/{report_id}")
    assert detail.status_code == 200
    detail_data = detail.json()["data"]
    assert detail_data["department"] == "项目交付部"
    assert len(detail_data["trips"]) == 8
    assert detail_data["subsidy_days"] == 8
    first_trip_id = detail_data["trips"][0]["id"]

    listed = client.get("/api/reports", params={"status": "draft", "page": 1, "page_size": 20})
    assert listed.status_code == 200
    assert listed.json()["data"]["total"] == 1

    illegal_status = client.patch(f"/api/reports/{report_id}/status", json={"status": "reimbursed"})
    assert illegal_status.status_code == 400

    xml_invoice = client.post(
        "/api/invoices/upload",
        data={"report_id": str(report_id), "expense_category": "transport_fare", "trip_id": str(first_trip_id)},
        files={
            "file": (
                "invoice.xml",
                b"<Invoice><FPH>12345678</FPH><KPRQ>2026-06-01</KPRQ><JSHJ>388.80</JSHJ></Invoice>",
                "application/xml",
            )
        },
    )
    assert xml_invoice.status_code == 200
    xml_data = xml_invoice.json()["data"]
    assert xml_data["amount_confirmed"] is True
    assert as_decimal(xml_data["amount"]) == Decimal("388.80")

    image_invoice = client.post(
        "/api/invoices/upload",
        data={"report_id": str(report_id), "expense_category": "accommodation"},
        files={"file": ("receipt.png", b"not-a-real-image-but-uploadable", "image/png")},
    )
    assert image_invoice.status_code == 200
    image_data = image_invoice.json()["data"]
    assert image_data["file_type"] == "image"
    assert image_data["amount_confirmed"] is False

    confirmed_image = client.put(
        f"/api/invoices/{image_data['id']}",
        json={"amount": "199.99", "amount_confirmed": True},
    )
    assert confirmed_image.status_code == 200

    recalculated = client.get(f"/api/reports/{report_id}")
    assert recalculated.status_code == 200
    recalculated_data = recalculated.json()["data"]
    assert as_decimal(recalculated_data["total_amount"]) == Decimal("1388.79")
    assert as_decimal(recalculated_data["shortfall"]) == Decimal("1088.79")
    assert as_decimal(recalculated_data["surplus"]) == Decimal("0.00")

    pdf_response = client.get(f"/api/reports/{report_id}/pdf")
    assert pdf_response.status_code == 200
    assert pdf_response.headers["content-type"] == "application/pdf"
    reader = PdfReader(BytesIO(pdf_response.content))
    assert len(reader.pages) == 2
    assert "S8" in reader.pages[1].extract_text()

    printed = client.patch(f"/api/reports/{report_id}/status", json={"status": "printed"})
    assert printed.status_code == 200
    assert printed.json()["data"]["status"] == "printed"

    delete_printed = client.delete(f"/api/reports/{report_id}")
    assert delete_printed.status_code == 403
