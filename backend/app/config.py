import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "KELET Multi-Agent Research Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # AI & Search API Keys
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    TAVILY_API_KEY: Optional[str] = os.getenv("TAVILY_API_KEY", "")
    SERPAPI_API_KEY: Optional[str] = os.getenv("SERPAPI_API_KEY", "")
    
    # Research Parameters
    DEFAULT_DEPTH_MODE: str = "comprehensive"  # "fast" | "comprehensive"
    DEFAULT_MODEL: str = "gemini-1.5-flash"
    MAX_DISCOVERY_SOURCES: int = 12
    DEMO_MODE: bool = False
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    EXPORT_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "exports")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.EXPORT_DIR, exist_ok=True)
