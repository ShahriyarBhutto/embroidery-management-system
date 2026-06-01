from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    APP_NAME: str = "Embroidery Management System"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://embroidery:embroidery_pass@localhost:5432/embroidery_db"

    SECRET_KEY: str = "change-this-to-a-long-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_FROM_NAME: str = "Embroidery System"
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False

    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

    def model_post_init(self, __context):
        if isinstance(self.ALLOWED_ORIGINS, str):
            try:
                object.__setattr__(self, "ALLOWED_ORIGINS", json.loads(self.ALLOWED_ORIGINS))
            except Exception:
                object.__setattr__(self, "ALLOWED_ORIGINS", [self.ALLOWED_ORIGINS])


settings = Settings()
