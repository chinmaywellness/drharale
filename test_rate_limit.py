#!/usr/bin/env python3
"""
Additional rate limiting test
"""

import requests
import time

BASE_URL = "https://chinmay-wellness.preview.emergentagent.com/api"

print("Testing rate limiting with 10 rapid requests...")
for i in range(10):
    payload = {
        "name": f"Rate Test {i}",
        "whatsapp": f"98765{i:05d}",
        "goal": "Test"
    }
    response = requests.post(f"{BASE_URL}/leads", json=payload, timeout=10)
    print(f"Request {i+1}: Status {response.status_code}")
    if response.status_code == 429:
        print(f"✅ Rate limit triggered at request {i+1}")
        break
    time.sleep(0.05)
