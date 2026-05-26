from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    redis_url: str = "http://redis:6379"
    jwt_secret: str
    jwt_algorithm: str
    auth_internal_url: str = "http://auth:8000"


settings = Settings()
