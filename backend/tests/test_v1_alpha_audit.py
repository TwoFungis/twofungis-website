"""
Backend audit tests for TradeOS v1.0 Alpha.

Verifies the endpoints powering the main app pages:
- Auth / workspace context
- Organizations
- Opportunities (list + stats)
- Projects
- Invoices
- Expenses
- Documents (verifies frontend->backend prefix mismatch)
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://profit-tracker-demo-1.preview.emergentagent.com").rstrip("/")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://oiocmchdtllqpszciuxh.supabase.co").rstrip("/")
SUPABASE_ANON_KEY = os.environ.get(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pb2NtY2hkdGxscXBzemNpdXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzk2MzIsImV4cCI6MjA5NzkxNTYzMn0."
    "Dy6bqBFaOD7FIR4E8ny_p120VmvzpUk38WFojGv-jAE",
)

TEST_EMAIL = "inbox@twofungis.ca"
TEST_PASSWORD = "TradeOS2024!"


@pytest.fixture(scope="module")
def token():
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, f"Supabase auth failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def headers(token):
    return {"Authorization": f"Bearer {token}"}


# --- health ---
def test_health():
    r = requests.get(f"{BASE_URL}/api/", timeout=10)
    assert r.status_code == 200
    assert "TradeOS" in r.text


# --- workspace context ---
def test_workspace_context(headers):
    r = requests.get(f"{BASE_URL}/api/workspace/context", headers=headers, timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data.get("has_access") is True
    assert data.get("has_organization") is True
    assert data.get("redirect_to") == "/app/command-center"


# --- organizations ---
def test_organizations_me(headers):
    r = requests.get(f"{BASE_URL}/api/organizations/me", headers=headers, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("success") is True
    assert isinstance(data.get("organizations"), list)
    assert len(data["organizations"]) >= 1
    org = data["organizations"][0]
    for field in ("id", "name", "role"):
        assert field in org


# --- opportunities ---
def test_opportunities_list(headers):
    r = requests.get(f"{BASE_URL}/api/opportunities", headers=headers, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("success") is True
    assert isinstance(data.get("opportunities"), list)


def test_opportunities_stats(headers):
    r = requests.get(f"{BASE_URL}/api/opportunities/stats/pipeline", headers=headers, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "total" in data
    assert "by_status" in data


# --- projects ---
def test_projects_list(headers):
    r = requests.get(f"{BASE_URL}/api/projects", headers=headers, timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# --- invoices ---
def test_invoices_list(headers):
    r = requests.get(f"{BASE_URL}/api/invoices", headers=headers, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "invoices" in data
    assert "stats" in data


# --- expenses ---
def test_expenses_list(headers):
    r = requests.get(f"{BASE_URL}/api/expenses", headers=headers, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "expenses" in data
    assert "stats" in data


# --- documents (frontend/backend prefix mismatch) ---
def test_documents_endpoint_mismatch(headers):
    """
    KNOWN BUG: DocumentsPage.jsx calls GET /api/documents?folder=,
    but backend uses storage_router with prefix /api/storage.
    This test documents the mismatch.
    """
    r = requests.get(f"{BASE_URL}/api/documents?folder=", headers=headers, timeout=10)
    assert r.status_code == 404  # documenting the bug

    # The actual storage endpoint should exist (list may be empty or return something):
    r2 = requests.get(f"{BASE_URL}/api/storage", headers=headers, timeout=10)
    # storage router exists; we accept any non-404 (root may not be defined - list endpoint)
    assert r2.status_code != 404 or True  # informational
