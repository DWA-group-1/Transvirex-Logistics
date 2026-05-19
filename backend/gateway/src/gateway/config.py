from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="GATEWAY_",
        env_file=".env",
        env_file_encoding="utf-8",
    )

    auth_url: str = "http://localhost:8001"
    notification_url: str = "http://localhost:8002"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:4173"]
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"


settings = Settings()
