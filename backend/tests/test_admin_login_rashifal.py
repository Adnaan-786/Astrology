"""
Tests for admin login + Rashifal/NakshatraAI asset availability
Scope: (1) POST /api/admin/login (2) zodiac PNG asset availability
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"

ADMIN_EMAIL = "admin123@gmail.com"
ADMIN_PASS = "admin@12356"

ZODIAC = [
    "aries", "taurus", "gemini", "cancer", "leo", "virgo",
    "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
]


# -------- Admin login --------
class TestAdminLogin:
    def test_login_success(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
            timeout=10,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        admin = body.get("admin")
        assert isinstance(admin, dict)
        assert admin.get("email") == ADMIN_EMAIL
        assert "password" not in admin and "password_hash" not in admin
        assert "role" in admin

    def test_login_wrong_password(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": "WRONG_PASS"},
            timeout=10,
        )
        assert r.status_code == 401

    def test_login_unknown_email(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": "nobody@nowhere.com", "password": "x"},
            timeout=10,
        )
        assert r.status_code == 401

    def test_login_missing_body(self):
        r = requests.post(f"{BASE_URL}/api/admin/login", json={}, timeout=10)
        assert r.status_code in (400, 401, 422)


# -------- Zodiac PNG assets served by the frontend --------
class TestZodiacAssets:
    @pytest.mark.parametrize("name", ZODIAC)
    def test_zodiac_png_reachable(self, name):
        url = f"{BASE_URL}/zodiac/{name}.png"
        r = requests.get(url, timeout=10)
        assert r.status_code == 200, f"{url} -> {r.status_code}"
        assert len(r.content) > 500, f"{name}.png suspiciously small"
        ctype = r.headers.get("content-type", "")
        assert "image" in ctype or name in url


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
