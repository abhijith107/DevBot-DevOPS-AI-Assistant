from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # MongoDB settings
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = "devbot"
    
    # Groq API settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # Application settings
    APP_NAME: str = "DevBot+"
    DEBUG: bool = True
    
    class Config:
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings() 