from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    venice_api_key: str
    venice_model: str = "llama-3.3-70b"
    venice_base_url: str = "https://api.venice.ai/api/v1"
    db_path: str = "/data/robochat.db"
    allowed_origins: str = "http://localhost:3000"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    model_config = {"env_file": ".env"}


settings = Settings()
