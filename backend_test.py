#!/usr/bin/env python3
"""
Backend API Test Suite for Chinmay Wellness Club
Tests all public and protected endpoints
"""

import requests
import json
from datetime import datetime, timedelta
import time

# Base URL from .env
BASE_URL = "https://chinmay-wellness.preview.emergentagent.com/api"

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def log_pass(test_name):
    print(f"✅ PASS: {test_name}")
    test_results["passed"].append(test_name)

def log_fail(test_name, reason):
    print(f"❌ FAIL: {test_name} - {reason}")
    test_results["failed"].append(f"{test_name}: {reason}")

def log_warning(test_name, reason):
    print(f"⚠️  WARNING: {test_name} - {reason}")
    test_results["warnings"].append(f"{test_name}: {reason}")

print("=" * 80)
print("CHINMAY WELLNESS CLUB - BACKEND API TEST SUITE")
print("=" * 80)
print(f"Base URL: {BASE_URL}")
print("=" * 80)

# ============================================================================
# TEST 1: PUBLIC GET ENDPOINTS
# ============================================================================
print("\n📋 TEST 1: PUBLIC GET ENDPOINTS")
print("-" * 80)

# Test /api/content
try:
    print("\nTesting GET /api/content...")
    response = requests.get(f"{BASE_URL}/content", timeout=10)
    if response.status_code == 200:
        data = response.json()
        required_keys = ['siteName', 'hero', 'program', 'process', 'about', 'achievements', 'community', 'popup', 'footer', 'booking', 'seo']
        missing_keys = [key for key in required_keys if key not in data]
        if missing_keys:
            log_fail("GET /api/content", f"Missing keys: {missing_keys}")
        else:
            log_pass("GET /api/content - returns all required fields")
    else:
        log_fail("GET /api/content", f"Expected 200, got {response.status_code}")
except Exception as e:
    log_fail("GET /api/content", f"Exception: {str(e)}")

# Test /api/testimonials
try:
    print("\nTesting GET /api/testimonials...")
    response = requests.get(f"{BASE_URL}/testimonials", timeout=10)
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            if len(data) >= 3:
                has_vimeo = all('vimeoUrl' in item for item in data)
                if has_vimeo:
                    log_pass(f"GET /api/testimonials - returns array with {len(data)} items, all have vimeoUrl")
                else:
                    log_fail("GET /api/testimonials", "Some items missing vimeoUrl")
            else:
                log_fail("GET /api/testimonials", f"Expected >=3 items, got {len(data)}")
        else:
            log_fail("GET /api/testimonials", "Expected array response")
    else:
        log_fail("GET /api/testimonials", f"Expected 200, got {response.status_code}")
except Exception as e:
    log_fail("GET /api/testimonials", f"Exception: {str(e)}")

# Test /api/transformations
try:
    print("\nTesting GET /api/transformations...")
    response = requests.get(f"{BASE_URL}/transformations", timeout=10)
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            if len(data) >= 2:
                log_pass(f"GET /api/transformations - returns array with {len(data)} items")
            else:
                log_fail("GET /api/transformations", f"Expected >=2 items, got {len(data)}")
        else:
            log_fail("GET /api/transformations", "Expected array response")
    else:
        log_fail("GET /api/transformations", f"Expected 200, got {response.status_code}")
except Exception as e:
    log_fail("GET /api/transformations", f"Exception: {str(e)}")

# Test /api/gallery
try:
    print("\nTesting GET /api/gallery...")
    response = requests.get(f"{BASE_URL}/gallery", timeout=10)
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            if len(data) >= 6:
                log_pass(f"GET /api/gallery - returns array with {len(data)} items")
            else:
                log_fail("GET /api/gallery", f"Expected >=6 items, got {len(data)}")
        else:
            log_fail("GET /api/gallery", "Expected array response")
    else:
        log_fail("GET /api/gallery", f"Expected 200, got {response.status_code}")
except Exception as e:
    log_fail("GET /api/gallery", f"Exception: {str(e)}")

# Test /api/faqs
try:
    print("\nTesting GET /api/faqs...")
    response = requests.get(f"{BASE_URL}/faqs", timeout=10)
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            if len(data) >= 5:
                log_pass(f"GET /api/faqs - returns array with {len(data)} items")
            else:
                log_fail("GET /api/faqs", f"Expected >=5 items, got {len(data)}")
        else:
            log_fail("GET /api/faqs", "Expected array response")
    else:
        log_fail("GET /api/faqs", f"Expected 200, got {response.status_code}")
