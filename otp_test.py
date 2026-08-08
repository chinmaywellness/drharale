#!/usr/bin/env python3
"""
OTP Flow Re-test for Chinmay Wellness Club
Tests the OTP authentication flow with MongoDB code verification
"""

import requests
import json
from pymongo import MongoClient
import time

# Configuration
BASE_URL = "https://chinmay-wellness.preview.emergentagent.com/api"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "chinmay_wellness"
ADMIN_EMAIL = "samfonde0@gmail.com"
NON_ADMIN_EMAIL = "random_notadmin@example.com"

# MongoDB connection
mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]
otps_collection = db['otps']

# Test results
test_results = {
    "passed": [],
    "failed": [],
    "details": []
}

def log_pass(test_name, detail=""):
    print(f"✅ PASS: {test_name}")
    if detail:
        print(f"   {detail}")
    test_results["passed"].append(test_name)
    test_results["details"].append(f"✅ {test_name}: {detail}")

def log_fail(test_name, reason):
    print(f"❌ FAIL: {test_name}")
    print(f"   Reason: {reason}")
    test_results["failed"].append(f"{test_name}: {reason}")
    test_results["details"].append(f"❌ {test_name}: {reason}")

def get_otp_from_db(email):
    """Read OTP code from MongoDB for given email"""
    otp_doc = otps_collection.find_one({"email": email.lower()})
    if otp_doc:
        return otp_doc.get('code')
    return None

def clear_otp_from_db(email):
    """Clear OTP from database"""
    otps_collection.delete_one({"email": email.lower()})

print("=" * 80)
print("CHINMAY WELLNESS CLUB - OTP FLOW RE-TEST")
print("=" * 80)
print(f"Base URL: {BASE_URL}")
print(f"MongoDB: {MONGO_URL}/{DB_NAME}")
print(f"Admin Email: {ADMIN_EMAIL}")
print("=" * 80)

# Clean up any existing OTP for admin email before starting
print("\n🧹 Cleaning up existing OTPs...")
clear_otp_from_db(ADMIN_EMAIL)
clear_otp_from_db(NON_ADMIN_EMAIL)
print("✓ Cleanup complete")

# ============================================================================
# TEST 1: HAPPY PATH - Full OTP flow with MongoDB verification
# ============================================================================
print("\n" + "=" * 80)
print("TEST 1: HAPPY PATH - Full OTP Flow")
print("=" * 80)

session_cookie = None

try:
    # Step 1: Send OTP
    print("\n[1.1] Sending OTP to admin email...")
    response = requests.post(
        f"{BASE_URL}/auth/send-otp",
        json={"email": ADMIN_EMAIL},
        timeout=10
    )
    
    if response.status_code != 200:
        log_fail("Happy Path - send-otp", f"Expected 200, got {response.status_code}")
    else:
        data = response.json()
        if not data.get('ok'):
            log_fail("Happy Path - send-otp", f"Expected ok=true, got {data}")
        else:
            log_pass("Happy Path - send-otp", f"Status: {response.status_code}, Response: {data}")
            
            # Step 2: Read OTP from MongoDB
            print("\n[1.2] Reading OTP code from MongoDB...")
            time.sleep(0.5)  # Small delay to ensure DB write completes
            otp_code = get_otp_from_db(ADMIN_EMAIL)
            
            if not otp_code:
                log_fail("Happy Path - read OTP from DB", "No OTP found in MongoDB")
            else:
                log_pass("Happy Path - read OTP from DB", f"Code retrieved: {otp_code}")
                
                # Step 3: Verify OTP
                print("\n[1.3] Verifying OTP...")
                verify_response = requests.post(
                    f"{BASE_URL}/auth/verify-otp",
                    json={"email": ADMIN_EMAIL, "code": str(otp_code)},
                    timeout=10
                )
                
                if verify_response.status_code != 200:
                    log_fail("Happy Path - verify-otp", f"Expected 200, got {verify_response.status_code}, Response: {verify_response.text}")
                else:
                    verify_data = verify_response.json()
                    if not verify_data.get('ok'):
                        log_fail("Happy Path - verify-otp", f"Expected ok=true, got {verify_data}")
                    else:
                        # Check for cwc_session cookie
                        cookies = verify_response.cookies
                        if 'cwc_session' not in cookies:
                            log_fail("Happy Path - verify-otp cookie", "cwc_session cookie not found in response")
                        else:
                            session_cookie = cookies['cwc_session']
                            # Check if cookie is HttpOnly (we can't directly check from Python requests, but we can verify it's set)
                            log_pass("Happy Path - verify-otp", f"Status: 200, ok=true, email={verify_data.get('email')}, cwc_session cookie set")
                            
