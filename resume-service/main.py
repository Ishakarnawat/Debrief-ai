from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from core.config import settings
from core.database import engine, Base
import models.db_models  # Ensure models are registered with Base.metadata
from api.routes import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    Base.metadata.create_all(bind=engine)
    print(f"[{settings.PROJECT_NAME}] Database tables verified/initialized on {settings.DATABASE_URL.split('://')[0]}.")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-ready FastAPI microservice that leverages Google Gemini GenAI to automate resume screening, ATS scoring, and candidate funneling.",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def root_health():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database_driver": settings.DATABASE_URL.split("://")[0]
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Debrief.ai Gemini ATS Resume Screener Microservice is running.",
        "docs_url": "/docs",
        "health_check": "/health"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
