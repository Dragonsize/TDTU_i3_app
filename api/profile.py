from http.server import BaseHTTPRequestHandler
import json
import logging
from database import save_user_profile

logger = logging.getLogger(__name__)

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)

            username = data.get('username')
            email = data.get('email')
            fullname = data.get('fullname')

            if not username:
                self.send_json_response({'error': 'Username is required'}, status=400)
                return

            profile = save_user_profile(username=username, email=email, fullname=fullname)

            if not profile:
                self.send_json_response({'error': 'Failed to save profile'}, status=500)
                return

            self.send_json_response({'profile': profile})
        except Exception as e:
            logger.error("Error in profile API: %s", e)
            self.send_json_response({'error': 'Internal server error'}, status=500)

    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))