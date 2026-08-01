from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = ""

    # Auth
    jwt_secret: str = "dev-insecure-change-me"
    jwt_expire_minutes: int = 60 * 24 * 7

    # URLs / CORS
    app_url: str = "http://localhost:3000"
    cors_origins: str = "*"

    # LLM
    llm_provider: str = "gemini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # Demo account
    demo_email: str = "demo@otto.app"
    demo_password: str = "demo1234"

    # Agent guardrails
    max_agent_steps: int = 12
    daily_run_limit: int = 40

    # Ops
    seed_on_start: bool = False
    environment: str = "development"

    @property
    def cors_origin_list(self) -> list[str]:
        raw = (self.cors_origins or "").strip()
        if not raw or raw == "*":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]


settings = Settings()
