from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gateway_url: str = "http://gateway:8000"
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:3b"
    max_tool_iterations: int = 6
    jwt_algorithm: str = "RS256"
    jwt_public_key_path: str = "/run/secrets/keys/public.pem"

    @property
    def public_key(self) -> str:
        return Path(self.jwt_public_key_path).read_text()

    class Config:
        env_file = ".env"

settings = Settings()