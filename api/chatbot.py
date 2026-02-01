from http.server import BaseHTTPRequestHandler
import json
import logging

logger = logging.getLogger(__name__)

# Knowledge base for the chatbot
CHATBOT_KNOWLEDGE = {
    "create_project": {
        "keywords": ["tạo project", "tạo dự án", "create project", "new project", "how to create"],
        "response": """Để tạo một project mới trong app:
1. Vào trang Dashboard
2. Nhấn nút "Tạo Project Mới" / "Create New Project"
3. Nhập tên project và mô tả
4. Nhấn "Tạo" / "Create"

Sau khi tạo, bạn sẽ tự động trở thành Project Lead và có thể thêm thành viên, tạo workflows."""
    },
    "create_workflow": {
        "keywords": ["tạo workflow", "chia công việc", "create workflow", "divide work", "task breakdown"],
        "response": """Để chia nhỏ công việc thành workflows:
1. Vào project của bạn
2. Nhấn "Thêm Workflow" / "Add Workflow"
3. Nhập tên và mô tả workflow
4. Gán thành viên cho workflow đó
5. Thêm deadline nếu cần

Mỗi workflow có thể có nhiều thành viên và deadline riêng."""
    },
    "add_members": {
        "keywords": ["thêm thành viên", "add member", "invite", "mời người"],
        "response": """Để thêm thành viên vào project:
1. Vào trang Project Settings
2. Nhấn "Thêm Thành Viên" / "Add Member"
3. Nhập username của người bạn muốn thêm
4. Chọn vai trò (Lead hoặc Member)
5. Nhấn "Thêm" / "Add"

Chỉ Project Lead mới có quyền thêm thành viên."""
    },
    "schedule": {
        "keywords": ["lịch", "thời gian bận", "busy time", "calendar", "schedule", "meeting"],
        "response": """Để quản lý lịch và thời gian bận:
1. Vào trang Calendar
2. Nhấn "Thêm Thời Gian Bận" / "Add Busy Time"
3. Chọn ngày giờ bắt đầu và kết thúc
4. Nhập mô tả (tùy chọn)
5. Nhấn "Lưu" / "Save"

Khi tạo meeting, hệ thống sẽ tự động kiểm tra và báo nếu trùng lịch bận của thành viên."""
    },
    "documents": {
        "keywords": ["tài liệu", "file", "upload", "document", "share", "chia sẻ"],
        "response": """Để lưu trữ và chia sẻ tài liệu:
1. Vào project hoặc workflow
2. Nhấn "Tải Lên Tài Liệu" / "Upload Document"
3. Chọn file từ máy tính
4. File sẽ được lưu và tất cả thành viên project có thể xem

Tài liệu có thể gắn với cả project hoặc workflow cụ thể."""
    },
    "deadline": {
        "keywords": ["deadline", "hạn chót", "due date", "thông báo", "notification"],
        "response": """Để tạo và quản lý deadline:
1. Vào workflow
2. Nhấn "Thêm Deadline" / "Add Deadline"
3. Nhập tên deadline
4. Chọn ngày hạn chót
5. Gán cho thành viên

Hệ thống sẽ tự động thông báo khi gần đến hạn deadline."""
    },
    "roles": {
        "keywords": ["vai trò", "role", "lead", "member", "quyền hạn"],
        "response": """Các vai trò trong project:

**Project Lead:**
- Tạo và xóa workflows
- Thêm/xóa thành viên
- Gán deadline
- Quản lý toàn bộ project

**Member:**
- Xem project và workflows
- Thêm thời gian bận
- Upload tài liệu
- Hoàn thành deadline được gán"""
    },
    "general": {
        "keywords": ["help", "hướng dẫn", "giúp", "làm sao", "how to"],
        "response": """Chào bạn! Tôi có thể giúp bạn với:
- Tạo project và workflows
- Thêm thành viên
- Quản lý lịch và thời gian bận
- Upload và chia sẻ tài liệu
- Tạo và theo dõi deadline

Hãy hỏi tôi bất kỳ câu hỏi nào về cách sử dụng app!"""
    }
}

def find_best_match(question: str):
    """Find the best matching response based on keywords"""
    question_lower = question.lower()
    
    # Check each topic for keyword matches
    for topic, data in CHATBOT_KNOWLEDGE.items():
        for keyword in data["keywords"]:
            if keyword.lower() in question_lower:
                return data["response"]
    
    # Default response if no match found
    return CHATBOT_KNOWLEDGE["general"]["response"]

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
            
            question = data.get('question', '')
            
            if not question:
                self.send_json_response({
                    'error': 'Vui lòng nhập câu hỏi / Please enter a question'
                }, status=400)
                return
            
            # Find best matching response
            response = find_best_match(question)
            
            self.send_json_response({
                'question': question,
                'answer': response
            })
            
        except Exception as e:
            logger.error(f"Error in chatbot API: {e}")
            self.send_json_response({'error': str(e)}, status=500)
    
    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
