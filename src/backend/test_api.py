"""
Simple test script to verify the Amigo Invisible Bingo API
"""
import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000"
API_KEY = "your-secure-api-key-here"
ADMIN_KEY = "your-secure-admin-key-here"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

admin_headers = {
    "X-API-Key": API_KEY,
    "X-Admin-Key": ADMIN_KEY,
    "Content-Type": "application/json"
}


def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_submit_prediction():
    """Test submitting a prediction"""
    print("\n=== Testing Submit Prediction ===")
    data = {
        "userName": "Paula",
        "predictions": {
            "Miriam": "Paula",
            "Paula": "Diego",
            "Adriana": "Carlos A",
            "Lula": "Padrino",
            "Diego": "Adriana",
            "Carlos A": "Lula",
            "Padrino": "Miriam"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/api/predictions",
        headers=headers,
        json=data
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code in [200, 201]


def test_get_prediction():
    """Test getting a user's prediction"""
    print("\n=== Testing Get Prediction ===")
    response = requests.get(
        f"{BASE_URL}/api/predictions/Paula",
        headers=headers
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_get_status():
    """Test getting participants status"""
    print("\n=== Testing Get Status ===")
    response = requests.get(
        f"{BASE_URL}/api/predictions/status",
        headers=headers
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_set_answers():
    """Test setting correct answers (admin)"""
    print("\n=== Testing Set Answers (Admin) ===")
    data = {
        "answers": {
            "Miriam": "Diego",
            "Paula": "Adriana",
            "Adriana": "Padrino",
            "Lula": "Carlos A",
            "Diego": "Miriam",
            "Carlos A": "Paula",
            "Padrino": "Lula"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/api/admin/answers",
        headers=admin_headers,
        json=data
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_get_all_predictions():
    """Test getting all predictions (should fail before reveal date)"""
    print("\n=== Testing Get All Predictions (Before Reveal Date) ===")
    response = requests.get(
        f"{BASE_URL}/api/predictions/all",
        headers=headers
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    # Should return 403 before reveal date
    return response.status_code == 403


def test_get_scores():
    """Test getting scores (should fail before reveal date)"""
    print("\n=== Testing Get Scores (Before Reveal Date) ===")
    response = requests.get(
        f"{BASE_URL}/api/scores",
        headers=headers
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    # Should return 403 before reveal date
    return response.status_code == 403


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("Amigo Invisible Bingo API Test Suite")
    print("=" * 60)
    
    tests = [
        ("Health Check", test_health),
        ("Submit Prediction", test_submit_prediction),
        ("Get Prediction", test_get_prediction),
        ("Get Status", test_get_status),
        ("Set Answers (Admin)", test_set_answers),
        ("Get All Predictions (Before Reveal)", test_get_all_predictions),
        ("Get Scores (Before Reveal)", test_get_scores),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"Error: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 60)
    print("Test Results:")
    print("=" * 60)
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    print(f"\nTotal: {passed}/{total} tests passed")


if __name__ == "__main__":
    try:
        run_all_tests()
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to the API server.")
        print("Please make sure the server is running on http://localhost:3000")
        print("Run: python main.py")
