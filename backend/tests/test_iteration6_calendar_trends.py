"""
Iteration 6 Tests: Calendar Scheduling, Push Notifications, Trend Finder
Tests for new features: scheduled posts CRUD, VAPID key endpoint, trends API
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCalendarScheduling:
    """Calendar scheduling endpoint tests"""
    
    def test_create_scheduled_post(self):
        """POST /api/calendar/schedule creates a scheduled post"""
        response = requests.post(f"{BASE_URL}/api/calendar/schedule", json={
            "title": "TEST_scheduled_post",
            "note": "Test note for scheduled post",
            "scheduled_date": "2026-04-20",
            "content_item_id": None
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["title"] == "TEST_scheduled_post"
        assert data["scheduled_date"] == "2026-04-20"
        assert data["status"] == "pending"
        # Store for cleanup
        self.__class__.created_post_id = data["id"]
        print(f"✓ Created scheduled post with id: {data['id']}")
    
    def test_list_scheduled_posts(self):
        """GET /api/calendar/schedule returns scheduled posts list"""
        response = requests.get(f"{BASE_URL}/api/calendar/schedule")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "posts" in data
        assert isinstance(data["posts"], list)
        print(f"✓ Listed {len(data['posts'])} scheduled posts")
    
    def test_list_scheduled_posts_filter_by_month(self):
        """GET /api/calendar/schedule?month=2026-04 filters by month"""
        response = requests.get(f"{BASE_URL}/api/calendar/schedule", params={"month": "2026-04"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "posts" in data
        # All posts should be in April 2026
        for post in data["posts"]:
            assert post["scheduled_date"].startswith("2026-04"), f"Post date {post['scheduled_date']} not in 2026-04"
        print(f"✓ Filtered to {len(data['posts'])} posts for 2026-04")
    
    def test_mark_scheduled_post_done(self):
        """PUT /api/calendar/schedule/{id}/done marks post as done"""
        # First create a post to mark as done
        create_resp = requests.post(f"{BASE_URL}/api/calendar/schedule", json={
            "title": "TEST_mark_done_post",
            "scheduled_date": "2026-04-21"
        })
        assert create_resp.status_code == 200
        post_id = create_resp.json()["id"]
        
        # Mark as done
        response = requests.put(f"{BASE_URL}/api/calendar/schedule/{post_id}/done")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["status"] == "updated"
        
        # Verify it's marked as done
        list_resp = requests.get(f"{BASE_URL}/api/calendar/schedule", params={"month": "2026-04"})
        posts = list_resp.json()["posts"]
        marked_post = next((p for p in posts if p["id"] == post_id), None)
        assert marked_post is not None
        assert marked_post["status"] == "done"
        print(f"✓ Marked post {post_id} as done")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/calendar/schedule/{post_id}")
    
    def test_delete_scheduled_post(self):
        """DELETE /api/calendar/schedule/{id} deletes scheduled post"""
        # Create a post to delete
        create_resp = requests.post(f"{BASE_URL}/api/calendar/schedule", json={
            "title": "TEST_delete_post",
            "scheduled_date": "2026-04-22"
        })
        assert create_resp.status_code == 200
        post_id = create_resp.json()["id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/calendar/schedule/{post_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["status"] == "deleted"
        
        # Verify it's gone
        list_resp = requests.get(f"{BASE_URL}/api/calendar/schedule")
        posts = list_resp.json()["posts"]
        deleted_post = next((p for p in posts if p["id"] == post_id), None)
        assert deleted_post is None
        print(f"✓ Deleted scheduled post {post_id}")
    
    def test_delete_nonexistent_scheduled_post(self):
        """DELETE /api/calendar/schedule/{id} returns 404 for non-existent"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{BASE_URL}/api/calendar/schedule/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Got 404 for non-existent scheduled post")


class TestPushNotifications:
    """Push notification endpoint tests"""
    
    def test_get_vapid_key(self):
        """GET /api/push/vapid-key returns a non-empty publicKey"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-key")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "publicKey" in data
        assert len(data["publicKey"]) > 0, "VAPID public key should not be empty"
        print(f"✓ Got VAPID public key: {data['publicKey'][:20]}...")


class TestTrendFinder:
    """Trend finder agent endpoint tests"""
    
    def test_list_trends_empty_initially(self):
        """GET /api/agents/trends returns list (may be empty initially)"""
        response = requests.get(f"{BASE_URL}/api/agents/trends")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "searches" in data
        assert "total" in data
        assert isinstance(data["searches"], list)
        print(f"✓ Listed {data['total']} trend searches")
    
    def test_delete_nonexistent_trend(self):
        """DELETE /api/agents/trends/{id} returns 404 for non-existent"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{BASE_URL}/api/agents/trends/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Got 404 for non-existent trend search")


class TestRegressions:
    """Regression tests for existing endpoints"""
    
    def test_folders_returns_4(self):
        """Regression: GET /api/folders returns 4 folders"""
        response = requests.get(f"{BASE_URL}/api/folders")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert len(data) == 4, f"Expected 4 folders, got {len(data)}"
        folder_ids = [f["id"] for f in data]
        assert "torah" in folder_ids
        assert "business" in folder_ids
        assert "mental_snacks" in folder_ids
        assert "general" in folder_ids
        print(f"✓ Got 4 folders: {folder_ids}")
    
    def test_content_items_works(self):
        """Regression: GET /api/content/items works"""
        response = requests.get(f"{BASE_URL}/api/content/items")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "items" in data
        assert "total" in data
        print(f"✓ Content items endpoint works, {data['total']} items")
    
    def test_ai_settings_returns_provider(self):
        """Regression: GET /api/settings/ai returns provider"""
        response = requests.get(f"{BASE_URL}/api/settings/ai")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "provider" in data
        print(f"✓ AI settings works, provider: {data['provider']}")
    
    def test_backup_export_works(self):
        """Regression: GET /api/backup/export works"""
        response = requests.get(f"{BASE_URL}/api/backup/export")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "backup_version" in data
        assert "data" in data
        print(f"✓ Backup export works")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed scheduled posts after tests"""
    yield
    # Cleanup
    try:
        response = requests.get(f"{BASE_URL}/api/calendar/schedule")
        if response.status_code == 200:
            posts = response.json().get("posts", [])
            for post in posts:
                if post.get("title", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/calendar/schedule/{post['id']}")
                    print(f"Cleaned up test post: {post['id']}")
    except Exception as e:
        print(f"Cleanup error: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