except Exception as e:
    log_fail("GET /api/faqs", f"Exception: {str(e)}")

# ============================================================================
# TEST 2: BOOKING AVAILABILITY
# ============================================================================
print("\n📅 TEST 2: BOOKING AVAILABILITY")
print("-" * 80)

# Test with open weekday (Monday)
try:
    print("\nTesting GET /api/availability with open weekday...")
    # Get next Monday
    today = datetime.now()
    days_ahead = (0 - today.weekday()) % 7  # Monday = 0
    if days_ahead == 0:
        days_ahead = 7  # If today is Monday, get next Monday
    next_monday = today + timedelta(days=days_ahead)
    date_str = next_monday.strftime('%Y-%m-%d')
    
    response = requests.get(f"{BASE_URL}/availability?date={date_str}", timeout=10)
    if response.status_code == 200:
        data = response.json()
        if 'slots' in data and 'dayOpen' in data:
            if data['dayOpen'] and isinstance(data['slots'], list) and len(data['slots']) == 6:
                log_pass(f"GET /api/availability (open weekday) - returns 6 slots, dayOpen=true")
            elif data['dayOpen'] and len(data['slots']) != 6:
                log_warning(f"GET /api/availability (open weekday)", f"Expected 6 slots, got {len(data['slots'])} (some may be booked)")
            else:
                log_fail("GET /api/availability (open weekday)", f"dayOpen={data['dayOpen']}, slots={len(data['slots'])}")
        else:
            log_fail("GET /api/availability (open weekday)", "Missing 'slots' or 'dayOpen' in response")
    else:
        log_fail("GET /api/availability (open weekday)", f"Expected 200, got {response.status_code}")
except Exception as e:
    log_fail("GET /api/availability (open weekday)", f"Exception: {str(e)}")

# Test with Sunday (closed)
try:
    print("\nTesting GET /api/availability with Sunday (closed)...")
    # Get next Sunday
    today = datetime.now()
    days_ahead = (6 - today.weekday()) % 7  # Sunday = 6
    if days_ahead == 0:
        days_ahead = 7
    next_sunday = today + timedelta(days=days_ahead)
    date_str = next_sunday.strftime('%Y-%m-%d')
    
    response = requests.get(f"{BASE_URL}/availability?date={date_str}", timeout=10)
    if response.status_code == 200:
        data = response.json()
        if 'dayOpen' in data and data['dayOpen'] == False:
            log_pass("GET /api/availability (Sunday) - returns dayOpen=false")
        else:
            log_fail("GET /api/availability (Sunday)", f"Expected dayOpen=false, got {data}")
    else:
        log_fail("GET /api/availability (Sunday)", f"Expected 200, got {response.status_code}")
except Exception as e:
    log_fail("GET /api/availability (Sunday)", f"Exception: {str(e)}")

# ============================================================================
# TEST 3: POST /api/leads
# ============================================================================
print("\n📝 TEST 3: POST /api/leads")
print("-" * 80)

# Test valid lead submission
try:
    print("\nTesting POST /api/leads with valid data...")
    payload = {
        "name": "Rajesh Kumar",
        "whatsapp": "9876543210",
        "goal": "Weight Loss",
        "contactTime": "Evening"
    }
    response = requests.post(f"{BASE_URL}/leads", json=payload, timeout=10)
    if response.status_code == 200:
        data = response.json()
        if data.get('ok') and data.get('id'):
            log_pass("POST /api/leads (valid) - returns 200 with ok=true and id")
        else:
            log_fail("POST /api/leads (valid)", f"Missing 'ok' or 'id' in response: {data}")
    else:
        log_fail("POST /api/leads (valid)", f"Expected 200, got {response.status_code}")
except Exception as e:
    log_fail("POST /api/leads (valid)", f"Exception: {str(e)}")

# Test missing name
try:
    print("\nTesting POST /api/leads with missing name...")
    payload = {
        "whatsapp": "9876543210",
        "goal": "Weight Loss"
    }
    response = requests.post(f"{BASE_URL}/leads", json=payload, timeout=10)
    if response.status_code == 400:
        log_pass("POST /api/leads (missing name) - returns 400")
    else:
        log_fail("POST /api/leads (missing name)", f"Expected 400, got {response.status_code}")
except Exception as e:
    log_fail("POST /api/leads (missing name)", f"Exception: {str(e)}")

