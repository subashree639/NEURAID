from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List
import json
import os
import random
import sys

# We add the root directory to path to import ml module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from ml import predict_risk, generate_shap_explanation, compute_cosine_similarity, calculate_baseline

router = APIRouter()
DB_FILE = "mock_db.json"


class TypingBatchData(BaseModel):
    keystrokes: List[Dict] = []
    wpm: float = 0.0
    holdTimes: List[float] = []
    flightTimes: List[float] = []
    latencies: List[float] = []
    errorRate: float = 0.0
    backspaceFreq: float = 0.0


class TypingAssessmentRequest(BaseModel):
    batch1Data: TypingBatchData
    batch2Data: TypingBatchData


def get_db():
    if not os.path.exists(DB_FILE):
        return {"users": {}, "sessions": [], "predictions": []}
    with open(DB_FILE, "r") as f:
        return json.load(f)


def save_db(db):
    with open(DB_FILE, "w") as f:
        json.dump(db, f, indent=4)


def _build_batch_features(batch_data: TypingBatchData) -> Dict:
    hold_times = batch_data.holdTimes or []
    flight_times = batch_data.flightTimes or []
    return {
        "avg_hold_time": float(sum(hold_times) / len(hold_times)) if hold_times else 0.0,
        "avg_flight_time": float(sum(flight_times) / len(flight_times)) if flight_times else 0.0,
        "typing_speed": float(batch_data.wpm * 5.0) if batch_data.wpm else 0.0,
        "backspace_freq": float(batch_data.backspaceFreq or 0.0),
        "error_rate": float(batch_data.errorRate or 0.0)
    }


def _build_typing_shap(batch1: Dict, batch2: Dict) -> List[Dict]:
    features = ["avg_hold_time", "avg_flight_time", "typing_speed", "backspace_freq"]
    labels = ["Hold Time", "Flight Time", "Typing Speed", "Error Rate"]
    explanations = []
    for feature, label in zip(features, labels):
        baseline_value = batch1.get(feature, 0.0)
        current_value = batch2.get(feature, 0.0)
        diff = current_value - baseline_value
        impact = min(max(diff / (abs(baseline_value) + 1e-5), -1), 1) * 100
        explanations.append({
            "feature": label,
            "impact": impact,
            "direction": "Increased" if impact > 0 else "Decreased"
        })
    return explanations


@router.get("/baseline/{user_id}")
def get_baseline(user_id: str):
    db = get_db()
    user_sessions = [s for s in db["sessions"] if s.get("user_id") == user_id]

    if not user_sessions:
        raise HTTPException(status_code=404, detail="No session data to calculate baseline")

    baseline_vector = calculate_baseline(user_sessions)
    return {"baseline": baseline_vector}


@router.post("/predict/{user_id}")
def run_prediction(user_id: str):
    db = get_db()
    user_sessions = [s for s in db["sessions"] if s.get("user_id") == user_id]

    if len(user_sessions) < 2:
        raise HTTPException(status_code=400, detail="Insufficient data for prediction. Keep typing.")

    baseline = calculate_baseline(user_sessions[:-1])  # use all but last as baseline for demo
    current_session = user_sessions[-1]

    similarity = compute_cosine_similarity(baseline, current_session)
    risk_score, risk_level, confidence = predict_risk(user_sessions)
    shap_explanation = generate_shap_explanation(user_sessions)

    prediction = {
        "user_id": user_id,
        "similarity_score": similarity,
        "risk_percentage": risk_score,
        "risk_level": risk_level,
        "confidence": confidence,
        "shap_explanation": shap_explanation
    }

    db["predictions"].append(prediction)
    save_db(db)

    return prediction


@router.post("/typing-assessment/{user_id}")
def run_typing_assessment(user_id: str, payload: TypingAssessmentRequest):
    batch1_features = _build_batch_features(payload.batch1Data)
    batch2_features = _build_batch_features(payload.batch2Data)

    similarity = compute_cosine_similarity(batch1_features, batch2_features)
    deviation_score = max(0.0, (1.0 - similarity) * 100.0)
    risk_score = min(max(deviation_score + random.uniform(-8.0, 8.0), 0.0), 100.0)
    confidence = 85.0 + min(abs(batch2_features["typing_speed"] - batch1_features["typing_speed"]) / 10.0, 14.0)

    if risk_score <= 30:
        risk_level = "Green"
    elif risk_score <= 60:
        risk_level = "Yellow"
    elif risk_score <= 80:
        risk_level = "Orange"
    else:
        risk_level = "Red"

    prediction = {
        "user_id": user_id,
        "similarity_score": similarity,
        "risk_percentage": risk_score,
        "risk_level": risk_level,
        "confidence": confidence,
        "shap_explanation": _build_typing_shap(batch1_features, batch2_features)
    }

    db = get_db()
    db["predictions"].append(prediction)
    save_db(db)

    return prediction
