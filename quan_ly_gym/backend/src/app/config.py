import os
from urllib.parse import quote_plus
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    DB_SERVER: str = os.getenv("DB_SERVER", "db")
    DB_NAME: str = os.getenv("DB_NAME", "QLGymDB")
    DB_USER: str = os.getenv("DB_USER", "sa")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "111111")
    DB_DRIVER: str = os.getenv("DB_DRIVER", "ODBC Driver 18 for SQL Server")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    @property
    def DATABASE_URL(self) -> str:
        driver = self.DB_DRIVER.replace(" ", "+")
        pwd = quote_plus(self.DB_PASSWORD)
        return (
            f"mssql+pyodbc://{self.DB_USER}:{pwd}"
            f"@{self.DB_SERVER}/{self.DB_NAME}"
            f"?driver={driver}&TrustServerCertificate=yes"
        )

    class Config:
        env_file = ".env"


settings = Settings()
