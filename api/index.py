from fastapi import FastAPI, HTTPException, Response, Cookie
from pydantic import BaseModel
from typing import Optional
import os
import logging
from .auth import create_access_token, create_refresh_token, verify_token

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment detection
IS_PRODUCTION = os.getenv("VERCEL_ENV") == "production" or os.getenv("ENVIRONMENT") == "production"

@app.get("/api/health")
def hello():
    return {"status": "Online", "message": "API is running"}

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
