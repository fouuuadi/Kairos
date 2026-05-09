from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    resend_api_key: str = ""
    alert_email: str = ""
    price_refresh_interval: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
