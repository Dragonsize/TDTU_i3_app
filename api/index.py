from fastapi import FastAPI, HTTPException, Response, Cookie
from pydantic import BaseModel, validator
from typing import Optional
import os
import logging
from .calendar_logic import check_meeting_conflicts
from .login import scrape_profile
from .database import save_user_profile, save_product, get_all_marketplace_listings, get_user_listings
from .auth import create_access_token, create_refresh_token, verify_token

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment detection
IS_PRODUCTION = os.getenv("VERCEL_ENV") == "production" or os.getenv("ENVIRONMENT") == "production"

class MeetingRequest(BaseModel):
    start_time: str
    end_time: str
    team_schedules: list

class LoginRequest(BaseModel):
    username: str
    password: str

class ProductRequest(BaseModel):
    title: str
    description: str
    price: float
    category: str
    
    @validator('title')
    def title_valid(cls, v):
        if not v or len(v) < 3:
            raise ValueError('Title must be at least 3 characters')
        if len(v) > 200:
            raise ValueError('Title must be less than 200 characters')
        return v.strip()
    
    @validator('description')
    def description_valid(cls, v):
        if not v or len(v) < 10:
            raise ValueError('Description must be at least 10 characters')
        if len(v) > 2000:
            raise ValueError('Description must be less than 2000 characters')
        return v.strip()
    
    @validator('price')
    def price_valid(cls, v):
        if v <= 0:
            raise ValueError('Price must be greater than 0')
        if v > 1000000:
            raise ValueError('Price must be less than 1,000,000')
        return round(v, 2)
    
    @validator('category')
    def category_valid(cls, v):
        allowed = ['textbooks', 'notes', 'electronics', 'supplies', 'other']
        if v not in allowed:
            raise ValueError(f'Category must be one of: {", ".join(allowed)}')
        return v

@app.get("/api/health")
def hello():
    return {"status": "Online", "message": "API is running"}

@app.post("/api/check-schedule")
async def validate_schedule(req: MeetingRequest):
    conflicts = check_meeting_conflicts(req.start_time, req.end_time, req.team_schedules)
    if conflicts:
        return {"status": "conflict", "conflicted_members": conflicts}
    return {"status": "success", "message": "All members are free!"}

@app.post("/api/login")
async def login(req: LoginRequest, response: Response):
    try:
        profile_data = scrape_profile(req.username, req.password)
        
        # Check if fullname is valid (not "Không tìm thấy")
        if profile_data.get("fullname") == "Không tìm thấy":
            raise HTTPException(status_code=401, detail="Invalid credentials - profile not found")
        
        # Save profile to database
        db_profile = save_user_profile(req.username)
        if not db_profile:
            raise HTTPException(status_code=500, detail="Failed to create profile")
        
        # Create JWT tokens
        access_token = create_access_token(data={"sub": req.username})
        refresh_token = create_refresh_token(data={"sub": req.username})
        
        # Set HTTP-only cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=IS_PRODUCTION,
            samesite="lax",
            max_age=60 * 60 * 24  # 24 hours
        )
        
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=IS_PRODUCTION,
            samesite="lax",
            max_age=60 * 60 * 24 * 7  # 7 days
        )
        
        return {
            "status": "success",
            "profile": profile_data,
            "access_token": access_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")

@app.post("/api/logout")
async def logout(response: Response):
    """Logout user by clearing cookies"""
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return {"status": "success", "message": "Logged out successfully"}

@app.get("/api/verify-session")
async def verify_session(access_token: Optional[str] = Cookie(None)):
    """Verify if user session is valid"""
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return {
        "status": "success",
        "username": payload.get("sub"),
        "authenticated": True
    }

@app.post("/api/refresh-token")
async def refresh_token_endpoint(
    response: Response,
    refresh_token: Optional[str] = Cookie(None)
):
    """Refresh access token using refresh token"""
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token provided")
    
    payload = verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    username = payload.get("sub")
    
    # Create new access token
    new_access_token = create_access_token(data={"sub": username})
    
    # Set new access token cookie
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=60 * 60 * 24
    )
    
    return {
        "status": "success",
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@app.post("/api/add-product")
async def add_product(req: ProductRequest, access_token: Optional[str] = Cookie(None)):
    """Add a new product to the marketplace (linked to user profile)"""
    try:
        # Verify user is authenticated
        if not access_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        payload = verify_token(access_token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        username = payload.get("sub")
        
        # Save product linked to user's profile
        result = save_product(
            title=req.title,
            description=req.description,
            price=req.price,
            category=req.category,
            seller_username=username
        )
        
        if result:
            logger.info(f"Listing created by {username}")
            return {
                "success": True,
                "message": "Listing created successfully",
                "data": result
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create listing")
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating listing: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/marketplace")
async def get_marketplace():
    """Get all marketplace listings with seller info"""
    try:
        listings = get_all_marketplace_listings()
        return {
            "success": True,
            "listings": listings
        }
    except Exception as e:
        logger.error(f"Error fetching listings: {e}")
        return {
            "success": False,
            "message": "Error fetching listings"
        }

@app.get("/api/my-listings")
async def get_my_listings(access_token: Optional[str] = Cookie(None)):
    """Get current user's listings"""
    try:
        if not access_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        payload = verify_token(access_token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        username = payload.get("sub")
        listings = get_user_listings(username)
        
        return {
            "success": True,
            "listings": listings
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user listings: {e}")
        return {
            "success": False,
            "message": "Error fetching your listings"
        }
