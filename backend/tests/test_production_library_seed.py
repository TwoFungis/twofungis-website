"""
Production Library Seed Verification Tests
Bug fix retest: verify that after main agent's fix, the Production Library shows:
- 19 knowledge domains
- 11 service categories
- 8 production items (DW-001..TP-002)
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://profit-tracker-demo-1.preview.emergentagent.com').rstrip('/')
SUPABASE_URL = "https://oiocmchdtllqpszciuxh.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pb2NtY2hkdGxscXBzemNpdXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzk2MzIsImV4cCI6MjA5NzkxNTYzMn0.Dy6bqBFaOD7FIR4E8ny_p120VmvzpUk38WFojGv-jAE"
EMAIL = "inbox@twofungis.ca"
PASSWORD = "TradeOS2024!"

EXPECTED_ITEM_CODES = {"DW-001", "DW-002", "DW-003", "PT-001", "PT-002", "PT-003", "TP-001", "TP-002"}


@pytest.fixture(scope="module")
def auth_token():
    """Login via Supabase to obtain JWT."""
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": EMAIL, "password": PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token")
    assert tok, "No access_token returned"
    return tok


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


class TestSeedStatus:
    def test_seed_status_endpoint(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/seed/status", headers=auth_headers, timeout=15)
        assert r.status_code == 200, f"Seed status failed: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("success") is True
        assert data.get("is_seeded") is True, f"is_seeded should be True. Data: {data}"
        counts = data.get("counts", {})
        assert counts.get("knowledge_domains", 0) >= 19, f"Expected >=19 domains, got {counts.get('knowledge_domains')}"
        assert counts.get("service_categories", 0) >= 11, f"Expected >=11 categories, got {counts.get('service_categories')}"
        assert counts.get("production_items", 0) >= 8, f"Expected >=8 items, got {counts.get('production_items')}"


class TestDomains:
    def test_get_domains(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/domains", headers=auth_headers, timeout=15)
        assert r.status_code == 200, f"Domains fetch failed: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("success") is True
        assert data.get("count", 0) >= 19, f"Expected >=19 domains, got {data.get('count')}"
        assert len(data.get("domains", [])) >= 19


class TestServiceCategories:
    def test_get_service_categories(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/service-categories", headers=auth_headers, timeout=15)
        assert r.status_code == 200, f"Categories fetch failed: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("success") is True
        assert data.get("count", 0) >= 11, f"Expected >=11 categories, got {data.get('count')}"


class TestProductionItems:
    def test_get_items(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/items?per_page=100", headers=auth_headers, timeout=20)
        assert r.status_code == 200, f"Items fetch failed: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("success") is True
        items = data.get("items", [])
        assert len(items) >= 8, f"Expected >=8 items, got {len(items)}"
        codes = {i.get("production_code") for i in items}
        missing = EXPECTED_ITEM_CODES - codes
        assert not missing, f"Missing expected codes: {missing}. Got codes: {codes}"

    def test_items_have_required_fields(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/items?per_page=100", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        items = r.json().get("items", [])
        seeded = [i for i in items if i.get("production_code") in EXPECTED_ITEM_CODES]
        assert len(seeded) >= 8
        for it in seeded:
            assert it.get("production_name"), f"Missing name for {it.get('production_code')}"
            assert it.get("knowledge_domain_id"), f"Missing domain for {it.get('production_code')}"
            # rates present (any of the three)
            has_rate = any(it.get(k) is not None for k in ("standard_rate", "premium_rate", "complex_rate"))
            assert has_rate, f"No rates set for {it.get('production_code')}"


class TestUnauthenticated:
    def test_seed_status_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/production-library/seed/status", timeout=10)
        assert r.status_code in (401, 422), f"Expected 401/422 got {r.status_code}"