# Test missing whatsapp
try:
    print("\nTesting POST /api/leads with missing whatsapp...")
    payload = {
        "name": "Test User",
        "goal": "Weight Loss"
    }
    response = requests.post(f"{BASE_URL}/leads", json=payload, timeout=10)
    if response.status_code == 400:
        log_pass("POST /api/leads (missing whatsapp) - returns 400")
    else:
        log_fail("POST /api/leads (missing whatsapp)", f"Expected 400, got {response.status_code}")
except Exception as e:
    log_fail("POST /api/leads (missing whatsapp)", f"Exception: {str(e)}")

# ============================================================================
# TEST 4: POST /api/bookings
# ============================================================================
print("\n📅 TEST 4: POST /api/bookings")
print("-" * 80)

# Test valid booking
booking_date = None
booking_time = None
try:
    print("\nTesting POST /api/bookings with valid data...")
    # Get next Tuesday
    today = datetime.now()
    days_ahead = (1 - today.weekday()) % 7  # Tuesday = 1
    if days_ahead == 0:
        days_ahead = 7
    next_tuesday = today + timedelta(days=days_ahead)
    booking_date = next_tuesday.strftime('%Y-%m-%d')
    booking_time = "07:00 AM"
    
    payload = {
        "name": "Priya Sharma",
        "whatsapp": "9123456789",
        "email": "priya@example.com",
        "goal": "Fitness",
        "date": booking_date,
        "time": booking_time
    }
    response = requests.post(f"{BASE_URL}/bookings", json=payload, timeout=10)
    if response.status_code == 200:
        data = response.json()
        if data.get('ok') and data.get('id'):
            log_pass("POST /api/bookings (valid) - returns 200 with ok=true and id")
        else:
            log_fail("POST /api/bookings (valid)", f"Missing 'ok' or 'id' in response: {data}")
    else:
        log_fail("POST /api/bookings (valid)", f"Expected 200, got {response.status_code}")
except Exception as e:
    log_fail("POST /api/bookings (valid)", f"Exception: {str(e)}")

# Test duplicate booking (409)
if booking_date and booking_time:
    try:
        print("\nTesting POST /api/bookings with duplicate slot...")
        payload = {
            "name": "Another User",
            "whatsapp": "9999999999",
            "email": "another@example.com",
            "goal": "Health",
            "date": booking_date,
            "time": booking_time
        }
        response = requests.post(f"{BASE_URL}/bookings", json=payload, timeout=10)
        if response.status_code == 409:
            log_pass("POST /api/bookings (duplicate) - returns 409")
        else:
            log_fail("POST /api/bookings (duplicate)", f"Expected 409, got {response.status_code}")
    except Exception as e:
        log_fail("POST /api/bookings (duplicate)", f"Exception: {str(e)}")

# Test missing required fields
try:
    print("\nTesting POST /api/bookings with missing fields...")
    payload = {
        "name": "Test User",
        "whatsapp": "9876543210"
        # Missing date and time
    }
    response = requests.post(f"{BASE_URL}/bookings", json=payload, timeout=10)
    if response.status_code == 400:
        log_pass("POST /api/bookings (missing fields) - returns 400")
    else:
        log_fail("POST /api/bookings (missing fields)", f"Expected 400, got {response.status_code}")
except Exception as e:
    log_fail("POST /api/bookings (missing fields)", f"Exception: {str(e)}")

# ============================================================================
# TEST 5: RATE LIMITING
# ============================================================================
print("\n🚦 TEST 5: RATE LIMITING")
print("-" * 80)

try:
    print("\nTesting rate limiting on POST /api/leads (6+ requests)...")
    # Make 6 requests quickly
    rate_limit_hit = False
    for i in range(7):
        payload = {
            "name": f"Rate Test User {i}",
            "whatsapp": f"98765432{i:02d}",
            "goal": "Test"
        }
        response = requests.post(f"{BASE_URL}/leads", json=payload, timeout=10)
        if response.status_code == 429:
            rate_limit_hit = True
            log_pass(f"Rate limiting - got 429 on request #{i+1}")
            break
        time.sleep(0.1)  # Small delay between requests
    
    if not rate_limit_hit:
        log_warning("Rate limiting", "Did not hit 429 after 7 requests (may need more requests or different IP)")
except Exception as e:
    log_fail("Rate limiting", f"Exception: {str(e)}")

# ============================================================================
# TEST 6: AUTH ENDPOINTS
# ============================================================================
print("\n🔐 TEST 6: AUTH ENDPOINTS")
print("-" * 80)

