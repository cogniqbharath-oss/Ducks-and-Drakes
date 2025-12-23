import requests
import json

try:
    # Test the local server endpoint
    url = "http://localhost:8000/api/chat"
    data = {"message": "What are your hours?"}
    
    print(f"Testing: {url}")
    print(f"Sending: {data}")
    
    response = requests.post(url, json=data, timeout=30)
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nSuccess! Reply: {result.get('reply', 'No reply field')}")
    else:
        print(f"\nError: {response.status_code}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
