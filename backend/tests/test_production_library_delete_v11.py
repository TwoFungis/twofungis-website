"""
Tests for Production Library permanent delete endpoints (v1.1 release blocker)
- DELETE /api/production-library/domains/{id}/permanent
- DELETE /api/production-library/service-categories/{id}/permanent
"""
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
SUPABASE_URL = os.environ["REACT_APP_SUPABASE_URL"].rstrip("/")
SUPABASE_ANON_KEY = os.environ["REACT_APP_SUPABASE_ANON_KEY"]

EMAIL = "inbox@twofungis.ca"
PASSWORD = "TradeOS2024!"


@pytest.fixture(scope="module")
def auth_headers():
    resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": EMAIL, "password": PASSWORD},
        timeout=15,
    )
    assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text}"
    token = resp.json().get("access_token")
    assert token, "No access_token"
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


class TestPermanentDelete:
    """Verify new permanent delete endpoints exist and work end-to-end (create -> delete -> verify)."""

    def test_domain_permanent_delete_create_and_delete(self, auth_headers):
        # CREATE a temp domain
        create = requests.post(
            f"{BASE_URL}/api/production-library/domains",
            headers=auth_headers,
            json={"name": "TEST_DEL_DOMAIN_V11", "description": "temp", "color": "#888888"},
            timeout=15,
        )
        assert create.status_code in (200, 201), f"Create domain failed: {create.status_code} {create.text}"
        payload = create.json()
        domain = payload.get("domain") or payload
        domain_id = domain.get("id")
        assert domain_id, f"No id in create response: {payload}"

        # DELETE permanently
        dele = requests.delete(
            f"{BASE_URL}/api/production-library/domains/{domain_id}/permanent",
            headers=auth_headers,
            timeout=20,
        )
        assert dele.status_code == 200, f"Permanent delete domain failed: {dele.status_code} {dele.text}"
        assert dele.json().get("success") is True

        # Verify absence from domains list
        listr = requests.get(f"{BASE_URL}/api/production-library/domains", headers=auth_headers, timeout=15)
        assert listr.status_code == 200
        items = listr.json()
        # response can be list or dict wrapping list
        if isinstance(items, dict):
            items = items.get("domains") or items.get("data") or []
        ids = [d.get("id") for d in items]
        assert domain_id not in ids, "Deleted domain still present in list"

    def test_category_permanent_delete(self, auth_headers):
        # Create a temp domain to hold category
        create_dom = requests.post(
            f"{BASE_URL}/api/production-library/domains",
            headers=auth_headers,
            json={"name": "TEST_DEL_CAT_HOLDER_V11", "description": "temp holder", "color": "#888888"},
            timeout=15,
        )
        assert create_dom.status_code in (200, 201)
        payload_d = create_dom.json()
        dom = payload_d.get("domain") or payload_d
        domain_id = dom.get("id")

        # Create a category
        create_cat = requests.post(
            f"{BASE_URL}/api/production-library/service-categories",
            headers=auth_headers,
            json={"name": "TEST_DEL_CAT_V11", "knowledge_domain_id": domain_id, "color": "#888888"},
            timeout=15,
        )
        assert create_cat.status_code in (200, 201), f"Create category failed: {create_cat.status_code} {create_cat.text}"
        payload_c = create_cat.json()
        cat = payload_c.get("category") or payload_c
        cat_id = cat.get("id")
        assert cat_id

        # Permanent delete category
        dele_cat = requests.delete(
            f"{BASE_URL}/api/production-library/service-categories/{cat_id}/permanent",
            headers=auth_headers,
            timeout=20,
        )
        assert dele_cat.status_code == 200, f"Permanent delete category failed: {dele_cat.status_code} {dele_cat.text}"
        assert dele_cat.json().get("success") is True

        # Cleanup: delete the holder domain permanently too
        requests.delete(
            f"{BASE_URL}/api/production-library/domains/{domain_id}/permanent",
            headers=auth_headers,
            timeout=20,
        )

    def test_domain_permanent_delete_nonexistent_returns_200_or_error(self, auth_headers):
        # Delete a fake UUID - depending on implementation, supabase will delete 0 rows and return 204/200
        fake = "00000000-0000-0000-0000-000000000000"
        r = requests.delete(
            f"{BASE_URL}/api/production-library/domains/{fake}/permanent",
            headers=auth_headers,
            timeout=15,
        )
        # Accept both success (0 rows deleted) or 4xx
        assert r.status_code in (200, 404, 400), f"Unexpected code: {r.status_code} {r.text}"


class TestListEndpointsForModal:
    """Ensure domains + units endpoints (used by CreateStandardModal) return data."""

    def test_domains_endpoint(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/domains", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        body = r.json()
        if isinstance(body, dict):
            body = body.get("domains") or body.get("data") or []
        assert isinstance(body, list)
        assert len(body) > 0, "No domains found for CreateStandardModal dropdown"

    def test_units_endpoint(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/units", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        body = r.json()
        if isinstance(body, dict):
            body = body.get("units") or body.get("data") or []
        assert isinstance(body, list)
        assert len(body) > 0, "No units found for CreateStandardModal dropdown"
