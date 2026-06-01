from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    redis_url: str = "redis://redis:6379"

    @property
    def public_key(self) -> str:
        return Path("/run/secrets/keys/public.pem").read_text()


settings = Settings()
