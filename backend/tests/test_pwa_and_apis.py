"""
Test PWA files and all backend APIs for Orbit360 Engine
Tests: PWA manifest, service worker, icons, and all API endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPWAFiles:
    """PWA file accessibility tests"""
    
    def test_manifest_json_accessible(self):
        """Test manifest.json is served correctly"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200
        data = response.json()
        
        # Verify manifest content
        assert data["name"] == "Orbit360 Engine"
        assert data["short_name"] == "Orbit360"
        assert data["dir"] == "rtl"
        assert data["display"] == "standalone"
        assert "icons" in data
        assert len(data["icons"]) >= 2
        print("✓ manifest.json served correctly with RTL and standalone display")
    
    def test_service_worker_accessible(self):
        """Test sw.js is served correctly"""
        response = requests.get(f"{BASE_URL}/sw.js")
        assert response.status_code == 200
        content = response.text
        
        # Verify service worker content
        assert "CACHE_NAME" in content
        assert "orbit360" in content.lower()
        assert "install" in content
        assert "fetch" in content
        print("✓ sw.js served correctly with caching logic")
    
    def test_icon_192_accessible(self):
        """Test icon-192.png is accessible"""
        response = requests.get(f"{BASE_URL}/icon-192.png")
        assert response.status_code == 200
        assert "image" in response.headers.get("content-type", "")
        print("✓ icon-192.png accessible")
    
    def test_icon_512_accessible(self):
        """Test icon-512.png is accessible"""
        response = requests.get(f"{BASE_URL}/icon-512.png")
        assert response.status_code == 200
        assert "image" in response.headers.get("content-type", "")
        print("✓ icon-512.png accessible")
    
    def test_apple_touch_icon_accessible(self):
        """Test apple-touch-icon.png is accessible"""
        response = requests.get(f"{BASE_URL}/apple-touch-icon.png")
        assert response.status_code == 200
        assert "image" in response.headers.get("content-type", "")
        print("✓ apple-touch-icon.png accessible")


class TestBackendAPIs:
    """Backend API endpoint tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ GET /api/ returns message")
    
    def test_get_folders(self):
        """Test folders endpoint"""
        response = requests.get(f"{BASE_URL}/api/folders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4
        folder_ids = [f["id"] for f in data]
        assert "torah" in folder_ids
        assert "business" in folder_ids
        assert "mental_snacks" in folder_ids
        assert "general" in folder_ids
        print("✓ GET /api/folders returns 4 folders")
    
    def test_get_content_items(self):
        """Test content items list endpoint"""
        response = requests.get(f"{BASE_URL}/api/content/items")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)
        print(f"✓ GET /api/content/items returns {data['total']} items")
    
    def test_get_content_items_with_folder_filter(self):
        """Test content items with folder filter"""
        response = requests.get(f"{BASE_URL}/api/content/items?folder_id=torah")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        for item in data["items"]:
            assert item["folder_id"] == "torah"
        print("✓ GET /api/content/items?folder_id=torah filters correctly")
    
    def test_get_marketing_dna(self):
        """Test marketing DNA settings endpoint"""
        response = requests.get(f"{BASE_URL}/api/settings/marketing-dna")
        assert response.status_code == 200
        data = response.json()
        assert "writing_style" in data
        assert "tone" in data
        print("✓ GET /api/settings/marketing-dna returns DNA settings")
    
    def test_search_endpoint(self):
        """Test search endpoint"""
        response = requests.get(f"{BASE_URL}/api/search?q=test")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        print("✓ GET /api/search?q=test works")
    
    def test_daily_snack(self):
        """Test daily snack endpoint"""
        response = requests.get(f"{BASE_URL}/api/daily-snack")
        assert response.status_code == 200
        data = response.json()
        assert "snack" in data or "message" in data
        print("✓ GET /api/daily-snack returns snack or message")
    
    def test_history_endpoint(self):
        """Test history endpoint"""
        response = requests.get(f"{BASE_URL}/api/history")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        print(f"✓ GET /api/history returns {data['total']} items")
    
    def test_bulk_export(self):
        """Test bulk export endpoint"""
        response = requests.get(f"{BASE_URL}/api/content/bulk-export")
        assert response.status_code == 200
        data = response.json()
        assert "packages" in data
        assert "total" in data
        print(f"✓ GET /api/content/bulk-export returns {data['total']} packages")
    
    def test_content_crud_create_and_delete(self):
        """Test content item create and delete"""
        # Create
        create_payload = {
            "title": "TEST_PWA_Test_Item",
            "content": "Test content for PWA testing",
            "folder_id": "general",
            "source_type": "manual"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/content/items",
            json=create_payload
        )
        assert create_response.status_code == 200
        created = create_response.json()
        assert created["title"] == create_payload["title"]
        item_id = created["id"]
        print(f"✓ POST /api/content/items created item {item_id}")
        
        # Get to verify
        get_response = requests.get(f"{BASE_URL}/api/content/items/{item_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == create_payload["title"]
        print(f"✓ GET /api/content/items/{item_id} verified")
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/content/items/{item_id}")
        assert delete_response.status_code == 200
        print(f"✓ DELETE /api/content/items/{item_id} succeeded")
        
        # Verify deleted
        verify_response = requests.get(f"{BASE_URL}/api/content/items/{item_id}")
        assert verify_response.status_code == 404
        print("✓ Item verified as deleted (404)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
