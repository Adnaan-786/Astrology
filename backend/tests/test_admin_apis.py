"""
Backend API Tests for AstroVedic AI Admin Panel
Tests all admin CRUD operations and API endpoints
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminSessions:
    """Admin Sessions API tests"""
    
    def test_get_sessions(self):
        """GET /api/admin/sessions returns session data"""
        response = requests.get(f"{BASE_URL}/api/admin/sessions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            session = data[0]
            assert "id" in session
            assert "user_name" in session or "status" in session
        print(f"✓ Sessions API returned {len(data)} sessions")

    def test_get_sessions_with_filter(self):
        """GET /api/admin/sessions?status=active filters correctly"""
        response = requests.get(f"{BASE_URL}/api/admin/sessions?status=active")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Sessions filter returned {len(data)} active sessions")


class TestAdminAIReports:
    """Admin AI Reports API tests"""
    
    def test_get_ai_reports(self):
        """GET /api/admin/ai-reports returns reports"""
        response = requests.get(f"{BASE_URL}/api/admin/ai-reports")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            report = data[0]
            assert "id" in report
            assert "report_type" in report or "status" in report
        print(f"✓ AI Reports API returned {len(data)} reports")


class TestAdminBlog:
    """Admin Blog CRUD API tests"""
    
    def test_get_blog_posts(self):
        """GET /api/admin/blog returns posts"""
        response = requests.get(f"{BASE_URL}/api/admin/blog")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Blog API returned {len(data)} posts")

    def test_create_blog_post(self):
        """POST /api/admin/blog creates a blog post"""
        payload = {
            "title": "TEST_Blog Post Title",
            "content": "This is test content for the blog post.",
            "excerpt": "Test excerpt",
            "cover_image": "https://example.com/image.jpg",
            "category": "General",
            "is_published": False
        }
        response = requests.post(f"{BASE_URL}/api/admin/blog", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "id" in data
        print(f"✓ Blog post created with ID: {data['id']}")
        return data["id"]

    def test_update_blog_post(self):
        """PUT /api/admin/blog/:id updates a post"""
        # First create a post
        create_payload = {
            "title": "TEST_Update Blog Post",
            "content": "Original content",
            "category": "General"
        }
        create_res = requests.post(f"{BASE_URL}/api/admin/blog", json=create_payload)
        post_id = create_res.json().get("id")
        
        # Update it
        update_payload = {"title": "TEST_Updated Blog Title", "content": "Updated content"}
        response = requests.put(f"{BASE_URL}/api/admin/blog/{post_id}", json=update_payload)
        assert response.status_code == 200
        assert response.json().get("success") == True
        print(f"✓ Blog post {post_id} updated")

    def test_toggle_blog_publish(self):
        """PATCH /api/admin/blog/:id/publish toggles publish status"""
        # Create a post first
        create_res = requests.post(f"{BASE_URL}/api/admin/blog", json={
            "title": "TEST_Publish Toggle Post",
            "content": "Content",
            "category": "General"
        })
        post_id = create_res.json().get("id")
        
        response = requests.patch(f"{BASE_URL}/api/admin/blog/{post_id}/publish", json={"is_published": True})
        assert response.status_code == 200
        assert response.json().get("success") == True
        print(f"✓ Blog post publish toggled")


class TestAdminPlans:
    """Admin Plans CRUD API tests"""
    
    def test_get_plans(self):
        """GET /api/admin/plans returns plans"""
        response = requests.get(f"{BASE_URL}/api/admin/plans")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Plans API returned {len(data)} plans")

    def test_create_plan(self):
        """POST /api/admin/plans creates a plan"""
        payload = {
            "name": "TEST_Premium Plan",
            "slug": "test-premium",
            "description": "Test premium plan",
            "price_monthly": 299,
            "price_annual": 2499,
            "features": ["Feature 1", "Feature 2"],
            "ai_reports_per_month": 5,
            "free_chat_minutes": 15,
            "discount_on_products": 10,
            "is_active": True,
            "color": "#FF5733"
        }
        response = requests.post(f"{BASE_URL}/api/admin/plans", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "id" in data
        print(f"✓ Plan created with ID: {data['id']}")

    def test_toggle_plan(self):
        """PATCH /api/admin/plans/:id/toggle toggles plan status"""
        # Create a plan first
        create_res = requests.post(f"{BASE_URL}/api/admin/plans", json={
            "name": "TEST_Toggle Plan",
            "price_monthly": 99,
            "price_annual": 999
        })
        plan_id = create_res.json().get("id")
        
        response = requests.patch(f"{BASE_URL}/api/admin/plans/{plan_id}/toggle", json={"is_active": False})
        assert response.status_code == 200
        assert response.json().get("success") == True
        print(f"✓ Plan toggle successful")


class TestAdminCoupons:
    """Admin Coupons CRUD API tests"""
    
    def test_get_coupons(self):
        """GET /api/admin/coupons returns coupons"""
        response = requests.get(f"{BASE_URL}/api/admin/coupons")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Coupons API returned {len(data)} coupons")

    def test_create_coupon(self):
        """POST /api/admin/coupons creates a coupon"""
        payload = {
            "code": "TEST50OFF",
            "discount_type": "percentage",
            "discount_value": 50,
            "min_order": 500,
            "max_discount": 200,
            "usage_limit": 100,
            "is_active": True,
            "expires_at": (datetime.now() + timedelta(days=30)).isoformat()
        }
        response = requests.post(f"{BASE_URL}/api/admin/coupons", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "id" in data
        print(f"✓ Coupon created with ID: {data['id']}")

    def test_toggle_coupon(self):
        """PATCH /api/admin/coupons/:id/toggle toggles coupon status"""
        # Create a coupon first
        create_res = requests.post(f"{BASE_URL}/api/admin/coupons", json={
            "code": "TESTTOGGLE",
            "discount_type": "flat",
            "discount_value": 100
        })
        coupon_id = create_res.json().get("id")
        
        response = requests.patch(f"{BASE_URL}/api/admin/coupons/{coupon_id}/toggle", json={"is_active": False})
        assert response.status_code == 200
        assert response.json().get("success") == True
        print(f"✓ Coupon toggle successful")


class TestAdminFinance:
    """Admin Finance API tests"""
    
    def test_get_finance(self):
        """GET /api/admin/finance returns transactions and summary"""
        response = requests.get(f"{BASE_URL}/api/admin/finance")
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert "summary" in data
        assert isinstance(data["transactions"], list)
        summary = data["summary"]
        assert "total_revenue" in summary or "net_profit" in summary
        print(f"✓ Finance API returned {len(data['transactions'])} transactions")


class TestAdminBanners:
    """Admin Banners CRUD API tests"""
    
    def test_get_banners(self):
        """GET /api/admin/banners returns banners"""
        response = requests.get(f"{BASE_URL}/api/admin/banners")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Banners API returned {len(data)} banners")

    def test_create_banner(self):
        """POST /api/admin/banners creates a banner"""
        payload = {
            "title": "TEST_Banner Title",
            "subtitle": "Test subtitle",
            "image_url": "https://example.com/banner.jpg",
            "link": "/test-page",
            "position": 99,
            "is_active": True,
            "page": "home"
        }
        response = requests.post(f"{BASE_URL}/api/admin/banners", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "id" in data
        print(f"✓ Banner created with ID: {data['id']}")

    def test_toggle_banner(self):
        """PATCH /api/admin/banners/:id/toggle toggles banner status"""
        # Create a banner first
        create_res = requests.post(f"{BASE_URL}/api/admin/banners", json={
            "title": "TEST_Toggle Banner",
            "image_url": "https://example.com/img.jpg"
        })
        banner_id = create_res.json().get("id")
        
        response = requests.patch(f"{BASE_URL}/api/admin/banners/{banner_id}/toggle", json={"is_active": False})
        assert response.status_code == 200
        assert response.json().get("success") == True
        print(f"✓ Banner toggle successful")


class TestAdminNotifications:
    """Admin Notifications API tests"""
    
    def test_get_notifications(self):
        """GET /api/admin/notifications returns notifications"""
        response = requests.get(f"{BASE_URL}/api/admin/notifications")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Notifications API returned {len(data)} notifications")

    def test_create_notification(self):
        """POST /api/admin/notifications creates a notification"""
        payload = {
            "title": "TEST_Notification Title",
            "message": "This is a test notification message",
            "type": "all",
            "target": "all_users"
        }
        response = requests.post(f"{BASE_URL}/api/admin/notifications", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "id" in data
        print(f"✓ Notification created with ID: {data['id']}")

    def test_send_notification(self):
        """POST /api/admin/notifications/:id/send sends a notification"""
        # Create a notification first
        create_res = requests.post(f"{BASE_URL}/api/admin/notifications", json={
            "title": "TEST_Send Notification",
            "message": "Test message",
            "type": "all",
            "target": "all_users"
        })
        notif_id = create_res.json().get("id")
        
        response = requests.post(f"{BASE_URL}/api/admin/notifications/{notif_id}/send")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "sent_count" in data
        print(f"✓ Notification sent to {data['sent_count']} users")


class TestAdminReviews:
    """Admin Reviews API tests"""
    
    def test_get_reviews(self):
        """GET /api/admin/reviews returns reviews"""
        response = requests.get(f"{BASE_URL}/api/admin/reviews")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            review = data[0]
            assert "id" in review
            assert "rating" in review or "comment" in review
        print(f"✓ Reviews API returned {len(data)} reviews")


class TestAdminSupport:
    """Admin Support Tickets API tests"""
    
    def test_get_support_tickets(self):
        """GET /api/admin/support returns tickets"""
        response = requests.get(f"{BASE_URL}/api/admin/support")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            ticket = data[0]
            assert "id" in ticket
            assert "subject" in ticket or "status" in ticket
        print(f"✓ Support API returned {len(data)} tickets")

    def test_get_support_tickets_filtered(self):
        """GET /api/admin/support?status=open filters correctly"""
        response = requests.get(f"{BASE_URL}/api/admin/support?status=open")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Support filter returned {len(data)} open tickets")


class TestAdminSettings:
    """Admin Settings API tests"""
    
    def test_get_settings(self):
        """GET /api/admin/settings returns settings"""
        response = requests.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code == 200
        data = response.json()
        assert "siteName" in data or "contactEmail" in data
        print(f"✓ Settings API returned site settings")

    def test_save_settings(self):
        """PUT /api/admin/settings saves settings to DB"""
        # First get current settings
        get_res = requests.get(f"{BASE_URL}/api/admin/settings")
        current = get_res.json()
        
        # Update with test value
        payload = {
            **current,
            "siteName": "TEST_AstroVedic AI",
            "tagline": "Test Tagline"
        }
        response = requests.put(f"{BASE_URL}/api/admin/settings", json=payload)
        assert response.status_code == 200
        assert response.json().get("success") == True
        
        # Verify persistence
        verify_res = requests.get(f"{BASE_URL}/api/admin/settings")
        verify_data = verify_res.json()
        assert verify_data.get("siteName") == "TEST_AstroVedic AI"
        
        # Restore original
        requests.put(f"{BASE_URL}/api/admin/settings", json=current)
        print(f"✓ Settings saved and persisted to DB")


class TestAdminAudit:
    """Admin Audit Log API tests"""
    
    def test_get_audit_logs(self):
        """GET /api/admin/audit returns audit logs"""
        response = requests.get(f"{BASE_URL}/api/admin/audit")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            log = data[0]
            assert "action" in log
            assert "entity_type" in log
        print(f"✓ Audit API returned {len(data)} logs")


class TestAdminOrders:
    """Admin Orders API tests"""
    
    def test_get_orders(self):
        """GET /api/admin/orders returns orders"""
        response = requests.get(f"{BASE_URL}/api/admin/orders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            order = data[0]
            assert "id" in order
            assert "status" in order or "total_amount" in order
        print(f"✓ Orders API returned {len(data)} orders")

    def test_get_orders_filtered(self):
        """GET /api/admin/orders?status=pending filters correctly"""
        response = requests.get(f"{BASE_URL}/api/admin/orders?status=pending")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Orders filter returned {len(data)} pending orders")


class TestHealthAndBasics:
    """Basic health and API tests"""
    
    def test_health_check(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health check passed")

    def test_admin_stats(self):
        """GET /api/admin/stats returns dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "totalUsers" in data or "onlineAstrologers" in data
        print(f"✓ Admin stats returned")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
