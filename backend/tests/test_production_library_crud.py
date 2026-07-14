"""
Test suite: TradeOS Alpha Completion Pass - Production Library CRUD lifecycle.

Covers:
- GET /items?limit=500 returns all items (fix for the 50-cap)
- GET /items?include_inactive=true returns both active and archived items
- POST /items/{id}/duplicate creates -COPY suffix
- DELETE /items/{id} soft-archives (is_active=false)
- POST /items/{id}/restore restores archived item
- DELETE /items/{id}/permanent purges when not referenced
- DELETE /items/{id}/permanent 400s when referenced in assemblies/estimates
"""
import os
import uuid
import httpx
import pytest

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
SUPABASE_URL = os.environ["REACT_APP_SUPABASE_URL"].rstrip("/")
SUPABASE_ANON_KEY = os.environ["REACT_APP_SUPABASE_ANON_KEY"]

TEST_EMAIL = "inbox@twofungis.ca"
TEST_PASSWORD = "TradeOS2024!"

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def access_token():
    resp = httpx.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=15,
    )
    assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text}"
    token = resp.json().get("access_token")
    assert token
    return token


@pytest.fixture(scope="session")
def auth_headers(access_token):
    return {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def domain_id(auth_headers):
    """Pick any existing knowledge domain in the org."""
    r = httpx.get(f"{BASE_URL}/api/production-library/domains", headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text
    domains = r.json().get("domains", [])
    assert domains, "No knowledge domains found"
    return domains[0]["id"]


@pytest.fixture(scope="session")
def unit_id(auth_headers):
    r = httpx.get(f"{BASE_URL}/api/production-library/units", headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text
    units = r.json().get("units", [])
    assert units
    ea = next((u for u in units if u["code"] == "EA"), units[0])
    return ea["id"]


def _create_item(auth_headers, domain_id, unit_id, suffix="", extra=None):
    code = f"TEST-CRUD-{uuid.uuid4().hex[:8].upper()}{suffix}"
    body = {
        "production_code": code,
        "production_name": f"Test Item {code}",
        "knowledge_domain_id": domain_id,
        "measurement_unit_id": unit_id,
        "standard_rate": 10.50,
        "crew_size": 1,
    }
    if extra:
        body.update(extra)
    r = httpx.post(f"{BASE_URL}/api/production-library/items", headers=auth_headers, json=body, timeout=20)
    assert r.status_code == 200, f"Create failed: {r.status_code} {r.text}"
    return r.json()["item"]


# ---------------------------------------------------------------------------
# Pagination / limit fix
# ---------------------------------------------------------------------------

class TestPaginationLimit:
    def test_limit_param_returns_more_than_default(self, auth_headers):
        r = httpx.get(
            f"{BASE_URL}/api/production-library/items",
            headers=auth_headers,
            params={"limit": 500},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert "meta" in data
        assert data["meta"]["per_page"] == 500
        # Should return the actual number of items up to the total in DB
        total = data["meta"]["total"]
        assert len(data["items"]) == min(total, 500)
        # We expect > 50 items in the seeded library
        assert total >= 50, f"Expected >=50 items in library, got total={total}"

    def test_default_pagination_still_50(self, auth_headers):
        r = httpx.get(f"{BASE_URL}/api/production-library/items", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["meta"]["per_page"] == 50

    def test_limit_over_1000_rejected(self, auth_headers):
        r = httpx.get(
            f"{BASE_URL}/api/production-library/items",
            headers=auth_headers,
            params={"limit": 5000},
            timeout=15,
        )
        # FastAPI Query(le=1000) → 422
        assert r.status_code == 422


# ---------------------------------------------------------------------------
# include_inactive
# ---------------------------------------------------------------------------

class TestIncludeInactive:
    def test_include_inactive_returns_archived(self, auth_headers, domain_id, unit_id):
        # Create + archive an item
        item = _create_item(auth_headers, domain_id, unit_id, suffix="-ARCH")
        arch_id = item["id"]
        arch_code = item["production_code"]
        d = httpx.delete(
            f"{BASE_URL}/api/production-library/items/{arch_id}",
            headers=auth_headers,
            timeout=15,
        )
        assert d.status_code == 200

        # Default (active only) → should NOT include the archived one
        active = httpx.get(
            f"{BASE_URL}/api/production-library/items",
            headers=auth_headers,
            params={"limit": 1000, "search": arch_code},
            timeout=30,
        ).json()
        assert not any(i["id"] == arch_id for i in active["items"]), (
            "Archived item leaked into active listing"
        )

        # include_inactive=true → should include it
        combined = httpx.get(
            f"{BASE_URL}/api/production-library/items",
            headers=auth_headers,
            params={"limit": 1000, "include_inactive": "true", "search": arch_code},
            timeout=30,
        ).json()
        assert any(i["id"] == arch_id for i in combined["items"]), (
            f"Archived item {arch_code} missing from include_inactive listing"
        )

        # Cleanup: restore then permanently delete
        httpx.post(f"{BASE_URL}/api/production-library/items/{arch_id}/restore", headers=auth_headers, timeout=15)
        httpx.delete(f"{BASE_URL}/api/production-library/items/{arch_id}/permanent", headers=auth_headers, timeout=15)


# ---------------------------------------------------------------------------
# Duplicate
# ---------------------------------------------------------------------------

class TestDuplicate:
    def test_duplicate_creates_copy_with_suffix(self, auth_headers, domain_id, unit_id):
        original = _create_item(auth_headers, domain_id, unit_id, suffix="-ORIG")
        orig_id = original["id"]
        orig_code = original["production_code"]

        r = httpx.post(
            f"{BASE_URL}/api/production-library/items/{orig_id}/duplicate",
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        payload = r.json()
        assert payload["success"] is True
        dup = payload["item"]
        assert dup["production_code"].startswith(f"{orig_code}-COPY"), (
            f"Expected -COPY suffix, got {dup['production_code']}"
        )
        assert dup["production_name"].endswith("(Copy)"), dup["production_name"]
        assert dup["id"] != orig_id
        # Duplicated item should start non-standard
        assert dup.get("is_company_standard") in (False, None)

        # Cleanup
        httpx.delete(f"{BASE_URL}/api/production-library/items/{dup['id']}/permanent", headers=auth_headers, timeout=15)
        httpx.delete(f"{BASE_URL}/api/production-library/items/{orig_id}/permanent", headers=auth_headers, timeout=15)


# ---------------------------------------------------------------------------
# Archive + Restore
# ---------------------------------------------------------------------------

class TestArchiveRestore:
    def test_archive_then_restore(self, auth_headers, domain_id, unit_id):
        item = _create_item(auth_headers, domain_id, unit_id, suffix="-AR")
        iid = item["id"]

        # Archive (DELETE)
        arch = httpx.delete(
            f"{BASE_URL}/api/production-library/items/{iid}",
            headers=auth_headers,
            timeout=15,
        )
        assert arch.status_code == 200, arch.text
        assert arch.json()["success"] is True

        # GET should show inactive
        g1 = httpx.get(f"{BASE_URL}/api/production-library/items/{iid}", headers=auth_headers, timeout=15)
        assert g1.status_code == 200
        assert g1.json()["item"]["is_active"] is False

        # Restore
        rst = httpx.post(
            f"{BASE_URL}/api/production-library/items/{iid}/restore",
            headers=auth_headers,
            timeout=15,
        )
        assert rst.status_code == 200, rst.text
        assert rst.json()["success"] is True

        # GET now active again
        g2 = httpx.get(f"{BASE_URL}/api/production-library/items/{iid}", headers=auth_headers, timeout=15)
        assert g2.status_code == 200
        assert g2.json()["item"]["is_active"] is True

        # Cleanup
        httpx.delete(f"{BASE_URL}/api/production-library/items/{iid}/permanent", headers=auth_headers, timeout=15)


# ---------------------------------------------------------------------------
# Permanent delete
# ---------------------------------------------------------------------------

class TestPermanentDelete:
    def test_permanent_delete_removes_unreferenced_item(self, auth_headers, domain_id, unit_id):
        item = _create_item(auth_headers, domain_id, unit_id, suffix="-PD")
        iid = item["id"]

        d = httpx.delete(
            f"{BASE_URL}/api/production-library/items/{iid}/permanent",
            headers=auth_headers,
            timeout=20,
        )
        assert d.status_code == 200, d.text
        assert d.json()["success"] is True

        # GET should now 404
        g = httpx.get(f"{BASE_URL}/api/production-library/items/{iid}", headers=auth_headers, timeout=15)
        assert g.status_code == 404, f"Item was not deleted; GET returned {g.status_code}"

    def test_permanent_delete_blocked_when_referenced_in_assembly(self, auth_headers, domain_id, unit_id):
        # Create item + assembly + link them
        item = _create_item(auth_headers, domain_id, unit_id, suffix="-REF")
        iid = item["id"]

        assembly_body = {
            "assembly_code": f"TEST-ASM-{uuid.uuid4().hex[:6].upper()}",
            "assembly_name": "Test Assembly for CRUD",
            "knowledge_domain_id": domain_id,
        }
        a = httpx.post(
            f"{BASE_URL}/api/production-library/assemblies",
            headers=auth_headers,
            json=assembly_body,
            timeout=15,
        )
        assert a.status_code == 200, a.text
        assembly = a.json()["assembly"]
        aid = assembly["id"]

        link = httpx.post(
            f"{BASE_URL}/api/production-library/assemblies/{aid}/items",
            headers=auth_headers,
            json={"production_item_id": iid, "quantity": 1},
            timeout=15,
        )
        assert link.status_code == 200, link.text
        link_item_id = link.json()["item"]["id"]

        # Attempt permanent delete → must be blocked with 400
        d = httpx.delete(
            f"{BASE_URL}/api/production-library/items/{iid}/permanent",
            headers=auth_headers,
            timeout=20,
        )
        assert d.status_code == 400, (
            f"Expected 400 when item is used in assembly, got {d.status_code}: {d.text}"
        )
        detail = d.json().get("detail", "")
        assert "assembl" in detail.lower(), f"Unexpected message: {detail}"

        # Cleanup: unlink → delete item → delete assembly
        httpx.delete(
            f"{BASE_URL}/api/production-library/assemblies/{aid}/items/{link_item_id}",
            headers=auth_headers,
            timeout=15,
        )
        httpx.delete(f"{BASE_URL}/api/production-library/items/{iid}/permanent", headers=auth_headers, timeout=15)


# ---------------------------------------------------------------------------
# Auth guard on new endpoints
# ---------------------------------------------------------------------------

class TestAuthGuards:
    def test_restore_requires_auth(self):
        r = httpx.post(
            f"{BASE_URL}/api/production-library/items/00000000-0000-0000-0000-000000000000/restore",
            timeout=10,
        )
        assert r.status_code in (401, 403, 422)

    def test_duplicate_requires_auth(self):
        r = httpx.post(
            f"{BASE_URL}/api/production-library/items/00000000-0000-0000-0000-000000000000/duplicate",
            timeout=10,
        )
        assert r.status_code in (401, 403, 422)

    def test_permanent_delete_requires_auth(self):
        r = httpx.delete(
            f"{BASE_URL}/api/production-library/items/00000000-0000-0000-0000-000000000000/permanent",
            timeout=10,
        )
        assert r.status_code in (401, 403, 422)
