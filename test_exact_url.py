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

# Test the exact URL format
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

payload = {
    "contents": [{
        "parts": [{"text": "Say hello"}]
    }]
}

print(f"Testing URL: {url.replace(api_key, 'API_KEY')}")
response = requests.post(url, json=payload, timeout=10)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"✅ SUCCESS!")
    print(f"Reply: {data['candidates'][0]['content']['parts'][0]['text']}")
else:
    print(f"Error: {response.text}")
