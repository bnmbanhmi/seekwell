from pydantic_settings import BaseSettings, SettingsConfigDict # Ensure SettingsConfigDict is imported if you are on Pydantic V2
# If you are on Pydantic V1, it might just be:
# from pydantic import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    GOOGLE_API_KEY: str # Make sure this line is added

    # For Pydantic V2
    model_config = SettingsConfigDict(env_file=".env", extra='ignore')

    # For Pydantic V1, you would use a nested Config class:
    # class Config:
    #     env_file = ".env"

settings = Settings()