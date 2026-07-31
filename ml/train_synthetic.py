import numpy as np
from lstm_model import build_lstm_model
import os

def generate_synthetic_data(num_users=100, seq_length=10):
    """
    Generate synthetic keystroke sequences for training.
    Normal users: stable hold times, flight times.
    At-risk users: increasing latencies, decreasing speed, erratic rhythm.
    """
    X = []
    y = []
    
    for i in range(num_users):
        is_risk = np.random.rand() > 0.7 # 30% are at-risk
        
        # Base stats for a user
        base_hold = np.random.normal(100, 20)
        base_flight = np.random.normal(200, 50)
        base_speed = np.random.normal(250, 40)
        base_err = np.random.normal(0.05, 0.02)
        
        sequence = []
        for j in range(seq_length):
            if is_risk:
                # Progressively worse
                hold = base_hold + (j * np.random.normal(5, 2))
                flight = base_flight + (j * np.random.normal(10, 3))
                speed = base_speed - (j * np.random.normal(5, 2))
                err = base_err + (j * np.random.normal(0.01, 0.005))
            else:
                # Stable
                hold = base_hold + np.random.normal(0, 5)
                flight = base_flight + np.random.normal(0, 10)
                speed = base_speed + np.random.normal(0, 5)
                err = base_err + np.random.normal(0, 0.01)
                
            sequence.append([
                max(0, hold), 
                max(0, flight), 
                max(0, speed), 
                max(0, min(1, err))
            ])
            
        X.append(sequence)
        y.append(1 if is_risk else 0)
        
    return np.array(X), np.array(y)

if __name__ == "__main__":
    print("Generating synthetic data...")
    X, y = generate_synthetic_data(num_users=500, seq_length=14)
    
    print(f"X shape: {X.shape}, y shape: {y.shape}")
    
    model = build_lstm_model((14, 4))
    
    print("Training model...")
    model.fit(X, y, epochs=10, batch_size=32, validation_split=0.2)
    
    # Save model weights
    os.makedirs("models", exist_ok=True)
    model.save("models/neuraid_lstm.keras")
    print("Model saved to models/neuraid_lstm.keras")
