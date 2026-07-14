"""
Production Library Import System v2.0 - comprehensive tests.

Tests intelligent validation, auto-created lookups, unit alias mapping,
transactional commits, and duplicate handling strategies (skip/update/replace).
"""

import io
import os
import time
import uuid
import pytest
import requests


# --- Env / auth setup ---------------------------------------------------------
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SUPABASE_URL = ""
SUPABASE_ANON = ""
try:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL=') and not BASE_URL:
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
            elif line.startswith('REACT_APP_SUPABASE_URL='):
                SUPABASE_URL = line.split('=', 1)[1].strip().rstrip('/')
            elif line.startswith('REACT_APP_SUPABASE_ANON_KEY='):
                SUPABASE_ANON = line.split('=', 1)[1].strip()
except Exception:
    pass

TEST_EMAIL = "inbox@twofungis.ca"
TEST_PASSWORD = "TradeOS2024!"

# Unique suffix so repeated test runs use fresh production codes / domains
RUN_ID = uuid.uuid4().hex[:8].upper()


@pytest.fixture(scope="module")
def auth_token():
    if not SUPABASE_ANON or not SUPABASE_URL:
        pytest.skip("Supabase env not configured")
    resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON, "Content-Type": "application/json"},
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=20,
    )
    if resp.status_code != 200:
        pytest.skip(f"Login failed: {resp.status_code} {resp.text[:200]}")
    token = resp.json().get("access_token")
    assert token
    return token


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
DEFAULT_HEADER = [
    "Production Code", "Production Name", "Knowledge Domain",
    "Service Categories", "Measurement Unit", "Production Per Day",
    "Crew Size", "Labour Hours", "Standard Rate", "Premium Rate",
    "Complex Rate", "Company Standard", "Notes", "Description",
]


def build_csv(rows):
    lines = [",".join(DEFAULT_HEADER)]
    for r in rows:
        vals = [str(r.get(col, "")) for col in DEFAULT_HEADER]
        lines.append(",".join(f'"{v}"' for v in vals))
    return "\n".join(lines).encode("utf-8")


