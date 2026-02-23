from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_env: str = Field(default='development', alias='APP_ENV')
    app_name: str = Field(default='immocal-backend', alias='APP_NAME')

    service_token: str = Field(default='', alias='MICROLOCATION_SERVICE_TOKEN')
    gemini_api_key: str = Field(default='', alias='GEMINI_API_KEY')
    gemini_model: str = Field(default='gemini-1.5-flash', alias='GEMINI_MODEL')

    geo_user_agent: str = Field(default='immocal-microlocation/1.0 (geo@immocal.local)', alias='GEO_USER_AGENT')


settings = Settings()
