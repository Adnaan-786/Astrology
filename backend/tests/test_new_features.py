"""
Test suite for AstroVedic AI new features:
- AI Chat (plan-based access control)
- AI Reports (12 report types)
- Banner CRUD operations
- Existing public endpoints verification
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAIChatPlanAccess:
    """Test AI Chat plan-based access control"""
    
    def test_ai_chat_free_user_blocked(self):
        """POST /api/ai/chat with user_plan='free' returns HTTP 403 with PLAN_REQUIRED"""
        response = requests.post(f"{BASE_URL}/api/ai/chat", json={
            "session_id": "test_session_free",
            "message": "Hello",
            "user_plan": "free",
            "user_id": "test_free_user"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert data["detail"]["error"] == "PLAN_REQUIRED", f"Expected PLAN_REQUIRED error, got {data}"
        print(f"✓ Free user correctly blocked from AI chat: {data['detail']['error']}")
    
    def test_ai_chat_silver_user_allowed(self):
        """POST /api/ai/chat with user_plan='silver' returns AI response"""
        response = requests.post(f"{BASE_URL}/api/ai/chat", json={
            "session_id": f"test_session_silver_{int(time.time())}",
            "message": "What is my sun sign?",
            "user_plan": "silver",
            "user_id": "test_silver_user"
        }, timeout=60)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        assert len(data["response"]) > 10, "Response should be meaningful"
        print(f"✓ Silver user AI chat works: {data['response'][:100]}...")
    
    def test_ai_chat_gold_user_allowed(self):
        """POST /api/ai/chat with user_plan='gold' returns AI response"""
        response = requests.post(f"{BASE_URL}/api/ai/chat", json={
            "session_id": f"test_session_gold_{int(time.time())}",
            "message": "Tell me about Aries",
            "user_plan": "gold",
            "user_id": "test_gold_user"
        }, timeout=60)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "response" in data
        print(f"✓ Gold user AI chat works: {data['response'][:100]}...")
    
    def test_ai_chat_platinum_user_allowed(self):
        """POST /api/ai/chat with user_plan='platinum' returns AI response"""
        response = requests.post(f"{BASE_URL}/api/ai/chat", json={
            "session_id": f"test_session_platinum_{int(time.time())}",
            "message": "What is Vedic astrology?",
            "user_plan": "platinum",
            "user_id": "test_platinum_user"
        }, timeout=60)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "response" in data
        print(f"✓ Platinum user AI chat works: {data['response'][:100]}...")


class TestAIReports:
    """Test AI Report generation for all 12 report types"""
    
    def test_report_kundli_basic_free(self):
        """POST /api/ai/report with reportType='kundli-basic' returns free report"""
        response = requests.post(f"{BASE_URL}/api/ai/report", json={
            "reportType": "kundli-basic",
            "birthName": "TEST_User",
            "dob": "1990-05-15",
            "tob": "10:30",
            "pob": "Mumbai, India",
            "user_plan": "free"
        }, timeout=120)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "report" in data
        assert data["reportType"] == "kundli-basic"
        assert data["price"] == 0, "Basic kundli should be free"
        assert "walletBalance" in data
        print(f"✓ Basic Kundli report generated: {len(data['report'])} chars")
    
    def test_report_compatibility_with_partner(self):
        """POST /api/ai/report with reportType='compatibility' and partner details"""
        response = requests.post(f"{BASE_URL}/api/ai/report", json={
            "reportType": "compatibility",
            "birthName": "TEST_Person1",
            "dob": "1990-05-15",
            "tob": "10:30",
            "pob": "Delhi, India",
            "partnerName": "TEST_Person2",
            "partnerDob": "1992-08-20",
            "user_plan": "gold"
        }, timeout=120)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "report" in data
        assert data["reportType"] == "compatibility"
        assert data["price"] == 149, f"Compatibility report should cost 149, got {data['price']}"
        print(f"✓ Compatibility report generated: {len(data['report'])} chars")
    
    def test_report_invalid_type_returns_400(self):
        """POST /api/ai/report with reportType='invalid' returns 400"""
        response = requests.post(f"{BASE_URL}/api/ai/report", json={
            "reportType": "invalid_type",
            "birthName": "TEST_User",
            "dob": "1990-05-15",
            "pob": "Mumbai, India"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Invalid report type correctly returns 400")
    
    def test_all_report_types_exist(self):
        """Verify all 12 report types are recognized (test with invalid to check error)"""
        report_types = [
            "kundli-basic", "kundli-detailed", "kundli-premium", "compatibility",
            "career", "love", "finance", "health", "vastu", "annual", "sade-sati", "child-birth"
        ]
        # Just verify the endpoint accepts these types (don't actually generate all)
        for rt in report_types:
            # Quick validation - just check it doesn't return 400 for valid types
            response = requests.post(f"{BASE_URL}/api/ai/report", json={
                "reportType": rt,
                "birthName": "TEST_Validation",
                "dob": "1990-01-01",
                "pob": "Test City"
            }, timeout=5)
            # Should not be 400 (invalid type) - could be 200 or 500 (timeout/AI error)
            assert response.status_code != 400, f"Report type {rt} should be valid"
        print(f"✓ All 12 report types are recognized")


class TestBannerAPIs:
    """Test Banner CRUD operations"""
    
    def test_get_public_banners(self):
        """GET /api/banners returns an array (may be empty)"""
        response = requests.get(f"{BASE_URL}/api/banners")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Should return a list"
        print(f"✓ Public banners endpoint works: {len(data)} banners")
    
    def test_get_admin_banners(self):
        """GET /api/admin/banners returns banners list"""
        response = requests.get(f"{BASE_URL}/api/admin/banners")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Should return a list"
        print(f"✓ Admin banners endpoint works: {len(data)} banners")
    
    def test_banner_crud_operations(self):
        """Test full CRUD: POST creates, PUT updates, PATCH toggles, DELETE removes"""
        # CREATE
        create_response = requests.post(f"{BASE_URL}/api/admin/banners", json={
            "title": "TEST_Banner",
            "subtitle": "Test subtitle",
            "image_url": "https://example.com/test.jpg",
            "link": "/test-link",
            "position": 99,
            "is_active": True
        })
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        create_data = create_response.json()
        assert create_data["success"] == True
        banner_id = create_data["id"]
        print(f"✓ Banner created: {banner_id}")
        
        # UPDATE
        update_response = requests.put(f"{BASE_URL}/api/admin/banners/{banner_id}", json={
            "title": "TEST_Banner_Updated",
            "subtitle": "Updated subtitle"
        })
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        print(f"✓ Banner updated")
        
        # TOGGLE
        toggle_response = requests.patch(f"{BASE_URL}/api/admin/banners/{banner_id}/toggle", json={
            "is_active": False
        })
        assert toggle_response.status_code == 200, f"Toggle failed: {toggle_response.text}"
        print(f"✓ Banner toggled")
        
        # DELETE
        delete_response = requests.delete(f"{BASE_URL}/api/admin/banners/{banner_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        print(f"✓ Banner deleted")


class TestExistingPublicEndpoints:
    """Verify all existing public endpoints still return 200"""
    
    def test_astrologers_endpoint(self):
        """GET /api/astrologers returns 200"""
        response = requests.get(f"{BASE_URL}/api/astrologers")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/astrologers works")
    
    def test_products_endpoint(self):
        """GET /api/products returns 200"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/products works")
    
    def test_horoscopes_today_endpoint(self):
        """GET /api/horoscopes/today returns 200"""
        response = requests.get(f"{BASE_URL}/api/horoscopes/today")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/horoscopes/today works")
    
    def test_plans_endpoint(self):
        """GET /api/plans returns 200"""
        response = requests.get(f"{BASE_URL}/api/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/plans works")
    
    def test_blog_endpoint(self):
        """GET /api/blog returns 200"""
        response = requests.get(f"{BASE_URL}/api/blog")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/blog works")
    
    def test_stats_endpoint(self):
        """GET /api/stats returns 200"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/stats works")
    
    def test_site_settings_endpoint(self):
        """GET /api/site-settings returns 200"""
        response = requests.get(f"{BASE_URL}/api/site-settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/site-settings works")


class TestExistingAdminEndpoints:
    """Quick spot-check of existing admin endpoints"""
    
    def test_admin_stats(self):
        """GET /api/admin/stats returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/admin/stats works")
    
    def test_admin_users(self):
        """GET /api/admin/users returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/admin/users works")
    
    def test_admin_products(self):
        """GET /api/products returns 200 (admin uses same endpoint)"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/products (admin) works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
