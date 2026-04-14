"""
Test iteration 5: New features for Orbit360 Engine
- AI Settings endpoints (GET/PUT /api/settings/ai)
- Digital Guides agent endpoints (GET /api/agents/guides, DELETE /api/agents/guides/{id})
- Affiliate Finder agent endpoints (GET /api/agents/affiliates, DELETE /api/agents/affiliates/{id})
- Regression tests for existing endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAISettings:
    """AI Settings endpoint tests"""

    def test_get_ai_settings_returns_default(self):
        """GET /api/settings/ai returns default AI settings with provider 'emergent'"""
        response = requests.get(f"{BASE_URL}/api/settings/ai")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "provider" in data, "Response should contain 'provider'"
        assert data["provider"] == "emergent", f"Default provider should be 'emergent', got {data['provider']}"
        assert "id" in data, "Response should contain 'id'"
        assert data["id"] == "default", f"ID should be 'default', got {data['id']}"
        assert "stt_provider" in data, "Response should contain 'stt_provider'"
        assert "stt_model" in data, "Response should contain 'stt_model'"
        print(f"AI Settings: provider={data['provider']}, stt_provider={data.get('stt_provider')}")

    def test_put_ai_settings_saves_correctly(self):
        """PUT /api/settings/ai saves AI settings correctly"""
        # Update settings
        update_data = {
            "provider": "openai",
            "api_key": "test-key-12345678",
            "api_url": "",
            "model": "gpt-4o",
            "stt_provider": "openai",
            "stt_api_key": "test-stt-key-12345",
            "stt_api_url": "",
            "stt_model": "whisper-1"
        }
        response = requests.put(f"{BASE_URL}/api/settings/ai", json=update_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "saved", f"Expected status 'saved', got {data}"
        
        # Verify by GET
        get_response = requests.get(f"{BASE_URL}/api/settings/ai")
        assert get_response.status_code == 200
        
        get_data = get_response.json()
        assert get_data["provider"] == "openai", f"Provider should be 'openai', got {get_data['provider']}"
        assert get_data["model"] == "gpt-4o", f"Model should be 'gpt-4o', got {get_data['model']}"
        # API key should be masked
        assert "..." in get_data.get("api_key", "") or "***" in get_data.get("api_key", ""), "API key should be masked"
        print(f"Updated AI Settings verified: provider={get_data['provider']}, model={get_data['model']}")
        
        # Reset to emergent for other tests
        reset_data = {
            "provider": "emergent",
            "api_key": "",
            "api_url": "",
            "model": "",
            "stt_provider": "emergent",
            "stt_api_key": "",
            "stt_api_url": "",
            "stt_model": "whisper-1"
        }
        requests.put(f"{BASE_URL}/api/settings/ai", json=reset_data)


class TestDigitalGuidesAgent:
    """Digital Guides agent endpoint tests"""

    def test_list_guides_returns_empty_or_list(self):
        """GET /api/agents/guides returns empty list or list of guides"""
        response = requests.get(f"{BASE_URL}/api/agents/guides")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "guides" in data, "Response should contain 'guides'"
        assert "total" in data, "Response should contain 'total'"
        assert isinstance(data["guides"], list), "guides should be a list"
        assert isinstance(data["total"], int), "total should be an integer"
        print(f"Guides list: {data['total']} guides found")

    def test_delete_guide_nonexistent_returns_404(self):
        """DELETE /api/agents/guides/{id} returns 404 for non-existent guide"""
        fake_id = "nonexistent-guide-id-12345"
        response = requests.delete(f"{BASE_URL}/api/agents/guides/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"Delete non-existent guide correctly returned 404")


class TestAffiliateFinderAgent:
    """Affiliate Finder agent endpoint tests"""

    def test_list_affiliates_returns_empty_or_list(self):
        """GET /api/agents/affiliates returns empty list or list of searches"""
        response = requests.get(f"{BASE_URL}/api/agents/affiliates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "searches" in data, "Response should contain 'searches'"
        assert "total" in data, "Response should contain 'total'"
        assert isinstance(data["searches"], list), "searches should be a list"
        assert isinstance(data["total"], int), "total should be an integer"
        print(f"Affiliate searches list: {data['total']} searches found")

    def test_delete_affiliate_nonexistent_returns_404(self):
        """DELETE /api/agents/affiliates/{id} returns 404 for non-existent search"""
        fake_id = "nonexistent-affiliate-id-12345"
        response = requests.delete(f"{BASE_URL}/api/agents/affiliates/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"Delete non-existent affiliate search correctly returned 404")


class TestRegressionExistingEndpoints:
    """Regression tests for existing endpoints"""

    def test_get_folders_still_works(self):
        """Regression: GET /api/folders still works"""
        response = requests.get(f"{BASE_URL}/api/folders")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 4, f"Expected 4 folders, got {len(data)}"
        folder_ids = [f["id"] for f in data]
        assert "torah" in folder_ids, "torah folder should exist"
        assert "business" in folder_ids, "business folder should exist"
        print(f"Folders endpoint working: {len(data)} folders")

    def test_get_content_items_still_works(self):
        """Regression: GET /api/content/items still works"""
        response = requests.get(f"{BASE_URL}/api/content/items")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "items" in data, "Response should contain 'items'"
        assert "total" in data, "Response should contain 'total'"
        print(f"Content items endpoint working: {data['total']} items")

    def test_get_marketing_dna_still_works(self):
        """Regression: GET /api/settings/marketing-dna still works"""
        response = requests.get(f"{BASE_URL}/api/settings/marketing-dna")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "writing_style" in data, "Response should contain 'writing_style'"
        assert "tone" in data, "Response should contain 'tone'"
        print(f"Marketing DNA endpoint working")

    def test_backup_export_still_works(self):
        """Regression: GET /api/backup/export still works"""
        response = requests.get(f"{BASE_URL}/api/backup/export")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "backup_version" in data, "Response should contain 'backup_version'"
        assert "data" in data, "Response should contain 'data'"
        print(f"Backup export endpoint working")


class TestManifestAndPWA:
    """PWA file tests"""

    def test_manifest_json_still_served(self):
        """Regression: /manifest.json still served"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "name" in data, "Manifest should contain 'name'"
        print(f"Manifest.json served correctly: {data.get('name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
