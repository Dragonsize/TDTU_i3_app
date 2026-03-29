import os
import re
import hashlib
import json
import ast
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Response, Cookie, Depends, File, UploadFile, Form, Request, Query, WebSocket, WebSocketDisconnect, BackgroundTasks, Header
import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

def sanitize_chat_input(text: str) -> str:
    # Remove dangerous SQL/meta chars and trim
    if not isinstance(text, str):
        raise HTTPException(status_code=400, detail="Invalid input type")
    # Remove control chars, SQL meta, and limit length
    text = re.sub(r"[<>\"`;]|--|/\*|\*/", "", text)
    text = text.strip()
    if contains_control_chars(text) or contains_emoji(text):
        raise HTTPException(status_code=400, detail="Message contains invalid characters")
    if len(text) > 2000:
        raise HTTPException(status_code=400, detail="Message too long")
    return text


def validate_url_safe(url: str) -> str:
    """Validate that URL is safe (no javascript: or data: URIs, etc.)"""
    if not isinstance(url, str):
        raise HTTPException(status_code=400, detail="Invalid URL type")
    url = url.strip()
    # Block Javascript, data, vbscript, blob protocols
    dangerous_protocols = ['javascript:', 'data:', 'vbscript:', 'blob:', 'file://']
    url_lower = url.lower()
    for protocol in dangerous_protocols:
        if url_lower.startswith(protocol):
            raise HTTPException(status_code=400, detail="URL contains invalid protocol")
    # Only validate format if it looks like a full URL (contains ://)
    if '://' in url and not (url.startswith('http://') or url.startswith('https://')):
        raise HTTPException(status_code=400, detail="URL must use http or https")
    return url

from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel, Field, field_validator, constr
try:
    from supabase import create_client, Client
    SUPABASE_IMPORT_ERROR: Optional[str] = None
except Exception as exc:  # pragma: no cover - runtime environment issue
    create_client = None
    Client = Any  # type: ignore
    SUPABASE_IMPORT_ERROR = str(exc)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "").strip()
CHATBOT_API_BASE = os.getenv("CHATBOT_API_BASE", "https://api.openai.com/v1").strip().rstrip("/")
CHATBOT_MODEL = os.getenv("CHATBOT_MODEL", "gpt-4o-mini").strip()
CHATBOT_API_KEY = os.getenv("CHATBOT_API_KEY", "").strip()
GOOGLE_AI_STUDIO_API_KEY = os.getenv("GOOGLE_AI_STUDIO_API_KEY", "").strip()
CHATBOT_SYSTEM_PROMPT = os.getenv(
    "CHATBOT_SYSTEM_PROMPT",
    "You are a helpful assistant for project management tasks. Keep responses concise and actionable.",
).strip()

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "1"))


IS_PRODUCTION = os.getenv("VERCEL_ENV") == "production" or os.getenv("ENVIRONMENT") == "production"

SUPABASE_CONFIG_ERROR = None
if SUPABASE_IMPORT_ERROR:
    SUPABASE_CONFIG_ERROR = f"Supabase import error: {SUPABASE_IMPORT_ERROR}"
elif not SUPABASE_URL or not SUPABASE_ANON_KEY:
    SUPABASE_CONFIG_ERROR = "Missing Supabase credentials"

supabase: Optional[Client] = (
    create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    if create_client and not SUPABASE_CONFIG_ERROR
    else None
)

# Admin client for confirming users and other admin operations
supabase_admin: Optional[Client] = (
    create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    if create_client and SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL
    else None
)

ALGORITHM = "HS256"

EMOJI_PATTERN = re.compile(
    "["
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F680-\U0001F6FF"  # transport & map symbols
    "\U0001F700-\U0001F77F"  # alchemical symbols
    "\U0001F780-\U0001F7FF"  # geometric shapes extended
    "\U0001F800-\U0001F8FF"  # supplemental arrows-c
    "\U0001F900-\U0001F9FF"  # supplemental symbols and pictographs
    "\U0001FA00-\U0001FAFF"  # symbols and pictographs extended-a
    "\U00002702-\U000027B0"  # dingbats
    "\U000024C2-\U0001F251"  # enclosed characters
    "]+",
    flags=re.UNICODE,
)

DISALLOWED_USERNAME_CHARS = re.compile(r"[<>\"'`;]|--|/\*|\*/", flags=re.UNICODE)


def contains_emoji(value: str) -> bool:
    return bool(EMOJI_PATTERN.search(value))


def contains_disallowed_username_chars(value: str) -> bool:
    return bool(DISALLOWED_USERNAME_CHARS.search(value))


def contains_control_chars(value: str) -> bool:
    return any(not ch.isprintable() for ch in value)


def require_supabase() -> Client:
    if not supabase:
        raise HTTPException(status_code=500, detail=SUPABASE_CONFIG_ERROR or "Supabase client not configured")
    return supabase


def require_db_client() -> Client:
    return supabase_admin if supabase_admin else require_supabase()


def ensure_profile_upsert(response, fallback_message: str) -> None:
    error = getattr(response, "error", None)
    if error:
        error_code = getattr(error, "code", None)
        error_message = getattr(error, "message", None) or str(error)
        if error_code == "23505" or "duplicate key value" in error_message:
            raise HTTPException(status_code=409, detail="Email is already registered, would you like to sign in?")
        raise HTTPException(status_code=500, detail=error_message)
    if not response.data:
        raise HTTPException(status_code=500, detail=fallback_message)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def parse_timestamp(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def parse_iso_datetime_or_400(value: str, field_name: str) -> datetime:
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")


def intervals_overlap(start_a: datetime, end_a: datetime, start_b: datetime, end_b: datetime) -> bool:
    return start_a < end_b and end_a > start_b


def store_refresh_token(user_id: str, token: str, user_agent: Optional[str], ip_address: Optional[str]) -> None:
    db = require_db_client()
    token_hash = hash_token(token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    response = db.table("refresh_tokens").insert({
        "user_id": user_id,
        "token_hash": token_hash,
        "expires_at": expires_at.isoformat(),
        "user_agent": user_agent,
        "ip_address": ip_address,
    }).execute()
    if getattr(response, "error", None):
        raise HTTPException(status_code=500, detail="Failed to store session")


def get_refresh_token_record(token: str) -> Optional[Dict[str, Any]]:
    db = require_db_client()
    token_hash = hash_token(token)
    response = db.table("refresh_tokens").select("*").eq("token_hash", token_hash).limit(1).execute()
    if getattr(response, "error", None):
        raise HTTPException(status_code=500, detail="Failed to verify session")
    return response.data[0] if response.data else None


def revoke_refresh_token(token: str) -> None:
    db = require_db_client()
    token_hash = hash_token(token)
    db.table("refresh_tokens").update({
        "revoked_at": datetime.now(timezone.utc).isoformat()
    }).eq("token_hash", token_hash).execute()


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "access"})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "refresh"})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


class AuthSessionRequest(BaseModel):
    access_token: str = Field(..., min_length=10)


