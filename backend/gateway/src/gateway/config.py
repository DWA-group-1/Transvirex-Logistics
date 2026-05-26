from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="GATEWAY_",
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    auth_url: str = "http://localhost:8001"
    notif_url: str = "http://localhost:8002"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:4173"]
    jwt_public_key: str
    jwt_algorithm: str = "RS256"

    @property
    def public_key(self) -> str:
        return self.jwt_public_key.replace("\\n", "\n")


settings = Settings()
