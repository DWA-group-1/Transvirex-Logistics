from functools import cached_property
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="GATEWAY_",
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    auth_url: str = "http://auth:8000"
    notif_url: str = "http://notification:8000"
    catalog_url: str = "http://catalog:8000"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:4173"]
    jwt_algorithm: str = "RS256"

    @cached_property
    def public_key(self) -> str:
        return Path("/run/secrets/keys/public.pem").read_text()


settings = Settings()
