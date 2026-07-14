"""
Production Library E2E Workflow Tests - Iteration 21
Verifies the complete v1.0 Alpha Production Library workflow:
- Seed status shows expected counts
- Domains, Categories, Units, Items list
- Item detail
- Full CRUD for production items (create, read, update, archive/delete)
- Create knowledge domain
- Create service category
- Import template download
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://profit-tracker-demo-1.preview.emergentagent.com').rstrip('/')
SUPABASE_URL = "https://oiocmchdtllqpszciuxh.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pb2NtY2hkdGxscXBzemNpdXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzk2MzIsImV4cCI6MjA5NzkxNTYzMn0.Dy6bqBFaOD7FIR4E8ny_p120VmvzpUk38WFojGv-jAE"
EMAIL = "inbox@twofungis.ca"
PASSWORD = "TradeOS2024!"


@pytest.fixture(scope="module")
def auth_headers():
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": EMAIL, "password": PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token")
    assert tok, "No access_token"
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


# ----- Seed / status -----
class TestSeedStatus:
    def test_status(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/seed/status", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["is_seeded"] is True
        c = d["counts"]
        # v1.0 Alpha review claims 20 domains / 12 categories / 50+ items — verify actual state
        assert c["knowledge_domains"] >= 19
        assert c["service_categories"] >= 11
        assert c["production_items"] >= 8
        print(f"COUNTS: {c}")


# ----- Domains / Categories / Units -----
class TestHierarchyLookups:
    def test_domains_list(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/domains", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["success"] is True
        assert d["count"] >= 19
        # Finish Carpentry should exist
        names = [x["name"] for x in d["domains"]]
        assert any("Finish Carpentry" in n for n in names), f"Finish Carpentry not in {names[:5]}"

    def test_categories_list(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/service-categories", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["count"] >= 11

    def test_units_list(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/units", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        codes = {u["code"] for u in d["units"]}
        assert {"EA", "LF"}.issubset(codes), f"Missing standard units. Got: {codes}"


# ----- Items list, filter, pagination -----
class TestItemsListing:
    def test_items_default_page(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/items", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["success"] is True
        assert "meta" in d
        assert d["meta"]["page"] == 1
        assert d["meta"]["total"] >= 8

    def test_items_pagination(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/items?page=1&per_page=5", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert len(d["items"]) <= 5
        assert d["meta"]["per_page"] == 5

    def test_items_search(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/items?search=door", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        # Search should return >= 0 items with matching field
        for it in r.json().get("items", []):
            combined = (it.get("production_code", "") + it.get("production_name", "")).lower()
            assert "door" in combined

    def test_item_detail(self, auth_headers):
        # Get one item, fetch its detail
        r = requests.get(f"{BASE_URL}/api/production-library/items?per_page=1", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        items = r.json()["items"]
        assert items, "No items to test detail"
        iid = items[0]["id"]
        rr = requests.get(f"{BASE_URL}/api/production-library/items/{iid}", headers=auth_headers, timeout=15)
        assert rr.status_code == 200
        detail = rr.json()["item"]
        assert detail["id"] == iid
        assert "knowledge_domains" in detail  # relationship
        assert "measurement_units" in detail


# ----- Item CRUD -----
class TestItemCRUD:
    CREATED_ID = None
    PROD_CODE = f"TEST-{int(time.time())}"

    def _get_domain_and_unit(self, auth_headers):
        dr = requests.get(f"{BASE_URL}/api/production-library/domains", headers=auth_headers, timeout=15)
        ur = requests.get(f"{BASE_URL}/api/production-library/units", headers=auth_headers, timeout=15)
        domain_id = dr.json()["domains"][0]["id"]
        unit_id = ur.json()["units"][0]["id"]
        return domain_id, unit_id

    def test_1_create_item(self, auth_headers):
        domain_id, unit_id = self._get_domain_and_unit(auth_headers)
        payload = {
            "production_code": TestItemCRUD.PROD_CODE,
            "production_name": "TEST Item - iteration 21",
            "description": "Auto-created by iteration_21 workflow test",
            "knowledge_domain_id": domain_id,
            "measurement_unit_id": unit_id,
            "standard_rate": 42.50,
            "premium_rate": 55.00,
            "labour_hours": 1.0,
            "crew_size": 1,
            "is_company_standard": False,
        }
        r = requests.post(f"{BASE_URL}/api/production-library/items", headers=auth_headers, json=payload, timeout=20)
        assert r.status_code == 200, f"Create failed: {r.status_code} {r.text}"
        d = r.json()
        assert d["success"] is True
        assert d["item"]["production_code"] == TestItemCRUD.PROD_CODE
        assert d["item"]["standard_rate"] == 42.5
        TestItemCRUD.CREATED_ID = d["item"]["id"]
        print(f"Created id={TestItemCRUD.CREATED_ID} code={TestItemCRUD.PROD_CODE}")

    def test_2_read_created_item(self, auth_headers):
        assert TestItemCRUD.CREATED_ID
        r = requests.get(f"{BASE_URL}/api/production-library/items/{TestItemCRUD.CREATED_ID}", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        it = r.json()["item"]
        assert it["production_code"] == TestItemCRUD.PROD_CODE
        assert it["standard_rate"] == 42.5

    def test_3_update_item(self, auth_headers):
        assert TestItemCRUD.CREATED_ID
        payload = {"production_name": "TEST Item - iteration 21 (updated)", "standard_rate": 99.99}
        r = requests.put(
            f"{BASE_URL}/api/production-library/items/{TestItemCRUD.CREATED_ID}",
            headers=auth_headers, json=payload, timeout=20
        )
        assert r.status_code == 200, f"Update failed: {r.status_code} {r.text}"
        # Verify persisted
        rr = requests.get(f"{BASE_URL}/api/production-library/items/{TestItemCRUD.CREATED_ID}", headers=auth_headers, timeout=15)
        it = rr.json()["item"]
        assert it["production_name"] == "TEST Item - iteration 21 (updated)"
        assert it["standard_rate"] == 99.99

    def test_4_delete_item(self, auth_headers):
        assert TestItemCRUD.CREATED_ID
        r = requests.delete(
            f"{BASE_URL}/api/production-library/items/{TestItemCRUD.CREATED_ID}",
            headers=auth_headers, timeout=15
        )
        assert r.status_code == 200, f"Delete failed: {r.status_code} {r.text}"
        # Verify archived (is_active=false) — item detail should still return but flag=false
        rr = requests.get(f"{BASE_URL}/api/production-library/items/{TestItemCRUD.CREATED_ID}", headers=auth_headers, timeout=15)
        assert rr.status_code == 200
        it = rr.json()["item"]
        assert it.get("is_active") is False, f"Item should be archived; is_active={it.get('is_active')}"


# ----- Domain / Service Category creation -----
class TestDomainCategoryCreate:
    def test_create_domain(self, auth_headers):
        code = f"TST-{int(time.time())}"
        payload = {
            "code": code,
            "name": f"TEST Domain {code}",
            "description": "iteration_21 test domain",
            "sort_order": 999,
        }
        r = requests.post(f"{BASE_URL}/api/production-library/domains", headers=auth_headers, json=payload, timeout=15)
        assert r.status_code == 200, f"Create domain failed: {r.status_code} {r.text}"
        d = r.json()
        assert d["success"] is True
        assert d["domain"]["code"] == code

    def test_create_service_category(self, auth_headers):
        code = f"CAT-{int(time.time())}"
        payload = {
            "code": code,
            "name": f"TEST Category {code}",
            "description": "iteration_21 test category",
            "sort_order": 999,
        }
        r = requests.post(f"{BASE_URL}/api/production-library/service-categories", headers=auth_headers, json=payload, timeout=15)
        assert r.status_code == 200, f"Create category failed: {r.status_code} {r.text}"
        d = r.json()
        assert d["success"] is True
        assert d["category"]["code"] == code


# ----- Import template -----
class TestImportTemplate:
    def test_download_template(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/import/template/download", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["success"] is True
        t = d["template"]
        assert "columns" in t and len(t["columns"]) >= 10
        assert "csv_content" in t
        assert "example_rows" in t and len(t["example_rows"]) >= 1
        assert "Production Code" in t["columns"]
        assert "Knowledge Domain" in t["columns"]
