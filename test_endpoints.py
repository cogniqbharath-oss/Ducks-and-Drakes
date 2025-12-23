import os
import requests

def load_env():
    env_path = '.env'
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

load_env()
api_key = os.environ.get("GEMINI_API_KEY")

print(f"API Key: {api_key[:20]}...")

# Try both v1 and v1beta with different models
endpoints = [
    ("v1", "gemini-pro"),
    ("v1beta", "gemini-pro"),
    ("v1", "gemini-1.5-flash"),
    ("v1beta", "gemini-1.5-flash"),
    ("v1", "models/gemini-pro"),
    ("v1beta", "models/gemini-pro"),
]

for version, model in endpoints:
    url = f"https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{"text": "Hi"}]
        }]
    }
    
    try:
        print(f"\n{version}/{model}")
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("candidates"):
                print(f"✅ WORKS!")
                print(f"Full URL: {url.replace(api_key, 'API_KEY')}")
                break
        elif response.status_code != 404:
            print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
