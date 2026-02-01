from http.server import BaseHTTPRequestHandler
import json
import logging
from database import (
    create_project, get_user_projects, add_project_member,
    create_workflow, get_project_workflows, assign_workflow_member,
    create_deadline, get_upcoming_deadlines
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
            
            if action == 'create_project':
                result = create_project(
                    title=data.get('title'),
                    description=data.get('description', ''),
                    created_by=data.get('username')
                )
                
                if result:
                    # Automatically add creator as lead
                    add_project_member(result['id'], data.get('username'), 'lead')
                    
                self.send_json_response(result)
                
            elif action == 'create_workflow':
                result = create_workflow(
                    project_id=data.get('project_id'),
                    title=data.get('title'),
                    description=data.get('description', ''),
                    created_by=data.get('username')
                )
                self.send_json_response(result)
                
            elif action == 'add_member':
                result = add_project_member(
                    project_id=data.get('project_id'),
                    username=data.get('member_username'),
                    role=data.get('role', 'member')
                )
                self.send_json_response(result)
                
            elif action == 'assign_workflow':
                result = assign_workflow_member(
                    workflow_id=data.get('workflow_id'),
                    username=data.get('username'),
                    role=data.get('role', 'member')
                )
                self.send_json_response(result)
                
            elif action == 'create_deadline':
                result = create_deadline(
                    workflow_id=data.get('workflow_id'),
                    title=data.get('title'),
                    due_date=data.get('due_date'),
                    assigned_to=data.get('assigned_to')
                )
                self.send_json_response(result)
                
            else:
                self.send_json_response({'error': 'Invalid action'}, status=400)
                
        except Exception as e:
            logger.error(f"Error in projects API: {e}")
            self.send_json_response({'error': str(e)}, status=500)
    
    def do_GET(self):
        try:
            # Parse query parameters
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            action = params.get('action', [''])[0]
            
            if action == 'get_projects':
                username = params.get('username', [''])[0]
                result = get_user_projects(username)
                self.send_json_response(result)
                
            elif action == 'get_workflows':
                project_id = params.get('project_id', [''])[0]
                result = get_project_workflows(project_id)
                self.send_json_response(result)
                
            elif action == 'get_deadlines':
                username = params.get('username', [''])[0]
                days = int(params.get('days', ['7'])[0])
                result = get_upcoming_deadlines(username, days)
                self.send_json_response(result)
                
            else:
                self.send_json_response({'error': 'Invalid action'}, status=400)
                
        except Exception as e:
            logger.error(f"Error in projects GET API: {e}")
            self.send_json_response({'error': str(e)}, status=500)
    
    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