except Exception as e:
    log_fail("Happy Path", f"Exception: {str(e)}")

# ============================================================================
# TEST 2: SESSION VALIDATION - /auth/me and /admin/leads with/without cookie
# ============================================================================
print("\n" + "=" * 80)
print("TEST 2: SESSION VALIDATION")
print("=" * 80)

if session_cookie:
    # Test /auth/me WITH cookie
    try:
        print("\n[2.1] Testing GET /auth/me WITH session cookie...")
        response = requests.get(
            f"{BASE_URL}/auth/me",
            cookies={"cwc_session": session_cookie},
            timeout=10
        )
        
        if response.status_code != 200:
            log_fail("Session - /auth/me with cookie", f"Expected 200, got {response.status_code}")
        else:
            data = response.json()
            if data.get('authenticated') != True or data.get('email') != ADMIN_EMAIL:
                log_fail("Session - /auth/me with cookie", f"Expected authenticated=true and email={ADMIN_EMAIL}, got {data}")
            else:
                log_pass("Session - /auth/me with cookie", f"Status: 200, authenticated=true, email={ADMIN_EMAIL}")
    except Exception as e:
        log_fail("Session - /auth/me with cookie", f"Exception: {str(e)}")
    
    # Test /admin/leads WITH cookie
    try:
        print("\n[2.2] Testing GET /admin/leads WITH session cookie...")
        response = requests.get(
            f"{BASE_URL}/admin/leads",
            cookies={"cwc_session": session_cookie},
            timeout=10
        )
        
        if response.status_code != 200:
            log_fail("Session - /admin/leads with cookie", f"Expected 200, got {response.status_code}")
        else:
            data = response.json()
            if not isinstance(data, list):
                log_fail("Session - /admin/leads with cookie", f"Expected array, got {type(data)}")
            else:
                log_pass("Session - /admin/leads with cookie", f"Status: 200, returned array with {len(data)} items")
    except Exception as e:
        log_fail("Session - /admin/leads with cookie", f"Exception: {str(e)}")

# Test /admin/leads WITHOUT cookie
try:
    print("\n[2.3] Testing GET /admin/leads WITHOUT session cookie...")
    response = requests.get(
        f"{BASE_URL}/admin/leads",
        timeout=10
    )
    
    if response.status_code != 401:
        log_fail("Session - /admin/leads without cookie", f"Expected 401, got {response.status_code}")
    else:
        log_pass("Session - /admin/leads without cookie", f"Status: 401 (correctly rejected)")
except Exception as e:
    log_fail("Session - /admin/leads without cookie", f"Exception: {str(e)}")

# ============================================================================
# TEST 3: ONE-TIME USE - Verify with same code again should fail
# ============================================================================
print("\n" + "=" * 80)
print("TEST 3: ONE-TIME USE - Code should be consumed after first use")
print("=" * 80)

try:
    print("\n[3.1] Attempting to verify with the same code again...")
    # The code should have been deleted after successful verification in Test 1
    # Let's try to verify again with a code (any code, since it should be deleted)
    
    # First, check if code still exists in DB
    remaining_code = get_otp_from_db(ADMIN_EMAIL)
    if remaining_code:
        log_fail("One-time use - DB check", f"Code still exists in DB after successful verification: {remaining_code}")
    else:
        log_pass("One-time use - DB check", "Code correctly deleted from DB after successful verification")
    
    # Try to verify with any code (should fail since no code exists)
    response = requests.post(
        f"{BASE_URL}/auth/verify-otp",
        json={"email": ADMIN_EMAIL, "code": "123456"},
        timeout=10
    )
    
    if response.status_code != 401:
        log_fail("One-time use - verify again", f"Expected 401, got {response.status_code}")
    else:
        log_pass("One-time use - verify again", f"Status: 401 (correctly rejected reuse)")
        
