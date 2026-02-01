import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Missing Supabase credentials in .env")

supabase: Client = create_client(url, key)

def get_team_schedules():
    # Fetch all schedules to check for conflicts
    response = supabase.table("schedules").select("*").execute()
    return response.data

def save_user_profile(username: str, user_id: str = None):
    """Save or update user profile in database"""
    try:
        # Check if profile exists
        existing = supabase.table("profiles").select("*").eq("username", username).execute()
        
        if existing.data:
            # Update existing profile
            response = supabase.table("profiles").update({
                "username": username
            }).eq("username", username).execute()
        else:
            # Insert new profile (requires auth user id)
            if user_id:
                response = supabase.table("profiles").insert({
                    "id": user_id,
                    "username": username
                }).execute()
            else:
                print(f"Cannot create profile without user_id")
                return None
        
        return response.data
    except Exception as e:
        print(f"Error saving user profile: {e}")
        return None

print(" Database connection initialized.")