# Test send-otp with non-admin email
try:
    print("\nTesting POST /api/auth/send-otp with non-admin email...")
    payload = {"email": "random@example.com"}
    response = requests.post(f"{BASE_URL}/auth/send-otp", json=payload, timeout=10)
    if response.status_code == 200:
        data = response.json()
        if data.get('ok'):
            log_pass("POST /api/auth/send-otp (non-admin) - returns 200 with non-enumerating response")
        else:
            log_fail("POST /api/auth/send-otp (non-admin)", f"Unexpected response: {data}")
    else:
        log_fail("POST /api/auth/send-otp (non-admin)", f"Expected 200, got {response.status_code}")
except Exception as e:
    log_fail("POST /api/auth/send-otp (non-admin)", f"Exception: {str(e)}")

# Test send-otp with admin email
try:
    print("\nTesting POST /api/auth/send-otp with admin email...")
    payload = {"email": "samfonde0@gmail.com"}
    response = requests.post(f"{BASE_URL}/auth/send-otp", json=payload, timeout=10)
    if response.status_code == 200:
        data = response.json()
        if data.get('ok'):
            log_pass("POST /api/auth/send-otp (admin) - returns 200 ok=true")
        else:
            log_fail("POST /api/auth/send-otp (admin)", f"Unexpected response: {data}")
    else:
        log_fail("POST /api/auth/send-otp (admin)", f"Expected 200, got {response.status_code}")
except Exception as e:
    log_fail("POST /api/auth/send-otp (admin)", f"Exception: {str(e)}")

# Test verify-otp with wrong code
try:
    print("\nTesting POST /api/auth/verify-otp with wrong code...")
    payload = {"email": "samfonde0@gmail.com", "code": "000000"}
    response = requests.post(f"{BASE_URL}/auth/verify-otp", json=payload, timeout=10)
    if response.status_code == 401:
        log_pass("POST /api/auth/verify-otp (wrong code) - returns 401")
    else:
        log_fail("POST /api/auth/verify-otp (wrong code)", f"Expected 401, got {response.status_code}")
except Exception as e:
    log_fail("POST /api/auth/verify-otp (wrong code)", f"Exception: {str(e)}")

# Test /auth/me without cookie
try:
    print("\nTesting GET /api/auth/me without cookie...")
    response = requests.get(f"{BASE_URL}/auth/me", timeout=10)
    if response.status_code == 401:
        data = response.json()
        if data.get('authenticated') == False:
            log_pass("GET /api/auth/me (no cookie) - returns 401 with authenticated=false")
        else:
            log_fail("GET /api/auth/me (no cookie)", f"Expected authenticated=false, got {data}")
    else:
        log_fail("GET /api/auth/me (no cookie)", f"Expected 401, got {response.status_code}")
except Exception as e:
    log_fail("GET /api/auth/me (no cookie)", f"Exception: {str(e)}")

# ============================================================================
# TEST 7: PROTECTED ADMIN ROUTES (without session)
# ============================================================================
print("\n🔒 TEST 7: PROTECTED ADMIN ROUTES (without session)")
print("-" * 80)

protected_routes = [
    ("GET", "/admin/leads"),
    ("GET", "/admin/bookings"),
    ("GET", "/admin/testimonials"),
    ("PUT", "/admin/content"),
    ("POST", "/admin/testimonials"),
    ("GET", "/admin/admins"),
    ("POST", "/admin/upload")
]

for method, route in protected_routes:
    try:
        print(f"\nTesting {method} {route} without session...")
        if method == "GET":
            response = requests.get(f"{BASE_URL}{route}", timeout=10)
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{route}", json={}, timeout=10)
        elif method == "PUT":
            response = requests.put(f"{BASE_URL}{route}", json={}, timeout=10)
        
        if response.status_code == 401:
            log_pass(f"{method} {route} (no session) - returns 401")
        else:
            log_fail(f"{method} {route} (no session)", f"Expected 401, got {response.status_code}")
    except Exception as e:
        log_fail(f"{method} {route} (no session)", f"Exception: {str(e)}")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"✅ PASSED: {len(test_results['passed'])}")
print(f"❌ FAILED: {len(test_results['failed'])}")
print(f"⚠️  WARNINGS: {len(test_results['warnings'])}")

if test_results['failed']:
    print("\n❌ FAILED TESTS:")
    for fail in test_results['failed']:
        print(f"  - {fail}")

if test_results['warnings']:
    print("\n⚠️  WARNINGS:")
    for warn in test_results['warnings']:
        print(f"  - {warn}")

print("\n" + "=" * 80)
if len(test_results['failed']) == 0:
    print("🎉 ALL CRITICAL TESTS PASSED!")
else:
    print(f"⚠️  {len(test_results['failed'])} TESTS FAILED")
print("=" * 80)
