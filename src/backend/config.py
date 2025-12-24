from pydantic_settings import BaseSettings
from typing import List
from datetime import datetime


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    REVEAL_DATE: datetime = datetime(2024, 12, 24, 0, 0, 0)
    PORT: int = 80
    CORS_ORIGINS: str = "*"  # Allow all origins for now
    VERSION: str = "0.0.21"
    
    # Cosmos DB Configuration (from environment variables with defaults)
    COSMOS_ENDPOINT: str = "https://crgar-bingo-db.documents.azure.com:443/"
    COSMOS_KEY: str = ""  # Set via COSMOS_KEY environment variable
    COSMOS_DATABASE: str = "AmigoInvisibleDB"
    COSMOS_CONTAINER: str = "Predictions"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated CORS origins to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
