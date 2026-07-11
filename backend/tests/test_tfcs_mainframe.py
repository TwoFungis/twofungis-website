"""
TFCS Mainframe Dashboard Backend Tests
Tests all endpoints used by /app/mainframe page:
- /api/tfcs/health
- /api/tfcs/role/me
- /api/tfcs/notifications
- /api/tfcs/activity
- /api/projects
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://profit-tracker-demo-1.preview.emergentagent.com").rstrip("/")
SUPABASE_URL = os.environ.get("REACT_APP_SUPABASE_URL", "https://oiocmchdtllqpszciuxh.supabase.co")
SUPABASE_ANON_KEY = os.environ.get(
    "REACT_APP_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pb2NtY2hkdGxscXBzemNpdXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzk2MzIsImV4cCI6MjA5NzkxNTYzMn0.Dy6bqBFaOD7FIR4E8ny_p120VmvzpUk38WFojGv-jAE",
)
OWNER_EMAIL = "inbox@twofungis.ca"
OWNER_PASSWORD = "TradeOS2024!"


@pytest.fixture(scope="module")
def owner_token():
    """Login owner via Supabase password grant and return access token."""
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD},
        timeout=30,
    )
    assert r.status_code == 200, f"Supabase login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token")
    assert token, "No access_token in supabase response"
    return token


@pytest.fixture(scope="module")
def auth_headers(owner_token):
    return {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}


# --------- HEALTH ---------
class TestHealth:
    def test_tfcs_health(self):
        r = requests.get(f"{BASE_URL}/api/tfcs/health", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("status") == "healthy"
        assert d.get("service") == "tfcs-mainframe"


# --------- ROLE ---------
class TestRole:
    def test_role_me_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/tfcs/role/me", timeout=15)
        # Missing Authorization header -> FastAPI returns 422
        assert r.status_code in (401, 422)

    def test_role_me_invalid_token(self):
        r = requests.get(
            f"{BASE_URL}/api/tfcs/role/me",
            headers={"Authorization": "Bearer invalid.token.value"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_role_me_owner(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/tfcs/role/me", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d.get("has_role") is True, f"Owner should have a role: {d}"
        assert d.get("role") == "owner"
        assert d.get("user_email") == OWNER_EMAIL or d.get("user_id")


# --------- NOTIFICATIONS ---------
class TestNotifications:
    def test_notifications_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/tfcs/notifications", timeout=15)
        assert r.status_code in (401, 422)

    def test_notifications_owner(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/tfcs/notifications?limit=10",
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("success") is True
        assert "notifications" in d
        assert isinstance(d["notifications"], list)
        assert "unread_count" in d
        assert isinstance(d["unread_count"], int)


# --------- ACTIVITY ---------
class TestActivity:
    def test_activity_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/tfcs/activity", timeout=15)
        assert r.status_code in (401, 422, 403)

    def test_activity_owner(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/tfcs/activity?limit=10",
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("success") is True
        assert "events" in d
        assert isinstance(d["events"], list)


# --------- PROJECTS ---------
class TestProjects:
    def test_projects_list_owner(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/projects", headers=auth_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        # projects endpoint returns {projects: [...]} per MainframePage usage
        assert "projects" in d or isinstance(d, list)
        projects = d.get("projects", d) if isinstance(d, dict) else d
        assert isinstance(projects, list)
        # If any projects exist, ensure they have a status field
        if projects:
            assert "status" in projects[0]


# --------- DIAGNOSTICS (owner-only, sanity) ---------
class TestDiagnostics:
    def test_diagnostics_owner(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/tfcs/diagnostics", headers=auth_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("success") is True
        assert "diagnostics" in d
        rb = d["diagnostics"].get("roles_breakdown", {})
        assert rb.get("owners", 0) >= 1
