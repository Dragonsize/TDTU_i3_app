from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .calendar_logic import check_meeting_conflicts
from .login import scrape_profile
app = FastAPI()

class MeetingRequest(BaseModel):
    start_time: str
    end_time: str
    team_schedules: list

class LoginRequest(BaseModel):
    username: str
    password: str

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
async def login(req: LoginRequest):
    try:
        profile_data = scrape_profile(req.username, req.password)
        return {
            "status": "success",
            "profile": profile_data
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")