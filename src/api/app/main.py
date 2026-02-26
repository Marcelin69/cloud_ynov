from fastapi import FastAPI
from .routes_jobs import router as jobs_router
app = FastAPI(title="Doc processing API", description="API for managing jobs", version="1.0.0")


app.include_router(jobs_router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
