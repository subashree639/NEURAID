from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
import json
import os
import numpy as np

router = APIRouter()
DB_FILE = "mock_db.json"

def get_db():
    if not os.path.exists(DB_FILE):
        return {"users": {}, "sessions": [], "predictions": []}
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_db(db):
    with open(DB_FILE, "w") as f:
        json.dump(db, f, indent=4)

class KeystrokeEvent(BaseModel):
    event_type: str # keydown or keyup
    timestamp: float
    key_type: str # alphanumeric, space, backspace, etc. (anonymized)

class SessionData(BaseModel):
    user_id: str
    events: List[KeystrokeEvent]
    session_duration: float

@router.post("/session")
def record_session(session: SessionData):
    db = get_db()
    
    # Simple processing to calculate metrics
    hold_times = []
    flight_times = []
    backspace_count = 0
    total_keys = 0
    
    # Process events
    active_keys = {} # key_type -> timestamp
    last_keyup_time = None
    
    for event in session.events:
        if event.event_type == 'keydown':
            active_keys[event.key_type] = event.timestamp
            
            if last_keyup_time is not None:
                flight_time = event.timestamp - last_keyup_time
                if flight_time > 0 and flight_time < 5000: # Filter out absurdly long pauses
                    flight_times.append(flight_time)
                    
            if event.key_type == 'backspace':
                backspace_count += 1
            total_keys += 1
            
        elif event.event_type == 'keyup':
            if event.key_type in active_keys:
                hold_time = event.timestamp - active_keys[event.key_type]
                if hold_time > 0 and hold_time < 1000:
                    hold_times.append(hold_time)
                del active_keys[event.key_type]
            last_keyup_time = event.timestamp

    # Avoid division by zero
    total_keys = max(1, total_keys)
    
    # Calculate aggregated features
    features = {
        "user_id": session.user_id,
        "timestamp": datetime.now().isoformat(),
        "avg_hold_time": float(np.mean(hold_times)) if hold_times else 0,
        "avg_flight_time": float(np.mean(flight_times)) if flight_times else 0,
        "typing_speed": (total_keys / session.session_duration) * 60000 if session.session_duration > 0 else 0, # CPM
        "backspace_freq": backspace_count / total_keys,
        "session_duration": session.session_duration
    }
    
    db["sessions"].append(features)
    save_db(db)
    
    return {"message": "Session recorded successfully", "features": features}

@router.get("/history/{user_id}")
def get_user_history(user_id: str):
    db = get_db()
    user_sessions = [s for s in db["sessions"] if s.get("user_id") == user_id]
    return user_sessions
