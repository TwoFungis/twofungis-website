"""
End-to-end tests for the Production Library Import Wizard workflow.

Covers the review-request features:
1. GET  /api/production-library/seed/status  → correct counts, is_seeded flag
2. GET  /api/production-library/import/template/download  → 13 columns
3. POST /api/production-library/import/validate  → validation report
4. POST /api/production-library/import/commit  → items created and visible via GET /items
5. Full workflow: seed_status → template → validate → commit → GET items (verify persistence)
"""

import io
import os
import time
import pytest
import requests

# -------------------------------------------------
# BASE URL & AUTH
# -------------------------------------------------
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    try:
        with open('/app/frontend/.env') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                    break
    except Exception:
        pass

SUPABASE_URL = ""
SUPABASE_ANON = ""
try:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_SUPABASE_URL='):
                SUPABASE_URL = line.split('=', 1)[1].strip().rstrip('/')
            elif line.startswith('REACT_APP_SUPABASE_ANON_KEY='):
                SUPABASE_ANON = line.split('=', 1)[1].strip()
except Exception:
    pass

TEST_EMAIL = "inbox@twofungis.ca"
TEST_PASSWORD = "TradeOS2024!"


@pytest.fixture(scope="module")
def auth_token():
    if not SUPABASE_ANON or not SUPABASE_URL:
        pytest.skip("Supabase creds missing")
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON, "Content-Type": "application/json"},
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=20,
    )
    if r.status_code != 200:
        pytest.skip(f"Login failed: {r.status_code} {r.text[:200]}")
    return r.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


