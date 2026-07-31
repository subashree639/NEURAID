from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, metrics, ml
import uvicorn

app = FastAPI(title="NEURAID API", description="Backend for NEURAID application", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["Metrics"])
app.include_router(ml.router, prefix="/api/ml", tags=["Machine Learning"])

@app.get("/")
def read_root():
    return {"message": "Welcome to NEURAID API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