# -----------------------------------------------------------------------------
# 1) Template download - v2.0 fields
# -----------------------------------------------------------------------------
class TestTemplateDownloadV2:
    def test_template_has_v2_fields(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/production-library/import/template/download",
            headers=auth_headers, timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        tmpl = data["template"]
        assert tmpl.get("version") == "2.0"
        # unit_aliases and import_features are v2.0 additions
        assert "unit_aliases" in tmpl
        assert "import_features" in tmpl
        assert "valid_measurement_units" in tmpl
        feats = tmpl["import_features"]
        assert feats.get("auto_create_domains") is True
        assert feats.get("auto_create_categories") is True
        assert feats.get("unit_alias_mapping") is True
        assert set(feats.get("duplicate_handling", [])) >= {"skip", "update", "replace"}
        # valid units include SF/LF/EA/LS
        assert set(tmpl["valid_measurement_units"]) >= {"EA", "LF", "SF", "LS"}
        # Unit aliases contain SF aliases like SQ / SQFT
        sf_aliases = [a.upper() for a in tmpl["unit_aliases"].get("SF", [])]
        assert any(a in {"SQ", "SQFT", "SQ FT"} for a in sf_aliases)


# -----------------------------------------------------------------------------
# 2) Validate - unit alias mapping (SQ -> SF, SQFT -> SF, LUMP SUM -> LS)
# -----------------------------------------------------------------------------
class TestValidateUnitAliases:
    def test_unit_aliases_are_mapped(self, auth_headers):
        rows = [
            {"Production Code": f"TESTV2-SF1-{RUN_ID}", "Production Name": "Alias SQ row",
             "Knowledge Domain": "Finish Carpentry", "Measurement Unit": "SQ",
             "Standard Rate": "1.0", "Company Standard": "false"},
            {"Production Code": f"TESTV2-SF2-{RUN_ID}", "Production Name": "Alias SQFT row",
             "Knowledge Domain": "Finish Carpentry", "Measurement Unit": "SQFT",
             "Standard Rate": "1.0", "Company Standard": "false"},
            {"Production Code": f"TESTV2-LS1-{RUN_ID}", "Production Name": "Alias LUMP SUM row",
             "Knowledge Domain": "Finish Carpentry", "Measurement Unit": "LUMP SUM",
             "Standard Rate": "500", "Company Standard": "false"},
        ]
        files = {"file": ("aliases.csv", io.BytesIO(build_csv(rows)), "text/csv")}
        r = requests.post(
            f"{BASE_URL}/api/production-library/import/validate",
            headers=auth_headers, files=files, timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True, data
        vg = data.get("validation_groups", {})
        mappings = vg.get("unit_mappings", [])
        assert len(mappings) >= 3, f"Expected 3 unit mappings, got {mappings}"

        # Build (original -> mapped) pairs
        pairs = {m["original_unit"].upper(): m["mapped_to"] for m in mappings}
        assert pairs.get("SQ") == "SF"
        assert pairs.get("SQFT") == "SF"
        assert pairs.get("LUMP SUM") == "LS"

    def test_invalid_unit_reports_critical_error(self, auth_headers):
        rows = [
            {"Production Code": f"TESTV2-BAD-{RUN_ID}", "Production Name": "Bad unit row",
             "Knowledge Domain": "Finish Carpentry", "Measurement Unit": "XYZ123",
             "Standard Rate": "1.0"},
        ]
        files = {"file": ("badunit.csv", io.BytesIO(build_csv(rows)), "text/csv")}
        r = requests.post(
            f"{BASE_URL}/api/production-library/import/validate",
            headers=auth_headers, files=files, timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        vg = data["validation_groups"]
        crit = vg["critical_errors"]
        assert any("Measurement Unit" in (e.get("column") or "") for e in crit)


# -----------------------------------------------------------------------------
# 3) Validate - auto-created lookups (new domain + new categories)
# -----------------------------------------------------------------------------
class TestValidateAutoCreatedLookups:
    def test_new_domain_and_categories_listed_as_pending(self, auth_headers):
        new_domain = f"TestV2 Domain {RUN_ID}"
        new_category = f"TestV2 Cat {RUN_ID}"
        rows = [
            {"Production Code": f"TESTV2-NEW-{RUN_ID}",
             "Production Name": "New domain row",
             "Knowledge Domain": new_domain,
             "Service Categories": f"{new_category},Residential",
             "Measurement Unit": "EA",
             "Standard Rate": "10.0"},
        ]
        files = {"file": ("newlookups.csv", io.BytesIO(build_csv(rows)), "text/csv")}
        r = requests.post(
            f"{BASE_URL}/api/production-library/import/validate",
            headers=auth_headers, files=files, timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        pending = data.get("pending_lookups", {})
        # Backend title-cases canonical names, so compare case-insensitively
        domain_names_lower = [d["name"].lower() for d in pending.get("domains", [])]
        cat_names_lower = [c["name"].lower() for c in pending.get("categories", [])]
        assert new_domain.lower() in domain_names_lower, f"Expected {new_domain} in pending: {domain_names_lower}"
        assert new_category.lower() in cat_names_lower, f"Expected {new_category} in pending: {cat_names_lower}"

        # Also visible in validation_groups.auto_created_lookups
        auto = data["validation_groups"].get("auto_created_lookups", [])
        assert any(
            new_domain.lower() == (a.get("auto_fix_value") or "").lower()
            or new_domain.lower() == (a.get("original_value") or "").lower()
            for a in auto
        )


# -----------------------------------------------------------------------------
# 4) Commit - duplicate strategies (skip / update)
# -----------------------------------------------------------------------------
class TestCommitDuplicateStrategies:
    def test_commit_creates_then_skips_and_updates(self, auth_headers):
        code = f"TESTV2-DUP-{RUN_ID}"

        # First import: creates the item
        rows_v1 = [{
            "Production Code": code,
            "Production Name": "Dup Test v1",
            "Knowledge Domain": "Finish Carpentry",
            "Service Categories": "Residential",
            "Measurement Unit": "EA",
            "Standard Rate": "10.00",
            "Premium Rate": "15.00",
            "Complex Rate": "20.00",
        }]
        files = {"file": ("v1.csv", io.BytesIO(build_csv(rows_v1)), "text/csv")}
        r1 = requests.post(
            f"{BASE_URL}/api/production-library/import/commit?duplicate_strategy=skip",
            headers=auth_headers, files=files, timeout=90,
        )
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        assert d1["success"] is True, d1
        res1 = d1["results"]
        assert res1["imported"] == 1
        assert res1["skipped"] == 0
        # Comprehensive report fields
        for key in ("domains_created", "categories_created", "unit_conversions",
                    "duration_ms", "errors", "warnings"):
            assert key in res1, f"Missing key {key} in results"
        assert isinstance(res1["duration_ms"], int)

        # Second import - same code - strategy=skip
        rows_v2 = [{
            "Production Code": code,
            "Production Name": "Dup Test v2 (should be skipped)",
            "Knowledge Domain": "Finish Carpentry",
            "Measurement Unit": "EA",
            "Standard Rate": "99.99",
        }]
        files2 = {"file": ("v2skip.csv", io.BytesIO(build_csv(rows_v2)), "text/csv")}
        r2 = requests.post(
            f"{BASE_URL}/api/production-library/import/commit?duplicate_strategy=skip",
            headers=auth_headers, files=files2, timeout=90,
        )
        assert r2.status_code == 200, r2.text
        res2 = r2.json()["results"]
        assert res2["skipped"] == 1
        assert res2["imported"] == 0
        assert res2["updated"] == 0

        # Third import - strategy=update should update the item
        rows_v3 = [{
            "Production Code": code,
            "Production Name": "Dup Test v3 UPDATED",
            "Knowledge Domain": "Finish Carpentry",
            "Measurement Unit": "EA",
            "Standard Rate": "77.77",
        }]
        files3 = {"file": ("v3update.csv", io.BytesIO(build_csv(rows_v3)), "text/csv")}
        r3 = requests.post(
            f"{BASE_URL}/api/production-library/import/commit?duplicate_strategy=update",
            headers=auth_headers, files=files3, timeout=90,
        )
        assert r3.status_code == 200, r3.text
        res3 = r3.json()["results"]
        assert res3["updated"] == 1
        assert res3["imported"] == 0
        assert res3["skipped"] == 0


# -----------------------------------------------------------------------------
# 5) Commit - auto-creates missing domains and categories
# -----------------------------------------------------------------------------
class TestCommitAutoCreateLookups:
    def test_commit_creates_missing_domain_and_category(self, auth_headers):
        new_domain = f"TestV2 Auto Domain {RUN_ID}"
        new_cat = f"TestV2 Auto Cat {RUN_ID}"
        rows = [{
            "Production Code": f"TESTV2-AUTO-{RUN_ID}",
            "Production Name": "Auto lookup row",
            "Knowledge Domain": new_domain,
            "Service Categories": new_cat,
            "Measurement Unit": "SF",  # canonical
            "Standard Rate": "5.00",
        }]
        files = {"file": ("autolookups.csv", io.BytesIO(build_csv(rows)), "text/csv")}
        r = requests.post(
            f"{BASE_URL}/api/production-library/import/commit?duplicate_strategy=skip",
            headers=auth_headers, files=files, timeout=120,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True, data
        res = data["results"]
        assert res["domains_created"] >= 1
        assert res["categories_created"] >= 1
        # created_lookups list should include names
        created = data.get("created_lookups", [])
        names_lower = [(c.get("name") or "").lower() for c in created]
        assert new_domain.lower() in names_lower, f"Expected {new_domain} in {names_lower}"
        assert new_cat.lower() in names_lower, f"Expected {new_cat} in {names_lower}"

    def test_commit_unit_conversions_counted(self, auth_headers):
        rows = [{
            "Production Code": f"TESTV2-UC-{RUN_ID}",
            "Production Name": "Unit conv row",
            "Knowledge Domain": "Finish Carpentry",
            "Measurement Unit": "SQFT",  # alias -> SF
            "Standard Rate": "1.00",
        }]
        files = {"file": ("uc.csv", io.BytesIO(build_csv(rows)), "text/csv")}
        r = requests.post(
            f"{BASE_URL}/api/production-library/import/commit?duplicate_strategy=skip",
            headers=auth_headers, files=files, timeout=90,
        )
        assert r.status_code == 200, r.text
        res = r.json()["results"]
        assert res["unit_conversions"] >= 1


# -----------------------------------------------------------------------------
# 6) Commit - invalid duplicate_strategy returns 400
# -----------------------------------------------------------------------------
class TestCommitInvalidStrategy:
    def test_invalid_strategy_returns_400(self, auth_headers):
        rows = [{"Production Code": f"TESTV2-X-{RUN_ID}", "Production Name": "X",
                 "Knowledge Domain": "Finish Carpentry", "Measurement Unit": "EA",
                 "Standard Rate": "1"}]
        files = {"file": ("x.csv", io.BytesIO(build_csv(rows)), "text/csv")}
        r = requests.post(
            f"{BASE_URL}/api/production-library/import/commit?duplicate_strategy=nonsense",
            headers=auth_headers, files=files, timeout=30,
        )
        assert r.status_code == 400, r.text


# -----------------------------------------------------------------------------
# 7) Auth guard on both endpoints
# -----------------------------------------------------------------------------
class TestAuthGuard:
    def test_validate_requires_auth(self):
        files = {"file": ("x.csv", io.BytesIO(b"Production Code\nX"), "text/csv")}
        r = requests.post(
            f"{BASE_URL}/api/production-library/import/validate",
            files=files, timeout=30,
        )
        assert r.status_code in (401, 403, 422)

    def test_commit_requires_auth(self):
        files = {"file": ("x.csv", io.BytesIO(b"Production Code\nX"), "text/csv")}
        r = requests.post(
            f"{BASE_URL}/api/production-library/import/commit",
            files=files, timeout=30,
        )
        assert r.status_code in (401, 403, 422)
