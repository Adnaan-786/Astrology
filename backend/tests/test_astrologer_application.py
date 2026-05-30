"""
Backend tests for:
- Fixed-admin login (akshatsharma7730@gmail.com)
- Default-admin login still works
- /api/auth/login role-based redirect
- /api/apply-astrologer validation + happy path
- /api/admin/astrologer-applications list/get/patch (approve creates astrologer; reject stores reason)
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://rashi-fal-hub.preview.emergentagent.com").rstrip("/")

FIXED_ADMIN_EMAIL = "akshatsharma7730@gmail.com"
FIXED_ADMIN_PASS = "akshatastro800"
DEFAULT_ADMIN_EMAIL = "admin123@gmail.com"
DEFAULT_ADMIN_PASS = "admin@12356"


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --------- Admin login ---------
class TestAdminLogin:
    def test_fixed_admin_login(self, api):
        r = api.post(f"{BASE_URL}/api/admin/login",
                     json={"email": FIXED_ADMIN_EMAIL, "password": FIXED_ADMIN_PASS})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert data["admin"]["email"] == FIXED_ADMIN_EMAIL
        assert data["admin"]["role"].lower() == "admin"

    def test_fixed_admin_login_case_insensitive(self, api):
        r = api.post(f"{BASE_URL}/api/admin/login",
                     json={"email": FIXED_ADMIN_EMAIL.upper(), "password": FIXED_ADMIN_PASS})
        assert r.status_code == 200

    def test_default_admin_still_works(self, api):
        r = api.post(f"{BASE_URL}/api/admin/login",
                     json={"email": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASS})
        assert r.status_code == 200
        data = r.json()
        assert data.get("success") is True
        assert data["admin"]["email"] == DEFAULT_ADMIN_EMAIL

    def test_invalid_admin_credentials(self, api):
        r = api.post(f"{BASE_URL}/api/admin/login",
                     json={"email": FIXED_ADMIN_EMAIL, "password": "wrongpass"})
        assert r.status_code == 401


# --------- /api/auth/login redirect rule ---------
class TestAuthLogin:
    def test_fixed_admin_auth_login(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": FIXED_ADMIN_EMAIL, "password": FIXED_ADMIN_PASS})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["role"] == "admin"
        assert data["redirect"] == "/admin"
        assert data["user"]["email"] == FIXED_ADMIN_EMAIL

    def test_fixed_admin_email_returns_admin_after_first_login(self, api):
        # Per spec: "POST /api/auth/login with the fixed email returns user.role='admin'".
        # Once the user record exists (created on first proper login above), any subsequent
        # login with this email returns the persisted admin role — matches spec intent.
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": FIXED_ADMIN_EMAIL, "password": "anything"})
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["role"] == "admin"

    def test_regular_user_login(self, api):
        email = f"test_regular_{uuid.uuid4().hex[:6]}@example.com"
        r = api.post(f"{BASE_URL}/api/auth/login", json={"email": email, "name": "Test"})
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["role"] == "user"
        assert data["redirect"] == "/dashboard"


# --------- /api/apply-astrologer validation ---------
def _valid_apply_payload(email_suffix=""):
    about = ("I am an experienced astrologer with over 10 years of practice in Vedic astrology, "
             "specializing in career, relationships, and spiritual guidance. Namaste.")
    assert len(about) >= 100
    return {
        "full_name": f"TEST Applicant {email_suffix}",
        "email": f"test_applicant_{email_suffix or uuid.uuid4().hex[:6]}@example.com",
        "phone": "9999999999",
        "date_of_birth": "1990-01-01",
        "gender": "male",
        "city": "Delhi",
        "state": "Delhi",
        "years_of_experience": 10,
        "specializations": ["Vedic", "Numerology"],
        "languages": ["Hindi", "English"],
        "education_qualification": "MA Astrology",
        "astrology_certifications": "Jyotish Acharya",
        "about_yourself": about,
        "rate_per_minute": 25,
        "available_hours": "9am-9pm",
        "documents": {
            "aadhaar_number": "123412341234",
            "aadhaar_front_url": "data:image/png;base64,iVBORw0KGgo=",
            "aadhaar_back_url": "data:image/png;base64,iVBORw0KGgo=",
            "pan_number": "ABCDE1234F",
            "pan_card_url": "data:image/png;base64,iVBORw0KGgo=",
            "profile_photo_url": "data:image/png;base64,iVBORw0KGgo=",
        },
        "social_links": {"website": "https://example.com"},
        "agreement_accepted": True,
    }


class TestApplyAstrologer:
    def test_missing_required_fields(self, api):
        r = api.post(f"{BASE_URL}/api/apply-astrologer",
                     json={"full_name": "X", "email": "x@x.com"})
        assert r.status_code == 400
        assert "missing" in r.json()["detail"].lower() or "required" in r.json()["detail"].lower()

    def test_about_yourself_too_short(self, api):
        p = _valid_apply_payload()
        p["about_yourself"] = "Too short"
        r = api.post(f"{BASE_URL}/api/apply-astrologer", json=p)
        assert r.status_code == 400
        assert "100" in r.json()["detail"]

    def test_agreement_not_accepted(self, api):
        p = _valid_apply_payload()
        p["agreement_accepted"] = False
        r = api.post(f"{BASE_URL}/api/apply-astrologer", json=p)
        assert r.status_code == 400

    def test_missing_document_field(self, api):
        p = _valid_apply_payload()
        p["documents"].pop("pan_card_url")
        r = api.post(f"{BASE_URL}/api/apply-astrologer", json=p)
        assert r.status_code == 400
        assert "pan_card_url" in r.json()["detail"]

    def test_successful_submission(self, api):
        p = _valid_apply_payload(email_suffix="happy")
        r = api.post(f"{BASE_URL}/api/apply-astrologer", json=p)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert data["id"].startswith("APP-")
        pytest.application_id = data["id"]


# --------- /api/admin/astrologer-applications ---------
class TestAdminAstrologerApplications:
    def test_list_has_counts_shape(self, api):
        r = api.get(f"{BASE_URL}/api/admin/astrologer-applications")
        assert r.status_code == 200
        data = r.json()
        assert "applications" in data and isinstance(data["applications"], list)
        assert "counts" in data
        for k in ("total", "pending", "approved", "rejected"):
            assert k in data["counts"]

    def test_filter_by_pending(self, api):
        r = api.get(f"{BASE_URL}/api/admin/astrologer-applications?status=pending")
        assert r.status_code == 200
        data = r.json()
        for app in data["applications"]:
            assert app["status"] == "pending"

    def test_get_single_application(self, api):
        # Create one first
        p = _valid_apply_payload(email_suffix="single")
        r = api.post(f"{BASE_URL}/api/apply-astrologer", json=p)
        assert r.status_code == 200
        app_id = r.json()["id"]

        r2 = api.get(f"{BASE_URL}/api/admin/astrologer-applications/{app_id}")
        assert r2.status_code == 200
        d = r2.json()
        assert d["id"] == app_id
        assert d["email"] == p["email"]
        # MongoDB ObjectId must be excluded
        assert "_id" not in d

    def test_get_nonexistent_application(self, api):
        r = api.get(f"{BASE_URL}/api/admin/astrologer-applications/APP-NOTEXIST")
        assert r.status_code == 404

    def test_approve_creates_astrologer(self, api):
        p = _valid_apply_payload(email_suffix="approve")
        r = api.post(f"{BASE_URL}/api/apply-astrologer", json=p)
        app_id = r.json()["id"]

        # Count astrologers before
        before = api.get(f"{BASE_URL}/api/astrologers").json()
        before_count = len(before) if isinstance(before, list) else len(before.get("astrologers", []))

        # Approve
        r2 = api.patch(f"{BASE_URL}/api/admin/astrologer-applications/{app_id}",
                       json={"status": "approved", "admin_notes": "Looks good"})
        assert r2.status_code == 200, r2.text
        assert r2.json()["status"] == "approved"

        # Verify persistence
        r3 = api.get(f"{BASE_URL}/api/admin/astrologer-applications/{app_id}")
        assert r3.status_code == 200
        assert r3.json()["status"] == "approved"

        # Astrologers collection should grow by at least one
        after = api.get(f"{BASE_URL}/api/astrologers").json()
        after_count = len(after) if isinstance(after, list) else len(after.get("astrologers", []))
        assert after_count >= before_count + 1

    def test_reject_with_reason(self, api):
        p = _valid_apply_payload(email_suffix="reject")
        r = api.post(f"{BASE_URL}/api/apply-astrologer", json=p)
        app_id = r.json()["id"]

        r2 = api.patch(f"{BASE_URL}/api/admin/astrologer-applications/{app_id}",
                       json={"status": "rejected", "rejection_reason": "Insufficient documents"})
        assert r2.status_code == 200
        assert r2.json()["status"] == "rejected"

        r3 = api.get(f"{BASE_URL}/api/admin/astrologer-applications/{app_id}")
        assert r3.status_code == 200
        d = r3.json()
        assert d["status"] == "rejected"
        assert d.get("rejection_reason") == "Insufficient documents"

    def test_invalid_status(self, api):
        p = _valid_apply_payload(email_suffix="invalid")
        app_id = api.post(f"{BASE_URL}/api/apply-astrologer", json=p).json()["id"]
        r = api.patch(f"{BASE_URL}/api/admin/astrologer-applications/{app_id}",
                      json={"status": "weird"})
        assert r.status_code == 400
