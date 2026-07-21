import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    GROQ_API_KEY: str = ""
    UPLOAD_DIR: str = "/tmp/uploads" if os.environ.get("VERCEL") else "./uploads"
    FASTEMBED_CACHE_PATH: str = "/tmp/fastembed_cache" if os.environ.get("VERCEL") else "../fastembed_cache"
    SECRET_KEY: str = "default_secret_key_change_in_production_32bytes"
    TOP_K: int = 5
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    # Comma-separated list of allowed CORS origins (e.g., "http://localhost:5173,https://example.com")
    ALLOWED_ORIGINS: str = "*"
    # Number of uvicorn workers for production
    UVICORN_WORKERS: int = 4
    # Database connection pool settings
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse ALLOWED_ORIGINS comma-separated string into a list."""
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]



settings = Settings(_env_file=".env", _env_file_encoding="utf-8")  # type: ignore[call-arg]
