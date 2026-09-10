import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Debrief.ai Gemini ATS Resume Screener"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8001
    ENVIRONMENT: str = "development"
    
    # Database: SQLite for zero-config local run, PostgreSQL for production Docker
    DATABASE_URL: str = "sqlite:///./ats_screening.db"
    
    # Gemini API Key
    GEMINI_API_KEY: str = ""
    
    # File upload limits (10 MB max)
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024
    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".docx", ".txt"]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
