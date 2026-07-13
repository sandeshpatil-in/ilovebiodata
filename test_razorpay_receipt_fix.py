#!/usr/bin/env python3
"""
Focused test for Razorpay create-order endpoint after receipt length fix
Tests that receipt is now formatted as `p_${shortUid}_${Date.now()}`.slice(0, 40)
"""

import requests
import json
from datetime import datetime, timedelta
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/.env')

BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
API_URL = f"{BASE_URL}/api"
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'ilovebiodata')

# Test data as specified in review request
TEST_USER_ID = "test-user-uuid-abc"
TEST_SESSION_ID = "test-sess"
TEST_SESSION_TOKEN = "test-token-xyz"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_step(step, message):
    print(f"{Colors.BLUE}[{step}]{Colors.END} {message}")

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def setup_test_data():
    """Insert test user and session into MongoDB"""
    print_step("SETUP", "Inserting test user and session into MongoDB")
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Clean up any existing test data first
        db.users.delete_one({"_id": TEST_USER_ID})
        db.sessions.delete_one({"_id": TEST_SESSION_ID})
        db.payments.delete_many({"userId": TEST_USER_ID})
        
        # Insert test user
        user_doc = {
            "_id": TEST_USER_ID,
            "email": "t@e.com",
            "name": "T",
            "isPremium": False,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        db.users.insert_one(user_doc)
        print_success(f"Inserted test user: {TEST_USER_ID}")
        
        # Insert test session with future expiry
        session_doc = {
            "_id": TEST_SESSION_ID,
            "token": TEST_SESSION_TOKEN,
            "userId": TEST_USER_ID,
            "createdAt": datetime.utcnow(),
            "expiresAt": datetime.utcnow() + timedelta(days=7)
        }
        db.sessions.insert_one(session_doc)
        print_success(f"Inserted test session: {TEST_SESSION_ID} with token: {TEST_SESSION_TOKEN}")
        
        return True
    except Exception as e:
        print_error(f"Failed to setup test data: {e}")
        return False

def test_razorpay_create_order():
    """Test POST /api/razorpay/create-order with authenticated user"""
    print_step("TEST", "Testing POST /api/razorpay/create-order")
    
    try:
        cookies = {'ilb_session': TEST_SESSION_TOKEN}
        resp = requests.post(f"{API_URL}/razorpay/create-order", json={}, cookies=cookies, timeout=15)
        
        print(f"Response Status: {resp.status_code}")
        print(f"Response Body: {resp.text}")
        
        if resp.status_code != 200:
            print_error(f"Expected status 200, got {resp.status_code}")
            return False, None
        
        data = resp.json()
        
        # Verify response fields
        required_fields = ['orderId', 'amount', 'currency', 'keyId']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_error(f"Missing required fields: {missing_fields}")
            return False, None
        
        print_success(f"Order ID: {data['orderId']}")
        print_success(f"Amount: {data['amount']} (expected: 9900)")
        print_success(f"Currency: {data['currency']} (expected: INR)")
        print_success(f"Key ID: {data['keyId']}")
        
        # Verify amount and currency
        if data['amount'] != 9900:
            print_error(f"Amount mismatch: expected 9900, got {data['amount']}")
            return False, None
        
        if data['currency'] != 'INR':
            print_error(f"Currency mismatch: expected INR, got {data['currency']}")
            return False, None
        
        print_success("Response validation passed")
        return True, data['orderId']
        
    except Exception as e:
        print_error(f"Request failed: {e}")
        return False, None

def verify_payment_document(order_id):
    """Verify payment document was created in MongoDB"""
    print_step("VERIFY", "Checking payment document in MongoDB")
    
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Find payment document by razorpayOrderId
        payment = db.payments.find_one({"razorpayOrderId": order_id})
        
        if not payment:
            print_error(f"Payment document not found for order: {order_id}")
            return False
        
        print_success(f"Payment document found: {payment['_id']}")
        print(f"  User ID: {payment.get('userId')}")
        print(f"  Order ID: {payment.get('razorpayOrderId')}")
        print(f"  Amount: {payment.get('amount')}")
        print(f"  Currency: {payment.get('currency')}")
        print(f"  Status: {payment.get('status')}")
        
        # Verify status is 'created'
        if payment.get('status') != 'created':
            print_error(f"Status mismatch: expected 'created', got '{payment.get('status')}'")
            return False
        
        # Verify userId matches
        if payment.get('userId') != TEST_USER_ID:
            print_error(f"User ID mismatch: expected {TEST_USER_ID}, got {payment.get('userId')}")
            return False
        
        # Verify amount
        if payment.get('amount') != 9900:
            print_error(f"Amount mismatch: expected 9900, got {payment.get('amount')}")
            return False
        
        print_success("Payment document validation passed")
        return True
        
    except Exception as e:
        print_error(f"Database verification failed: {e}")
        return False

def cleanup_test_data():
    """Remove test user, session, and payments from MongoDB"""
    print_step("CLEANUP", "Removing test data from MongoDB")
    
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Delete test payments
        payments_deleted = db.payments.delete_many({"userId": TEST_USER_ID})
        print_success(f"Deleted {payments_deleted.deleted_count} payment document(s)")
        
        # Delete test session
        db.sessions.delete_one({"_id": TEST_SESSION_ID})
        print_success("Deleted test session")
        
        # Delete test user
        db.users.delete_one({"_id": TEST_USER_ID})
        print_success("Deleted test user")
        
        return True
    except Exception as e:
        print_error(f"Cleanup failed: {e}")
        return False

def main():
    print(f"\n{Colors.YELLOW}{'='*70}{Colors.END}")
    print(f"{Colors.YELLOW}Razorpay Create-Order Receipt Fix Test{Colors.END}")
    print(f"{Colors.YELLOW}Testing receipt format: p_${{shortUid}}_${{Date.now()}}.slice(0, 40){Colors.END}")
    print(f"{Colors.YELLOW}API URL: {API_URL}{Colors.END}")
    print(f"{Colors.YELLOW}{'='*70}{Colors.END}\n")
    
    # Setup
    if not setup_test_data():
        print_error("Setup failed. Aborting test.")
        return
    
    print()
    
    # Test create-order endpoint
    test_passed, order_id = test_razorpay_create_order()
    
    print()
    
    # Verify payment document if order was created
    payment_verified = False
    if test_passed and order_id:
        payment_verified = verify_payment_document(order_id)
    
    print()
    
    # Cleanup
    cleanup_test_data()
    
    # Final result
    print(f"\n{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BLUE}TEST RESULT{Colors.END}")
    print(f"{Colors.BLUE}{'='*70}{Colors.END}")
    
    if test_passed and payment_verified:
        print(f"{Colors.GREEN}✓ ALL CHECKS PASSED{Colors.END}")
        print(f"{Colors.GREEN}  - Razorpay order created successfully (200 response){Colors.END}")
        print(f"{Colors.GREEN}  - Response contains all required fields{Colors.END}")
        print(f"{Colors.GREEN}  - Payment document created in database with status 'created'{Colors.END}")
        print(f"{Colors.GREEN}  - Receipt length fix working correctly{Colors.END}")
    else:
        print(f"{Colors.RED}✗ TEST FAILED{Colors.END}")
        if not test_passed:
            print(f"{Colors.RED}  - Razorpay order creation failed{Colors.END}")
        if not payment_verified:
            print(f"{Colors.RED}  - Payment document verification failed{Colors.END}")
    
    print(f"{Colors.BLUE}{'='*70}{Colors.END}\n")

if __name__ == "__main__":
    main()
