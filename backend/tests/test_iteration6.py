"""
Iteration 6 Backend Tests - Admin Credentials Update, Notifications, Theme System
Tests:
- Admin login with NEW credentials (admin123@gmail.com / admin@12356)
- Admin login with OLD credentials should FAIL
- GET /api/notifications returns default notifications
- All existing endpoints still work
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cosmic-kundli-ai.preview.emergentagent.com').rstrip('/')

class TestAdminCredentials:
    """Test admin login with new and old credentials"""
    
    def test_admin_login_new_credentials_success(self):
        """POST /api/admin/login with NEW credentials should succeed"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin123@gmail.com",
            "password": "admin@12356"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "admin" in data, "Response should contain admin object"
        assert data["admin"]["email"] == "admin123@gmail.com"
        print(f"✓ Admin login with NEW credentials succeeded: {data['admin']}")
    
    def test_admin_login_old_credentials_fail(self):
        """POST /api/admin/login with OLD credentials should return 401"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin@astrovedic.com",
            "password": "AstroVedic@Admin2025"
        })
        assert response.status_code == 401, f"Expected 401 for old credentials, got {response.status_code}: {response.text}"
        print("✓ Admin login with OLD credentials correctly rejected (401)")
    
    def test_admin_login_wrong_password(self):
        """POST /api/admin/login with wrong password should return 401"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin123@gmail.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin login with wrong password correctly rejected (401)")


class TestNotificationsEndpoint:
    """Test GET /api/notifications public endpoint"""
    
    def test_get_notifications_returns_array(self):
        """GET /api/notifications should return array of notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✓ GET /api/notifications returned {len(data)} notifications")
    
    def test_notifications_have_required_fields(self):
        """Each notification should have id, title, message, type, is_sent, created_at"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) == 0:
            pytest.skip("No notifications in DB - default fallback should provide some")
        
        required_fields = ["id", "title", "message", "type", "is_sent", "created_at"]
        for notif in data[:3]:  # Check first 3
            for field in required_fields:
                assert field in notif, f"Notification missing field '{field}': {notif}"
        print(f"✓ Notifications have all required fields: {required_fields}")
    
    def test_notifications_default_fallback(self):
        """When DB is empty, should return 2-3 default notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        data = response.json()
        # The endpoint has a fallback that returns 3 default notifications
        assert len(data) >= 2, f"Expected at least 2 notifications (default fallback), got {len(data)}"
        print(f"✓ Notifications endpoint returns {len(data)} items (fallback working)")


class TestExistingEndpoints:
    """Verify all existing endpoints still work"""
    
    def test_root_endpoint(self):
        """GET /api/ should return API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ GET /api/ works: {data.get('message')}")
    
    def test_stats_endpoint(self):
        """GET /api/stats should return stats"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "online_astrologers" in data
        print(f"✓ GET /api/stats works: {data}")
    
    def test_astrologers_endpoint(self):
        """GET /api/astrologers should return list"""
        response = requests.get(f"{BASE_URL}/api/astrologers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/astrologers works: {len(data)} astrologers")
    
    def test_astrologers_featured_endpoint(self):
        """GET /api/astrologers/featured should return list"""
        response = requests.get(f"{BASE_URL}/api/astrologers/featured")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/astrologers/featured works: {len(data)} featured")
    
    def test_products_endpoint(self):
        """GET /api/products should return list"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/products works: {len(data)} products")
    
    def test_horoscopes_today_endpoint(self):
        """GET /api/horoscopes/today should return list"""
        response = requests.get(f"{BASE_URL}/api/horoscopes/today")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/horoscopes/today works: {len(data)} horoscopes")
    
    def test_banners_endpoint(self):
        """GET /api/banners should return list"""
        response = requests.get(f"{BASE_URL}/api/banners")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/banners works: {len(data)} banners")
    
    def test_plans_endpoint(self):
        """GET /api/plans should return list"""
        response = requests.get(f"{BASE_URL}/api/plans")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/plans works: {len(data)} plans")
    
    def test_blog_endpoint(self):
        """GET /api/blog should return list"""
        response = requests.get(f"{BASE_URL}/api/blog")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/blog works: {len(data)} posts")
    
    def test_site_settings_endpoint(self):
        """GET /api/site-settings should return settings"""
        response = requests.get(f"{BASE_URL}/api/site-settings")
        assert response.status_code == 200
        data = response.json()
        assert "siteName" in data or "contactEmail" in data
        print(f"✓ GET /api/site-settings works")
    
    def test_support_tickets_post(self):
        """POST /api/support/tickets with valid data should succeed"""
        response = requests.post(f"{BASE_URL}/api/support/tickets", json={
            "user_id": "TEST_user_iter6",
            "user_name": "Test User Iter6",
            "user_email": "test_iter6@example.com",
            "category": "general",
            "subject": "TEST Iteration 6 Ticket",
            "description": "This is a test ticket from iteration 6 testing"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "ticket_id" in data
        print(f"✓ POST /api/support/tickets works: ticket_id={data['ticket_id']}")
    
    def test_admin_support_endpoint(self):
        """GET /api/admin/support should return tickets"""
        response = requests.get(f"{BASE_URL}/api/admin/support")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/admin/support works: {len(data)} tickets")


class TestAIChatPlanRestriction:
    """Test AI Chat plan restrictions"""
    
    def test_ai_chat_free_plan_rejected(self):
        """POST /api/ai/chat with free plan should return 403"""
        response = requests.post(f"{BASE_URL}/api/ai/chat", json={
            "session_id": "test_session_iter6",
            "message": "Hello",
            "user_plan": "free"
        })
        assert response.status_code == 403, f"Expected 403 for free plan, got {response.status_code}"
        print("✓ AI Chat correctly rejects free plan (403)")
    
    def test_ai_chat_silver_plan_allowed(self):
        """POST /api/ai/chat with silver plan should succeed"""
        response = requests.post(f"{BASE_URL}/api/ai/chat", json={
            "session_id": "test_session_iter6_silver",
            "message": "What is my rashi?",
            "user_plan": "silver"
        }, timeout=60)
        assert response.status_code == 200, f"Expected 200 for silver plan, got {response.status_code}: {response.text}"
        data = response.json()
        assert "response" in data
        print(f"✓ AI Chat works for silver plan: {data['response'][:100]}...")


class TestAIReport:
    """Test AI Report generation"""
    
    def test_ai_report_kundli_basic(self):
        """POST /api/ai/report with kundli-basic should work for new user"""
        response = requests.post(f"{BASE_URL}/api/ai/report", json={
            "reportType": "kundli-basic",
            "birthName": "Test User Iter6",
            "dob": "1990-05-15",
            "tob": "10:30",
            "pob": "Mumbai, India",
            "user_id": f"TEST_user_iter6_{os.urandom(4).hex()}"  # Unique user to avoid "already used" error
        }, timeout=90)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "report" in data
        assert data.get("reportType") == "kundli-basic"
        print(f"✓ AI Report (kundli-basic) works: {len(data['report'])} chars")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
