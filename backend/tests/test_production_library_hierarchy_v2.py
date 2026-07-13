"""
Backend regression tests for Production Library v2 Hierarchy + Finish Carpentry seed
(iteration 17 review scope).

Covers:
- Login (Supabase password grant) to obtain JWT
- POST /api/production-library/seed/finish-carpentry (40 items expected)
- POST /api/production-library/seed/v2 (areas, phases, divisions, trade disciplines)
- GET  /api/production-library/hierarchy (all 6 levels + counts)
- GET  /api/production-library/items (>=48 items, incl. Grab Bar Install)
- GET  /api/production-library/items/{id} (full detail with metadata)
- PUT  /api/production-library/items/{id} (update persists via GET)
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
SUPABASE_URL = os.environ.get("SUPABASE_URL") or "https://oiocmchdtllqpszciuxh.supabase.co"
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY") or (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pb2NtY2hkdGxscXBzemNpdXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzk2MzIsImV4cCI6MjA5NzkxNTYzMn0."
    "Dy6bqBFaOD7FIR4E8ny_p120VmvzpUk38WFojGv-jAE"
)
EMAIL = "inbox@twofungis.ca"
PASSWORD = "TradeOS2024!"


@pytest.fixture(scope="module")
def auth_token():
    resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": EMAIL, "password": PASSWORD},
        timeout=15,
    )
    assert resp.status_code == 200, f"Supabase login failed: {resp.status_code} {resp.text[:300]}"
    token = resp.json().get("access_token")
    assert token and token.count(".") == 2, "Bad JWT from Supabase"
    return token


@pytest.fixture(scope="module")
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# --- Seed endpoints ---
class TestSeedEndpoints:
    def test_seed_finish_carpentry(self, headers):
        r = requests.post(
            f"{BASE_URL}/api/production-library/seed/finish-carpentry",
            headers=headers, timeout=90,
        )
        assert r.status_code == 200, f"finish-carpentry seed failed: {r.status_code} {r.text[:400]}"
        body = r.json()
        assert body.get("success") is True
        results = body.get("results", {})
        # 40 in the seed list; may be all created (first run) or all skipped (re-run)
        assert results.get("total_in_seed") == 40
        assert (results.get("items_created", 0) + results.get("items_skipped", 0)) == 40
        assert results.get("errors", []) == [] or len(results.get("errors", [])) == 0

    def test_seed_v2_hierarchy(self, headers):
        r = requests.post(
            f"{BASE_URL}/api/production-library/seed/v2",
            headers=headers, timeout=60,
        )
        assert r.status_code == 200, f"seed/v2 failed: {r.status_code} {r.text[:400]}"
        body = r.json()
        assert body.get("success") is True
        assert "results" in body
        # Just assert structure; counts may be 0 on re-run because seeder is idempotent (only seeds when empty)
        for key in ("divisions_created", "disciplines_created", "areas_created", "phases_created"):
            assert key in body["results"]


# --- Hierarchy + counts ---
class TestHierarchy:
    def test_hierarchy_all_levels_present(self, headers):
        r = requests.get(f"{BASE_URL}/api/production-library/hierarchy", headers=headers, timeout=30)
        assert r.status_code == 200, f"hierarchy failed: {r.status_code} {r.text[:400]}"
        body = r.json()
        assert body.get("success") is True
        h = body["hierarchy"]
        c = body["counts"]

        # All 6 hierarchy buckets must be lists
        for key in ("knowledge_domains", "service_categories", "areas", "phases", "divisions", "trade_disciplines"):
            assert key in h, f"Missing hierarchy key: {key}"
            assert isinstance(h[key], list), f"{key} should be list"

        # Counts must be non-zero for the expected levels (after seed/v2)
        assert c["areas"] >= 6, f"areas count too low: {c['areas']}"
        assert c["phases"] >= 8, f"phases count too low: {c['phases']}"
        assert c["divisions"] >= 12, f"divisions count too low: {c['divisions']}"
        assert c["trade_disciplines"] >= 8, f"trades count too low: {c['trade_disciplines']}"
        assert c["production_items"] >= 40, f"items count too low: {c['production_items']}"

        # Each domain should carry item_count field
        for d in h["knowledge_domains"]:
            assert "item_count" in d


# --- Production items list + detail ---
class TestProductionItems:
    def test_items_list_contains_grab_bar(self, headers):
        # Pull enough items to include FC-BA-001
        r = requests.get(
            f"{BASE_URL}/api/production-library/items?per_page=100",
            headers=headers, timeout=30,
        )
        assert r.status_code == 200, f"items list failed: {r.status_code} {r.text[:400]}"
        body = r.json()
        items = body.get("items", [])
        assert len(items) >= 40, f"Expected >=40 items, got {len(items)}"
        codes = {i.get("production_code") for i in items}
        assert "FC-BA-001" in codes, "Grab Bar Install (FC-BA-001) missing from items list"
        # Should also see the drywall codes from earlier seed if present
        meta = body.get("meta", {})
        assert meta.get("total", 0) >= 40

    def test_item_detail_full_metadata(self, headers):
        # Locate Grab Bar Install
        r = requests.get(
            f"{BASE_URL}/api/production-library/items?per_page=100&search=FC-BA-001",
            headers=headers, timeout=30,
        )
        assert r.status_code == 200
        items = r.json().get("items", [])
        assert items, "FC-BA-001 not found via search"
        item_id = items[0]["id"]

        # Fetch full detail
        r = requests.get(
            f"{BASE_URL}/api/production-library/items/{item_id}",
            headers=headers, timeout=15,
        )
        assert r.status_code == 200, f"item detail failed: {r.status_code} {r.text[:400]}"
        item = r.json().get("item")
        assert item, "No item in detail response"

        # Data assertions - all the metadata the detail page depends on
        assert item["production_code"] == "FC-BA-001"
        assert item["production_name"] == "Grab Bar Install"
        assert item["description"], "description missing"
        assert item["notes"], "notes missing"
        assert item["crew_size"] == 1
        assert float(item["production_per_day"]) == 12
        assert float(item["low_labour_rate"]) == 45.00
        assert float(item["standard_rate"]) == 58.00
        assert float(item["premium_labour_rate"]) == 78.00
        assert item["trade_discipline"] == "Finish Carpentry"
        assert item["cost_code"] == "06-2000"
        assert item["is_company_standard"] is True
        assert "grab-bar" in (item.get("tags") or [])
        assert item.get("knowledge_domains"), "knowledge_domains join missing"
        assert item.get("measurement_units"), "measurement_units join missing"
        assert item["measurement_units"]["code"] == "EA"

    def test_item_update_persists(self, headers):
        # Find an item to update
        r = requests.get(
            f"{BASE_URL}/api/production-library/items?per_page=100&search=FC-BA-003",
            headers=headers, timeout=30,
        )
        items = r.json().get("items", [])
        assert items, "FC-BA-003 not found"
        item_id = items[0]["id"]
        original_notes = items[0].get("notes")

        new_notes = "TEST_UPDATE_v2 — updated by iteration_17 test suite"
        r = requests.put(
            f"{BASE_URL}/api/production-library/items/{item_id}",
            headers=headers,
            json={"notes": new_notes},
            timeout=15,
        )
        assert r.status_code == 200, f"update failed: {r.status_code} {r.text[:400]}"
        assert r.json().get("success") is True

        # Verify GET reflects the change
        r = requests.get(
            f"{BASE_URL}/api/production-library/items/{item_id}",
            headers=headers, timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["item"]["notes"] == new_notes

        # Restore original notes so we're idempotent
        requests.put(
            f"{BASE_URL}/api/production-library/items/{item_id}",
            headers=headers,
            json={"notes": original_notes},
            timeout=15,
        )