class RegisterRequest(BaseModel):
    access_token: str = Field(..., min_length=10)
    fullname: Optional[str] = None

    @field_validator("fullname")
    def validate_fullname_safe(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Full name contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Full name contains invalid characters")
        return value


class ProfileUpdateRequest(BaseModel):
    fullname: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None

    @field_validator("fullname")
    def validate_fullname_safe(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Full name contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Full name contains invalid characters")
        return value

    @field_validator("email")
    def validate_email_safe(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Email contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Email contains invalid characters")
        return value

    @field_validator("username")
    def validate_username_safe(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Username contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Username contains invalid characters")
        return value


class CreateProjectRequest(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = ""
    color: Optional[str] = "#78716c"


class AddMemberRequest(BaseModel):
    member_username: str = Field(..., min_length=1)
    role: str = "member"

    @field_validator("member_username")
    def validate_member_username_safe(cls, value: str) -> str:
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Username contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Username contains invalid characters")
        return value


class LinkProjectRequest(BaseModel):
    source_project_id: str = Field(..., min_length=1)


class CreateWorkflowRequest(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = ""
    member_ids: Optional[List[str]] = None
    parent_id: Optional[str] = None


class AssignWorkflowMemberRequest(BaseModel):
    username: str = Field(..., min_length=1)
    role: str = "member"

    @field_validator("username")
    def validate_username_safe(cls, value: str) -> str:
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Username contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Username contains invalid characters")
        return value


class CreateDeadlineRequest(BaseModel):
    title: str = Field(..., min_length=1)
    due_date: str = Field(..., min_length=1)
    assigned_to: str = Field(..., min_length=1)

    @field_validator("assigned_to")
    def validate_assigned_to_safe(cls, value: str) -> str:
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Username contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Username contains invalid characters")
        return value

    @field_validator("due_date")
    def validate_due_date(cls, value: str) -> str:
        try:
            normalized = normalize_deadline_due_date(value)
            due = date.fromisoformat(normalized)
            if due < datetime.now(timezone.utc).date():
                raise ValueError("Deadline date cannot be in the past")
        except ValueError:
            raise ValueError("Invalid due_date; use YYYY-MM-DD and not in the past")
        return value


class UpdateDeadlineRequest(BaseModel):
    title: Optional[str] = None
    due_date: Optional[str] = None
    assigned_to: Optional[str] = None
    status: Optional[str] = None

    @field_validator("assigned_to")
    def validate_assigned_to_safe_optional(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Username contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Username contains invalid characters")
        return value

    @field_validator("due_date")
    def validate_due_date_optional(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        try:
            normalized = normalize_deadline_due_date(value)
            due = date.fromisoformat(normalized)
            if due < datetime.now(timezone.utc).date():
                raise ValueError("Deadline date cannot be in the past")
        except ValueError:
            raise ValueError("Invalid due_date; use YYYY-MM-DD and not in the past")
        return value

    @field_validator("status")
    def validate_status_optional(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        allowed = {"pending", "in_progress", "completed"}
        normalized = value.strip().lower()
        if normalized not in allowed:
            raise ValueError("Invalid status; use pending, in_progress, or completed")
        return normalized


class AddBusyTimeRequest(BaseModel):
    start_time: str = Field(..., min_length=1)
    end_time: str = Field(..., min_length=1)
    description: Optional[str] = ""


class CreateCalendarEventRequest(BaseModel):
    title: str = Field(..., min_length=1)
    start_time: str = Field(..., min_length=1)
    end_time: str = Field(..., min_length=1)
    project_id: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = "meeting"
    color: Optional[str] = None


class UpdateCalendarEventRequest(BaseModel):
    title: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    color: Optional[str] = None


class FindMeetingSlotsRequest(BaseModel):
    start_time: str = Field(..., min_length=1)
    end_time: str = Field(..., min_length=1)
    duration_minutes: int = Field(30, ge=15, le=480)
    member_ids: Optional[List[str]] = None
    working_hours_start: Optional[str] = "08:00"
    working_hours_end: Optional[str] = "18:00"
    step_minutes: Optional[int] = Field(30, ge=15, le=120)


class ScheduleMeetingRequest(BaseModel):
    title: str = Field(..., min_length=1)
    start_time: str = Field(..., min_length=1)
    end_time: str = Field(..., min_length=1)
    member_ids: Optional[List[str]] = None
    description: Optional[str] = None
    color: Optional[str] = None
    event_type: Optional[str] = "meeting"


class CheckConflictsRequest(BaseModel):
    project_id: str = Field(..., min_length=1)
    start_time: str = Field(..., min_length=1)
    end_time: str = Field(..., min_length=1)


class UploadDocumentRequest(BaseModel):
    project_id: Optional[str] = None
    workflow_id: Optional[str] = None
    filename: str = Field(..., min_length=1)
    file_url: str = Field(..., min_length=1)


class UpdateDocumentAccessRequest(BaseModel):
    project_id: Optional[str] = None


class ChatbotRequest(BaseModel):
    question: str = Field(..., min_length=1)
    api_base: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None
    provider: Optional[str] = None


class NotificationSubscriptionRequest(BaseModel):
    subscription: dict

class CreateNotificationRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    type: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    message: Optional[str] = None
    related_id: Optional[str] = None


app = FastAPI()

# Configure CORS origins
allowed_origins = ["http://localhost:3000", "http://localhost:3001"]
if FRONTEND_ORIGIN:
    allowed_origins.append(FRONTEND_ORIGIN)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"]
)


# Add security response headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Prevent clickjacking (allow framing only from same origin)
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    # Enable XSS protection in older browsers
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Content Security Policy: restrict inline scripts, only allow from trusted origins
    csp = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' fastly.jsdelivr.net https: data:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'self'"
    response.headers["Content-Security-Policy"] = csp
    return response


CHATBOT_KNOWLEDGE = {
    # ── Dự án ──────────────────────────────────────────────────────────────
    "create_project": {
        "keywords": [
            "create project", "new project", "tạo dự án", "tạo project",
            "tao du an", "them du an", "thêm dự án", "bắt đầu dự án",
        ],
        "response": (
            "Để tạo dự án mới, bạn vào Dashboard rồi nhấn nút **Tạo dự án**. "
            "Điền tiêu đề và mô tả, sau đó nhấn Xác nhận. "
            "Bạn sẽ tự động trở thành trưởng nhóm (Project Lead) của dự án đó."
        ),
    },
    "delete_project": {
        "keywords": [
            "delete project", "xóa dự án", "xoa du an", "remove project",
            "hủy dự án", "xóa project",
        ],
        "response": (
            "Chỉ trưởng nhóm mới có thể xóa dự án. "
            "Vào **Cài đặt dự án → Xóa dự án**, nhập lại tên dự án để xác nhận. "
            "Lưu ý: toàn bộ dữ liệu liên quan (workflow, deadline, tài liệu) sẽ bị xóa vĩnh viễn."
        ),
    },
    "edit_project": {
        "keywords": [
            "edit project", "update project", "sửa dự án", "chỉnh sửa dự án",
            "cập nhật dự án", "doi ten du an", "đổi tên dự án",
        ],
        "response": (
            "Để chỉnh sửa dự án, mở dự án rồi vào **Cài đặt dự án**. "
            "Bạn có thể thay tiêu đề, mô tả hoặc màu sắc, sau đó nhấn Lưu. "
            "Chỉ trưởng nhóm mới có quyền chỉnh sửa thông tin dự án."
        ),
    },

    # ── Thành viên ─────────────────────────────────────────────────────────
    "add_members": {
        "keywords": [
            "add member", "thêm thành viên", "invite", "them thanh vien",
            "mời thành viên", "them nguoi", "thêm người", "add user",
        ],
        "response": (
            "Để thêm thành viên: mở dự án, vào **Quản lý thành viên → Thêm thành viên**, "
            "nhập tên đăng nhập (username) của người dùng, chọn vai trò (Member hoặc Lead), "
            "rồi nhấn Xác nhận. Chỉ trưởng nhóm mới có thể thêm thành viên."
        ),
    },
    "remove_member": {
        "keywords": [
            "remove member", "kick member", "xóa thành viên", "xoa thanh vien",
            "mời ra", "loại thành viên", "remove user",
        ],
        "response": (
            "Trưởng nhóm có thể xóa thành viên bằng cách vào **Quản lý thành viên**, "
            "nhấn vào biểu tượng xóa bên cạnh tên thành viên, rồi xác nhận. "
            "Thành viên bị xóa sẽ không còn truy cập được dự án."
        ),
    },
    "change_role": {
        "keywords": [
            "change role", "update role", "thay đổi vai trò", "thay doi vai tro",
            "phân quyền", "nâng quyền", "hạ quyền", "promote", "demote",
        ],
        "response": (
            "Để thay đổi vai trò thành viên, vào **Quản lý thành viên**, "
            "nhấn vào tên thành viên và chọn vai trò mới (Member / Lead). "
            "Chỉ trưởng nhóm hiện tại mới có quyền thực hiện thao tác này."
        ),
    },

    # ── Workflow ────────────────────────────────────────────────────────────
    "create_workflow": {
        "keywords": [
            "create workflow", "tạo workflow", "task breakdown", "them workflow",
            "thêm workflow", "tạo công việc", "tao cong viec",
        ],
        "response": (
            "Để tạo workflow: mở dự án, nhấn **Thêm Workflow**, điền tiêu đề và mô tả, "
            "sau đó phân công thành viên và đặt deadline. "
            "Workflow giúp chia nhỏ công việc trong dự án thành các phần dễ quản lý hơn."
        ),
    },
    "update_workflow": {
        "keywords": [
            "update workflow", "edit workflow", "sửa workflow", "cập nhật workflow",
            "sua workflow", "cap nhat workflow", "doi trang thai workflow",
            "đổi trạng thái workflow",
        ],
        "response": (
            "Để cập nhật workflow, mở workflow cần sửa rồi nhấn **Chỉnh sửa**. "
            "Bạn có thể thay tiêu đề, mô tả hoặc trạng thái (Đang chờ / Đang làm / Hoàn thành). "
            "Lưu lại sau khi chỉnh xong."
        ),
    },

    # ── Deadline ────────────────────────────────────────────────────────────
    "deadline": {
        "keywords": [
            "deadline", "due date", "hạn chót", "han chot", "ngày hết hạn",
            "ngay het han", "thêm deadline", "đặt deadline",
        ],
        "response": (
            "Để thêm deadline: mở workflow, nhấn **Thêm Deadline**, đặt tiêu đề, "
            "chọn ngày hết hạn và phân công cho một thành viên. "
            "Hệ thống sẽ gửi thông báo tự động khi deadline đến gần. "
            "Lưu ý: ngày hết hạn không được đặt trong quá khứ."
        ),
    },
    "update_deadline_status": {
        "keywords": [
            "complete deadline", "hoàn thành deadline", "hoan thanh deadline",
            "đánh dấu hoàn thành", "danh dau hoan thanh", "cập nhật deadline",
            "cap nhat deadline", "trạng thái deadline",
        ],
        "response": (
            "Để cập nhật trạng thái deadline, mở deadline cần thay đổi và chọn trạng thái mới: "
            "**Đang chờ (pending)**, **Đang làm (in_progress)** hoặc **Hoàn thành (completed)**. "
            "Chỉ thành viên được phân công hoặc trưởng nhóm mới có thể cập nhật."
        ),
    },

    # ── Lịch & Họp ─────────────────────────────────────────────────────────
    "schedule": {
        "keywords": [
            "calendar", "schedule", "busy time", "lịch", "lich",
            "thêm lịch", "them lich", "xem lịch", "quản lý lịch",
        ],
        "response": (
            "Để quản lý lịch, mở mục **Lịch (Calendar)**, nhấn **Thêm thời gian bận** "
            "và điền thời gian bắt đầu, kết thúc. "
            "Khi đặt cuộc họp, hệ thống tự động phát hiện xung đột lịch giữa các thành viên."
        ),
    },
    "schedule_meeting": {
        "keywords": [
            "schedule meeting", "tạo cuộc họp", "dat cuoc hop", "đặt cuộc họp",
            "book meeting", "meeting", "cuộc họp", "cuoc hop", "họp nhóm",
        ],
        "response": (
            "Để tạo cuộc họp: vào **Lịch**, nhấn **Tạo cuộc họp**, điền tiêu đề, "
            "chọn thời gian bắt đầu/kết thúc và chọn thành viên tham dự. "
            "Hệ thống sẽ kiểm tra xung đột lịch và gợi ý khung giờ phù hợp cho cả nhóm."
        ),
    },
    "find_free_slot": {
        "keywords": [
            "find slot", "free time", "thời gian rảnh", "thoi gian ranh",
            "khung giờ trống", "gợi ý lịch họp", "goi y lich hop",
        ],
        "response": (
            "Tính năng **Tìm khung giờ trống** tự động so sánh lịch bận của tất cả thành viên "
            "và gợi ý các khung giờ phù hợp. "
            "Vào **Lịch → Tìm khung giờ**, chọn khoảng ngày, thời lượng và thành viên cần tham dự."
        ),
    },

    # ── Tài liệu ────────────────────────────────────────────────────────────
    "documents": {
        "keywords": [
            "document", "upload", "tài liệu", "tai lieu", "file",
            "tải lên", "tai len", "đính kèm", "dinh kem",
        ],
        "response": (
            "Để tải tài liệu lên: mở dự án hoặc workflow, nhấn **Tải lên tài liệu**, "
            "chọn file từ máy tính rồi xác nhận. "
            "Tất cả thành viên trong dự án đều có thể xem và tải xuống tài liệu dùng chung."
        ),
    },
    "download_document": {
        "keywords": [
            "download document", "tải xuống", "tai xuong", "download file",
            "xem tài liệu", "xem tai lieu",
        ],
        "response": (
            "Để tải xuống tài liệu: mở mục **Tài liệu** trong dự án hoặc workflow, "
            "tìm file cần tải và nhấn biểu tượng **Tải xuống**. "
            "Link tải sẽ hết hạn sau 15 phút vì lý do bảo mật."
        ),
    },
    "delete_document": {
        "keywords": [
            "delete document", "xóa tài liệu", "xoa tai lieu", "remove file",
            "xóa file",
        ],
        "response": (
            "Để xóa tài liệu: mở mục **Tài liệu**, nhấn vào biểu tượng xóa bên cạnh file. "
            "Chỉ người đã tải lên hoặc trưởng nhóm mới có thể xóa. "
            "Tài liệu bị xóa sẽ không thể khôi phục."
        ),
    },

    # ── Tài khoản ───────────────────────────────────────────────────────────
    "register": {
        "keywords": [
            "register", "sign up", "đăng ký", "dang ky", "tạo tài khoản",
            "tao tai khoan", "tao account",
        ],
        "response": (
            "Để đăng ký tài khoản, truy cập trang chủ và nhấn **Đăng ký**. "
            "Điền email, mật khẩu và tên đầy đủ, sau đó xác nhận qua email. "
            "Sau khi xác thực, bạn có thể đăng nhập và bắt đầu tạo dự án."
        ),
    },
    "login": {
        "keywords": [
            "login", "sign in", "đăng nhập", "dang nhap", "log in",
            "vao tai khoan", "vào tài khoản",
        ],
        "response": (
            "Để đăng nhập, nhấn **Đăng nhập** ở trang chủ, nhập email và mật khẩu. "
            "Nếu quên mật khẩu, nhấn **Quên mật khẩu** để đặt lại qua email."
        ),
    },
    "logout": {
        "keywords": [
            "logout", "sign out", "đăng xuất", "dang xuat", "thoat tai khoan",
            "thoát tài khoản",
        ],
        "response": (
            "Để đăng xuất, nhấn vào **ảnh đại diện / tên tài khoản** ở góc trên bên phải "
            "và chọn **Đăng xuất**. Phiên làm việc sẽ kết thúc ngay lập tức."
        ),
    },
    "update_profile": {
        "keywords": [
            "update profile", "edit profile", "cập nhật hồ sơ", "cap nhat ho so",
            "sửa thông tin", "doi ten", "đổi tên", "thay avatar", "thay anh dai dien",
        ],
        "response": (
            "Để cập nhật hồ sơ, nhấn vào **ảnh đại diện → Cài đặt tài khoản**. "
            "Bạn có thể thay tên hiển thị, username hoặc email, sau đó nhấn **Lưu thay đổi**."
        ),
    },
    "forgot_password": {
        "keywords": [
            "forgot password", "reset password", "quên mật khẩu", "quen mat khau",
            "lấy lại mật khẩu", "lay lai mat khau", "đổi mật khẩu",
        ],
        "response": (
            "Nếu quên mật khẩu, ở trang đăng nhập nhấn **Quên mật khẩu**, "
            "nhập địa chỉ email đã đăng ký. "
            "Hệ thống sẽ gửi link đặt lại mật khẩu, link có hiệu lực trong 24 giờ."
        ),
    },

    # ── Thông báo ───────────────────────────────────────────────────────────
    "notifications": {
        "keywords": [
            "notification", "thông báo", "thong bao", "chuông", "alert",
            "nhận thông báo", "nhan thong bao",
        ],
        "response": (
            "Thông báo xuất hiện ở biểu tượng chuông góc trên bên phải. "
            "Bạn sẽ nhận thông báo khi: được thêm vào dự án, có deadline sắp đến, "
            "hoặc khi có thay đổi quan trọng trong dự án bạn tham gia. "
            "Nhấn vào thông báo để đánh dấu đã đọc."
        ),
    },

    # ── Vai trò & Quyền hạn ─────────────────────────────────────────────────
    "roles_permissions": {
        "keywords": [
            "role", "permission", "quyền", "quyen", "vai trò", "vai tro",
            "lead", "member", "trưởng nhóm", "truong nhom", "quyền hạn",
        ],
        "response": (
            "Hệ thống có 2 vai trò chính:\n"
            "• **Trưởng nhóm (Lead)**: tạo/xóa dự án, thêm/xóa thành viên, chỉnh sửa mọi thứ.\n"
            "• **Thành viên (Member)**: xem dự án, tạo workflow, thêm deadline và tải tài liệu.\n"
            "Trưởng nhóm có thể nâng/hạ vai trò thành viên bất kỳ lúc nào."
        ),
    },

    # ── Hướng dẫn chung ─────────────────────────────────────────────────────
    "general": {
        "keywords": [
            "help", "guide", "how to", "hướng dẫn", "huong dan",
            "giúp", "giup", "cần hỗ trợ", "can ho tro", "tôi cần giúp đỡ",
        ],
        "response": (
            "Xin chào! Tôi có thể hỗ trợ bạn về:\n"
            "• Tạo / chỉnh sửa / xóa **dự án**\n"
            "• Quản lý **thành viên** và vai trò\n"
            "• Tạo và cập nhật **workflow**\n"
            "• Thêm và theo dõi **deadline**\n"
            "• Quản lý **lịch** và đặt **cuộc họp**\n"
            "• Tải lên / tải xuống **tài liệu**\n"
            "• Cài đặt **tài khoản** và thông báo\n\n"
            "Hãy đặt câu hỏi cụ thể để tôi hỗ trợ bạn tốt hơn nhé!"
        ),
    },
}


def find_best_match(question: str) -> str:
    question_lower = question.lower()
    for data in CHATBOT_KNOWLEDGE.values():
        for keyword in data["keywords"]:
            if keyword.lower() in question_lower:
                return data["response"]
    return CHATBOT_KNOWLEDGE["general"]["response"]


def call_external_chatbot(question: str, api_key: str, api_base: str, model: str) -> str:
    if not api_base:
        raise HTTPException(
            status_code=500,
            detail="CHATBOT_API_BASE is not configured. Set it in your .env file (e.g. https://api.openai.com/v1 or https://api.featherless.ai/v1)",
        )
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="No API key provided. Set CHATBOT_API_KEY in your .env file.",
        )
    url = f"{api_base.rstrip('/')}/chat/completions"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": CHATBOT_SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
        "temperature": 0.3,
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode("utf-8")
            data = json.loads(raw)
    except urllib.error.HTTPError as exc:
        body = ""
        parsed_message = ""
        try:
            body = exc.read().decode("utf-8")
            parsed = json.loads(body) if body else {}
            if isinstance(parsed, dict):
                err = parsed.get("error") or {}
                parsed_message = err.get("message") if isinstance(err, dict) else ""
            elif isinstance(parsed, list) and parsed and isinstance(parsed[0], dict):
                err = parsed[0].get("error") or {}
                parsed_message = err.get("message") if isinstance(err, dict) else ""
        except Exception:
            body = ""

        message = (parsed_message or body or str(exc)).strip()
        message_lower = message.lower()
        if exc.code == 429 or "quota" in message_lower or "resource_exhausted" in message_lower or "rate limit" in message_lower:
            raise HTTPException(
                status_code=429,
                detail="Chatbot provider quota exceeded. Using built-in fallback response.",
            )

        raise HTTPException(status_code=502, detail=f"Chatbot provider error: {message}")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Chatbot provider unavailable: {str(exc)}")

    choices = data.get("choices") or []
    if not choices:
        raise HTTPException(status_code=502, detail="Chatbot provider returned no choices")

    message = (choices[0] or {}).get("message") or {}
    content = message.get("content")
    if isinstance(content, list):
        # Some providers return structured content blocks.
        content = "\n".join(part.get("text", "") for part in content if isinstance(part, dict))
    if not isinstance(content, str) or not content.strip():
        raise HTTPException(status_code=502, detail="Chatbot provider returned empty content")
    return content.strip()


def infer_chatbot_provider(provider_hint: Optional[str], api_base: str, model: str) -> str:
    hint = (provider_hint or "").strip().lower()
    if hint in {"openai", "openai-compatible", "openai_compatible"}:
        return "openai-compatible"
    if hint in {"google", "google-ai-studio", "gemini"}:
        return "google-ai-studio"

    base_lower = (api_base or "").lower()
    model_lower = (model or "").lower()
    if "generativelanguage.googleapis.com" in base_lower or "gemini" in model_lower:
        return "google-ai-studio"

    return "openai-compatible"


def call_google_ai_studio_chat(question: str, api_key: str, api_base: str, model: str) -> str:
    if not api_key:
        raise HTTPException(status_code=500, detail="No API key provided for Google AI Studio")

    resolved_model = (model or "gemini-1.5-flash").strip()
    if not resolved_model.startswith("models/"):
        resolved_model = f"models/{resolved_model}"

    resolved_base = (api_base or "https://generativelanguage.googleapis.com/v1beta").strip().rstrip("/")
    resolved_base = validate_url_safe(resolved_base)
    encoded_key = urllib.parse.quote(api_key, safe="")
    url = f"{resolved_base}/{resolved_model}:generateContent?key={encoded_key}"

    payload = {
        "systemInstruction": {"parts": [{"text": CHATBOT_SYSTEM_PROMPT}]},
        "contents": [{"role": "user", "parts": [{"text": question}]}],
        "generationConfig": {"temperature": 0.3},
    }

    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode("utf-8")
            data = json.loads(raw)
    except urllib.error.HTTPError as exc:
        body = ""
        parsed_message = ""
        try:
            body = exc.read().decode("utf-8")
            parsed = json.loads(body) if body else {}
            if isinstance(parsed, dict):
                err = parsed.get("error") or {}
                parsed_message = err.get("message") if isinstance(err, dict) else ""
        except Exception:
            body = ""

        message = (parsed_message or body or str(exc)).strip()
        message_lower = message.lower()
        if exc.code == 429 or "quota" in message_lower or "resource_exhausted" in message_lower or "rate limit" in message_lower:
            raise HTTPException(
                status_code=429,
                detail="Chatbot provider quota exceeded. Using built-in fallback response.",
            )

        raise HTTPException(status_code=502, detail=f"Google AI Studio error: {message}")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Google AI Studio unavailable: {str(exc)}")

    candidates = data.get("candidates") or []
    if not candidates:
        raise HTTPException(status_code=502, detail="Google AI Studio returned no candidates")

    content = (candidates[0] or {}).get("content") or {}
    parts = content.get("parts") or []
    text_parts = [part.get("text", "") for part in parts if isinstance(part, dict)]
    answer = "\n".join(text.strip() for text in text_parts if isinstance(text, str) and text.strip()).strip()
    if not answer:
        raise HTTPException(status_code=502, detail="Google AI Studio returned empty content")

    return answer


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    # HttpOnly cookie for backend auth
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")


def get_current_user(
    http_request: Request,
    access_token: Optional[str] = Cookie(None)
) -> Dict[str, Any]:
    """Validate access token and check active session in database"""
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_token(access_token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Validate that user has an active session (refresh token exists and is not revoked)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing user ID")

    # If admin client is unavailable, refresh_tokens checks can be blocked by RLS.
    # Fall back to JWT validation so authenticated users can still access protected routes.
    if not supabase_admin:
        return payload
    
    # Use DB client with service-role fallback so server-side session checks
    # are not blocked by RLS on refresh_tokens.
    db = require_db_client()
    now_utc = datetime.now(timezone.utc)
    
    # Get current client info for validation
    current_ip = http_request.client.host if http_request and http_request.client else None
    current_user_agent = http_request.headers.get("user-agent") if http_request else None
    
    # Check if user has at least one active (non-revoked, non-expired) refresh token
    session_response = db.table("refresh_tokens").select("revoked_at, expires_at, ip_address, user_agent").eq("user_id", user_id).limit(100).execute()
    
    has_active_session = False
    ip_mismatch = False
    user_agent_mismatch = False
    
    for record in session_response.data:
        if record.get("revoked_at"):
            continue  # Skip revoked tokens
        expires_at = parse_timestamp(record.get("expires_at"))
        if expires_at and expires_at >= now_utc:
            has_active_session = True
            
            # Validate IP and User-Agent match (optional but recommended in production)
            stored_ip = record.get("ip_address")
            stored_user_agent = record.get("user_agent")
            
            # Check IP mismatch (warning: can be unreliable with proxies/VPN)
            if stored_ip and current_ip and stored_ip != current_ip:
                ip_mismatch = True
            
            # Check User-Agent mismatch (reliable indicator of hijacking)
            if stored_user_agent and current_user_agent and stored_user_agent != current_user_agent:
                user_agent_mismatch = True
            
            # If we found multiple mismatches, likely suspicious
            if ip_mismatch and user_agent_mismatch:
                raise HTTPException(status_code=401, detail="Session security check failed. Please sign in again")
            
            break
    
    if not has_active_session:
        raise HTTPException(status_code=401, detail="Session revoked or expired. Please sign in again")
    
    return payload



def require_project_member(user_id: str, project_id: str) -> Dict[str, Any]:
    db = require_db_client()
    membership = db.table("project_members").select("id, role").eq("project_id", project_id).eq("user_id", user_id).execute()
    if not membership.data:
        raise HTTPException(status_code=403, detail="Not a project member")
    return membership.data[0]


def require_project_lead(user_id: str, project_id: str) -> None:
    membership = require_project_member(user_id, project_id)
    if membership.get("role") != "lead":
        raise HTTPException(status_code=403, detail="Insufficient permissions")


VALID_CHAT_MEMBER_ROLES = {"admin", "member"}


def is_chat_channel_admin(db: Client, channel_id: str, user_id: str) -> bool:
    membership = (
        db.table("chat_channel_members")
        .select("role")
        .eq("channel_id", channel_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return bool(membership.data and membership.data[0].get("role") == "admin")


def is_project_channel_lead(db: Client, project_id: str, user_id: str) -> bool:
    membership = (
        db.table("project_members")
        .select("role")
        .eq("project_id", project_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return bool(membership.data and membership.data[0].get("role") == "lead")


def can_manage_chat_channel(db: Client, channel: Dict[str, Any], user_id: str) -> bool:
    if channel.get("created_by") == user_id:
        return True
    project_id = channel.get("project_id")
    if project_id:
        return is_project_channel_lead(db, project_id, user_id)
    return is_chat_channel_admin(db, channel["id"], user_id)


def auto_promote_oldest_member_if_needed(db: Client, channel_id: str) -> Optional[str]:
    has_admin = (
        db.table("chat_channel_members")
        .select("user_id")
        .eq("channel_id", channel_id)
        .eq("role", "admin")
        .limit(1)
        .execute()
    )
    if has_admin.data:
        return None

    candidate = (
        db.table("chat_channel_members")
        .select("user_id")
        .eq("channel_id", channel_id)
        .order("joined_at", desc=False)
        .order("user_id", desc=False)
        .limit(1)
        .execute()
    )
    if not candidate.data:
        return None

    promoted_user_id = candidate.data[0]["user_id"]
    db.table("chat_channel_members").update({"role": "admin"}).eq("channel_id", channel_id).eq("user_id", promoted_user_id).execute()
    return promoted_user_id

# --- Chat API ---

class ConnectionManager:
    def __init__(self):
        # channel_id -> list of active connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, channel_id: str, websocket: WebSocket):
        await websocket.accept()
        if channel_id not in self.active_connections:
            self.active_connections[channel_id] = []
        self.active_connections[channel_id].append(websocket)

    def disconnect(self, channel_id: str, websocket: WebSocket):
        if channel_id in self.active_connections:
            if websocket in self.active_connections[channel_id]:
                self.active_connections[channel_id].remove(websocket)
            if not self.active_connections[channel_id]:
                del self.active_connections[channel_id]

    async def broadcast(self, channel_id: str, message: dict):
        if channel_id in self.active_connections:
            for connection in self.active_connections[channel_id][:]:
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(channel_id, connection)

manager = ConnectionManager()

async def async_broadcast(channel_id: str, message: dict):
    await manager.broadcast(channel_id, message)

@app.websocket("/api/chat/ws")
async def websocket_chat(websocket: WebSocket, channel_id: str = Query(...), access_token_query: str = Query(None, alias="access_token"), access_token_cookie: str = Cookie(None, alias="access_token")):
    try:
        token = access_token_query or access_token_cookie
        if not token:
            await websocket.close(code=1008)
            return
        payload = verify_token(token)
        if not payload or payload.get("type") != "access":
            await websocket.close(code=1008)
            return
        user_id = payload.get("sub")
    except Exception:
        await websocket.close(code=1008)
        return
        
    await manager.connect(channel_id, websocket)
    try:
        while True:
            # Keep the connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(channel_id, websocket)


class CreateChannelRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    emails: Optional[list[str]] = None
    project_id: Optional[str] = None
    channel_type: Optional[str] = "team"

    @field_validator("name")
    def validate_name(cls, v):
        if v is None:
            return v
        return sanitize_chat_input(v)

class SendMessageRequest(BaseModel):
    channel_id: str
    message: constr(min_length=1, max_length=2000)

    @field_validator("message")
    def validate_message(cls, v):
        return sanitize_chat_input(v)

# List channels for a project
@app.get("/api/chat/channels")
def list_chat_channels(project_id: Optional[str] = Query(None), user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    # Only channels user has access to (by project membership)
    if project_id:
        require_project_member(user_id, project_id)
        channels = db.table("chat_channels").select("*").eq("project_id", project_id).eq("is_archived", False).order("created_at").execute()
    else:
        # 1. Get project IDs user is part of
        memberships = db.table("project_members").select("project_id").eq("user_id", user_id).execute()
        project_ids = [m["project_id"] for m in memberships.data]
        
        # 2. Get direct/group channels user is explicitly a member of
        direct_memberships = db.table("chat_channel_members").select("channel_id").eq("user_id", user_id).execute()
        direct_channel_ids = [m["channel_id"] for m in direct_memberships.data]
        
        # 3. Build query: Channels in my projects OR Channels I am a member of
        or_conditions = []
        if project_ids:
            or_conditions.append(f"project_id.in.({','.join(project_ids)})")
        if direct_channel_ids:
            or_conditions.append(f"id.in.({','.join(direct_channel_ids)})")
        
        if not or_conditions:
            return []
            
        query_str = ",".join(or_conditions)
        channels_resp = db.table("chat_channels").select("*").or_(query_str).eq("is_archived", False).order("last_message_at", desc=True).execute()
        channels = channels_resp.data

    return channels

# Create a new chat channela
@app.post("/api/chat/channels")
def create_chat_channel(request: CreateChannelRequest, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    
    # Handle Direct Message or Group Creation (via Email/Emails)
    target_emails = []
    if request.emails:
        target_emails = request.emails
    elif request.email:
        target_emails = [request.email]
        
    if target_emails:
        # 1. Find the target users and current user details
        targets_resp = db.table("profiles").select("id, full_name, username").in_("email", target_emails).execute()
        if not targets_resp.data:
            raise HTTPException(status_code=404, detail="Users with these emails not found")
            
        target_users = targets_resp.data
        target_ids = [u["id"] for u in target_users]
        
        if user_id in target_ids:
            target_ids = [tid for tid in target_ids if tid != user_id]
            target_users = [u for u in target_users if u["id"] != user_id]
            
        if not target_ids:
            raise HTTPException(status_code=400, detail="You cannot create a chat with only yourself")
            
        # 2. Check if DM already exists (reuse existing) ONLY for 1-on-1
        if len(target_ids) == 1:
            target_id = target_ids[0]
            my_channels = db.table("chat_channel_members").select("channel_id").eq("user_id", user_id).execute()
            if my_channels.data:
                my_channel_ids = [x['channel_id'] for x in my_channels.data]
                common = db.table("chat_channel_members").select("channel_id").eq("user_id", target_id).in_("channel_id", my_channel_ids).execute()
                if common.data:
                    common_ids = [x['channel_id'] for x in common.data]
                    existing_dm = db.table("chat_channels").select("*").in_("id", common_ids).eq("channel_type", "dm").limit(1).execute()
                    if existing_dm.data:
                        return existing_dm.data[0]

        # 3. Generate Name: Combination of full names
        current_user_profile = db.table("profiles").select("full_name, username").eq("id", user_id).single().execute()
        my_name = current_user_profile.data.get("full_name") or current_user_profile.data.get("username") or "User"
        
        target_names = [u.get("full_name") or u.get("username") or "User" for u in target_users]
        channel_name = f"{my_name}, {', '.join(target_names)}"
        
        if len(channel_name) > 97:
            channel_name = channel_name[:94] + "..."

        # 4. Create new channel
        c_type = "dm" if len(target_ids) == 1 else "team"
        channel = db.table("chat_channels").insert({
            "project_id": None,
            "name": channel_name,
            "channel_type": c_type,
            "created_by": user_id,
            "last_message_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        if not channel.data:
            raise HTTPException(status_code=500, detail="Failed to create chat")
            
        # Add all users to the members table
        new_channel_id = channel.data[0]["id"]
        members_to_insert = [{"channel_id": new_channel_id, "user_id": user_id, "role": "admin"}]
        for tid in target_ids:
            members_to_insert.append({"channel_id": new_channel_id, "user_id": tid, "role": "member"})
            
        db.table("chat_channel_members").insert(members_to_insert).execute()
        
        return channel.data[0]

    # Handle Standard Project Channel Creation
    if request.project_id:
        require_project_member(user_id, request.project_id)
        
    if not request.name:
        raise HTTPException(status_code=400, detail="Channel name is required")
        
    channel = db.table("chat_channels").insert({
        "project_id": request.project_id,
        "name": request.name,
        "channel_type": request.channel_type or "team",
        "created_by": user_id,
        "last_message_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    if not channel.data:
        raise HTTPException(status_code=500, detail="Failed to create channel")
        
    # If it's a custom group (no project), add creator as member
    if not request.project_id:
        db.table("chat_channel_members").insert({
            "channel_id": channel.data[0]["id"],
            "user_id": user_id,
            "role": "admin"
        }).execute()
        
    return channel.data[0]

@app.delete("/api/chat/channels/{channel_id}")
def delete_chat_channel(channel_id: str, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    
    # Check channel existence
    channel = db.table("chat_channels").select("*").eq("id", channel_id).single().execute()
    if not channel.data:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if not can_manage_chat_channel(db, channel.data, user_id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this channel")

    # Delete messages first, then the channel
    db.table("chat_messages").delete().eq("channel_id", channel_id).execute()
    db.table("chat_channel_members").delete().eq("channel_id", channel_id).execute()
    db.table("chat_channels").delete().eq("id", channel_id).execute()
    
    return {"status": "success"}

@app.delete("/api/chat/channels/{channel_id}/leave")
def leave_chat_channel(channel_id: str, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")

    channel = db.table("chat_channels").select("id, project_id, created_by").eq("id", channel_id).single().execute()
    if not channel.data:
        raise HTTPException(status_code=404, detail="Channel not found")
    if channel.data.get("created_by") == user_id:
        raise HTTPException(status_code=400, detail="Channel creator cannot leave this channel")
    if channel.data.get("project_id"):
        raise HTTPException(status_code=400, detail="Project-linked channels cannot be left directly")
    
    # Check if user is actually a member
    membership = db.table("chat_channel_members").select("*").eq("channel_id", channel_id).eq("user_id", user_id).execute()
    if not membership.data:
        raise HTTPException(status_code=404, detail="You are not a member of this channel")
        
    # Delete the user from members
    db.table("chat_channel_members").delete().eq("channel_id", channel_id).eq("user_id", user_id).execute()
    if not channel.data.get("project_id"):
        auto_promote_oldest_member_if_needed(db, channel_id)
    
    return {"status": "success"}

class UpdateChannelRequest(BaseModel):
    name: Optional[str] = None
    project_id: Optional[str] = None
    created_by: Optional[str] = None

@app.patch("/api/chat/channels/{channel_id}")
def update_chat_channel(channel_id: str, request: UpdateChannelRequest, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    
    # Check channel existence and ownership
    channel = db.table("chat_channels").select("*").eq("id", channel_id).single().execute()
    if not channel.data:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if not can_manage_chat_channel(db, channel.data, user_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this channel")

    updates = {}
    if request.name is not None:
        updates["name"] = sanitize_chat_input(request.name)
    if request.project_id is not None:
        # Verify project membership
        require_project_member(user_id, request.project_id)
        updates["project_id"] = request.project_id
    if request.created_by is not None:
        updates["created_by"] = request.created_by

    if not updates:
        return channel.data[0]

    response = db.table("chat_channels").update(updates).eq("id", channel_id).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update channel")
        
    return response.data[0]

class AddChannelMemberRequest(BaseModel):
    email: str

@app.post("/api/chat/channels/{channel_id}/members")
def add_chat_member(channel_id: str, request: AddChannelMemberRequest, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    
    channel = db.table("chat_channels").select("*").eq("id", channel_id).single().execute()
    if not channel.data:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if not can_manage_chat_channel(db, channel.data, user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Find user to add
    target = db.table("profiles").select("id, full_name, username").eq("email", request.email).execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="User not found")
    new_member_id = target.data[0]["id"]
    if new_member_id == user_id:
        raise HTTPException(status_code=400, detail="You are already in this channel")
    
    # If project channel, add to project
    if channel.data.get("project_id"):
        existing_project_member = (
            db.table("project_members")
            .select("id")
            .eq("project_id", channel.data["project_id"])
            .eq("user_id", new_member_id)
            .limit(1)
            .execute()
        )
        if existing_project_member.data:
            return {"status": "success", "message": "User is already a project member"}

        db.table("project_members").insert({
            "project_id": channel.data["project_id"],
            "user_id": new_member_id,
            "role": "member"
        }).execute()
    else:
        existing_member = (
            db.table("chat_channel_members")
            .select("id")
            .eq("channel_id", channel_id)
            .eq("user_id", new_member_id)
            .limit(1)
            .execute()
        )
        if existing_member.data:
            return {"status": "success", "message": "User is already a channel member"}

        # DM/Group: Add to members table
        db.table("chat_channel_members").insert({
            "channel_id": channel_id,
            "user_id": new_member_id,
            "role": "member"
        }).execute()
        
        # Update channel name to include new member's name
        current_name = channel.data["name"]
        new_name_part = target.data[0].get("full_name") or target.data[0].get("username")
        new_name = f"{current_name}, {new_name_part}"
        db.table("chat_channels").update({"name": new_name}).eq("id", channel_id).execute()
            
    return {"status": "success"}

@app.get("/api/chat/channels/{channel_id}/members")
def get_chat_channel_members(channel_id: str, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    
    # Get channel
    channel = db.table("chat_channels").select("*").eq("id", channel_id).single().execute()
    if not channel.data:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    channel_data = channel.data
    
    # Check access (User must be in the channel to see members)
    has_access = False
    if channel_data.get("project_id"):
        check = db.table("project_members").select("id").eq("project_id", channel_data["project_id"]).eq("user_id", user_id).execute()
        if check.data:
            has_access = True
    else:
        check = db.table("chat_channel_members").select("id").eq("channel_id", channel_id).eq("user_id", user_id).execute()
        if check.data:
            has_access = True
            
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    if channel_data.get("project_id"):
        # Fetch project members
        response = db.table("project_members").select("role, profiles:user_id(id, username, full_name, email, avatar_url)").eq("project_id", channel_data["project_id"]).execute()
        members = []
        for row in response.data:
            if row.get("profiles"):
                p = row["profiles"]
                p["role"] = row.get("role")
                members.append(p)
        return members
    else:
        # Fetch from chat_channel_members
        response = db.table("chat_channel_members").select("user_id, role, profiles:user_id(id, username, full_name, email, avatar_url)").eq("channel_id", channel_id).execute()
        members = []
        for row in response.data:
            if row.get("profiles"):
                p = row["profiles"]
                p["role"] = row.get("role", "member")
                members.append(p)
        return members

class UpdateMemberRoleRequest(BaseModel):
    role: str

@app.patch("/api/chat/channels/{channel_id}/members/{target_user_id}/role")
def update_chat_channel_member_role(channel_id: str, target_user_id: str, request: UpdateMemberRoleRequest, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    
    channel = db.table("chat_channels").select("*").eq("id", channel_id).single().execute()
    if not channel.data:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    if not can_manage_chat_channel(db, channel.data, user_id):
        raise HTTPException(status_code=403, detail="Not authorized to change roles")
    if channel.data.get("project_id"):
        raise HTTPException(status_code=400, detail="Use project role management for project-linked channels")

    requested_role = request.role.strip().lower()
    if requested_role not in VALID_CHAT_MEMBER_ROLES:
        raise HTTPException(status_code=400, detail="Role must be one of: admin, member")
    if channel.data.get("created_by") == target_user_id and requested_role != "admin":
        raise HTTPException(status_code=400, detail="Channel creator must remain an admin")
        
    response = (
        db.table("chat_channel_members")
        .update({"role": requested_role})
        .eq("channel_id", channel_id)
        .eq("user_id", target_user_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update member role")

    if requested_role != "admin" and not channel.data.get("project_id"):
        auto_promote_oldest_member_if_needed(db, channel_id)

    return {"status": "success"}


@app.delete("/api/chat/channels/{channel_id}/members/{target_user_id}")
def remove_chat_member(channel_id: str, target_user_id: str, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")

    channel = db.table("chat_channels").select("*").eq("id", channel_id).single().execute()
    if not channel.data:
        raise HTTPException(status_code=404, detail="Channel not found")
    if not can_manage_chat_channel(db, channel.data, user_id):
        raise HTTPException(status_code=403, detail="Not authorized to remove members")
    if channel.data.get("created_by") == target_user_id:
        raise HTTPException(status_code=400, detail="Channel creator cannot be removed")

    if channel.data.get("project_id"):
        response = (
            db.table("project_members")
            .delete()
            .eq("project_id", channel.data["project_id"])
            .eq("user_id", target_user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Target user is not a project member")
        return {"status": "success"}

    target = (
        db.table("chat_channel_members")
        .select("user_id, role")
        .eq("channel_id", channel_id)
        .eq("user_id", target_user_id)
        .limit(1)
        .execute()
    )
    if not target.data:
        raise HTTPException(status_code=404, detail="Target user is not a channel member")

    db.table("chat_channel_members").delete().eq("channel_id", channel_id).eq("user_id", target_user_id).execute()
    auto_promote_oldest_member_if_needed(db, channel_id)
    return {"status": "success"}

# List messages in a channel (paginated)
@app.get("/api/chat/messages")
def list_chat_messages(channel_id: str = Query(...), limit: int = Query(30, ge=1, le=100), before: Optional[str] = Query(None), user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    # Check access
    channel = db.table("chat_channels").select("*").eq("id", channel_id).limit(1).execute()
    if not channel.data:
        raise HTTPException(status_code=404, detail="Channel not found")
    project_id = channel.data[0].get("project_id")
    if project_id:
        require_project_member(user_id, project_id)
    q = db.table("chat_messages").select("*, profiles!sender_id(username,avatar_url)").eq("channel_id", channel_id)
    if before:
        q = q.lt("sent_at", before)
    q = q.order("sent_at", desc=True).limit(limit)
    messages = q.execute()
    return list(reversed(messages.data)) if messages.data else []

@app.post("/api/chat/messages")
def send_chat_message(request: SendMessageRequest, background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    # Check access
    channel = db.table("chat_channels").select("*").eq("id", request.channel_id).limit(1).execute()
    if not channel.data:
        raise HTTPException(status_code=404, detail="Channel not found")
    project_id = channel.data[0].get("project_id")
    if project_id:
        require_project_member(user_id, project_id)
    # Insert message
    msg = db.table("chat_messages").insert({
        "channel_id": request.channel_id,
        "sender_id": user_id,
        "message": request.message,
    }).execute()
    if not msg.data:
        raise HTTPException(status_code=500, detail="Failed to send message")
    # Update channel last_message_at
    db.table("chat_channels").update({"last_message_at": datetime.now(timezone.utc).isoformat()}).eq("id", request.channel_id).execute()
    
    # Needs full message data for WS to include author details
    full_msg_query = db.table("chat_messages").select("*, profiles!sender_id(username,avatar_url)").eq("id", msg.data[0]["id"]).limit(1).execute()
    if full_msg_query.data:
        full_msg = full_msg_query.data[0]
        background_tasks.add_task(async_broadcast, request.channel_id, full_msg)
    else:
        background_tasks.add_task(async_broadcast, request.channel_id, msg.data[0])
        
    return msg.data[0]

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "supabase_configured": supabase is not None,
        "supabase_admin_configured": supabase_admin is not None,
        "config_error": SUPABASE_CONFIG_ERROR,
    }


@app.get("/health")
def health_root():
    return health()


@app.get("/healthz")
def healthz_root():
    return health()


class RegisterDirectRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)
    fullname: Optional[str] = None

    @field_validator("email")
    def validate_email_safe(cls, value: str) -> str:
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Email contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Email contains invalid characters")
        return value

    @field_validator("password")
    def validate_password_safe(cls, value: str) -> str:
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Password contains invalid characters")
        if "<" in value or ">" in value:
            raise ValueError("Password contains invalid characters")
        return value

    @field_validator("fullname")
    def validate_fullname_safe(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Full name contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Full name contains invalid characters")
        return value


@app.post("/api/auth/register-direct")
def register_direct(request: RegisterDirectRequest, response: Response, http_request: Request):
    """Register a new user directly with email/password and create backend session"""
    try:
        db = require_supabase()
        # Use regular client to sign up the user
        auth_response = db.auth.sign_up({"email": request.email, "password": request.password})
        user = auth_response.user if hasattr(auth_response, 'user') else None
        
        if not user or not user.id:
            print(f"Sign up failed: {auth_response}")
            raise HTTPException(status_code=400, detail="Failed to create user")
            
        # Detect fake user object returned by Supabase email enumeration protection
        if getattr(user, 'identities', None) is not None and len(user.identities) == 0:
            raise HTTPException(status_code=409, detail="Email is already registered, would you like to sign in?")

        # Try to auto-confirm, but don't fail if it doesn't work
        if supabase_admin:
            try:
                supabase_admin.auth.admin.update_user_by_id(user.id, {"email_confirm": True})
            except Exception as e:
                print(f"Note: Could not auto-confirm user: {str(e)}")
                # Continue anyway - user can still use their unconfirmed account for now

        # Create backend JWT tokens
        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id, "email": user.email})
        set_auth_cookies(response, access_token, refresh_token)

        # Create/update profile in database using admin client (bypasses RLS)
        full_name = request.fullname or user.email
        db_client = supabase_admin if supabase_admin else db
        profile_response = db_client.table("profiles").upsert({
            "id": user.id,
            "email": user.email,
            "full_name": full_name,
            "username": user.email,
        }).execute()

        ensure_profile_upsert(profile_response, "Failed to create profile")

        store_refresh_token(
            user.id,
            refresh_token,
            http_request.headers.get("user-agent"),
            http_request.client.host if http_request.client else None,
        )

        return {"status": "success", "user": {"id": user.id, "email": user.email, "full_name": full_name}}
    except HTTPException:
        raise
    except Exception as exc:
        error_str = str(exc).lower()
        # Check for common Supabase auth errors and provide friendly messages
        if "23505" in error_str or "23503" in error_str or "duplicate key" in error_str or "already registered" in error_str:
            raise HTTPException(status_code=409, detail="Email is already registered, would you like to sign in?")
        elif (
            "invalid email" in error_str
            or "invalid format" in error_str
            or ("email" in error_str and "invalid" in error_str)
        ):
            raise HTTPException(status_code=400, detail="Please enter a valid email address")
        elif "password" in error_str and ("weak" in error_str or "short" in error_str or "at least" in error_str):
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        elif "rate limit" in error_str:
            raise HTTPException(status_code=429, detail="Too many attempts. Please try again later")
        elif "network" in error_str or "timeout" in error_str or "connection" in error_str:
            raise HTTPException(status_code=503, detail="Service temporarily unavailable. Please try again")
        print(f"Register direct error: {str(exc)}")
        raise HTTPException(status_code=500, detail="An error occurred during registration. Please try again") from exc


@app.post("/api/auth/register")
def register(request: RegisterRequest, response: Response, http_request: Request):
    """Register a new user and create backend session from Supabase token"""
    try:
        db = require_supabase()
        # Verify the Supabase access token
        user_response = db.auth.get_user(request.access_token)
        user = getattr(user_response, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid Supabase token")
            
        # Detect fake user object returned by Supabase email enumeration protection
        if getattr(user, 'identities', None) is not None and len(user.identities) == 0:
            raise HTTPException(status_code=409, detail="Email is already registered, would you like to sign in?")

        # Auto-confirm the user via admin API so they can sign in immediately
        if supabase_admin:
            try:
                supabase_admin.auth.admin.update_user_by_id(
                    user.id,
                    {"email_confirm": True}
                )
            except Exception as e:
                print(f"Warning: Failed to auto-confirm user: {str(e)}")
                # Continue anyway - not critical if this fails

        # Create backend JWT tokens
        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id, "email": user.email})
        set_auth_cookies(response, access_token, refresh_token)

        # Create/update profile in database using admin client (bypasses RLS)
        full_name = request.fullname or (user.user_metadata or {}).get("full_name") or user.email
        db_client = supabase_admin if supabase_admin else db
        profile_response = db_client.table("profiles").upsert({
            "id": user.id,
            "email": user.email,
            "full_name": full_name,
            "username": user.email,
        }).execute()

        ensure_profile_upsert(profile_response, "Failed to create profile")

        store_refresh_token(
            user.id,
            refresh_token,
            http_request.headers.get("user-agent"),
            http_request.client.host if http_request.client else None,
        )

        return {"status": "success", "user": {"id": user.id, "email": user.email, "full_name": full_name}}
    except HTTPException:
        raise
    except Exception as exc:
        error_str = str(exc).lower()
        if "23505" in error_str or "23503" in error_str or "duplicate key" in error_str or "already registered" in error_str:
            raise HTTPException(status_code=409, detail="Email is already registered, would you like to sign in?")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/auth/session")
def create_session(request: AuthSessionRequest, response: Response, http_request: Request):
    """Create backend session from Supabase access token"""
    try:
        db = require_supabase()
        user_response = db.auth.get_user(request.access_token)
        user = getattr(user_response, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session. Please sign in again")

        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id, "email": user.email})
        set_auth_cookies(response, access_token, refresh_token)

        fullname = (user.user_metadata or {}).get("full_name") or user.email
        db_client = supabase_admin if supabase_admin else db
        profile_response = db_client.table("profiles").upsert({
            "id": user.id,
            "username": user.email,
            "email": user.email,
            "full_name": fullname,
        }).execute()

        ensure_profile_upsert(profile_response, "Failed to create profile")

        store_refresh_token(
            user.id,
            refresh_token,
            http_request.headers.get("user-agent"),
            http_request.client.host if http_request.client else None,
        )

        return {"status": "success", "user": {"id": user.id, "email": user.email, "full_name": fullname}}
    except HTTPException:
        raise
    except Exception as exc:
        error_str = str(exc).lower()
        if "invalid" in error_str and ("token" in error_str or "jwt" in error_str):
            raise HTTPException(status_code=401, detail="Invalid or expired session. Please sign in again")
        elif "expired" in error_str:
            raise HTTPException(status_code=401, detail="Session expired. Please sign in again")
        print(f"Session creation error: {str(exc)}")
        raise HTTPException(status_code=500, detail="Failed to create session. Please try again") from exc


@app.post("/api/auth/refresh")
def refresh_session(response: Response, http_request: Request, refresh_token: Optional[str] = Cookie(None)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    payload = verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    record = get_refresh_token_record(refresh_token)
    if not record or record.get("revoked_at"):
        raise HTTPException(status_code=401, detail="Refresh token revoked")
    if record.get("user_id") and record.get("user_id") != payload.get("sub"):
        raise HTTPException(status_code=401, detail="Refresh token mismatch")
    expires_at = parse_timestamp(record.get("expires_at"))
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")

    access_token = create_access_token({"sub": payload.get("sub"), "email": payload.get("email")})
    new_refresh_token = create_refresh_token({"sub": payload.get("sub"), "email": payload.get("email")})
    set_auth_cookies(response, access_token, new_refresh_token)
    revoke_refresh_token(refresh_token)
    store_refresh_token(
        payload.get("sub"),
        new_refresh_token,
        http_request.headers.get("user-agent"),
        http_request.client.host if http_request.client else None,
    )
    # Clean up old tokens: keep only the newest for this user
    db = require_db_client()
    user_id = payload.get("sub")
    # Get all tokens for user, order by created_at desc
    tokens_response = db.table("refresh_tokens").select("id, created_at, revoked_at").eq("user_id", user_id).order("created_at", desc=True).execute()
    if getattr(tokens_response, "error", None) is None and tokens_response.data:
        # Keep the newest token (not revoked), revoke others
        kept = 0
        for token_row in tokens_response.data:
            if token_row.get("revoked_at"):
                continue
            kept += 1
            if kept > 1:
                db.table("refresh_tokens").update({"revoked_at": datetime.now(timezone.utc).isoformat()}).eq("id", token_row["id"]).execute()
    return {"status": "success"}


@app.get("/api/auth/me")
def auth_me(access_token: Optional[str] = Cookie(None)):
    if not access_token:
        return {"authenticated": False, "user": None}
    
    payload = verify_token(access_token)
    if not payload or payload.get("type") != "access":
        return {"authenticated": False, "user": None}
    
    return {"authenticated": True, "user": {"id": payload.get("sub"), "email": payload.get("email")}, "ws_token": access_token}


@app.post("/api/auth/logout")
def logout(response: Response, refresh_token: Optional[str] = Cookie(None)):
    if refresh_token:
        revoke_refresh_token(refresh_token)
    clear_auth_cookies(response)
    return {"status": "success"}

@app.get("/api/profile")
def get_profile(user=Depends(get_current_user)):
    db = require_db_client()
    response = db.table("profiles").select("*").eq("id", user.get("sub")).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"profile": response.data[0]}


@app.post("/api/profile")
def update_profile(request: ProfileUpdateRequest, user=Depends(get_current_user)):
    db = require_db_client()
    
    # Check for username uniqueness if being updated
    if request.username:
        existing = db.table("profiles").select("id").eq("username", request.username).neq("id", user.get("sub")).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="Username is already taken")
            
    updates = {k: v for k, v in request.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    updates["id"] = user.get("sub")
    response = db.table("profiles").upsert(updates).execute()
    ensure_profile_upsert(response, "Failed to update profile")
    return {"profile": response.data[0]}


@app.get("/api/users/search")
def search_users(q: str, user=Depends(get_current_user)):
    if not q:
        return []
    db = require_db_client()
    response = db.table("profiles").select("id, email, username, full_name").or_(
        f"email.ilike.%{q}%,username.ilike.%{q}%,full_name.ilike.%{q}%"
    ).limit(5).execute()
    return response.data


@app.get("/api/projects")
def get_projects(user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    response = db.table("project_members").select("*, projects(*)").eq("user_id", user_id).execute()
    projects = []
    for item in response.data:
        if item.get("projects"):
            p = item["projects"]
            # Map DB 'name' to API 'title' for frontend compatibility
            p["title"] = p.get("name", p.get("title"))
            projects.append(p)
    return projects

@app.get("/api/projects/{project_id}")
def get_project_details(project_id: str, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    require_project_member(user_id, project_id)

    # Fetch project details and join with creator's profile
    response = db.table("projects").select("*, creator:creator_id(full_name, username)").eq("id", project_id).single().execute()

    if getattr(response, "error", None):
        raise HTTPException(status_code=404, detail="Project not found or error fetching data")
    if not response.data:
        raise HTTPException(status_code=404, detail="Project not found")

    project = response.data
    # Map DB 'name' to API 'title' for frontend compatibility
    project["title"] = project.get("name", project.get("title"))
    
    return project

@app.put("/api/projects/{project_id}")
def update_project(project_id: str, request: CreateProjectRequest, user=Depends(get_current_user)):
    db = require_db_client()
    require_project_lead(user.get("sub"), project_id)
    
    updates = {
        "name": request.title,
        "description": request.description or "",
        "color": request.color
    }
    
    response = db.table("projects").update(updates).eq("id", project_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project = response.data[0]
    project["title"] = project.get("name")
    project["color"] = project.get("color")
    return project


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, user=Depends(get_current_user)):
    try:
        db = require_db_client()
        require_project_lead(user.get("sub"), project_id)

        # 1. Get workspaces to delete their dependencies
        workspaces = db.table("workspaces").select("id").eq("project_id", project_id).execute()
        workspace_ids = [w["id"] for w in workspaces.data]
        
        if workspace_ids:
            # Delete deadlines and workspace members
            db.table("workspace_deadlines").delete().in_("workspace_id", workspace_ids).execute()
            db.table("workspace_assignments").delete().in_("workspace_id", workspace_ids).execute()
            # Delete workspaces
            db.table("workspaces").delete().in_("id", workspace_ids).execute()

        # 2. Delete project documents and members
        db.table("documents").delete().eq("project_id", project_id).execute()
        db.table("project_members").delete().eq("project_id", project_id).execute()
        
        # 3. Delete project
        db.table("projects").delete().eq("id", project_id).execute()
        
        return {"status": "success"}
    except Exception as e:
        print(f"Delete project error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")


@app.post("/api/projects")
def create_project(request: CreateProjectRequest, user=Depends(get_current_user)):
    try:
        db = require_db_client()
        user_id = user.get("sub")
        project_data = {
            "name": request.title,
            "description": request.description or "",
            "creator_id": user_id,
            "status": "in_process",
            "color": request.color or "#78716c",
        }
        response = db.table("projects").insert(project_data).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create project: No data returned from DB")

        project = response.data[0]
        project["title"] = project.get("name") # Map for frontend
        project["color"] = project.get("color")
        
        db.table("project_members").insert({
            "project_id": project["id"],
            "user_id": user_id,
            "role": "lead",
        }).execute()

        return project
    except Exception as e:
        print(f"Create project error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.get("/api/projects/{project_id}/members")
def get_project_members(project_id: str, user=Depends(get_current_user)):
    db = require_db_client()
    require_project_member(user.get("sub"), project_id)

    try:
        response = db.table("project_members").select("role, profiles:user_id(id, username, full_name, email)").eq("project_id", project_id).execute()
    except Exception as exc:
        print(f"Members join query failed, falling back: {exc}")
        # Fallback: fetch members without join, then fetch profiles separately
        pm_response = db.table("project_members").select("user_id, role").eq("project_id", project_id).execute()
        if not pm_response.data:
            return []
        members = []
        for row in pm_response.data:
            profile_resp = db.table("profiles").select("id, username, full_name, email").eq("id", row["user_id"]).limit(1).execute()
            if profile_resp.data:
                member_data = profile_resp.data[0]
                member_data["role"] = row.get("role")
                members.append(member_data)
        return members

    if getattr(response, "error", None):
        raise HTTPException(status_code=500, detail="Failed to fetch members")

    members = []
    for row in (response.data or []):
        if row.get("profiles"):
            member_data = row["profiles"]
            member_data["role"] = row.get("role")
            members.append(member_data)
    return members

@app.post("/api/projects/{project_id}/members")
def add_project_member(project_id: str, request: AddMemberRequest, user=Depends(get_current_user)):
    db = require_db_client()
    require_project_lead(user.get("sub"), project_id)
    profile_response = db.table("profiles").select("id").eq("username", request.member_username).execute()
    if not profile_response.data:
        raise HTTPException(status_code=404, detail="User not found")

    member_id = profile_response.data[0]["id"]
    insert_response = db.table("project_members").insert({
        "project_id": project_id,
        "user_id": member_id,
        "role": request.role,
    }).execute()

    if not insert_response.data:
        raise HTTPException(status_code=500, detail="Failed to add member")
    return insert_response.data[0]


@app.post("/api/projects/{project_id}/link-project")
def link_project_members(project_id: str, request: LinkProjectRequest, user=Depends(get_current_user)):
    """Link a project by adding all its members to the current project"""
    db = require_db_client()
    require_project_lead(user.get("sub"), project_id)
    
    # Verify source project exists and user is a member
    require_project_member(user.get("sub"), request.source_project_id)
    
    # Get all members from source project
    response = db.table("project_members").select("user_id, role").eq("project_id", request.source_project_id).execute()
    if getattr(response, "error", None):
        raise HTTPException(status_code=500, detail="Failed to fetch source project members")
    
    source_members = response.data or []
    if not source_members:
        raise HTTPException(status_code=400, detail="Source project has no members")
    
    # Add all members to target project (skip if already exists)
    added_count = 0
    failed_members = []
    
    for member_data in source_members:
        user_id = member_data.get("user_id")
        role = member_data.get("role", "member")
        
        # Check if member already exists in target project
        existing = db.table("project_members").select("id").eq("project_id", project_id).eq("user_id", user_id).execute()
        if existing.data:
            continue  # Skip if already a member
        
        # Add member
        try:
            insert_response = db.table("project_members").insert({
                "project_id": project_id,
                "user_id": user_id,
                "role": role,
            }).execute()
            if insert_response.data:
                added_count += 1
            else:
                failed_members.append(user_id)
        except Exception as e:
            failed_members.append(user_id)
    
    return {
        "success": True,
        "added_count": added_count,
        "failed_count": len(failed_members),
        "message": f"Successfully added {added_count} members from linked project"
    }


@app.get("/api/projects/{project_id}/workflows")
def get_workflows(project_id: str, user=Depends(get_current_user)):
    db = require_db_client()
    require_project_member(user.get("sub"), project_id)
    response = db.table("workspaces").select("*").eq("project_id", project_id).execute()
    if getattr(response, "error", None):
        error_text = str(response.error).lower()
        if "permission denied" in error_text or "row-level security" in error_text:
            raise HTTPException(status_code=403, detail="Not authorized to view workflows")
        raise HTTPException(status_code=500, detail=f"Failed to fetch workflows: {response.error}")

    data = []
    for item in (response.data or []):
        item["title"] = item.get("name", item.get("title"))
        data.append(item)
    return data

#a
@app.post("/api/projects/{project_id}/workflows")
def create_workflow(project_id: str, request: CreateWorkflowRequest, user=Depends(get_current_user)):
    db = require_db_client()
    require_project_member(user.get("sub"), project_id)
    creator_id = user.get("sub")
    member_ids: List[str] = []

    if isinstance(request.member_ids, list):
        for member_id in request.member_ids:
            if isinstance(member_id, str) and member_id.strip():
                member_ids.append(member_id.strip())

    if creator_id and creator_id not in member_ids:
        member_ids.insert(0, creator_id)

    payload_variants = [
        {
            "project_id": project_id,
            "name": request.title,
            "description": request.description or "",
            "creator_id": creator_id,
            "members": member_ids,
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "name": request.title,
            "description": request.description or "",
            "creator_id": creator_id,
            "status": "in_process",
            "members": member_ids,
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "name": request.title,
            "description": request.description or "",
            "status": "active",
            "members": member_ids,
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "name": request.title,
            "description": request.description or "",
            "members": member_ids,
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "title": request.title,
            "description": request.description or "",
            "creator_id": creator_id,
            "members": member_ids,
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "title": request.title,
            "description": request.description or "",
            "creator_id": creator_id,
            "status": "in_process",
            "members": member_ids,
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "title": request.title,
            "description": request.description or "",
            "status": "active",
            "members": member_ids,
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "title": request.title,
            "description": request.description or "",
            "members": member_ids,
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "title": request.title,
            "description": request.description or "",
            "creator_id": creator_id,
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "title": request.title,
            "description": request.description or "",
            "creator_id": creator_id,
            "status": "in_process",
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "title": request.title,
            "description": request.description or "",
            "status": "active",
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "title": request.title,
            "description": request.description or "",
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "name": request.title,
            "description": request.description or "",
            "creator_id": creator_id,
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "name": request.title,
            "description": request.description or "",
            "creator_id": creator_id,
            "status": "in_process",
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "name": request.title,
            "description": request.description or "",
            "status": "active",
            "parent_id": request.parent_id,
        },
        {
            "project_id": project_id,
            "name": request.title,
            "description": request.description or "",
            "parent_id": request.parent_id,
        },
    ]

    last_error = None
    for workflow_data in payload_variants:
        try:
            response = db.table("workspaces").insert(workflow_data).execute()
        except Exception as exc:
            payload = None
            first_arg = exc.args[0] if getattr(exc, "args", None) else None
            if isinstance(first_arg, dict):
                payload = first_arg
            elif isinstance(first_arg, str) and first_arg.strip():
                raw = first_arg.strip()
                try:
                    payload = json.loads(raw)
                except Exception:
                    try:
                        payload = ast.literal_eval(raw)
                    except Exception:
                        payload = None

            error_code = str((payload or {}).get("code", "") or "")
            error_message = str((payload or {}).get("message", "") or str(exc))
            error_text = f"{error_code} {error_message}".lower()
            last_error = payload or str(exc)

            if error_code == "42501" or "permission denied" in error_text or "row-level security" in error_text:
                raise HTTPException(status_code=403, detail="Not authorized to create workflows")

            if error_code == "P0001" and "at least one assigned member" in error_text:
                raise HTTPException(status_code=400, detail="Workspace must include at least one member")

            if (
                error_code in {"42703", "23502", "23514", "PGRST204"}
                or "column" in error_text
                or "not-null" in error_text
                or "violates check constraint" in error_text
                or "schema cache" in error_text
            ):
                continue

            raise HTTPException(status_code=500, detail=f"Failed to create workflow: {error_message}")

        error = getattr(response, "error", None)
        if not error and response.data:
            workflow = response.data[0]
            workflow["title"] = workflow.get("name", workflow.get("title"))
            return workflow

        if error:
            last_error = error
            error_code = str(getattr(error, "code", "") or "")
            error_text = str(error).lower()

            if error_code == "42501" or "permission denied" in error_text or "row-level security" in error_text:
                raise HTTPException(status_code=403, detail="Not authorized to create workflows")

            if error_code == "P0001" and "at least one assigned member" in error_text:
                raise HTTPException(status_code=400, detail="Workspace must include at least one member")

            # Try next variant for likely schema mismatch issues.
            if (
                error_code in {"42703", "23502", "23514", "PGRST204"}
                or "column" in error_text
                or "not-null" in error_text
                or "violates check constraint" in error_text
                or "schema cache" in error_text
            ):
                continue

            raise HTTPException(status_code=500, detail=f"Failed to create workflow: {error}")

    if last_error:
        raise HTTPException(status_code=500, detail=f"Failed to create workflow: {last_error}")
    raise HTTPException(status_code=500, detail="Failed to create workflow")


class UpdateWorkflowRequest(BaseModel):
    status: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None


@app.patch("/api/workflows/{workflow_id}")
def update_workflow(workflow_id: str, request: UpdateWorkflowRequest, user=Depends(get_current_user)):
    """Update a workflow's status, name, or description."""
    db = require_db_client()

    # Fetch the workflow to get its project_id
    workflow_resp = db.table("workspaces").select("id, project_id").eq("id", workflow_id).execute()
    if not workflow_resp.data:
        raise HTTPException(status_code=404, detail="Workflow not found")

    project_id = workflow_resp.data[0].get("project_id")
    if project_id:
        require_project_member(user.get("sub"), project_id)

    updates = {}
    if request.status is not None:
        updates["status"] = request.status
    if request.name is not None:
        updates["name"] = request.name
    if request.description is not None:
        updates["description"] = request.description

    if not updates:
        return workflow_resp.data[0]

    try:
        response = db.table("workspaces").update(updates).eq("id", workflow_id).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update workflow")
        result = response.data[0]
        result["title"] = result.get("name", result.get("title"))
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update workflow: {str(exc)}")


def normalize_deadline_due_date(due_date: str) -> str:
    trimmed = (due_date or "").strip()
    if len(trimmed) == 10 and trimmed.count("-") == 2:
        return trimmed
    parsed = datetime.fromisoformat(trimmed.replace("Z", "+00:00"))
    return parsed.date().isoformat()


@app.post("/api/workflows/{workflow_id}/members")
def assign_workflow_member(workflow_id: str, request: AssignWorkflowMemberRequest, user=Depends(get_current_user)):
    db = require_db_client()
    workflow = db.table("workspaces").select("project_id").eq("id", workflow_id).execute()
    if getattr(workflow, "error", None):
        raise HTTPException(status_code=500, detail=f"Failed to load workflow: {workflow.error}")
    if not workflow.data:
        raise HTTPException(status_code=404, detail="Workflow not found")
    require_project_lead(user.get("sub"), workflow.data[0]["project_id"])
    profile_response = db.table("profiles").select("id").eq("username", request.username).execute()
    if getattr(profile_response, "error", None):
        raise HTTPException(status_code=500, detail=f"Failed to resolve member: {profile_response.error}")
    if not profile_response.data:
        raise HTTPException(status_code=404, detail="User not found")

    member_id = profile_response.data[0]["id"]
    insert_response = db.table("workspace_assignments").insert({
        "workspace_id": workflow_id,
        "user_id": member_id,
        "role": request.role,
    }).execute()
    if getattr(insert_response, "error", None):
        raise HTTPException(status_code=500, detail=f"Failed to assign workflow member: {insert_response.error}")
    if not insert_response.data:
        raise HTTPException(status_code=500, detail="Failed to assign workflow member")
    return insert_response.data[0]


@app.post("/api/workflows/{workflow_id}/deadlines")
def create_deadline(workflow_id: str, request: CreateDeadlineRequest, user=Depends(get_current_user)):
    db = require_db_client()
    workflow = db.table("workspaces").select("project_id").eq("id", workflow_id).execute()
    if getattr(workflow, "error", None):
        raise HTTPException(status_code=500, detail=f"Failed to load workflow: {workflow.error}")
    if not workflow.data:
        raise HTTPException(status_code=404, detail="Workflow not found")
    require_project_lead(user.get("sub"), workflow.data[0]["project_id"])
    profile_response = db.table("profiles").select("id").eq("username", request.assigned_to).execute()
    if getattr(profile_response, "error", None):
        raise HTTPException(status_code=500, detail=f"Failed to resolve assignee: {profile_response.error}")
    if not profile_response.data:
        raise HTTPException(status_code=404, detail="Assignee not found")

    assignee_id = profile_response.data[0]["id"]
    response = db.table("workspace_deadlines").insert({
        "workspace_id": workflow_id,
        "title": request.title,
        "due_date": normalize_deadline_due_date(request.due_date),
        "assigned_to": assignee_id,
        "status": "pending",
    }).execute()
    if getattr(response, "error", None):
        raise HTTPException(status_code=500, detail=f"Failed to create deadline: {response.error}")
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create deadline")
    return response.data[0]


@app.get("/api/workflows/{workflow_id}/deadlines")
def get_workflow_deadlines(workflow_id: str, user=Depends(get_current_user)):
    db = require_db_client()
    workflow = db.table("workspaces").select("project_id").eq("id", workflow_id).limit(1).execute()
    if getattr(workflow, "error", None):
        raise HTTPException(status_code=500, detail=f"Failed to load workflow: {workflow.error}")
    if not workflow.data:
        raise HTTPException(status_code=404, detail="Workflow not found")

    require_project_member(user.get("sub"), workflow.data[0]["project_id"])

    response = (
        db.table("workspace_deadlines")
        .select("*")
        .eq("workspace_id", workflow_id)
        .order("due_date", desc=False)
        .execute()
    )
    if getattr(response, "error", None):
        raise HTTPException(status_code=500, detail=f"Failed to fetch deadlines: {response.error}")
    return response.data or []


@app.patch("/api/workflows/{workflow_id}/deadlines/{deadline_id}")
def update_deadline(
    workflow_id: str,
    deadline_id: str,
    request: UpdateDeadlineRequest,
    user=Depends(get_current_user),
):
    db = require_db_client()
    workflow = db.table("workspaces").select("project_id").eq("id", workflow_id).limit(1).execute()
    if getattr(workflow, "error", None):
        raise HTTPException(status_code=500, detail=f"Failed to load workflow: {workflow.error}")
    if not workflow.data:
        raise HTTPException(status_code=404, detail="Workflow not found")

    require_project_lead(user.get("sub"), workflow.data[0]["project_id"])

    existing = (
        db.table("workspace_deadlines")
        .select("*")
        .eq("id", deadline_id)
        .eq("workspace_id", workflow_id)
        .limit(1)
        .execute()
    )
    if getattr(existing, "error", None):
        raise HTTPException(status_code=500, detail=f"Failed to load deadline: {existing.error}")
    if not existing.data:
        raise HTTPException(status_code=404, detail="Deadline not found")

    payload: Dict[str, Any] = {}

    if request.title is not None:
        title = request.title.strip()
        if not title:
            raise HTTPException(status_code=400, detail="Deadline title cannot be empty")
        payload["title"] = title

    if request.due_date is not None:
        payload["due_date"] = normalize_deadline_due_date(request.due_date)

    if request.status is not None:
        payload["status"] = request.status

    if request.assigned_to is not None:
        profile_response = db.table("profiles").select("id").eq("username", request.assigned_to).limit(1).execute()
        if getattr(profile_response, "error", None):
            raise HTTPException(status_code=500, detail=f"Failed to resolve assignee: {profile_response.error}")
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="Assignee not found")
        payload["assigned_to"] = profile_response.data[0]["id"]

    if not payload:
        return existing.data[0]

    response = (
        db.table("workspace_deadlines")
        .update(payload)
        .eq("id", deadline_id)
        .eq("workspace_id", workflow_id)
        .execute()
    )
    if getattr(response, "error", None):
        raise HTTPException(status_code=500, detail=f"Failed to update deadline: {response.error}")
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update deadline")
    return response.data[0]


@app.delete("/api/workflows/{workflow_id}/deadlines/{deadline_id}")
def delete_deadline(workflow_id: str, deadline_id: str, user=Depends(get_current_user)):
    db = require_db_client()
    workflow = db.table("workspaces").select("project_id").eq("id", workflow_id).limit(1).execute()
    if getattr(workflow, "error", None):
        raise HTTPException(status_code=500, detail=f"Failed to load workflow: {workflow.error}")
    if not workflow.data:
        raise HTTPException(status_code=404, detail="Workflow not found")

    require_project_lead(user.get("sub"), workflow.data[0]["project_id"])

    response = (
        db.table("workspace_deadlines")
        .delete()
        .eq("id", deadline_id)
        .eq("workspace_id", workflow_id)
        .execute()
    )
    if getattr(response, "error", None):
        raise HTTPException(status_code=500, detail=f"Failed to delete deadline: {response.error}")
    return {"success": True}


@app.get("/api/deadlines")
def get_deadlines(days: int = 7, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    max_date = datetime.now(timezone.utc) + timedelta(days=days)
    response = db.table("workspace_deadlines").select("*, workspaces(name, project_id)").eq("assigned_to", user_id).execute()
    data = response.data
    for item in data:
        if item.get("workspaces"):
            item["workflows"] = item["workspaces"]
            item["workflows"]["title"] = item["workspaces"].get("name")
    return data


@app.get("/api/calendar/events")
def get_calendar_events(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    db = require_db_client()
    user_id = user.get("sub")

    if project_id:
        require_project_member(user_id, project_id)
        query = db.table("calendar_events").select("*").eq("project_id", project_id)
    else:
        memberships = db.table("project_members").select("project_id").eq("user_id", user_id).execute()
        project_ids = [item["project_id"] for item in memberships.data]
        if project_ids:
            query = db.table("calendar_events").select("*").or_(
                f"user_id.eq.{user_id},project_id.in.({','.join(project_ids)})"
            )
        else:
            query = db.table("calendar_events").select("*").eq("user_id", user_id)

    if start:
        query = query.gte("start_time", start)
    if end:
        query = query.lt("start_time", end)

    response = query.order("start_time", desc=False).execute()
    return response.data or []


@app.post("/api/calendar/events")
def create_calendar_event(request: CreateCalendarEventRequest, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")

    start_dt = parse_iso_datetime_or_400(request.start_time, "start_time")
    end_dt = parse_iso_datetime_or_400(request.end_time, "end_time")

    if end_dt <= start_dt:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    if request.project_id:
        require_project_member(user_id, request.project_id)

    response = db.table("calendar_events").insert({
        "project_id": request.project_id,
        "user_id": user_id,
        "title": sanitize_chat_input(request.title),
        "description": sanitize_chat_input(request.description) if request.description else None,
        "start_time": request.start_time,
        "end_time": request.end_time,
        "event_type": request.event_type or "meeting",
        "color": request.color,
    }).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create calendar event")
    return response.data[0]


@app.patch("/api/calendar/events/{event_id}")
def update_calendar_event(event_id: str, request: UpdateCalendarEventRequest, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")

    event_resp = db.table("calendar_events").select("*").eq("id", event_id).limit(1).execute()
    if not event_resp.data:
        raise HTTPException(status_code=404, detail="Calendar event not found")

    event = event_resp.data[0]
    can_edit = event.get("user_id") == user_id
    project_id = event.get("project_id")
    if not can_edit and project_id:
        membership = require_project_member(user_id, project_id)
        can_edit = membership.get("role") == "lead"
    if not can_edit:
        raise HTTPException(status_code=403, detail="Not authorized to update this event")

    updates: Dict[str, Any] = {}
    if request.title is not None:
        updates["title"] = sanitize_chat_input(request.title)
    if request.description is not None:
        updates["description"] = sanitize_chat_input(request.description) if request.description else None
    if request.event_type is not None:
        updates["event_type"] = request.event_type
    if request.color is not None:
        updates["color"] = request.color

    start_value = request.start_time if request.start_time is not None else event.get("start_time")
    end_value = request.end_time if request.end_time is not None else event.get("end_time")
    if request.start_time is not None:
        updates["start_time"] = request.start_time
    if request.end_time is not None:
        updates["end_time"] = request.end_time

    if request.start_time is not None or request.end_time is not None:
        start_dt = parse_iso_datetime_or_400(start_value, "start_time")
        end_dt = parse_iso_datetime_or_400(end_value, "end_time")
        if end_dt <= start_dt:
            raise HTTPException(status_code=400, detail="end_time must be after start_time")

    if not updates:
        return event

    response = db.table("calendar_events").update(updates).eq("id", event_id).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update calendar event")
    return response.data[0]


@app.delete("/api/calendar/events/{event_id}")
def delete_calendar_event(event_id: str, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")

    event_resp = db.table("calendar_events").select("*").eq("id", event_id).limit(1).execute()
    if not event_resp.data:
        raise HTTPException(status_code=404, detail="Calendar event not found")

    event = event_resp.data[0]
    can_delete = event.get("user_id") == user_id
    project_id = event.get("project_id")
    if not can_delete and project_id:
        membership = require_project_member(user_id, project_id)
        can_delete = membership.get("role") == "lead"

    if not can_delete:
        raise HTTPException(status_code=403, detail="Not authorized to delete this event")

    db.table("calendar_events").delete().eq("id", event_id).execute()
    return {"status": "success"}


@app.get("/api/projects/{project_id}/calendar/team")
def get_project_team_calendar(
    project_id: str,
    start: str = Query(...),
    end: str = Query(...),
    user=Depends(get_current_user)
):
    db = require_db_client()
    user_id = user.get("sub")
    require_project_member(user_id, project_id)

    start_dt = parse_iso_datetime_or_400(start, "start")
    end_dt = parse_iso_datetime_or_400(end, "end")
    if end_dt <= start_dt:
        raise HTTPException(status_code=400, detail="end must be after start")

    members_resp = (
        db.table("project_members")
        .select("role, profiles:user_id(id, username, full_name, email, avatar_url)")
        .eq("project_id", project_id)
        .execute()
    )

    members: List[Dict[str, Any]] = []
    member_ids: List[str] = []
    for row in members_resp.data or []:
        profile = row.get("profiles")
        if profile:
            profile["role"] = row.get("role", "member")
            members.append(profile)
            member_ids.append(profile["id"])

    if not member_ids:
        return {"members": [], "events": [], "busy_times": []}

    events_resp = (
        db.table("calendar_events")
        .select("*")
        .in_("user_id", member_ids)
        .gte("start_time", start_dt.isoformat())
        .lt("start_time", end_dt.isoformat())
        .order("start_time", desc=False)
        .execute()
    )

    busy_resp = (
        db.table("busy_times")
        .select("*")
        .in_("user_id", member_ids)
        .gte("start_time", start_dt.isoformat())
        .lt("start_time", end_dt.isoformat())
        .order("start_time", desc=False)
        .execute()
    )

    return {
        "members": members,
        "events": events_resp.data or [],
        "busy_times": busy_resp.data or [],
    }


@app.post("/api/projects/{project_id}/calendar/meeting-slots")
def find_project_meeting_slots(project_id: str, request: FindMeetingSlotsRequest, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    require_project_member(user_id, project_id)

    window_start = parse_iso_datetime_or_400(request.start_time, "start_time")
    window_end = parse_iso_datetime_or_400(request.end_time, "end_time")
    if window_end <= window_start:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    members_resp = (
        db.table("project_members")
        .select("user_id, profiles:user_id(id, username, full_name)")
        .eq("project_id", project_id)
        .execute()
    )
    all_member_ids = [m["user_id"] for m in members_resp.data or []]
    target_member_ids = request.member_ids if request.member_ids else all_member_ids
    target_member_ids = [member_id for member_id in target_member_ids if member_id in all_member_ids]
    if not target_member_ids:
        raise HTTPException(status_code=400, detail="No valid members selected")

    events_resp = (
        db.table("calendar_events")
        .select("user_id, start_time, end_time")
        .in_("user_id", target_member_ids)
        .gte("start_time", window_start.isoformat())
        .lt("start_time", window_end.isoformat())
        .execute()
    )
    busy_resp = (
        db.table("busy_times")
        .select("user_id, start_time, end_time")
        .in_("user_id", target_member_ids)
        .gte("start_time", window_start.isoformat())
        .lt("start_time", window_end.isoformat())
        .execute()
    )

    busy_by_user: Dict[str, List[Dict[str, datetime]]] = {member_id: [] for member_id in target_member_ids}

    for row in events_resp.data or []:
        start_dt = parse_timestamp(row.get("start_time"))
        end_dt = parse_timestamp(row.get("end_time"))
        if start_dt and end_dt and row.get("user_id") in busy_by_user:
            busy_by_user[row["user_id"]].append({"start": start_dt, "end": end_dt})

    for row in busy_resp.data or []:
        start_dt = parse_timestamp(row.get("start_time"))
        end_dt = parse_timestamp(row.get("end_time"))
        if start_dt and end_dt and row.get("user_id") in busy_by_user:
            busy_by_user[row["user_id"]].append({"start": start_dt, "end": end_dt})

    for member_id in busy_by_user:
        busy_by_user[member_id].sort(key=lambda x: x["start"])

    try:
        wh_start_hour, wh_start_min = map(int, (request.working_hours_start or "08:00").split(":"))
        wh_end_hour, wh_end_min = map(int, (request.working_hours_end or "18:00").split(":"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid working hours format")

    duration = timedelta(minutes=request.duration_minutes)
    step = timedelta(minutes=request.step_minutes or 30)
    candidate_slots: List[Dict[str, str]] = []

    cursor_day = datetime(window_start.year, window_start.month, window_start.day, tzinfo=window_start.tzinfo)
    while cursor_day < window_end:
        day_start = cursor_day.replace(hour=wh_start_hour, minute=wh_start_min, second=0, microsecond=0)
        day_end = cursor_day.replace(hour=wh_end_hour, minute=wh_end_min, second=0, microsecond=0)

        slot_start = max(day_start, window_start)
        while slot_start + duration <= min(day_end, window_end):
            slot_end = slot_start + duration
            overlaps = False
            for member_id in target_member_ids:
                for block in busy_by_user.get(member_id, []):
                    if intervals_overlap(slot_start, slot_end, block["start"], block["end"]):
                        overlaps = True
                        break
                if overlaps:
                    break

            if not overlaps:
                candidate_slots.append({
                    "start_time": slot_start.isoformat(),
                    "end_time": slot_end.isoformat(),
                })
                if len(candidate_slots) >= 20:
                    return {
                        "member_ids": target_member_ids,
                        "duration_minutes": request.duration_minutes,
                        "slots": candidate_slots,
                    }
            slot_start += step

        cursor_day += timedelta(days=1)

    return {
        "member_ids": target_member_ids,
        "duration_minutes": request.duration_minutes,
        "slots": candidate_slots,
    }


@app.post("/api/projects/{project_id}/calendar/meetings")
def schedule_project_meeting(project_id: str, request: ScheduleMeetingRequest, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    require_project_member(user_id, project_id)

    start_dt = parse_iso_datetime_or_400(request.start_time, "start_time")
    end_dt = parse_iso_datetime_or_400(request.end_time, "end_time")
    if end_dt <= start_dt:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    members_resp = db.table("project_members").select("user_id").eq("project_id", project_id).execute()
    project_member_ids = [row["user_id"] for row in members_resp.data or []]
    selected_member_ids = request.member_ids if request.member_ids else project_member_ids
    selected_member_ids = [member_id for member_id in selected_member_ids if member_id in project_member_ids]
    if not selected_member_ids:
        raise HTTPException(status_code=400, detail="No valid members selected")

    payload = []
    for member_id in selected_member_ids:
        payload.append({
            "project_id": project_id,
            "user_id": member_id,
            "title": sanitize_chat_input(request.title),
            "description": sanitize_chat_input(request.description) if request.description else None,
            "start_time": request.start_time,
            "end_time": request.end_time,
            "event_type": request.event_type or "meeting",
            "color": request.color,
        })

    response = db.table("calendar_events").insert(payload).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to schedule meeting")
    return {"status": "success", "created": len(response.data), "events": response.data}


@app.post("/api/busy-times")
def add_busy_time(request: AddBusyTimeRequest, user=Depends(get_current_user)):
    db = require_db_client()
    response = db.table("busy_times").insert({
        "user_id": user.get("sub"),
        "start_time": request.start_time,
        "end_time": request.end_time,
        "description": request.description or "",
    }).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to add busy time")
    return response.data[0]


@app.get("/api/busy-times")
def get_busy_times(user=Depends(get_current_user)):
    db = require_db_client()
    response = db.table("busy_times").select("*").eq("user_id", user.get("sub")).execute()
    return response.data


@app.post("/api/meetings/conflicts")
def check_conflicts(request: CheckConflictsRequest, user=Depends(get_current_user)):
    db = require_db_client()
    require_project_member(user.get("sub"), request.project_id)
    members = db.table("project_members").select("user_id, profiles(username)").eq("project_id", request.project_id).execute()

    conflicts: List[Dict[str, Any]] = []
    for member in members.data:
        user_id = member["user_id"]
        username = member["profiles"]["username"]
        busy_times = db.table("busy_times").select("*").eq("user_id", user_id).execute()
        for busy in busy_times.data:
            if request.start_time < busy["end_time"] and request.end_time > busy["start_time"]:
                conflicts.append({
                    "username": username,
                    "busy_start": busy["start_time"],
                    "busy_end": busy["end_time"],
                    "description": busy.get("description", ""),
                })

    return {"has_conflicts": len(conflicts) > 0, "conflicts": conflicts}


@app.post("/api/documents")
def upload_document(request: UploadDocumentRequest, user=Depends(get_current_user)):
    db = require_db_client()
    if request.project_id:
        require_project_member(user.get("sub"), request.project_id)
    
    # Validate file_url is safe (prevent javascript: / data: URI injection)
    validate_url_safe(request.file_url)
    
    response = db.table("documents").insert({
        "project_id": request.project_id,
        "workflow_id": request.workflow_id,
        "filename": sanitize_chat_input(request.filename),
        "file_url": request.file_url,
        "uploaded_by": user.get("sub"),
    }).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to upload document")
    return response.data[0]


@app.get("/api/documents")
def get_documents(project_id: Optional[str] = None, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    if project_id:
        require_project_member(user_id, project_id)
        response = db.table("documents").select("*, profiles!uploaded_by(username)").eq("project_id", project_id).execute()
        return response.data

    memberships = db.table("project_members").select("project_id").eq("user_id", user_id).execute()
    project_ids = [item["project_id"] for item in memberships.data]
    if project_ids:
        response = db.table("documents").select("*, profiles!uploaded_by(username)").or_(
            f"uploaded_by.eq.{user_id},project_id.in.({','.join(project_ids)})"
        ).execute()
    else:
        response = db.table("documents").select("*, profiles!uploaded_by(username)").eq("uploaded_by", user_id).execute()
    return response.data


@app.patch("/api/documents/{document_id}/access")
def update_document_access(document_id: str, request: UpdateDocumentAccessRequest, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")

    doc_resp = db.table("documents").select("*").eq("id", document_id).limit(1).execute()
    if not doc_resp.data:
        raise HTTPException(status_code=404, detail="Document not found")

    document = doc_resp.data[0]
    if document.get("uploaded_by") != user_id:
        raise HTTPException(status_code=403, detail="Only uploader can update file access")

    project_id = request.project_id or None
    if project_id:
        require_project_member(user_id, project_id)

    response = db.table("documents").update({"project_id": project_id}).eq("id", document_id).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update file access")
    return response.data[0]


@app.post("/api/documents/upload")
async def upload_document_file(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    user=Depends(get_current_user)
):
    db = require_db_client()
    user_id = user.get("sub")
    if project_id:
        require_project_member(user_id, project_id)
    
    try:
        file_content = await file.read()
        folder = project_id or f"private/{user_id}"
        file_path = f"{folder}/{datetime.now().timestamp()}-{file.filename}"

        upload_response = db.storage.from_("documents").upload(
            path=file_path,
            file=file_content,
            file_options={"content-type": file.content_type or "application/octet-stream"}
        )

        # Always store storage path, never public URL
        file_type = file.content_type or None
        file_size = len(file_content) if file_content else None

        doc_response = db.table("documents").insert({
            "project_id": project_id,
            "filename": file.filename,
            "file_url": file_path,
            "file_type": file_type,
            "file_size": file_size,
            "uploaded_by": user_id,
        }).execute()

        if not doc_response.data:
            raise HTTPException(status_code=500, detail="Failed to save document metadata")

        return doc_response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/documents/{document_id}/download")
def get_document_download_url(document_id: str, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    response = db.table("documents").select("*").eq("id", document_id).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Document not found")

    document = response.data[0]
    project_id = document.get("project_id")
    if project_id:
        require_project_member(user_id, project_id)
    elif document.get("uploaded_by") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    file_path = document.get("file_url")
    if not file_path:
        raise HTTPException(status_code=404, detail="File path missing")

    # Reject dangerous URLs even from database (defense in depth)
    try:
        validate_url_safe(file_path)
    except HTTPException:
        raise HTTPException(status_code=500, detail="Invalid file path in database")

    # Always generate signed URL, even if file_url is a public URL
    # If file_url is a public URL, try to extract the storage path
    if isinstance(file_path, str) and file_path.startswith("http"):
        # Try to parse storage path from public URL
        # Example: https://.../storage/v1/object/public/documents/private/xxx/filename
        parts = file_path.split("/documents/")
        if len(parts) == 2:
            file_path = parts[1].split("?")[0]
        else:
            raise HTTPException(status_code=404, detail="Invalid file path")

    signed = db.storage.from_("documents").create_signed_url(file_path, 60 * 15)
    signed_url = signed.get("signedURL") if isinstance(signed, dict) else None
    if not signed_url:
        raise HTTPException(status_code=500, detail="Failed to create signed URL")
    return {"url": signed_url}


@app.post("/api/notifications/create")
def create_notification(request: CreateNotificationRequest, user=Depends(get_current_user)):
    db = require_db_client()
    response = db.table("notifications").insert({
        "user_id": request.user_id,
        "type": request.type,
        "title": request.title,
        "message": request.message,
        "related_id": request.related_id,
        "read": False
    }).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create notification")
    return response.data[0]


@app.get("/api/notifications")
def get_notifications(user=Depends(get_current_user)):
    db = require_db_client()
    response = db.table("notifications").select("*").eq("user_id", user.get("sub")).order("created_at", desc=True).limit(50).execute()
    return response.data


@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str, user=Depends(get_current_user)):
    db = require_db_client()
    db.table("notifications").update({"read": True}).eq("id", notification_id).execute()
    return {"status": "success"}

@app.post("/api/chatbot")
def chatbot(
    request: ChatbotRequest,
    user=Depends(get_current_user),
    x_chatbot_api_key: Optional[str] = Header(default=None, alias="x-chatbot-api-key"),
):
    question = sanitize_chat_input(request.question)
    # Priority: request body key > header key > env CHATBOT_API_KEY > env GOOGLE_AI_STUDIO_API_KEY
    api_key = (request.api_key or x_chatbot_api_key or CHATBOT_API_KEY or GOOGLE_AI_STUDIO_API_KEY or "").strip()
    # Priority: request body api_base > env CHATBOT_API_BASE
    api_base = (request.api_base or CHATBOT_API_BASE or "").strip().rstrip("/")
    model = (request.model or CHATBOT_MODEL).strip()
    provider = infer_chatbot_provider(request.provider, api_base, model)

    if api_key:
        try:
            if provider == "google-ai-studio":
                answer = call_google_ai_studio_chat(question, api_key, api_base, model)
            else:
                answer = call_external_chatbot(question, api_key, api_base, model)
            return {
                "question": question,
                "answer": answer,
                "provider": provider,
                "model": model,
            }
        except HTTPException as exc:
            # Gracefully degrade to local assistant when provider quota is exhausted.
            if exc.status_code == 429:
                fallback = find_best_match(question)
                return {
                    "question": question,
                    "answer": fallback,
                    "provider": "built-in-fallback",
                    "model": "rules",
                    "warning": exc.detail,
                }
            raise

    # No API key configured — fall back to built-in rules matcher
    response = find_best_match(question)
    return {
        "question": question,
        "answer": response,
        "provider": "built-in",
        "model": "rules",
        "warning": "No API key configured. Add your key in Settings to use OpenAI-compatible or Google AI Studio providers.",
    }


@app.post("/api/notifications/subscribe")
def notifications_subscribe(request: NotificationSubscriptionRequest):
    if not request.subscription:
        raise HTTPException(status_code=400, detail="No subscription provided")
    return {"success": True, "message": "Subscription saved"}


@app.post("/api/notifications/unsubscribe")
def notifications_unsubscribe(request: NotificationSubscriptionRequest):
    if not request.subscription:
        raise HTTPException(status_code=400, detail="No subscription provided")
    return {"success": True, "message": "Unsubscribed"}


@app.post("/api/documents/{document_id}/delete")
def delete_document(document_id: str, user=Depends(get_current_user)):
    db = require_db_client()
    user_id = user.get("sub")
    # Fetch document
    response = db.table("documents").select("*").eq("id", document_id).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Document not found")
    document = response.data[0]
    project_id = document.get("project_id")
    if project_id:
        require_project_member(user_id, project_id)
    elif document.get("uploaded_by") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    file_path = document.get("file_url")
    # Delete from storage bucket if file_path exists
    if file_path:
        try:
            db.storage.from_("documents").remove([file_path])
        except Exception as e:
            # Log error but continue to delete DB row
            print(f"Warning: Failed to delete file from storage: {e}")
    # Delete from database
    db.table("documents").delete().eq("id", document_id).execute()
    return {"status": "success"}