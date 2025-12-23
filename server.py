import http.server
import socketserver
import json
import os
import sys

# Add the functions directory to python path to import the chat handler
sys.path.append(os.path.join(os.getcwd(), 'functions', 'api'))

try:
    import chat
except ImportError:
    print("Could not import chat module. Ensure functions/api/chat.py exists.")
    chat = None

# Helper to load .env file manually if python-dotenv is not installed
def load_env():
    env_path = '.env'
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

load_env()

PORT = 8000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/chat':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                user_message = data.get('message', '')
                
                if chat:
                    response_data = chat.handler(user_message)
                else:
                    response_data = {"error": "Chat module not loaded"}

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_error(404, "File not found")

with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    print(f"Chat API available at http://localhost:{PORT}/api/chat")
    httpd.serve_forever()
