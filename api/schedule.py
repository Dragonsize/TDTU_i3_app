from http.server import BaseHTTPRequestHandler
import json
import logging
from database import (
    add_busy_time, get_user_busy_times, check_meeting_conflicts
)

logger = logging.getLogger(__name__)

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            
            action = data.get('action')
            
            if action == 'add_busy_time':
                result = add_busy_time(
                    username=data.get('username'),
                    start_time=data.get('start_time'),
                    end_time=data.get('end_time'),
                    description=data.get('description', '')
                )
                self.send_json_response(result)
                
            elif action == 'check_conflicts':
                conflicts = check_meeting_conflicts(
                    project_id=data.get('project_id'),
                    start_time=data.get('start_time'),
                    end_time=data.get('end_time')
                )
                
                response = {
                    'has_conflicts': len(conflicts) > 0,
                    'conflicts': conflicts
                }
                self.send_json_response(response)
                
            else:
                self.send_json_response({'error': 'Invalid action'}, status=400)
                
        except Exception as e:
            logger.error(f"Error in schedule API: {e}")
            self.send_json_response({'error': str(e)}, status=500)
    
    def do_GET(self):
        try:
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            action = params.get('action', [''])[0]
            
            if action == 'get_busy_times':
                username = params.get('username', [''])[0]
                result = get_user_busy_times(username)
                self.send_json_response(result)
                
            else:
                self.send_json_response({'error': 'Invalid action'}, status=400)
                
        except Exception as e:
            logger.error(f"Error in schedule GET API: {e}")
            self.send_json_response({'error': str(e)}, status=500)
    
    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
