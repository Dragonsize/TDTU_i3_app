import os
import uuid
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
    """Save or update user profile in database - creates UUID if new user"""
    try:
        print(f"[DEBUG] save_user_profile called with username: {username}")
        
        # Check if profile exists
        print(f"[DEBUG] Checking if profile exists...")
        existing = supabase.table("profiles").select("*").eq("username", username).execute()
        print(f"[DEBUG] Existing profile query result: {existing.data}")
        
        if existing.data:
            # Profile exists, return existing data
            print(f"[SUCCESS] Profile already exists for {username}: {existing.data[0]}")
            return existing.data[0]
        else:
            # Create new profile with generated UUID
            new_id = user_id if user_id else str(uuid.uuid4())
            print(f"[DEBUG] Creating new profile with ID: {new_id}")
            
            insert_data = {
                "id": new_id,
                "username": username
            }
            print(f"[DEBUG] Insert data: {insert_data}")
            
            response = supabase.table("profiles").insert(insert_data).execute()
            print(f"[DEBUG] Insert response: {response}")
            print(f"[DEBUG] Insert response data: {response.data}")
            
            if response.data:
                print(f"[SUCCESS] Created new profile for {username} with ID {new_id}")
                return response.data[0]
            else:
                print(f"[ERROR] Insert returned no data")
                return None
        
    except Exception as e:
        print(f"[EXCEPTION] Error saving user profile: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return None

def save_product(title: str, description: str, price: float, category: str, seller_username: str):
    """Save a new listing to marketplace, linked to seller profile"""
    try:
        # First, get the seller's profile ID
        profile = supabase.table("profiles").select("id").eq("username", seller_username).execute()
        
        if not profile.data:
            print(f"Profile not found for username: {seller_username}")
            return None
        
        seller_id = profile.data[0]["id"]
        
        # Create listing in marketplace table
        listing_data = {
            "title": title,
            "description": description,
            "price": price,
            "category": category,
            "seller_id": seller_id,
            "status": "active"
        }
        
        response = supabase.table("marketplace").insert(listing_data).execute()
        print(f"Listing created: {response.data}")
        return response.data
    except Exception as e:
        print(f"Error saving listing: {e}")
        return None

def get_all_marketplace_listings():
    """Get all active marketplace listings with seller profile info"""
    try:
        response = supabase.table("marketplace").select(
            "*, profiles!seller_id(username, major, level_taekwondo)"
        ).eq("status", "active").execute()
        return response.data
    except Exception as e:
        print(f"Error fetching marketplace listings: {e}")
        return []

def get_user_listings(username: str):
    """Get all listings for a specific user"""
    try:
        # Get user profile first
        profile = supabase.table("profiles").select("id").eq("username", username).execute()
        
        if not profile.data:
            return []
        
        user_id = profile.data[0]["id"]
        
        # Get user's listings
        response = supabase.table("marketplace").select("*").eq("seller_id", user_id).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching user listings: {e}")
        return []

print(" Database connection initialized.")