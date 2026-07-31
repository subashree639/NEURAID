from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import json
import os
import uuid

router = APIRouter()

# Mock DB file for local demo
DB_FILE = "mock_db.json"

def get_db():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w") as f:
            json.dump({"users": {}, "sessions": [], "predictions": []}, f)
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_db(db):
    with open(DB_FILE, "w") as f:
        json.dump(db, f, indent=4)

class UserRegister(BaseModel):
    name: str
    age: int
    gender: str
    occupation: str
    email: EmailStr
    phone: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(user: UserRegister):
    db = get_db()
    
    # Check if user exists
    for u_id, u_data in db["users"].items():
        if u_data["email"] == user.email:
            raise HTTPException(status_code=400, detail="Email already registered")
            
    user_id = str(uuid.uuid4())
    db["users"][user_id] = {
        "id": user_id,
        "name": user.name,
        "age": user.age,
        "gender": user.gender,
        "occupation": user.occupation,
        "email": user.email,
        "phone": user.phone,
        "password": user.password # In production, this should be hashed
    }
    
    save_db(db)
    return {"message": "User registered successfully", "user_id": user_id, "name": user.name}

@router.post("/login")
def login(user: UserLogin):
    db = get_db()
    for u_id, u_data in db["users"].items():
        if u_data["email"] == user.email and u_data["password"] == user.password:
            return {"message": "Login successful", "user_id": u_id, "name": u_data["name"]}
            
    raise HTTPException(status_code=401, detail="Invalid email or password")

@router.get("/user/{user_id}")
def get_user(user_id: str):
    db = get_db()
    if user_id in db["users"]:
        user_data = db["users"][user_id].copy()
        del user_data["password"]
        return user_data
    raise HTTPException(status_code=404, detail="User not found")
