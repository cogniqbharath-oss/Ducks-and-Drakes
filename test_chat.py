import sys
import os

# Add the functions directory to python path
sys.path.append(os.path.join(os.getcwd(), 'functions', 'api'))

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

# Test the chat module
try:
    import chat
    print("Chat module imported successfully!")
    
    # Test with a simple message
    result = chat.handler("What are your hours?")
    print(f"\nTest result: {result}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
