from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str = ""
    jwt_algorithm: str = "RS256"
    jwt_private_key: str = ""
    jwt_public_key: str = ""
    access_token_expire_minutes: int = 60
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:4173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    @property
    def private_key(self) -> str:
        return self.jwt_private_key.replace("\\n", "\n")

    @property
    def public_key(self) -> str:
        return self.jwt_public_key.replace("\\n", "\n")


settings = Settings()