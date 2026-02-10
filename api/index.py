import os
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Response, Cookie, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel, Field, validator
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

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

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


def ensure_profile_upsert(response, fallback_message: str) -> None:
    error = getattr(response, "error", None)
    if error:
        error_code = getattr(error, "code", None)
        error_message = getattr(error, "message", None) or str(error)
        if error_code == "23505" or "duplicate key value" in error_message:
            raise HTTPException(status_code=409, detail="Email already registered. Did you mean login?")
        raise HTTPException(status_code=500, detail=error_message)
    if not response.data:
        raise HTTPException(status_code=500, detail=fallback_message)


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

    @validator("fullname")
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

    @validator("fullname")
    def validate_fullname_safe(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Full name contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Full name contains invalid characters")
        return value

    @validator("email")
    def validate_email_safe(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Email contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Email contains invalid characters")
        return value


class CreateProjectRequest(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = ""


class AddMemberRequest(BaseModel):
    member_username: str = Field(..., min_length=1)
    role: str = "member"

    @validator("member_username")
    def validate_member_username_safe(cls, value: str) -> str:
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Username contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Username contains invalid characters")
        return value


class CreateWorkflowRequest(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = ""


class AssignWorkflowMemberRequest(BaseModel):
    username: str = Field(..., min_length=1)
    role: str = "member"

    @validator("username")
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

    @validator("assigned_to")
    def validate_assigned_to_safe(cls, value: str) -> str:
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Username contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Username contains invalid characters")
        return value


class AddBusyTimeRequest(BaseModel):
    start_time: str = Field(..., min_length=1)
    end_time: str = Field(..., min_length=1)
    description: Optional[str] = ""


class CheckConflictsRequest(BaseModel):
    project_id: str = Field(..., min_length=1)
    start_time: str = Field(..., min_length=1)
    end_time: str = Field(..., min_length=1)


class UploadDocumentRequest(BaseModel):
    project_id: str = Field(..., min_length=1)
    workflow_id: Optional[str] = None
    filename: str = Field(..., min_length=1)
    file_url: str = Field(..., min_length=1)


class ChatbotRequest(BaseModel):
    question: str = Field(..., min_length=1)


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


CHATBOT_KNOWLEDGE = {
    "create_project": {
        "keywords": ["create project", "new project", "tạo dự án", "tạo project"],
        "response": "To create a new project: open Dashboard, click Create Project, fill in title and description, then submit. You will become the project lead automatically."
    },
    "create_workflow": {
        "keywords": ["create workflow", "tạo workflow", "task breakdown"],
        "response": "To create a workflow: open a project, select Add Workflow, provide title and description, then assign members and deadlines."
    },
    "add_members": {
        "keywords": ["add member", "thêm thành viên", "invite"],
        "response": "To add members: open project settings, choose Add Member, enter a username or email, select role, and confirm. Only project leads can add members."
    },
    "schedule": {
        "keywords": ["calendar", "schedule", "busy time", "lịch"],
        "response": "To manage schedule: open Calendar, add busy time with start and end time, and save. Conflicts are detected automatically when scheduling meetings."
    },
    "documents": {
        "keywords": ["document", "upload", "tài liệu", "file"],
        "response": "To upload documents: open a project or workflow, choose Upload Document, select the file, and confirm. All project members can access shared files."
    },
    "deadline": {
        "keywords": ["deadline", "due date", "hạn chót"],
        "response": "To add a deadline: open a workflow, choose Add Deadline, set due date, and assign a member. Notifications appear as due dates approach."
    },
    "general": {
        "keywords": ["help", "guide", "how to", "hướng dẫn"],
        "response": "Ask about creating projects, workflows, members, schedules, documents, or deadlines."
    }
}


def find_best_match(question: str) -> str:
    question_lower = question.lower()
    for data in CHATBOT_KNOWLEDGE.values():
        for keyword in data["keywords"]:
            if keyword.lower() in question_lower:
                return data["response"]
    return CHATBOT_KNOWLEDGE["general"]["response"]


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=60 * 60 * 24,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")


def get_current_user(access_token: Optional[str] = Cookie(None)) -> Dict[str, Any]:
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_token(access_token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


def require_project_member(user_id: str, project_id: str) -> Dict[str, Any]:
    db = require_supabase()
    membership = db.table("project_members").select("id, role").eq("project_id", project_id).eq("user_id", user_id).execute()
    if not membership.data:
        raise HTTPException(status_code=403, detail="Not a project member")
    return membership.data[0]


def require_project_lead(user_id: str, project_id: str) -> None:
    membership = require_project_member(user_id, project_id)
    if membership.get("role") != "lead":
        raise HTTPException(status_code=403, detail="Insufficient permissions")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "supabase_configured": supabase is not None,
        "supabase_admin_configured": supabase_admin is not None,
        "config_error": SUPABASE_CONFIG_ERROR,
    }


class RegisterDirectRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)
    fullname: Optional[str] = None

    @validator("email")
    def validate_email_safe(cls, value: str) -> str:
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Email contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Email contains invalid characters")
        return value

    @validator("password")
    def validate_password_safe(cls, value: str) -> str:
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Password contains invalid characters")
        if "<" in value or ">" in value:
            raise ValueError("Password contains invalid characters")
        return value

    @validator("fullname")
    def validate_fullname_safe(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if contains_control_chars(value) or contains_emoji(value):
            raise ValueError("Full name contains invalid characters")
        if contains_disallowed_username_chars(value):
            raise ValueError("Full name contains invalid characters")
        return value


@app.post("/api/auth/register-direct")
def register_direct(request: RegisterDirectRequest, response: Response):
    """Register a new user directly with email/password and create backend session"""
    try:
        db = require_supabase()
        # Use regular client to sign up the user
        auth_response = db.auth.sign_up({"email": request.email, "password": request.password})
        user = auth_response.user if hasattr(auth_response, 'user') else None
        
        if not user or not user.id:
            print(f"Sign up failed: {auth_response}")
            raise HTTPException(status_code=400, detail="Failed to create user")

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
        }).execute()

        ensure_profile_upsert(profile_response, "Failed to create profile")

        return {"status": "success", "user": {"id": user.id, "email": user.email, "full_name": full_name}}
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Register direct error: {str(exc)}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/auth/register")
def register(request: RegisterRequest, response: Response):
    """Register a new user and create backend session from Supabase token"""
    try:
        db = require_supabase()
        # Verify the Supabase access token
        user_response = db.auth.get_user(request.access_token)
        user = getattr(user_response, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid Supabase token")

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
        }).execute()

        ensure_profile_upsert(profile_response, "Failed to create profile")

        return {"status": "success", "user": {"id": user.id, "email": user.email, "full_name": full_name}}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/auth/session")
def create_session(request: AuthSessionRequest, response: Response):
    """Create backend session from Supabase access token"""
    try:
        db = require_supabase()
        user_response = db.auth.get_user(request.access_token)
        user = getattr(user_response, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid Supabase token")

        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id, "email": user.email})
        set_auth_cookies(response, access_token, refresh_token)

        fullname = (user.user_metadata or {}).get("full_name") or user.email
        db_client = supabase_admin if supabase_admin else db
        profile_response = db_client.table("profiles").upsert({
            "id": user.id,
            "username": user.email,
            "email": user.email,
            "fullname": fullname,
        }).execute()

        ensure_profile_upsert(profile_response, "Failed to create profile")

        return {"status": "success", "user": {"id": user.id, "email": user.email, "fullname": fullname}}
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Session creation error: {str(exc)}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/auth/refresh")
def refresh_session(response: Response, refresh_token: Optional[str] = Cookie(None)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    payload = verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access_token = create_access_token({"sub": payload.get("sub"), "email": payload.get("email")})
    new_refresh_token = create_refresh_token({"sub": payload.get("sub"), "email": payload.get("email")})
    set_auth_cookies(response, access_token, new_refresh_token)
    return {"status": "success"}


@app.get("/api/auth/me")
def auth_me(user=Depends(get_current_user)):
    return {"authenticated": True, "user": {"id": user.get("sub"), "email": user.get("email")}}


@app.post("/api/auth/logout")
def logout(response: Response):
    clear_auth_cookies(response)
    return {"status": "success"}

@app.get("/api/profile")
def get_profile(user=Depends(get_current_user)):
    db = require_supabase()
    response = db.table("profiles").select("*").eq("id", user.get("sub")).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"profile": response.data[0]}


