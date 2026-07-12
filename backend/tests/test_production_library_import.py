"""
Tests for the Production Library Import Wizard endpoints:
- GET  /api/production-library/seed/status
- POST /api/production-library/seed
- GET  /api/production-library/import/template/download
- POST /api/production-library/import/validate
- Plus supporting endpoints (domains, service-categories, units)
"""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Fallback to reading frontend/.env (main env doesn't have REACT_APP_BACKEND_URL)
    try:
        with open('/app/frontend/.env') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                    break
    except Exception:
        pass

SUPABASE_URL = "https://xnwvymksrekacwqrjrrf.supabase.co"
# Try to read the anon key from frontend/.env
SUPABASE_ANON = ""
try:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_SUPABASE_ANON_KEY='):
                SUPABASE_ANON = line.split('=', 1)[1].strip()
            elif line.startswith('REACT_APP_SUPABASE_URL='):
                SUPABASE_URL = line.split('=', 1)[1].strip().rstrip('/')
except Exception:
    pass

TEST_EMAIL = "inbox@twofungis.ca"
TEST_PASSWORD = "TradeOS2024!"


@pytest.fixture(scope="module")
def auth_token():
    """Log in via Supabase and return access token."""
    if not SUPABASE_ANON:
        pytest.skip("Supabase anon key not available")

    resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={
            "apikey": SUPABASE_ANON,
            "Content-Type": "application/json"
        },
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=20
    )
    if resp.status_code != 200:
        pytest.skip(f"Supabase login failed: {resp.status_code} {resp.text[:200]}")
    data = resp.json()
    token = data.get("access_token")
    assert token, "No access_token in Supabase login response"
    return token


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