except Exception as e:
    log_fail("One-time use", f"Exception: {str(e)}")

# ============================================================================
# TEST 4: WRONG CODE - Should return 401
# ============================================================================
print("\n" + "=" * 80)
print("TEST 4: WRONG CODE - Verify with incorrect code")
print("=" * 80)

try:
    # Clean up and send new OTP
    print("\n[4.1] Sending new OTP...")
    clear_otp_from_db(ADMIN_EMAIL)
    response = requests.post(
        f"{BASE_URL}/auth/send-otp",
        json={"email": ADMIN_EMAIL},
        timeout=10
    )
    
    if response.status_code != 200:
        log_fail("Wrong code - send-otp", f"Expected 200, got {response.status_code}")
    else:
        time.sleep(0.5)
        real_code = get_otp_from_db(ADMIN_EMAIL)
        
        print(f"\n[4.2] Real code in DB: {real_code}, attempting with wrong code: 000000...")
        
        # Try with wrong code
        response = requests.post(
            f"{BASE_URL}/auth/verify-otp",
            json={"email": ADMIN_EMAIL, "code": "000000"},
            timeout=10
        )
        
        if response.status_code != 401:
            log_fail("Wrong code - verify", f"Expected 401, got {response.status_code}")
        else:
            log_pass("Wrong code - verify", f"Status: 401 (correctly rejected wrong code)")
            
except Exception as e:
    log_fail("Wrong code", f"Exception: {str(e)}")

# ============================================================================
# TEST 5: RE-SEND REUSE WINDOW (CORE FIX) - Code should be reused within 90s
# ============================================================================
print("\n" + "=" * 80)
print("TEST 5: RE-SEND REUSE WINDOW (CORE FIX) - Code reuse within 90 seconds")
print("=" * 80)

try:
    # Clean up
    print("\n[5.1] Cleaning up and sending first OTP...")
    clear_otp_from_db(ADMIN_EMAIL)
    
    # First send-otp
    response1 = requests.post(
        f"{BASE_URL}/auth/send-otp",
        json={"email": ADMIN_EMAIL},
        timeout=10
    )
    
    if response1.status_code != 200:
        log_fail("Reuse window - first send-otp", f"Expected 200, got {response1.status_code}")
    else:
        time.sleep(0.5)
        code_A = get_otp_from_db(ADMIN_EMAIL)
        print(f"   Code A: {code_A}")
        
        if not code_A:
            log_fail("Reuse window - read code A", "No code found in DB after first send")
        else:
            # Second send-otp (within 90 seconds)
            print("\n[5.2] Sending OTP again (within 90 seconds)...")
            time.sleep(1)  # Small delay but well within 90s
            
            response2 = requests.post(
                f"{BASE_URL}/auth/send-otp",
                json={"email": ADMIN_EMAIL},
                timeout=10
            )
            
            if response2.status_code != 200:
                log_fail("Reuse window - second send-otp", f"Expected 200, got {response2.status_code}")
            else:
                time.sleep(0.5)
                code_B = get_otp_from_db(ADMIN_EMAIL)
                print(f"   Code B: {code_B}")
                
                if not code_B:
                    log_fail("Reuse window - read code B", "No code found in DB after second send")
                else:
                    # CRITICAL CHECK: A should equal B
                    print(f"\n[5.3] Comparing codes: A={code_A}, B={code_B}")
                    
                    if code_A != code_B:
                        log_fail("Reuse window - code comparison", f"CODES DO NOT MATCH! A={code_A}, B={code_B}. The reuse fix is NOT working.")
                    else:
                        log_pass("Reuse window - code comparison", f"✓ CODES MATCH! A={code_A}, B={code_B}. Reuse window working correctly.")
                        
                        # Now verify with the reused code
                        print("\n[5.4] Verifying with the reused code...")
                        verify_response = requests.post(
                            f"{BASE_URL}/auth/verify-otp",
                            json={"email": ADMIN_EMAIL, "code": str(code_B)},
                            timeout=10
                        )
                        
                        if verify_response.status_code != 200:
                            log_fail("Reuse window - verify", f"Expected 200, got {verify_response.status_code}")
                        else:
                            verify_data = verify_response.json()
                            if not verify_data.get('ok'):
                                log_fail("Reuse window - verify", f"Expected ok=true, got {verify_data}")
                            else:
                                log_pass("Reuse window - verify", f"Status: 200, ok=true. Verification successful with reused code.")
                                
