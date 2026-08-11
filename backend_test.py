#!/usr/bin/env python3
"""
Comprehensive backend test for Chinmay Wellness Club after Supabase migration.
Tests all public endpoints, auth flows, protected routes, and RLS policies.
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://chinmay-wellness.preview.emergentagent.com/api"
SUPABASE_URL = "https://lplnwgulplsyntkgpzqz.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbG53Z3VscGxzeW50a2dwenF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwOTgxNDcsImV4cCI6MjEwMTY3NDE0N30._JIE-w4fso9mkjxzbnzjaqja2-e7nBHzOqstNJ687jY"
ADMIN_EMAIL = "samfonde0@gmail.com"

def test_public_content_endpoints():
    """Test 1: Public GET endpoints for content and collections"""
    print("\n" + "="*80)
    print("TEST 1: Public Content & Collections GET Endpoints")
    print("="*80)
    
    tests_passed = 0
    tests_total = 5
    
    try:
        # Test /api/content
        print("\n[1.1] Testing GET /api/content...")
        resp = requests.get(f"{BASE_URL}/content", timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            required_fields = ['siteName', 'hero', 'program', 'process', 'about', 'achievements', 'community', 'popup', 'footer', 'booking', 'seo']
            missing = [f for f in required_fields if f not in data]
            if not missing:
                print(f"✅ PASS: All required fields present")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Missing fields: {missing}")
        else:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
        
        # Test /api/testimonials
        print("\n[1.2] Testing GET /api/testimonials...")
        resp = requests.get(f"{BASE_URL}/testimonials", timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) >= 3:
                has_vimeo = all('vimeoUrl' in item for item in data)
                if has_vimeo:
                    print(f"✅ PASS: Returns {len(data)} testimonials with vimeoUrl")
                    tests_passed += 1
                else:
                    print(f"❌ FAIL: Some testimonials missing vimeoUrl")
            else:
                print(f"❌ FAIL: Expected array with >=3 items, got {len(data) if isinstance(data, list) else 'not array'}")
        else:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
        
        # Test /api/transformations
        print("\n[1.3] Testing GET /api/transformations...")
        resp = requests.get(f"{BASE_URL}/transformations", timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) >= 2:
                print(f"✅ PASS: Returns {len(data)} transformations")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Expected array with >=2 items, got {len(data) if isinstance(data, list) else 'not array'}")
        else:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
        
        # Test /api/gallery
        print("\n[1.4] Testing GET /api/gallery...")
        resp = requests.get(f"{BASE_URL}/gallery", timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) >= 6:
                print(f"✅ PASS: Returns {len(data)} gallery items")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Expected array with >=6 items, got {len(data) if isinstance(data, list) else 'not array'}")
        else:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
        
        # Test /api/faqs
        print("\n[1.5] Testing GET /api/faqs...")
        resp = requests.get(f"{BASE_URL}/faqs", timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) >= 5:
                print(f"✅ PASS: Returns {len(data)} FAQs")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Expected array with >=5 items, got {len(data) if isinstance(data, list) else 'not array'}")
        else:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
        
        print(f"\n📊 Test 1 Summary: {tests_passed}/{tests_total} passed")
        return tests_passed == tests_total
        
    except Exception as e:
        print(f"❌ EXCEPTION in test_public_content_endpoints: {e}")
        return False


def test_availability_endpoint():
    """Test 2: Booking availability endpoint"""
    print("\n" + "="*80)
    print("TEST 2: Booking Availability Endpoint")
    print("="*80)
    
    tests_passed = 0
    tests_total = 2
    
    try:
        # Test open weekday (Wednesday)
        print("\n[2.1] Testing GET /api/availability?date=2026-08-12 (Wednesday - should be open)...")
        resp = requests.get(f"{BASE_URL}/availability?date=2026-08-12", timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            if data.get('dayOpen') == True and isinstance(data.get('slots'), list) and len(data['slots']) == 6:
                print(f"✅ PASS: Open day returns dayOpen=true with 6 slots")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Expected dayOpen=true with 6 slots, got dayOpen={data.get('dayOpen')}, slots={len(data.get('slots', []))}")
        else:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
        
        # Test closed day (Sunday)
        print("\n[2.2] Testing GET /api/availability?date=2026-08-16 (Sunday - should be closed)...")
        resp = requests.get(f"{BASE_URL}/availability?date=2026-08-16", timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            if data.get('dayOpen') == False:
                print(f"✅ PASS: Closed day returns dayOpen=false")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Expected dayOpen=false, got {data.get('dayOpen')}")
        else:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
        
        print(f"\n📊 Test 2 Summary: {tests_passed}/{tests_total} passed")
        return tests_passed == tests_total
        
    except Exception as e:
        print(f"❌ EXCEPTION in test_availability_endpoint: {e}")
        return False


def test_leads_endpoint():
    """Test 3: POST /api/leads validation"""
    print("\n" + "="*80)
    print("TEST 3: POST /api/leads Endpoint")
    print("="*80)
    
    tests_passed = 0
    tests_total = 2
    
    try:
        # Test valid lead submission
        print("\n[3.1] Testing POST /api/leads with valid data...")
        payload = {
            "name": "Rajesh Kumar",
            "whatsapp": "9876543210",
            "goal": "Weight Loss",
            "contactTime": "Evening"
        }
        resp = requests.post(f"{BASE_URL}/leads", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            if data.get('ok') == True and 'id' in data:
                print(f"✅ PASS: Valid lead returns 200 with ok=true and id")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Expected ok=true and id, got {data}")
        else:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
        
        # Test missing required fields
        print("\n[3.2] Testing POST /api/leads with missing name...")
        payload = {
            "whatsapp": "9876543210",
            "goal": "Weight Loss"
        }
        resp = requests.post(f"{BASE_URL}/leads", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 400:
            print(f"✅ PASS: Missing name returns 400")
            tests_passed += 1
        else:
            print(f"❌ FAIL: Expected 400, got {resp.status_code}")
        
        print(f"\n📊 Test 3 Summary: {tests_passed}/{tests_total} passed")
        return tests_passed == tests_total
        
    except Exception as e:
        print(f"❌ EXCEPTION in test_leads_endpoint: {e}")
        return False


def test_bookings_endpoint():
    """Test 4: POST /api/bookings validation and duplicate prevention"""
    print("\n" + "="*80)
    print("TEST 4: POST /api/bookings Endpoint")
    print("="*80)
    
    tests_passed = 0
    tests_total = 3
    
    try:
        # Test valid booking
        print("\n[4.1] Testing POST /api/bookings with valid data...")
        timestamp = datetime.now().strftime("%H%M%S")
        payload = {
            "name": f"Priya Sharma {timestamp}",
            "whatsapp": "9123456789",
            "date": "2026-08-13",
            "time": "08:00 AM"
        }
        resp = requests.post(f"{BASE_URL}/bookings", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            if data.get('ok') == True and 'id' in data:
                print(f"✅ PASS: Valid booking returns 200 with ok=true and id")
                tests_passed += 1
                
                # Test duplicate booking (same date+time)
                print("\n[4.2] Testing POST /api/bookings with duplicate slot...")
                resp2 = requests.post(f"{BASE_URL}/bookings", json=payload, timeout=10)
                print(f"Status: {resp2.status_code}")
                if resp2.status_code == 409:
                    print(f"✅ PASS: Duplicate slot returns 409")
                    tests_passed += 1
                else:
                    print(f"❌ FAIL: Expected 409, got {resp2.status_code}")
            else:
                print(f"❌ FAIL: Expected ok=true and id, got {data}")
        else:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
        
        # Test missing required fields
        print("\n[4.3] Testing POST /api/bookings with missing fields...")
        payload = {
            "name": "Test User",
            "date": "2026-08-14"
            # missing whatsapp and time
        }
        resp = requests.post(f"{BASE_URL}/bookings", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 400:
            print(f"✅ PASS: Missing fields returns 400")
            tests_passed += 1
        else:
            print(f"❌ FAIL: Expected 400, got {resp.status_code}")
        
        print(f"\n📊 Test 4 Summary: {tests_passed}/{tests_total} passed")
        return tests_passed == tests_total
        
    except Exception as e:
        print(f"❌ EXCEPTION in test_bookings_endpoint: {e}")
        return False


def test_auth_endpoints():
    """Test 5: Auth endpoints (send-otp, verify-otp, /auth/me)"""
    print("\n" + "="*80)
    print("TEST 5: Auth Endpoints")
    print("="*80)
    
    tests_passed = 0
    tests_total = 4
    
    try:
        # Test send-otp with non-admin email (non-enumerating)
        print("\n[5.1] Testing POST /api/auth/send-otp with non-admin email...")
        payload = {"email": "random_notadmin@example.com"}
        resp = requests.post(f"{BASE_URL}/auth/send-otp", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            if data.get('ok') == True:
                print(f"✅ PASS: Non-admin email returns 200 with non-enumerating response")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Expected ok=true, got {data}")
        else:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
        
        # Test send-otp with admin email (CALL ONLY ONCE)
        print("\n[5.2] Testing POST /api/auth/send-otp with admin email (samfonde0@gmail.com)...")
        print("⚠️  NOTE: Calling this ONCE to avoid Supabase email rate limits")
        payload = {"email": ADMIN_EMAIL}
        resp = requests.post(f"{BASE_URL}/auth/send-otp", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            if data.get('ok') == True:
                print(f"✅ PASS: Admin email returns 200 ok=true (OTP sent via Supabase)")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Expected ok=true, got {data}")
        else:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
        
        # Test verify-otp with wrong code
        print("\n[5.3] Testing POST /api/auth/verify-otp with wrong code...")
        payload = {"email": ADMIN_EMAIL, "code": "000000"}
        resp = requests.post(f"{BASE_URL}/auth/verify-otp", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 401:
            print(f"✅ PASS: Wrong OTP code returns 401")
            tests_passed += 1
        else:
            print(f"❌ FAIL: Expected 401, got {resp.status_code}")
        
        # Test verify-otp with non-admin email
        print("\n[5.4] Testing POST /api/auth/verify-otp with non-admin email...")
        payload = {"email": "random_notadmin@example.com", "code": "123456"}
        resp = requests.post(f"{BASE_URL}/auth/verify-otp", json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 403:
            print(f"✅ PASS: Non-admin email returns 403")
            tests_passed += 1
        else:
            print(f"❌ FAIL: Expected 403, got {resp.status_code}")
        
        # Test /auth/me without cookie
        print("\n[5.5] Testing GET /api/auth/me without session cookie...")
        resp = requests.get(f"{BASE_URL}/auth/me", timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 401:
            data = resp.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            if data.get('authenticated') == False:
                print(f"✅ PASS: No cookie returns 401 with authenticated=false")
                # Don't increment tests_passed as this is bonus check
            else:
                print(f"⚠️  WARNING: Expected authenticated=false, got {data}")
        else:
            print(f"❌ FAIL: Expected 401, got {resp.status_code}")
        
        print(f"\n📊 Test 5 Summary: {tests_passed}/{tests_total} passed")
        return tests_passed == tests_total
        
    except Exception as e:
        print(f"❌ EXCEPTION in test_auth_endpoints: {e}")
        return False


def test_protected_admin_routes():
    """Test 6: All protected admin routes return 401 without cookie"""
    print("\n" + "="*80)
    print("TEST 6: Protected Admin Routes (without session)")
    print("="*80)
    
    tests_passed = 0
    admin_routes = [
        ("GET", "/admin/leads"),
        ("GET", "/admin/bookings"),
        ("GET", "/admin/testimonials"),
        ("GET", "/admin/admins"),
        ("PUT", "/admin/content"),
        ("POST", "/admin/upload"),
        ("POST", "/admin/testimonials"),
    ]
    tests_total = len(admin_routes)
    
    try:
        for i, (method, route) in enumerate(admin_routes, 1):
            print(f"\n[6.{i}] Testing {method} {route} without session...")
            
            if method == "GET":
                resp = requests.get(f"{BASE_URL}{route}", timeout=10)
            elif method == "POST":
                resp = requests.post(f"{BASE_URL}{route}", json={}, timeout=10)
            elif method == "PUT":
                resp = requests.put(f"{BASE_URL}{route}", json={}, timeout=10)
            
            print(f"Status: {resp.status_code}")
            if resp.status_code == 401:
                print(f"✅ PASS: Returns 401 (unauthorized)")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Expected 401, got {resp.status_code}")
        
        print(f"\n📊 Test 6 Summary: {tests_passed}/{tests_total} passed")
        return tests_passed == tests_total
        
    except Exception as e:
        print(f"❌ EXCEPTION in test_protected_admin_routes: {e}")
        return False


def test_rls_direct():
    """Test 7: CRITICAL - Direct Supabase REST API RLS test"""
    print("\n" + "="*80)
    print("TEST 7: CRITICAL - Row Level Security (RLS) Direct Test")
    print("="*80)
    
    tests_passed = 0
    tests_total = 3
    
    try:
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json"
        }
        
        # Test 1: leads table should be blocked (RLS)
        print("\n[7.1] Testing direct Supabase REST GET /rest/v1/leads?select=* with anon key...")
        print("Expected: Empty array or 401/403 (RLS blocks anon access)")
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/leads?select=*",
            headers=headers,
            timeout=10
        )
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:200]}")
        
        if resp.status_code in [401, 403]:
            print(f"✅ PASS: RLS blocks anon access with {resp.status_code}")
            tests_passed += 1
        elif resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) == 0:
                print(f"✅ PASS: RLS returns empty array (zero rows exposed)")
                tests_passed += 1
            else:
                print(f"❌ CRITICAL FAIL: RLS BREACH - {len(data)} lead records exposed to anon key!")
                print(f"Sample data: {json.dumps(data[:2], indent=2)}")
        else:
            print(f"⚠️  Unexpected status: {resp.status_code}")
        
        # Test 2: bookings table should be blocked (RLS)
        print("\n[7.2] Testing direct Supabase REST GET /rest/v1/bookings?select=* with anon key...")
        print("Expected: Empty array or 401/403 (RLS blocks anon access)")
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/bookings?select=*",
            headers=headers,
            timeout=10
        )
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:200]}")
        
        if resp.status_code in [401, 403]:
            print(f"✅ PASS: RLS blocks anon access with {resp.status_code}")
            tests_passed += 1
        elif resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) == 0:
                print(f"✅ PASS: RLS returns empty array (zero rows exposed)")
                tests_passed += 1
            else:
                print(f"❌ CRITICAL FAIL: RLS BREACH - {len(data)} booking records exposed to anon key!")
                print(f"Sample data: {json.dumps(data[:2], indent=2)}")
        else:
            print(f"⚠️  Unexpected status: {resp.status_code}")
        
        # Test 3: testimonials table should allow public read
        print("\n[7.3] Testing direct Supabase REST GET /rest/v1/testimonials?select=id with anon key...")
        print("Expected: 200 with array of testimonials (public read allowed)")
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/testimonials?select=id",
            headers=headers,
            timeout=10
        )
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) > 0:
                print(f"✅ PASS: Public table returns {len(data)} rows (RLS allows anon SELECT)")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Expected array with rows, got {data}")
        else:
            print(f"❌ FAIL: Expected 200, got {resp.status_code}")
        
        print(f"\n📊 Test 7 Summary: {tests_passed}/{tests_total} passed")
        
        if tests_passed < tests_total:
            print("\n⚠️  CRITICAL: RLS test failures detected!")
            print("If leads/bookings are exposed, this is a SECURITY BREACH.")
        
        return tests_passed == tests_total
        
    except Exception as e:
        print(f"❌ EXCEPTION in test_rls_direct: {e}")
        return False


def main():
    """Run all backend tests"""
    print("\n" + "="*80)
    print("CHINMAY WELLNESS CLUB - BACKEND TEST SUITE (POST-SUPABASE MIGRATION)")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Admin Email: {ADMIN_EMAIL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    results = {}
    
    # Run all tests
    results['Test 1: Public Content Endpoints'] = test_public_content_endpoints()
    results['Test 2: Availability Endpoint'] = test_availability_endpoint()
    results['Test 3: Leads Endpoint'] = test_leads_endpoint()
    results['Test 4: Bookings Endpoint'] = test_bookings_endpoint()
    results['Test 5: Auth Endpoints'] = test_auth_endpoints()
    results['Test 6: Protected Admin Routes'] = test_protected_admin_routes()
    results['Test 7: RLS Direct Test'] = test_rls_direct()
    
    # Summary
    print("\n" + "="*80)
    print("FINAL TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n{'='*80}")
    print(f"OVERALL: {passed}/{total} test suites passed")
    print(f"{'='*80}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED - Backend migration to Supabase successful!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test suite(s) failed - Review failures above")
        return 1


if __name__ == "__main__":
    exit(main())
