from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gateway_url: str = "http://gateway:8000"
    ollama_url: str = "http://ollama:11434"
    ollama_model: str = "llama3.2:3b"
    max_tool_iterations: int = 6


settings = Settings()

