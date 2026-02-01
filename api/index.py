from fastapi import FastAPI, HTTPException, Response, Cookie, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from .calendar_logic import check_meeting_conflicts
from .login import scrape_profile
from .database import save_user_profile, save_product
from .auth import create_access_token, create_refresh_token, verify_token
app = FastAPI()

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
        save_user_profile(req.username)
        
        # Create JWT tokens
        access_token = create_access_token(data={"sub": req.username})
        refresh_token = create_refresh_token(data={"sub": req.username})
        
        # Set HTTP-only cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=60 * 60 * 24  # 24 hours
        )
        
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
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
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24
    )
    
    return {
        "status": "success",
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@app.post("/api/add-product")
async def add_product(req: ProductRequest):
    """Add a new product to the marketplace"""
    try:
        result = save_product(
            title=req.title,
            description=req.description,
            price=req.price,
            category=req.category
        )
        
        if result:
            return {
                "success": True,
                "message": "Product added successfully",
                "data": result
            }
        else:
            return {
                "success": False,
                "message": "Failed to add product to database"
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error adding product: {str(e)}"
        }