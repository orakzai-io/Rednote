# pydantic-settings: env vars, constants (TOP_K, etc.)
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    GROQ_API_KEY: str
    UPLOAD_DIR: str = "./uploads"
    FASTEMBED_CACHE_PATH: str = "../fastembed_cache"
    SECRET_KEY: str
    TOP_K: int = 5
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    # Comma-separated list of allowed CORS origins (e.g., "http://localhost:5173,https://example.com")
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:80"
    # Number of uvicorn workers for production
    UVICORN_WORKERS: int = 4
    # Database connection pool settings
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse ALLOWED_ORIGINS comma-separated string into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    def model_post_init(self, __context: object) -> None:
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY environment variable must be set when auth is enabled")


settings = Settings(_env_file=".env", _env_file_encoding="utf-8")  # type: ignore[call-arg]
