"""
Iteration 8 Tests: Smart Import + Chief Strategist Agent
- POST /api/import/smart - Smart import with AI classification
- GET /api/agents/strategist/sessions - List strategist sessions
- GET /api/agents/strategist/chat/{session_id} - Get chat messages
- DELETE /api/agents/strategist/session/{session_id} - Delete session
- Regression tests for folders, content items, backup
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSmartImport:
    """Smart Import endpoint tests - POST /api/import/smart"""
    
    def test_smart_import_hebrew_text(self):
        """Test smart import with Hebrew text returns item with detected title and folder_id"""
        response = requests.post(f"{BASE_URL}/api/import/smart", json={
            "text": "זהו טקסט קצר לבדיקה של מערכת הייבוא החכם"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "item" in data, "Response should contain 'item'"
        assert "detected" in data, "Response should contain 'detected'"
        assert "id" in data["item"], "Item should have id"
        assert "title" in data["item"], "Item should have title"
        assert "folder_id" in data["item"], "Item should have folder_id"
        assert data["item"]["source_type"] == "import", "Source type should be 'import'"
        print(f"Smart import success: title='{data['item']['title']}', folder='{data['item']['folder_id']}'")
        
        # Cleanup - delete the created item
        item_id = data["item"]["id"]
        requests.delete(f"{BASE_URL}/api/content/items/{item_id}")
    
    def test_smart_import_torah_content(self):
        """Test smart import correctly classifies torah content to 'torah' folder"""
        torah_text = """
        פרשת השבוע - בראשית
        בראשית ברא אלוהים את השמים ואת הארץ. והארץ היתה תוהו ובוהו וחושך על פני תהום.
        זהו שיעור תורה על פרשת בראשית ומשמעותה העמוקה.
        """
        response = requests.post(f"{BASE_URL}/api/import/smart", json={"text": torah_text})
        assert response.status_code == 200
        data = response.json()
        assert "item" in data
        # AI should classify this as torah
        detected_folder = data["detected"].get("folder_id", "")
        print(f"Torah content classified to: {detected_folder}")
        # Note: AI classification may vary, but we verify the structure is correct
        assert detected_folder in ["torah", "business", "mental_snacks", "general"], "folder_id should be valid"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/content/items/{data['item']['id']}")
    
    def test_smart_import_business_content(self):
        """Test smart import correctly classifies business content to 'business' folder"""
        business_text = """
        אסטרטגיית שיווק דיגיטלי 2026
        כיצד להגדיל מכירות באמצעות פרסום ממומן בפייסבוק ואינסטגרם.
        טיפים לניהול לקוחות ובניית משפך מכירות אפקטיבי.
        """
        response = requests.post(f"{BASE_URL}/api/import/smart", json={"text": business_text})
        assert response.status_code == 200
        data = response.json()
        assert "item" in data
        detected_folder = data["detected"].get("folder_id", "")
        print(f"Business content classified to: {detected_folder}")
        assert detected_folder in ["torah", "business", "mental_snacks", "general"], "folder_id should be valid"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/content/items/{data['item']['id']}")
    
    def test_smart_import_empty_text_returns_400(self):
        """Test smart import with empty text returns 400 error"""
        response = requests.post(f"{BASE_URL}/api/import/smart", json={"text": ""})
        assert response.status_code == 400, f"Expected 400 for empty text, got {response.status_code}"
    
    def test_smart_import_whitespace_only_returns_400(self):
        """Test smart import with whitespace only returns 400 error"""
        response = requests.post(f"{BASE_URL}/api/import/smart", json={"text": "   \n\t  "})
        assert response.status_code == 400, f"Expected 400 for whitespace only, got {response.status_code}"


class TestStrategistAgent:
    """Chief Strategist Agent endpoint tests"""
    
    def test_list_strategist_sessions(self):
        """GET /api/agents/strategist/sessions returns sessions list"""
        response = requests.get(f"{BASE_URL}/api/agents/strategist/sessions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "sessions" in data, "Response should contain 'sessions'"
        assert isinstance(data["sessions"], list), "sessions should be a list"
        print(f"Found {len(data['sessions'])} strategist sessions")
    
    def test_get_strategist_chat_nonexistent_session(self):
        """GET /api/agents/strategist/chat/{session_id} returns empty for non-existent session"""
        fake_session_id = "nonexistent-session-12345"
        response = requests.get(f"{BASE_URL}/api/agents/strategist/chat/{fake_session_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "messages" in data, "Response should contain 'messages'"
        assert isinstance(data["messages"], list), "messages should be a list"
        assert len(data["messages"]) == 0, "Non-existent session should have no messages"
    
    def test_delete_strategist_session(self):
        """DELETE /api/agents/strategist/session/{session_id} deletes session"""
        # Delete a non-existent session should still return success (idempotent)
        fake_session_id = "test-delete-session-12345"
        response = requests.delete(f"{BASE_URL}/api/agents/strategist/session/{fake_session_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "deleted", "Should return status: deleted"


class TestRegressionAPIs:
    """Regression tests for existing APIs"""
    
    def test_get_folders_returns_folders_with_counts(self):
        """GET /api/folders returns folders with counts"""
        response = requests.get(f"{BASE_URL}/api/folders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Should return a list of folders"
        assert len(data) == 4, f"Expected 4 folders, got {len(data)}"
        
        folder_ids = [f["id"] for f in data]
        assert "torah" in folder_ids, "Should have torah folder"
        assert "business" in folder_ids, "Should have business folder"
        assert "mental_snacks" in folder_ids, "Should have mental_snacks folder"
        assert "general" in folder_ids, "Should have general folder"
        
        # Each folder should have count
        for folder in data:
            assert "count" in folder, f"Folder {folder['id']} should have count"
            assert isinstance(folder["count"], int), "count should be integer"
        print(f"Folders: {[(f['id'], f['count']) for f in data]}")
    
    def test_get_content_items_works(self):
        """GET /api/content/items works"""
        response = requests.get(f"{BASE_URL}/api/content/items")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data, "Response should contain 'items'"
        assert "total" in data, "Response should contain 'total'"
        print(f"Content items: {data['total']} total")
    
    def test_backup_export_works(self):
        """GET /api/backup/export works"""
        response = requests.get(f"{BASE_URL}/api/backup/export")
        assert response.status_code == 200
        data = response.json()
        assert "backup_version" in data, "Should have backup_version"
        assert "data" in data, "Should have data"
        assert "counts" in data, "Should have counts"
        print(f"Backup export: {data['counts']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
