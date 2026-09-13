"""
ResolveX Backend Configuration
Reads environment variables with Pydantic Settings
"""

from typing import Optional
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

def find_repo_root() -> Path:
    curr = Path(__file__).resolve()
    for parent in [curr] + list(curr.parents):
        if (parent / "AGENTS.md").exists() or (parent / "docs").exists():
            return parent
    return Path.cwd()

REPO_ROOT = find_repo_root()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    API_PORT: int = 8000
    API_HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Supabase Configuration
    SUPABASE_URL: str = "https://tqulsfsirkugmxscukyt.supabase.co"
    SUPABASE_SERVICE_ROLE_KEY: str = "sb_publishable_kthLepc2OWUBVmq1pqqaig_1ZlForMa"
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str = "sb_publishable_kthLepc2OWUBVmq1pqqaig_1ZlForMa"

    # Demo Mode & Seed Settings
    DEMO_MODE: bool = True
    DEMO_RANDOM_SEED: int = 42
    DEFAULT_TENANT_SLUG: str = "acme-commerce"
    DEFAULT_ORG_ID: str = "00000000-0000-0000-0000-000000000001"

    # AI & Knowledge Store Configuration
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.0-flash"
    CHROMA_PERSIST_DIR: str = str(REPO_ROOT / "data" / "chroma")

    FIXTURES_FILE: str = str(REPO_ROOT / "data" / "fixtures" / "acme_commerce_fixtures.json")

settings = Settings()