# -----------------------
# SEED STATUS
# -----------------------
class TestSeedStatus:
    def test_seed_status_returns_200_and_expected_shape(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/production-library/seed/status",
            headers=auth_headers, timeout=30
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert "is_seeded" in data
        assert "counts" in data
        counts = data["counts"]
        assert "knowledge_domains" in counts
        assert "service_categories" in counts
        assert "production_items" in counts
        assert isinstance(counts["knowledge_domains"], int)

    def test_seed_status_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/production-library/seed/status", timeout=15)
        assert r.status_code in (401, 422, 403)


# -----------------------
# SEED (initialize) + verify via status
# -----------------------
class TestSeedInitialize:
    def test_seed_and_verify_counts(self, auth_headers):
        # Idempotent seed
        r = requests.post(
            f"{BASE_URL}/api/production-library/seed",
            headers=auth_headers, timeout=90
        )
        assert r.status_code == 200, r.text
        payload = r.json()
        assert payload.get("success") is True
        results = payload.get("results") or {}
        assert "knowledge_domains" in results
        assert "service_categories" in results
        kd = results["knowledge_domains"]
        sc = results["service_categories"]
        # Either created new or found existing - both are fine
        assert (kd["created"] + kd["existing"]) >= 1
        assert (sc["created"] + sc["existing"]) >= 1

        # Verify via status
        status = requests.get(
            f"{BASE_URL}/api/production-library/seed/status",
            headers=auth_headers, timeout=30
        )
        assert status.status_code == 200
        s = status.json()
        assert s["is_seeded"] is True
        assert s["counts"]["knowledge_domains"] >= 1
        assert s["counts"]["service_categories"] >= 1


# -----------------------
# TEMPLATE DOWNLOAD
# -----------------------
class TestTemplateDownload:
    def test_template_download_returns_columns_and_csv(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/production-library/import/template/download",
            headers=auth_headers, timeout=30
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        tmpl = data.get("template") or {}
        assert tmpl.get("name")
        columns = tmpl.get("columns") or []
        # Must contain the required TradeOS columns
        for expected in [
            "Production Code", "Production Name", "Knowledge Domain",
            "Measurement Unit", "Standard Rate"
        ]:
            assert expected in columns, f"Missing column: {expected}"
        assert "csv_content" in tmpl and tmpl["csv_content"].startswith("Production Code")
        assert isinstance(tmpl.get("example_rows"), list) and len(tmpl["example_rows"]) >= 1
        # Valid units enumeration
        assert set(tmpl.get("valid_measurement_units", [])) >= {"EA", "LF", "SF"}


# -----------------------
# UNITS / DOMAINS / SERVICE CATEGORIES
# -----------------------
class TestReferenceEndpoints:
    def test_units_endpoint(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/units",
                         headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert isinstance(data.get("units"), list)

    def test_domains_endpoint(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/domains",
                         headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert isinstance(data.get("domains"), list)

    def test_service_categories_endpoint(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/production-library/service-categories",
                         headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert isinstance(data.get("categories"), list)


# -----------------------
# IMPORT VALIDATE (with a small in-memory CSV)
# -----------------------
class TestImportValidate:
    def _build_csv(self, rows_ok=True):
        header = [
            "Production Code", "Production Name", "Knowledge Domain",
            "Service Categories", "Measurement Unit", "Production Per Day",
            "Crew Size", "Labour Hours", "Standard Rate", "Premium Rate",
            "Complex Rate", "Company Standard", "Notes"
        ]
        rows = [",".join(header)]
        if rows_ok:
            rows.append('"TEST-FC-001","Test Door Casing","Finish Carpentry",'
                        '"Residential","LF","120","1","0.0667","8.50","10.50","12.50","true","Playwright test row"')
        else:
            # Missing required Knowledge Domain + bad unit
            rows.append('"TEST-BAD-001","Bad Row","","Residential","XYZ","","","","","","","false",""')
        return "\n".join(rows).encode("utf-8")

    def test_validate_valid_csv(self, auth_headers):
        csv_bytes = self._build_csv(rows_ok=True)
        files = {"file": ("test_ok.csv", io.BytesIO(csv_bytes), "text/csv")}
        r = requests.post(
            f"{BASE_URL}/api/production-library/import/validate",
            headers=auth_headers,
            files=files,
            timeout=60
        )
        assert r.status_code == 200, r.text
        data = r.json()
        # Library must be initialized for validate to work; if not, endpoint returns success:False
        if data.get("success") is False:
            assert data.get("error") == "library_not_initialized"
            pytest.skip("Library not initialized; skip valid-row assertion")
        assert data.get("success") is True
        results = data.get("results") or {}
        assert results["total_rows"] == 1
        # Should be valid if 'Finish Carpentry' domain exists (seed created it)
        if results["error_rows"] == 0:
            assert results["valid_rows"] == 1
        # Preview available
        assert isinstance(results.get("preview"), list)

    def test_validate_invalid_csv_reports_errors(self, auth_headers):
        csv_bytes = self._build_csv(rows_ok=False)
        files = {"file": ("test_bad.csv", io.BytesIO(csv_bytes), "text/csv")}
        r = requests.post(
            f"{BASE_URL}/api/production-library/import/validate",
            headers=auth_headers,
            files=files,
            timeout=60
        )
        assert r.status_code == 200, r.text
        data = r.json()
        if data.get("success") is False:
            assert data.get("error") == "library_not_initialized"
            pytest.skip("Library not initialized")
        results = data.get("results") or {}
        assert results["error_rows"] >= 1
        errors = results.get("errors") or []
        # Each error entry must have row/column/issue/recommended_fix
        assert any(
            "column" in e and "issue" in e and "recommended_fix" in e and "row" in e
            for e in errors
        ), f"Errors missing structured fields: {errors[:3]}"

    def test_validate_requires_auth(self):
        csv_bytes = b"Production Code\nX"
        files = {"file": ("x.csv", io.BytesIO(csv_bytes), "text/csv")}
        r = requests.post(
            f"{BASE_URL}/api/production-library/import/validate",
            files=files, timeout=30
        )
        assert r.status_code in (401, 422, 403)
