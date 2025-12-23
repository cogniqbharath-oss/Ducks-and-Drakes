import os
import requests

# Load environment
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

# Test different model endpoints
models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-pro",
    "models/gemini-1.5-flash",
    "models/gemini-pro",
]

for model in models:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{"text": "Say hi"}]
        }]
    }
    
    try:
        print(f"\nTrying: {model}")
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("candidates"):
                reply = data["candidates"][0]["content"]["parts"][0]["text"]
                print(f"✅ SUCCESS! Reply: {reply}")
                print(f"\n🎯 USE THIS MODEL: {model}")
                break
        else:
            print(f"Error: {response.text[:100]}")
    except Exception as e:
        print(f"Exception: {e}")
