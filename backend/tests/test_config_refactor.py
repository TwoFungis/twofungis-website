"""
Regression tests for the Config Hardening Refactor (Iteration 16)
==================================================================
Verifies that after moving env-var access into /app/backend/config.py
(lazy Config class) and load_dotenv() at the top of server.py:

1. Login flow (Supabase password grant) still returns a valid JWT
2. GET /api/organizations/me returns 200 with 'Two Fungis Finishing'
3. GET /api/command-center/dashboard returns 200 with organization_name
4. GET /api/production-library/seed/status returns 200 is_seeded=true
5. GET /api/production-library/items returns >=8 seeded items
6. GET /api/opportunities returns 200 (list flow works)
"""
import os
import pytest
import requests

# Public URL used by users
BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://profit-tracker-demo-1.preview.emergentagent.com",
).rstrip("/")

# Supabase (used only to obtain a JWT; matches values in tests already in repo)
SUPABASE_URL = "https://oiocmchdtllqpszciuxh.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pb2NtY2hkdGxscXBzemNpdXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzk2MzIsImV4cCI6MjA5NzkxNTYzMn0."
    "Dy6bqBFaOD7FIR4E8ny_p120VmvzpUk38WFojGv-jAE"
)

EMAIL = "inbox@twofungis.ca"
PASSWORD = "TradeOS2024!"

EXPECTED_ITEM_CODES = {
    "DW-001", "DW-002", "DW-003",
    "PT-001", "PT-002", "PT-003",
    "TP-001", "TP-002",
}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="module")
def auth_token():
    """Login via Supabase and return an access_token JWT."""
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": EMAIL, "password": PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, f"Supabase login failed: {r.status_code} {r.text}"
    token = r.json().get("access_token")
    assert token, f"No access_token: {r.text}"
    return token


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


# ---------------------------------------------------------------------------
# 1. Login/JWT
# ---------------------------------------------------------------------------
class TestLogin:
    def test_login_returns_valid_jwt(self, auth_token):
        assert isinstance(auth_token, str)
        assert len(auth_token) > 20
        assert auth_token.count(".") == 2  # 3 segments


# ---------------------------------------------------------------------------
# 2. Basic API health – makes sure config module didn't break server startup
# ---------------------------------------------------------------------------
class TestApiHealth:
    def test_api_health(self):
        r = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200
        assert r.json().get("status") == "healthy"


# ---------------------------------------------------------------------------
# 3. Organizations
# ---------------------------------------------------------------------------
class TestOrganizations:
    def test_organizations_health(self):
        r = requests.get(f"{BASE_URL}/api/organizations/health", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        # If config.SUPABASE_URL is empty we'd get 'Name or service not known'
        assert data.get("status") in ("healthy", "pending"), f"Unhealthy: {data}"

    def test_get_my_organizations(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/organizations/me",
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text}"

        # DNS error should NOT be present
        body_lower = r.text.lower()
        assert "name or service not known" not in body_lower, r.text
        assert "errno -2" not in body_lower, r.text

        data = r.json()
        assert data.get("success") is True
        orgs = data.get("organizations", [])
        assert len(orgs) >= 1, f"No orgs returned: {data}"

        names = [o.get("name") for o in orgs]
        assert "Two Fungis Finishing" in names, f"'Two Fungis Finishing' missing in {names}"

        # primary_organization_id is set
        assert data.get("primary_organization_id"), "primary_organization_id is falsy"


# ---------------------------------------------------------------------------
# 4. Command Center
# ---------------------------------------------------------------------------
class TestCommandCenter:
    def test_dashboard_returns_200(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/command-center/dashboard",
            headers=auth_headers,
            timeout=25,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text}"
        data = r.json()
        assert data.get("success") is True

        # organization_name populated
        org_name = data.get("organization_name") or ""
        assert "Two Fungis" in org_name, f"organization_name unexpected: {org_name!r}"

        # Key structure
        for k in ["today_focus", "projects", "opportunities", "recent_activity",
                  "brain_insights", "quick_stats", "generated_at"]:
            assert k in data, f"Missing key {k} in dashboard response"


# ---------------------------------------------------------------------------
# 5. Production Library
# ---------------------------------------------------------------------------
class TestProductionLibrary:
    def test_seed_status_is_seeded(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/production-library/seed/status",
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert data.get("is_seeded") is True, f"Not seeded: {data}"
        counts = data.get("counts", {})
        assert counts.get("production_items", 0) >= 8, f"Expected >=8 items, got {counts}"

    def test_items_returns_seeded_codes(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/production-library/items?per_page=100",
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        items = data.get("items", [])
        assert len(items) >= 8, f"Expected >=8 items, got {len(items)}"
        codes = {i.get("production_code") for i in items}
        missing = EXPECTED_ITEM_CODES - codes
        assert not missing, f"Missing expected codes: {missing}. Got: {codes}"


# ---------------------------------------------------------------------------
# 6. Opportunities
# ---------------------------------------------------------------------------
class TestOpportunities:
    def test_opportunities_health(self):
        r = requests.get(f"{BASE_URL}/api/opportunities/health", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        # Should be healthy since Supabase should be reachable
        assert data.get("status") in ("healthy", "pending", "degraded"), data
        # Verify DNS resolution worked (config.SUPABASE_URL is populated)
        err = str(data.get("error", "")).lower()
        assert "name or service not known" not in err, data
        assert "errno -2" not in err, data

    def test_list_opportunities_returns_200(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/opportunities",
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text}"
        body_lower = r.text.lower()
        assert "name or service not known" not in body_lower, r.text
        data = r.json()
        # Contract: should include opportunities list
        assert "opportunities" in data, f"Missing 'opportunities' key: {data}"
        assert isinstance(data["opportunities"], list)
