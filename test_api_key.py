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

print(f"Testing API key: {api_key[:15]}...")

# Try the simplest possible request - list models
list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

print(f"\nTrying to list models...")
try:
    response = requests.get(list_url, timeout=10)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ API Key works!")
        with open('models.txt', 'w') as f:
            for model in data.get("models", []):
                print(f"  - {model.get('name')}")
                f.write(f"{model.get('name')}\n")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
