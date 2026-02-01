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

def get_team_schedules():
    # Fetch all schedules to check for conflicts
    response = supabase.table("schedules").select("*").execute()
    return response.data

def save_user_profile(username: str, user_id: str = None):
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
                "username": username
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

def save_product(title: str, description: str, price: float, category: str, seller_username: str):
    """Save a new listing to marketplace, linked to seller profile"""
    try:
        # First, get the seller's profile ID
        profile = supabase.table("profiles").select("id").eq("username", seller_username).execute()
        
        if not profile.data:
            logger.warning(f"Profile not found for username: {seller_username}")
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
        logger.info(f"Listing created for user {seller_username}")
        return response.data
    except Exception as e:
        logger.error(f"Error saving listing: {e}")
        return None

def get_all_marketplace_listings():
    """Get all active marketplace listings with seller profile info"""
    try:
        response = supabase.table("marketplace").select(
            "*, profiles!seller_id(username, major)"
        ).eq("status", "active").limit(20).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching marketplace listings: {e}")
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
        logger.error(f"Error fetching user listings: {e}")
        return []

logger.info("Database connection initialized")