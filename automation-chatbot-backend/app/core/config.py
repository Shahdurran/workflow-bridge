"""
Application configuration and settings management.

This module handles all application configuration using Pydantic settings
for type safety and validation.
"""

import os
from typing import List, Optional, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    
    This class defines all configuration options for the application,
    with automatic loading from environment variables.
    """
    
    # API Configuration
    api_title: str = Field(default="Automation Chatbot API", env="API_TITLE")
    api_description: str = Field(
        default="A FastAPI backend for workflow automation chatbot",
        env="API_DESCRIPTION"
    )
    api_version: str = Field(default="1.0.0", env="API_VERSION")
    api_v1_prefix: str = Field(default="/api", env="API_V1_PREFIX")
    
    # Server Configuration
    host: str = Field(default="0.0.0.0", env="API_HOST")
    port: int = Field(default=8000, env="API_PORT")
    debug: bool = Field(default=True, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")
    
    # CORS Configuration
    cors_origins: Union[str, List[str]] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        env="CORS_ORIGINS"
    )
    cors_allow_credentials: bool = Field(default=True, env="CORS_ALLOW_CREDENTIALS")
    cors_allow_methods: Union[str, List[str]] = Field(default=["*"], env="CORS_ALLOW_METHODS")
    cors_allow_headers: Union[str, List[str]] = Field(default=["*"], env="CORS_ALLOW_HEADERS")
    
    # Database Configuration
    supabase_url: Optional[str] = Field(default=None, env="SUPABASE_URL")
    supabase_anon_key: Optional[str] = Field(default=None, env="SUPABASE_ANON_KEY")
    supabase_service_key: Optional[str] = Field(default=None, env="SUPABASE_SERVICE_KEY")
    database_url: Optional[str] = Field(default=None, env="DATABASE_URL")
    
    @property
    def supabase_key(self) -> Optional[str]:
        """Get the Supabase key (prefer service key for backend operations)."""
        return self.supabase_service_key or self.supabase_anon_key
    
    # AI/OpenAI Configuration
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4", env="OPENAI_MODEL")
    openai_temperature: float = Field(default=0.7, env="OPENAI_TEMPERATURE")
    openai_max_tokens: int = Field(default=2000, env="OPENAI_MAX_TOKENS")
    
    # Claude AI Configuration
    anthropic_api_key: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    claude_model: str = Field(default="claude-sonnet-4-20250514", env="CLAUDE_MODEL")
    claude_max_tokens: int = Field(default=4096, env="CLAUDE_MAX_TOKENS")
    claude_temperature: float = Field(default=1.0, env="CLAUDE_TEMPERATURE")
    
    # n8n-mcp Integration
    n8n_mcp_url: str = Field(default="http://localhost:3001", env="N8N_MCP_URL")
    n8n_mcp_auth_token: Optional[str] = Field(default=None, env="N8N_MCP_AUTH_TOKEN")
    n8n_api_url: Optional[str] = Field(default=None, env="N8N_API_URL")
    n8n_api_key: Optional[str] = Field(default=None, env="N8N_API_KEY")
    
    # make-mcp Integration
    make_mcp_url: Optional[str] = Field(default="http://localhost:3002", env="MAKE_MCP_URL")
    make_mcp_auth_token: Optional[str] = Field(default=None, env="MAKE_MCP_AUTH_TOKEN")
    make_api_url: Optional[str] = Field(default=None, env="MAKE_API_URL")
    make_api_key: Optional[str] = Field(default=None, env="MAKE_API_KEY")
    
    # workflow-translator Integration
    translator_mcp_url: Optional[str] = Field(default="http://localhost:3003", env="TRANSLATOR_MCP_URL")
    
    # LangChain Configuration
    langchain_verbose: bool = Field(default=False, env="LANGCHAIN_VERBOSE")
    langchain_cache: bool = Field(default=True, env="LANGCHAIN_CACHE")
    
    # Security Configuration
    jwt_secret: Optional[str] = Field(default=None, env="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expiration_hours: int = Field(default=24, env="JWT_EXPIRATION_HOURS")
    
    # Rate Limiting
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=3600, env="RATE_LIMIT_WINDOW")  # seconds
    
    # Logging Configuration
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        env="LOG_FORMAT"
    )
    
    # Workflow Configuration
    max_workflow_nodes: int = Field(default=50, env="MAX_WORKFLOW_NODES")
    max_conversation_history: int = Field(default=100, env="MAX_CONVERSATION_HISTORY")
    workflow_timeout_seconds: int = Field(default=300, env="WORKFLOW_TIMEOUT_SECONDS")
    
    # Platform Configuration
    supported_platforms: Union[str, List[str]] = Field(
        default=["n8n", "make", "zapier"],
        env="SUPPORTED_PLATFORMS"
    )
    
    # Data Collection & Archiving Configuration
    enable_data_collection: bool = Field(default=True, env="ENABLE_DATA_COLLECTION")
    enable_data_archiving: bool = Field(default=False, env="ENABLE_DATA_ARCHIVING")
    data_retention_days: int = Field(default=30, env="DATA_RETENTION_DAYS")
    compression_threshold_kb: int = Field(default=10, env="COMPRESSION_THRESHOLD_KB")
    
    # S3/R2 Configuration for data archiving
    s3_endpoint: Optional[str] = Field(default=None, env="S3_ENDPOINT")
    s3_access_key: Optional[str] = Field(default=None, env="S3_ACCESS_KEY")
    s3_secret_key: Optional[str] = Field(default=None, env="S3_SECRET_KEY")
    s3_bucket_name: str = Field(default="workflowbridge-training-data", env="S3_BUCKET_NAME")
    s3_region: str = Field(default="auto", env="S3_REGION")
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v) -> List[str]:
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v if isinstance(v, list) else [v] if v else []
    
    @field_validator("cors_allow_methods", mode="before")
    @classmethod
    def parse_cors_methods(cls, v) -> List[str]:
        """Parse CORS methods from string or list."""
        if isinstance(v, str):
            return [method.strip() for method in v.split(",") if method.strip()]
        return v if isinstance(v, list) else [v] if v else []
    
    @field_validator("cors_allow_headers", mode="before")
    @classmethod
    def parse_cors_headers(cls, v) -> List[str]:
        """Parse CORS headers from string or list."""
        if isinstance(v, str):
            return [header.strip() for header in v.split(",") if header.strip()]
        return v if isinstance(v, list) else [v] if v else []
    
    @field_validator("supported_platforms", mode="before")
    @classmethod
    def parse_supported_platforms(cls, v) -> List[str]:
        """Parse supported platforms from string or list."""
        if isinstance(v, str):
            return [platform.strip() for platform in v.split(",") if platform.strip()]
        return v if isinstance(v, list) else [v] if v else []
    
    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v):
        """Validate environment value."""
        allowed_environments = ["development", "staging", "production", "testing"]
        if v not in allowed_environments:
            raise ValueError(f"Environment must be one of: {allowed_environments}")
        return v
    
    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v):
        """Validate log level."""
        allowed_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in allowed_levels:
            raise ValueError(f"Log level must be one of: {allowed_levels}")
        return v.upper()
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment == "production"
    
    @property
    def is_testing(self) -> bool:
        """Check if running in testing mode."""
        return self.environment == "testing"
    
    @property
    def database_configured(self) -> bool:
        """Check if database is configured."""
        return bool(self.supabase_url and self.supabase_anon_key) or bool(self.database_url)
    
    @property
    def openai_configured(self) -> bool:
        """Check if OpenAI is configured."""
        return bool(self.openai_api_key)
    
    @property
    def claude_configured(self) -> bool:
        """Check if Claude AI is configured."""
        return bool(self.anthropic_api_key)
    
    @property
    def n8n_configured(self) -> bool:
        """Check if n8n is configured."""
        return bool(self.n8n_api_url and self.n8n_api_key)
    
    @property
    def auth_configured(self) -> bool:
        """Check if authentication is configured."""
        return bool(self.jwt_secret)
    
    @property
    def s3_configured(self) -> bool:
        """Check if S3/R2 storage is configured."""
        return bool(self.s3_endpoint and self.s3_access_key and self.s3_secret_key)
    
    @property
    def archiving_enabled(self) -> bool:
        """Check if data archiving is enabled and configured."""
        return self.enable_data_archiving and self.s3_configured
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore"
    }


@lru_cache()
def get_settings() -> Settings:
    """
    Get application settings with caching.
    
    This function returns a cached instance of the settings to avoid
    re-reading environment variables on every call.
    
    Returns:
        Settings: Application settings instance
    """
    return Settings()


# Global settings instance
settings = get_settings()


def get_database_url() -> Optional[str]:
    """
    Get the appropriate database URL.
    
    Returns:
        Optional[str]: Database URL or None if not configured
    """
    if settings.supabase_url:
        return settings.supabase_url
    return settings.database_url


def get_cors_config() -> dict:
    """
    Get CORS configuration for FastAPI.
    
    Returns:
        dict: CORS configuration dictionary
    """
    return {
        "allow_origins": settings.cors_origins,
        "allow_credentials": settings.cors_allow_credentials,
        "allow_methods": settings.cors_allow_methods,
        "allow_headers": settings.cors_allow_headers,
    }


def get_openai_config() -> dict:
    """
    Get OpenAI configuration.
    
    Returns:
        dict: OpenAI configuration dictionary
    """
    return {
        "api_key": settings.openai_api_key,
        "model": settings.openai_model,
        "temperature": settings.openai_temperature,
        "max_tokens": settings.openai_max_tokens,
    }


def get_claude_config() -> dict:
    """
    Get Claude AI configuration.
    
    Returns:
        dict: Claude configuration dictionary
    """
    return {
        "api_key": settings.anthropic_api_key,
        "model": settings.claude_model,
        "max_tokens": settings.claude_max_tokens,
        "temperature": settings.claude_temperature,
    }


def get_n8n_config() -> dict:
    """
    Get n8n configuration.
    
    Returns:
        dict: n8n configuration dictionary
    """
    return {
        "mcp_url": settings.n8n_mcp_url,
        "api_url": settings.n8n_api_url,
        "api_key": settings.n8n_api_key,
    }


def validate_required_settings():
    """
    Validate that all required settings are configured.
    
    Raises:
        ValueError: If required settings are missing
    """
    errors = []
    
    # Check database configuration
    if not settings.database_configured:
        errors.append("Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY or DATABASE_URL")
    
    # Check OpenAI configuration for production
    if settings.is_production and not settings.openai_configured:
        errors.append("OpenAI not configured. Set OPENAI_API_KEY for production")
    
    # Check JWT secret for production
    if settings.is_production and not settings.auth_configured:
        errors.append("Authentication not configured. Set JWT_SECRET for production")
    
    if errors:
        raise ValueError("Configuration errors:\n" + "\n".join(f"- {error}" for error in errors))
