from datetime import datetime
from typing import List, Dict

def check_meeting_conflicts(meeting_start: str, meeting_end: str, team_schedules: List[Dict]):
    """
    check for consistent meetings scheduling no overlaps
    logic: (StartA < EndB) AND (StartB < EndA)
    """
    m_start = datetime.fromisoformat(meeting_start)
    m_end = datetime.fromisoformat(meeting_end)
    
    conflicted_members = []
    
    for entry in team_schedules:
        s_start = datetime.fromisoformat(entry['start_time'])
        s_end = datetime.fromisoformat(entry['end_time'])
        
        if m_start < s_end and s_start < m_end:
            conflicted_members.append({
                "user_id": entry['user_id'],
                "username": entry['username'],
                "reason": entry['title']
            })
            
    return conflicted_members