from typing import List, Dict, Tuple
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import random

def extract_features(sessions: List[Dict]) -> np.ndarray:
    """Convert a list of session dictionaries to a 2D numpy array of features."""
    features = []
    for s in sessions:
        features.append([
            s.get("avg_hold_time", 0),
            s.get("avg_flight_time", 0),
            s.get("typing_speed", 0),
            s.get("backspace_freq", 0)
        ])
    return np.array(features)

def calculate_baseline(sessions: List[Dict]) -> Dict:
    if not sessions:
        return {}
    features = extract_features(sessions)
    mean_vector = np.mean(features, axis=0)
    return {
        "avg_hold_time": float(mean_vector[0]),
        "avg_flight_time": float(mean_vector[1]),
        "typing_speed": float(mean_vector[2]),
        "backspace_freq": float(mean_vector[3])
    }

def compute_cosine_similarity(baseline: Dict, current: Dict) -> float:
    b_vec = np.array([[baseline.get("avg_hold_time", 0), baseline.get("avg_flight_time", 0), baseline.get("typing_speed", 0), baseline.get("backspace_freq", 0)]])
    c_vec = np.array([[current.get("avg_hold_time", 0), current.get("avg_flight_time", 0), current.get("typing_speed", 0), current.get("backspace_freq", 0)]])
    
    # Avoid zero vectors causing NaN
    if not b_vec.any() or not c_vec.any():
        return 0.0
        
    sim = cosine_similarity(b_vec, c_vec)[0][0]
    return float(sim)

def predict_risk(sessions: List[Dict]) -> Tuple[float, str, float]:
    """
    Mock LSTM prediction.
    In a real scenario, we load a pre-trained Keras LSTM model, scale the features,
    and predict the risk based on the sequential change.
    """
    # Fallback/heuristic for demo when model isn't trained
    if len(sessions) < 2:
        return 0.0, "Green", 0.0
        
    baseline = calculate_baseline(sessions[:-1])
    current = sessions[-1]
    
    sim = compute_cosine_similarity(baseline, current)
    # If similarity is high, risk is low.
    risk_score = (1.0 - sim) * 100
    
    # Add some random noise for realism in demo
    risk_score = min(max(risk_score + random.uniform(-10, 10), 0), 100)
    
    confidence = random.uniform(85.0, 99.0)
    
    if risk_score <= 30:
        level = "Green"
    elif risk_score <= 60:
        level = "Yellow"
    elif risk_score <= 80:
        level = "Orange"
    else:
        level = "Red"
        
    return risk_score, level, confidence

def generate_shap_explanation(sessions: List[Dict]) -> List[Dict]:
    """
    Mock SHAP explainer.
    Normally we use shap.DeepExplainer with the Keras model.
    """
    # Return mock feature importance based on recent deviations
    if len(sessions) < 2:
        return []
    
    baseline = calculate_baseline(sessions[:-1])
    current = sessions[-1]
    
    features = ["avg_hold_time", "avg_flight_time", "typing_speed", "backspace_freq"]
    labels = ["Hold Time", "Flight Time", "Typing Speed", "Error Rate"]
    
    explanations = []
    for f, l in zip(features, labels):
        diff = current.get(f, 0) - baseline.get(f, 0)
        # Normalize diff for display
        impact = min(max(diff / (baseline.get(f, 1) + 1e-5), -1), 1) * 100
        explanations.append({
            "feature": l,
            "impact": impact,
            "direction": "Increased" if impact > 0 else "Decreased"
        })
        
    return explanations
