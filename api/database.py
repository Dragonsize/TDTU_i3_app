import os
import uuid
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Missing Supabase credentials in .env")

supabase: Client = create_client(url, key)

# ========================================
# USER PROFILE FUNCTIONS
# ========================================

def save_user_profile(username: str, user_id: str = None, email: str = None, fullname: str = None):
    """Save or update user profile in database - creates UUID if new user"""
    try:
        # Check if profile exists
        existing = supabase.table("profiles").select("*").eq("username", username).execute()
        
        if existing.data:
            logger.info(f"Profile exists for {username}")
            return existing.data[0]
        else:
            # Create new profile with generated UUID
            new_id = user_id if user_id else str(uuid.uuid4())
            
            insert_data = {
                "id": new_id,
                "username": username,
                "email": email,
                "fullname": fullname
            }
            
            response = supabase.table("profiles").insert(insert_data).execute()
            
            if response.data:
                logger.info(f"Created profile for {username}")
                return response.data[0]
            else:
                logger.error(f"Failed to create profile for {username}")
                return None
        
    except Exception as e:
        logger.error(f"Error saving user profile: {type(e).__name__}: {e}")
        return None

# ========================================
# PROJECT MANAGEMENT FUNCTIONS
# ========================================

def create_project(title: str, description: str, created_by: str):
    """Create a new project"""
    try:
        # Get creator's profile ID
        profile = supabase.table("profiles").select("id").eq("username", created_by).execute()
        
        if not profile.data:
            logger.warning(f"Profile not found for username: {created_by}")
            return None
        
        creator_id = profile.data[0]["id"]
        
        project_data = {
            "title": title,
            "description": description,
            "created_by": creator_id,
            "status": "active"
        }
        
        response = supabase.table("projects").insert(project_data).execute()
        logger.info(f"Project created: {title}")
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        return None

def get_user_projects(username: str):
    """Get all projects where user is a member"""
    try:
        profile = supabase.table("profiles").select("id").eq("username", username).execute()
        if not profile.data:
            return []
        
        user_id = profile.data[0]["id"]
        
        # Get projects where user is a member
        response = supabase.table("project_members").select(
            "*, projects(*)"
        ).eq("user_id", user_id).execute()
        
        return [item["projects"] for item in response.data if item.get("projects")]
    except Exception as e:
        logger.error(f"Error fetching user projects: {e}")
        return []

def add_project_member(project_id: str, username: str, role: str = "member"):
    """Add a member to a project with a specific role"""
    try:
        profile = supabase.table("profiles").select("id").eq("username", username).execute()
        if not profile.data:
            return None
        
        user_id = profile.data[0]["id"]
        
        member_data = {
            "project_id": project_id,
            "user_id": user_id,
            "role": role
        }
        
        response = supabase.table("project_members").insert(member_data).execute()
        logger.info(f"Added {username} to project {project_id} as {role}")
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error adding project member: {e}")
        return None

# ========================================
# WORKFLOW FUNCTIONS
# ========================================

def create_workflow(project_id: str, title: str, description: str, created_by: str):
    """Create a workflow within a project"""
    try:
        profile = supabase.table("profiles").select("id").eq("username", created_by).execute()
        if not profile.data:
            return None
        
        creator_id = profile.data[0]["id"]
        
        workflow_data = {
            "project_id": project_id,
            "title": title,
            "description": description,
            "created_by": creator_id,
            "status": "active"
        }
        
        response = supabase.table("workflows").insert(workflow_data).execute()
        logger.info(f"Workflow created: {title}")
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error creating workflow: {e}")
        return None

