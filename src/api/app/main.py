from fastapi import FastAPI
from .routes_jobs import router as jobs_router
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="Doc processing API", description="API for managing jobs", version="1.0.0")

origins = ["*"]  # Allow all origins for simplicity, adjust in production
app.include_router(jobs_router)

app.add_middleware( 
        CORSMiddleware, 
        allow_origins=origins, 
        allow_credentials=False,
        allow_methods=["*"], 
        allow_headers=["*"],
        )

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
