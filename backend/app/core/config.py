from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Sarafi Digital Suite"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql://sarafi_suite:sarafi_suite@localhost:5437/sarafi_suite"

    SECRET_KEY: str = "dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    BACKEND_CORS_ORIGINS: str = "http://localhost:3004,http://localhost:5173"
    FRONTEND_URL: str = "http://localhost:3004"

    SEED_ADMIN_EMAIL: str = "admin@sarafi.local"
    SEED_ADMIN_PASSWORD: str = "Admin123!@#"

    UPLOAD_DIR: str = "uploads"

    RATE_SYNC_ENABLED: bool = True
    RATE_SYNC_INTERVAL_SECONDS: int = 30
    RATE_SYNC_STALE_AFTER_SECONDS: int = 90
    RATE_SYNC_FAILURE_BACKOFF_MAX_SECONDS: int = 300
    RATE_SYNC_HTTP_TIMEOUT_SECONDS: float = 20.0

    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    ACCESS_COOKIE_NAME: str = "sarafi_suite_access"
    REFRESH_COOKIE_NAME: str = "sarafi_suite_refresh"

    @field_validator("DEBUG", "COOKIE_SECURE", "RATE_SYNC_ENABLED", mode="before")
    @classmethod
    def _parse_bool(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip().lower() in {"1", "true", "yes", "on"}
        return v

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
