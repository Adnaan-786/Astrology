"""
Test suite for AstroVedic AI - Support Tickets & Daily Rashifal Features
Tests: POST/GET /api/support/tickets, GET /api/admin/support, 
       POST /api/admin/rashifal/generate-today, GET /api/horoscopes/today
       and existing endpoints verification
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cosmic-kundli-ai.preview.emergentagent.com').rstrip('/')

class TestHealthAndBasicEndpoints:
    """Verify basic endpoints still work"""
    
    def test_health_check(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_stats_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "rating" in data
        print(f"✓ Stats endpoint: {data['total_users']} users, {data['rating']} rating")
    
    def test_banners_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/banners")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Banners endpoint: {len(data)} banners")
    
    def test_astrologers_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/astrologers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Astrologers endpoint: {len(data)} astrologers")
    
    def test_admin_stats_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "totalUsers" in data
        assert "openTickets" in data
        print(f"✓ Admin stats: {data['totalUsers']} users, {data['openTickets']} open tickets")


class TestSupportTickets:
    """Test public support ticket creation and retrieval"""
    
    @pytest.fixture
    def test_user(self):
        return {
            "id": f"TEST_user_{uuid.uuid4().hex[:8]}",
            "name": "Test User",
            "email": "testuser@example.com"
        }
    
    def test_create_support_ticket_success(self, test_user):
        """POST /api/support/tickets with valid data returns success"""
        payload = {
            "user_id": test_user["id"],
            "user_name": test_user["name"],
            "user_email": test_user["email"],
            "category": "technical",
            "subject": "TEST: App crashing on login",
            "description": "The app crashes when I try to login with my Google account. Error message: 'Authentication failed'",
            "priority": "high"
        }
        response = requests.post(f"{BASE_URL}/api/support/tickets", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "ticket_id" in data
        assert len(data["ticket_id"]) > 0
        print(f"✓ Created support ticket: #{data['ticket_id']}")
        return data["ticket_id"]
    
    def test_create_support_ticket_missing_subject(self, test_user):
        """POST /api/support/tickets with missing subject returns 400"""
        payload = {
            "user_id": test_user["id"],
            "user_name": test_user["name"],
            "user_email": test_user["email"],
            "category": "general",
            "subject": "",  # Empty subject
            "description": "Some description here",
            "priority": "medium"
        }
        response = requests.post(f"{BASE_URL}/api/support/tickets", json=payload)
        assert response.status_code == 400
        print("✓ Empty subject correctly returns 400")
    
    def test_create_support_ticket_missing_description(self, test_user):
        """POST /api/support/tickets with missing description returns 400"""
        payload = {
            "user_id": test_user["id"],
            "user_name": test_user["name"],
            "user_email": test_user["email"],
            "category": "payment",
            "subject": "Payment issue",
            "description": "   ",  # Whitespace only
            "priority": "high"
        }
        response = requests.post(f"{BASE_URL}/api/support/tickets", json=payload)
        assert response.status_code == 400
        print("✓ Empty description correctly returns 400")
    
    def test_create_support_ticket_with_screenshot(self, test_user):
        """POST /api/support/tickets accepts screenshot_url (base64 data URL)"""
        # Small base64 encoded 1x1 red pixel PNG
        base64_screenshot = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        payload = {
            "user_id": test_user["id"],
            "user_name": test_user["name"],
            "user_email": test_user["email"],
            "category": "technical",
            "subject": "TEST: Screenshot upload test",
            "description": "Testing screenshot upload functionality",
            "priority": "low",
            "screenshot_url": base64_screenshot
        }
        response = requests.post(f"{BASE_URL}/api/support/tickets", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "ticket_id" in data
        print(f"✓ Created ticket with screenshot: #{data['ticket_id']}")
        return data["ticket_id"]
    
    def test_get_user_tickets(self, test_user):
        """GET /api/support/tickets?user_id=X returns user's tickets"""
        # First create a ticket
        payload = {
            "user_id": test_user["id"],
            "user_name": test_user["name"],
            "user_email": test_user["email"],
            "category": "general",
            "subject": "TEST: Query for retrieval test",
            "description": "This ticket is for testing retrieval",
            "priority": "medium"
        }
        create_response = requests.post(f"{BASE_URL}/api/support/tickets", json=payload)
        assert create_response.status_code == 200
        created_ticket_id = create_response.json()["ticket_id"]
        
        # Now retrieve tickets for this user
        response = requests.get(f"{BASE_URL}/api/support/tickets", params={"user_id": test_user["id"]})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Verify our ticket is in the list
        ticket_ids = [t["id"] for t in data]
        assert created_ticket_id in ticket_ids
        print(f"✓ Retrieved {len(data)} tickets for user, including #{created_ticket_id}")


