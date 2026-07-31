# NEURAID (Neuro-Evidence and Unseen Response AI Diagnostic System)

NEURAID is a production-quality AI healthcare web application that continuously collects passive keystroke dynamics from users, builds a personal behavioural baseline, compares future behaviour, predicts neurological risk using a multi-layer LSTM model, and explains the prediction using SHAP.

## Project Structure

```
neuraid/
├── backend/            # FastAPI backend with mock DB for local demo
│   ├── main.py         # App entrypoint
│   ├── requirements.txt
│   └── routes/         # API endpoints (auth, metrics, ml)
├── frontend/           # React + Vite frontend
│   ├── package.json
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx     # Routing & auth state
│       ├── components/ # KeystrokeListener, Charts
│       └── pages/      # LandingPage, Login, Register, Dashboard
└── ml/                 # Machine Learning components
    ├── __init__.py     # Feature extraction, baseline, prediction logic
    ├── lstm_model.py   # Keras LSTM architecture
    └── train_synthetic.py # Synthetic data generation script
```

## How to Run Locally

### 1. Start the Backend

Open a terminal in the `neuraid/backend` directory:

```bash
# Create and activate a virtual environment (optional but recommended)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`.

### 2. Start the Frontend

Open another terminal in the `neuraid/frontend` directory:

```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 3. Generate Mock Data (Optional)

To train the LSTM model on synthetic data and save it:

```bash
cd neuraid/ml
python train_synthetic.py
```

## Architecture & Privacy
*   **Privacy-First:** The `KeystrokeListener` only captures `keydown` and `keyup` timestamps, categorizing keys broadly (e.g., alphanumeric, space) without ever recording the actual characters typed.
*   **Explainable AI:** SHAP integration shows exactly which behavioral shifts (e.g., increased flight time, decreased speed) led to the current risk score.
