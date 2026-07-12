"""
Backend tests for TradeOS Command Center API.
- /api/command-center/health (public)
- /api/command-center/dashboard (auth required, returns aggregated data)
- /api/command-center/quick-stats (auth required)
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://profit-tracker-demo-1.preview.emergentagent.com').rstrip('/')

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    with open('/app/backend/.env', 'r') as f:
        for line in f:
            if line.startswith('SUPABASE_URL='):
                SUPABASE_URL = line.split('=', 1)[1].strip().strip('"')
            elif line.startswith('SUPABASE_ANON_KEY='):
                SUPABASE_ANON_KEY = line.split('=', 1)[1].strip().strip('"')

SCOTT_EMAIL = "inbox@twofungis.ca"
SCOTT_PASSWORD = "TradeOS2024!"


@pytest.fixture(scope="module")
def scott_token():
    """Get Scott's Supabase access token via password grant."""
    resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": SCOTT_EMAIL, "password": SCOTT_PASSWORD},
        timeout=15,
    )
    assert resp.status_code == 200, f"Supabase login failed: {resp.status_code} {resp.text}"
    token = resp.json().get("access_token")
    assert token, "No access_token returned"
    return token


# ==============================
# Health endpoint
# ==============================
class TestCommandCenterHealth:
    def test_health_returns_healthy(self):
        r = requests.get(f"{BASE_URL}/api/command-center/health", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "healthy"
        assert data["service"] == "command-center"
        assert "version" in data


# ==============================
# Auth guards
# ==============================
class TestCommandCenterAuthGuards:
    def test_dashboard_requires_auth_header(self):
        r = requests.get(f"{BASE_URL}/api/command-center/dashboard", timeout=10)
        # FastAPI Header(...) required -> 422 when header missing
        assert r.status_code in (401, 422)

    def test_dashboard_rejects_invalid_token(self):
        r = requests.get(
            f"{BASE_URL}/api/command-center/dashboard",
            headers={"Authorization": "Bearer not-a-real-jwt"},
            timeout=10,
        )
        assert r.status_code == 401

    def test_quick_stats_rejects_invalid_token(self):
        r = requests.get(
            f"{BASE_URL}/api/command-center/quick-stats",
            headers={"Authorization": "Bearer not-a-real-jwt"},
            timeout=10,
        )
        assert r.status_code == 401


# ==============================
# Aggregated dashboard for Scott
# ==============================
class TestCommandCenterDashboard:
    def test_dashboard_returns_aggregated_data(self, scott_token):
        r = requests.get(
            f"{BASE_URL}/api/command-center/dashboard",
            headers={"Authorization": f"Bearer {scott_token}"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        data = r.json()

        # success flag
        assert data.get("success") is True

        # Top-level keys
        for key in ["today_focus", "projects", "opportunities", "recent_activity",
                    "brain_insights", "quick_stats", "generated_at"]:
            assert key in data, f"missing key: {key}"

        # organization_name should be populated for Scott
        assert data.get("organization_name") is not None
        # Should be Two Fungis Finishing per test_credentials.md
        assert "Two Fungis" in (data.get("organization_name") or ""), (
            f"Expected 'Two Fungis' in organization_name, got: {data.get('organization_name')}"
        )

        # projects shape
        projects = data["projects"]
        for k in ["starting_soon", "in_progress", "deficiencies", "completed", "total"]:
            assert k in projects, f"projects missing key {k}"
            assert isinstance(projects[k], int), f"projects.{k} must be int"

        # opportunities shape
        opps = data["opportunities"]
        for k in ["discovered", "qualifying", "tendering", "submitted",
                  "negotiation", "awarded", "lost", "total_active", "total_value"]:
            assert k in opps, f"opportunities missing key {k}"

        # today_focus is list of dicts with expected fields when populated
        assert isinstance(data["today_focus"], list)
        assert len(data["today_focus"]) <= 3
        for item in data["today_focus"]:
            for k in ["type", "title", "priority", "link"]:
                assert k in item, f"today_focus item missing {k}"

        # recent_activity list
        assert isinstance(data["recent_activity"], list)
        assert len(data["recent_activity"]) <= 10

        # brain_insights shape
        brain = data["brain_insights"]
        assert "has_insights" in brain
        assert "insights" in brain
        assert "recommendations" in brain

        # quick_stats shape
        qs = data["quick_stats"]
        for k in ["active_projects", "active_opportunities", "pipeline_value",
                  "tenders_in_progress", "pending_decisions"]:
            assert k in qs, f"quick_stats missing {k}"

    def test_quick_stats_returns_stats(self, scott_token):
        r = requests.get(
            f"{BASE_URL}/api/command-center/quick-stats",
            headers={"Authorization": f"Bearer {scott_token}"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        for k in ["active_projects", "active_opportunities", "pipeline_value"]:
            assert k in data
