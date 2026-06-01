from functools import cached_property
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_algorithm: str = "RS256"
    access_token_expire_minutes: int = 60
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:4173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    @cached_property
    def private_key(self) -> str:
        return Path("/run/secrets/keys/private.pem").read_text()

    @cached_property
    def public_key(self) -> str:
        return Path("/run/secrets/keys/public.pem").read_text()


settings = Settings()
