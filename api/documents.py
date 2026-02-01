from http.server import BaseHTTPRequestHandler
import json
import logging
from database import upload_document, get_project_documents

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
            
            if action == 'upload_document':
                result = upload_document(
                    project_id=data.get('project_id'),
                    workflow_id=data.get('workflow_id'),
                    filename=data.get('filename'),
                    file_url=data.get('file_url'),
                    uploaded_by=data.get('username')
                )
                self.send_json_response(result)
                
            else:
                self.send_json_response({'error': 'Invalid action'}, status=400)
                
        except Exception as e:
            logger.error(f"Error in documents API: {e}")
            self.send_json_response({'error': str(e)}, status=500)
    
    def do_GET(self):
        try:
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            action = params.get('action', [''])[0]
            
            if action == 'get_documents':
                project_id = params.get('project_id', [''])[0]
                result = get_project_documents(project_id)
                self.send_json_response(result)
                
            else:
                self.send_json_response({'error': 'Invalid action'}, status=400)
                
        except Exception as e:
            logger.error(f"Error in documents GET API: {e}")
            self.send_json_response({'error': str(e)}, status=500)
    
    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
