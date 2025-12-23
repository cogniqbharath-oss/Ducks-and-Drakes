import os
import google.generativeai as genai

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

# Try different model names
models_to_try = [
    "models/gemini-1.5-flash",
    "models/gemini-pro",
    "gemini-1.5-flash-001",
    "gemini-pro",
]

genai.configure(api_key=api_key)

for model_name in models_to_try:
    try:
        print(f"\nTrying: {model_name}")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say hi")
        print(f"✓ SUCCESS with {model_name}!")
        print(f"Response: {response.text}")
        break
    except Exception as e:
        print(f"✗ Failed: {str(e)[:100]}")