class TestAdminSupportTickets:
    """Test admin support ticket endpoints"""
    
    def test_admin_support_includes_new_tickets(self):
        """GET /api/admin/support includes newly created public tickets"""
        # Create a unique ticket
        unique_subject = f"TEST_ADMIN_CHECK_{uuid.uuid4().hex[:8]}"
        payload = {
            "user_id": "admin_test_user",
            "user_name": "Admin Test User",
            "user_email": "admintest@example.com",
            "category": "refund",
            "subject": unique_subject,
            "description": "Testing admin visibility of public tickets",
            "priority": "high"
        }
        create_response = requests.post(f"{BASE_URL}/api/support/tickets", json=payload)
        assert create_response.status_code == 200
        created_ticket_id = create_response.json()["ticket_id"]
        
        # Check admin endpoint
        admin_response = requests.get(f"{BASE_URL}/api/admin/support")
        assert admin_response.status_code == 200
        tickets = admin_response.json()
        assert isinstance(tickets, list)
        
        # Find our ticket
        found = False
        for ticket in tickets:
            if ticket.get("id") == created_ticket_id or ticket.get("subject") == unique_subject:
                found = True
                assert ticket.get("category") == "refund"
                assert ticket.get("priority") == "high"
                break
        
        assert found, f"Ticket #{created_ticket_id} not found in admin support list"
        print(f"✓ Admin support endpoint includes new ticket #{created_ticket_id}")


class TestDailyRashifal:
    """Test daily rashifal auto-generation and admin regeneration"""
    
    def test_horoscopes_today_returns_12_rashis(self):
        """GET /api/horoscopes/today returns 12 rashifals with current date"""
        response = requests.get(f"{BASE_URL}/api/horoscopes/today")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 12, f"Expected 12 rashifals, got {len(data)}"
        
        # Verify all 12 rashis are present
        rashi_nums = sorted([h["rashi"] for h in data])
        assert rashi_nums == list(range(1, 13)), f"Missing rashis: {rashi_nums}"
        
        # Verify date is today (IST)
        now_ist = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
        today_str = now_ist.strftime("%Y-%m-%d")
        for h in data:
            assert h["date"] == today_str, f"Expected date {today_str}, got {h['date']}"
            assert "content_english" in h
            assert "content_hindi" in h
            assert "lucky_color" in h
            assert "mood_score" in h
        
        print(f"✓ Horoscopes today: 12 rashifals for {today_str}")
    
    def test_admin_regenerate_today_rashifal(self):
        """POST /api/admin/rashifal/generate-today regenerates today's rashifals"""
        # This endpoint regenerates all 12 rashifals via Claude AI, so it takes ~60-120 seconds
        response = requests.post(f"{BASE_URL}/api/admin/rashifal/generate-today", timeout=180)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "date" in data
        assert data["generated"] == 12, f"Expected 12 generated, got {data['generated']}"
        
        # Verify date is today IST
        now_ist = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
        today_str = now_ist.strftime("%Y-%m-%d")
        assert data["date"] == today_str
        
        print(f"✓ Admin regenerated {data['generated']} rashifals for {data['date']}")


class TestAIChatPlanAccess:
    """Test AI Chat plan-based access control"""
    
    def test_ai_chat_free_user_blocked(self):
        """POST /api/ai/chat with user_plan='free' returns 403"""
        payload = {
            "session_id": f"test_session_{uuid.uuid4().hex[:8]}",
            "message": "What is my horoscope?",
            "user_plan": "free",
            "user_id": "test_free_user"
        }
        response = requests.post(f"{BASE_URL}/api/ai/chat", json=payload)
        assert response.status_code == 403
        data = response.json()
        assert "PLAN_REQUIRED" in str(data.get("detail", {}))
        print("✓ Free user correctly blocked from AI chat")
    
    def test_ai_chat_silver_user_allowed(self):
        """POST /api/ai/chat with user_plan='silver' returns AI response"""
        payload = {
            "session_id": f"test_session_{uuid.uuid4().hex[:8]}",
            "message": "Hello, what is astrology?",
            "user_plan": "silver",
            "user_id": "test_silver_user"
        }
        response = requests.post(f"{BASE_URL}/api/ai/chat", json=payload, timeout=60)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 10
        print(f"✓ Silver user AI chat response: {data['response'][:50]}...")


class TestAIReports:
    """Test AI Report generation"""
    
    def test_ai_report_kundli_basic(self):
        """POST /api/ai/report with reportType='kundli-basic' returns report"""
        payload = {
            "reportType": "kundli-basic",
            "birthName": "Test User",
            "dob": "1990-05-15",
            "tob": "10:30",
            "pob": "Mumbai, India",
            "user_id": f"TEST_report_{uuid.uuid4().hex[:8]}",
            "user_plan": "free"
        }
        response = requests.post(f"{BASE_URL}/api/ai/report", json=payload, timeout=90)
        assert response.status_code == 200
        data = response.json()
        assert "report" in data
        assert data["reportType"] == "kundli-basic"
        assert data["price"] == 0  # Basic is free
        assert len(data["report"]) > 100
        print(f"✓ Kundli basic report generated: {len(data['report'])} chars")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_tickets(self):
        """Clean up TEST_ prefixed tickets from admin support"""
        # This is informational - we can't delete via API but we verify test data exists
        response = requests.get(f"{BASE_URL}/api/admin/support")
        assert response.status_code == 200
        tickets = response.json()
        test_tickets = [t for t in tickets if "TEST" in t.get("subject", "") or "TEST" in t.get("user_id", "")]
        print(f"ℹ Found {len(test_tickets)} test tickets in admin support (manual cleanup may be needed)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
