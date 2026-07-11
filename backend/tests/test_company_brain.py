"""
Company Brain Foundation (Spec 1.2) Backend Tests
Tests all endpoints under /api/brain/*
- health / contracts / threads / suggested-actions / action-history / messages / actions/queue
"""
import os
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://profit-tracker-demo-1.preview.emergentagent.com",
).rstrip("/")
SUPABASE_URL = os.environ.get(
    "REACT_APP_SUPABASE_URL", "https://oiocmchdtllqpszciuxh.supabase.co"
)
SUPABASE_ANON_KEY = os.environ.get(
    "REACT_APP_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pb2NtY2hkdGxscXBzemNpdXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzk2MzIsImV4cCI6MjA5NzkxNTYzMn0.Dy6bqBFaOD7FIR4E8ny_p120VmvzpUk38WFojGv-jAE",
)
OWNER_EMAIL = "inbox@twofungis.ca"
OWNER_PASSWORD = "TradeOS2024!"


@pytest.fixture(scope="module")
def owner_token():
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD},
        timeout=30,
    )
    assert r.status_code == 200, f"Supabase login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def auth_headers(owner_token):
    return {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}


# --------- HEALTH ---------
class TestBrainHealth:
    def test_health_unauth_ok(self):
        r = requests.get(f"{BASE_URL}/api/brain/health", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("status") == "healthy"
        assert d.get("service") == "company-brain"
        # Capabilities list should contain expected modules
        caps = d.get("capabilities") or []
        for expected in ["projects", "opportunities", "financial", "expenses", "crm",
                         "production_library", "documents", "reports", "settings"]:
            assert expected in caps, f"Missing capability {expected} in {caps}"
        assert "proactive_categories" in d


# --------- CONTRACTS ---------
class TestBrainContracts:
    def test_contracts_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/brain/contracts", timeout=15)
        assert r.status_code in (401, 422)

    def test_contracts_invalid_token(self):
        r = requests.get(
            f"{BASE_URL}/api/brain/contracts",
            headers={"Authorization": "Bearer invalid.token.value"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_contracts_owner(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/brain/contracts", headers=auth_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "contracts" in d
        assert "action_categories" in d
        assert "context_types" in d
        # Contains expected modules
        for m in ["projects", "financial", "crm", "documents", "settings"]:
            assert m in d["contracts"], f"missing module {m}"
        # Each contract has name, capabilities, required_role
        for name, contract in d["contracts"].items():
            assert "name" in contract
            assert "capabilities" in contract
            assert "required_role" in contract
        # Context types should include 'general'
        assert "general" in d["context_types"]


# --------- THREADS ---------
class TestBrainThreads:
    def test_threads_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/brain/threads", timeout=15)
        assert r.status_code in (401, 422)

    def test_threads_list_owner(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/brain/threads", headers=auth_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "threads" in d
        assert isinstance(d["threads"], list)
        assert "count" in d
        assert isinstance(d["count"], int)

    def test_get_or_create_thread_general(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/brain/threads/general",
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert "thread" in d
        assert "created" in d
        t = d["thread"]
        assert t.get("context_type") == "general"

    def test_get_or_create_thread_project(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/brain/threads/project?context_id=test-proj-001&context_name=Test%20Project",
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["thread"].get("context_type") == "project"

    def test_get_or_create_thread_invalid_context(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/brain/threads/not_a_real_context",
            headers=auth_headers,
            timeout=20,
        )
        # ContextType enum validation should return 422
        assert r.status_code in (400, 422)


# --------- MESSAGES ---------
class TestBrainMessages:
    def test_send_message_requires_auth(self):
        r = requests.post(
            f"{BASE_URL}/api/brain/messages",
            json={"content": "hello", "context_type": "general"},
            timeout=15,
        )
        assert r.status_code in (401, 422)

    def test_send_message_owner(self, auth_headers):
        payload = {
            "content": "TEST_ Hello Company Brain (automated test).",
            "context_type": "general",
            "context_name": "General",
            "page_context": {"path": "/app/mainframe"},
        }
        r = requests.post(
            f"{BASE_URL}/api/brain/messages",
            headers=auth_headers,
            json=payload,
            timeout=30,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("status") == "received"
        assert "brain_response" in d
        assert d["brain_response"].get("role") == "brain"
        assert isinstance(d["brain_response"].get("content"), str)


# --------- SUGGESTED ACTIONS ---------
class TestSuggestedActions:
    def test_suggested_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/brain/suggested-actions", timeout=15)
        assert r.status_code in (401, 422)

    def test_suggested_general(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/brain/suggested-actions",
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert "suggestions" in d
        assert isinstance(d["suggestions"], list)
        # Should be <= 5
        assert len(d["suggestions"]) <= 5
        if d["suggestions"]:
            s = d["suggestions"][0]
            for k in ("id", "title", "description", "module", "action", "priority"):
                assert k in s, f"suggestion missing key {k}"

    def test_suggested_project_context(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/brain/suggested-actions?context_type=project",
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("context_type") == "project"


# --------- ACTION HISTORY ---------
class TestActionHistory:
    def test_history_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/brain/action-history", timeout=15)
        assert r.status_code in (401, 422)

    def test_history_owner(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/brain/action-history", headers=auth_headers, timeout=20
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert "actions" in d
        assert isinstance(d["actions"], list)
        assert "count" in d


# --------- ACTIONS QUEUE (pipeline) ---------
class TestQueueAction:
    def test_queue_requires_auth(self):
        r = requests.post(
            f"{BASE_URL}/api/brain/actions/queue",
            json={"module": "projects", "action": "create"},
            timeout=15,
        )
        assert r.status_code in (401, 422)

    def test_queue_invalid_module(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/brain/actions/queue",
            headers=auth_headers,
            json={"module": "nonexistent_module", "action": "create"},
            timeout=20,
        )
        assert r.status_code == 400

    def test_queue_valid_action_projects(self, auth_headers):
        # projects requires employee role -> owner should be allowed
        r = requests.post(
            f"{BASE_URL}/api/brain/actions/queue",
            headers=auth_headers,
            json={
                "module": "projects",
                "action": "create",
                "parameters": {"name": "TEST_ brain queued project"},
                "requires_permission": True,
            },
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("status") == "queued"
        assert "action" in d
        assert d["action"].get("module") == "projects"
        assert "pipeline" in d
        assert d["pipeline"].get("current_state") in ("pending_permission", "intent")


# --------- BRIEF & PROACTIVE ---------
class TestBriefProactive:
    def test_brief_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/brain/brief", timeout=15)
        assert r.status_code in (401, 422)

    def test_brief_owner(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/brain/brief", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert "brief" in d
        assert "summary" in d["brief"]

    def test_proactive_owner(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/brain/proactive", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert "alerts" in d
        assert "categories" in d
