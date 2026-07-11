"""
TFCS Owner Management Backend Tests (Spec 1.2.1)
Tests owner account management endpoints:
- GET  /api/tfcs/owners         (list all owners)
- GET  /api/tfcs/team           (list team members sorted by hierarchy)
- POST /api/tfcs/owners/create  (create new owner, owner-only)
- Verify BOTH Scott (inbox@twofungis.ca) and Beau (carpenterbeau@hotmail.com)
  can login and have Owner role.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://profit-tracker-demo-1.preview.emergentagent.com",
).rstrip("/")
SUPABASE_URL = "https://oiocmchdtllqpszciuxh.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pb2NtY2hkdGxscXBzemNpdXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzk2MzIsImV4cCI6MjA5NzkxNTYzMn0.Dy6bqBFaOD7FIR4E8ny_p120VmvzpUk38WFojGv-jAE"

SCOTT_EMAIL = "inbox@twofungis.ca"
BEAU_EMAIL = "carpenterbeau@hotmail.com"
OWNER_PASSWORD = "TradeOS2024!"


def _login(email: str, password: str):
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=30,
    )
    assert r.status_code == 200, f"Login failed for {email}: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token")
    assert token, f"No access_token for {email}"
    return token


@pytest.fixture(scope="module")
def scott_token():
    return _login(SCOTT_EMAIL, OWNER_PASSWORD)


@pytest.fixture(scope="module")
def beau_token():
    return _login(BEAU_EMAIL, OWNER_PASSWORD)


@pytest.fixture(scope="module")
def scott_headers(scott_token):
    return {"Authorization": f"Bearer {scott_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def beau_headers(beau_token):
    return {"Authorization": f"Bearer {beau_token}", "Content-Type": "application/json"}


# --------- LOGIN VERIFICATION ---------
class TestLoginBothOwners:
    """Both Scott and Beau should be able to login with TradeOS2024!"""

    def test_scott_login_success(self, scott_token):
        assert scott_token
        assert isinstance(scott_token, str)
        assert len(scott_token) > 20

    def test_beau_login_success(self, beau_token):
        assert beau_token
        assert isinstance(beau_token, str)
        assert len(beau_token) > 20


# --------- ROLE VERIFICATION ---------
class TestOwnerRoles:
    """Both Scott and Beau must have Owner role in TFCS"""

    def test_scott_is_owner(self, scott_headers):
        r = requests.get(f"{BASE_URL}/api/tfcs/role/me", headers=scott_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("has_role") is True
        assert d.get("role") == "owner"
        assert d.get("user_email") == SCOTT_EMAIL

    def test_beau_is_owner(self, beau_headers):
        r = requests.get(f"{BASE_URL}/api/tfcs/role/me", headers=beau_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("has_role") is True, f"Beau should have owner role: {d}"
        assert d.get("role") == "owner", f"Beau role: {d.get('role')}"
        assert d.get("user_email") == BEAU_EMAIL


# --------- GET /api/tfcs/owners ---------
class TestListOwners:
    def test_list_owners_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/tfcs/owners", timeout=15)
        assert r.status_code in (401, 422)

    def test_list_owners_invalid_token(self):
        r = requests.get(
            f"{BASE_URL}/api/tfcs/owners",
            headers={"Authorization": "Bearer invalid.token.here"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_list_owners_as_scott(self, scott_headers):
        r = requests.get(f"{BASE_URL}/api/tfcs/owners", headers=scott_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("success") is True
        assert "owners" in d
        assert isinstance(d["owners"], list)
        assert d.get("count", 0) >= 2, f"Expected at least 2 owners, got: {d}"

        emails = [o.get("email") for o in d["owners"]]
        assert SCOTT_EMAIL in emails, f"Scott not in owners list: {emails}"
        assert BEAU_EMAIL in emails, f"Beau not in owners list: {emails}"

        # Verify each owner card has required fields
        for owner in d["owners"]:
            assert "email" in owner and owner["email"]
            assert "role" in owner and owner["role"] == "owner"
            assert "status" in owner
            assert owner["status"] in ("active", "inactive")
            # last_login can be None if never logged in but key must exist
            assert "last_login" in owner
            assert "user_id" in owner
            assert "name" in owner  # can be None but key must exist

    def test_list_owners_as_beau(self, beau_headers):
        """Beau should also see the same owners panel data"""
        r = requests.get(f"{BASE_URL}/api/tfcs/owners", headers=beau_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("success") is True
        assert d.get("count", 0) >= 2
        emails = [o.get("email") for o in d["owners"]]
        assert SCOTT_EMAIL in emails
        assert BEAU_EMAIL in emails

    def test_list_owners_both_active(self, scott_headers):
        r = requests.get(f"{BASE_URL}/api/tfcs/owners", headers=scott_headers, timeout=20)
        d = r.json()
        for owner in d["owners"]:
            if owner["email"] in (SCOTT_EMAIL, BEAU_EMAIL):
                assert owner["status"] == "active", f"{owner['email']} not active: {owner}"


# --------- GET /api/tfcs/team ---------
class TestListTeam:
    def test_team_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/tfcs/team", timeout=15)
        assert r.status_code in (401, 422)

    def test_team_list_as_scott(self, scott_headers):
        r = requests.get(f"{BASE_URL}/api/tfcs/team", headers=scott_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("success") is True
        assert "team" in d
        assert isinstance(d["team"], list)
        assert d.get("count", 0) >= 2

        # Sorting: owners first, then managers, then employees
        role_order = {"owner": 0, "manager": 1, "employee": 2}
        prev = -1
        for m in d["team"]:
            cur = role_order.get(m.get("role"), 99)
            assert cur >= prev, f"Team not sorted correctly: {d['team']}"
            prev = cur

        # sort_order should not leak in the response
        for m in d["team"]:
            assert "sort_order" not in m


# --------- POST /api/tfcs/owners/create (Idempotency + permission) ---------
class TestCreateOwner:
    def test_create_owner_requires_auth(self):
        r = requests.post(
            f"{BASE_URL}/api/tfcs/owners/create",
            json={
                "email": "should-not-work@example.com",
                "password": "x",
                "full_name": "x",
            },
            timeout=15,
        )
        assert r.status_code in (401, 422)

    def test_create_owner_idempotent_for_beau(self, scott_headers):
        """Re-creating Beau's account should be a no-op (already_existed: True)"""
        r = requests.post(
            f"{BASE_URL}/api/tfcs/owners/create",
            headers=scott_headers,
            json={
                "email": BEAU_EMAIL,
                "password": OWNER_PASSWORD,
                "full_name": "Beau Carpenter",
            },
            timeout=30,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("success") is True
        # Beau was already created before this test run
        assert d.get("already_existed") is True, f"Expected already_existed=True: {d}"
        assert d.get("user_id")
