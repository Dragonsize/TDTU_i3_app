from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .calendar_logic import check_meeting_conflicts
app = FastAPI()

class MeetingRequest(BaseModel):
    start_time: str
    end_time: str
    team_schedules: list

@app.get("/api/health")
def hello():
    return {"status": "Online", "message": "API is running"}

@app.post("/api/calendar_logic")
async def validate_schedule(req: MeetingRequest):
    conflicts = check_meeting_conflicts(req.start_time, req.end_time, req.team_schedules)
    if conflicts:
        return {"status": "conflict", "conflicted_members": conflicts}
    return {"status": "success", "message": "All members are free!"}