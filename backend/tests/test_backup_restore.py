"""
Test Backup & Restore feature for Orbit360 Engine
Tests: GET /api/backup/export, POST /api/backup/restore
Also verifies no regression on existing APIs
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBackupExport:
    """Backup export endpoint tests"""
    
    def test_backup_export_returns_correct_structure(self):
        """Test GET /api/backup/export returns correct JSON structure"""
        response = requests.get(f"{BASE_URL}/api/backup/export")
        assert response.status_code == 200
        data = response.json()
        
        # Verify top-level keys
        assert "backup_version" in data, "Missing backup_version"
        assert "exported_at" in data, "Missing exported_at"
        assert "data" in data, "Missing data"
        assert "counts" in data, "Missing counts"
        
        # Verify backup_version
        assert data["backup_version"] == "1.0"
        
        # Verify exported_at is ISO format
        assert "T" in data["exported_at"], "exported_at should be ISO format"
        
        print(f"✓ GET /api/backup/export returns correct structure with version {data['backup_version']}")
    
    def test_backup_export_data_contains_required_keys(self):
        """Test backup data contains content_items, content_packages, marketing_dna"""
        response = requests.get(f"{BASE_URL}/api/backup/export")
        assert response.status_code == 200
        data = response.json()
        
        backup_data = data["data"]
        assert "content_items" in backup_data, "Missing content_items in data"
        assert "content_packages" in backup_data, "Missing content_packages in data"
        assert "marketing_dna" in backup_data, "Missing marketing_dna in data"
        
        # Verify content_items is a list
        assert isinstance(backup_data["content_items"], list)
        
        # Verify content_packages is a list
        assert isinstance(backup_data["content_packages"], list)
        
        print(f"✓ Backup data contains content_items ({len(backup_data['content_items'])}), content_packages ({len(backup_data['content_packages'])}), marketing_dna")
    
    def test_backup_export_counts_match_data(self):
        """Test counts match actual data lengths"""
        response = requests.get(f"{BASE_URL}/api/backup/export")
        assert response.status_code == 200
        data = response.json()
        
        counts = data["counts"]
        backup_data = data["data"]
        
        assert counts["content_items"] == len(backup_data["content_items"]), "content_items count mismatch"
        assert counts["content_packages"] == len(backup_data["content_packages"]), "content_packages count mismatch"
        
        print(f"✓ Counts match: {counts['content_items']} items, {counts['content_packages']} packages")


class TestBackupRestore:
    """Backup restore endpoint tests"""
    
    def test_restore_empty_data(self):
        """Test restore with empty data returns success"""
        response = requests.post(
            f"{BASE_URL}/api/backup/restore",
            json={"data": {}}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert "restored" in data
        assert data["restored"]["content_items"] == 0
        assert data["restored"]["content_packages"] == 0
        
        print("✓ POST /api/backup/restore with empty data returns success")
    
    def test_restore_new_content_item(self):
        """Test restore creates new content item that doesn't exist"""
        unique_id = f"TEST_RESTORE_{uuid.uuid4().hex[:8]}"
        
        restore_data = {
            "content_items": [
                {
                    "id": unique_id,
                    "title": "Test Restore Item",
                    "content": "Content for restore test",
                    "folder_id": "general",
                    "source_type": "manual",
                    "youtube_url": None,
                    "strategy": None,
                    "has_package": False,
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z"
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/backup/restore",
            json={"data": restore_data}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["restored"]["content_items"] == 1, "Should restore 1 content item"
        print(f"✓ Restored new content item with id {unique_id}")
        
        # Verify item exists
        get_response = requests.get(f"{BASE_URL}/api/content/items/{unique_id}")
        assert get_response.status_code == 200
        item = get_response.json()
        assert item["title"] == "Test Restore Item"
        print("✓ Verified restored item exists in database")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/content/items/{unique_id}")
    
    def test_restore_skips_existing_item(self):
        """Test restore skips items that already exist (no duplicates)"""
        unique_id = f"TEST_SKIP_{uuid.uuid4().hex[:8]}"
        
        # First, create an item directly
        create_payload = {
            "title": "Original Item",
            "content": "Original content",
            "folder_id": "general",
            "source_type": "manual"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/content/items",
            json=create_payload
        )
        assert create_response.status_code == 200
        created_item = create_response.json()
        existing_id = created_item["id"]
        
        # Now try to restore with the same ID
        restore_data = {
            "content_items": [
                {
                    "id": existing_id,
                    "title": "Duplicate Item - Should Not Replace",
                    "content": "This should not overwrite",
                    "folder_id": "general",
                    "source_type": "manual",
                    "youtube_url": None,
                    "strategy": None,
                    "has_package": False,
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z"
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/backup/restore",
            json={"data": restore_data}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should skip existing item
        assert data["restored"]["content_items"] == 0, "Should skip existing item"
        print("✓ Restore correctly skipped existing item (no duplicates)")
        
        # Verify original item unchanged
        get_response = requests.get(f"{BASE_URL}/api/content/items/{existing_id}")
        assert get_response.status_code == 200
        item = get_response.json()
        assert item["title"] == "Original Item", "Original item should not be modified"
        print("✓ Original item unchanged after restore attempt")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/content/items/{existing_id}")
    
    def test_restore_marketing_dna(self):
        """Test restore updates marketing DNA"""
        restore_data = {
            "marketing_dna": {
                "writing_style": "Test Style",
                "tone": "Test Tone",
                "target_audience": "Test Audience",
                "brand_values": "Test Values",
                "custom_instructions": "Test Instructions"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/backup/restore",
            json={"data": restore_data}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["restored"]["marketing_dna"] == True, "Should restore marketing DNA"
        print("✓ Marketing DNA restored successfully")
        
        # Verify DNA was updated
        dna_response = requests.get(f"{BASE_URL}/api/settings/marketing-dna")
        assert dna_response.status_code == 200
        dna = dna_response.json()
        assert dna["writing_style"] == "Test Style"
        print("✓ Verified marketing DNA was updated")
        
        # Restore original DNA
        original_dna = {
            "writing_style": "מקצועי, חד, מעצים",
            "tone": "מבוסס מקורות יהודיים",
            "target_audience": "",
            "brand_values": "",
            "custom_instructions": ""
        }
        requests.put(f"{BASE_URL}/api/settings/marketing-dna", json=original_dna)
    
    def test_restore_returns_restored_counts(self):
        """Test restore returns correct restored counts"""
        unique_id1 = f"TEST_COUNT1_{uuid.uuid4().hex[:8]}"
        unique_id2 = f"TEST_COUNT2_{uuid.uuid4().hex[:8]}"
        
        restore_data = {
            "content_items": [
                {
                    "id": unique_id1,
                    "title": "Count Test 1",
                    "content": "Content 1",
                    "folder_id": "general",
                    "source_type": "manual",
                    "youtube_url": None,
                    "strategy": None,
                    "has_package": False,
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z"
                },
                {
                    "id": unique_id2,
                    "title": "Count Test 2",
                    "content": "Content 2",
                    "folder_id": "general",
                    "source_type": "manual",
                    "youtube_url": None,
                    "strategy": None,
                    "has_package": False,
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z"
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/backup/restore",
            json={"data": restore_data}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["restored"]["content_items"] == 2, "Should restore 2 items"
        print(f"✓ Restore returned correct count: {data['restored']['content_items']} items")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/content/items/{unique_id1}")
        requests.delete(f"{BASE_URL}/api/content/items/{unique_id2}")


class TestRegressionAPIs:
    """Regression tests for existing APIs"""
    
    def test_folders_still_work(self):
        """Test GET /api/folders still works"""
        response = requests.get(f"{BASE_URL}/api/folders")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4
        print("✓ GET /api/folders still works")
    
    def test_content_items_still_work(self):
        """Test GET /api/content/items still works"""
        response = requests.get(f"{BASE_URL}/api/content/items")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        print("✓ GET /api/content/items still works")
    
    def test_marketing_dna_still_works(self):
        """Test GET /api/settings/marketing-dna still works"""
        response = requests.get(f"{BASE_URL}/api/settings/marketing-dna")
        assert response.status_code == 200
        data = response.json()
        assert "writing_style" in data
        print("✓ GET /api/settings/marketing-dna still works")


class TestPWAFilesRegression:
    """Regression tests for PWA files"""
    
    def test_manifest_still_served(self):
        """Test /manifest.json still served"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200
        print("✓ /manifest.json still served")
    
    def test_service_worker_still_served(self):
        """Test /sw.js still served"""
        response = requests.get(f"{BASE_URL}/sw.js")
        assert response.status_code == 200
        print("✓ /sw.js still served")
    
    def test_icon_192_still_served(self):
        """Test /icon-192.png still served"""
        response = requests.get(f"{BASE_URL}/icon-192.png")
        assert response.status_code == 200
        print("✓ /icon-192.png still served")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
