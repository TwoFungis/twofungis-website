"""
Backend tests for the TradeOS workspace context API.
Verifies /api/workspace/context returns proper routing/redirect for
Scott (owner) and validates health + auth guards.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://profit-tracker-demo-1.preview.emergentagent.com').rstrip('/')

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')

# Read from backend .env if not present
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


class TestWorkspaceHealth:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/workspace/health", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "healthy"
        assert data["service"] == "workspace"
        assert data["architecture"] == "organization-based"


class TestWorkspaceContext:
    def test_missing_auth(self):
        r = requests.get(f"{BASE_URL}/api/workspace/context", timeout=10)
        # FastAPI Header(...) required -> 422
        assert r.status_code in (401, 422)

    def test_invalid_token(self):
        r = requests.get(
            f"{BASE_URL}/api/workspace/context",
            headers={"Authorization": "Bearer not-a-real-jwt"},
            timeout=10,
        )
        assert r.status_code == 401

    def test_scott_context_returns_command_center(self, scott_token):
        r = requests.get(
            f"{BASE_URL}/api/workspace/context",
            headers={"Authorization": f"Bearer {scott_token}"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        # Access + redirect
        assert data.get("has_access") is True
        assert data.get("redirect_to") == "/app/command-center", (
            f"Expected redirect to /app/command-center but got {data.get('redirect_to')}. "
            f"message={data.get('message')}"
        )
        # Identity fields
        assert data.get("user_email") == SCOTT_EMAIL
        # Owner
        assert data.get("is_owner") is True
        assert data.get("organization_role") == "owner"

    def test_scott_context_has_organization_name(self, scott_token):
        r = requests.get(
            f"{BASE_URL}/api/workspace/context",
            headers={"Authorization": f"Bearer {scott_token}"},
            timeout=15,
        )
        assert r.status_code == 200
        data = r.json()
        # organization_name should be present if organization_members path
        # was hit; if legacy TFCS fallback was used, has_organization may be False.
        if data.get("has_organization"):
            assert data.get("organization_name"), "organization_name missing"


class TestWorkspacePermissions:
    def test_scott_permissions_owner(self, scott_token):
        r = requests.get(
            f"{BASE_URL}/api/workspace/permissions",
            headers={"Authorization": f"Bearer {scott_token}"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert data.get("is_owner") is True
        perms = data.get("permissions", {})
        # Owner should have all these
        for key in ("financial", "user_management", "settings", "company_brain", "reports"):
            assert perms.get(key) is True, f"Owner missing perm: {key}"

    def test_permissions_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/workspace/permissions", timeout=10)
        assert r.status_code in (401, 422)
