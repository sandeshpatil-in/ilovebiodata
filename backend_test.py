#!/usr/bin/env python3
"""
Backend API Test Suite for ILoveBiodata
Tests all API endpoints with authentication and authorization scenarios
"""

import requests
import json
from datetime import datetime, timedelta
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/.env')

BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://vivah-bandhpatra.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'ilovebiodata')

# Test data
TEST_USER_ID = "test-user-uuid-12345"
TEST_SESSION_ID = "test-session-uuid-67890"
TEST_SESSION_TOKEN = "test-token-xyz-abc-123"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name, passed, details=""):
    status = f"{Colors.GREEN}✓ PASS{Colors.END}" if passed else f"{Colors.RED}✗ FAIL{Colors.END}"
    print(f"{status} | {name}")
    if details:
        print(f"      {details}")

def print_section(name):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}{name}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")

def setup_test_user():
    """Insert test user and session into MongoDB"""
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Insert test user
        user_doc = {
            "_id": TEST_USER_ID,
            "email": "test@example.com",
            "name": "Test User",
            "picture": "",
            "emergentId": "test-emergent-id",
            "isPremium": False,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        db.users.delete_one({"_id": TEST_USER_ID})
        db.users.insert_one(user_doc)
        
        # Insert test session
        session_doc = {
            "_id": TEST_SESSION_ID,
            "token": TEST_SESSION_TOKEN,
            "userId": TEST_USER_ID,
            "createdAt": datetime.utcnow(),
            "expiresAt": datetime.utcnow() + timedelta(days=7)
        }
        db.sessions.delete_one({"_id": TEST_SESSION_ID})
        db.sessions.insert_one(session_doc)
        
        print(f"{Colors.GREEN}✓ Test user and session created in MongoDB{Colors.END}")
        return True
    except Exception as e:
        print(f"{Colors.RED}✗ Failed to setup test user: {e}{Colors.END}")
        return False

def cleanup_test_data():
    """Remove test user, session, and biodatas from MongoDB"""
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Delete test biodatas
        db.biodatas.delete_many({"userId": TEST_USER_ID})
        
        # Delete test session
        db.sessions.delete_one({"_id": TEST_SESSION_ID})
        
        # Delete test user
        db.users.delete_one({"_id": TEST_USER_ID})
        
        print(f"{Colors.GREEN}✓ Test data cleaned up from MongoDB{Colors.END}")
        return True
    except Exception as e:
        print(f"{Colors.RED}✗ Failed to cleanup test data: {e}{Colors.END}")
        return False

def test_health():
    """Test 1: GET /api/health"""
    print_section("Test 1: Health Endpoint")
    try:
        resp = requests.get(f"{API_URL}/health", timeout=10)
        passed = (
            resp.status_code == 200 and
            resp.json().get('ok') == True and
            resp.json().get('service') == 'ilovebiodata'
        )
        print_test("GET /api/health", passed, f"Status: {resp.status_code}, Response: {resp.json()}")
        return passed
    except Exception as e:
        print_test("GET /api/health", False, f"Error: {e}")
        return False

def test_auth_me_no_cookie():
    """Test 2: GET /api/auth/me (no cookie)"""
    print_section("Test 2: Auth Me - No Cookie")
    try:
        resp = requests.get(f"{API_URL}/auth/me", timeout=10)
        passed = (
            resp.status_code == 200 and
            resp.json().get('user') is None
        )
        print_test("GET /api/auth/me (no cookie)", passed, f"Status: {resp.status_code}, Response: {resp.json()}")
        return passed
    except Exception as e:
        print_test("GET /api/auth/me (no cookie)", False, f"Error: {e}")
        return False

def test_auth_session_missing_id():
    """Test 3: POST /api/auth/session with empty body"""
    print_section("Test 3: Auth Session - Missing session_id")
    try:
        resp = requests.post(f"{API_URL}/auth/session", json={}, timeout=10)
        passed = (
            resp.status_code == 400 and
            'session_id required' in resp.json().get('error', '')
        )
        print_test("POST /api/auth/session (empty body)", passed, f"Status: {resp.status_code}, Response: {resp.json()}")
        return passed
    except Exception as e:
        print_test("POST /api/auth/session (empty body)", False, f"Error: {e}")
        return False

def test_auth_session_invalid_id():
    """Test 4: POST /api/auth/session with invalid session_id"""
    print_section("Test 4: Auth Session - Invalid session_id")
    try:
        resp = requests.post(f"{API_URL}/auth/session", json={"session_id": "invalid_fake_id"}, timeout=10)
        passed = (
            resp.status_code == 401 and
            'Invalid Emergent session' in resp.json().get('error', '')
        )
        print_test("POST /api/auth/session (invalid id)", passed, f"Status: {resp.status_code}, Response: {resp.json()}")
        return passed
    except Exception as e:
        print_test("POST /api/auth/session (invalid id)", False, f"Error: {e}")
        return False

def test_auth_logout_no_cookie():
    """Test 5: POST /api/auth/logout with no cookie"""
    print_section("Test 5: Auth Logout - No Cookie")
    try:
        resp = requests.post(f"{API_URL}/auth/logout", timeout=10)
        passed = resp.status_code == 200
        print_test("POST /api/auth/logout (no cookie)", passed, f"Status: {resp.status_code}, Response: {resp.json()}")
        return passed
    except Exception as e:
        print_test("POST /api/auth/logout (no cookie)", False, f"Error: {e}")
        return False

def test_biodatas_get_no_auth():
    """Test 6: GET /api/biodatas (no cookie)"""
    print_section("Test 6: Biodatas GET - No Auth")
    try:
        resp = requests.get(f"{API_URL}/biodatas", timeout=10)
        passed = (
            resp.status_code == 401 and
            'Unauthorized' in resp.json().get('error', '')
        )
        print_test("GET /api/biodatas (no auth)", passed, f"Status: {resp.status_code}, Response: {resp.json()}")
        return passed
    except Exception as e:
        print_test("GET /api/biodatas (no auth)", False, f"Error: {e}")
        return False

def test_biodatas_post_no_auth():
    """Test 7: POST /api/biodatas (no cookie)"""
    print_section("Test 7: Biodatas POST - No Auth")
    try:
        resp = requests.post(f"{API_URL}/biodatas", json={"data": {}, "template": "t1"}, timeout=10)
        passed = (
            resp.status_code == 401 and
            'Unauthorized' in resp.json().get('error', '')
        )
        print_test("POST /api/biodatas (no auth)", passed, f"Status: {resp.status_code}, Response: {resp.json()}")
        return passed
    except Exception as e:
        print_test("POST /api/biodatas (no auth)", False, f"Error: {e}")
        return False

def test_biodatas_delete_no_auth():
    """Test 8: DELETE /api/biodatas/:id (no cookie)"""
    print_section("Test 8: Biodatas DELETE - No Auth")
    try:
        resp = requests.delete(f"{API_URL}/biodatas/anyid", timeout=10)
        passed = (
            resp.status_code == 401 and
            'Unauthorized' in resp.json().get('error', '')
        )
        print_test("DELETE /api/biodatas/anyid (no auth)", passed, f"Status: {resp.status_code}, Response: {resp.json()}")
        return passed
    except Exception as e:
        print_test("DELETE /api/biodatas/anyid (no auth)", False, f"Error: {e}")
        return False

def test_razorpay_create_order_no_auth():
    """Test 9: POST /api/razorpay/create-order (no cookie)"""
    print_section("Test 9: Razorpay Create Order - No Auth")
    try:
        resp = requests.post(f"{API_URL}/razorpay/create-order", json={}, timeout=10)
        passed = (
            resp.status_code == 401 and
            'Unauthorized' in resp.json().get('error', '')
        )
        print_test("POST /api/razorpay/create-order (no auth)", passed, f"Status: {resp.status_code}, Response: {resp.json()}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/create-order (no auth)", False, f"Error: {e}")
        return False

def test_razorpay_verify_no_auth():
    """Test 10: POST /api/razorpay/verify (no cookie)"""
    print_section("Test 10: Razorpay Verify - No Auth")
    try:
        resp = requests.post(f"{API_URL}/razorpay/verify", json={}, timeout=10)
        passed = (
            resp.status_code == 401 and
            'Unauthorized' in resp.json().get('error', '')
        )
        print_test("POST /api/razorpay/verify (no auth)", passed, f"Status: {resp.status_code}, Response: {resp.json()}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/verify (no auth)", False, f"Error: {e}")
        return False

# Authenticated tests
def test_auth_me_with_cookie():
    """Test 11a: GET /api/auth/me with valid cookie"""
    print_section("Test 11a: Auth Me - With Valid Cookie")
    try:
        cookies = {'ilb_session': TEST_SESSION_TOKEN}
        resp = requests.get(f"{API_URL}/auth/me", cookies=cookies, timeout=10)
        data = resp.json()
        passed = (
            resp.status_code == 200 and
            data.get('user') is not None and
            data['user'].get('id') == TEST_USER_ID and
            data['user'].get('email') == 'test@example.com' and
            data['user'].get('name') == 'Test User' and
            data['user'].get('isPremium') == False
        )
        print_test("GET /api/auth/me (with cookie)", passed, f"Status: {resp.status_code}, User: {data.get('user')}")
        return passed
    except Exception as e:
        print_test("GET /api/auth/me (with cookie)", False, f"Error: {e}")
        return False

def test_biodatas_get_empty():
    """Test 11b: GET /api/biodatas with cookie (empty list)"""
    print_section("Test 11b: Biodatas GET - Empty List")
    try:
        cookies = {'ilb_session': TEST_SESSION_TOKEN}
        resp = requests.get(f"{API_URL}/biodatas", cookies=cookies, timeout=10)
        data = resp.json()
        passed = (
            resp.status_code == 200 and
            'items' in data and
            isinstance(data['items'], list) and
            len(data['items']) == 0
        )
        print_test("GET /api/biodatas (empty)", passed, f"Status: {resp.status_code}, Items: {len(data.get('items', []))}")
        return passed
    except Exception as e:
        print_test("GET /api/biodatas (empty)", False, f"Error: {e}")
        return False

def test_biodatas_create():
    """Test 11c: POST /api/biodatas with cookie"""
    print_section("Test 11c: Biodatas POST - Create")
    try:
        cookies = {'ilb_session': TEST_SESSION_TOKEN}
        payload = {
            "data": {
                "firstName": "राम",
                "lastName": "पाटील"
            },
            "template": "t1"
        }
        resp = requests.post(f"{API_URL}/biodatas", json=payload, cookies=cookies, timeout=10)
        data = resp.json()
        passed = (
            resp.status_code == 200 and
            data.get('ok') == True and
            'id' in data and
            'item' in data
        )
        print_test("POST /api/biodatas (create)", passed, f"Status: {resp.status_code}, ID: {data.get('id')}")
        return passed, data.get('id')
    except Exception as e:
        print_test("POST /api/biodatas (create)", False, f"Error: {e}")
        return False, None

def test_biodatas_get_with_items():
    """Test 11d: GET /api/biodatas with cookie (should have 1 item)"""
    print_section("Test 11d: Biodatas GET - With Items")
    try:
        cookies = {'ilb_session': TEST_SESSION_TOKEN}
        resp = requests.get(f"{API_URL}/biodatas", cookies=cookies, timeout=10)
        data = resp.json()
        passed = (
            resp.status_code == 200 and
            'items' in data and
            isinstance(data['items'], list) and
            len(data['items']) == 1
        )
        print_test("GET /api/biodatas (with items)", passed, f"Status: {resp.status_code}, Items count: {len(data.get('items', []))}")
        return passed
    except Exception as e:
        print_test("GET /api/biodatas (with items)", False, f"Error: {e}")
        return False

def test_biodatas_get_by_id(biodata_id):
    """Test 11e: GET /api/biodatas/:id with cookie"""
    print_section("Test 11e: Biodatas GET by ID")
    try:
        cookies = {'ilb_session': TEST_SESSION_TOKEN}
        resp = requests.get(f"{API_URL}/biodatas/{biodata_id}", cookies=cookies, timeout=10)
        data = resp.json()
        passed = (
            resp.status_code == 200 and
            'item' in data and
            data['item'].get('_id') == biodata_id
        )
        print_test(f"GET /api/biodatas/{biodata_id}", passed, f"Status: {resp.status_code}, Item ID: {data.get('item', {}).get('_id')}")
        return passed
    except Exception as e:
        print_test(f"GET /api/biodatas/{biodata_id}", False, f"Error: {e}")
        return False

def test_biodatas_delete(biodata_id):
    """Test 11f: DELETE /api/biodatas/:id with cookie"""
    print_section("Test 11f: Biodatas DELETE")
    try:
        cookies = {'ilb_session': TEST_SESSION_TOKEN}
        resp = requests.delete(f"{API_URL}/biodatas/{biodata_id}", cookies=cookies, timeout=10)
        data = resp.json()
        passed = (
            resp.status_code == 200 and
            data.get('ok') == True
        )
        print_test(f"DELETE /api/biodatas/{biodata_id}", passed, f"Status: {resp.status_code}, Response: {data}")
        return passed
    except Exception as e:
        print_test(f"DELETE /api/biodatas/{biodata_id}", False, f"Error: {e}")
        return False

def test_razorpay_create_order():
    """Test 11g: POST /api/razorpay/create-order with cookie"""
    print_section("Test 11g: Razorpay Create Order - Authenticated")
    try:
        cookies = {'ilb_session': TEST_SESSION_TOKEN}
        resp = requests.post(f"{API_URL}/razorpay/create-order", json={}, cookies=cookies, timeout=10)
        data = resp.json()
        passed = (
            resp.status_code == 200 and
            'orderId' in data and
            data.get('amount') == 9900 and
            data.get('currency') == 'INR' and
            'keyId' in data
        )
        print_test("POST /api/razorpay/create-order (auth)", passed, f"Status: {resp.status_code}, Order ID: {data.get('orderId')}, Amount: {data.get('amount')}")
        return passed, data.get('orderId')
    except Exception as e:
        print_test("POST /api/razorpay/create-order (auth)", False, f"Error: {e}")
        return False, None

def test_razorpay_verify_invalid_order():
    """Test 11h: POST /api/razorpay/verify with invalid order"""
    print_section("Test 11h: Razorpay Verify - Invalid Order")
    try:
        cookies = {'ilb_session': TEST_SESSION_TOKEN}
        payload = {
            "orderId": "invalid",
            "razorpay_order_id": "invalid",
            "razorpay_payment_id": "pay_x",
            "razorpay_signature": "x"
        }
        resp = requests.post(f"{API_URL}/razorpay/verify", json=payload, cookies=cookies, timeout=10)
        data = resp.json()
        passed = (
            resp.status_code == 404 and
            'Order not found' in data.get('error', '')
        )
        print_test("POST /api/razorpay/verify (invalid order)", passed, f"Status: {resp.status_code}, Response: {data}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/verify (invalid order)", False, f"Error: {e}")
        return False

def test_razorpay_verify_missing_fields():
    """Test 11i: POST /api/razorpay/verify with missing fields"""
    print_section("Test 11i: Razorpay Verify - Missing Fields")
    try:
        cookies = {'ilb_session': TEST_SESSION_TOKEN}
        resp = requests.post(f"{API_URL}/razorpay/verify", json={}, cookies=cookies, timeout=10)
        data = resp.json()
        passed = (
            resp.status_code == 400 and
            'Missing fields' in data.get('error', '')
        )
        print_test("POST /api/razorpay/verify (missing fields)", passed, f"Status: {resp.status_code}, Response: {data}")
        return passed
    except Exception as e:
        print_test("POST /api/razorpay/verify (missing fields)", False, f"Error: {e}")
        return False

def main():
    print(f"\n{Colors.YELLOW}{'='*60}{Colors.END}")
    print(f"{Colors.YELLOW}ILoveBiodata Backend API Test Suite{Colors.END}")
    print(f"{Colors.YELLOW}Base URL: {API_URL}{Colors.END}")
    print(f"{Colors.YELLOW}{'='*60}{Colors.END}")
    
    results = []
    
    # Tests 1-10: Unauthenticated tests
    results.append(("Health endpoint", test_health()))
    results.append(("Auth me - no cookie", test_auth_me_no_cookie()))
    results.append(("Auth session - missing session_id", test_auth_session_missing_id()))
    results.append(("Auth session - invalid session_id", test_auth_session_invalid_id()))
    results.append(("Auth logout - no cookie", test_auth_logout_no_cookie()))
    results.append(("Biodatas GET - no auth", test_biodatas_get_no_auth()))
    results.append(("Biodatas POST - no auth", test_biodatas_post_no_auth()))
    results.append(("Biodatas DELETE - no auth", test_biodatas_delete_no_auth()))
    results.append(("Razorpay create-order - no auth", test_razorpay_create_order_no_auth()))
    results.append(("Razorpay verify - no auth", test_razorpay_verify_no_auth()))
    
    # Setup test user for authenticated tests
    print_section("Setting up test user and session")
    if not setup_test_user():
        print(f"{Colors.RED}Failed to setup test user. Skipping authenticated tests.{Colors.END}")
        print_summary(results)
        return
    
    # Tests 11a-11i: Authenticated tests
    results.append(("Auth me - with cookie", test_auth_me_with_cookie()))
    results.append(("Biodatas GET - empty list", test_biodatas_get_empty()))
    
    create_result, biodata_id = test_biodatas_create()
    results.append(("Biodatas POST - create", create_result))
    
    if biodata_id:
        results.append(("Biodatas GET - with items", test_biodatas_get_with_items()))
        results.append(("Biodatas GET by ID", test_biodatas_get_by_id(biodata_id)))
        results.append(("Biodatas DELETE", test_biodatas_delete(biodata_id)))
    else:
        print(f"{Colors.YELLOW}Skipping biodata GET/DELETE tests due to creation failure{Colors.END}")
    
    order_result, order_id = test_razorpay_create_order()
    results.append(("Razorpay create-order - auth", order_result))
    
    results.append(("Razorpay verify - invalid order", test_razorpay_verify_invalid_order()))
    results.append(("Razorpay verify - missing fields", test_razorpay_verify_missing_fields()))
    
    # Cleanup
    print_section("Cleaning up test data")
    cleanup_test_data()
    
    # Print summary
    print_summary(results)

def print_summary(results):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}TEST SUMMARY{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = f"{Colors.GREEN}✓{Colors.END}" if result else f"{Colors.RED}✗{Colors.END}"
        print(f"{status} {name}")
    
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    if passed == total:
        print(f"{Colors.GREEN}ALL TESTS PASSED: {passed}/{total}{Colors.END}")
    else:
        print(f"{Colors.YELLOW}TESTS PASSED: {passed}/{total}{Colors.END}")
        print(f"{Colors.RED}TESTS FAILED: {total - passed}/{total}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")

if __name__ == "__main__":
    main()
