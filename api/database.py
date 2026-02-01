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

print(" Database connection initialized.")