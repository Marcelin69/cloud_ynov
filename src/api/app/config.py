from pydantic_settings import BaseSettings,SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    cosmos_endpoint: str
    cosmos_key: str
    cosmos_database: str = "db-dev"
    cosmos_container: str = "jobs"
    blob_connection_string: str
    blob_container_name: str
    

settings = Settings()

print(settings.cosmos_endpoint)
print(settings.cosmos_key)
print(settings.blob_connection_string)
print(settings.blob_container_name)
print(settings.cosmos_database)
print(settings.cosmos_container)