except Exception as e:
    log_fail("Reuse window", f"Exception: {str(e)}")

# ============================================================================
# TEST 6: NON-ADMIN EMAIL - Should not create code in DB
# ============================================================================
print("\n" + "=" * 80)
print("TEST 6: NON-ADMIN EMAIL - Non-enumerating response, no code in DB")
print("=" * 80)

try:
    # Clean up
    print(f"\n[6.1] Sending OTP to non-admin email: {NON_ADMIN_EMAIL}...")
    clear_otp_from_db(NON_ADMIN_EMAIL)
    
    response = requests.post(
        f"{BASE_URL}/auth/send-otp",
        json={"email": NON_ADMIN_EMAIL},
        timeout=10
    )
    
    if response.status_code != 200:
        log_fail("Non-admin - send-otp", f"Expected 200 (non-enumerating), got {response.status_code}")
    else:
        data = response.json()
        if not data.get('ok'):
            log_fail("Non-admin - send-otp response", f"Expected ok=true (non-enumerating), got {data}")
        else:
            log_pass("Non-admin - send-otp", f"Status: 200, ok=true (non-enumerating response)")
            
            # Check if code was created in DB
            print("\n[6.2] Checking if code was created in MongoDB...")
            time.sleep(0.5)
            non_admin_code = get_otp_from_db(NON_ADMIN_EMAIL)
            
            if non_admin_code:
                # Code exists, but verify should still fail
                print(f"   Code found in DB: {non_admin_code} (checking if verify fails)...")
                verify_response = requests.post(
                    f"{BASE_URL}/auth/verify-otp",
                    json={"email": NON_ADMIN_EMAIL, "code": str(non_admin_code)},
                    timeout=10
                )
                
                if verify_response.status_code == 401 or verify_response.status_code == 403:
                    log_pass("Non-admin - verify fails", f"Status: {verify_response.status_code} (correctly rejected non-admin)")
                else:
                    log_fail("Non-admin - verify fails", f"Expected 401/403, got {verify_response.status_code}")
            else:
                log_pass("Non-admin - no code in DB", "No code created in MongoDB for non-admin email (optimal)")
                
except Exception as e:
    log_fail("Non-admin", f"Exception: {str(e)}")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"✅ PASSED: {len(test_results['passed'])}")
print(f"❌ FAILED: {len(test_results['failed'])}")

if test_results['failed']:
    print("\n❌ FAILED TESTS:")
    for fail in test_results['failed']:
        print(f"  - {fail}")

print("\n📋 DETAILED RESULTS:")
for detail in test_results['details']:
    print(f"  {detail}")

print("\n" + "=" * 80)
if len(test_results['failed']) == 0:
    print("🎉 ALL OTP FLOW TESTS PASSED!")
    print("✓ Happy path working")
    print("✓ Session validation working")
    print("✓ One-time use enforced")
    print("✓ Wrong code rejected")
    print("✓ Re-send reuse window working (A === B)")
    print("✓ Non-admin handling correct")
else:
    print(f"⚠️  {len(test_results['failed'])} TESTS FAILED")
print("=" * 80)

# Close MongoDB connection
mongo_client.close()