@app.post("/api/profile")
def update_profile(request: ProfileUpdateRequest, user=Depends(get_current_user)):
    db = require_supabase()
    updates = {k: v for k, v in request.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    updates["id"] = user.get("sub")
    response = db.table("profiles").upsert(updates).execute()
    ensure_profile_upsert(response, "Failed to update profile")
    return {"profile": response.data[0]}


@app.get("/api/projects")
def get_projects(user=Depends(get_current_user)):
    db = require_supabase()
    user_id = user.get("sub")
    response = db.table("project_members").select("*, projects(*)").eq("user_id", user_id).execute()
    projects = [item["projects"] for item in response.data if item.get("projects")]
    return projects


@app.post("/api/projects")
def create_project(request: CreateProjectRequest, user=Depends(get_current_user)):
    db = require_supabase()
    user_id = user.get("sub")
    project_data = {
        "title": request.title,
        "description": request.description or "",
        "created_by": user_id,
        "status": "active",
    }
    response = db.table("projects").insert(project_data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create project")

    project = response.data[0]
    db.table("project_members").insert({
        "project_id": project["id"],
        "user_id": user_id,
        "role": "lead",
    }).execute()

    return project


@app.post("/api/projects/{project_id}/members")
def add_project_member(project_id: str, request: AddMemberRequest, user=Depends(get_current_user)):
    db = require_supabase()
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


@app.get("/api/projects/{project_id}/workflows")
def get_workflows(project_id: str, user=Depends(get_current_user)):
    db = require_supabase()
    require_project_member(user.get("sub"), project_id)
    response = db.table("workflows").select("*").eq("project_id", project_id).execute()
    return response.data


@app.post("/api/projects/{project_id}/workflows")
def create_workflow(project_id: str, request: CreateWorkflowRequest, user=Depends(get_current_user)):
    db = require_supabase()
    require_project_lead(user.get("sub"), project_id)
    workflow_data = {
        "project_id": project_id,
        "title": request.title,
        "description": request.description or "",
        "created_by": user.get("sub"),
        "status": "active",
    }
    response = db.table("workflows").insert(workflow_data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create workflow")
    return response.data[0]


@app.post("/api/workflows/{workflow_id}/members")
def assign_workflow_member(workflow_id: str, request: AssignWorkflowMemberRequest, user=Depends(get_current_user)):
    db = require_supabase()
    workflow = db.table("workflows").select("project_id").eq("id", workflow_id).execute()
    if not workflow.data:
        raise HTTPException(status_code=404, detail="Workflow not found")
    require_project_lead(user.get("sub"), workflow.data[0]["project_id"])
    profile_response = db.table("profiles").select("id").eq("username", request.username).execute()
    if not profile_response.data:
        raise HTTPException(status_code=404, detail="User not found")

    member_id = profile_response.data[0]["id"]
    insert_response = db.table("workflow_members").insert({
        "workflow_id": workflow_id,
        "user_id": member_id,
        "role": request.role,
    }).execute()
    if not insert_response.data:
        raise HTTPException(status_code=500, detail="Failed to assign workflow member")
    return insert_response.data[0]


@app.post("/api/workflows/{workflow_id}/deadlines")
def create_deadline(workflow_id: str, request: CreateDeadlineRequest, user=Depends(get_current_user)):
    db = require_supabase()
    workflow = db.table("workflows").select("project_id").eq("id", workflow_id).execute()
    if not workflow.data:
        raise HTTPException(status_code=404, detail="Workflow not found")
    require_project_lead(user.get("sub"), workflow.data[0]["project_id"])
    profile_response = db.table("profiles").select("id").eq("username", request.assigned_to).execute()
    if not profile_response.data:
        raise HTTPException(status_code=404, detail="Assignee not found")

    assignee_id = profile_response.data[0]["id"]
    response = db.table("deadlines").insert({
        "workflow_id": workflow_id,
        "title": request.title,
        "due_date": request.due_date,
        "assigned_to": assignee_id,
        "status": "pending",
    }).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create deadline")
    return response.data[0]


@app.get("/api/deadlines")
def get_deadlines(days: int = 7, user=Depends(get_current_user)):
    db = require_supabase()
    user_id = user.get("sub")
    max_date = datetime.now(timezone.utc) + timedelta(days=days)
    response = db.table("deadlines").select("*, workflows(title, project_id)").eq("assigned_to", user_id).eq("status", "pending").lte("due_date", max_date.isoformat()).execute()
    return response.data


@app.post("/api/busy-times")
def add_busy_time(request: AddBusyTimeRequest, user=Depends(get_current_user)):
    db = require_supabase()
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
    db = require_supabase()
    response = db.table("busy_times").select("*").eq("user_id", user.get("sub")).execute()
    return response.data


@app.post("/api/meetings/conflicts")
def check_conflicts(request: CheckConflictsRequest, user=Depends(get_current_user)):
    db = require_supabase()
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
    db = require_supabase()
    require_project_member(user.get("sub"), request.project_id)
    response = db.table("documents").insert({
        "project_id": request.project_id,
        "workflow_id": request.workflow_id,
        "filename": request.filename,
        "file_url": request.file_url,
        "uploaded_by": user.get("sub"),
    }).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to upload document")
    return response.data[0]


@app.get("/api/documents")
def get_documents(project_id: str, user=Depends(get_current_user)):
    db = require_supabase()
    require_project_member(user.get("sub"), project_id)
    response = db.table("documents").select("*, profiles!uploaded_by(username)").eq("project_id", project_id).execute()
    return response.data


@app.post("/api/documents/upload")
async def upload_document_file(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    user=Depends(get_current_user)
):
    db = require_supabase()
    require_project_member(user.get("sub"), project_id)
    
    try:
        file_content = await file.read()
        file_path = f"{project_id}/{datetime.now().timestamp()}-{file.filename}"
        
        upload_response = db.storage.from_("documents").upload(
            path=file_path,
            file=file_content,
            file_options={"content-type": file.content_type or "application/octet-stream"}
        )
        
        public_url = db.storage.from_("documents").get_public_url(file_path)
        
        doc_response = db.table("documents").insert({
            "project_id": project_id,
            "filename": file.filename,
            "file_url": public_url,
            "uploaded_by": user.get("sub"),
        }).execute()
        
        if not doc_response.data:
            raise HTTPException(status_code=500, detail="Failed to save document metadata")
        
        return doc_response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/notifications/create")
def create_notification(request: CreateNotificationRequest, user=Depends(get_current_user)):
    db = require_supabase()
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
    db = require_supabase()
    response = db.table("notifications").select("*").eq("user_id", user.get("sub")).order("created_at", desc=True).limit(50).execute()
    return response.data


@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str, user=Depends(get_current_user)):
    db = require_supabase()
    db.table("notifications").update({"read": True}).eq("id", notification_id).execute()
    return {"status": "success"}

@app.post("/api/chatbot")
def chatbot(request: ChatbotRequest):
    response = find_best_match(request.question)
    return {"question": request.question, "answer": response}


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
