import requests
import sys
import json
from datetime import datetime

class Orbit360APITester:
    def __init__(self, base_url="https://strategic-inbox.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:500]}")

            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_preview": response.text[:200] if not success else "OK"
            })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "response_preview": str(e)
            })
            return False, {}

    def test_folders_api(self):
        """Test folders endpoint"""
        success, response = self.run_test(
            "Get Folders",
            "GET",
            "folders",
            200
        )
        if success:
            folders = response
            print(f"   Found {len(folders)} folders")
            expected_folders = ["torah", "business", "mental_snacks", "general"]
            for folder in folders:
                if folder.get("id") in expected_folders:
                    print(f"   ✓ Folder '{folder.get('name')}' found with {folder.get('count', 0)} items")
        return success

    def test_content_crud(self):
        """Test content CRUD operations"""
        # Test GET content items
        success, response = self.run_test(
            "Get Content Items",
            "GET",
            "content/items",
            200
        )
        if not success:
            return False

        # Test POST create content item
        test_item = {
            "title": f"Test Item {datetime.now().strftime('%H:%M:%S')}",
            "content": "This is a test content item for API testing",
            "folder_id": "general",
            "source_type": "manual"
        }
        
        success, response = self.run_test(
            "Create Content Item",
            "POST",
            "content/items",
            200,
            data=test_item
        )
        
        if not success:
            return False
            
        item_id = response.get("id")
        if not item_id:
            print("❌ No item ID returned from create")
            return False

        # Test GET single content item
        success, response = self.run_test(
            "Get Single Content Item",
            "GET",
            f"content/items/{item_id}",
            200
        )
        
        if not success:
            return False

        # Test DELETE content item
        success, response = self.run_test(
            "Delete Content Item",
            "DELETE",
            f"content/items/{item_id}",
            200
        )
        
        return success

    def test_marketing_dna(self):
        """Test marketing DNA settings"""
        # Test GET marketing DNA
        success, response = self.run_test(
            "Get Marketing DNA",
            "GET",
            "settings/marketing-dna",
            200
        )
        
        if not success:
            return False

        # Test PUT update marketing DNA
        test_dna = {
            "writing_style": "Test style - professional",
            "tone": "Test tone - friendly",
            "target_audience": "Test audience",
            "brand_values": "Test values",
            "custom_instructions": "Test instructions"
        }
        
        success, response = self.run_test(
            "Update Marketing DNA",
            "PUT",
            "settings/marketing-dna",
            200,
            data=test_dna
        )
        
        return success

    def test_search_api(self):
        """Test search functionality"""
        success, response = self.run_test(
            "Smart Search",
            "GET",
            "search",
            200,
            params={"q": "test"}
        )
        return success

    def test_daily_snack(self):
        """Test daily snack endpoint"""
        success, response = self.run_test(
            "Get Daily Snack",
            "GET",
            "daily-snack",
            200
        )
        return success

    def test_history_api(self):
        """Test history endpoint"""
        success, response = self.run_test(
            "Get History",
            "GET",
            "history",
            200
        )
        
        if success:
            # Test with filters
            success2, response2 = self.run_test(
                "Get History with Filters",
                "GET",
                "history",
                200,
                params={"source_type": "manual", "limit": 10}
            )
            return success2
        
        return success

def main():
    print("🚀 Starting Orbit360 Engine API Tests")
    print("=" * 50)
    
    # Setup
    tester = Orbit360APITester()
    
    # Run all tests
    test_methods = [
        ("Folders API", tester.test_folders_api),
        ("Content CRUD", tester.test_content_crud),
        ("Marketing DNA", tester.test_marketing_dna),
        ("Search API", tester.test_search_api),
        ("Daily Snack", tester.test_daily_snack),
        ("History API", tester.test_history_api),
    ]
    
    failed_tests = []
    
    for test_name, test_method in test_methods:
        print(f"\n📋 Running {test_name} tests...")
        try:
            if not test_method():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            failed_tests.append(test_name)
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"❌ Failed test categories: {', '.join(failed_tests)}")
    else:
        print("✅ All test categories passed!")
    
    # Print detailed results
    print("\n📋 Detailed Results:")
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['name']} - {result['actual_status']}")
        if not result["success"]:
            print(f"   Error: {result['response_preview']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())