# -------------------------------------------------
# 1. SEED STATUS
# -------------------------------------------------
class TestSeedStatus:
    def test_seed_status_returns_counts(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/seed/status",
                         headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert "is_seeded" in data
        counts = data["counts"]
        assert isinstance(counts["knowledge_domains"], int)
        assert isinstance(counts["service_categories"], int)
        assert isinstance(counts["production_items"], int)
        # Library should already be seeded for this org
        assert data["is_seeded"] is True
        assert counts["knowledge_domains"] >= 1
        assert counts["service_categories"] >= 1


# -------------------------------------------------
# 2. TEMPLATE DOWNLOAD
# -------------------------------------------------
EXPECTED_TEMPLATE_COLUMNS = [
    "Production Code", "Production Name", "Knowledge Domain",
    "Service Categories", "Measurement Unit", "Production Per Day",
    "Crew Size", "Labour Hours", "Standard Rate", "Premium Rate",
    "Complex Rate", "Company Standard", "Notes",
]


class TestTemplateDownload:
    def test_template_returns_13_columns(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/import/template/download",
                         headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        tmpl = data["template"]
        assert tmpl["columns"] == EXPECTED_TEMPLATE_COLUMNS, tmpl["columns"]
        assert len(tmpl["columns"]) == 13
        # Valid units enumeration
        assert set(tmpl["valid_measurement_units"]) == {
            "EA", "LF", "SF", "LS", "DAY", "HR", "SET", "KIT", "PAIR", "COST"
        }
        # CSV content must start with the header line
        assert tmpl["csv_content"].startswith(",".join(EXPECTED_TEMPLATE_COLUMNS))
        # Example rows for guidance
        assert len(tmpl["example_rows"]) >= 3


# -------------------------------------------------
# 3. IMPORT VALIDATE
# -------------------------------------------------
def _make_csv(rows):
    """Build a CSV string with the TradeOS header and given rows."""
    header = ",".join(EXPECTED_TEMPLATE_COLUMNS)
    body = []
    for r in rows:
        body.append(",".join(f'"{r.get(c, "")}"' for c in EXPECTED_TEMPLATE_COLUMNS))
    return ("\n".join([header] + body)).encode("utf-8")


class TestImportValidate:
    def test_validate_valid_row(self, auth_headers):
        ts = int(time.time())
        row = {
            "Production Code": f"TEST-IMP-{ts}-A",
            "Production Name": "Playwright Test Import Row A",
            "Knowledge Domain": "Finish Carpentry",
            "Service Categories": "Residential",
            "Measurement Unit": "LF",
            "Production Per Day": "120",
            "Crew Size": "1",
            "Labour Hours": "0.0667",
            "Standard Rate": "8.50",
            "Premium Rate": "10.50",
            "Complex Rate": "12.50",
            "Company Standard": "true",
            "Notes": "e2e import wizard test",
        }
        csv_bytes = _make_csv([row])
        files = {"file": ("valid.csv", io.BytesIO(csv_bytes), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/production-library/import/validate",
                          headers=auth_headers, files=files, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        if data.get("success") is False and data.get("error") == "library_not_initialized":
            pytest.skip("Library not initialized")
        assert data["success"] is True
        assert data["validation_passed"] is True
        assert data["can_import"] is True
        results = data["results"]
        assert results["total_rows"] == 1
        assert results["valid_rows"] == 1
        assert results["error_rows"] == 0
        assert len(results["preview"]) == 1
        assert results["preview"][0]["production_code"] == row["Production Code"]

    def test_validate_bad_domain_and_unit(self, auth_headers):
        row = {
            "Production Code": "TEST-BAD-1",
            "Production Name": "Bad Row",
            "Knowledge Domain": "NonExistentDomain123",
            "Service Categories": "",
            "Measurement Unit": "ZZZ",
            "Production Per Day": "",
            "Crew Size": "",
            "Labour Hours": "",
            "Standard Rate": "",
            "Premium Rate": "",
            "Complex Rate": "",
            "Company Standard": "",
            "Notes": "",
        }
        csv_bytes = _make_csv([row])
        files = {"file": ("bad.csv", io.BytesIO(csv_bytes), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/production-library/import/validate",
                          headers=auth_headers, files=files, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        if data.get("success") is False and data.get("error") == "library_not_initialized":
            pytest.skip("Library not initialized")
        results = data["results"]
        assert results["error_rows"] == 1
        columns_with_errors = {e["column"] for e in results["errors"]}
        assert "Knowledge Domain" in columns_with_errors
        assert "Measurement Unit" in columns_with_errors
        # each error entry has structured fields
        for e in results["errors"]:
            assert "row" in e and "column" in e and "issue" in e and "recommended_fix" in e


# -------------------------------------------------
# 4. FULL WORKFLOW: validate → commit → verify via GET /items
# -------------------------------------------------
class TestImportCommitWorkflow:
    def test_full_import_workflow(self, auth_headers):
        ts = int(time.time())
        code_a = f"TEST-WF-{ts}-A"
        code_b = f"TEST-WF-{ts}-B"

        rows = [
            {
                "Production Code": code_a,
                "Production Name": "Workflow Test Item A",
                "Knowledge Domain": "Finish Carpentry",
                "Service Categories": "Residential",
                "Measurement Unit": "LF",
                "Production Per Day": "100",
                "Crew Size": "1",
                "Labour Hours": "0.08",
                "Standard Rate": "9.99",
                "Premium Rate": "11.99",
                "Complex Rate": "13.99",
                "Company Standard": "true",
                "Notes": "E2E workflow row A",
            },
            {
                "Production Code": code_b,
                "Production Name": "Workflow Test Item B",
                "Knowledge Domain": "Finish Carpentry",
                "Service Categories": "Residential",
                "Measurement Unit": "EA",
                "Production Per Day": "8",
                "Crew Size": "1",
                "Labour Hours": "1.0",
                "Standard Rate": "175.00",
                "Premium Rate": "225.00",
                "Complex Rate": "295.00",
                "Company Standard": "false",
                "Notes": "E2E workflow row B",
            },
        ]

        csv_bytes = _make_csv(rows)

        # --- Step A: validate ---
        vfiles = {"file": ("wf.csv", io.BytesIO(csv_bytes), "text/csv")}
        v = requests.post(f"{BASE_URL}/api/production-library/import/validate",
                          headers=auth_headers, files=vfiles, timeout=60)
        assert v.status_code == 200, v.text
        vdata = v.json()
        if vdata.get("success") is False and vdata.get("error") == "library_not_initialized":
            pytest.skip("Library not initialized")
        assert vdata["validation_passed"] is True, vdata["results"]["errors"]
        assert vdata["results"]["valid_rows"] == 2

        # --- Step B: commit ---
        cfiles = {"file": ("wf.csv", io.BytesIO(csv_bytes), "text/csv")}
        c = requests.post(f"{BASE_URL}/api/production-library/import/commit",
                          headers=auth_headers, files=cfiles, timeout=120)
        assert c.status_code == 200, c.text
        cdata = c.json()
        assert cdata.get("success") is True, cdata
        results = cdata.get("results") or {}
        # created should be >= 2 (may be 0 if already exists on rerun; then skipped >= 2)
        created = results.get("created", 0)
        skipped = results.get("skipped", 0)
        assert (created + skipped) >= 2, results

        # --- Step C: verify via GET /items (paginated search by code) ---
        # search filter uses ilike wildcard on production_code
        # Poll briefly in case of write-latency.
        found_a = False
        found_b = False
        for _ in range(3):
            g = requests.get(
                f"{BASE_URL}/api/production-library/items?per_page=100&search=TEST-WF-{ts}",
                headers=auth_headers, timeout=30,
            )
            assert g.status_code == 200, g.text
            gdata = g.json()
            codes = {i["production_code"] for i in gdata.get("items", [])}
            found_a = code_a in codes
            found_b = code_b in codes
            if found_a and found_b:
                break
            time.sleep(1)

        # At least one of the codes should be there if commit created anything
        if created > 0:
            assert found_a or found_b, (
                f"Neither imported code visible after commit. "
                f"codes seen: {codes}"
            )

    def test_commit_requires_auth(self):
        csv_bytes = b"Production Code\nX"
        files = {"file": ("x.csv", io.BytesIO(csv_bytes), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/production-library/import/commit",
                          files=files, timeout=30)
        assert r.status_code in (401, 422, 403)