def get_project_workflows(project_id: str):
    """Get all workflows for a project"""
    try:
        response = supabase.table("workflows").select("*").eq("project_id", project_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching workflows: {e}")
        return []

def assign_workflow_member(workflow_id: str, username: str, role: str = "member"):
    """Assign a member to a workflow"""
    try:
        profile = supabase.table("profiles").select("id").eq("username", username).execute()
        if not profile.data:
            return None
        
        user_id = profile.data[0]["id"]
        
        assignment_data = {
            "workflow_id": workflow_id,
            "user_id": user_id,
            "role": role
        }
        
        response = supabase.table("workflow_members").insert(assignment_data).execute()
        logger.info(f"Assigned {username} to workflow {workflow_id}")
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error assigning workflow member: {e}")
        return None

# ========================================
# SCHEDULE & AVAILABILITY FUNCTIONS
# ========================================

def add_busy_time(username: str, start_time: str, end_time: str, description: str = ""):
    """Add a busy time slot for a user"""
    try:
        profile = supabase.table("profiles").select("id").eq("username", username).execute()
        if not profile.data:
            return None
        
        user_id = profile.data[0]["id"]
        
        busy_data = {
            "user_id": user_id,
            "start_time": start_time,
            "end_time": end_time,
            "description": description
        }
        
        response = supabase.table("busy_times").insert(busy_data).execute()
        logger.info(f"Added busy time for {username}")
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error adding busy time: {e}")
        return None

def get_user_busy_times(username: str):
    """Get all busy times for a user"""
    try:
        profile = supabase.table("profiles").select("id").eq("username", username).execute()
        if not profile.data:
            return []
        
        user_id = profile.data[0]["id"]
        response = supabase.table("busy_times").select("*").eq("user_id", user_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching busy times: {e}")
        return []

def check_meeting_conflicts(project_id: str, start_time: str, end_time: str):
    """Check if a meeting time conflicts with any member's busy time"""
    try:
        # Get all project members
        members = supabase.table("project_members").select(
            "user_id, profiles(username)"
        ).eq("project_id", project_id).execute()
        
        conflicts = []
        for member in members.data:
            user_id = member["user_id"]
            username = member["profiles"]["username"]
            
            # Check for overlapping busy times
            busy_times = supabase.table("busy_times").select("*").eq("user_id", user_id).execute()
            
            for busy in busy_times.data:
                # Check if times overlap
                if (start_time < busy["end_time"] and end_time > busy["start_time"]):
                    conflicts.append({
                        "username": username,
                        "busy_start": busy["start_time"],
                        "busy_end": busy["end_time"],
                        "description": busy.get("description", "")
                    })
        
        return conflicts
    except Exception as e:
        logger.error(f"Error checking meeting conflicts: {e}")
        return []

# ========================================
# DOCUMENT MANAGEMENT FUNCTIONS
# ========================================

def upload_document(project_id: str, workflow_id: str, filename: str, file_url: str, uploaded_by: str):
    """Save document metadata"""
    try:
        profile = supabase.table("profiles").select("id").eq("username", uploaded_by).execute()
        if not profile.data:
            return None
        
        uploader_id = profile.data[0]["id"]
        
        doc_data = {
            "project_id": project_id,
            "workflow_id": workflow_id,
            "filename": filename,
            "file_url": file_url,
            "uploaded_by": uploader_id
        }
        
        response = supabase.table("documents").insert(doc_data).execute()
        logger.info(f"Document uploaded: {filename}")
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        return None

def get_project_documents(project_id: str):
    """Get all documents for a project"""
    try:
        response = supabase.table("documents").select(
            "*, profiles!uploaded_by(username)"
        ).eq("project_id", project_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching documents: {e}")
        return []

# ========================================
# DEADLINE & NOTIFICATION FUNCTIONS
# ========================================

def create_deadline(workflow_id: str, title: str, due_date: str, assigned_to: str):
    """Create a deadline for a workflow"""
    try:
        profile = supabase.table("profiles").select("id").eq("username", assigned_to).execute()
        if not profile.data:
            return None
        
        assignee_id = profile.data[0]["id"]
        
        deadline_data = {
            "workflow_id": workflow_id,
            "title": title,
            "due_date": due_date,
            "assigned_to": assignee_id,
            "status": "pending"
        }
        
        response = supabase.table("deadlines").insert(deadline_data).execute()
        logger.info(f"Deadline created: {title}")
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Error creating deadline: {e}")
        return None

def get_upcoming_deadlines(username: str, days: int = 7):
    """Get upcoming deadlines for a user within specified days"""
    try:
        profile = supabase.table("profiles").select("id").eq("username", username).execute()
        if not profile.data:
            return []
        
        user_id = profile.data[0]["id"]
        
        response = supabase.table("deadlines").select(
            "*, workflows(title, project_id)"
        ).eq("assigned_to", user_id).eq("status", "pending").execute()
        
        return response.data
    except Exception as e:
        logger.error("Error fetching upcoming deadlines: %s", e)
        return []

logger.info("Database connection initialized")