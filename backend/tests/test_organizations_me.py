"""
Backend regression tests for GET /api/organizations/me
Fix under test: load_dotenv moved to top of server.py to ensure SUPABASE_URL is
available when route modules are imported. Also fixes organization_members join.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://profit-tracker-demo-1.preview.emergentagent.com").rstrip("/")
SUPABASE_URL = os.environ.get("REACT_APP_SUPABASE_URL", "https://oiocmchdtllqpszciuxh.supabase.co").rstrip("/")
SUPABASE_ANON_KEY = os.environ.get(
    "REACT_APP_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pb2NtY2hkdGxscXBzemNpdXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzk2MzIsImV4cCI6MjA5NzkxNTYzMn0.Dy6bqBFaOD7FIR4E8ny_p120VmvzpUk38WFojGv-jAE",
)

TEST_EMAIL = "inbox@twofungis.ca"
TEST_PASSWORD = "TradeOS2024!"


# -----------------------------------------------------------------------------
# Fixtures
# -----------------------------------------------------------------------------
@pytest.fixture(scope="module")
def auth_token():
    """Login via Supabase and return access_token JWT."""
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    r = requests.post(url, headers=headers, json=payload, timeout=15)
    assert r.status_code == 200, f"Supabase login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token")
    assert token, f"No access_token in response: {data}"
    return token


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


# -----------------------------------------------------------------------------
# Basic API health (sanity)
# -----------------------------------------------------------------------------
def test_backend_health():
    r = requests.get(f"{BASE_URL}/api/health", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "healthy"


def test_organizations_service_health():
    """The organizations router itself should be reachable and connected to Supabase."""
    r = requests.get(f"{BASE_URL}/api/organizations/health", timeout=15)
    assert r.status_code == 200, f"Unexpected status: {r.status_code} {r.text}"
    data = r.json()
    # If SUPABASE_URL failed to load we'd get 'error: [Errno -2] Name or service not known'
    assert data.get("status") in ("healthy", "pending"), f"Unhealthy service: {data}"
    assert data.get("service") == "organizations"


# -----------------------------------------------------------------------------
# The actual bug-fix regression: /api/organizations/me
# -----------------------------------------------------------------------------
def test_login_returns_valid_token(auth_token):
    """Verifies the login flow returns a non-empty JWT string."""
    assert isinstance(auth_token, str)
    assert len(auth_token) > 20
    # JWT: three base64 segments
    assert auth_token.count(".") == 2


def test_organizations_me_returns_200(auth_headers):
    """GET /api/organizations/me should return HTTP 200 (not a 500 DNS error)."""
    r = requests.get(f"{BASE_URL}/api/organizations/me", headers=auth_headers, timeout=20)
    assert r.status_code == 200, f"Expected 200 got {r.status_code}: {r.text}"
    # Also ensure the historical DNS error is NOT in the body
    body_lower = r.text.lower()
    assert "name or service not known" not in body_lower, f"DNS error still present: {r.text}"
    assert "errno -2" not in body_lower, f"DNS error still present: {r.text}"


def test_organizations_me_payload_shape(auth_headers):
    """Response must include organizations, primary_organization_id, is_platform_admin."""
    r = requests.get(f"{BASE_URL}/api/organizations/me", headers=auth_headers, timeout=20)
    assert r.status_code == 200
    data = r.json()

    # Required top-level keys
    assert "organizations" in data, f"Missing 'organizations': {data}"
    assert "primary_organization_id" in data, f"Missing 'primary_organization_id': {data}"
    assert "is_platform_admin" in data, f"Missing 'is_platform_admin': {data}"

    # Type sanity
    assert isinstance(data["organizations"], list)
    assert isinstance(data["is_platform_admin"], bool)
    # primary_organization_id can be str or None but for this user must be set
    assert data["primary_organization_id"] is not None, "primary_organization_id should not be null for this user"
    assert isinstance(data["primary_organization_id"], str)


def test_organizations_me_includes_two_fungis(auth_headers):
    """Response should list 'Two Fungis Finishing' as one of the user's orgs."""
    r = requests.get(f"{BASE_URL}/api/organizations/me", headers=auth_headers, timeout=20)
    assert r.status_code == 200
    data = r.json()
    orgs = data.get("organizations", [])
    assert len(orgs) >= 1, f"Expected at least 1 org, got {orgs}"

    names = [o.get("name") for o in orgs]
    assert "Two Fungis Finishing" in names, f"'Two Fungis Finishing' not in {names}"

    # Verify each org shape
    tf_org = next(o for o in orgs if o.get("name") == "Two Fungis Finishing")
    assert "id" in tf_org and isinstance(tf_org["id"], str)
    assert "role" in tf_org
    assert "is_primary" in tf_org

    # primary_organization_id should match Two Fungis (Scott is a primary owner)
    assert data["primary_organization_id"] == tf_org["id"], (
        f"primary_organization_id {data['primary_organization_id']} != Two Fungis id {tf_org['id']}"
    )


def test_organizations_me_without_auth_returns_error():
    """Missing auth header must NOT return 500; should be 401/422."""
    r = requests.get(f"{BASE_URL}/api/organizations/me", timeout=10)
    assert r.status_code in (401, 422, 403), f"Unexpected status {r.status_code}: {r.text}"


def test_organizations_me_bad_token_returns_401():
    r = requests.get(
        f"{BASE_URL}/api/organizations/me",
        headers={"Authorization": "Bearer not-a-real-jwt"},
        timeout=10,
    )
    assert r.status_code == 401, f"Expected 401 got {r.status_code}: {r.text}"
