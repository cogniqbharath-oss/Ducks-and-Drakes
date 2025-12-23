import os
import sys

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

# Check API key
api_key = os.environ.get("GEMINI_API_KEY")
print(f"API Key present: {bool(api_key)}")
if api_key:
    print(f"API Key starts with: {api_key[:10]}...")

# Test direct API call
try:
    import google.generativeai as genai
    
    genai.configure(api_key=api_key)
    
    # Simple test
    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content("Say hello")
    
    print(f"\n✓ SUCCESS! Response: {response.text}")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
